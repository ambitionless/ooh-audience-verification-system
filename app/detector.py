"""
OOH Audience Verification System
BUILD 2: YOLO Person Detection Module
"""

import os
import sys
import logging
from typing import Optional, Tuple, List
import cv2
import numpy as np
from ultralytics import YOLO
import supervision as sv
from app.engine import ExposureEngine

# Configure logging
logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


class PersonDetector:
    """
    YOLO-based person detector for processing video streams/files.
    Only detects the 'person' class (COCO class ID 0).
    """

    def __init__(self, model_name: str = "yolov8n.pt", conf_thresh: float = 0.25):
        """
        Initialize the YOLO model and confidence threshold.
        """
        self.model_name = model_name
        self.conf_thresh = conf_thresh
        self.model = None
        self.person_class_id = 0  # COCO class 0 is 'person'
        self._load_model()
        
        # Supervision annotators
        self.box_annotator = sv.BoxAnnotator()
        self.label_annotator = sv.LabelAnnotator()

    def _load_model(self) -> None:
        """Load the Ultralytics YOLO model with error handling."""
        try:
            logger.info(f"Loading YOLO model: {self.model_name}...")
            self.model = YOLO(self.model_name)
            logger.info("YOLO model loaded successfully.")
        except Exception as e:
            raise RuntimeError(f"Failed to load YOLO model '{self.model_name}': {e}") from e

    def process_video(self, input_path: str, output_path: str, roi_points: Optional[List[List[int]]] = None, dwell_threshold: float = 2.0) -> dict:
        """
        Process a video file frame-by-frame, detect persons, track them,
        check for ROI exposure, and save the result.
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input video file not found: {input_path}")

        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video file: {input_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if fps <= 0 or width <= 0 or height <= 0:
            cap.release()
            raise ValueError(f"Corrupt or invalid video metadata in file: {input_path}")

        # Default ROI if none provided: center square (30% to 70% of screen)
        if roi_points is None:
            roi_points = [
                [int(width * 0.3), int(height * 0.3)],
                [int(width * 0.7), int(height * 0.3)],
                [int(width * 0.7), int(height * 0.7)],
                [int(width * 0.3), int(height * 0.7)]
            ]
        
        scaled_points = []
        for pt in roi_points:
            x, y = float(pt[0]), float(pt[1])
            if 0.0 <= x <= 1.0 and 0.0 <= y <= 1.0:
                scaled_points.append([int(x * width), int(y * height)])
            else:
                scaled_points.append([int(x), int(y)])

        roi_polygon = np.array(scaled_points, dtype=np.int32)
        engine = ExposureEngine(fps=fps, roi_polygon=roi_polygon, dwell_threshold=dwell_threshold)

        # Ensure output directory exists
        out_dir = os.path.dirname(output_path)
        if out_dir:
            os.makedirs(out_dir, exist_ok=True)

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        if not out.isOpened():
            cap.release()
            raise RuntimeError(f"Failed to initialize VideoWriter for output path: {output_path}")

        logger.info(f"Starting video processing with Tracking + Exposure...")
        logger.info(f"Input: {input_path} ({width}x{height} @ {fps:.2f} FPS)")
        logger.info(f"Output target: {output_path}")

        processed_frames = 0
        total_detections = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # 1. Detect & Track with ByteTrack
                results = self.model.track(
                    frame,
                    classes=[self.person_class_id],
                    conf=self.conf_thresh,
                    persist=True,
                    tracker="bytetrack.yaml",
                    verbose=False
                )[0]

                detections = sv.Detections.from_ultralytics(results)
                total_detections += len(detections)

                # 2. Track & Exposure Logic
                detections = engine.update(detections, processed_frames)

                # 3. Annotate
                # Draw ROI
                frame = engine.zone_annotator.annotate(scene=frame)
                
                # Draw Boxes & IDs
                if len(detections) > 0:
                    labels = [
                        f"#{track_id} {conf:.2f}"
                        for track_id, conf in zip(detections.tracker_id, detections.confidence)
                    ] if detections.tracker_id is not None else []
                    
                    frame = self.box_annotator.annotate(scene=frame, detections=detections)
                    frame = self.label_annotator.annotate(scene=frame, detections=detections, labels=labels)

                # Overlay Exposure Count
                stats = engine.get_stats()
                cv2.putText(
                    frame,
                    f"Exposures: {stats['total_exposures']} | Tracked: {stats['total_tracked_ids']}",
                    (50, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    2,
                    (0, 255, 255),
                    4,
                    cv2.LINE_AA
                )

                out.write(frame)
                processed_frames += 1

                if processed_frames % 50 == 0 or processed_frames == total_frames:
                    progress = (processed_frames / total_frames * 100) if total_frames > 0 else 0
                    logger.info(f"Progress: {processed_frames}/{total_frames} frames ({progress:.1f}%) - Exposures: {stats['total_exposures']}")

        finally:
            cap.release()
            out.release()

        # Verification
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError(f"Output video file is missing or empty: {output_path}")

        engine_stats = engine.get_stats()
        
        return {
            "input_path": input_path,
            "output_path": output_path,
            "total_frames": processed_frames,
            "total_detections": total_detections,
            "total_tracked_ids": engine_stats["total_tracked_ids"],
            "total_exposures": engine_stats["total_exposures"],
            "exposure_events": engine_stats["exposure_events"],
            "fps": fps,
            "resolution": (width, height)
        }
