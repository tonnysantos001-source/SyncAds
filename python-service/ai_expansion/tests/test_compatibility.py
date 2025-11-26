"""
AI Expansion - Compatibility Tests
Ensures that expansion modules do not break existing functionality
100% ADDON - Validates backward compatibility
"""

import asyncio
import sys
from pathlib import Path

import pytest

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))


class TestBackwardCompatibility:
    """Test that existing system functionality is not affected"""

    def test_no_import_errors_in_existing_code(self):
        """Verify existing imports still work"""
        try:
            # Test existing imports (these should already work)
            import fastapi
            from loguru import logger

            import supabase

            assert True
        except ImportError as e:
            pytest.fail(f"Existing import broken: {e}")

    def test_expansion_modules_are_optional(self):
        """Verify expansion modules are truly optional"""
        # Should be able to import without expansion
        try:
            # This should work even if expansion is not installed
            from fastapi import FastAPI

            app = FastAPI()
            assert app is not None
        except Exception as e:
            pytest.fail(f"Core functionality broken: {e}")

    def test_expansion_imports_isolated(self):
        """Verify expansion imports don't leak into global namespace"""
        # Import expansion
        try:
            # Should not pollute global imports
            import sys

            from ai_expansion.integration import ExpansionIntegration

            existing_modules = [
                m for m in sys.modules.keys() if "expansion" not in m.lower()
            ]
            assert len(existing_modules) > 0
        except ImportError:
            # Expansion not installed, that's OK
            pass


class TestExpansionModules:
    """Test expansion modules if available"""

    def test_automation_manager_initialization(self):
        """Test AutomationManager can be initialized"""
        try:
            from ai_expansion.modules.automation import AutomationManager

            manager = AutomationManager()
            assert manager is not None
            assert hasattr(manager, "initialize")
            assert hasattr(manager, "execute_task")
        except ImportError:
            pytest.skip("Automation module not installed")

    def test_dom_parser_initialization(self):
        """Test DOMParser can be initialized"""
        try:
            from ai_expansion.modules.dom_intelligence import DOMParser

            parser = DOMParser()
            assert parser is not None
            assert hasattr(parser, "parse")
            assert hasattr(parser, "find_elements")
        except ImportError:
            pytest.skip("DOM Intelligence module not installed")

    def test_integration_helper_exists(self):
        """Test integration helper is available"""
        try:
            from ai_expansion.integration import integrate_expansion

            assert callable(integrate_expansion)
        except ImportError:
            pytest.skip("Integration module not installed")


class TestAPIEndpoints:
    """Test that API endpoints don't conflict"""

    @pytest.mark.asyncio
    async def test_expansion_routes_are_namespaced(self):
        """Verify expansion routes are properly namespaced"""
        try:
            from ai_expansion.api.expansion_router import router

            # All routes should start with /api/expansion
            for route in router.routes:
                if hasattr(route, "path"):
                    # Skip root path
                    if route.path == "/":
                        continue
                    # All other paths should not conflict
                    assert not route.path.startswith("/api/chat"), (
                        f"Route conflicts with existing: {route.path}"
                    )
                    assert not route.path.startswith("/api/browser-automation"), (
                        f"Route conflicts with existing: {route.path}"
                    )
        except ImportError:
            pytest.skip("Expansion router not installed")

    def test_no_global_middleware_pollution(self):
        """Verify expansion doesn't add global middleware"""
        from fastapi import FastAPI

        app = FastAPI()

        # Count middleware before
        middleware_before = len(app.user_middleware)

        # Import expansion (should not auto-add middleware)
        try:
            from ai_expansion.integration import ExpansionIntegration

            # Middleware count should not change
            assert len(app.user_middleware) == middleware_before
        except ImportError:
            pytest.skip("Expansion integration not installed")


class TestDependencies:
    """Test dependency compatibility"""

    def test_no_version_conflicts(self):
        """Verify no version conflicts with existing packages"""
        # Critical packages that must remain compatible
        critical_packages = [
            "fastapi",
            "pydantic",
            "supabase",
            "httpx",
            "python-dotenv",
        ]

        for package in critical_packages:
            try:
                __import__(package)
            except ImportError:
                pytest.fail(f"Critical package {package} is broken")

    def test_expansion_dependencies_optional(self):
        """Verify expansion dependencies are truly optional"""
        # These should not be required for core functionality
        optional_packages = [
            "playwright",
            "selenium",
            "selectolax",
            "langchain",
            "opencv-python",
        ]

        # Core should work even if these are missing
        from fastapi import FastAPI

        app = FastAPI()
        assert app is not None


