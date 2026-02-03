-- Tabla para alertas de búsqueda
CREATE TABLE IF NOT EXISTS search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  -- Criterios de búsqueda
  operacion TEXT CHECK (operacion IN ('venta', 'alquiler', 'ambas')),
  tipo TEXT,
  ciudad TEXT,
  provincia TEXT,
  dormitorios_min INTEGER,
  dormitorios_max INTEGER,
  precio_min NUMERIC,
  precio_max NUMERIC,
  moneda TEXT DEFAULT 'ARS',
  superficie_min NUMERIC,
  superficie_max NUMERIC,
  -- Control
  activa BOOLEAN DEFAULT true,
  frecuencia TEXT DEFAULT 'diaria' CHECK (frecuencia IN ('inmediata', 'diaria', 'semanal')),
  ultima_notificacion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_alerts_own_select" ON search_alerts
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "search_alerts_own_insert" ON search_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "search_alerts_own_update" ON search_alerts
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "search_alerts_admin_all" ON search_alerts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_search_alerts_email ON search_alerts(email);
CREATE INDEX IF NOT EXISTS idx_search_alerts_activa ON search_alerts(activa) WHERE activa = true;
