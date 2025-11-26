"""
Element Finder - Advanced element location and selection
Finds elements in DOM using various strategies (text, attributes, selectors)
100% ADDON - Does not modify existing functionality
"""

from typing import Any, Dict, List, Optional, Union

from loguru import logger

try:
    from .dom_parser import DOMParser

    DOM_PARSER_AVAILABLE = True
except ImportError:
    DOM_PARSER_AVAILABLE = False
    DOMParser = None
    logger.warning("DOM Parser not available")


class ElementFinder:
    """
    Advanced element finder with multiple search strategies
    """

    def __init__(self):
        """Initialize element finder"""
        self.parser = DOMParser() if DOM_PARSER_AVAILABLE else None
        logger.info("✅ ElementFinder initialized")

    def find_by_text(
        self, html: str, text: str, exact: bool = False, case_sensitive: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Find elements by visible text

        Args:
            html: HTML content to search
            text: Text to search for
            exact: If True, match exact text only
            case_sensitive: If True, case-sensitive matching

        Returns:
            List of matching elements with metadata
        """
        if not self.parser:
            return []

        results = []
        search_text = text if case_sensitive else text.lower()

        try:
            parsed = self.parser.parse(html)

            for elem in parsed.css("*"):
                elem_text = elem.text(strip=True)
                compare_text = elem_text if case_sensitive else elem_text.lower()

                if exact:
                    if compare_text == search_text:
                        results.append(self._element_to_dict(elem))
                else:
                    if search_text in compare_text:
                        results.append(self._element_to_dict(elem))

        except Exception as e:
            logger.error(f"Error finding elements by text: {e}")

        return results

    def find_by_selector(self, html: str, selector: str) -> List[Dict[str, Any]]:
        """
        Find elements by CSS selector

        Args:
            html: HTML content
            selector: CSS selector string

        Returns:
            List of matching elements
        """
        if not self.parser:
            return []

        results = []

        try:
            parsed = self.parser.parse(html)
            elements = parsed.css(selector)

            for elem in elements:
                results.append(self._element_to_dict(elem))

        except Exception as e:
            logger.error(f"Error finding elements by selector: {e}")

        return results

    def find_by_attribute(
        self, html: str, attribute: str, value: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Find elements by attribute

        Args:
            html: HTML content
            attribute: Attribute name
            value: Optional attribute value to match

        Returns:
            List of matching elements
        """
        if not self.parser:
            return []

        results = []

        try:
            parsed = self.parser.parse(html)

            if value:
                selector = f'[{attribute}="{value}"]'
            else:
                selector = f"[{attribute}]"

            elements = parsed.css(selector)

            for elem in elements:
                results.append(self._element_to_dict(elem))

        except Exception as e:
            logger.error(f"Error finding elements by attribute: {e}")

        return results

    def find_clickable(self, html: str) -> List[Dict[str, Any]]:
        """
        Find all clickable elements (buttons, links, etc)

        Args:
            html: HTML content

        Returns:
            List of clickable elements
        """
        if not self.parser:
            return []

        results = []

        try:
            parsed = self.parser.parse(html)

            # Find buttons
            for elem in parsed.css("button"):
                results.append(self._element_to_dict(elem, elem_type="button"))

            # Find links
            for elem in parsed.css("a[href]"):
                results.append(self._element_to_dict(elem, elem_type="link"))

            # Find elements with onclick
            for elem in parsed.css("[onclick]"):
                results.append(self._element_to_dict(elem, elem_type="clickable"))

            # Find role=button
            for elem in parsed.css('[role="button"]'):
                results.append(self._element_to_dict(elem, elem_type="role-button"))

        except Exception as e:
            logger.error(f"Error finding clickable elements: {e}")

        return results

    def find_inputs(self, html: str) -> List[Dict[str, Any]]:
        """
        Find all input elements (text, email, password, etc)

        Args:
            html: HTML content

        Returns:
            List of input elements with metadata
        """
        if not self.parser:
            return []

        results = []

        try:
            parsed = self.parser.parse(html)

            # Find input elements
            for elem in parsed.css("input"):
                input_dict = self._element_to_dict(elem)
                input_dict["input_type"] = elem.attributes.get("type", "text")
                results.append(input_dict)

            # Find textareas
            for elem in parsed.css("textarea"):
                input_dict = self._element_to_dict(elem)
                input_dict["input_type"] = "textarea"
                results.append(input_dict)

            # Find select elements
            for elem in parsed.css("select"):
                input_dict = self._element_to_dict(elem)
                input_dict["input_type"] = "select"
                results.append(input_dict)

        except Exception as e:
            logger.error(f"Error finding input elements: {e}")

        return results

    def find_by_id(self, html: str, element_id: str) -> Optional[Dict[str, Any]]:
        """
        Find element by ID

        Args:
            html: HTML content
            element_id: Element ID to find

        Returns:
            Element dict or None
        """
        if not self.parser:
            return None

        try:
            parsed = self.parser.parse(html)
            elem = parsed.css_first(f"#{element_id}")

            if elem:
                return self._element_to_dict(elem)

        except Exception as e:
            logger.error(f"Error finding element by ID: {e}")

        return None

    def find_by_class(self, html: str, class_name: str) -> List[Dict[str, Any]]:
        """
        Find elements by class name

        Args:
            html: HTML content
            class_name: Class name to search

        Returns:
            List of matching elements
        """
        if not self.parser:
            return []

        results = []

        try:
            parsed = self.parser.parse(html)
            elements = parsed.css(f".{class_name}")

            for elem in elements:
                results.append(self._element_to_dict(elem))

        except Exception as e:
            logger.error(f"Error finding elements by class: {e}")

        return results

    def find_parent(self, html: str, child_selector: str) -> Optional[Dict[str, Any]]:
        """
        Find parent of an element

        Args:
            html: HTML content
            child_selector: CSS selector for child element

        Returns:
            Parent element dict or None
        """
        if not self.parser:
            return None

        try:
            parsed = self.parser.parse(html)
            child = parsed.css_first(child_selector)

            if child and hasattr(child, "parent"):
                return self._element_to_dict(child.parent)

        except Exception as e:
            logger.error(f"Error finding parent element: {e}")

        return None

    def find_siblings(self, html: str, selector: str) -> List[Dict[str, Any]]:
        """
        Find sibling elements

        Args:
            html: HTML content
            selector: CSS selector for reference element

        Returns:
            List of sibling elements
        """
        if not self.parser:
            return []

        results = []

        try:
            parsed = self.parser.parse(html)
            elem = parsed.css_first(selector)

            if elem and hasattr(elem, "parent") and elem.parent:
                for sibling in elem.parent.children:
                    if sibling != elem:
                        results.append(self._element_to_dict(sibling))

        except Exception as e:
            logger.error(f"Error finding sibling elements: {e}")

        return results

    def _element_to_dict(
        self, elem: Any, elem_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Convert element to dictionary with metadata

        Args:
            elem: Element object
            elem_type: Optional element type label

        Returns:
            Dict with element information
        """
        try:
            return {
                "tag": elem.tag,
                "type": elem_type or elem.tag,
                "text": elem.text(strip=True),
                "attributes": dict(elem.attributes),
                "id": elem.attributes.get("id", ""),
                "classes": elem.attributes.get("class", "").split(),
                "selector": self._generate_selector(elem),
            }
        except Exception as e:
            logger.error(f"Error converting element to dict: {e}")
            return {
                "tag": "unknown",
                "type": elem_type or "unknown",
                "text": "",
                "attributes": {},
                "id": "",
                "classes": [],
                "selector": "",
            }

    def _generate_selector(self, elem: Any) -> str:
        """
        Generate CSS selector for element

        Args:
            elem: Element object

        Returns:
            CSS selector string
        """
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

    def count_elements(self, html: str, selector: str) -> int:
        """
        Count elements matching selector

        Args:
            html: HTML content
            selector: CSS selector

        Returns:
            Number of matching elements
        """
        if not self.parser:
            return 0

        try:
            parsed = self.parser.parse(html)
            return len(parsed.css(selector))

        except Exception as e:
            logger.error(f"Error counting elements: {e}")
            return 0


# Singleton instance
_finder_instance = None


def get_element_finder() -> ElementFinder:
    """Get singleton element finder instance"""
    global _finder_instance
    if _finder_instance is None:
        _finder_instance = ElementFinder()
    return _finder_instance
