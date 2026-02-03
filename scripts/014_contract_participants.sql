-- =============================================
-- CONTRACT_PARTICIPANTS: Tabla bisagra contrato ↔ personas
-- "Cap table" del contrato inmobiliario
-- =============================================

-- Enum para roles en contrato
DO $$ BEGIN
  CREATE TYPE party_role AS ENUM ('PROPIETARIO', 'INQUILINO', 'GARANTE', 'APODERADO', 'USUFRUCTUARIO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para estado de participación
DO $$ BEGIN
  CREATE TYPE participant_status AS ENUM ('PENDING_INVITE', 'INVITED', 'ACTIVE', 'SIGNED', 'REVOKED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear tabla contract_participants
CREATE TABLE IF NOT EXISTS contract_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  party_role party_role NOT NULL,
  share_pct NUMERIC(5,2) CHECK (share_pct IS NULL OR (share_pct > 0 AND share_pct <= 100)),
  
  status participant_status NOT NULL DEFAULT 'PENDING_INVITE',
  invited_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  
  UNIQUE(contract_id, person_id, party_role)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contract_participants_contract ON contract_participants(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_participants_person ON contract_participants(person_id);
CREATE INDEX IF NOT EXISTS idx_contract_participants_role ON contract_participants(party_role);
CREATE INDEX IF NOT EXISTS idx_contract_participants_status ON contract_participants(status);
CREATE INDEX IF NOT EXISTS idx_contract_participants_active ON contract_participants(contract_id) 
  WHERE status IN ('ACTIVE', 'SIGNED');

-- Fixed RAISE statement - use single % for placeholders
CREATE OR REPLACE FUNCTION validate_contract_owner_shares()
RETURNS TRIGGER AS $$
DECLARE
  total_share NUMERIC;
BEGIN
  IF NEW.party_role != 'PROPIETARIO' THEN
    RETURN NEW;
  END IF;
  
  IF NEW.share_pct IS NULL THEN
    RAISE EXCEPTION 'share_pct es obligatorio para participantes con rol PROPIETARIO';
  END IF;
  
  SELECT COALESCE(SUM(share_pct), 0) INTO total_share
  FROM contract_participants
  WHERE contract_id = NEW.contract_id
    AND party_role = 'PROPIETARIO'
    AND status NOT IN ('REVOKED', 'EXPIRED')
    AND id != COALESCE(NEW.id, gen_random_uuid());
  
  total_share := total_share + NEW.share_pct;
  
  IF total_share > 100 THEN
    RAISE EXCEPTION 'La suma de participaciones de propietarios excede 100 porciento (actual: %)', total_share;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_contract_owner_shares ON contract_participants;
CREATE TRIGGER trg_validate_contract_owner_shares
  BEFORE INSERT OR UPDATE ON contract_participants
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_owner_shares();

-- RLS
ALTER TABLE contract_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY contract_participants_admin_all ON contract_participants
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY contract_participants_self_select ON contract_participants
  FOR SELECT
  USING (person_id = auth.uid());

CREATE POLICY contract_participants_coparticipants_select ON contract_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contract_participants cp
      WHERE cp.contract_id = contract_participants.contract_id
        AND cp.person_id = auth.uid()
        AND cp.status IN ('ACTIVE', 'SIGNED')
    )
  );

CREATE OR REPLACE FUNCTION update_contract_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contract_participants_updated_at ON contract_participants;
CREATE TRIGGER trg_contract_participants_updated_at
  BEFORE UPDATE ON contract_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_participants_updated_at();
