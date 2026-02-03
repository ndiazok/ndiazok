-- Tabla de índices de ajuste históricos
-- Almacena valores de ICL, Casa Propia, etc.

CREATE TABLE IF NOT EXISTS indices_ajuste (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  tipo indice_ajuste NOT NULL,
  fecha DATE NOT NULL,
  valor NUMERIC(12,6) NOT NULL, -- Valor del índice
  variacion_mensual NUMERIC(8,4), -- Variación % respecto al mes anterior
  variacion_anual NUMERIC(8,4),  -- Variación % respecto al mismo mes año anterior
  
  -- Fuente
  fuente TEXT, -- BCRA, Casa Propia, etc.
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un valor por índice por fecha
  CONSTRAINT unique_indice_fecha UNIQUE (tipo, fecha)
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_indices_tipo ON indices_ajuste(tipo);
CREATE INDEX IF NOT EXISTS idx_indices_fecha ON indices_ajuste(fecha DESC);

-- RLS - Los índices son públicos (lectura)
ALTER TABLE indices_ajuste ENABLE ROW LEVEL SECURITY;

CREATE POLICY "indices_select_all" ON indices_ajuste
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo admins pueden modificar
CREATE POLICY "indices_admin_all" ON indices_ajuste
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.rol = 'admin'
    )
  );