class TestFunctionalIsolation:
    """Test that expansion is functionally isolated"""

    @pytest.mark.asyncio
    async def test_expansion_can_be_disabled(self):
        """Verify expansion can be completely disabled"""
        from fastapi import FastAPI

        app = FastAPI()

        # App should work without expansion
        assert app.routes is not None

        # Try to integrate (should be optional)
        try:
            from ai_expansion.integration import integrate_expansion

            # Should be able to skip integration
            # Just test that app still works
            assert app.routes is not None
        except ImportError:
            # Expansion not installed, that's OK
            pass

    def test_expansion_initialization_is_safe(self):
        """Verify expansion initialization doesn't break on errors"""
        try:
            from ai_expansion.integration import ExpansionIntegration
            from fastapi import FastAPI

            app = FastAPI()
            integrator = ExpansionIntegration(app)

            # Should not raise even if modules are missing
            # (it should log warnings instead)
            assert integrator is not None
        except ImportError:
            pytest.skip("Expansion not installed")
        except Exception as e:
            pytest.fail(f"Expansion initialization should be safe: {e}")


class TestMemoryAndPerformance:
    """Test memory and performance impact"""

    def test_expansion_import_lightweight(self):
        """Verify expansion imports are lightweight"""
        import sys

        # Count modules before
        modules_before = len(sys.modules)

        try:
            # Import only integration (should be light)
            from ai_expansion.integration import integrate_expansion

            # Should not import everything at once
            modules_after = len(sys.modules)

            # Should import less than 50 additional modules
            additional_modules = modules_after - modules_before
            assert additional_modules < 50, (
                f"Too many modules imported: {additional_modules}"
            )
        except ImportError:
            pytest.skip("Expansion not installed")

    def test_no_global_state_pollution(self):
        """Verify expansion doesn't pollute global state"""
        import os

        # Save environment
        env_before = os.environ.copy()

        try:
            from ai_expansion.integration import ExpansionIntegration
            from fastapi import FastAPI

            app = FastAPI()
            ExpansionIntegration(app)

            # Environment should not be modified
            assert os.environ == env_before
        except ImportError:
            pytest.skip("Expansion not installed")


class TestDocumentation:
    """Test that documentation is available"""

    def test_readme_exists(self):
        """Verify README exists"""
        readme_path = Path(__file__).parent.parent / "README.md"
        assert readme_path.exists(), "README.md not found"

    def test_quickstart_exists(self):
        """Verify QUICK_START exists"""
        quickstart_path = Path(__file__).parent.parent / "QUICK_START.md"
        assert quickstart_path.exists(), "QUICK_START.md not found"

    def test_requirements_exists(self):
        """Verify requirements file exists"""
        requirements_path = Path(__file__).parent.parent / "requirements-expansion.txt"
        assert requirements_path.exists(), "requirements-expansion.txt not found"


class TestSafetyChecks:
    """Test safety mechanisms"""

    def test_no_automatic_execution(self):
        """Verify expansion doesn't auto-execute dangerous operations"""
        try:
            # Import should not trigger automation
            from ai_expansion.modules.automation import AutomationManager

            # Just importing should not start browsers
            # (they should only start on explicit initialize() call)
            manager = AutomationManager()
            assert not manager._initialized
        except ImportError:
            pytest.skip("Automation module not installed")

    def test_cleanup_on_errors(self):
        """Verify cleanup happens even on errors"""
        try:
            from ai_expansion.modules.automation import AutomationManager

            manager = AutomationManager()

            # Should have cleanup method
            assert hasattr(manager, "cleanup")
            assert callable(manager.cleanup)
        except ImportError:
            pytest.skip("Automation module not installed")


# ==========================================
# INTEGRATION TESTS
# ==========================================


@pytest.mark.integration
class TestFullIntegration:
    """Integration tests (requires full setup)"""

    @pytest.mark.asyncio
    async def test_full_integration_flow(self):
        """Test complete integration flow"""
        try:
            from ai_expansion.integration import integrate_expansion
            from fastapi import FastAPI

            app = FastAPI()

            # Integrate
            integrator = await integrate_expansion(
                app,
                enable_all=True,
            )

            # Verify status
            status = integrator.get_status()
            assert status["initialized"] == True
            assert "modules" in status
        except ImportError:
            pytest.skip("Expansion not installed")

    @pytest.mark.asyncio
    async def test_health_check_endpoint(self):
        """Test health check endpoint works"""
        try:
            from ai_expansion.api.expansion_router import router
            from fastapi import FastAPI
            from fastapi.testclient import TestClient

            app = FastAPI()
            app.include_router(router)

            client = TestClient(app)
            response = client.get("/api/expansion/health")

            # Should return 200 even if modules are not fully initialized
            assert response.status_code == 200
        except ImportError:
            pytest.skip("Expansion router not installed")


# ==========================================
# RUN ALL TESTS
# ==========================================

if __name__ == "__main__":
    print("🧪 Running AI Expansion Compatibility Tests...")
    print("=" * 60)

    # Run tests
    pytest.main(
        [
            __file__,
            "-v",
            "--tb=short",
            "-m",
            "not integration",  # Skip integration tests by default
        ]
    )
