-- Tabla principal de inspecciones
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Relaciones
  propiedad_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES contratos(id) ON DELETE SET NULL,
  inquilino_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  inspector_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Tipo y estado
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'finalizado', 'enviado_firma', 'firmado', 'expirado')),
  
  -- Datos del inmueble al momento de la inspección
  direccion_snapshot TEXT,
  
  -- Medidores y llaves
  medidor_agua TEXT,
  medidor_gas TEXT,
  medidor_luz TEXT,
  llaves_entregadas INTEGER DEFAULT 0,
  llaves_detalle TEXT,
  
  -- PDF generado
  pdf_url TEXT,
  pdf_s3_key TEXT,
  pdf_sha256 TEXT,
  pdf_firmado_url TEXT,
  pdf_firmado_s3_key TEXT,
  
  -- Observaciones generales
  observaciones_generales TEXT,
  
  -- Fechas importantes
  fecha_inspeccion DATE DEFAULT CURRENT_DATE,
  fecha_finalizacion TIMESTAMPTZ,
  fecha_envio_firma TIMESTAMPTZ,
  fecha_firma TIMESTAMPTZ,
  fecha_expiracion TIMESTAMPTZ
);

-- Items del checklist de inspección
CREATE TABLE IF NOT EXISTS inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  
  -- Categoría y descripción
  seccion TEXT NOT NULL CHECK (seccion IN (
    'acceso_cerraduras',
    'paredes_pintura', 
    'pisos_zocalos',
    'techo_humedad',
    'cocina',
    'bano',
    'electricidad',
    'aberturas',
    'patio_balcon',
    'limpieza',
    'otros'
  )),
  item_nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  
  -- Estado del item
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'ok', 'observacion', 'danio')),
  nota TEXT,
  
  -- Fotos (URLs en Blob storage)
  fotos TEXT[] DEFAULT '{}'
);

-- Tokens de firma para inspecciones
CREATE TABLE IF NOT EXISTS inspection_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  
  -- Token seguro
  token TEXT NOT NULL UNIQUE,
  
  -- Estado y vigencia
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'usado', 'expirado', 'revocado')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  
  -- Metadata
  enviado_a_email TEXT,
  enviado_a_telefono TEXT,
  fecha_envio TIMESTAMPTZ
);

-- Evidencia de firma
CREATE TABLE IF NOT EXISTS inspection_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  token_id UUID REFERENCES inspection_tokens(id) ON DELETE SET NULL,
  
  -- Datos del firmante
  firmante_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  firmante_nombre TEXT NOT NULL,
  firmante_dni TEXT,
  firmante_email TEXT,
  
  -- Evidencia técnica
  ip_address TEXT,
  user_agent TEXT,
  device_fingerprint TEXT,
  
  -- Selfie proof of life
  selfie_url TEXT,
  selfie_s3_key TEXT,
  
  -- Hash de verificación
  signature_hash_sha256 TEXT NOT NULL,
  signature_data JSONB, -- datos completos usados para el hash
  
  -- Timestamp exacto
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_inspections_propiedad ON inspections(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_inspections_contrato ON inspections(contrato_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_estado ON inspections(estado);
CREATE INDEX IF NOT EXISTS idx_inspections_tipo ON inspections(tipo);
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection ON inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_tokens_token ON inspection_tokens(token);
CREATE INDEX IF NOT EXISTS idx_inspection_tokens_inspection ON inspection_tokens(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_signatures_inspection ON inspection_signatures(inspection_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inspections_updated_at ON inspections;
CREATE TRIGGER trigger_inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_inspections_updated_at();

DROP TRIGGER IF EXISTS trigger_inspection_items_updated_at ON inspection_items;
CREATE TRIGGER trigger_inspection_items_updated_at
  BEFORE UPDATE ON inspection_items
  FOR EACH ROW EXECUTE FUNCTION update_inspections_updated_at();

-- RLS Policies
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_signatures ENABLE ROW LEVEL SECURITY;

-- Política para inspections: admin y profesionales con permiso pueden ver/crear
CREATE POLICY "Inspections viewable by authenticated users" ON inspections
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Inspections insertable by inspectors" ON inspections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = inspector_id);

CREATE POLICY "Inspections updatable by inspectors" ON inspections
  FOR UPDATE TO authenticated
  USING (auth.uid() = inspector_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  ));

-- Política para inspection_items
CREATE POLICY "Inspection items viewable by authenticated users" ON inspection_items
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Inspection items manageable by inspection owner" ON inspection_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM inspections i 
    WHERE i.id = inspection_id 
    AND (i.inspector_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    ))
  ));

-- Política para tokens (solo admin)
CREATE POLICY "Tokens viewable by authenticated users" ON inspection_tokens
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Tokens manageable by admin" ON inspection_tokens
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  ) OR EXISTS (
    SELECT 1 FROM inspections i WHERE i.id = inspection_id AND i.inspector_id = auth.uid()
  ));

-- Política para signatures (solo lectura para authenticated, insert público para firma)
CREATE POLICY "Signatures viewable by authenticated users" ON inspection_signatures
  FOR SELECT TO authenticated
  USING (true);

-- Vista para listar inspecciones con datos relacionados
CREATE OR REPLACE VIEW vista_inspecciones AS
SELECT 
  i.*,
  p.direccion as propiedad_direccion,
  p.ciudad as propiedad_ciudad,
  p.tipo as propiedad_tipo,
  c.fecha_inicio as contrato_inicio,
  c.fecha_fin as contrato_fin,
  inq.full_name as inquilino_nombre,
  inq.email as inquilino_email,
  inq.phone as inquilino_telefono,
  ins.full_name as inspector_nombre,
  (SELECT COUNT(*) FROM inspection_items ii WHERE ii.inspection_id = i.id) as total_items,
  (SELECT COUNT(*) FROM inspection_items ii WHERE ii.inspection_id = i.id AND ii.estado = 'ok') as items_ok,
  (SELECT COUNT(*) FROM inspection_items ii WHERE ii.inspection_id = i.id AND ii.estado = 'observacion') as items_observacion,
  (SELECT COUNT(*) FROM inspection_items ii WHERE ii.inspection_id = i.id AND ii.estado = 'danio') as items_danio,
  (SELECT token FROM inspection_tokens it WHERE it.inspection_id = i.id AND it.estado = 'activo' ORDER BY created_at DESC LIMIT 1) as token_activo
FROM inspections i
LEFT JOIN propiedades p ON i.propiedad_id = p.id
LEFT JOIN contratos c ON i.contrato_id = c.id
LEFT JOIN profiles inq ON i.inquilino_id = inq.id
LEFT JOIN profiles ins ON i.inspector_id = ins.id;
