"""
Browser AI Manager - Integração com Browser-Use, Playwright e AgentQL
Automação web inteligente com IA para tarefas complexas
"""

from .browser_manager import BrowserAIManager
from .vision_selector import VisionElementSelector
from .agentql_helper import AgentQLHelper
from .dom_intelligence import DOMIntelligence

__all__ = [
    'BrowserAIManager',
    'VisionElementSelector',
    'AgentQLHelper',
    'DOMIntelligence'
]

__version__ = '1.0.0'
