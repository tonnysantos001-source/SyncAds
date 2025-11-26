"""
DOM Parser - Multi-engine HTML/DOM parsing with BeautifulSoup4, LXML, and Selectolax
Provides unified interface for ultra-fast DOM parsing and manipulation
100% ADDON - Does not modify existing functionality
"""

import json
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from loguru import logger

# Import parsers with fallback
try:
    from bs4 import BeautifulSoup

    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False
    logger.warning(
        "BeautifulSoup4 not available - install with: pip install beautifulsoup4"
    )

try:
    from lxml import etree
    from lxml import html as lxml_html

    LXML_AVAILABLE = True
except ImportError:
    LXML_AVAILABLE = False
    logger.warning("LXML not available - install with: pip install lxml")

try:
    from selectolax.parser import HTMLParser as SelectolaxParser

    SELECTOLAX_AVAILABLE = True
except ImportError:
    SELECTOLAX_AVAILABLE = False
    logger.warning("Selectolax not available - install with: pip install selectolax")


class ParserEngine(str, Enum):
    """Available parsing engines"""

    BEAUTIFULSOUP = "beautifulsoup"
    LXML = "lxml"
    SELECTOLAX = "selectolax"
    AUTO = "auto"  # Automatically select fastest available


@dataclass
class ParsedElement:
    """Represents a parsed DOM element"""

    tag: str
    text: Optional[str] = None
    attributes: Dict[str, str] = None
    children: List["ParsedElement"] = None
    xpath: Optional[str] = None
    css_path: Optional[str] = None

    def __post_init__(self):
        if self.attributes is None:
            self.attributes = {}
        if self.children is None:
            self.children = []

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "tag": self.tag,
            "text": self.text,
            "attributes": self.attributes,
            "xpath": self.xpath,
            "css_path": self.css_path,
            "children": [child.to_dict() for child in self.children],
        }

    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict(), indent=2)


@dataclass
class DOMTree:
    """Represents complete DOM tree structure"""

    root: ParsedElement
    total_elements: int
    clickable_elements: int
    form_elements: int
    interactive_elements: int
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "root": self.root.to_dict(),
            "total_elements": self.total_elements,
            "clickable_elements": self.clickable_elements,
            "form_elements": self.form_elements,
            "interactive_elements": self.interactive_elements,
            "metadata": self.metadata,
        }

    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(self.to_dict(), indent=2)


