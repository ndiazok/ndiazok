-- Tabla de cuentas corrientes (una por persona y rol)
CREATE TABLE IF NOT EXISTS cuentas_corrientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Titular de la cuenta
  titular_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Tipo de cuenta según rol
  tipo_cuenta TEXT NOT NULL CHECK (tipo_cuenta IN ('inquilino', 'propietario', 'profesional', 'sigma')),
  
  -- Saldo calculado (se actualiza con cada movimiento)
  saldo_actual NUMERIC(14, 2) NOT NULL DEFAULT 0,
  
  -- Estado
  estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'suspendida', 'cerrada')),
  
  -- Restricción: una cuenta por tipo por persona
  UNIQUE(titular_id, tipo_cuenta)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cuentas_titular ON cuentas_corrientes(titular_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_tipo ON cuentas_corrientes(tipo_cuenta);

-- RLS
ALTER TABLE cuentas_corrientes ENABLE ROW LEVEL SECURITY;

-- Admins pueden todo
CREATE POLICY "admins_cuentas_all" ON cuentas_corrientes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Usuarios ven sus propias cuentas
CREATE POLICY "usuarios_cuentas_select" ON cuentas_corrientes
  FOR SELECT
  TO authenticated
  USING (titular_id = auth.uid());
