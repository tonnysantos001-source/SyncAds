/*
          # [Rename Column]
          Renames the `model_status` column to `status` in the `ai_models` table.

          ## Query Description: [This operation aligns the database schema with the application's data model. It corrects a naming mismatch that was preventing AI models from being saved correctly. This is a safe, non-destructive operation that only renames a column.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Table: `public.ai_models`
          - Column Renamed: `model_status` -> `status`
          
          ## Security Implications:
          - RLS Status: [No Change]
          - Policy Changes: [No]
          - Auth Requirements: [None]
          
          ## Performance Impact:
          - Indexes: [No Change]
          - Triggers: [No Change]
          - Estimated Impact: [None]
          */

ALTER TABLE public.ai_models
RENAME COLUMN model_status TO status;
