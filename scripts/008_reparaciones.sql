-- Tabla de reparaciones y gastos
CREATE TABLE IF NOT EXISTS reparaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Propiedad afectada
  propiedad_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE RESTRICT,
  
  -- Profesional asignado (opcional)
  profesional_id UUID REFERENCES profiles(id),
  
  -- Descripción del trabajo
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  
  -- Costo
  monto_estimado NUMERIC(12, 2),
  monto_final NUMERIC(12, 2),
  
  -- Quién paga
  pagado_por TEXT NOT NULL CHECK (pagado_por IN ('inquilino', 'propietario', 'sigma')),
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  
  -- Fechas
  fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_programada DATE,
  fecha_completada DATE,
  
  -- Recibo/comprobante
  recibo_firmado BOOLEAN DEFAULT FALSE,
  recibo_url TEXT,
  
  -- Financiamiento (si se descuenta del alquiler)
  financiado BOOLEAN DEFAULT FALSE,
  cuotas INTEGER DEFAULT 1,
  
  -- Notas
  notas TEXT,
  
  -- Auditoría
  creado_por UUID NOT NULL REFERENCES profiles(id),
  aprobado_por UUID REFERENCES profiles(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_reparaciones_propiedad ON reparaciones(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_reparaciones_profesional ON reparaciones(profesional_id);
CREATE INDEX IF NOT EXISTS idx_reparaciones_estado ON reparaciones(estado);
CREATE INDEX IF NOT EXISTS idx_reparaciones_pagado_por ON reparaciones(pagado_por);

-- RLS
ALTER TABLE reparaciones ENABLE ROW LEVEL SECURITY;

-- Admins pueden todo
CREATE POLICY "admins_reparaciones_all" ON reparaciones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Profesionales ven sus reparaciones asignadas
CREATE POLICY "profesionales_reparaciones_select" ON reparaciones
  FOR SELECT
  TO authenticated
  USING (profesional_id = auth.uid());

-- Profesionales pueden actualizar sus reparaciones
CREATE POLICY "profesionales_reparaciones_update" ON reparaciones
  FOR UPDATE
  TO authenticated
  USING (profesional_id = auth.uid())
  WITH CHECK (profesional_id = auth.uid());

-- Propietarios ven reparaciones de sus propiedades
CREATE POLICY "propietarios_reparaciones_select" ON reparaciones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM propiedades 
      WHERE propiedades.id = reparaciones.propiedad_id 
      AND propiedades.propietario_id = auth.uid()
    )
  );

-- Inquilinos ven reparaciones de propiedades donde tienen contrato
CREATE POLICY "inquilinos_reparaciones_select" ON reparaciones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contratos 
      WHERE contratos.propiedad_id = reparaciones.propiedad_id 
      AND contratos.inquilino_id = auth.uid()
      AND contratos.estado = 'activo'
    )
  );

-- Agregar FK de reparacion_id a movimientos
-- Removed FK addition here, moved to separate script 009_foreign_keys.sql
