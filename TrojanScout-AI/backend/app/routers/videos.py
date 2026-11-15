import json
from app.services.player_tracker import track_players
from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse

from app.services.video_analyzer import analyze_video

router = APIRouter(prefix="/videos", tags=["Videos"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/analyze")
def upload_and_analyze(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".mp4"):
        raise HTTPException(
            status_code=400,
            detail="Only MP4 files are supported",
        )

    video_id = str(uuid4())

    input_path = UPLOAD_DIR / f"{video_id}_input.mp4"
    output_path = UPLOAD_DIR / f"{video_id}_output.mp4"

    with input_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = analyze_video(
            str(input_path),
            str(output_path),
        )
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return {
        "video_id": video_id,
        "status": "completed",
        "frames_processed": result["frames_processed"],
        "fps": result["fps"],
        "annotated_video_url": f"/videos/{video_id}/output",
    }


@router.get("/{video_id}/output")
def get_annotated_video(video_id: str):
    output_path = UPLOAD_DIR / f"{video_id}_output.mp4"

    if not output_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Video not found",
        )

    return FileResponse(
        output_path,
        media_type="video/mp4",
    )

@router.post("/{video_id}/track")
def track_video(video_id: str):
    input_path = UPLOAD_DIR / f"{video_id}_input.mp4"

    if not input_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Original video not found",
        )

    try:
        result = track_players(str(input_path))
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    tracking_path = UPLOAD_DIR / f"{video_id}_tracking.json"

    with tracking_path.open("w", encoding="utf-8") as f:
        json.dump(result, f)

    return {
        "video_id": video_id,
        "status": "completed",
        "total_frames": result["total_frames"],
        "tracking_url": f"/videos/{video_id}/tracking",
    }


@router.get("/{video_id}/tracking")
def get_tracking(video_id: str):
    tracking_path = UPLOAD_DIR / f"{video_id}_tracking.json"

    if not tracking_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Tracking data not found",
        )

    with tracking_path.open("r", encoding="utf-8") as f:
        return json.load(f)
