import json
import shutil
from pathlib import Path
from uuid import uuid4, UUID

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.services.player_tracker import track_players
from app.services.video_analyzer import analyze_video

router = APIRouter(prefix="/videos", tags=["Videos"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


def _validate_id(video_id: str) -> None:
    try:
        UUID(video_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid video ID")


def _parse_selection(raw: str | None) -> dict | None:
    if not raw:
        return None
    try:
        data = json.loads(raw)
        selection = {
            "x": float(data["x"]),
            "y": float(data["y"]),
            "timestamp": float(data["timestamp"]),
        }
    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=422,
            detail="selection must be JSON with numeric x, y, timestamp",
        )
    if not (0 <= selection["x"] <= 1 and 0 <= selection["y"] <= 1):
        raise HTTPException(
            status_code=422,
            detail="selection x and y must be normalized between 0 and 1",
        )
    if selection["timestamp"] < 0:
        raise HTTPException(status_code=422, detail="Invalid timestamp")
    return selection


@router.post("/analyze")
def upload_and_analyze(
    file: UploadFile = File(...),
    selection: str | None = Form(None),
    skip_detection: bool = Form(False),
):
    if not file.filename or not file.filename.lower().endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Only MP4 files are supported")

    parsed_selection = _parse_selection(selection)

    video_id = str(uuid4())
    input_path = UPLOAD_DIR / f"{video_id}_input.mp4"
    output_path = UPLOAD_DIR / f"{video_id}_output.mp4"

    with input_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if parsed_selection:
        selection_path = UPLOAD_DIR / f"{video_id}_selection.json"
        selection_path.write_text(json.dumps(parsed_selection), encoding="utf-8")

    # The React tracking viewer draws YOLO/ByteTrack boxes directly. Avoid
    # running another YOLO model across every frame before tracking begins.
    # Legacy callers can omit skip_detection to retain annotated MP4 output.
    if skip_detection:
        return {
            "video_id": video_id,
            "status": "uploaded",
            "frames_processed": 0,
            "fps": None,
            "annotated_video_url": None,
            "has_selection": parsed_selection is not None,
        }

    try:
        result = analyze_video(str(input_path), str(output_path))
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return {
        "video_id": video_id,
        "status": "completed",
        "frames_processed": result["frames_processed"],
        "fps": result["fps"],
        "annotated_video_url": f"/videos/{video_id}/output",
        "has_selection": parsed_selection is not None,
    }


@router.get("/{video_id}/output")
def get_annotated_video(video_id: str):
    _validate_id(video_id)
    output_path = UPLOAD_DIR / f"{video_id}_output.mp4"
    if not output_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(output_path, media_type="video/mp4")


@router.post("/{video_id}/track")
def track_video(video_id: str):
    _validate_id(video_id)
    input_path = UPLOAD_DIR / f"{video_id}_input.mp4"
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="Original video not found")

    selection = None
    selection_path = UPLOAD_DIR / f"{video_id}_selection.json"
    if selection_path.exists():
        selection = json.loads(selection_path.read_text(encoding="utf-8"))

    try:
        result = track_players(str(input_path), selection)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    tracking_path = UPLOAD_DIR / f"{video_id}_tracking.json"
    with tracking_path.open("w", encoding="utf-8") as f:
        json.dump(result, f)

    return {
        "video_id": video_id,
        "status": "completed",
        "total_frames": result["total_frames"],
        "target_found": result["target_track_id"] is not None,
        "target_track_id": result["target_track_id"],
        "target_frames": len(result["target_track"]),
        "tracking_url": f"/videos/{video_id}/tracking",
    }


@router.get("/{video_id}/tracking")
def get_tracking(video_id: str):
    _validate_id(video_id)
    tracking_path = UPLOAD_DIR / f"{video_id}_tracking.json"
    if not tracking_path.exists():
        raise HTTPException(status_code=404, detail="Tracking data not found")
    with tracking_path.open("r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/{video_id}/input")
def get_original_video(video_id: str):
    _validate_id(video_id)
    input_path = UPLOAD_DIR / f"{video_id}_input.mp4"
    if not input_path.is_file():
        raise HTTPException(status_code=404, detail="Original video not found")
    return FileResponse(
        input_path,
        media_type="video/mp4",
        filename=f"{video_id}.mp4",
        content_disposition_type="inline",
    )
