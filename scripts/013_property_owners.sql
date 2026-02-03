-- =============================================
-- PROPERTY_OWNERS: Titularidad de propiedades
-- Fuente de verdad para copropietarios
-- =============================================

-- Crear tabla property_owners
CREATE TABLE IF NOT EXISTS property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_pct NUMERIC(5,2) NOT NULL CHECK (share_pct > 0 AND share_pct <= 100),
  is_primary BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(property_id, person_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_property_owners_property ON property_owners(property_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_person ON property_owners(person_id);
CREATE INDEX IF NOT EXISTS idx_property_owners_active ON property_owners(property_id) WHERE active = true;

-- Fixed RAISE EXCEPTION syntax - use single % for format specifier
CREATE OR REPLACE FUNCTION validate_property_ownership_sum()
RETURNS TRIGGER AS $$
DECLARE
  total_share NUMERIC;
BEGIN
  SELECT COALESCE(SUM(share_pct), 0) INTO total_share
  FROM property_owners
  WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    AND active = true
    AND id != COALESCE(NEW.id, OLD.id);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.active = true THEN
      total_share := total_share + NEW.share_pct;
      IF total_share > 100 THEN
        RAISE EXCEPTION 'La suma de participaciones excede 100%% (actual: %)', total_share;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger de validación
DROP TRIGGER IF EXISTS trg_validate_ownership_sum ON property_owners;
CREATE TRIGGER trg_validate_ownership_sum
  BEFORE INSERT OR UPDATE OR DELETE ON property_owners
  FOR EACH ROW
  EXECUTE FUNCTION validate_property_ownership_sum();

-- RLS
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;

-- Admins: acceso total
CREATE POLICY property_owners_admin_all ON property_owners
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Propietarios: ver sus propias participaciones
CREATE POLICY property_owners_owner_select ON property_owners
  FOR SELECT
  USING (person_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_property_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_property_owners_updated_at ON property_owners;
CREATE TRIGGER trg_property_owners_updated_at
  BEFORE UPDATE ON property_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_property_owners_updated_at();
