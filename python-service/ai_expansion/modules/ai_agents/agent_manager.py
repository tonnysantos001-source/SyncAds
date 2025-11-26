"""
Agent Manager - Coordinates multiple AI agents and manages their lifecycle
Supports LangChain, AutoGen, and custom agents
100% ADDON - Does not modify existing functionality
"""

import asyncio
import uuid
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

from loguru import logger


class AgentType(str, Enum):
    """Supported agent types"""

    LANGCHAIN = "langchain"
    AUTOGEN = "autogen"
    PLANNER = "planner"
    EXECUTOR = "executor"
    OBSERVER = "observer"
    VERIFIER = "verifier"


@dataclass
class AgentConfig:
    """Configuration for an agent"""

    agent_type: AgentType
    model: str = "claude-3-5-haiku-20241022"
    provider: str = "anthropic"
    temperature: float = 0.7
    max_iterations: int = 20
    verbose: bool = True
    custom_tools: Optional[List[Any]] = None


@dataclass
class AgentSession:
    """Represents an agent session"""

    session_id: str
    agent_type: AgentType
    agent: Any
    created_at: float
    last_used: float
    usage_count: int = 0


class AgentManager:
    """
    Central manager for all AI agents
    Handles agent lifecycle, coordination, and resource management
    """

    def __init__(self):
        """Initialize agent manager"""
        self.agents: Dict[str, AgentSession] = {}
        self.default_configs: Dict[AgentType, AgentConfig] = {}
        self._initialized = False
        logger.info("AgentManager initialized")

    async def initialize(self):
        """Initialize agent manager with default configurations"""
        if self._initialized:
            return

        # Setup default configurations
        self.default_configs = {
            AgentType.LANGCHAIN: AgentConfig(
                agent_type=AgentType.LANGCHAIN,
                model="claude-3-5-haiku-20241022",
                provider="anthropic",
            ),
            AgentType.AUTOGEN: AgentConfig(
                agent_type=AgentType.AUTOGEN,
                model="gpt-4-turbo-preview",
                provider="openai",
            ),
            AgentType.PLANNER: AgentConfig(
                agent_type=AgentType.PLANNER,
                model="claude-3-5-haiku-20241022",
                provider="anthropic",
                temperature=0.3,  # Lower temperature for planning
            ),
            AgentType.EXECUTOR: AgentConfig(
                agent_type=AgentType.EXECUTOR,
                model="claude-3-5-haiku-20241022",
                provider="anthropic",
                temperature=0.5,
            ),
            AgentType.OBSERVER: AgentConfig(
                agent_type=AgentType.OBSERVER,
                model="claude-3-5-haiku-20241022",
                provider="anthropic",
                temperature=0.1,  # Very low for observation
            ),
            AgentType.VERIFIER: AgentConfig(
                agent_type=AgentType.VERIFIER,
                model="claude-3-5-haiku-20241022",
                provider="anthropic",
                temperature=0.1,  # Very low for verification
            ),
        }

        self._initialized = True
        logger.success("AgentManager initialized with default configurations")

    async def create_agent(
        self, agent_type: AgentType, config: Optional[AgentConfig] = None
    ) -> str:
        """
        Create a new agent instance

        Args:
            agent_type: Type of agent to create
            config: Optional custom configuration

        Returns:
            Session ID for the created agent
        """
        if not self._initialized:
            await self.initialize()

        # Use provided config or default
        agent_config = config or self.default_configs.get(agent_type)

        if not agent_config:
            raise ValueError(f"No configuration found for agent type: {agent_type}")

        logger.info(f"Creating agent: {agent_type}")

        try:
            # Create agent based on type
            if agent_type == AgentType.LANGCHAIN:
                from .langchain_agent import LangChainAgent

                agent = LangChainAgent(
                    model=agent_config.model,
                    provider=agent_config.provider,
                    verbose=agent_config.verbose,
                )
                await agent.initialize()

            elif agent_type == AgentType.AUTOGEN:
                from .autogen_agent import AutoGenAgent

                agent = AutoGenAgent(
                    model=agent_config.model,
                    provider=agent_config.provider,
                    verbose=agent_config.verbose,
                )
                await agent.initialize()

            elif agent_type == AgentType.PLANNER:
                from .planner_agent import PlannerAgent

                agent = PlannerAgent(
                    model=agent_config.model,
                    provider=agent_config.provider,
                    temperature=agent_config.temperature,
                )
                await agent.initialize()

            elif agent_type == AgentType.EXECUTOR:
                from .executor_agent import ExecutorAgent

                agent = ExecutorAgent(
                    model=agent_config.model, provider=agent_config.provider
                )
                await agent.initialize()

            elif agent_type == AgentType.OBSERVER:
                from .observer_agent import ObserverAgent

                agent = ObserverAgent(
                    model=agent_config.model, provider=agent_config.provider
                )
                await agent.initialize()

            elif agent_type == AgentType.VERIFIER:
                from .verifier_agent import VerifierAgent

                agent = VerifierAgent(
                    model=agent_config.model, provider=agent_config.provider
                )
                await agent.initialize()

            else:
                raise ValueError(f"Unsupported agent type: {agent_type}")

            # Create session
            session_id = str(uuid.uuid4())
            import time

            session = AgentSession(
                session_id=session_id,
                agent_type=agent_type,
                agent=agent,
                created_at=time.time(),
                last_used=time.time(),
            )

            self.agents[session_id] = session

            logger.success(f"Agent created: {agent_type} ({session_id})")
            return session_id

        except Exception as e:
            logger.error(f"Failed to create agent: {e}")
            raise

    async def get_agent(self, session_id: str) -> Any:
        """
        Get agent by session ID

        Args:
            session_id: Agent session ID

        Returns:
            Agent instance
        """
        if session_id not in self.agents:
            raise ValueError(f"Agent session not found: {session_id}")

        session = self.agents[session_id]

        # Update usage stats
        import time

        session.last_used = time.time()
        session.usage_count += 1

        return session.agent

    async def execute_with_agent(self, session_id: str, task: Any) -> Dict[str, Any]:
        """
        Execute a task with a specific agent

        Args:
            session_id: Agent session ID
            task: Task to execute

        Returns:
            Execution result
        """
        agent = await self.get_agent(session_id)

        # Execute based on agent type
        if hasattr(agent, "execute_goal"):
            result = await agent.execute_goal(task)
        elif hasattr(agent, "execute"):
            result = await agent.execute(task)
        else:
            raise ValueError(f"Agent does not support execution")

        return result

    async def create_agent_team(self, agent_types: List[AgentType]) -> List[str]:
        """
        Create a team of agents for collaborative tasks

        Args:
            agent_types: List of agent types to create

        Returns:
            List of session IDs
        """
        session_ids = []

        for agent_type in agent_types:
            session_id = await self.create_agent(agent_type)
            session_ids.append(session_id)

        logger.info(f"Agent team created with {len(session_ids)} agents")
        return session_ids

    async def coordinate_agents(
        self, session_ids: List[str], task: Any
    ) -> List[Dict[str, Any]]:
        """
        Coordinate multiple agents to work on a task

        Args:
            session_ids: List of agent session IDs
            task: Task to coordinate

        Returns:
            List of results from each agent
        """
        results = []

        for session_id in session_ids:
            try:
                result = await self.execute_with_agent(session_id, task)
                results.append(
                    {"session_id": session_id, "success": True, "result": result}
                )
            except Exception as e:
                logger.error(f"Agent {session_id} failed: {e}")
                results.append(
                    {"session_id": session_id, "success": False, "error": str(e)}
                )

        return results

    async def close_agent(self, session_id: str):
        """
        Close an agent session

        Args:
            session_id: Agent session ID
        """
        if session_id not in self.agents:
            logger.warning(f"Agent session not found: {session_id}")
            return

        session = self.agents[session_id]

        # Cleanup agent
        if hasattr(session.agent, "cleanup"):
            try:
                await session.agent.cleanup()
            except Exception as e:
                logger.error(f"Error cleaning up agent: {e}")

        # Remove from manager
        del self.agents[session_id]

        logger.info(f"Agent session closed: {session_id}")

    async def close_all_agents(self):
        """Close all agent sessions"""
        logger.info("Closing all agent sessions...")

        session_ids = list(self.agents.keys())
        for session_id in session_ids:
            await self.close_agent(session_id)

        logger.info(f"Closed {len(session_ids)} agent sessions")

    async def get_agent_stats(self) -> Dict[str, Any]:
        """Get statistics about active agents"""
        stats = {
            "total_agents": len(self.agents),
            "agents_by_type": {},
            "total_usage": 0,
            "sessions": [],
        }

        for session_id, session in self.agents.items():
            agent_type = str(session.agent_type)

            # Count by type
            if agent_type not in stats["agents_by_type"]:
                stats["agents_by_type"][agent_type] = 0
            stats["agents_by_type"][agent_type] += 1

            # Total usage
            stats["total_usage"] += session.usage_count

            # Session details
            import time

            stats["sessions"].append(
                {
                    "session_id": session_id,
                    "agent_type": agent_type,
                    "usage_count": session.usage_count,
                    "age_seconds": time.time() - session.created_at,
                    "last_used_seconds_ago": time.time() - session.last_used,
                }
            )

        return stats

    async def cleanup_idle_agents(self, idle_timeout: int = 3600):
        """
        Cleanup agents that have been idle for too long

        Args:
            idle_timeout: Idle timeout in seconds (default: 1 hour)
        """
        import time

        current_time = time.time()
        closed_count = 0

        for session_id, session in list(self.agents.items()):
            idle_time = current_time - session.last_used

            if idle_time > idle_timeout:
                logger.info(
                    f"Closing idle agent {session_id} (idle for {idle_time:.0f}s)"
                )
                await self.close_agent(session_id)
                closed_count += 1

        if closed_count > 0:
            logger.info(f"Closed {closed_count} idle agents")

    def get_supported_agent_types(self) -> List[str]:
        """Get list of supported agent types"""
        return [agent_type.value for agent_type in AgentType]

    async def health_check(self) -> Dict[str, Any]:
        """Check health of agent manager"""
        try:
            stats = await self.get_agent_stats()

            return {
                "healthy": True,
                "initialized": self._initialized,
                "active_agents": stats["total_agents"],
                "supported_types": self.get_supported_agent_types(),
            }
        except Exception as e:
            return {"healthy": False, "error": str(e)}


# Global agent manager instance (singleton)
_global_agent_manager: Optional[AgentManager] = None


def get_agent_manager() -> AgentManager:
    """Get global agent manager instance"""
    global _global_agent_manager

    if _global_agent_manager is None:
        _global_agent_manager = AgentManager()

    return _global_agent_manager
