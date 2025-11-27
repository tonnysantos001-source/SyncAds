#!/usr/bin/env python3
"""
AI Expansion - Activation & Installation Script
Ativa TODOS os módulos e instala dependências necessárias
"""

import asyncio
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple


# Colors for terminal
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    END = "\033[0m"


def print_banner():
    """Print activation banner"""
    banner = f"""
{Colors.CYAN}╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         {Colors.BOLD}🚀 AI EXPANSION - FULL ACTIVATION SCRIPT 🚀{Colors.END}{Colors.CYAN}         ║
║                                                               ║
║           Ativando TODOS os módulos e dependências            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝{Colors.END}
    """
    print(banner)


def run_command(command: List[str], description: str) -> Tuple[bool, str]:
    """Run shell command and return success status"""
    print(f"\n{Colors.BLUE}▶ {description}...{Colors.END}")
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True,
            timeout=300,  # 5 minutes timeout
        )
        print(f"{Colors.GREEN}✓ {description} - SUCCESS{Colors.END}")
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        print(f"{Colors.RED}✗ {description} - FAILED{Colors.END}")
        print(f"  Error: {e.stderr}")
        return False, e.stderr
    except subprocess.TimeoutExpired:
        print(f"{Colors.RED}✗ {description} - TIMEOUT{Colors.END}")
        return False, "Command timed out"


def check_python_version():
    """Check if Python version is adequate"""
    print(f"\n{Colors.HEADER}📋 Checking Python Version...{Colors.END}")
    version = sys.version_info
    print(f"   Python: {version.major}.{version.minor}.{version.micro}")

    if version.major < 3 or (version.major == 3 and version.minor < 10):
        print(f"{Colors.RED}✗ Python 3.10+ is required!{Colors.END}")
        return False

    print(f"{Colors.GREEN}✓ Python version OK{Colors.END}")
    return True


def install_core_dependencies():
    """Install core dependencies first"""
    print(f"\n{Colors.HEADER}📦 Installing Core Dependencies...{Colors.END}")

    core_deps = [
        "pip",
        "setuptools",
        "wheel",
        "loguru",
        "python-dotenv",
        "fastapi",
        "uvicorn[standard]",
        "pydantic",
    ]

    for dep in core_deps:
        run_command(
            [sys.executable, "-m", "pip", "install", "--upgrade", dep],
            f"Installing {dep}",
        )


def install_expansion_requirements():
    """Install all expansion requirements"""
    print(f"\n{Colors.HEADER}📦 Installing AI Expansion Requirements...{Colors.END}")

    requirements_path = (
        Path(__file__).parent / "ai_expansion" / "requirements-expansion.txt"
    )

    if not requirements_path.exists():
        print(f"{Colors.RED}✗ requirements-expansion.txt not found!{Colors.END}")
        return False

    print(f"   Requirements file: {requirements_path}")

    # Install in chunks to avoid memory issues
    success, _ = run_command(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "-r",
            str(requirements_path),
            "--no-cache-dir",
        ],
        "Installing expansion requirements",
    )

    return success


def install_system_dependencies():
    """Install system-level dependencies"""
    print(f"\n{Colors.HEADER}🔧 Installing System Dependencies...{Colors.END}")

    # Playwright browsers
    print(f"\n{Colors.BLUE}▶ Installing Playwright browsers...{Colors.END}")
    run_command(
        [sys.executable, "-m", "playwright", "install"],
        "Installing Playwright browsers",
    )

    run_command(
        [sys.executable, "-m", "playwright", "install-deps"],
        "Installing Playwright system dependencies",
    )


def setup_environment():
    """Setup environment variables"""
    print(f"\n{Colors.HEADER}⚙️  Setting up Environment...{Colors.END}")

    env_file = Path(__file__).parent / ".env"
    expansion_env = Path(__file__).parent / "ai_expansion" / ".env"

    # Check if ENABLE_AI_EXPANSION is set
    if env_file.exists():
        with open(env_file, "r") as f:
            content = f.read()
            if "ENABLE_AI_EXPANSION" not in content:
                print(
                    f"{Colors.YELLOW}⚠ Adding ENABLE_AI_EXPANSION to .env{Colors.END}"
                )
                with open(env_file, "a") as f:
                    f.write("\n# AI Expansion\n")
                    f.write("ENABLE_AI_EXPANSION=true\n")
    else:
        print(f"{Colors.YELLOW}⚠ Creating .env file{Colors.END}")
        with open(env_file, "w") as f:
            f.write("# AI Expansion\n")
            f.write("ENABLE_AI_EXPANSION=true\n")

    print(f"{Colors.GREEN}✓ Environment configured{Colors.END}")


def test_module(module_name: str, import_path: str) -> bool:
    """Test if a module can be imported"""
    try:
        __import__(import_path)
        print(f"{Colors.GREEN}  ✓ {module_name}: OK{Colors.END}")
        return True
    except ImportError as e:
        print(f"{Colors.RED}  ✗ {module_name}: FAILED - {e}{Colors.END}")
        return False


