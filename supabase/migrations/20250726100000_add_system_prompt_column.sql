/*
# [Operation] Add 'system_prompt' column to 'ai_models' table
This migration adds a new text column to the `ai_models` table to store the initial instruction (system prompt) for language models.

## Query Description:
This is a non-destructive operation that adds a new, nullable column named `system_prompt` to the existing `ai_models` table. No existing data will be altered or lost. This change is required for the application to save the "Instrução Inicial" for AI models.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The column can be dropped)

## Structure Details:
- Table Affected: `public.ai_models`
- Column Added: `system_prompt` (type: TEXT, nullable: true)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None added
- Triggers: None added
- Estimated Impact: Negligible. Adding a nullable column is a fast metadata-only change.
*/

ALTER TABLE public.ai_models
ADD COLUMN IF NOT EXISTS system_prompt TEXT;
