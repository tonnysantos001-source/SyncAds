UPDATE "GlobalAiConnection" SET "isActive" = false WHERE "provider" = 'ANTHROPIC';
DELETE FROM "GlobalAiConnection" WHERE "provider" = 'ANTHROPIC';
INSERT INTO "GlobalAiConnection" (id, name, provider, "apiKey", model, "baseUrl", temperature, "maxTokens", "isActive", "createdAt") 
VALUES (gen_random_uuid(), 'Claude 3', 'ANTHROPIC', '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', 'claude-3-haiku-20240307', 'https://api.anthropic.com/v1', 0.7, 4096, true, NOW());
