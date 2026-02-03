-- Make inquilino_id nullable since we now use contract_participants
ALTER TABLE contratos ALTER COLUMN inquilino_id DROP NOT NULL;
