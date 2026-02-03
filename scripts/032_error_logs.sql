-- Tabla para almacenar logs de errores del sistema
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Clasificación del error
  error_type TEXT NOT NULL, -- 'validation', 'authentication', 'database', 'api', 'client', 'unknown'
  error_code TEXT, -- Código específico si existe
  severity TEXT DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  
  -- Detalles del error
  message TEXT NOT NULL,
  stack_trace TEXT,
  
  -- Contexto
  endpoint TEXT, -- Ruta de la API
  method TEXT, -- GET, POST, etc.
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Request/Response info
  request_body JSONB,
  request_params JSONB,
  response_status INTEGER,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}',
  
  -- Estado de resolución
  status TEXT DEFAULT 'new', -- 'new', 'viewed', 'investigating', 'resolved', 'ignored'
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_status ON error_logs(status);
CREATE INDEX idx_error_logs_endpoint ON error_logs(endpoint);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);

-- Vista para estadísticas de errores
CREATE OR REPLACE VIEW vista_error_stats AS
SELECT 
  error_type,
  severity,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'new') as nuevos,
  COUNT(*) FILTER (WHERE status = 'investigating') as investigando,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as ultimas_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as ultima_semana
FROM error_logs
GROUP BY error_type, severity;

-- Vista para errores agrupados (para mostrar "tipos diferentes")
CREATE OR REPLACE VIEW vista_error_groups AS
SELECT 
  error_type,
  message,
  endpoint,
  COUNT(*) as occurrences,
  MAX(created_at) as last_occurrence,
  MIN(created_at) as first_occurrence,
  COUNT(*) FILTER (WHERE status = 'new') as unresolved
FROM error_logs
GROUP BY error_type, message, endpoint
ORDER BY last_occurrence DESC;

-- RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage error logs" ON error_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Función para limpiar logs antiguos (más de 90 días resueltos)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM error_logs 
  WHERE status IN ('resolved', 'ignored') 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
