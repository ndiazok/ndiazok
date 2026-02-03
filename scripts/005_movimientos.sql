-- Tabla de movimientos financieros
CREATE TABLE IF NOT EXISTS movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Cuenta corriente
  cuenta_id UUID NOT NULL REFERENCES cuentas_corrientes(id) ON DELETE RESTRICT,
  
  -- Tipo de movimiento
  tipo TEXT NOT NULL CHECK (tipo IN ('alquiler', 'expensas', 'servicios', 'reparacion', 'comision', 'ajuste', 'deposito', 'devolucion', 'otro')),
  
  -- Monto (siempre positivo, el signo indica débito/crédito)
  monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
  moneda moneda NOT NULL DEFAULT 'ARS',
  signo INTEGER NOT NULL CHECK (signo IN (-1, 1)), -- -1 = débito, 1 = crédito
  
  -- Descripción
  concepto TEXT NOT NULL,
  descripcion TEXT,
  
  -- Referencias
  contrato_id UUID REFERENCES contratos(id),
  propiedad_id UUID REFERENCES propiedades(id),
  liquidacion_id UUID, -- Se agregará FK después
  reparacion_id UUID, -- Se agregará FK después
  
  -- Período que cubre (para alquileres, expensas, etc.)
  periodo_inicio DATE,
  periodo_fin DATE,
  
  -- Estado del movimiento
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'anulado')),
  fecha_vencimiento DATE,
  fecha_pago TIMESTAMPTZ,
  
  -- Comprobante
  comprobante_url TEXT,
  numero_comprobante TEXT,
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  notas TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON movimientos(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_estado ON movimientos(estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(created_at);
CREATE INDEX IF NOT EXISTS idx_movimientos_contrato ON movimientos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_propiedad ON movimientos(propiedad_id);

-- RLS
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;

-- Fixed: using 'role' instead of 'rol'
-- Admins ven todo
CREATE POLICY "admins_movimientos_all" ON movimientos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Usuarios ven movimientos de sus cuentas
CREATE POLICY "usuarios_movimientos_select" ON movimientos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cuentas_corrientes 
      WHERE cuentas_corrientes.id = movimientos.cuenta_id 
      AND cuentas_corrientes.titular_id = auth.uid()
    )
  );

-- Profesionales ven movimientos de propiedades que administran
CREATE POLICY "profesionales_movimientos_select" ON movimientos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM propiedades 
      WHERE propiedades.id = movimientos.propiedad_id 
      AND propiedades.administrador_id = auth.uid()
    )
  );