def verify_modules():
    """Verify all modules can be imported"""
    print(f"\n{Colors.HEADER}🔍 Verifying Modules...{Colors.END}")

    modules = {
        # Automation
        "Playwright": "playwright.sync_api",
        "Selenium": "selenium.webdriver",
        "Pyppeteer": "pyppeteer",
        "Undetected ChromeDriver": "undetected_chromedriver",
        # DOM Parsing
        "BeautifulSoup": "bs4",
        "lxml": "lxml",
        "Selectolax": "selectolax",
        "Parsel": "parsel",
        # AI Agents
        "LangChain": "langchain",
        "LangChain OpenAI": "langchain_openai",
        "LangChain Anthropic": "langchain_anthropic",
        "LangGraph": "langgraph",
        "AutoGen": "autogen",
        # Computer Vision
        "OpenCV": "cv2",
        "Tesseract OCR": "pytesseract",
        "EasyOCR": "easyocr",
        "PIL": "PIL",
        # RPA
        "RPA Framework": "RPA",
        "Robot Framework": "robot",
        # ML/AI
        "Transformers": "transformers",
        "Sentence Transformers": "sentence_transformers",
        "Torch": "torch",
        # Scraping
        "Scrapy": "scrapy",
        "HTTPX": "httpx",
        "AIOHTTP": "aiohttp",
        # Utilities
        "ChromaDB": "chromadb",
        "Pandas": "pandas",
        "NumPy": "numpy",
    }

    results = {}
    for name, import_path in modules.items():
        results[name] = test_module(name, import_path)

    # Summary
    total = len(modules)
    success = sum(1 for v in results.values() if v)

    print(f"\n{Colors.BOLD}Summary: {success}/{total} modules available{Colors.END}")

    if success < total:
        print(
            f"{Colors.YELLOW}⚠ Some modules are missing. This is OK for basic functionality.{Colors.END}"
        )

    return success, total


async def test_expansion_integration():
    """Test AI Expansion integration"""
    print(f"\n{Colors.HEADER}🧪 Testing AI Expansion Integration...{Colors.END}")

    try:
        # Add parent directory to path
        sys.path.insert(0, str(Path(__file__).parent))

        from ai_expansion.integration import check_expansion_dependencies

        print(f"\n{Colors.BLUE}Checking dependencies...{Colors.END}")
        deps = check_expansion_dependencies()

        for dep, available in deps.items():
            status = f"{Colors.GREEN}✓" if available else f"{Colors.RED}✗"
            print(f"  {status} {dep}{Colors.END}")

        # Try to create integrator
        print(f"\n{Colors.BLUE}Testing integrator...{Colors.END}")
        from ai_expansion.integration import integrate_expansion
        from fastapi import FastAPI

        test_app = FastAPI()
        integrator = await integrate_expansion(test_app, enable_all=True)

        status = integrator.get_status()

        print(f"\n{Colors.BOLD}Integration Status:{Colors.END}")
        print(f"  Initialized: {status['initialized']}")
        print(f"  Enabled Modules: {status['enabled_count']}/{status['total_modules']}")

        print(f"\n{Colors.BOLD}Module Status:{Colors.END}")
        for module, enabled in status["modules"].items():
            icon = "🟢" if enabled else "🔴"
            status_text = "ENABLED" if enabled else "DISABLED"
            color = Colors.GREEN if enabled else Colors.RED
            print(f"  {icon} {module}: {color}{status_text}{Colors.END}")

        return status["enabled_count"] > 0

    except Exception as e:
        print(f"{Colors.RED}✗ Integration test failed: {e}{Colors.END}")
        import traceback

        traceback.print_exc()
        return False


