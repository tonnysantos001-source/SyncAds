"""
AI Expansion - Automated Installation Script
Installs and configures all expansion modules automatically
100% ADDON - Does not modify existing code
"""

import asyncio
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple

# Color codes for terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
CYAN = "\033[96m"
RESET = "\033[0m"
BOLD = "\033[1m"


def print_banner():
    """Print installation banner"""
    banner = f"""
{CYAN}╔════════════════════════════════════════════════════════╗
║                                                        ║
║          🚀 SYNCADS AI - EXPANSION MODULE 🚀          ║
║                                                        ║
║               AUTOMATED INSTALLATION                   ║
║                                                        ║
╚════════════════════════════════════════════════════════╝{RESET}
    """
    print(banner)


def print_section(title: str):
    """Print section header"""
    print(f"\n{BOLD}{BLUE}{'=' * 60}{RESET}")
    print(f"{BOLD}{BLUE}{title}{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 60}{RESET}\n")


def print_success(message: str):
    """Print success message"""
    print(f"{GREEN}✓{RESET} {message}")


def print_warning(message: str):
    """Print warning message"""
    print(f"{YELLOW}⚠{RESET} {message}")


def print_error(message: str):
    """Print error message"""
    print(f"{RED}✗{RESET} {message}")


def print_info(message: str):
    """Print info message"""
    print(f"{CYAN}ℹ{RESET} {message}")


def run_command(command: List[str], check: bool = True) -> Tuple[bool, str]:
    """
    Run shell command and return success status and output

    Args:
        command: Command to run as list
        check: Whether to check for errors

    Returns:
        Tuple of (success, output)
    """
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=check)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr
    except FileNotFoundError:
        return False, f"Command not found: {command[0]}"


def check_python_version() -> bool:
    """Check if Python version is compatible"""
    print_section("1. Checking Python Version")

    version = sys.version_info
    print_info(f"Python version: {version.major}.{version.minor}.{version.micro}")

    if version.major >= 3 and version.minor >= 8:
        print_success("Python version is compatible (3.8+)")
        return True
    else:
        print_error("Python 3.8+ is required")
        return False


def check_pip() -> bool:
    """Check if pip is available"""
    print_section("2. Checking pip")

    success, output = run_command(
        [sys.executable, "-m", "pip", "--version"], check=False
    )

    if success:
        print_success(f"pip is available: {output.strip()}")
        return True
    else:
        print_error("pip is not available")
        return False


def install_requirements() -> bool:
    """Install all requirements"""
    print_section("3. Installing Dependencies")

    requirements_file = Path(__file__).parent / "requirements-expansion.txt"

    if not requirements_file.exists():
        print_error(f"Requirements file not found: {requirements_file}")
        return False

    print_info("This may take 5-10 minutes. Please wait...")
    print_info("Installing ~80 packages...")

    success, output = run_command(
        [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)],
        check=False,
    )

    if success:
        print_success("All dependencies installed successfully!")
        return True
    else:
        print_error("Failed to install some dependencies")
        print_error(output)
        return False


def install_playwright_browsers() -> bool:
    """Install Playwright browsers"""
    print_section("4. Installing Playwright Browsers")

    print_info("Installing Chromium for Playwright...")

    success, output = run_command(["playwright", "install", "chromium"], check=False)

    if success:
        print_success("Playwright browsers installed!")
        return True
    else:
        print_warning("Failed to install Playwright browsers")
        print_warning("You can install manually later: playwright install chromium")
        return False


def check_optional_dependencies() -> dict:
    """Check which optional dependencies are available"""
    print_section("5. Checking Optional Dependencies")

    checks = {
        "tesseract": ["tesseract", "--version"],
        "git": ["git", "--version"],
    }

    results = {}

    for name, command in checks.items():
        success, output = run_command(command, check=False)
        results[name] = success

        if success:
            version = output.strip().split("\n")[0]
            print_success(f"{name}: {version}")
        else:
            print_warning(f"{name}: Not installed (optional)")

    return results


def create_env_template():
    """Create .env template for configuration"""
    print_section("6. Creating Configuration Template")

    env_template = """# AI Expansion Configuration
# Copy this to your main .env file or create ai_expansion/.env

# Enable AI Expansion (optional - can be enabled via code)
ENABLE_AI_EXPANSION=true

# Captcha Solving Services (optional)
# Get keys from: https://2captcha.com or https://anti-captcha.com
TWOCAPTCHA_API_KEY=your_key_here
ANTICAPTCHA_API_KEY=your_key_here

# Proxy Configuration (optional)
HTTP_PROXY=
HTTPS_PROXY=

# AI Models (should already be configured in main .env)
# ANTHROPIC_API_KEY=your_key
# OPENAI_API_KEY=your_key
# GROQ_API_KEY=your_key
"""

    env_file = Path(__file__).parent / ".env.template"

    try:
        with open(env_file, "w") as f:
            f.write(env_template)
        print_success(f"Configuration template created: {env_file}")
        print_info("Edit this file and copy to your main .env")
        return True
    except Exception as e:
        print_error(f"Failed to create template: {e}")
        return False


def verify_installation() -> dict:
    """Verify that installation was successful"""
    print_section("7. Verifying Installation")

    modules_to_check = {
        "playwright": "playwright.async_api",
        "selenium": "selenium",
        "beautifulsoup4": "bs4",
        "lxml": "lxml",
        "selectolax": "selectolax.parser",
        "langchain": "langchain",
        "opencv": "cv2",
        "fastapi": "fastapi",
    }

    results = {}

    for name, import_path in modules_to_check.items():
        try:
            __import__(import_path)
            results[name] = True
            print_success(f"{name}: Installed")
        except ImportError:
            results[name] = False
            print_error(f"{name}: Not installed")

    installed_count = sum(results.values())
    total_count = len(results)

    print_info(f"\n{installed_count}/{total_count} core modules installed")

    return results


