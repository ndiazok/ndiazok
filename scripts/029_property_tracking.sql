-- Tabla para tracking de visitas y eventos de propiedades
CREATE TABLE IF NOT EXISTS property_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('vista_web', 'consulta', 'visita_presencial', 'reserva', 'oferta', 'contrato')),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notas TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_property_events_property ON property_events(property_id);
CREATE INDEX IF NOT EXISTS idx_property_events_type ON property_events(event_type);
CREATE INDEX IF NOT EXISTS idx_property_events_created ON property_events(created_at DESC);

-- Vista para métricas de propiedades
CREATE OR REPLACE VIEW vista_property_metrics AS
SELECT 
  p.id,
  p.direccion,
  p.ciudad,
  p.tipo,
  p.en_alquiler,
  p.en_venta,
  p.publicar_web,
  p.precio_alquiler,
  p.precio_venta,
  p.created_at,
  -- Tiempo en mercado (días desde publicación)
  CASE 
    WHEN p.publicar_web THEN EXTRACT(DAY FROM (now() - p.created_at))::INT
    ELSE NULL
  END as dias_en_mercado,
  -- Contadores de eventos
  COALESCE(vw.count, 0) as vistas_web,
  COALESCE(co.count, 0) as consultas,
  COALESCE(vp.count, 0) as visitas_presenciales,
  COALESCE(re.count, 0) as reservas,
  COALESCE(of.count, 0) as ofertas,
  -- Última actividad
  (SELECT MAX(created_at) FROM property_events WHERE property_id = p.id) as ultima_actividad,
  -- Días sin actividad
  EXTRACT(DAY FROM (now() - COALESCE(
    (SELECT MAX(created_at) FROM property_events WHERE property_id = p.id),
    p.created_at
  )))::INT as dias_sin_actividad,
  -- Tasa de conversión
  CASE 
    WHEN COALESCE(vw.count, 0) > 0 
    THEN ROUND((COALESCE(co.count, 0)::NUMERIC / vw.count::NUMERIC) * 100, 1)
    ELSE 0
  END as tasa_conversion_vista_consulta,
  CASE 
    WHEN COALESCE(co.count, 0) > 0 
    THEN ROUND((COALESCE(vp.count, 0)::NUMERIC / co.count::NUMERIC) * 100, 1)
    ELSE 0
  END as tasa_conversion_consulta_visita,
  -- Nivel de alerta
  CASE
    WHEN p.publicar_web AND COALESCE(vw.count, 0) = 0 AND EXTRACT(DAY FROM (now() - p.created_at)) > 7 THEN 'sin_visitas'
    WHEN p.publicar_web AND COALESCE(co.count, 0) = 0 AND COALESCE(vw.count, 0) > 20 THEN 'mucha_vista_sin_consulta'
    WHEN p.publicar_web AND COALESCE(vp.count, 0) = 0 AND COALESCE(co.count, 0) > 10 THEN 'mucha_consulta_sin_visita'
    WHEN p.publicar_web AND EXTRACT(DAY FROM (now() - p.created_at)) > 60 THEN 'estancada'
    ELSE 'normal'
  END as nivel_alerta
FROM propiedades p
LEFT JOIN (
  SELECT property_id, COUNT(*) as count 
  FROM property_events WHERE event_type = 'vista_web' 
  GROUP BY property_id
) vw ON vw.property_id = p.id
LEFT JOIN (
  SELECT property_id, COUNT(*) as count 
  FROM property_events WHERE event_type = 'consulta' 
  GROUP BY property_id
) co ON co.property_id = p.id
LEFT JOIN (
  SELECT property_id, COUNT(*) as count 
  FROM property_events WHERE event_type = 'visita_presencial' 
  GROUP BY property_id
) vp ON vp.property_id = p.id
LEFT JOIN (
  SELECT property_id, COUNT(*) as count 
  FROM property_events WHERE event_type = 'reserva' 
  GROUP BY property_id
) re ON re.property_id = p.id
LEFT JOIN (
  SELECT property_id, COUNT(*) as count 
  FROM property_events WHERE event_type = 'oferta' 
  GROUP BY property_id
) of ON of.property_id = p.id;

-- RLS para property_events
ALTER TABLE property_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY property_events_admin_all ON property_events
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY property_events_public_insert ON property_events
  FOR INSERT TO anon
  WITH CHECK (event_type IN ('vista_web', 'consulta'));
