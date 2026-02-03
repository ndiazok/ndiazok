-- Tabla de turnos/citas
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Tipo de turno
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('visita_propiedad', 'firma_contrato', 'entrega_llaves', 'tasacion', 'reparacion', 'reunion', 'otro')),
  
  -- Fecha y hora
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  
  -- Ubicación
  property_id UUID REFERENCES propiedades(id) ON DELETE SET NULL,
  direccion TEXT,
  
  -- Participantes
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Estado
  estado VARCHAR(30) DEFAULT 'programado' CHECK (estado IN ('programado', 'confirmado', 'en_curso', 'completado', 'cancelado', 'no_asistio')),
  
  -- Detalles
  titulo TEXT NOT NULL,
  descripcion TEXT,
  notas_internas TEXT,
  resultado TEXT,
  
  -- Notificaciones
  recordatorio_enviado BOOLEAN DEFAULT FALSE,
  
  -- Creador
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments(fecha);
CREATE INDEX IF NOT EXISTS idx_appointments_estado ON appointments(estado);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned ON appointments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_appointments_property ON appointments(property_id);

-- RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Appointments viewable by authenticated" ON appointments;
CREATE POLICY "Appointments viewable by authenticated"
  ON appointments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Appointments insertable by authenticated" ON appointments;
CREATE POLICY "Appointments insertable by authenticated"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Appointments updatable by authenticated" ON appointments;
CREATE POLICY "Appointments updatable by authenticated"
  ON appointments FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Appointments deletable by authenticated" ON appointments;
CREATE POLICY "Appointments deletable by authenticated"
  ON appointments FOR DELETE
  TO authenticated
  USING (true);

-- Vista de agenda diaria
CREATE OR REPLACE VIEW vista_agenda_diaria AS
SELECT 
  a.*,
  p.direccion as propiedad_direccion,
  p.ciudad as propiedad_ciudad,
  l.nombre as lead_nombre,
  l.telefono as lead_telefono,
  c.full_name as cliente_nombre,
  c.phone as cliente_telefono,
  prof.full_name as profesional_nombre
FROM appointments a
LEFT JOIN propiedades p ON a.property_id = p.id
LEFT JOIN leads l ON a.lead_id = l.id
LEFT JOIN profiles c ON a.client_id = c.id
LEFT JOIN profiles prof ON a.professional_id = prof.id;
