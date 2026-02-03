-- Tabla de propiedades/inmuebles
CREATE TABLE IF NOT EXISTS propiedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Propietario (referencia a profiles)
  propietario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Administrador (profesional que gestiona la propiedad)
  administrador_id UUID REFERENCES profiles(id),
  
  -- Datos del inmueble
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  provincia TEXT NOT NULL,
  codigo_postal TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('departamento', 'casa', 'local', 'oficina', 'cochera', 'deposito', 'terreno', 'otro')),
  
  -- Características
  metros_cuadrados NUMERIC(10, 2),
  ambientes INTEGER,
  dormitorios INTEGER,
  banos INTEGER,
  cochera BOOLEAN DEFAULT FALSE,
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'alquilado', 'en_reparacion', 'no_disponible')),
  
  -- Descripción y notas
  descripcion TEXT,
  notas_internas TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_propiedades_propietario ON propiedades(propietario_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_estado ON propiedades(estado);
CREATE INDEX IF NOT EXISTS idx_propiedades_administrador ON propiedades(administrador_id);

-- RLS
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;

-- Fixed: using 'role' instead of 'rol' to match profiles table schema
-- Admins pueden ver todo
CREATE POLICY "admins_propiedades_all" ON propiedades
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Propietarios ven sus propiedades
CREATE POLICY "propietarios_propiedades_select" ON propiedades
  FOR SELECT
  TO authenticated
  USING (propietario_id = auth.uid());

-- Profesionales ven propiedades que administran
CREATE POLICY "profesionales_propiedades_select" ON propiedades
  FOR SELECT
  TO authenticated
  USING (administrador_id = auth.uid());

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_propiedades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_propiedades_updated_at ON propiedades;
CREATE TRIGGER trigger_propiedades_updated_at
  BEFORE UPDATE ON propiedades
  FOR EACH ROW
  EXECUTE FUNCTION update_propiedades_updated_at();
