# 🧪 Anti-Lie Test Suite

## Running Tests

```bash
# Run all tests
deno test supabase/functions/_tests/anti-lie-verification.test.ts --allow-net --allow-env

# Run specific test
deno test --filter "Verification Guard" supabase/functions/_tests/anti-lie-verification.test.ts

# Run with coverage
deno test --coverage=coverage supabase/functions/_tests/
```

## Test Coverage

### ✅ Unit Tests (6)

1. **Verification Guard - Blocks success without evidence**
   - Validates `validateResult()` throws error for `success: true` without `evidence`
   
2. **Verification Guard - Allows success with evidence**
   - Validates legitimate success with evidence array passes

3. **Screenshot Capture - Creates command and waits**
   - Tests screenshot capture flow with Supabase

4. **Screenshot Capture - Handles timeout gracefully**
   - Tests 10s timeout behavior

5. **Vision API - Parses successful verification**
   - Mocks OpenAI response and validates parsing

6. **Vision API - Handles failed criteria**
   - Tests partial failure (some criteria not met)

### ✅ Integration Tests (3)

7. **Integration - Complete verification flow**
   - End-to-end flow: Screenshot → Vision → Validate
   - Validates evidence array structure

8. **Edge Case - Empty success criteria**
   - Tests behavior with zero criteria

9. **Edge Case - Vision API error fallback**
   - Tests graceful degradation when API fails

## Expected Results

```
test Verification Guard - Blocks success without evidence ... ok (5ms)
test Verification Guard - Allows success with evidence ... ok (3ms)
test Screenshot Capture - Creates command and waits ... ok (120ms)
test Screenshot Capture - Handles timeout gracefully ... ok (10050ms)
test Vision API - Parses successful verification ... ok (45ms)
test Vision API - Handles failed criteria ... ok (40ms)
test Integration - Complete verification flow ... ok (180ms)
test Edge Case - Empty success criteria ... ok (35ms)
test Edge Case - Vision API error fallback ... ok (50ms)

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out (10528ms)
```

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Anti-Lie Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      - name: Run Tests
        run: deno test supabase/functions/_tests/ --allow-all
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_TEST }}
```

## Manual Validation Tests

### Test 1: Real Navigation

```bash
# In browser console of extension:
chrome.runtime.sendMessage({
  type: "test_navigate",
  url: "https://www.google.com"
});

# Expected:
# - Screenshot BEFORE captured
# - Page navigates
# - Screenshot AFTER captured
# - Vision confirms "Google logo visible"
# - Returns evidence array with 3 items
```

### Test 2: Real Input Fill

```bash
# Navigate to google.com first, then:
chrome.runtime.sendMessage({
  type: "test_fill",
  selector: "input[name='q']",
  value: "iPhone 15"
});

# Expected:
# - Input filled character-by-character
# - Read-after-write confirms "iPhone 15"
# - Screenshot shows filled input
# - Vision confirms text visible
```

### Test 3: Real Error Handling

```bash
chrome.runtime.sendMessage({
  type: "test_navigate",
  url: "https://thissitedoesnotexist123456.com"
});

# Expected:
# - Navigation attempted
# - Error page detected
# - Vision confirms "Error 404" or similar
# - Returns success: false (HONEST)
```

## Metrics to Monitor

After deployment, track:

- **False Positive Rate:** Actions claimed successful but actually failed
  - **Target:** <2%
  
- **False Negative Rate:** Actions claimed failed but actually succeeded
  - **Target:** <5%
  
- **Vision API Accuracy:** Criteria matches human validation
  - **Target:** >90%
  
- **Average Evidence Count:** Screenshots per action
  - **Target:** 2-3 (before/after + vision)

## Troubleshooting

### Test fails: "Cannot find module"

```bash
# Ensure you're in the correct directory
cd supabase/functions
deno test _tests/anti-lie-verification.test.ts
```

### Test fails: "Permission denied"

```bash
# Add required permissions
deno test --allow-net --allow-env --allow-read
```

### Vision API tests fail: "API key not configured"

```bash
# Set environment variable
export OPENAI_API_KEY="sk-..."
deno test
```
