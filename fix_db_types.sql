-- REMOVER RESTRIÇÃO DE TIPOS ANTIGOS
-- O Planner novo usa tipos como 'navigate', 'click', 'type', 'press_key'.
-- O banco tem uma restrição que só aceita os antigos 'NAVIGATE', 'DOM_CLICK', etc.
ALTER TABLE extension_commands DROP CONSTRAINT IF EXISTS extension_commands_type_check;