-- =============================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- Mover propietario_id de propiedades a property_owners
-- Mover inquilino_id de contratos a contract_participants
-- =============================================

-- 1. Migrar propietarios existentes a property_owners
INSERT INTO property_owners (property_id, person_id, share_pct, is_primary, active)
SELECT 
  id AS property_id,
  propietario_id AS person_id,
  100.00 AS share_pct, -- Por defecto 100% si es único propietario
  true AS is_primary,
  true AS active
FROM propiedades
WHERE propietario_id IS NOT NULL
ON CONFLICT (property_id, person_id) DO NOTHING;

-- 2. Migrar inquilinos existentes a contract_participants
INSERT INTO contract_participants (contract_id, person_id, party_role, status)
SELECT 
  id AS contract_id,
  inquilino_id AS person_id,
  'INQUILINO' AS party_role,
  CASE 
    WHEN estado = 'activo' THEN 'ACTIVE'::participant_status
    WHEN estado = 'finalizado' THEN 'EXPIRED'::participant_status
    ELSE 'PENDING_INVITE'::participant_status
  END AS status
FROM contratos
WHERE inquilino_id IS NOT NULL
ON CONFLICT (contract_id, person_id, party_role) DO NOTHING;

-- 3. Ejecutar auto-asignación de propietarios para contratos existentes
-- (Esto insertará los propietarios en contract_participants)
DO $$
DECLARE
  contract_record RECORD;
BEGIN
  FOR contract_record IN
    SELECT id, propiedad_id FROM contratos WHERE propiedad_id IS NOT NULL
  LOOP
    -- Insertar propietarios de la propiedad
    INSERT INTO contract_participants (contract_id, person_id, party_role, share_pct, status, notes)
    SELECT 
      contract_record.id,
      po.person_id,
      'PROPIETARIO',
      po.share_pct,
      'ACTIVE',
      'Migrado desde datos existentes'
    FROM property_owners po
    WHERE po.property_id = contract_record.propiedad_id AND po.active = true
    ON CONFLICT (contract_id, person_id, party_role) DO NOTHING;
  END LOOP;
END $$;

-- 4. Nota: NO eliminamos las columnas propietario_id e inquilino_id todavía
-- Se pueden deprecar gradualmente después de verificar que todo funciona
-- ALTER TABLE propiedades DROP COLUMN IF EXISTS propietario_id;
-- ALTER TABLE contratos DROP COLUMN IF EXISTS inquilino_id;
