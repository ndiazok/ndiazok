-- Funciones helper para cálculos financieros

-- Función para calcular el saldo de una cuenta corriente
CREATE OR REPLACE FUNCTION calcular_saldo_cuenta(p_cuenta_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_saldo NUMERIC;
BEGIN
  SELECT COALESCE(SUM(monto * signo), 0)
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
  p_fecha DATE DEFAULT CURRENT_DATE
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
  
  -- Si no hay ajuste pendiente, devolver monto actual
  IF v_contrato.proximo_ajuste IS NULL OR v_contrato.proximo_ajuste > p_fecha THEN
    RETURN v_contrato.monto_alquiler;
  END IF;
  
  -- Obtener índice base (al inicio del contrato)
  SELECT valor INTO v_indice_base
  FROM indices_ajuste
  WHERE tipo = v_contrato.indice_ajuste::text
  AND make_date(anio, mes, 1) <= v_contrato.fecha_inicio
  ORDER BY anio DESC, mes DESC
  LIMIT 1;
  
  -- Obtener índice actual
  SELECT valor INTO v_indice_actual
  FROM indices_ajuste
  WHERE tipo = v_contrato.indice_ajuste::text
  AND make_date(anio, mes, 1) <= p_fecha
  ORDER BY anio DESC, mes DESC
  LIMIT 1;
  
  -- Si no hay índices, devolver monto original
  IF v_indice_base IS NULL OR v_indice_actual IS NULL THEN
    RETURN v_contrato.monto_alquiler;
  END IF;
  
  -- Calcular monto ajustado
  v_monto_ajustado := v_contrato.monto_alquiler * (v_indice_actual / v_indice_base);
  
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
  v_fecha_vencimiento DATE;
  v_periodo_inicio DATE;
  v_periodo_fin DATE;
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
  v_monto := calcular_alquiler_ajustado(p_contrato_id, make_date(p_periodo_anio, p_periodo_mes, 1));
  
  -- Calcular fechas
  v_periodo_inicio := make_date(p_periodo_anio, p_periodo_mes, 1);
  v_periodo_fin := (v_periodo_inicio + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  v_fecha_vencimiento := make_date(p_periodo_anio, p_periodo_mes, v_contrato.dia_vencimiento);
  
  -- Obtener cuenta del inquilino
  SELECT * INTO v_cuenta_inquilino 
  FROM cuentas_corrientes 
  WHERE titular_id = v_contrato.inquilino_id AND tipo_cuenta = 'inquilino';
  
  IF NOT FOUND THEN
    -- Crear cuenta si no existe
    INSERT INTO cuentas_corrientes (titular_id, tipo_cuenta)
    VALUES (v_contrato.inquilino_id, 'inquilino')
    RETURNING * INTO v_cuenta_inquilino;
  END IF;
  
  -- Obtener cuenta del propietario
  SELECT * INTO v_cuenta_propietario 
  FROM cuentas_corrientes 
  WHERE titular_id = v_propiedad.propietario_id AND tipo_cuenta = 'propietario';
  
  IF NOT FOUND THEN
    INSERT INTO cuentas_corrientes (titular_id, tipo_cuenta)
    VALUES (v_propiedad.propietario_id, 'propietario')
    RETURNING * INTO v_cuenta_propietario;
  END IF;
  
  -- Crear movimiento DÉBITO para inquilino (debe pagar)
  INSERT INTO movimientos (
    cuenta_id, tipo, monto, moneda, signo,
    concepto, contrato_id, propiedad_id,
    periodo_inicio, periodo_fin, estado, fecha_vencimiento
  ) VALUES (
    v_cuenta_inquilino.id, 'alquiler', v_monto, v_contrato.moneda, -1,
    'Alquiler ' || TO_CHAR(v_periodo_inicio, 'MM/YYYY') || ' - ' || v_propiedad.direccion,
    p_contrato_id, v_propiedad.id,
    v_periodo_inicio, v_periodo_fin, 'pendiente', v_fecha_vencimiento
  ) RETURNING id INTO v_mov_inquilino_id;
  
  -- Crear movimiento CRÉDITO para propietario (debe recibir)
  INSERT INTO movimientos (
    cuenta_id, tipo, monto, moneda, signo,
    concepto, contrato_id, propiedad_id,
    periodo_inicio, periodo_fin, estado, fecha_vencimiento
  ) VALUES (
    v_cuenta_propietario.id, 'alquiler', v_monto, v_contrato.moneda, 1,
    'Alquiler ' || TO_CHAR(v_periodo_inicio, 'MM/YYYY') || ' - ' || v_propiedad.direccion,
    p_contrato_id, v_propiedad.id,
    v_periodo_inicio, v_periodo_fin, 'pendiente', v_fecha_vencimiento
  ) RETURNING id INTO v_mov_propietario_id;
  
  RETURN v_mov_inquilino_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vista para resumen de cuenta corriente
CREATE OR REPLACE VIEW vista_resumen_cuenta AS
SELECT 
  cc.id AS cuenta_id,
  cc.titular_id,
  cc.tipo_cuenta,
  p.full_name AS titular_nombre,
  p.email AS titular_email,
  calcular_saldo_cuenta(cc.id) AS saldo_actual,
  (
    SELECT COUNT(*) FROM movimientos m 
    WHERE m.cuenta_id = cc.id AND m.estado = 'pendiente'
  ) AS movimientos_pendientes,
  (
    SELECT COALESCE(SUM(monto), 0) FROM movimientos m 
    WHERE m.cuenta_id = cc.id AND m.estado = 'pendiente' AND m.signo = -1
  ) AS total_por_pagar,
  (
    SELECT COALESCE(SUM(monto), 0) FROM movimientos m 
    WHERE m.cuenta_id = cc.id AND m.estado = 'pendiente' AND m.signo = 1
  ) AS total_por_cobrar
FROM cuentas_corrientes cc
JOIN profiles p ON p.id = cc.titular_id
WHERE cc.estado = 'activo';
