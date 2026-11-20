"""
OOH Audience Verification System
BUILD 2: YOLO Person Detection Entry Point
"""

import sys
import argparse
from app.detector import PersonDetector


def parse_args():
    parser = argparse.ArgumentParser(description="OOH Audience Verification - BUILD 2 YOLO Person Detection")
    parser.add_argument(
        "--input", "-i",
        type=str,
        default="data/videos/ooh_test.mp4",
        help="Path to input video file (default: data/videos/ooh_test.mp4)"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default="outputs/yolo_detection.mp4",
        help="Path to output video file (default: outputs/yolo_detection.mp4)"
    )
    parser.add_argument(
        "--model", "-m",
        type=str,
        default="yolov8n.pt",
        help="YOLO model path/weights (default: yolov8n.pt)"
    )
    parser.add_argument(
        "--conf", "-c",
        type=float,
        default=0.25,
        help="Confidence threshold for person detection (default: 0.25)"
    )
    return parser.parse_args()


def main():
    args = parse_args()

    print("=" * 60)
    print("  OOH Audience Verification System")
    print("  BUILD 3 · Tracking + Exposure Engine")
    print("=" * 60)
    print(f"  Input Video  : {args.input}")
    print(f"  Output Video : {args.output}")
    print(f"  Model        : {args.model}")
    print(f"  Conf Thresh  : {args.conf}")
    print("-" * 60)

    try:
        detector = PersonDetector(model_name=args.model, conf_thresh=args.conf)
        stats = detector.process_video(input_path=args.input, output_path=args.output)

        print("-" * 60)
        print("  ✅  BUILD 3 Processing Completed Successfully")
        print(f"      Total Frames Processed : {stats['total_frames']}")
        print(f"      Total Tracked IDs      : {stats['total_tracked_ids']}")
        print(f"      Total Exposure Events  : {stats['total_exposures']}")
        print(f"      Output Video Saved To  : {stats['output_path']}")
        print("=" * 60)

    except Exception as e:
        print(f"\n  ❌ ERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
