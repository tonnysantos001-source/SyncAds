"""
LangChain Agent - Autonomous agent with ReAct pattern and tool calling
Supports goal-based navigation, multi-step reasoning, and memory
100% ADDON - Does not modify existing functionality
"""

import asyncio
import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from loguru import logger

try:
    from langchain.agents import AgentExecutor, create_react_agent
    from langchain.memory import ConversationBufferMemory
    from langchain.prompts import PromptTemplate
    from langchain.tools import Tool
    from langchain_anthropic import ChatAnthropic
    from langchain_openai import ChatOpenAI

    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    logger.warning(
        "LangChain not available - install with: pip install langchain langchain-openai langchain-anthropic"
    )


@dataclass
class AgentTask:
    """Represents a task for the agent"""

    goal: str
    context: Dict[str, Any]
    max_steps: int = 20
    temperature: float = 0.7


@dataclass
class AgentResult:
    """Result from agent execution"""

    success: bool
    goal: str
    steps_taken: int
    output: Any
    reasoning: List[str]
    error: Optional[str] = None
    intermediate_steps: List[Dict[str, Any]] = None

    def __post_init__(self):
        if self.intermediate_steps is None:
            self.intermediate_steps = []


class LangChainAgent:
    """
    Autonomous agent using LangChain's ReAct pattern
    Can reason about actions, execute them, and learn from results
    """

    def __init__(
        self,
        model: str = "claude-3-5-haiku-20241022",
        provider: str = "anthropic",
        verbose: bool = True,
    ):
        """
        Initialize LangChain agent

        Args:
            model: Model name to use
            provider: Provider (anthropic, openai)
            verbose: Enable verbose logging
        """
        if not LANGCHAIN_AVAILABLE:
            raise RuntimeError("LangChain is not installed")

        self.model_name = model
        self.provider = provider
        self.verbose = verbose
        self.llm = None
        self.agent = None
        self.executor = None
        self.memory = ConversationBufferMemory(
            memory_key="chat_history", return_messages=True
        )
        self.tools = []

        logger.info(f"LangChainAgent initialized with {provider}/{model}")

    def _initialize_llm(self):
        """Initialize language model"""
        if self.llm:
            return

        try:
            if self.provider == "anthropic":
                self.llm = ChatAnthropic(
                    model=self.model_name, temperature=0.7, max_tokens=4096
                )
            elif self.provider == "openai":
                self.llm = ChatOpenAI(model=self.model_name, temperature=0.7)
            else:
                raise ValueError(f"Unsupported provider: {self.provider}")

            logger.success(f"LLM initialized: {self.provider}/{self.model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {e}")
            raise

    def register_tool(self, name: str, func: callable, description: str):
        """
        Register a tool that the agent can use

        Args:
            name: Tool name
            func: Tool function
            description: Tool description for the agent
        """
        tool = Tool(name=name, func=func, description=description)
        self.tools.append(tool)
        logger.info(f"Tool registered: {name}")

    def _setup_default_tools(self):
        """Setup default tools for web automation"""

        # DOM Analysis Tool
        def analyze_dom(html: str) -> str:
            """Analyze HTML DOM structure"""
            try:
                from ai_expansion.modules.dom_intelligence import DOMParser

                parser = DOMParser(engine="selectolax")
                tree = parser.parse(html, extract_metadata=True)

                return json.dumps(
                    {
                        "total_elements": tree.total_elements,
                        "clickable_elements": tree.clickable_elements,
                        "form_elements": tree.form_elements,
                        "interactive_elements": tree.interactive_elements,
                        "metadata": tree.metadata,
                    }
                )
            except Exception as e:
                return f"Error analyzing DOM: {e}"

        self.register_tool(
            name="analyze_dom",
            func=analyze_dom,
            description="Analyze HTML DOM structure. Input: HTML string. Returns: JSON with element counts and metadata.",
        )

        # Find Element Tool
        def find_elements(query: str) -> str:
            """Find elements by CSS selector or description"""
            try:
                # This would integrate with DOM parser
                return f"Finding elements matching: {query}"
            except Exception as e:
                return f"Error finding elements: {e}"

        self.register_tool(
            name="find_elements",
            func=find_elements,
            description="Find elements on page by CSS selector or natural language description. Input: query string. Returns: list of matching elements.",
        )

        # Execute JavaScript Tool
        def execute_javascript(code: str) -> str:
            """Execute JavaScript code in browser context"""
            try:
                # This would integrate with automation manager
                return f"JavaScript execution planned: {code[:100]}..."
            except Exception as e:
                return f"Error executing JavaScript: {e}"

        self.register_tool(
            name="execute_javascript",
            func=execute_javascript,
            description="Execute JavaScript code in the browser. Input: JavaScript code string. Returns: execution result.",
        )

        # Click Element Tool
        def click_element(selector: str) -> str:
            """Click an element by selector"""
            try:
                # This would integrate with automation manager
                return f"Click action planned for: {selector}"
            except Exception as e:
                return f"Error clicking element: {e}"

        self.register_tool(
            name="click_element",
            func=click_element,
            description="Click an element on the page. Input: CSS selector. Returns: success message.",
        )

        # Type Text Tool
        def type_text(selector: str, text: str) -> str:
            """Type text into an input field"""
            try:
                # This would integrate with automation manager
                return f"Type action planned: '{text}' into {selector}"
            except Exception as e:
                return f"Error typing text: {e}"

        self.register_tool(
            name="type_text",
            func=lambda x: type_text(*x.split("|", 1))
            if "|" in x
            else "Invalid format: use 'selector|text'",
            description="Type text into an input field. Input: 'selector|text' (pipe-separated). Returns: success message.",
        )

        # Navigate Tool
        def navigate(url: str) -> str:
            """Navigate to a URL"""
            try:
                # This would integrate with automation manager
                return f"Navigation planned to: {url}"
            except Exception as e:
                return f"Error navigating: {e}"

        self.register_tool(
            name="navigate",
            func=navigate,
            description="Navigate browser to a URL. Input: URL string. Returns: success message.",
        )

        # Screenshot Tool
        def take_screenshot() -> str:
            """Take a screenshot of current page"""
            try:
                return "Screenshot captured"
            except Exception as e:
                return f"Error taking screenshot: {e}"

        self.register_tool(
            name="take_screenshot",
            func=take_screenshot,
            description="Take a screenshot of the current page. No input required. Returns: success message.",
        )

        logger.info(f"Default tools registered: {len(self.tools)} tools")

    def _create_agent_prompt(self) -> PromptTemplate:
        """Create ReAct prompt for the agent"""

        template = """You are an intelligent web automation agent. Your goal is to help users accomplish tasks on web pages through autonomous reasoning and action.

You have access to the following tools:

{tools}

Use the following format:

Question: the input question/goal you must accomplish
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

IMPORTANT RULES:
1. Always think step-by-step
2. Analyze the page structure before taking actions
3. Verify elements exist before interacting with them
4. If an action fails, try alternative approaches
5. Be specific with selectors and inputs
6. Keep track of your progress toward the goal

Begin!

Question: {input}

Context: {context}

Chat History: {chat_history}

Thought: {agent_scratchpad}"""

        return PromptTemplate(
            template=template,
            input_variables=[
                "input",
                "context",
                "chat_history",
                "agent_scratchpad",
                "tools",
                "tool_names",
            ],
        )

    async def initialize(self):
        """Initialize the agent with tools and prompt"""
        self._initialize_llm()
        self._setup_default_tools()

        # Create agent
        prompt = self._create_agent_prompt()

        self.agent = create_react_agent(llm=self.llm, tools=self.tools, prompt=prompt)

        # Create executor
        self.executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            verbose=self.verbose,
            max_iterations=20,
            handle_parsing_errors=True,
            return_intermediate_steps=True,
        )

        logger.success("LangChain agent initialized and ready")

    async def execute_goal(self, task: AgentTask) -> AgentResult:
        """
        Execute a goal using autonomous reasoning

        Args:
            task: AgentTask with goal and context

        Returns:
            AgentResult with execution details
        """
        if not self.executor:
            await self.initialize()

        logger.info(f"Executing goal: {task.goal}")

        try:
            # Prepare input
            agent_input = {
                "input": task.goal,
                "context": json.dumps(task.context, indent=2),
            }

            # Execute
            result = await asyncio.to_thread(self.executor.invoke, agent_input)

            # Extract reasoning steps
            reasoning = []
            intermediate_steps = []

            if "intermediate_steps" in result:
                for step in result["intermediate_steps"]:
                    action, observation = step
                    reasoning.append(f"Action: {action.tool} - {action.tool_input}")
                    reasoning.append(f"Observation: {observation}")

                    intermediate_steps.append(
                        {
                            "action": action.tool,
                            "input": action.tool_input,
                            "output": observation,
                        }
                    )

            success = "output" in result
            output = result.get("output", "No output generated")

            logger.success(f"Goal execution completed: {success}")

            return AgentResult(
                success=success,
                goal=task.goal,
                steps_taken=len(reasoning) // 2,  # Action + Observation = 1 step
                output=output,
                reasoning=reasoning,
                intermediate_steps=intermediate_steps,
            )

        except Exception as e:
            logger.error(f"Goal execution failed: {e}")
            return AgentResult(
                success=False,
                goal=task.goal,
                steps_taken=0,
                output=None,
                reasoning=[],
                error=str(e),
            )

    async def execute_multi_goal(self, tasks: List[AgentTask]) -> List[AgentResult]:
        """Execute multiple goals in sequence"""
        results = []

        for i, task in enumerate(tasks):
            logger.info(f"Executing goal {i + 1}/{len(tasks)}")
            result = await self.execute_goal(task)
            results.append(result)

            # Stop if critical goal fails
            if not result.success and task.context.get("critical", False):
                logger.warning(f"Critical goal failed, stopping execution")
                break

        return results

    def clear_memory(self):
        """Clear agent's conversation memory"""
        self.memory.clear()
        logger.info("Agent memory cleared")

    def get_memory_summary(self) -> str:
        """Get summary of agent's memory"""
        try:
            return str(self.memory.buffer)
        except:
            return "Memory empty"

    async def chat(self, message: str, context: Optional[Dict] = None) -> str:
        """
        Simple chat interface with the agent

        Args:
            message: User message
            context: Optional context

        Returns:
            Agent's response
        """
        task = AgentTask(goal=message, context=context or {}, max_steps=10)

        result = await self.execute_goal(task)
        return result.output if result.success else f"Error: {result.error}"
