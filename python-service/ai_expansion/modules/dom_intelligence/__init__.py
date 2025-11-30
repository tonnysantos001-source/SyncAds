"""
AI Expansion - DOM Intelligence Module
Advanced HTML/DOM parsing and analysis with BeautifulSoup, LXML, and Selectolax
Maintains 100% compatibility with existing system - ADDON ONLY
"""

from .dom_analyzer import DOMAnalyzer
from .dom_parser import DOMParser
from .element_finder import ElementFinder
from .semantic_analyzer import SemanticAnalyzer

__all__ = [
    "DOMParser",
    "DOMAnalyzer",
    "ElementFinder",
    "SemanticAnalyzer",
]

__version__ = "1.0.0"
