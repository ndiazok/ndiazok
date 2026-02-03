-- Items de liquidación
CREATE TABLE IF NOT EXISTS liquidacion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  liquidacion_id UUID NOT NULL REFERENCES liquidaciones(id) ON DELETE CASCADE,
  movimiento_id UUID REFERENCES movimientos(id),
  
  -- Descripción
  concepto TEXT NOT NULL,
  descripcion TEXT,
  
  -- Propiedad relacionada (si aplica)
  propiedad_id UUID REFERENCES propiedades(id),
  
  -- Monto
  monto NUMERIC(12,2) NOT NULL,
  es_ingreso BOOLEAN NOT NULL, -- true = ingreso, false = egreso
  
  -- Orden de aparición
  orden INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_liquidacion_items_liquidacion ON liquidacion_items(liquidacion_id);

-- RLS
ALTER TABLE liquidacion_items ENABLE ROW LEVEL SECURITY;

-- Fixed: using 'role' instead of 'rol'
CREATE POLICY "liquidacion_items_admin_all" ON liquidacion_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "liquidacion_items_owner_select" ON liquidacion_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM liquidaciones 
      WHERE liquidaciones.id = liquidacion_items.liquidacion_id
      AND liquidaciones.propietario_id = auth.uid()
    )
  );
