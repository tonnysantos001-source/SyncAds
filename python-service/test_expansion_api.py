"""
AI Expansion API - Quick Test Script
Tests all expansion endpoints to verify functionality
"""

import asyncio
import json
from typing import Any, Dict

import httpx

# Configuration
API_BASE = "https://syncads-python-microservice-production.up.railway.app"
# API_BASE = "http://localhost:8000"  # For local testing

TIMEOUT = 30.0


async def test_health():
    """Test expansion health endpoint"""
    print("\n" + "=" * 60)
    print("🏥 Testing AI Expansion Health")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.get(f"{API_BASE}/api/expansion/health")
            data = response.json()

            print(f"✅ Status: {response.status_code}")
            print(f"✅ Healthy: {data.get('success', False)}")
            print(f"\nModules:")

            if "modules" in data:
                for module, info in data["modules"].items():
                    available = info.get("available", False)
                    icon = "🟢" if available else "🔴"
                    print(
                        f"  {icon} {module}: {'AVAILABLE' if available else 'NOT AVAILABLE'}"
                    )

            return data

        except Exception as e:
            print(f"❌ Error: {e}")
            return None


async def test_info():
    """Test expansion info endpoint"""
    print("\n" + "=" * 60)
    print("ℹ️  Testing AI Expansion Info")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.get(f"{API_BASE}/api/expansion/info")
            data = response.json()

            print(f"✅ Status: {response.status_code}")
            print(f"✅ Name: {data.get('name')}")
            print(f"✅ Version: {data.get('version')}")
            print(f"✅ Description: {data.get('description')}")

            print(f"\nAvailable Modules:")
            if "modules" in data:
                for module_name, module_info in data["modules"].items():
                    print(f"\n  📦 {module_name}:")
                    if "engines" in module_info:
                        print(f"     Engines: {', '.join(module_info['engines'])}")
                    if "features" in module_info:
                        print(
                            f"     Features: {len(module_info['features'])} available"
                        )

            return data

        except Exception as e:
            print(f"❌ Error: {e}")
            return None


async def test_dom_analysis():
    """Test DOM analysis endpoint"""
    print("\n" + "=" * 60)
    print("🧠 Testing DOM Analysis")
    print("=" * 60)

    test_html = """
    <html>
        <body>
            <h1>Test Page</h1>
            <button id="submit-btn" class="primary">Submit</button>
            <form>
                <input type="text" name="email" placeholder="Email">
                <input type="password" name="password" placeholder="Password">
            </form>
            <a href="/home">Home</a>
            <div class="content">
                <p>This is a test paragraph</p>
            </div>
        </body>
    </html>
    """

    payload = {
        "html": test_html,
        "engine": "selectolax",
        "extract_metadata": True,
        "semantic_analysis": False,
    }

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.post(
                f"{API_BASE}/api/expansion/dom/analyze", json=payload
            )
            data = response.json()

            print(f"✅ Status: {response.status_code}")

            if data.get("success"):
                tree = data.get("tree", {})
                print(f"✅ Parser: {data.get('parser_used')}")
                print(f"✅ Total elements: {tree.get('total_elements')}")
                print(f"✅ Clickable elements: {tree.get('clickable_elements')}")
                print(f"✅ Form elements: {tree.get('form_elements')}")
                print(f"✅ Interactive elements: {tree.get('interactive_elements')}")

                metadata = tree.get("metadata", {})
                if metadata:
                    print(f"\nMetadata:")
                    print(f"  - Links: {metadata.get('links_count')}")
                    print(f"  - Images: {metadata.get('images_count')}")
                    print(f"  - Scripts: {metadata.get('scripts_count')}")
            else:
                print(f"❌ Failed: {data.get('error')}")

            return data

        except Exception as e:
            print(f"❌ Error: {e}")
            return None


async def test_automation_health():
    """Test automation engines health"""
    print("\n" + "=" * 60)
    print("🤖 Testing Automation Engines Health")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.get(
                f"{API_BASE}/api/expansion/automation/engines/health"
            )
            data = response.json()

            print(f"✅ Status: {response.status_code}")

            if data.get("success"):
                engines = data.get("engines", {})
                healthy_count = data.get("healthy_count", 0)

                print(f"✅ Healthy engines: {healthy_count}/{len(engines)}")
                print(f"\nEngine Status:")

                for engine_name, is_healthy in engines.items():
                    icon = "🟢" if is_healthy else "🔴"
                    status = "HEALTHY" if is_healthy else "UNHEALTHY"
                    print(f"  {icon} {engine_name}: {status}")
            else:
                print(f"❌ Failed: {data.get('error')}")

            return data

        except Exception as e:
            print(f"❌ Error: {e}")
            return None


