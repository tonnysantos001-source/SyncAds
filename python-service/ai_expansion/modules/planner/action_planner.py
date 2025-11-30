"""
Action Planner - Complete Planner-Executor-Observer-Verifier system
Autonomous planning and execution with verification loop
100% ADDON - Does not modify existing functionality
"""

import asyncio
import json
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from loguru import logger


class ActionType(str, Enum):
    """Types of actions that can be planned"""

    NAVIGATE = "navigate"
    CLICK = "click"
    TYPE = "type"
    SCROLL = "scroll"
    WAIT = "wait"
    SCREENSHOT = "screenshot"
    ANALYZE_DOM = "analyze_dom"
    FIND_ELEMENT = "find_element"
    EXECUTE_SCRIPT = "execute_script"
    VERIFY = "verify"


class ExecutionStatus(str, Enum):
    """Status of execution"""

    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"


@dataclass
class Action:
    """Represents a single action in the plan"""

    action_type: ActionType
    description: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    expected_result: Optional[str] = None
    fallback_actions: List["Action"] = field(default_factory=list)
    critical: bool = False
    timeout: int = 30000
    retry_count: int = 0
    max_retries: int = 3


@dataclass
class ActionResult:
    """Result of executing an action"""

    action: Action
    status: ExecutionStatus
    output: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0
    screenshot: Optional[str] = None
    observations: List[str] = field(default_factory=list)


@dataclass
class Plan:
    """Complete execution plan"""

    plan_id: str
    goal: str
    steps: List[Action]
    context: Dict[str, Any] = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    estimated_time: float = 0.0
    confidence: float = 0.0


@dataclass
class ExecutionResult:
    """Complete execution result"""

    plan: Plan
    goal_achieved: bool
    steps_completed: int
    steps_total: int
    time_elapsed: float
    results: List[ActionResult] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    final_state: Dict[str, Any] = field(default_factory=dict)


@dataclass
class VerificationResult:
    """Result of goal verification"""

    goal_achieved: bool
    confidence: float
    reasoning: str
    evidence: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)


