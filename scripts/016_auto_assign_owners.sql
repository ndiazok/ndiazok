-- =============================================
-- FUNCIONES DE AUTO-ASIGNACIÓN
-- Propietarios se asignan automáticamente al crear contrato
-- =============================================

-- Función para auto-asignar propietarios al contrato
CREATE OR REPLACE FUNCTION auto_assign_contract_owners()
RETURNS TRIGGER AS $$
DECLARE
  owner_record RECORD;
  total_share NUMERIC := 0;
BEGIN
  -- Solo ejecutar si se asigna una propiedad
  IF NEW.propiedad_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Si la propiedad cambió (UPDATE) o es nueva (INSERT)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.propiedad_id IS DISTINCT FROM NEW.propiedad_id) THEN
    
    -- Si es UPDATE, primero revocar propietarios anteriores
    IF TG_OP = 'UPDATE' AND OLD.propiedad_id IS NOT NULL THEN
      UPDATE contract_participants
      SET status = 'REVOKED',
          revoked_at = now(),
          revoked_reason = 'Cambio de propiedad en contrato'
      WHERE contract_id = NEW.id
        AND party_role = 'PROPIETARIO'
        AND status NOT IN ('REVOKED', 'EXPIRED');
    END IF;
    
    -- Verificar que la propiedad tenga propietarios con 100%
    SELECT COALESCE(SUM(share_pct), 0) INTO total_share
    FROM property_owners
    WHERE property_id = NEW.propiedad_id AND active = true;
    
    -- Fixed RAISE syntax - use single % for placeholder
    IF total_share != 100 THEN
      RAISE WARNING 'La propiedad no tiene propietarios que sumen 100 porciento (actual: %). Asignación parcial.', total_share;
    END IF;
    
    -- Insertar propietarios activos de la propiedad
    FOR owner_record IN
      SELECT person_id, share_pct
      FROM property_owners
      WHERE property_id = NEW.propiedad_id AND active = true
    LOOP
      INSERT INTO contract_participants (
        contract_id,
        person_id,
        party_role,
        share_pct,
        status,
        notes,
        created_by
      ) VALUES (
        NEW.id,
        owner_record.person_id,
        'PROPIETARIO',
        owner_record.share_pct,
        'ACTIVE', -- Propietarios entran activos automáticamente
        'Auto-asignado desde property_owners',
        auth.uid()
      )
      ON CONFLICT (contract_id, person_id, party_role) 
      DO UPDATE SET
        share_pct = EXCLUDED.share_pct,
        status = 'ACTIVE',
        updated_at = now();
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-asignación
DROP TRIGGER IF EXISTS trg_auto_assign_contract_owners ON contratos;
CREATE TRIGGER trg_auto_assign_contract_owners
  AFTER INSERT OR UPDATE OF propiedad_id ON contratos
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_contract_owners();

-- =============================================
-- FUNCIÓN HELPER: Agregar inquilino a contrato
-- (Se llama desde el workflow, no automático)
-- =============================================

CREATE OR REPLACE FUNCTION add_tenant_to_contract(
  p_contract_id UUID,
  p_person_id UUID,
  p_status participant_status DEFAULT 'PENDING_INVITE'
)
RETURNS UUID AS $$
DECLARE
  v_participant_id UUID;
BEGIN
  INSERT INTO contract_participants (
    contract_id,
    person_id,
    party_role,
    status,
    created_by
  ) VALUES (
    p_contract_id,
    p_person_id,
    'INQUILINO',
    p_status,
    auth.uid()
  )
  ON CONFLICT (contract_id, person_id, party_role) 
  DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id INTO v_participant_id;
  
  RETURN v_participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN HELPER: Agregar garante
-- =============================================

CREATE OR REPLACE FUNCTION add_guarantor_to_contract(
  p_contract_id UUID,
  p_tenant_person_id UUID,
  p_guarantor_person_id UUID,
  p_guarantee_type guarantee_type DEFAULT 'SOLIDARIO'
)
RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
  v_participant_id UUID;
BEGIN
  -- Verificar que el inquilino esté en el contrato
  IF NOT EXISTS (
    SELECT 1 FROM contract_participants
    WHERE contract_id = p_contract_id
      AND person_id = p_tenant_person_id
      AND party_role = 'INQUILINO'
      AND status NOT IN ('REVOKED', 'EXPIRED')
  ) THEN
    RAISE EXCEPTION 'El inquilino no está activo en este contrato';
  END IF;
  
  -- Crear link de garantía
  INSERT INTO guarantee_links (
    contract_id,
    tenant_person_id,
    guarantor_person_id,
    guarantee_type,
    created_by
  ) VALUES (
    p_contract_id,
    p_tenant_person_id,
    p_guarantor_person_id,
    p_guarantee_type,
    auth.uid()
  )
  ON CONFLICT (contract_id, tenant_person_id, guarantor_person_id)
  DO UPDATE SET
    guarantee_type = EXCLUDED.guarantee_type,
    status = 'PENDING_DOCS',
    updated_at = now()
  RETURNING id INTO v_link_id;
  
  -- También agregar como participante del contrato
  INSERT INTO contract_participants (
    contract_id,
    person_id,
    party_role,
    status,
    created_by
  ) VALUES (
    p_contract_id,
    p_guarantor_person_id,
    'GARANTE',
    'PENDING_INVITE',
    auth.uid()
  )
  ON CONFLICT (contract_id, person_id, party_role) DO NOTHING;
  
  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VISTA: Resumen de participantes por contrato
-- =============================================

CREATE OR REPLACE VIEW vista_contrato_participantes AS
SELECT 
  c.id AS contract_id,
  c.estado AS contract_status,
  p.direccion AS property_address,
  cp.id AS participant_id,
  cp.party_role,
  cp.share_pct,
  cp.status AS participant_status,
  cp.signed_at,
  pr.id AS person_id,
  pr.full_name,
  pr.email,
  pr.phone
FROM contratos c
JOIN contract_participants cp ON cp.contract_id = c.id
JOIN profiles pr ON pr.id = cp.person_id
LEFT JOIN propiedades p ON p.id = c.propiedad_id
WHERE cp.status NOT IN ('REVOKED', 'EXPIRED')
ORDER BY c.id, 
  CASE cp.party_role 
    WHEN 'PROPIETARIO' THEN 1 
    WHEN 'INQUILINO' THEN 2 
    WHEN 'GARANTE' THEN 3 
    ELSE 4 
  END;