class DOMParser:
    """
    Multi-engine DOM parser with intelligent engine selection
    Supports BeautifulSoup4, LXML, and Selectolax
    """

    def __init__(self, engine: ParserEngine = ParserEngine.AUTO):
        """
        Initialize DOM parser

        Args:
            engine: Preferred parsing engine
        """
        self.engine = engine
        self._available_engines = self._detect_available_engines()

        if not self._available_engines:
            raise RuntimeError(
                "No parsing engines available. Install at least one: beautifulsoup4, lxml, or selectolax"
            )

        logger.info(
            f"DOMParser initialized with engines: {', '.join(self._available_engines)}"
        )

    def _detect_available_engines(self) -> List[str]:
        """Detect which parsing engines are available"""
        available = []
        if BS4_AVAILABLE:
            available.append(ParserEngine.BEAUTIFULSOUP)
        if LXML_AVAILABLE:
            available.append(ParserEngine.LXML)
        if SELECTOLAX_AVAILABLE:
            available.append(ParserEngine.SELECTOLAX)
        return available

    def _select_engine(self, preferred: ParserEngine = None) -> str:
        """
        Select the best available engine

        Args:
            preferred: Preferred engine

        Returns:
            Selected engine name
        """
        if (
            preferred
            and preferred != ParserEngine.AUTO
            and preferred in self._available_engines
        ):
            return preferred

        # Priority: Selectolax (fastest) > LXML > BeautifulSoup
        if ParserEngine.SELECTOLAX in self._available_engines:
            return ParserEngine.SELECTOLAX
        elif ParserEngine.LXML in self._available_engines:
            return ParserEngine.LXML
        elif ParserEngine.BEAUTIFULSOUP in self._available_engines:
            return ParserEngine.BEAUTIFULSOUP

        return self._available_engines[0]

    def parse(
        self,
        html: str,
        engine: Optional[ParserEngine] = None,
        extract_metadata: bool = True,
    ) -> DOMTree:
        """
        Parse HTML into DOM tree structure

        Args:
            html: HTML string to parse
            engine: Optional engine override
            extract_metadata: Extract additional metadata

        Returns:
            DOMTree object
        """
        selected_engine = self._select_engine(engine or self.engine)

        logger.debug(f"Parsing HTML with {selected_engine} engine")

        if selected_engine == ParserEngine.SELECTOLAX:
            return self._parse_with_selectolax(html, extract_metadata)
        elif selected_engine == ParserEngine.LXML:
            return self._parse_with_lxml(html, extract_metadata)
        elif selected_engine == ParserEngine.BEAUTIFULSOUP:
            return self._parse_with_beautifulsoup(html, extract_metadata)
        else:
            raise ValueError(f"Unsupported engine: {selected_engine}")

    def _parse_with_selectolax(self, html: str, extract_metadata: bool) -> DOMTree:
        """Parse HTML using Selectolax (fastest)"""
        parser = SelectolaxParser(html)
        root_node = parser.root

        # Build tree
        root_element = self._selectolax_to_element(root_node)

        # Count elements
        total = len(parser.css("*"))
        clickable = len(parser.css("a, button, [onclick], [role='button']"))
        forms = len(parser.css("input, textarea, select, button[type='submit']"))
        interactive = len(
            parser.css("a, button, input, select, textarea, [onclick], [tabindex]")
        )

        metadata = {}
        if extract_metadata:
            metadata = {
                "title": parser.css_first("title").text()
                if parser.css_first("title")
                else None,
                "links_count": len(parser.css("a")),
                "images_count": len(parser.css("img")),
                "scripts_count": len(parser.css("script")),
            }

        return DOMTree(
            root=root_element,
            total_elements=total,
            clickable_elements=clickable,
            form_elements=forms,
            interactive_elements=interactive,
            metadata=metadata,
        )

    def _selectolax_to_element(
        self, node, depth: int = 0, max_depth: int = 10
    ) -> ParsedElement:
        """Convert Selectolax node to ParsedElement"""
        if depth > max_depth or not hasattr(node, "tag"):
            return None

        element = ParsedElement(
            tag=node.tag if node.tag else "text",
            text=node.text(strip=True) if hasattr(node, "text") else None,
            attributes=dict(node.attributes) if hasattr(node, "attributes") else {},
        )

        # Parse children
        if hasattr(node, "iter") and depth < max_depth:
            for child in list(node.iter())[:50]:  # Limit children
                if child != node:
                    child_element = self._selectolax_to_element(
                        child, depth + 1, max_depth
                    )
                    if child_element:
                        element.children.append(child_element)
                    break  # Only immediate children

        return element

    def _parse_with_lxml(self, html: str, extract_metadata: bool) -> DOMTree:
        """Parse HTML using LXML"""
        try:
            tree = lxml_html.fromstring(html)
        except Exception as e:
            logger.warning(f"LXML parsing failed, trying with recovery: {e}")
            parser = lxml_html.HTMLParser(recover=True)
            tree = lxml_html.fromstring(html, parser=parser)

        # Build tree
        root_element = self._lxml_to_element(tree)

        # Count elements
        total = len(tree.xpath("//*"))
        clickable = len(
            tree.xpath("//a | //button | //*[@onclick] | //*[@role='button']")
        )
        forms = len(
            tree.xpath("//input | //textarea | //select | //button[@type='submit']")
        )
        interactive = len(
            tree.xpath(
                "//a | //button | //input | //select | //textarea | //*[@onclick] | //*[@tabindex]"
            )
        )

        metadata = {}
        if extract_metadata:
            title_elements = tree.xpath("//title")
            metadata = {
                "title": title_elements[0].text if title_elements else None,
                "links_count": len(tree.xpath("//a")),
                "images_count": len(tree.xpath("//img")),
                "scripts_count": len(tree.xpath("//script")),
            }

        return DOMTree(
            root=root_element,
            total_elements=total,
            clickable_elements=clickable,
            form_elements=forms,
            interactive_elements=interactive,
            metadata=metadata,
        )

    def _lxml_to_element(
        self, node, depth: int = 0, max_depth: int = 10
    ) -> ParsedElement:
        """Convert LXML node to ParsedElement"""
        if depth > max_depth:
            return None

        tag = node.tag if hasattr(node, "tag") else "text"
        text = node.text or ""
        attributes = dict(node.attrib) if hasattr(node, "attrib") else {}

        element = ParsedElement(
            tag=tag,
            text=text.strip() if text else None,
            attributes=attributes,
            xpath=tree.getpath(node) if hasattr(node, "getroottree") else None,
        )

        # Parse children
        if hasattr(node, "__iter__") and depth < max_depth:
            for child in list(node)[:50]:  # Limit children
                child_element = self._lxml_to_element(child, depth + 1, max_depth)
                if child_element:
                    element.children.append(child_element)

        return element

    def _parse_with_beautifulsoup(self, html: str, extract_metadata: bool) -> DOMTree:
        """Parse HTML using BeautifulSoup4"""
        soup = BeautifulSoup(html, "html.parser")

        # Build tree
        root_element = self._bs4_to_element(soup)

        # Count elements
        total = len(soup.find_all())
        clickable = len(soup.select("a, button, [onclick], [role='button']"))
        forms = len(soup.select("input, textarea, select, button[type='submit']"))
        interactive = len(
            soup.select("a, button, input, select, textarea, [onclick], [tabindex]")
        )

        metadata = {}
        if extract_metadata:
            title_tag = soup.find("title")
            metadata = {
                "title": title_tag.get_text(strip=True) if title_tag else None,
                "links_count": len(soup.find_all("a")),
                "images_count": len(soup.find_all("img")),
                "scripts_count": len(soup.find_all("script")),
            }

        return DOMTree(
            root=root_element,
            total_elements=total,
            clickable_elements=clickable,
            form_elements=forms,
            interactive_elements=interactive,
            metadata=metadata,
        )

    def _bs4_to_element(
        self, node, depth: int = 0, max_depth: int = 10
    ) -> ParsedElement:
        """Convert BeautifulSoup node to ParsedElement"""
        if depth > max_depth or not hasattr(node, "name"):
            return None

        tag = node.name if node.name else "text"
        text = node.get_text(strip=True) if hasattr(node, "get_text") else None
        attributes = dict(node.attrs) if hasattr(node, "attrs") else {}

        element = ParsedElement(tag=tag, text=text, attributes=attributes)

        # Parse children
        if hasattr(node, "children") and depth < max_depth:
            for child in list(node.children)[:50]:  # Limit children
                if hasattr(child, "name"):
                    child_element = self._bs4_to_element(child, depth + 1, max_depth)
                    if child_element:
                        element.children.append(child_element)

        return element

    def find_elements(
        self, html: str, selector: str, engine: Optional[ParserEngine] = None
    ) -> List[Dict[str, Any]]:
        """
        Find elements by CSS selector

        Args:
            html: HTML string
            selector: CSS selector
            engine: Optional engine override

        Returns:
            List of matched elements as dictionaries
        """
        selected_engine = self._select_engine(engine or self.engine)

        if selected_engine == ParserEngine.SELECTOLAX:
            parser = SelectolaxParser(html)
            elements = parser.css(selector)
            return [
                {
                    "tag": el.tag,
                    "text": el.text(strip=True),
                    "attributes": dict(el.attributes),
                }
                for el in elements
            ]

        elif selected_engine == ParserEngine.LXML:
            tree = lxml_html.fromstring(html)
            elements = tree.cssselect(selector)
            return [
                {
                    "tag": el.tag,
                    "text": el.text_content().strip(),
                    "attributes": dict(el.attrib),
                }
                for el in elements
            ]

        elif selected_engine == ParserEngine.BEAUTIFULSOUP:
            soup = BeautifulSoup(html, "html.parser")
            elements = soup.select(selector)
            return [
                {
                    "tag": el.name,
                    "text": el.get_text(strip=True),
                    "attributes": dict(el.attrs),
                }
                for el in elements
            ]

        return []

    def extract_text(self, html: str, clean: bool = True) -> str:
        """
        Extract all text from HTML

        Args:
            html: HTML string
            clean: Remove extra whitespace

        Returns:
            Extracted text
        """
        selected_engine = self._select_engine(self.engine)

        if selected_engine == ParserEngine.SELECTOLAX:
            parser = SelectolaxParser(html)
            text = parser.text(strip=clean)

        elif selected_engine == ParserEngine.LXML:
            tree = lxml_html.fromstring(html)
            text = tree.text_content()

        elif selected_engine == ParserEngine.BEAUTIFULSOUP:
            soup = BeautifulSoup(html, "html.parser")
            text = soup.get_text()

        else:
            text = ""

        if clean:
            # Remove extra whitespace
            text = " ".join(text.split())

        return text

    def get_engine_info(self) -> Dict[str, Any]:
        """Get information about available engines"""
        return {
            "available_engines": self._available_engines,
            "current_engine": str(self.engine),
            "engines_status": {
                "beautifulsoup": BS4_AVAILABLE,
                "lxml": LXML_AVAILABLE,
                "selectolax": SELECTOLAX_AVAILABLE,
            },
        }
