-- Función para crear cuenta corriente automáticamente al crear perfil
CREATE OR REPLACE FUNCTION crear_cuenta_corriente_automatica()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear cuenta según el rol del usuario
  IF NEW.role IN ('inquilino', 'propietario', 'profesional') THEN
    INSERT INTO cuentas_corrientes (titular_id, tipo_cuenta, estado)
    VALUES (NEW.id, NEW.role, 'activa')
    ON CONFLICT (titular_id, tipo_cuenta) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear cuenta corriente
DROP TRIGGER IF EXISTS trigger_crear_cuenta_corriente ON profiles;
CREATE TRIGGER trigger_crear_cuenta_corriente
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION crear_cuenta_corriente_automatica();

-- Función para calcular alquiler ajustado
CREATE OR REPLACE FUNCTION calcular_alquiler_ajustado(
  p_contrato_id UUID,
  p_mes INTEGER,
  p_anio INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  v_contrato RECORD;
  v_monto_base NUMERIC;
  v_indice_actual NUMERIC;
  v_indice_base NUMERIC;
  v_factor NUMERIC;
BEGIN
  -- Obtener datos del contrato
  SELECT * INTO v_contrato FROM contratos WHERE id = p_contrato_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado';
  END IF;
  
  v_monto_base := v_contrato.monto_base;
  
  -- Si es índice fijo, retornar monto base
  IF v_contrato.indice_ajuste = 'fijo' THEN
    RETURN v_monto_base;
  END IF;
  
  -- Obtener índice actual
  SELECT valor INTO v_indice_actual
  FROM indices_ajuste
  WHERE tipo = v_contrato.indice_ajuste
    AND mes = p_mes
    AND anio = p_anio;
  
  -- Obtener índice base (del mes de inicio del contrato)
  SELECT valor INTO v_indice_base
  FROM indices_ajuste
  WHERE tipo = v_contrato.indice_ajuste
    AND mes = EXTRACT(MONTH FROM v_contrato.fecha_inicio)
    AND anio = EXTRACT(YEAR FROM v_contrato.fecha_inicio);
  
  -- Si no hay índices, retornar monto base
  IF v_indice_actual IS NULL OR v_indice_base IS NULL THEN
    RETURN v_monto_base;
  END IF;
  
  -- Calcular factor de ajuste
  v_factor := v_indice_actual / v_indice_base;
  
  RETURN ROUND(v_monto_base * v_factor, 2);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener resumen de cuenta corriente
CREATE OR REPLACE FUNCTION resumen_cuenta_corriente(p_cuenta_id UUID)
RETURNS TABLE (
  total_creditos NUMERIC,
  total_debitos NUMERIC,
  saldo NUMERIC,
  ultimo_movimiento TIMESTAMPTZ,
  cantidad_movimientos BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN m.tipo = 'credito' THEN m.monto ELSE 0 END), 0) as total_creditos,
    COALESCE(SUM(CASE WHEN m.tipo = 'debito' THEN m.monto ELSE 0 END), 0) as total_debitos,
    COALESCE(SUM(CASE WHEN m.tipo = 'credito' THEN m.monto ELSE -m.monto END), 0) as saldo,
    MAX(m.created_at) as ultimo_movimiento,
    COUNT(*) as cantidad_movimientos
  FROM movimientos m
  WHERE m.cuenta_id = p_cuenta_id
    AND m.estado = 'confirmado';
END;
$$ LANGUAGE plpgsql;