def test_specific_modules():
    """Test specific module functionality"""
    print(f"\n{Colors.HEADER}🧪 Testing Specific Modules...{Colors.END}")

    results = {}

    # Test DOM Intelligence
    print(f"\n{Colors.BLUE}Testing DOM Intelligence...{Colors.END}")
    try:
        from ai_expansion.modules.dom_intelligence import DOMParser

        parser = DOMParser()
        info = parser.get_engine_info()
        print(
            f"  {Colors.GREEN}✓ DOM Parser OK - Engines: {info['available_engines']}{Colors.END}"
        )
        results["dom"] = True
    except Exception as e:
        print(f"  {Colors.RED}✗ DOM Parser FAILED: {e}{Colors.END}")
        results["dom"] = False

    # Test Automation
    print(f"\n{Colors.BLUE}Testing Automation...{Colors.END}")
    try:
        from ai_expansion.modules.automation import AutomationManager

        manager = AutomationManager()
        engines = manager.get_available_engines()
        print(f"  {Colors.GREEN}✓ Automation OK - Engines: {engines}{Colors.END}")
        results["automation"] = True
    except Exception as e:
        print(f"  {Colors.RED}✗ Automation FAILED: {e}{Colors.END}")
        results["automation"] = False

    # Test Vision
    print(f"\n{Colors.BLUE}Testing Computer Vision...{Colors.END}")
    try:
        import cv2
        import pytesseract

        print(f"  {Colors.GREEN}✓ OpenCV version: {cv2.__version__}{Colors.END}")
        print(f"  {Colors.GREEN}✓ Computer Vision OK{Colors.END}")
        results["vision"] = True
    except Exception as e:
        print(f"  {Colors.RED}✗ Computer Vision FAILED: {e}{Colors.END}")
        results["vision"] = False

    # Test AI Agents
    print(f"\n{Colors.BLUE}Testing AI Agents...{Colors.END}")
    try:
        import langchain

        print(
            f"  {Colors.GREEN}✓ LangChain version: {langchain.__version__}{Colors.END}"
        )
        print(f"  {Colors.GREEN}✓ AI Agents OK{Colors.END}")
        results["agents"] = True
    except Exception as e:
        print(f"  {Colors.RED}✗ AI Agents FAILED: {e}{Colors.END}")
        results["agents"] = False

    return results


def generate_activation_report(
    module_results: Dict[str, bool], deps_success: int, deps_total: int
):
    """Generate final activation report"""
    print(f"\n{Colors.HEADER}{'=' * 65}{Colors.END}")
    print(
        f"{Colors.BOLD}{Colors.CYAN}           🎉 ACTIVATION COMPLETE - FINAL REPORT 🎉{Colors.END}"
    )
    print(f"{Colors.HEADER}{'=' * 65}{Colors.END}\n")

    print(f"{Colors.BOLD}📊 Dependencies Status:{Colors.END}")
    print(f"   Installed: {deps_success}/{deps_total} modules")

    print(f"\n{Colors.BOLD}🔧 Module Status:{Colors.END}")

    module_status = {
        "dom": "🧠 DOM Intelligence",
        "automation": "🤖 Browser Automation",
        "vision": "👁️ Computer Vision",
        "agents": "🎯 AI Agents",
    }

    for key, name in module_status.items():
        if key in module_results:
            status = "✅ ENABLED" if module_results[key] else "❌ DISABLED"
            color = Colors.GREEN if module_results[key] else Colors.RED
            print(f"   {name}: {color}{status}{Colors.END}")

    print(f"\n{Colors.BOLD}📝 Next Steps:{Colors.END}")
    print(f"   1. Restart your Python service")
    print(f"   2. Check logs for: 'AI EXPANSION READY!'")
    print(f"   3. Visit: http://localhost:8000/api/expansion/info")
    print(f"   4. Test endpoints: /api/expansion/health")

    print(f"\n{Colors.BOLD}📚 Documentation:{Colors.END}")
    print(f"   • README: ai_expansion/README.md")
    print(f"   • API Docs: http://localhost:8000/docs")
    print(f"   • Health: http://localhost:8000/api/expansion/health")

    print(f"\n{Colors.BOLD}⚙️  Configuration:{Colors.END}")
    print(f"   • ENABLE_AI_EXPANSION=true (set in .env)")
    print(f"   • All modules enabled by default")

    all_enabled = all(module_results.values())

    if all_enabled:
        print(
            f"\n{Colors.GREEN}{Colors.BOLD}✅ ALL MODULES ACTIVATED SUCCESSFULLY!{Colors.END}"
        )
    else:
        print(
            f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  PARTIAL ACTIVATION - Some modules missing dependencies{Colors.END}"
        )
        print(
            f"{Colors.YELLOW}   This is OK - system will work with available modules{Colors.END}"
        )

    print(f"\n{Colors.HEADER}{'=' * 65}{Colors.END}\n")


def main():
    """Main activation flow"""
    print_banner()

    # Step 1: Check Python version
    if not check_python_version():
        sys.exit(1)

    # Step 2: Install core dependencies
    install_core_dependencies()

    # Step 3: Install expansion requirements
    print(
        f"\n{Colors.BOLD}This may take 5-10 minutes depending on your connection...{Colors.END}"
    )
    if not install_expansion_requirements():
        print(
            f"{Colors.YELLOW}⚠ Some packages failed to install, continuing...{Colors.END}"
        )

    # Step 4: Install system dependencies
    install_system_dependencies()

    # Step 5: Setup environment
    setup_environment()

    # Step 6: Verify modules
    deps_success, deps_total = verify_modules()

    # Step 7: Test integration
    integration_ok = asyncio.run(test_expansion_integration())

    # Step 8: Test specific modules
    module_results = test_specific_modules()

    # Step 9: Generate report
    generate_activation_report(module_results, deps_success, deps_total)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠ Activation interrupted by user{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Activation failed: {e}{Colors.END}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
