"""
OOH Audience Verification System
BUILD 3: Tracking and Exposure Engine Module (Ultralytics ByteTrack)
"""

import numpy as np
import supervision as sv
from typing import Dict, List, Optional

class ExposureEngine:
    """
    Handles object tracking and calculates audience exposure based on ROI and dwell time.
    """

    def __init__(self, fps: float, roi_polygon: np.ndarray, dwell_threshold: float = 2.0):
        """
        Initialize the engine.
        
        Args:
            fps: Frames per second of the video.
            roi_polygon: Numpy array of points defining the ROI (viewing zone).
            dwell_threshold: Minimum seconds inside ROI to count as an exposure event.
        """
        self.fps = fps
        self.dwell_threshold = dwell_threshold
        
        # ROI zone and annotator
        self.roi_polygon = roi_polygon
        self.polygon_zone = sv.PolygonZone(polygon=roi_polygon)
        self.zone_annotator = sv.PolygonZoneAnnotator(
            zone=self.polygon_zone, 
            color=sv.Color.YELLOW,
            thickness=4,
            text_thickness=2,
            text_scale=1.0
        )
        
        # Tracking state
        # tracking_id -> { "entry_frame": int, "frames_in_roi": int, "exposed": bool }
        self.tracking_data = {}
        self.exposure_events = []

    def update(self, detections: sv.Detections, frame_idx: int) -> sv.Detections:
        """
        Update tracking and process ROI/exposure logic for a single frame.
        """
        # 1. Check ROI trigger
        is_inside = self.polygon_zone.trigger(detections=detections)
        
        # 2. Process each detection
        if detections.tracker_id is not None:
            for i, track_id in enumerate(detections.tracker_id):
                in_roi = is_inside[i]
                
                if track_id not in self.tracking_data:
                    self.tracking_data[track_id] = {
                        "entry_frame": frame_idx if in_roi else None,
                        "frames_in_roi": 0,
                        "exposed": False
                    }
                
                if in_roi:
                    if self.tracking_data[track_id]["entry_frame"] is None:
                        self.tracking_data[track_id]["entry_frame"] = frame_idx
                    
                    self.tracking_data[track_id]["frames_in_roi"] += 1
                    
                    # Calculate dwell time
                    dwell_seconds = self.tracking_data[track_id]["frames_in_roi"] / self.fps
                    
                    # Check for exposure event
                    if not self.tracking_data[track_id]["exposed"] and dwell_seconds >= self.dwell_threshold:
                        self.tracking_data[track_id]["exposed"] = True
                        event = {
                            "tracking_id": int(track_id),
                            "entry_time": self.tracking_data[track_id]["entry_frame"] / self.fps,
                            "dwell_seconds": dwell_seconds,
                            "exposure": True
                        }
                        self.exposure_events.append(event)
        
        return detections

    def get_stats(self) -> dict:
        """Return summary of tracking and exposure."""
        return {
            "total_tracked_ids": len(self.tracking_data),
            "total_exposures": len(self.exposure_events),
            "exposure_events": self.exposure_events
        }
