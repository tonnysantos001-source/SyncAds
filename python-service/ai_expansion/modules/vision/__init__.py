"""
AI Expansion - Computer Vision Module
Visual element detection, OCR, and image analysis
Maintains 100% compatibility with existing system - ADDON ONLY
"""

from .vision_analyzer import (
    DetectedButton,
    DetectedText,
    VisionAnalysisResult,
    VisionAnalyzer,
)

__all__ = [
    "VisionAnalyzer",
    "VisionAnalysisResult",
    "DetectedButton",
    "DetectedText",
]

__version__ = "1.0.0"
