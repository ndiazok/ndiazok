-- Tabla de liquidaciones a propietarios
CREATE TABLE IF NOT EXISTS liquidaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Propietario
  propietario_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Período de la liquidación
  periodo_desde DATE NOT NULL,
  periodo_hasta DATE NOT NULL,
  
  -- Montos calculados
  total_creditos NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_debitos NUMERIC(14, 2) NOT NULL DEFAULT 0,
  saldo_neto NUMERIC(14, 2) NOT NULL DEFAULT 0,
  
  -- Configuración
  tipo_agrupacion TEXT NOT NULL DEFAULT 'global' CHECK (tipo_agrupacion IN ('propiedad', 'grupo', 'global')),
  propiedad_id UUID REFERENCES propiedades(id), -- Si es por propiedad
  
  -- Estado del proceso
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'generada', 'pagada', 'anulada')),
  
  -- Pago
  fecha_pago DATE,
  metodo_pago TEXT CHECK (metodo_pago IN ('transferencia', 'cheque', 'efectivo')),
  comprobante_pago TEXT,
  
  -- Auditoría
  generada_por UUID REFERENCES profiles(id),
  pagada_por UUID REFERENCES profiles(id),
  
  -- Notas
  notas TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_liquidaciones_propietario ON liquidaciones(propietario_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_periodo ON liquidaciones(periodo_desde, periodo_hasta);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_estado ON liquidaciones(estado);

-- RLS
ALTER TABLE liquidaciones ENABLE ROW LEVEL SECURITY;

-- Admins pueden todo
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

-- Items de liquidación (detalle)
CREATE TABLE IF NOT EXISTS liquidacion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  liquidacion_id UUID NOT NULL REFERENCES liquidaciones(id) ON DELETE CASCADE,
  movimiento_id UUID NOT NULL REFERENCES movimientos(id) ON DELETE RESTRICT,
  
  -- Copia del monto para el detalle
  concepto TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  monto NUMERIC(14, 2) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito'))
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_liquidacion_items_liquidacion ON liquidacion_items(liquidacion_id);

-- RLS
ALTER TABLE liquidacion_items ENABLE ROW LEVEL SECURITY;

-- Admins pueden todo
CREATE POLICY "admins_liquidacion_items_all" ON liquidacion_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Propietarios ven items de sus liquidaciones
CREATE POLICY "propietarios_liquidacion_items_select" ON liquidacion_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM liquidaciones 
      WHERE liquidaciones.id = liquidacion_items.liquidacion_id 
      AND liquidaciones.propietario_id = auth.uid()
    )
  );

-- Agregar FK de liquidacion_id a movimientos
ALTER TABLE movimientos 
  ADD CONSTRAINT fk_movimientos_liquidacion 
  FOREIGN KEY (liquidacion_id) REFERENCES liquidaciones(id);
