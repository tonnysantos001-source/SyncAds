/**
 * AI EXPANSION - Integration Example for Chrome Extension
 * Shows how to use the new ultra-powerful automation capabilities
 * 100% ADDON - Does not modify existing extension code
 */

// ==========================================
// CONFIGURATION
// ==========================================

const EXPANSION_API_BASE = 'https://your-python-service.railway.app/api/expansion';
// Or for local dev: 'http://localhost:8000/api/expansion'

// ==========================================
// 1. MULTI-STEP AUTOMATION EXAMPLE
// ==========================================

/**
 * Execute complex multi-step automation with intelligent fallback
 * Uses Playwright, Selenium, or Pyppeteer automatically
 */
async function executeMultiStepAutomation() {
  try {
    console.log('🚀 Starting multi-step automation...');

    const response = await fetch(`${EXPANSION_API_BASE}/automation/multi-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        engine: 'auto', // Automatic engine selection
        stealth: true,
        headless: true,
        stop_on_error: false, // Continue even if one step fails
        tasks: [
          {
            action: 'navigate',
            url: 'https://facebook.com/adsmanager'
          },
          {
            action: 'wait',
            wait_time: 2000
          },
          {
            action: 'click',
            selector: 'button[data-testid="create-campaign"]'
          },
          {
            action: 'type',
            selector: 'input[name="campaign_name"]',
            value: 'Black Friday 2025'
          },
          {
            action: 'screenshot'
          }
        ]
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Automation completed!');
      console.log(`📊 ${result.successful_steps}/${result.total_steps} steps successful`);
      console.log(`🔧 Session ID: ${result.session_id}`);

      // Show screenshot if available
      const screenshotResult = result.results.find(r => r.screenshot);
      if (screenshotResult) {
        showScreenshot(screenshotResult.screenshot);
      }
    } else {
      console.error('❌ Automation failed:', result.error);
    }

    return result;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ==========================================
// 2. ULTRA-FAST DOM ANALYSIS
// ==========================================

/**
 * Analyze DOM with ultra-fast Selectolax parser (10-100x faster)
 * Get semantic understanding of the page
 */
async function analyzeDOMIntelligent() {
  try {
    console.log('🧠 Analyzing DOM with AI...');

    // Get current page HTML
    const html = document.documentElement.outerHTML;

    const response = await fetch(`${EXPANSION_API_BASE}/dom/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        html: html,
        engine: 'selectolax', // Fastest parser (10-100x)
        extract_metadata: true,
        semantic_analysis: true
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ DOM analyzed successfully!');
      console.log(`📊 Total elements: ${result.tree.total_elements}`);
      console.log(`🖱️ Clickable: ${result.tree.clickable_elements}`);
      console.log(`📝 Forms: ${result.tree.form_elements}`);
      console.log(`⚡ Interactive: ${result.tree.interactive_elements}`);

      if (result.semantic_analysis) {
        console.log('🎯 Semantic regions found:', result.semantic_analysis.regions);
      }
    }

    return result;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ==========================================
// 3. AI AGENT GOAL EXECUTION
// ==========================================

/**
 * Let AI agent execute complex goal autonomously
 * Agent plans, executes, observes, and verifies
 */
async function executeAIGoal(goal) {
  try {
    console.log('🤖 Starting AI Agent to execute goal:', goal);

    const response = await fetch(`${EXPANSION_API_BASE}/agent/execute-goal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        goal: goal,
        context: {
          current_url: window.location.href,
          html: document.documentElement.outerHTML,
          user_data: {
            // Additional context the AI might need
          }
        },
        max_steps: 20,
        agent_type: 'langchain' // or 'autogen'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ AI Goal completed!');
      console.log('📋 Plan created:', result.plan.steps);
      console.log(`⚡ Execution: ${result.execution.steps_completed}/${result.execution.steps_total} steps`);
      console.log(`✔️ Goal achieved: ${result.verification.goal_achieved}`);
      console.log(`🎯 Confidence: ${result.verification.confidence * 100}%`);
    }

    return result;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ==========================================
// 4. SMART ELEMENT FINDER
// ==========================================

/**
 * Find elements using natural language
 * Example: "find the submit button" or "login form"
 */
async function findElementSmart(query) {
  try {
    console.log('🔍 Smart finding:', query);

    const html = document.documentElement.outerHTML;

    const response = await fetch(`${EXPANSION_API_BASE}/dom/find-elements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        html: html,
        query: query,
        find_type: 'any' // 'button', 'input', 'link', 'any'
      })
    });

    const result = await response.json();

    if (result.success && result.found_count > 0) {
      console.log(`✅ Found ${result.found_count} elements matching: "${query}"`);
      result.elements.forEach((el, i) => {
        console.log(`  ${i + 1}. ${el.tag} - ${el.text || el.attributes.placeholder || 'no text'}`);
      });

      return result.elements;
    } else {
      console.log('❌ No elements found');
      return [];
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ==========================================
// 5. COMPUTER VISION ANALYSIS
// ==========================================

/**
 * Analyze page visually when DOM is not enough
 * Detect buttons, read text, find popups
 */
async function analyzePageVisually() {
  try {
    console.log('👁️ Analyzing page with computer vision...');

    // Capture screenshot
    const screenshot = await captureScreenshot();

    const response = await fetch(`${EXPANSION_API_BASE}/vision/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        image: screenshot, // base64
        tasks: [
          'detect_buttons',
          'extract_text',
          'find_popups',
          'identify_forms'
        ],
        target_element: {
          description: 'blue submit button',
          type: 'button'
        }
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Visual analysis complete!');
      console.log('🔘 Buttons detected:', result.results.buttons_detected);
      console.log('📝 Text extracted:', result.results.text_extracted);
      console.log('📍 Target location:', result.results.target_location);
    }

    return result;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ==========================================
// 6. CAPTCHA SOLVING
// ==========================================

/**
 * Solve captcha ethically using API services
 * Supports reCAPTCHA, hCaptcha, etc.
 */
async function solveCaptcha(captchaType, siteKey) {
  try {
    console.log('🔐 Solving captcha...');

    const response = await fetch(`${EXPANSION_API_BASE}/captcha/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        captcha_type: captchaType, // 'recaptcha_v2', 'recaptcha_v3', 'hcaptcha'
        site_key: siteKey,
        page_url: window.location.href,
        service: '2captcha' // or 'anticaptcha'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Captcha solved!');
      console.log(`⏱️ Solve time: ${result.solve_time}s`);
      console.log(`💰 Cost: $${result.cost}`);

      // Return solution token
      return result.solution;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// ==========================================
// 7. SESSION MANAGEMENT
// ==========================================

/**
 * Create persistent browser session for multiple operations
 */
async function createAutomationSession() {
  try {
    const response = await fetch(`${EXPANSION_API_BASE}/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAuthToken()}`
      },
      body: JSON.stringify({
        engine: 'playwright',
        headless: true,
        stealth: true
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Session created:', result.session_id);

      // Store session ID for reuse
      chrome.storage.local.set({ automationSessionId: result.session_id });

      return result.session_id;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function closeAutomationSession(sessionId) {
  try {
    await fetch(`${EXPANSION_API_BASE}/session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await getAuthToken()}`
      }
    });

    console.log('✅ Session closed');
    chrome.storage.local.remove('automationSessionId');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// ==========================================
// 8. HEALTH CHECK
// ==========================================

/**
 * Check status of all expansion modules
 */
async function checkExpansionHealth() {
  try {
    const response = await fetch(`${EXPANSION_API_BASE}/health`);
    const result = await response.json();

    if (result.success) {
      console.log('🟢 Expansion Status: HEALTHY');
      console.log('📦 Modules:');
      console.log('  - Automation:', result.modules.automation.available ? '✅' : '❌');
      console.log('  - DOM Intelligence:', result.modules.dom_intelligence.available ? '✅' : '❌');
      console.log('  - AI Agents:', result.modules.ai_agents.available ? '✅' : '❌');
      console.log('  - Vision:', result.modules.vision.available ? '✅' : '❌');
      console.log('  - Captcha:', result.modules.captcha.available ? '✅' : '❌');
    } else {
      console.log('🔴 Expansion Status: UNHEALTHY');
    }

    return result;

  } catch (error) {
    console.error('❌ Cannot reach expansion API');
    return null;
  }
}

// ==========================================
// REAL-WORLD USAGE EXAMPLES
// ==========================================

/**
 * Example 1: Create Facebook Ad Campaign (Fully Autonomous)
 */
async function createFacebookAdCampaign() {
  console.log('🎯 Creating Facebook Ad Campaign...');

  // Let AI agent handle everything
  const result = await executeAIGoal(
    'Criar uma campanha de anúncios no Facebook Ads Manager com nome "Black Friday 2025", orçamento R$100/dia, objetivo de conversões'
  );

  if (result.verification.goal_achieved) {
    console.log('✅ Campaign created successfully!');
  } else {
    console.log('❌ Failed to create campaign');
  }
}

/**
 * Example 2: Fill Form Intelligently
 */
async function fillFormSmart(formData) {
  console.log('📝 Filling form intelligently...');

  // 1. Analyze DOM to understand form structure
  const domAnalysis = await analyzeDOMIntelligent();

  // 2. Find form elements by natural language
  const nameField = await findElementSmart('name input field');
  const emailField = await findElementSmart('email input');
  const submitButton = await findElementSmart('submit button');

  // 3. Fill form using automation
  await executeMultiStepAutomation([
    {
      action: 'type',
      selector: nameField[0].selector,
      value: formData.name
    },
    {
      action: 'type',
      selector: emailField[0].selector,
      value: formData.email
    },
    {
      action: 'click',
      selector: submitButton[0].selector
    }
  ]);

  console.log('✅ Form filled successfully!');
}

/**
 * Example 3: Handle Captcha Automatically
 */
async function handleCaptchaFlow() {
  console.log('🔐 Handling captcha...');

  // Detect captcha on page
  const captchaElement = document.querySelector('.g-recaptcha');

  if (captchaElement) {
    const siteKey = captchaElement.getAttribute('data-sitekey');

    // Solve captcha
    const solution = await solveCaptcha('recaptcha_v2', siteKey);

    // Apply solution
    document.querySelector('[name="g-recaptcha-response"]').value = solution;

    console.log('✅ Captcha solved and applied!');
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

async function getAuthToken() {
  // Get token from storage or session
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || '');
    });
  });
}

async function captureScreenshot() {
  return new Promise((resolve) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      // Convert to base64
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    });
  });
}

function showScreenshot(base64Image) {
  const img = document.createElement('img');
  img.src = `data:image/png;base64,${base64Image}`;
  img.style.maxWidth = '400px';
  img.style.border = '2px solid #4CAF50';
  document.body.appendChild(img);
}

// ==========================================
// INITIALIZATION
// ==========================================

async function initializeExpansion() {
  console.log('🚀 Initializing AI Expansion...');

  // Check health
  const health = await checkExpansionHealth();

  if (health && health.success) {
    console.log('✅ AI Expansion ready!');
    console.log('💪 Available superpowers:');
    console.log('  - Multi-engine automation (Playwright, Selenium, Pyppeteer)');
    console.log('  - Ultra-fast DOM parsing (10-100x faster)');
    console.log('  - AI agents with autonomous reasoning');
    console.log('  - Computer vision and OCR');
    console.log('  - Ethical captcha solving');
    console.log('  - RPA framework integration');

    // Setup message listener for commands from popup/background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      handleExpansionCommand(message).then(sendResponse);
      return true; // Will respond asynchronously
    });

  } else {
    console.warn('⚠️ AI Expansion not available');
  }
}

async function handleExpansionCommand(message) {
  switch (message.command) {
    case 'multiStepAutomation':
      return await executeMultiStepAutomation();

    case 'analyzeDom':
      return await analyzeDOMIntelligent();

    case 'executeGoal':
      return await executeAIGoal(message.goal);

    case 'findElement':
      return await findElementSmart(message.query);

    case 'visionAnalysis':
      return await analyzePageVisually();

    case 'solveCaptcha':
      return await solveCaptcha(message.type, message.siteKey);

    case 'checkHealth':
      return await checkExpansionHealth();

    default:
      return { error: 'Unknown command' };
  }
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExpansion);
} else {
  initializeExpansion();
}

// ==========================================
// EXPORT FOR USE IN OTHER SCRIPTS
// ==========================================

window.SyncAdsExpansion = {
  automation: {
    multiStep: executeMultiStepAutomation,
    createSession: createAutomationSession,
    closeSession: closeAutomationSession
  },
  dom: {
    analyze: analyzeDOMIntelligent,
    findElement: findElementSmart
  },
  ai: {
    executeGoal: executeAIGoal
  },
  vision: {
    analyze: analyzePageVisually
  },
  captcha: {
    solve: solveCaptcha
  },
  utils: {
    checkHealth: checkExpansionHealth
  }
};

console.log('🎉 SyncAds AI Expansion loaded! Access via window.SyncAdsExpansion');
