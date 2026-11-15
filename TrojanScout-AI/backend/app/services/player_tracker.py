
import cv2
from ultralytics import YOLO

model = YOLO("yolo11n.pt")


def track_players(video_path: str):
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
                conf=0.25,
                imgsz=416,
                device="cpu",
                verbose=False,
            )

            frame_players = []

            boxes = results[0].boxes

            if boxes is not None and boxes.id is not None:
                for box in boxes:
                    if box.id is None:
                        continue

                    track_id = int(box.id.item())
                    confidence = float(box.conf.item())

                    x1, y1, x2, y2 = box.xyxy[0].tolist()

                    frame_players.append({
                        "track_id": track_id,
                        "confidence": round(confidence, 3),
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

    return {
        "fps": fps,
        "width": width,
        "height": height,
        "total_frames": frame_number,
        "frames": tracking_data,
    }
