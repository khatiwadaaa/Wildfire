import cv2
from ultralytics import YOLO

MODEL_NAME = "yolo11s.pt"  # nano is weak on small players; try yolo11m.pt if CPU allows


def _center(b):
    return (b[0] + b[2] / 2, b[1] + b[3] / 2)


def _contains(b, x, y):
    return b[0] <= x <= b[0] + b[2] and b[1] <= y <= b[1] + b[3]


def _dist(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5


def _pick_target(frames, selection, fps):
    """Find the track_id of the player the user clicked."""
    sx, sy = selection["x"], selection["y"]  # normalized 0-1 on the video frame
    target_frame = int(round(selection["timestamp"] * fps))

    best = None  # (score, track_id)
    for f in frames:
        if abs(f["frame"] - target_frame) > 5:
            continue
        for p in f["players"]:
            b = p["bbox"]
            d = _dist(_center(b), (sx, sy))
            inside = _contains(b, sx, sy)
            score = (0 if inside else 1, d + abs(f["frame"] - target_frame) * 0.001)
            if best is None or score < best[0]:
                best = (score, p["track_id"], f["frame"])
    return best[1] if best else None, target_frame


def _follow_target(frames, target_id, start_frame, max_jump=0.15):
    """Build the target's path; re-acquire by proximity if the ID switches."""
    timeline = {}
    # Seed with last known position near the start frame
    last = None
    for f in frames:
        if f["frame"] < start_frame - 5:
            continue
        for p in f["players"]:
            if p["track_id"] == target_id:
                last = _center(p["bbox"])
                break
        if last:
            break

    for direction in (1, -1):
        seq = [f for f in frames if (f["frame"] >= start_frame if direction == 1 else f["frame"] < start_frame)]
        if direction == -1:
            seq = list(reversed(seq))
        pos = last
        for f in seq:
            match = next((p for p in f["players"] if p["track_id"] == target_id), None)
            reacquired = False
            if match is None and pos is not None and f["players"]:
                cand = min(f["players"], key=lambda p: _dist(_center(p["bbox"]), pos))
                if _dist(_center(cand["bbox"]), pos) <= max_jump:
                    match, reacquired = cand, True
            if match:
                pos = _center(match["bbox"])
                timeline[f["frame"]] = {
                    "frame": f["frame"],
                    "timestamp": f["timestamp"],
                    "bbox": match["bbox"],
                    "confidence": match["confidence"],
                    "track_id": match["track_id"],
                    "reacquired": reacquired,
                }
    return [timeline[k] for k in sorted(timeline)]


def track_players(video_path: str, selection: dict | None = None):
    # Fresh model per call so tracker state never leaks between videos.
    model = YOLO(MODEL_NAME)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if width <= 0 or height <= 0:
        cap.release()
        raise ValueError("Invalid video dimensions")

    tracking_data = []
    frame_number = 0

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            results = model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                classes=[0],
                conf=0.10,   # low so ByteTrack's second-pass association works
                iou=0.60,
                imgsz=960,
                device="cpu",
                verbose=False,
            )

            frame_players = []
            boxes = results[0].boxes
            if boxes is not None and boxes.id is not None:
                for box in boxes:
                    if box.id is None:
                        continue
                    conf = float(box.conf.item())
                    if conf < 0.25:  # drop weak detections from output only
                        continue
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    frame_players.append({
                        "track_id": int(box.id.item()),
                        "confidence": round(conf, 3),
                        # normalized [x, y, w, h]
                        "bbox": [
                            round(x1 / width, 4),
                            round(y1 / height, 4),
                            round((x2 - x1) / width, 4),
                            round((y2 - y1) / height, 4),
                        ],
                    })

            tracking_data.append({
                "frame": frame_number,
                "timestamp": round(frame_number / fps, 3),
                "players": frame_players,
            })
            frame_number += 1
    finally:
        cap.release()

    result = {
        "fps": fps,
        "width": width,
        "height": height,
        "total_frames": frame_number,
        "frames": tracking_data,
        "target_track_id": None,
        "target_track": [],
    }

    target_id, start_frame = None, 0
    if selection:
        # Player the user clicked (needs the router to pass the selection in)
        target_id, start_frame = _pick_target(tracking_data, selection, fps)
        result["target_selected_by"] = "click"
    if target_id is None:
        # Fallback: follow the person who appears in the most frames
        counts = {}
        first_seen = {}
        for f in tracking_data:
            for p in f["players"]:
                tid = p["track_id"]
                counts[tid] = counts.get(tid, 0) + 1
                first_seen.setdefault(tid, f["frame"])
        if counts:
            target_id = max(counts, key=counts.get)
            start_frame = first_seen[target_id]
            result["target_selected_by"] = "auto"

    result["target_track_id"] = target_id
    if target_id is not None:
        result["target_track"] = _follow_target(tracking_data, target_id, start_frame)

    return result