async def test_multi_step_automation():
    """Test multi-step automation (simple example)"""
    print("\n" + "=" * 60)
    print("🎯 Testing Multi-Step Automation")
    print("=" * 60)

    payload = {
        "engine": "auto",
        "stealth": True,
        "headless": True,
        "stop_on_error": False,
        "tasks": [
            {"action": "navigate", "url": "https://example.com"},
            {"action": "wait", "wait_time": 1000},
            {"action": "screenshot"},
        ],
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            print("⏳ Executing automation (this may take 30-60 seconds)...")
            response = await client.post(
                f"{API_BASE}/api/expansion/automation/multi-step", json=payload
            )
            data = response.json()

            print(f"✅ Status: {response.status_code}")

            if data.get("success"):
                print(f"✅ Session ID: {data.get('session_id')}")
                print(
                    f"✅ Steps completed: {data.get('successful_steps')}/{data.get('total_steps')}"
                )

                results = data.get("results", [])
                for i, result in enumerate(results):
                    icon = "✅" if result.get("success") else "❌"
                    engine = result.get("engine_used", "unknown")
                    time_taken = result.get("execution_time", 0)
                    print(f"  {icon} Step {i + 1}: {engine} ({time_taken:.2f}s)")
            else:
                print(f"❌ Failed: {data.get('error')}")

            return data

        except Exception as e:
            print(f"❌ Error: {e}")
            return None


async def test_session_management():
    """Test session creation and closure"""
    print("\n" + "=" * 60)
    print("🔄 Testing Session Management")
    print("=" * 60)

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            # Create session
            print("Creating automation session...")
            create_response = await client.post(
                f"{API_BASE}/api/expansion/session/create",
                params={"engine": "playwright", "headless": True, "stealth": True},
            )
            create_data = create_response.json()

            if create_data.get("success"):
                session_id = create_data.get("session_id")
                print(f"✅ Session created: {session_id}")
                print(f"✅ Engine: {create_data.get('engine')}")

                # Close session
                print("\nClosing session...")
                close_response = await client.delete(
                    f"{API_BASE}/api/expansion/session/{session_id}"
                )
                close_data = close_response.json()

                if close_data.get("success"):
                    print(f"✅ Session closed successfully")
                else:
                    print(f"❌ Failed to close: {close_data.get('error')}")

                return True
            else:
                print(f"❌ Failed to create session: {create_data.get('error')}")
                return False

        except Exception as e:
            print(f"❌ Error: {e}")
            return False


async def run_all_tests():
    """Run all tests"""
    print("\n" + "🚀" * 30)
    print("AI EXPANSION API - TEST SUITE")
    print("🚀" * 30)
    print(f"\nTesting API: {API_BASE}")

    results = {}

    # Test 1: Health Check
    results["health"] = await test_health()

    # Test 2: Info
    results["info"] = await test_info()

    # Test 3: DOM Analysis
    results["dom_analysis"] = await test_dom_analysis()

    # Test 4: Automation Health
    results["automation_health"] = await test_automation_health()

    # Test 5: Session Management
    results["session_management"] = await test_session_management()

    # Test 6: Multi-Step Automation (optional - takes longer)
    print("\n" + "=" * 60)
    print("⚠️  Multi-step automation test takes 30-60 seconds")
    response = input("Run multi-step automation test? (y/n): ").lower()
    if response == "y":
        results["multi_step_automation"] = await test_multi_step_automation()
    else:
        print("⏭️  Skipping multi-step automation test")

    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for v in results.values() if v is not None and v != False)
    total = len(results)

    print(f"Passed: {passed}/{total}")
    print(f"Success Rate: {(passed / total) * 100:.1f}%")

    if passed == total:
        print("\n✅ ALL TESTS PASSED! 🎉")
    elif passed >= total * 0.7:
        print("\n⚠️  MOST TESTS PASSED (Some modules may not be fully initialized)")
    else:
        print("\n❌ MANY TESTS FAILED (Check if AI Expansion is properly installed)")

    print("\n" + "=" * 60)
    print("Next steps:")
    print("1. Check Railway logs for any errors")
    print("2. Verify all dependencies are installed")
    print("3. Test endpoints manually at /docs")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
