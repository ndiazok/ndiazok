-- Tabla de movimientos (el corazón del sistema financiero)
-- Cada movimiento tiene origen, destino, motivo, fecha y usuario que lo generó
CREATE TABLE IF NOT EXISTS movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Cuenta afectada
  cuenta_id UUID NOT NULL REFERENCES cuentas_corrientes(id) ON DELETE RESTRICT,
  
  -- Tipo de movimiento
  tipo TEXT NOT NULL CHECK (tipo IN ('debito', 'credito')),
  
  -- Monto (siempre positivo, el tipo indica si suma o resta)
  monto NUMERIC(14, 2) NOT NULL CHECK (monto > 0),
  
  -- Concepto del movimiento
  concepto TEXT NOT NULL CHECK (concepto IN (
    'alquiler',
    'pago_alquiler',
    'honorarios_sigma',
    'expensas',
    'reparacion',
    'deposito',
    'devolucion_deposito',
    'ajuste',
    'compensacion',
    'liquidacion',
    'pago_liquidacion',
    'adelanto',
    'otro'
  )),
  
  -- Descripción detallada
  descripcion TEXT NOT NULL,
  
  -- Referencias opcionales para trazabilidad
  contrato_id UUID REFERENCES contratos(id),
  liquidacion_id UUID, -- Se agrega FK después de crear tabla liquidaciones
  reparacion_id UUID,  -- Se agrega FK después de crear tabla reparaciones
  
  -- Movimiento relacionado (para débitos/créditos cruzados)
  movimiento_relacionado_id UUID REFERENCES movimientos(id),
  
  -- Período al que corresponde (para alquileres)
  periodo_mes INTEGER CHECK (periodo_mes BETWEEN 1 AND 12),
  periodo_anio INTEGER CHECK (periodo_anio >= 2020),
  
  -- Auditoría
  creado_por UUID NOT NULL REFERENCES profiles(id),
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'confirmado' CHECK (estado IN ('pendiente', 'confirmado', 'anulado')),
  anulado_motivo TEXT,
  anulado_por UUID REFERENCES profiles(id),
  anulado_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta ON movimientos(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_concepto ON movimientos(concepto);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(created_at);
CREATE INDEX IF NOT EXISTS idx_movimientos_contrato ON movimientos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_periodo ON movimientos(periodo_anio, periodo_mes);
CREATE INDEX IF NOT EXISTS idx_movimientos_estado ON movimientos(estado);

-- RLS
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;

-- Admins pueden todo
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

-- Función para actualizar saldo de cuenta corriente
CREATE OR REPLACE FUNCTION actualizar_saldo_cuenta()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.estado = 'confirmado' THEN
    -- Crédito suma, débito resta
    UPDATE cuentas_corrientes
    SET 
      saldo_actual = saldo_actual + CASE 
        WHEN NEW.tipo = 'credito' THEN NEW.monto 
        ELSE -NEW.monto 
      END,
      updated_at = NOW()
    WHERE id = NEW.cuenta_id;
  END IF;
  
  -- Si se anula un movimiento, revertir el saldo
  IF TG_OP = 'UPDATE' AND OLD.estado = 'confirmado' AND NEW.estado = 'anulado' THEN
    UPDATE cuentas_corrientes
    SET 
      saldo_actual = saldo_actual - CASE 
        WHEN NEW.tipo = 'credito' THEN NEW.monto 
        ELSE -NEW.monto 
      END,
      updated_at = NOW()
    WHERE id = NEW.cuenta_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS trigger_actualizar_saldo ON movimientos;
CREATE TRIGGER trigger_actualizar_saldo
  AFTER INSERT OR UPDATE ON movimientos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_saldo_cuenta();
