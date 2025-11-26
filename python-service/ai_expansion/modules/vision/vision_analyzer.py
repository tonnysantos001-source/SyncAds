"""
Vision Analyzer - Computer vision and OCR for visual element detection
Supports OpenCV, Tesseract OCR, EasyOCR for when DOM is not enough
100% ADDON - Does not modify existing functionality
"""

import base64
import io
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from loguru import logger

try:
    import cv2
    import numpy as np
    from PIL import Image

    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not available - install with: pip install opencv-python")

try:
    import pytesseract

    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("Tesseract not available - install with: pip install pytesseract")

try:
    import easyocr

    EASYOCR_AVAILABLE = False  # Expensive to load, so keep optional
except ImportError:
    EASYOCR_AVAILABLE = False


@dataclass
class DetectedButton:
    """Represents a detected button"""

    location: Tuple[int, int, int, int]  # x, y, width, height
    confidence: float
    text: Optional[str] = None
    center: Optional[Tuple[int, int]] = None

    def __post_init__(self):
        if self.center is None:
            x, y, w, h = self.location
            self.center = (x + w // 2, y + h // 2)


@dataclass
class DetectedText:
    """Represents detected text"""

    text: str
    location: Tuple[int, int, int, int]
    confidence: float


@dataclass
class VisionAnalysisResult:
    """Result of vision analysis"""

    success: bool
    buttons_detected: List[DetectedButton] = None
    text_extracted: Optional[str] = None
    text_regions: List[DetectedText] = None
    popups_detected: List[Dict[str, Any]] = None
    target_location: Optional[Tuple[int, int]] = None
    error: Optional[str] = None

    def __post_init__(self):
        if self.buttons_detected is None:
            self.buttons_detected = []
        if self.text_regions is None:
            self.text_regions = []
        if self.popups_detected is None:
            self.popups_detected = []


class VisionAnalyzer:
    """
    Computer vision analyzer for visual element detection
    Uses OpenCV for detection and Tesseract/EasyOCR for text extraction
    """

    def __init__(self, use_easyocr: bool = False):
        """
        Initialize vision analyzer

        Args:
            use_easyocr: Use EasyOCR instead of Tesseract (more accurate but slower)
        """
        if not CV2_AVAILABLE:
            raise RuntimeError("OpenCV is not installed")

        self.use_easyocr = use_easyocr
        self.easyocr_reader = None

        if use_easyocr and EASYOCR_AVAILABLE:
            logger.info("Initializing EasyOCR (this may take a moment)...")
            self.easyocr_reader = easyocr.Reader(["en", "pt"])
            logger.success("EasyOCR initialized")

        logger.info("VisionAnalyzer initialized")

    def _base64_to_image(self, base64_string: str) -> np.ndarray:
        """
        Convert base64 string to OpenCV image

        Args:
            base64_string: Base64 encoded image

        Returns:
            OpenCV image (numpy array)
        """
        try:
            # Decode base64
            image_data = base64.b64decode(base64_string)

            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(image_data))

            # Convert to OpenCV format (BGR)
            image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

            return image
        except Exception as e:
            logger.error(f"Failed to decode image: {e}")
            raise

    def _image_to_base64(self, image: np.ndarray) -> str:
        """Convert OpenCV image to base64 string"""
        try:
            # Convert to PIL Image
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

            # Convert to base64
            buffer = io.BytesIO()
            pil_image.save(buffer, format="PNG")
            base64_string = base64.b64encode(buffer.getvalue()).decode("utf-8")

            return base64_string
        except Exception as e:
            logger.error(f"Failed to encode image: {e}")
            raise

    async def detect_buttons(
        self, image: np.ndarray, min_confidence: float = 0.5
    ) -> List[DetectedButton]:
        """
        Detect button-like elements in image

        Args:
            image: OpenCV image
            min_confidence: Minimum confidence threshold

        Returns:
            List of detected buttons
        """
        buttons = []

        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Apply edge detection
            edges = cv2.Canny(gray, 50, 150)

            # Find contours
            contours, _ = cv2.findContours(
                edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            # Filter contours that look like buttons
            for contour in contours:
                # Get bounding rectangle
                x, y, w, h = cv2.boundingRect(contour)

                # Filter by size (buttons are typically medium-sized)
                if w < 30 or h < 20 or w > 400 or h > 200:
                    continue

                # Aspect ratio check (buttons are typically wider than tall)
                aspect_ratio = w / h
                if aspect_ratio < 0.5 or aspect_ratio > 10:
                    continue

                # Calculate confidence based on rectangularity
                area = cv2.contourArea(contour)
                rect_area = w * h
                confidence = area / rect_area if rect_area > 0 else 0

                if confidence >= min_confidence:
                    # Try to extract text from button
                    button_region = image[y : y + h, x : x + w]
                    text = await self._extract_text_from_region(button_region)

                    buttons.append(
                        DetectedButton(
                            location=(x, y, w, h), confidence=confidence, text=text
                        )
                    )

            logger.info(f"Detected {len(buttons)} buttons")
            return buttons

        except Exception as e:
            logger.error(f"Button detection failed: {e}")
            return []

    async def _extract_text_from_region(self, region: np.ndarray) -> Optional[str]:
        """Extract text from image region"""
        try:
            if self.use_easyocr and self.easyocr_reader:
                # Use EasyOCR
                results = self.easyocr_reader.readtext(region)
                if results:
                    return " ".join([result[1] for result in results])
            elif TESSERACT_AVAILABLE:
                # Use Tesseract
                pil_image = Image.fromarray(cv2.cvtColor(region, cv2.COLOR_BGR2RGB))
                text = pytesseract.image_to_string(pil_image).strip()
                return text if text else None

            return None
        except Exception as e:
            logger.debug(f"Text extraction failed: {e}")
            return None

    async def extract_text(self, image: np.ndarray) -> str:
        """
        Extract all text from image

        Args:
            image: OpenCV image

        Returns:
            Extracted text
        """
        try:
            if self.use_easyocr and self.easyocr_reader:
                # Use EasyOCR
                results = self.easyocr_reader.readtext(image)
                text = "\n".join([result[1] for result in results])
            elif TESSERACT_AVAILABLE:
                # Use Tesseract
                pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
                text = pytesseract.image_to_string(pil_image)
            else:
                logger.warning("No OCR engine available")
                return ""

            logger.info(f"Extracted {len(text)} characters")
            return text.strip()

        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            return ""

    async def extract_text_regions(self, image: np.ndarray) -> List[DetectedText]:
        """
        Extract text with location information

        Args:
            image: OpenCV image

        Returns:
            List of detected text regions
        """
        text_regions = []

        try:
            if self.use_easyocr and self.easyocr_reader:
                # EasyOCR returns bounding boxes
                results = self.easyocr_reader.readtext(image)

                for bbox, text, confidence in results:
                    # Convert bbox to x, y, w, h
                    points = np.array(bbox, dtype=np.int32)
                    x = int(np.min(points[:, 0]))
                    y = int(np.min(points[:, 1]))
                    w = int(np.max(points[:, 0]) - x)
                    h = int(np.max(points[:, 1]) - y)

                    text_regions.append(
                        DetectedText(
                            text=text, location=(x, y, w, h), confidence=confidence
                        )
                    )

            elif TESSERACT_AVAILABLE:
                # Tesseract can also return bounding boxes
                pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
                data = pytesseract.image_to_data(
                    pil_image, output_type=pytesseract.Output.DICT
                )

                for i in range(len(data["text"])):
                    text = data["text"][i].strip()
                    if text:
                        x = data["left"][i]
                        y = data["top"][i]
                        w = data["width"][i]
                        h = data["height"][i]
                        confidence = float(data["conf"][i]) / 100

                        if confidence > 0.5:
                            text_regions.append(
                                DetectedText(
                                    text=text,
                                    location=(x, y, w, h),
                                    confidence=confidence,
                                )
                            )

            logger.info(f"Found {len(text_regions)} text regions")
            return text_regions

        except Exception as e:
            logger.error(f"Text region extraction failed: {e}")
            return []

    async def detect_popups(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect popup-like elements (overlays, modals, notifications)

        Args:
            image: OpenCV image

        Returns:
            List of detected popups
        """
        popups = []

        try:
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Apply threshold
            _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)

            # Find contours
            contours, _ = cv2.findContours(
                thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            # Look for large rectangular regions (likely popups)
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)

                # Popups are typically large and centered
                if w > 200 and h > 100:
                    # Calculate position relative to image center
                    img_h, img_w = image.shape[:2]
                    center_x = x + w // 2
                    center_y = y + h // 2

                    # Check if near center
                    is_centered = (
                        abs(center_x - img_w // 2) < img_w // 4
                        and abs(center_y - img_h // 2) < img_h // 4
                    )

                    popups.append(
                        {
                            "location": (x, y, w, h),
                            "centered": is_centered,
                            "size": w * h,
                        }
                    )

            logger.info(f"Detected {len(popups)} potential popups")
            return popups

        except Exception as e:
            logger.error(f"Popup detection failed: {e}")
            return []

    async def find_element_by_description(
        self, image: np.ndarray, description: str
    ) -> Optional[Tuple[int, int]]:
        """
        Find element by natural language description

        Args:
            image: OpenCV image
            description: Element description (e.g., "blue submit button")

        Returns:
            (x, y) coordinates of element center, or None
        """
        try:
            # For now, use simple keyword matching
            # TODO: Could use CLIP or similar vision-language model

            # Detect buttons
            buttons = await self.detect_buttons(image)

            # Search for matching button by text
            description_lower = description.lower()

            for button in buttons:
                if button.text:
                    if any(
                        word in button.text.lower()
                        for word in description_lower.split()
                    ):
                        return button.center

            # If no match found, return center of first button
            if buttons:
                return buttons[0].center

            return None

        except Exception as e:
            logger.error(f"Element finding failed: {e}")
            return None

    async def analyze_image(
        self,
        image_base64: str,
        tasks: List[str],
        target_element: Optional[Dict[str, Any]] = None,
    ) -> VisionAnalysisResult:
        """
        Comprehensive image analysis

        Args:
            image_base64: Base64 encoded image
            tasks: List of tasks to perform
            target_element: Optional specific element to find

        Returns:
            VisionAnalysisResult with all requested analyses
        """
        try:
            # Decode image
            image = self._base64_to_image(image_base64)

            result = VisionAnalysisResult(success=True)

            # Execute requested tasks
            if "detect_buttons" in tasks:
                result.buttons_detected = await self.detect_buttons(image)

            if "extract_text" in tasks:
                result.text_extracted = await self.extract_text(image)

            if "extract_text_regions" in tasks:
                result.text_regions = await self.extract_text_regions(image)

            if "find_popups" in tasks or "detect_popups" in tasks:
                result.popups_detected = await self.detect_popups(image)

            # Find target element if specified
            if target_element:
                description = target_element.get("description", "")
                if description:
                    result.target_location = await self.find_element_by_description(
                        image, description
                    )

            logger.success("Vision analysis completed successfully")
            return result

        except Exception as e:
            logger.error(f"Vision analysis failed: {e}")
            return VisionAnalysisResult(success=False, error=str(e))

    async def compare_images(
        self, image1_base64: str, image2_base64: str
    ) -> Dict[str, Any]:
        """
        Compare two images to detect changes

        Args:
            image1_base64: First image (base64)
            image2_base64: Second image (base64)

        Returns:
            Comparison result with similarity score
        """
        try:
            image1 = self._base64_to_image(image1_base64)
            image2 = self._base64_to_image(image2_base64)

            # Resize to same dimensions if needed
            if image1.shape != image2.shape:
                image2 = cv2.resize(image2, (image1.shape[1], image1.shape[0]))

            # Convert to grayscale
            gray1 = cv2.cvtColor(image1, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(image2, cv2.COLOR_BGR2GRAY)

            # Calculate structural similarity
            from skimage.metrics import structural_similarity as ssim

            similarity = ssim(gray1, gray2)

            # Find differences
            diff = cv2.absdiff(gray1, gray2)
            _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

            # Find contours of changes
            contours, _ = cv2.findContours(
                thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            change_regions = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                if w > 10 and h > 10:  # Filter small changes
                    change_regions.append({"location": (x, y, w, h), "area": w * h})

            return {
                "similarity": float(similarity),
                "different": similarity < 0.95,
                "change_regions": change_regions,
                "num_changes": len(change_regions),
            }

        except Exception as e:
            logger.error(f"Image comparison failed: {e}")
            return {"error": str(e)}

    def get_capabilities(self) -> Dict[str, bool]:
        """Get available capabilities"""
        return {
            "opencv": CV2_AVAILABLE,
            "tesseract": TESSERACT_AVAILABLE,
            "easyocr": EASYOCR_AVAILABLE and self.use_easyocr,
            "button_detection": CV2_AVAILABLE,
            "text_extraction": TESSERACT_AVAILABLE or EASYOCR_AVAILABLE,
            "popup_detection": CV2_AVAILABLE,
            "image_comparison": CV2_AVAILABLE,
        }