class ActionPlanner:
    """
    Complete PEOV (Planner-Executor-Observer-Verifier) system
    Autonomous planning, execution, observation, and verification
    """

    def __init__(
        self,
        agent_type: str = "langchain",
        model: str = "claude-3-5-haiku-20241022",
        provider: str = "anthropic",
    ):
        """
        Initialize action planner

        Args:
            agent_type: Type of agent to use (langchain, autogen)
            model: Model name
            provider: Provider (anthropic, openai)
        """
        self.agent_type = agent_type
        self.model = model
        self.provider = provider
        self.agent = None
        self.automation_manager = None
        self.dom_parser = None
        self._initialized = False

        logger.info(f"ActionPlanner initialized with {agent_type}")

    async def initialize(self):
        """Initialize all components"""
        if self._initialized:
            return

        # Initialize AI agent
        if self.agent_type == "langchain":
            from ..ai_agents.langchain_agent import LangChainAgent

            self.agent = LangChainAgent(
                model=self.model, provider=self.provider, verbose=True
            )
            await self.agent.initialize()

        # Initialize automation manager
        from ..automation import AutomationManager

        self.automation_manager = AutomationManager()
        await self.automation_manager.initialize()

        # Initialize DOM parser
        from ..dom_intelligence import DOMParser

        self.dom_parser = DOMParser(engine="selectolax")

        self._initialized = True
        logger.success("ActionPlanner fully initialized")

    async def create_plan(
        self, goal: str, context: Dict[str, Any], max_steps: int = 20
    ) -> Plan:
        """
        Create execution plan for a goal

        Args:
            goal: Goal description in natural language
            context: Contextual information (URL, HTML, etc.)
            max_steps: Maximum number of steps

        Returns:
            Plan object with steps
        """
        if not self._initialized:
            await self.initialize()

        logger.info(f"Creating plan for goal: {goal}")

        # Analyze context
        context_analysis = await self._analyze_context(context)

        # Generate plan using AI agent
        plan_prompt = f"""
Goal: {goal}

Context Analysis:
{json.dumps(context_analysis, indent=2)}

Create a detailed step-by-step plan to achieve this goal.
Each step should:
1. Be specific and actionable
2. Have clear expected results
3. Include fallback options if possible
4. Indicate if it's critical to goal success

Provide the plan as a list of actions with:
- action_type (navigate, click, type, scroll, wait, etc.)
- description (what this step does)
- parameters (selector, url, value, etc.)
- expected_result (what should happen)
- critical (true/false)

Maximum {max_steps} steps.
"""

        try:
            # Use agent to generate plan
            from ..ai_agents.langchain_agent import AgentTask

            task = AgentTask(goal=plan_prompt, context=context, max_steps=5)

            result = await self.agent.execute_goal(task)

            if result.success:
                # Parse plan from agent output
                steps = self._parse_plan_from_output(result.output, max_steps)
            else:
                # Fallback to simple plan
                steps = self._create_fallback_plan(goal, context)

            # Create plan object
            plan = Plan(
                plan_id=str(uuid.uuid4()),
                goal=goal,
                steps=steps,
                context=context,
                estimated_time=len(steps) * 5.0,  # Rough estimate
                confidence=0.8 if result.success else 0.5,
            )

            logger.success(f"Plan created with {len(steps)} steps")
            return plan

        except Exception as e:
            logger.error(f"Plan creation failed: {e}")
            # Create minimal fallback plan
            steps = self._create_fallback_plan(goal, context)
            return Plan(
                plan_id=str(uuid.uuid4()),
                goal=goal,
                steps=steps,
                context=context,
                estimated_time=len(steps) * 5.0,
                confidence=0.3,
            )

    async def _analyze_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze context to understand current state"""
        analysis = {"has_html": False, "has_url": False, "elements_analyzed": False}

        # Analyze HTML if available
        if "html" in context and context["html"]:
            try:
                tree = self.dom_parser.parse(context["html"], extract_metadata=True)
                analysis.update(
                    {
                        "has_html": True,
                        "total_elements": tree.total_elements,
                        "clickable_elements": tree.clickable_elements,
                        "form_elements": tree.form_elements,
                        "interactive_elements": tree.interactive_elements,
                        "elements_analyzed": True,
                    }
                )
            except Exception as e:
                logger.warning(f"HTML analysis failed: {e}")

        # Check URL
        if "url" in context or "current_url" in context:
            analysis["has_url"] = True
            analysis["url"] = context.get("url") or context.get("current_url")

        return analysis

    def _parse_plan_from_output(self, output: str, max_steps: int) -> List[Action]:
        """Parse plan from agent output"""
        steps = []

        try:
            # Try to extract structured data from output
            # This is a simple parser - could be improved with better LLM prompting

            lines = output.split("\n")
            current_action = None

            for line in lines:
                line = line.strip()

                # Look for action indicators
                if any(
                    keyword in line.lower()
                    for keyword in [
                        "step",
                        "action",
                        "navigate",
                        "click",
                        "type",
                        "scroll",
                    ]
                ):
                    if current_action:
                        steps.append(current_action)

                    # Determine action type
                    action_type = ActionType.CLICK  # Default

                    if "navigate" in line.lower() or "go to" in line.lower():
                        action_type = ActionType.NAVIGATE
                    elif "click" in line.lower():
                        action_type = ActionType.CLICK
                    elif "type" in line.lower() or "enter" in line.lower():
                        action_type = ActionType.TYPE
                    elif "scroll" in line.lower():
                        action_type = ActionType.SCROLL
                    elif "wait" in line.lower():
                        action_type = ActionType.WAIT

                    current_action = Action(
                        action_type=action_type,
                        description=line,
                        parameters={},
                        critical=False,
                    )

            # Add last action
            if current_action:
                steps.append(current_action)

            # Limit to max steps
            steps = steps[:max_steps]

        except Exception as e:
            logger.warning(f"Failed to parse plan from output: {e}")

        return steps

    def _create_fallback_plan(self, goal: str, context: Dict[str, Any]) -> List[Action]:
        """Create a simple fallback plan"""
        steps = []

        # Basic plan structure based on goal keywords
        goal_lower = goal.lower()

        # Navigate step if URL is provided
        if "url" in context or "current_url" in context:
            url = context.get("url") or context.get("current_url")
            steps.append(
                Action(
                    action_type=ActionType.NAVIGATE,
                    description=f"Navigate to {url}",
                    parameters={"url": url},
                    critical=True,
                )
            )

        # Analyze DOM
        steps.append(
            Action(
                action_type=ActionType.ANALYZE_DOM,
                description="Analyze page structure",
                parameters={},
                critical=False,
            )
        )

        # Wait for page load
        steps.append(
            Action(
                action_type=ActionType.WAIT,
                description="Wait for page to load",
                parameters={"wait_time": 2000},
                critical=False,
            )
        )

        # Screenshot for observation
        steps.append(
            Action(
                action_type=ActionType.SCREENSHOT,
                description="Capture current state",
                parameters={},
                critical=False,
            )
        )

        return steps

    async def execute_plan(
        self,
        plan: Plan,
        session_id: Optional[str] = None,
        max_steps: Optional[int] = None,
    ) -> ExecutionResult:
        """
        Execute a plan with observation and verification

        Args:
            plan: Plan to execute
            session_id: Optional automation session ID
            max_steps: Maximum steps to execute

        Returns:
            ExecutionResult with complete execution details
        """
        if not self._initialized:
            await self.initialize()

        logger.info(f"Executing plan {plan.plan_id} with {len(plan.steps)} steps")

        start_time = time.time()
        results = []
        errors = []

        # Create session if not provided
        if not session_id:
            session_id = await self.automation_manager.create_session(
                headless=True, stealth=True
            )

        steps_to_execute = plan.steps[:max_steps] if max_steps else plan.steps

        for i, action in enumerate(steps_to_execute):
            logger.info(
                f"Executing step {i + 1}/{len(steps_to_execute)}: {action.description}"
            )

            # Execute action
            result = await self._execute_action(action, session_id)
            results.append(result)

            # Observe result
            observations = await self._observe_result(result, session_id)
            result.observations = observations

            # Check if failed
            if result.status == ExecutionStatus.FAILED:
                errors.append(f"Step {i + 1} failed: {result.error}")

                # Try fallback if available
                if action.fallback_actions:
                    logger.info(f"Trying fallback for step {i + 1}")
                    for fallback in action.fallback_actions:
                        fallback_result = await self._execute_action(
                            fallback, session_id
                        )
                        if fallback_result.status == ExecutionStatus.SUCCESS:
                            result = fallback_result
                            break

                # Stop if critical action failed
                if action.critical and result.status == ExecutionStatus.FAILED:
                    logger.error(f"Critical action failed, stopping execution")
                    break

        time_elapsed = time.time() - start_time

        # Verify if goal was achieved
        verification = await self.verify_results(results, plan.goal, session_id)

        execution_result = ExecutionResult(
            plan=plan,
            goal_achieved=verification.goal_achieved,
            steps_completed=len(results),
            steps_total=len(plan.steps),
            time_elapsed=time_elapsed,
            results=results,
            errors=errors,
            final_state={},
        )

        logger.success(
            f"Plan execution completed in {time_elapsed:.2f}s. Goal achieved: {verification.goal_achieved}"
        )

        return execution_result

    async def _execute_action(self, action: Action, session_id: str) -> ActionResult:
        """Execute a single action"""
        start_time = time.time()

        try:
            from ..automation import AutomationTask

            # Convert to automation task
            task = AutomationTask(
                action=action.action_type.value,
                selector=action.parameters.get("selector"),
                value=action.parameters.get("value"),
                url=action.parameters.get("url"),
                wait_time=action.parameters.get("wait_time", 0),
                timeout=action.timeout,
                stealth_mode=True,
            )

            # Execute
            result = await self.automation_manager.execute_task(task, session_id)

            execution_time = time.time() - start_time

            if result.success:
                return ActionResult(
                    action=action,
                    status=ExecutionStatus.SUCCESS,
                    output=result.data,
                    execution_time=execution_time,
                    screenshot=result.screenshot,
                )
            else:
                return ActionResult(
                    action=action,
                    status=ExecutionStatus.FAILED,
                    error=result.error,
                    execution_time=execution_time,
                )

        except Exception as e:
            logger.error(f"Action execution failed: {e}")
            return ActionResult(
                action=action,
                status=ExecutionStatus.FAILED,
                error=str(e),
                execution_time=time.time() - start_time,
            )

    async def _observe_result(self, result: ActionResult, session_id: str) -> List[str]:
        """Observe the result of an action"""
        observations = []

        # Add basic observations
        observations.append(
            f"Action {result.action.action_type} completed with status {result.status}"
        )

        if result.output:
            observations.append(f"Output: {str(result.output)[:100]}")

        if result.error:
            observations.append(f"Error: {result.error}")

        # Additional observations could be added here
        # e.g., DOM changes, visual changes, etc.

        return observations

    async def verify_results(
        self, results: List[ActionResult], goal: str, session_id: Optional[str] = None
    ) -> VerificationResult:
        """
        Verify if the goal was achieved

        Args:
            results: List of action results
            goal: Original goal
            session_id: Optional session ID

        Returns:
            VerificationResult with verification details
        """
        logger.info("Verifying if goal was achieved...")

        # Collect evidence
        evidence = []
        success_count = sum(1 for r in results if r.status == ExecutionStatus.SUCCESS)
        total_count = len(results)

        evidence.append(f"{success_count}/{total_count} actions completed successfully")

        # Check if any critical actions failed
        critical_failures = [
            r
            for r in results
            if r.action.critical and r.status == ExecutionStatus.FAILED
        ]

        if critical_failures:
            return VerificationResult(
                goal_achieved=False,
                confidence=0.1,
                reasoning="Critical actions failed",
                evidence=evidence,
                suggestions=["Retry with different approach", "Check page structure"],
            )

        # Simple heuristic: if most actions succeeded, assume goal achieved
        # In real implementation, could use AI to verify against screenshots/DOM
        success_rate = success_count / total_count if total_count > 0 else 0

        goal_achieved = success_rate >= 0.7  # 70% success threshold

        return VerificationResult(
            goal_achieved=goal_achieved,
            confidence=success_rate,
            reasoning=f"Success rate: {success_rate:.1%}. {'Goal likely achieved' if goal_achieved else 'Goal not achieved'}",
            evidence=evidence,
            suggestions=["Manual verification recommended"]
            if not goal_achieved
            else [],
        )

    async def create_and_execute(
        self, goal: str, context: Dict[str, Any], max_steps: int = 20
    ) -> ExecutionResult:
        """
        Convenience method: create plan and execute in one call

        Args:
            goal: Goal description
            context: Context information
            max_steps: Maximum steps

        Returns:
            ExecutionResult
        """
        plan = await self.create_plan(goal, context, max_steps)
        result = await self.execute_plan(plan, max_steps=max_steps)
        return result

    async def retry_failed_steps(
        self, execution_result: ExecutionResult
    ) -> ExecutionResult:
        """Retry failed steps from an execution"""
        logger.info("Retrying failed steps...")

        failed_actions = [
            r.action
            for r in execution_result.results
            if r.status == ExecutionStatus.FAILED
        ]

        if not failed_actions:
            logger.info("No failed steps to retry")
            return execution_result

        # Create new plan with only failed actions
        retry_plan = Plan(
            plan_id=str(uuid.uuid4()),
            goal=f"Retry: {execution_result.plan.goal}",
            steps=failed_actions,
            context=execution_result.plan.context,
        )

        return await self.execute_plan(retry_plan)

    async def cleanup(self):
        """Cleanup resources"""
        if self.automation_manager:
            await self.automation_manager.cleanup()

    def __del__(self):
        """Destructor"""
        try:
            asyncio.get_event_loop().run_until_complete(self.cleanup())
        except:
            pass
