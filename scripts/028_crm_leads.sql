-- Tabla de leads/oportunidades
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Datos del contacto
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(50),
  
  -- Origen del lead
  origen VARCHAR(50) NOT NULL DEFAULT 'web',
  origen_detalle TEXT,
  propiedad_id UUID REFERENCES propiedades(id) ON DELETE SET NULL,
  
  -- Clasificación
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('compra', 'alquiler', 'venta', 'tasacion', 'administracion', 'otro')),
  estado VARCHAR(20) NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'contactado', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido')),
  temperatura VARCHAR(10) DEFAULT 'tibio' CHECK (temperatura IN ('frio', 'tibio', 'caliente')),
  
  -- Seguimiento
  asignado_a UUID REFERENCES profiles(id) ON DELETE SET NULL,
  proximo_contacto TIMESTAMPTZ,
  motivo_perdida TEXT,
  
  -- Preferencias (para búsqueda de propiedades)
  preferencias JSONB DEFAULT '{}',
  
  -- Valor estimado
  valor_estimado DECIMAL(15,2),
  moneda VARCHAR(3) DEFAULT 'ARS',
  
  -- Notas
  notas TEXT
);

-- Tabla de actividades/seguimiento de leads
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('llamada', 'email', 'whatsapp', 'reunion', 'visita', 'nota', 'cambio_estado', 'tarea')),
  descripcion TEXT NOT NULL,
  resultado TEXT,
  
  -- Para tareas
  fecha_programada TIMESTAMPTZ,
  completada BOOLEAN DEFAULT FALSE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_tipo ON leads(tipo);
CREATE INDEX IF NOT EXISTS idx_leads_asignado ON leads(asignado_a);
CREATE INDEX IF NOT EXISTS idx_leads_proximo_contacto ON leads(proximo_contacto);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para leads
DROP POLICY IF EXISTS leads_admin_all ON leads;
CREATE POLICY leads_admin_all ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Políticas para lead_activities
DROP POLICY IF EXISTS lead_activities_admin_all ON lead_activities;
CREATE POLICY lead_activities_admin_all ON lead_activities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();
