-- Tabla de liquidaciones (cierres de cuenta para propietarios)
CREATE TABLE IF NOT EXISTS liquidaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Propietario
  propietario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Período
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  
  -- Totales
  total_ingresos NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_egresos NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_neto NUMERIC(12, 2) NOT NULL DEFAULT 0,
  moneda moneda NOT NULL DEFAULT 'ARS',
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'generada', 'enviada', 'pagada', 'anulada')),
  
  -- Fechas
  fecha_generacion TIMESTAMPTZ,
  fecha_envio TIMESTAMPTZ,
  fecha_pago TIMESTAMPTZ,
  
  -- Pago
  metodo_pago TEXT,
  comprobante_pago_url TEXT,
  
  -- PDF generado
  pdf_url TEXT,
  
  -- Metadata
  generada_por UUID REFERENCES profiles(id),
  notas TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_liquidaciones_propietario ON liquidaciones(propietario_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_periodo ON liquidaciones(periodo_inicio, periodo_fin);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_estado ON liquidaciones(estado);

-- RLS
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;

-- Fixed: using 'role' instead of 'rol'
-- Admins ven todo
CREATE POLICY "admins_liquidaciones_all" ON liquidaciones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Propietarios ven sus liquidaciones
CREATE POLICY "propietarios_liquidaciones_select" ON liquidaciones
  FOR SELECT
  TO authenticated
  USING (propietario_id = auth.uid());
