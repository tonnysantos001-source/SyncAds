"""
AI Expansion - AI Agents Module
Autonomous agents with LangChain, AutoGen, and advanced reasoning
Maintains 100% compatibility with existing system - ADDON ONLY
"""

from .agent_manager import AgentManager
from .autogen_agent import AutoGenAgent
from .executor_agent import ExecutorAgent
from .langchain_agent import LangChainAgent
from .observer_agent import ObserverAgent
from .planner_agent import PlannerAgent

__all__ = [
    "AgentManager",
    "LangChainAgent",
    "AutoGenAgent",
    "PlannerAgent",
    "ExecutorAgent",
    "ObserverAgent",
]

__version__ = "1.0.0"
