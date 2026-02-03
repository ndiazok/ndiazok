-- Funciones helper para cálculos financieros

-- Función para calcular el saldo de una cuenta corriente
CREATE OR REPLACE FUNCTION calcular_saldo_cuenta(p_cuenta_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_saldo NUMERIC;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN tipo IN ('alquiler', 'deposito') AND estado = 'pagado' THEN monto
      WHEN tipo IN ('comision', 'reparacion', 'expensas', 'servicios') AND estado = 'pagado' THEN -monto
      ELSE 0
    END
  ), 0)
  INTO v_saldo
  FROM movimientos
  WHERE cuenta_id = p_cuenta_id
  AND estado IN ('pagado', 'pendiente');
  
  RETURN v_saldo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el próximo monto de alquiler ajustado
CREATE OR REPLACE FUNCTION calcular_alquiler_ajustado(
  p_contrato_id UUID,
  p_mes INTEGER,
  p_anio INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  v_contrato RECORD;
  v_indice_base NUMERIC;
  v_indice_actual NUMERIC;
  v_monto_ajustado NUMERIC;
BEGIN
  -- Obtener datos del contrato
  SELECT * INTO v_contrato FROM contratos WHERE id = p_contrato_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Obtener índice base (al inicio del contrato)
  SELECT valor INTO v_indice_base
  FROM indices_ajuste
  WHERE tipo = v_contrato.indice_ajuste
  AND (anio < EXTRACT(YEAR FROM v_contrato.fecha_inicio) 
       OR (anio = EXTRACT(YEAR FROM v_contrato.fecha_inicio) 
           AND mes <= EXTRACT(MONTH FROM v_contrato.fecha_inicio)))
  ORDER BY anio DESC, mes DESC
  LIMIT 1;
  
  -- Obtener índice actual
  SELECT valor INTO v_indice_actual
  FROM indices_ajuste
  WHERE tipo = v_contrato.indice_ajuste
  AND (anio < p_anio OR (anio = p_anio AND mes <= p_mes))
  ORDER BY anio DESC, mes DESC
  LIMIT 1;
  
  -- Si no hay índices, devolver monto original
  IF v_indice_base IS NULL OR v_indice_actual IS NULL THEN
    RETURN v_contrato.monto_base;
  END IF;
  
  -- Calcular monto ajustado
  v_monto_ajustado := v_contrato.monto_base * (v_indice_actual / v_indice_base);
  
  RETURN ROUND(v_monto_ajustado, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear un movimiento de alquiler mensual
CREATE OR REPLACE FUNCTION crear_movimiento_alquiler(
  p_contrato_id UUID,
  p_periodo_mes INTEGER,
  p_periodo_anio INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_contrato RECORD;
  v_cuenta_inquilino RECORD;
  v_cuenta_propietario RECORD;
  v_propiedad RECORD;
  v_monto NUMERIC;
  v_mov_inquilino_id UUID;
  v_mov_propietario_id UUID;
BEGIN
  -- Obtener contrato
  SELECT * INTO v_contrato FROM contratos WHERE id = p_contrato_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado';
  END IF;
  
  -- Obtener propiedad
  SELECT * INTO v_propiedad FROM propiedades WHERE id = v_contrato.propiedad_id;
  
  -- Calcular monto (con ajuste si corresponde)
  v_monto := calcular_alquiler_ajustado(p_contrato_id, p_periodo_mes, p_periodo_anio);
  
  -- Obtener cuenta del inquilino
  SELECT * INTO v_cuenta_inquilino 
  FROM cuentas_corrientes 
  WHERE titular_id = v_contrato.inquilino_id AND tipo_cuenta = 'inquilino';
  
  IF NOT FOUND THEN
    -- Crear cuenta si no existe
    INSERT INTO cuentas_corrientes (titular_id, tipo_cuenta, estado)
    VALUES (v_contrato.inquilino_id, 'inquilino', 'activa')
    RETURNING * INTO v_cuenta_inquilino;
  END IF;
  
  -- Obtener cuenta del propietario
  SELECT * INTO v_cuenta_propietario 
  FROM cuentas_corrientes 
  WHERE titular_id = v_propiedad.propietario_id AND tipo_cuenta = 'propietario';
  
  IF NOT FOUND THEN
    INSERT INTO cuentas_corrientes (titular_id, tipo_cuenta, estado)
    VALUES (v_propiedad.propietario_id, 'propietario', 'activa')
    RETURNING * INTO v_cuenta_propietario;
  END IF;
  
  -- Crear movimiento para inquilino (débito - debe pagar)
  INSERT INTO movimientos (
    cuenta_id, tipo, monto, concepto, contrato_id, 
    periodo_mes, periodo_anio, estado
  ) VALUES (
    v_cuenta_inquilino.id, 'alquiler', v_monto, 
    'Alquiler ' || LPAD(p_periodo_mes::TEXT, 2, '0') || '/' || p_periodo_anio || ' - ' || v_propiedad.direccion,
    p_contrato_id, p_periodo_mes, p_periodo_anio, 'pendiente'
  ) RETURNING id INTO v_mov_inquilino_id;
  
  -- Crear movimiento para propietario (crédito - debe recibir)
  INSERT INTO movimientos (
    cuenta_id, tipo, monto, concepto, contrato_id, 
    periodo_mes, periodo_anio, estado, movimiento_relacionado_id
  ) VALUES (
    v_cuenta_propietario.id, 'alquiler', v_monto, 
    'Alquiler ' || LPAD(p_periodo_mes::TEXT, 2, '0') || '/' || p_periodo_anio || ' - ' || v_propiedad.direccion,
    p_contrato_id, p_periodo_mes, p_periodo_anio, 'pendiente', v_mov_inquilino_id
  ) RETURNING id INTO v_mov_propietario_id;
  
  -- Actualizar referencia en el movimiento del inquilino
  UPDATE movimientos SET movimiento_relacionado_id = v_mov_propietario_id WHERE id = v_mov_inquilino_id;
  
  RETURN v_mov_inquilino_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vista para resumen de cuenta corriente
DROP VIEW IF EXISTS vista_resumen_cuenta;
CREATE VIEW vista_resumen_cuenta AS
SELECT 
  cc.id AS cuenta_id,
  cc.titular_id,
  cc.tipo_cuenta,
  p.full_name AS titular_nombre,
  p.email AS titular_email,
  cc.saldo_actual,
  (
    SELECT COUNT(*) FROM movimientos m 
    WHERE m.cuenta_id = cc.id AND m.estado = 'pendiente'
  ) AS movimientos_pendientes,
  (
    SELECT COALESCE(SUM(monto), 0) FROM movimientos m 
    WHERE m.cuenta_id = cc.id AND m.estado = 'pendiente' AND m.tipo IN ('alquiler', 'deposito')
  ) AS total_por_cobrar,
  (
    SELECT COALESCE(SUM(monto), 0) FROM movimientos m 
    WHERE m.cuenta_id = cc.id AND m.estado = 'pendiente' AND m.tipo IN ('comision', 'reparacion', 'expensas', 'servicios')
  ) AS total_por_pagar
FROM cuentas_corrientes cc
JOIN profiles p ON p.id = cc.titular_id
WHERE cc.estado = 'activa';
