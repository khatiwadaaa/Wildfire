
from pathlib import Path

import cv2
from ultralytics import YOLO

# Pretrained lightweight object detection model
model = YOLO("yolo11n.pt")


def analyze_video(input_path: str, output_path: str):
    cap = cv2.VideoCapture(input_path)

    if not cap.isOpened():
        raise ValueError("Unable to open video")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    Path(output_path).parent.mkdir(
        parents=True, exist_ok=True
    )

    writer = cv2.VideoWriter(
        output_path,
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )

    if not writer.isOpened():
        cap.release()
        raise RuntimeError("Unable to create output video")

    frames_processed = 0

    try:
        while True:
            success, frame = cap.read()

            if not success:
                break

            # COCO class 0 = person
            results = model.predict(
                frame,
                classes=[0],
                conf=0.35,
                verbose=False,
            )

            annotated = results[0].plot()
            writer.write(annotated)

            frames_processed += 1

    finally:
        cap.release()
        writer.release()

    return {
        "frames_processed": frames_processed,
        "fps": fps,
        "output_path": output_path,
    }
