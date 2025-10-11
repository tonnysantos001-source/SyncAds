/*
# [Operation Name]
Ensure `model_identifier` column exists

## Query Description: [This operation safely adds the `model_identifier` column to the `ai_models` table if it does not already exist. This is a non-destructive operation intended to fix schema inconsistencies and will not affect existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Table: `public.ai_models`
- Column: `model_identifier` (TEXT)

## Security Implications:
- RLS Status: [No Change]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible performance impact. The operation is fast and only runs if the column is missing.]
*/
ALTER TABLE public.ai_models ADD COLUMN IF NOT EXISTS model_identifier TEXT;
