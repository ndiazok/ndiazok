-- Tabla de contratos de alquiler
CREATE TABLE IF NOT EXISTS contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relaciones
  propiedad_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE RESTRICT,
  inquilino_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Fechas del contrato
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  
  -- Condiciones económicas
  monto_base NUMERIC(12, 2) NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
  indice_ajuste TEXT NOT NULL DEFAULT 'ICL' CHECK (indice_ajuste IN ('ICL', 'IPC', 'fijo', 'otro')),
  periodicidad_ajuste INTEGER NOT NULL DEFAULT 12, -- meses entre ajustes
  periodicidad_pago TEXT NOT NULL DEFAULT 'mensual' CHECK (periodicidad_pago IN ('mensual', 'bimestral', 'trimestral')),
  dia_vencimiento INTEGER NOT NULL DEFAULT 10 CHECK (dia_vencimiento BETWEEN 1 AND 28),
  
  -- Depósito y garantía
  deposito_monto NUMERIC(12, 2),
  deposito_moneda TEXT DEFAULT 'ARS',
  garantia_tipo TEXT CHECK (garantia_tipo IN ('garante', 'seguro_caucion', 'deposito', 'otro')),
  garantia_detalle TEXT,
  
  -- Honorarios Sigma (porcentaje sobre alquiler)
  honorarios_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('borrador', 'activo', 'finalizado', 'rescindido')),
  
  -- Notas
  clausulas_especiales TEXT,
  notas_internas TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contratos_propiedad ON contratos(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_contratos_inquilino ON contratos(inquilino_id);
CREATE INDEX IF NOT EXISTS idx_contratos_estado ON contratos(estado);
CREATE INDEX IF NOT EXISTS idx_contratos_fechas ON contratos(fecha_inicio, fecha_fin);

-- RLS
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

-- Admins pueden todo
CREATE POLICY "admins_contratos_all" ON contratos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Inquilinos ven sus contratos
CREATE POLICY "inquilinos_contratos_select" ON contratos
  FOR SELECT
  TO authenticated
  USING (inquilino_id = auth.uid());

-- Propietarios ven contratos de sus propiedades
CREATE POLICY "propietarios_contratos_select" ON contratos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM propiedades 
      WHERE propiedades.id = contratos.propiedad_id 
      AND propiedades.propietario_id = auth.uid()
    )
  );
