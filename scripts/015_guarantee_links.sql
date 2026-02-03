-- =============================================
-- GUARANTEE_LINKS: Relación garante → inquilino
-- Escalable: "este garante garantiza a este inquilino en este contrato"
-- =============================================

-- Enum para tipo de garantía
DO $$ BEGIN
  CREATE TYPE guarantee_type AS ENUM ('SOLIDARIO', 'FIADOR', 'SEGURO_CAUCION', 'GARANTIA_PROPIETARIA', 'OTRO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para estado de garantía
DO $$ BEGIN
  CREATE TYPE guarantee_status AS ENUM ('PENDING_DOCS', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SIGNED', 'EXPIRED', 'RELEASED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear tabla guarantee_links
CREATE TABLE IF NOT EXISTS guarantee_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tenant_person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  guarantor_person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  guarantee_type guarantee_type NOT NULL DEFAULT 'SOLIDARIO',
  status guarantee_status NOT NULL DEFAULT 'PENDING_DOCS',
  
  -- Datos de la garantía
  property_address TEXT, -- Si es garantía propietaria
  property_value NUMERIC(15,2),
  income_verified BOOLEAN DEFAULT false,
  income_amount NUMERIC(15,2),
  
  -- Documentación
  docs_submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,
  
  -- Firmas
  signed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  release_reason TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  
  -- Un garante solo puede garantizar a un inquilino una vez por contrato
  UNIQUE(contract_id, tenant_person_id, guarantor_person_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_guarantee_links_contract ON guarantee_links(contract_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_links_tenant ON guarantee_links(tenant_person_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_links_guarantor ON guarantee_links(guarantor_person_id);
CREATE INDEX IF NOT EXISTS idx_guarantee_links_status ON guarantee_links(status);

-- RLS
ALTER TABLE guarantee_links ENABLE ROW LEVEL SECURITY;

-- Admins: acceso total
CREATE POLICY guarantee_links_admin_all ON guarantee_links
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Inquilinos: ver garantías de sus contratos
CREATE POLICY guarantee_links_tenant_select ON guarantee_links
  FOR SELECT
  USING (tenant_person_id = auth.uid());

-- Garantes: ver sus propias garantías
CREATE POLICY guarantee_links_guarantor_select ON guarantee_links
  FOR SELECT
  USING (guarantor_person_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_guarantee_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_guarantee_links_updated_at ON guarantee_links;
CREATE TRIGGER trg_guarantee_links_updated_at
  BEFORE UPDATE ON guarantee_links
  FOR EACH ROW
  EXECUTE FUNCTION update_guarantee_links_updated_at();