def show_integration_instructions():
    """Show instructions for integrating with main.py"""
    print_section("8. Integration Instructions")

    instructions = f"""
{BOLD}To integrate AI Expansion with your application:{RESET}

{CYAN}Method 1: Simple (3 lines){RESET}
Add to your main.py:

    from ai_expansion.integration import integrate_expansion

    @app.on_event("startup")
    async def startup():
        await integrate_expansion(app, enable_all=True)

{CYAN}Method 2: Ultra-Simple (1 line){RESET}
Add to your main.py:

    from ai_expansion.integration import create_expansion_startup_handler
    app.add_event_handler("startup", create_expansion_startup_handler(app))

{CYAN}Method 3: Environment Variable{RESET}
Set in your .env file:

    ENABLE_AI_EXPANSION=true

Then call auto_integrate_if_enabled() in your startup code.

{BOLD}Next Steps:{RESET}
1. Choose an integration method above
2. Restart your server
3. Test: curl http://localhost:8000/api/expansion/health
4. See QUICK_START.md for examples
    """

    print(instructions)


def show_next_steps():
    """Show next steps after installation"""
    print_section("9. Next Steps")

    print(f"""
{GREEN}✓ Installation Complete!{RESET}

{BOLD}What's available now:{RESET}
  • Multi-engine automation (Playwright, Selenium, Pyppeteer)
  • Ultra-fast DOM parsing (10-100x faster)
  • AI agents (LangChain + AutoGen base)
  • Computer vision (OpenCV + OCR)
  • Captcha solving (ethical APIs)
  • RPA framework integration

{BOLD}Quick Start:{RESET}
  1. Read QUICK_START.md for 5-minute setup
  2. Read README.md for complete documentation
  3. Integrate with main.py (see instructions above)
  4. Test with: curl http://localhost:8000/api/expansion/health

{BOLD}Optional Configuration:{RESET}
  • Edit ai_expansion/.env.template
  • Add captcha API keys (optional)
  • Configure proxy (optional)
  • Install Tesseract OCR for vision (optional)

{BOLD}Resources:{RESET}
  • Documentation: ai_expansion/README.md
  • Quick start: ai_expansion/QUICK_START.md
  • Examples: chrome-extension/expansion-integration-example.js
  • API endpoints: /api/expansion/info

{CYAN}🎉 Ready to unlock SUPER POWERS! 🎉{RESET}
    """)


def main():
    """Main installation function"""
    print_banner()

    print(f"{BOLD}This script will install AI Expansion modules.{RESET}")
    print(f"{BOLD}Estimated time: 5-10 minutes{RESET}\n")

    # Confirm installation
    try:
        response = (
            input(f"{CYAN}Continue with installation? [Y/n]: {RESET}").strip().lower()
        )
        if response and response != "y":
            print_info("Installation cancelled.")
            return
    except KeyboardInterrupt:
        print_info("\nInstallation cancelled.")
        return

    # Track success of each step
    success_steps = []

    # Step 1: Check Python version
    if check_python_version():
        success_steps.append("python_version")
    else:
        print_error("Installation cannot continue without Python 3.8+")
        return

    # Step 2: Check pip
    if check_pip():
        success_steps.append("pip")
    else:
        print_error("Installation cannot continue without pip")
        return

    # Step 3: Install requirements
    if install_requirements():
        success_steps.append("requirements")
    else:
        print_error("Installation failed at requirements step")
        print_warning("You may need to install some packages manually")

    # Step 4: Install Playwright browsers
    if install_playwright_browsers():
        success_steps.append("playwright_browsers")

    # Step 5: Check optional dependencies
    optional_deps = check_optional_dependencies()
    success_steps.append("optional_check")

    # Step 6: Create env template
    if create_env_template():
        success_steps.append("env_template")

    # Step 7: Verify installation
    verification = verify_installation()
    if sum(verification.values()) >= len(verification) * 0.8:  # 80% success
        success_steps.append("verification")

    # Step 8: Show integration instructions
    show_integration_instructions()
    success_steps.append("instructions")

    # Step 9: Show next steps
    show_next_steps()

    # Final summary
    print_section("Installation Summary")

    total_steps = 7  # Critical steps
    successful_steps = len(
        [
            s
            for s in success_steps
            if s
            in [
                "python_version",
                "pip",
                "requirements",
                "verification",
                "env_template",
                "instructions",
            ]
        ]
    )

    print(
        f"\n{BOLD}Completed: {successful_steps}/{total_steps} critical steps{RESET}\n"
    )

    if successful_steps >= 6:
        print(f"{GREEN}{BOLD}✓ Installation SUCCESSFUL!{RESET}")
        print(f"{GREEN}You can now use AI Expansion modules.{RESET}\n")
    elif successful_steps >= 4:
        print(f"{YELLOW}{BOLD}⚠ Installation PARTIAL{RESET}")
        print(f"{YELLOW}Some modules may not work. Check errors above.{RESET}\n")
    else:
        print(f"{RED}{BOLD}✗ Installation FAILED{RESET}")
        print(f"{RED}Please check errors and try manual installation.{RESET}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Installation interrupted by user.{RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n{RED}Unexpected error: {e}{RESET}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
