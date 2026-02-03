-- Tabla para almacenar histórico de índices de ajuste (ICL, IPC)
CREATE TABLE IF NOT EXISTS indices_ajuste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tipo de índice
  tipo TEXT NOT NULL CHECK (tipo IN ('ICL', 'IPC')),
  
  -- Período
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER NOT NULL CHECK (anio >= 2020),
  
  -- Valor del índice
  valor NUMERIC(10, 4) NOT NULL,
  
  -- Variación mensual y anual (porcentaje)
  variacion_mensual NUMERIC(8, 4),
  variacion_anual NUMERIC(8, 4),
  
  -- Fuente
  fuente TEXT,
  
  UNIQUE(tipo, mes, anio)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_indices_tipo_periodo ON indices_ajuste(tipo, anio, mes);

-- RLS
ALTER TABLE indices_ajuste ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer índices
CREATE POLICY "indices_select_all" ON indices_ajuste
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo admins pueden modificar
CREATE POLICY "admins_indices_all" ON indices_ajuste
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
