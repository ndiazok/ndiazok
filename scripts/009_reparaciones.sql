-- Reparaciones y mantenimiento
-- Registro de trabajos realizados en propiedades

CREATE TABLE IF NOT EXISTS reparaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Propiedad
  propiedad_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE RESTRICT,
  
  -- Solicitante (quien reportó el problema)
  solicitante_id UUID REFERENCES profiles(id),
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Descripción del trabajo
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT, -- plomería, electricidad, pintura, etc.
  urgencia TEXT DEFAULT 'normal' CHECK (urgencia IN ('baja', 'normal', 'alta', 'urgente')),
  
  -- Presupuesto y costo
  presupuesto_estimado NUMERIC(12,2),
  costo_final NUMERIC(12,2),
  -- Changed from moneda enum to TEXT to avoid dependency issues
  moneda TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  
  -- Responsable del pago
  responsable_pago TEXT DEFAULT 'propietario' CHECK (responsable_pago IN ('propietario', 'inquilino', 'compartido')),
  porcentaje_inquilino NUMERIC(5,2) DEFAULT 0, -- Si es compartido
  
  -- Proveedor/Técnico
  proveedor_nombre TEXT,
  proveedor_contacto TEXT,
  
  -- Estado y fechas
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'presupuestado', 'aprobado', 'en_progreso', 'completado', 'cancelado')),
  fecha_aprobacion TIMESTAMPTZ,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  
  -- Aprobación
  aprobado_por UUID REFERENCES profiles(id),
  
  -- Archivos
  fotos_antes TEXT[], -- URLs
  fotos_despues TEXT[],
  factura_url TEXT,
  
  -- Metadata
  notas TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reparaciones_propiedad ON reparaciones(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_reparaciones_estado ON reparaciones(estado);
CREATE INDEX IF NOT EXISTS idx_reparaciones_fecha ON reparaciones(fecha_solicitud);

-- RLS
ALTER TABLE reparaciones ENABLE ROW LEVEL SECURITY;

-- Fixed: using 'role' instead of 'rol'
-- Admins ven todo
CREATE POLICY "reparaciones_admin_all" ON reparaciones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Propietarios ven reparaciones de sus propiedades
CREATE POLICY "reparaciones_propietario_select" ON reparaciones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM propiedades 
      WHERE propiedades.id = reparaciones.propiedad_id
      AND propiedades.propietario_id = auth.uid()
    )
  );

-- Inquilinos ven reparaciones de propiedades donde viven
CREATE POLICY "reparaciones_inquilino_select" ON reparaciones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contratos c
      JOIN propiedades p ON p.id = c.propiedad_id
      WHERE p.id = reparaciones.propiedad_id
      AND c.inquilino_id = auth.uid()
      AND c.estado = 'activo'
    )
  );

-- Profesionales ven reparaciones de propiedades que administran
CREATE POLICY "reparaciones_profesional_select" ON reparaciones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM propiedades 
      WHERE propiedades.id = reparaciones.propiedad_id
      AND propiedades.administrador_id = auth.uid()
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_reparaciones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reparaciones_updated_at ON reparaciones;
CREATE TRIGGER trigger_reparaciones_updated_at
  BEFORE UPDATE ON reparaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_reparaciones_updated_at();
