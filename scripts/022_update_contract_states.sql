-- Actualizar estados de contratos según modelo de negocio
-- Estados: borrador, activo, finalizado
-- Un contrato "activo" puede estar vigente (fecha_fin >= hoy) o vencido (fecha_fin < hoy)

-- 1. Actualizar cualquier contrato con estado 'rescindido' a 'finalizado'
UPDATE contratos 
SET estado = 'finalizado' 
WHERE estado = 'rescindido';

-- 2. Actualizar el CHECK constraint para solo permitir los 3 estados
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS contratos_estado_check;
ALTER TABLE contratos ADD CONSTRAINT contratos_estado_check 
  CHECK (estado IN ('borrador', 'activo', 'finalizado'));

-- 3. Crear vista para contratos con información de vigencia y alertas
DROP VIEW IF EXISTS vista_contratos_vigencia;
CREATE VIEW vista_contratos_vigencia AS
SELECT 
  c.*,
  p.direccion,
  p.ciudad,
  p.tipo as tipo_propiedad,
  -- Determinar si está vigente (solo para contratos activos)
  CASE 
    WHEN c.estado = 'activo' AND c.fecha_fin >= CURRENT_DATE THEN true
    ELSE false
  END as vigente,
  -- Determinar si está vencido (activo pero fecha pasada)
  CASE 
    WHEN c.estado = 'activo' AND c.fecha_fin < CURRENT_DATE THEN true
    ELSE false
  END as vencido,
  -- Días hasta vencimiento (negativo si ya venció)
  CASE 
    WHEN c.estado = 'activo' THEN (c.fecha_fin - CURRENT_DATE)
    ELSE NULL
  END as dias_hasta_vencimiento,
  -- Nivel de alerta
  CASE 
    WHEN c.estado != 'activo' THEN 'ninguna'
    WHEN c.fecha_fin < CURRENT_DATE THEN 'vencido'
    WHEN c.fecha_fin <= CURRENT_DATE + INTERVAL '15 days' THEN 'urgente'
    WHEN c.fecha_fin <= CURRENT_DATE + INTERVAL '30 days' THEN 'proximo'
    WHEN c.fecha_fin <= CURRENT_DATE + INTERVAL '60 days' THEN 'atencion'
    ELSE 'ninguna'
  END as nivel_alerta,
  -- Duración del contrato en meses
  EXTRACT(YEAR FROM age(c.fecha_fin, c.fecha_inicio)) * 12 +
  EXTRACT(MONTH FROM age(c.fecha_fin, c.fecha_inicio)) as duracion_meses
FROM contratos c
LEFT JOIN propiedades p ON c.propiedad_id = p.id;

-- 4. Función para obtener contratos que requieren atención
CREATE OR REPLACE FUNCTION get_contratos_alertas(dias_anticipacion INTEGER DEFAULT 60)
RETURNS TABLE (
  id UUID,
  propiedad_id UUID,
  direccion TEXT,
  ciudad TEXT,
  fecha_inicio DATE,
  fecha_fin DATE,
  estado TEXT,
  dias_hasta_vencimiento INTEGER,
  nivel_alerta TEXT,
  monto_base NUMERIC,
  moneda TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.propiedad_id,
    v.direccion,
    v.ciudad,
    v.fecha_inicio,
    v.fecha_fin,
    v.estado,
    v.dias_hasta_vencimiento::INTEGER,
    v.nivel_alerta,
    v.monto_base,
    v.moneda
  FROM vista_contratos_vigencia v
  WHERE v.estado = 'activo'
    AND (v.fecha_fin < CURRENT_DATE OR v.fecha_fin <= CURRENT_DATE + (dias_anticipacion || ' days')::INTERVAL)
  ORDER BY v.fecha_fin ASC;
END;
$$ LANGUAGE plpgsql;
