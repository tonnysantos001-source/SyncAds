// ============================================
// SYNCADS EXTENSION API
// Centralized API for extension-backend communication
// ============================================

/**
 * Extension API - Handles all communication with Supabase Edge Functions
 * @version 5.1.0
 */
class ExtensionAPI {
    constructor(supabase, config) {
        this.supabase = supabase;
        this.config = config;
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Generic request handler with retry logic
     */
    async _request(functionName, payload, options = {}) {
        const {
            retries = 3,
            timeout = 30000,
            useCache = false,
            cacheKey = null,
        } = options;

        // Check cache
        if (useCache && cacheKey) {
            const cached = this._getCache(cacheKey);
            if (cached) {
                console.log(`📦 [API] Cache hit: ${cacheKey}`);
                return cached;
            }
        }

        let lastError = null;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`🔄 [API] Calling ${functionName} (attempt ${attempt}/${retries})`);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const { data, error } = await this.supabase.functions.invoke(
                    functionName,
                    {
                        body: payload,
                        signal: controller.signal,
                    }
                );

                clearTimeout(timeoutId);

                if (error) throw error;

                // Cache successful response
                if (useCache && cacheKey) {
                    this._setCache(cacheKey, data);
                }

                console.log(`✅ [API] ${functionName} completed successfully`);
                return data;

            } catch (error) {
                lastError = error;
                console.warn(`⚠️ [API] ${functionName} attempt ${attempt} failed:`, error);

                if (attempt < retries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    console.log(`🔄 [API] Retrying in ${delay}ms...`);
                    await this._sleep(delay);
                }
            }
        }

        console.error(`❌ [API] ${functionName} failed after ${retries} attempts`);
        throw lastError;
    }

    /**
     * 1. Analyze Page - Advanced web scraping
     */
    async analyzePage(url, options = {}) {
        const payload = {
            url: url || window.location.href,
            analysis_type: options.type || "full",
            include_screenshot: options.screenshot || true,
            include_dom: options.dom || true,
        };

        return await this._request("advanced-scraper", payload, {
            retries: 2,
            useCache: true,
            cacheKey: `analyze_${url}`,
        });
    }

    /**
     * 2. Extract Data - Structured data extraction
     */
    async extractData(url, selectors = [], options = {}) {
        const payload = {
            url: url || window.location.href,
            selectors: selectors,
            format: options.format || "json",
            depth: options.depth || 1,
        };

        return await this._request("advanced-scraper", payload, {
            retries: 2,
        });
    }

    /**
     * 3. List Tabs - Get all open browser tabs
     */
    async listTabs() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type: "LIST_TABS" }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response.success) {
                    resolve(response);
                } else {
                    reject(new Error(response.error || "Failed to list tabs"));
                }
            });
        });
    }

    /**
     * 4. Create Automation - Start automation workflow
     */
    async createAutomation(steps, options = {}) {
        const payload = {
            steps: steps,
            device_id: this.config.deviceId,
            user_id: this.config.userId,
            name: options.name || "Automation",
            description: options.description || "",
        };

        return await this._request("automation-engine", payload, {
            retries: 1,
            timeout: 60000, // 1 minute
        });
    }

    /**
     * 5. Send Chat Message - Communicate with AI
     */
    async sendChatMessage(message, conversationId, options = {}) {
        const payload = {
            message: message,
            conversation_id: conversationId,
            user_id: this.config.userId,
            extensionConnected: true,
            conversation_history: options.history || [],
            metadata: options.metadata || {},
        };

        return await this._request("chat-enhanced", payload, {
            retries: 2,
            timeout: 45000, // 45 seconds
        });
    }

    /**
     * 6. Execute Command - Execute browser command
     */
    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs[0]) {
                    return reject(new Error("No active tab found"));
                }

                chrome.tabs.sendMessage(
                    tabs[0].id,
                    {
                        type: "EXECUTE_COMMAND",
                        command: command.command_type,
                        params: command.params,
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    }
                );
            });
        });
    }

    /**
     * 7. Capture Screenshot
     */
    async captureScreenshot() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { type: "CAPTURE_SCREENSHOT" },
                (response) => {
                    if (response.success) {
                        resolve(response.screenshot);
                    } else {
                        reject(new Error(response.error));
                    }
                }
            );
        });
    }

    /**
     * Cache helpers
     */
    _getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    _setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now(),
        });
    }

    _sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
        console.log("🗑️ [API] Cache cleared");
    }
}

// Export for use in sidepanel.js
window.ExtensionAPI = ExtensionAPI;
