"""
DOM Analyzer - Advanced DOM Intelligence Module
Analyzes HTML/DOM structure and extracts semantic information
100% ADDON - Does not modify existing functionality
"""

from typing import Any, Dict, List, Optional

from loguru import logger

try:
    from .dom_parser import DOMParser

    DOM_PARSER_AVAILABLE = True
except ImportError:
    DOM_PARSER_AVAILABLE = False
    DOMParser = None
    logger.warning("DOM Parser not available")


class DOMAnalyzer:
    """
    Advanced DOM analysis with semantic understanding
    """

    def __init__(self):
        """Initialize DOM Analyzer"""
        self.parser = DOMParser() if DOM_PARSER_AVAILABLE else None
        logger.info("✅ DOMAnalyzer initialized")

    def analyze(self, html: str, url: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze HTML/DOM and extract semantic information

        Args:
            html: HTML content to analyze
            url: Optional URL for context

        Returns:
            Dict with analysis results
        """
        if not self.parser:
            return {"success": False, "error": "DOM Parser not available"}

        try:
            # Parse HTML
            parsed = self.parser.parse(html)

            # Extract clickable elements
            clickables = self._find_clickable_elements(parsed)

            # Extract form inputs
            forms = self._find_forms(parsed)

            # Extract interactive elements
            interactive = self._find_interactive_elements(parsed)

            # Build semantic map
            semantic_map = {
                "clickables": clickables,
                "forms": forms,
                "interactive": interactive,
                "page_structure": self._analyze_structure(parsed),
            }

            return {
                "success": True,
                "url": url,
                "semantic_map": semantic_map,
                "stats": {
                    "clickables": len(clickables),
                    "forms": len(forms),
                    "interactive": len(interactive),
                },
            }

        except Exception as e:
            logger.error(f"Error analyzing DOM: {e}")
            return {"success": False, "error": str(e)}

    def _find_clickable_elements(self, parsed: Any) -> List[Dict[str, Any]]:
        """Find all clickable elements (buttons, links, etc)"""
        clickables = []

        if not parsed:
            return clickables

        try:
            # Find buttons
            for button in parsed.css("button"):
                clickables.append(
                    {
                        "type": "button",
                        "text": button.text(strip=True),
                        "selector": self._generate_selector(button),
                    }
                )

            # Find links
            for link in parsed.css("a"):
                href = link.attributes.get("href", "")
                if href:
                    clickables.append(
                        {
                            "type": "link",
                            "text": link.text(strip=True),
                            "href": href,
                            "selector": self._generate_selector(link),
                        }
                    )

            # Find clickable divs/spans
            for elem in parsed.css('[onclick], [role="button"]'):
                clickables.append(
                    {
                        "type": "clickable",
                        "text": elem.text(strip=True),
                        "selector": self._generate_selector(elem),
                    }
                )

        except Exception as e:
            logger.error(f"Error finding clickables: {e}")

        return clickables

    def _find_forms(self, parsed: Any) -> List[Dict[str, Any]]:
        """Find all forms and their inputs"""
        forms = []

        if not parsed:
            return forms

        try:
            for form in parsed.css("form"):
                inputs = []

                # Find all inputs
                for input_elem in form.css("input"):
                    inputs.append(
                        {
                            "type": input_elem.attributes.get("type", "text"),
                            "name": input_elem.attributes.get("name", ""),
                            "id": input_elem.attributes.get("id", ""),
                            "placeholder": input_elem.attributes.get("placeholder", ""),
                        }
                    )

                # Find textareas
                for textarea in form.css("textarea"):
                    inputs.append(
                        {
                            "type": "textarea",
                            "name": textarea.attributes.get("name", ""),
                            "id": textarea.attributes.get("id", ""),
                        }
                    )

                # Find selects
                for select in form.css("select"):
                    inputs.append(
                        {
                            "type": "select",
                            "name": select.attributes.get("name", ""),
                            "id": select.attributes.get("id", ""),
                        }
                    )

                forms.append(
                    {
                        "action": form.attributes.get("action", ""),
                        "method": form.attributes.get("method", "get"),
                        "inputs": inputs,
                        "selector": self._generate_selector(form),
                    }
                )

        except Exception as e:
            logger.error(f"Error finding forms: {e}")

        return forms

    def _find_interactive_elements(self, parsed: Any) -> List[Dict[str, Any]]:
        """Find interactive elements (inputs, dropdowns, etc)"""
        interactive = []

        if not parsed:
            return interactive

        try:
            # Find all interactive elements
            for elem in parsed.css('input, select, textarea, [contenteditable="true"]'):
                interactive.append(
                    {
                        "tag": elem.tag,
                        "type": elem.attributes.get("type", "text"),
                        "name": elem.attributes.get("name", ""),
                        "id": elem.attributes.get("id", ""),
                        "selector": self._generate_selector(elem),
                    }
                )

        except Exception as e:
            logger.error(f"Error finding interactive elements: {e}")

        return interactive

    def _analyze_structure(self, parsed: Any) -> Dict[str, Any]:
        """Analyze page structure"""
        structure = {
            "has_header": False,
            "has_nav": False,
            "has_main": False,
            "has_footer": False,
            "sections": 0,
        }

        if not parsed:
            return structure

        try:
            structure["has_header"] = len(parsed.css("header")) > 0
            structure["has_nav"] = len(parsed.css("nav")) > 0
            structure["has_main"] = len(parsed.css("main")) > 0
            structure["has_footer"] = len(parsed.css("footer")) > 0
            structure["sections"] = len(parsed.css("section"))

        except Exception as e:
            logger.error(f"Error analyzing structure: {e}")

        return structure

    def _generate_selector(self, elem: Any) -> str:
        """Generate CSS selector for element"""
        try:
            # Try ID first
            elem_id = elem.attributes.get("id", "")
            if elem_id:
                return f"#{elem_id}"

            # Try class
            elem_class = elem.attributes.get("class", "")
            if elem_class:
                classes = elem_class.split()
                if classes:
                    return f".{classes[0]}"

            # Fallback to tag
            return elem.tag

        except Exception:
            return "unknown"

    def find_element_by_text(self, html: str, text: str) -> Optional[Dict[str, Any]]:
        """
        Find element by visible text

        Args:
            html: HTML content
            text: Text to search for

        Returns:
            Element info or None
        """
        if not self.parser:
            return None

        try:
            parsed = self.parser.parse(html)

            # Search in all elements
            for elem in parsed.css("*"):
                elem_text = elem.text(strip=True)
                if text.lower() in elem_text.lower():
                    return {
                        "tag": elem.tag,
                        "text": elem_text,
                        "selector": self._generate_selector(elem),
                        "attributes": dict(elem.attributes),
                    }

        except Exception as e:
            logger.error(f"Error finding element by text: {e}")

        return None

    def extract_metadata(self, html: str) -> Dict[str, Any]:
        """
        Extract page metadata

        Args:
            html: HTML content

        Returns:
            Metadata dict
        """
        metadata = {"title": "", "description": "", "keywords": "", "og_tags": {}}

        if not self.parser:
            return metadata

        try:
            parsed = self.parser.parse(html)

            # Title
            title = parsed.css_first("title")
            if title:
                metadata["title"] = title.text(strip=True)

            # Meta description
            desc = parsed.css_first('meta[name="description"]')
            if desc:
                metadata["description"] = desc.attributes.get("content", "")

            # Meta keywords
            keywords = parsed.css_first('meta[name="keywords"]')
            if keywords:
                metadata["keywords"] = keywords.attributes.get("content", "")

            # Open Graph tags
            for og in parsed.css('meta[property^="og:"]'):
                prop = og.attributes.get("property", "")
                content = og.attributes.get("content", "")
                if prop and content:
                    metadata["og_tags"][prop] = content

        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")

        return metadata


# Singleton instance
_analyzer_instance = None


def get_analyzer() -> DOMAnalyzer:
    """Get singleton DOM analyzer instance"""
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = DOMAnalyzer()
    return _analyzer_instance
