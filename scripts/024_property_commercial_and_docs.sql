-- =====================================================
-- ACTUALIZACIÓN DE PROPIEDADES: COMERCIALIZACIÓN Y DOCUMENTOS
-- =====================================================

-- 1. Agregar campos de comercialización a propiedades
ALTER TABLE propiedades
ADD COLUMN IF NOT EXISTS en_alquiler BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS precio_alquiler NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS moneda_alquiler TEXT DEFAULT 'ARS' CHECK (moneda_alquiler IN ('ARS', 'USD')),
ADD COLUMN IF NOT EXISTS en_venta BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS precio_venta NUMERIC(14,2),
ADD COLUMN IF NOT EXISTS moneda_venta TEXT DEFAULT 'USD' CHECK (moneda_venta IN ('ARS', 'USD')),
ADD COLUMN IF NOT EXISTS publicar_web BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS en_administracion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS titulo_publicacion TEXT,
ADD COLUMN IF NOT EXISTS descripcion_publica TEXT,
ADD COLUMN IF NOT EXISTS destacada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fecha_disponible DATE,
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS tour_virtual_url TEXT;

-- 2. Crear tabla de imágenes de propiedades
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  filename TEXT,
  size_bytes INTEGER,
  mime_type TEXT,
  orden INTEGER DEFAULT 0,
  es_principal BOOLEAN DEFAULT false,
  titulo TEXT,
  descripcion TEXT,
  tipo TEXT DEFAULT 'foto' CHECK (tipo IN ('foto', 'plano', 'render', 'video_thumb')),
  visible_web BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Índices para property_images
CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_orden ON property_images(property_id, orden);
CREATE INDEX IF NOT EXISTS idx_property_images_principal ON property_images(property_id, es_principal) WHERE es_principal = true;

-- RLS para property_images
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_images_admin_all" ON property_images
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "property_images_public_select" ON property_images
  FOR SELECT TO anon
  USING (
    visible_web = true AND
    EXISTS (SELECT 1 FROM propiedades WHERE id = property_id AND publicar_web = true)
  );

CREATE POLICY "property_images_owner_select" ON property_images
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_owners po 
      WHERE po.property_id = property_images.property_id 
      AND po.person_id = auth.uid()
    )
  );

-- 3. Crear tabla de documentos de propiedades
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'contrato', 'plano', 'escritura', 'impuesto', 'expensa', 
    'servicio', 'habilitacion', 'seguro', 'presupuesto', 
    'factura', 'nota', 'expediente', 'otro'
  )),
  subcategoria TEXT,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  url TEXT,
  storage_path TEXT,
  filename TEXT,
  size_bytes INTEGER,
  mime_type TEXT,
  fecha_documento DATE,
  fecha_vencimiento DATE,
  monto NUMERIC(14,2),
  moneda TEXT DEFAULT 'ARS',
  periodo_mes INTEGER,
  periodo_anio INTEGER,
  contrato_id UUID REFERENCES contratos(id),
  reparacion_id UUID REFERENCES reparaciones(id),
  notas TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'vencido', 'archivado', 'anulado')),
  visible_propietario BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Índices para property_documents
CREATE INDEX IF NOT EXISTS idx_property_documents_property ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_categoria ON property_documents(property_id, categoria);
CREATE INDEX IF NOT EXISTS idx_property_documents_vencimiento ON property_documents(fecha_vencimiento) WHERE fecha_vencimiento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_property_documents_contrato ON property_documents(contrato_id) WHERE contrato_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_property_documents_reparacion ON property_documents(reparacion_id) WHERE reparacion_id IS NOT NULL;

-- RLS para property_documents
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "property_documents_admin_all" ON property_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "property_documents_owner_select" ON property_documents
  FOR SELECT TO authenticated
  USING (
    visible_propietario = true AND
    EXISTS (
      SELECT 1 FROM property_owners po 
      WHERE po.property_id = property_documents.property_id 
      AND po.person_id = auth.uid()
    )
  );

-- 4. Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_property_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_property_documents_updated_at ON property_documents;
CREATE TRIGGER trigger_property_documents_updated_at
  BEFORE UPDATE ON property_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_property_documents_updated_at();

-- 5. Vista para documentos próximos a vencer
CREATE OR REPLACE VIEW vista_documentos_por_vencer AS
SELECT 
  pd.*,
  p.direccion,
  p.ciudad,
  (pd.fecha_vencimiento - CURRENT_DATE) as dias_hasta_vencimiento,
  CASE 
    WHEN pd.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
    WHEN pd.fecha_vencimiento <= CURRENT_DATE + INTERVAL '15 days' THEN 'urgente'
    WHEN pd.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days' THEN 'proximo'
    ELSE 'ok'
  END as nivel_alerta
FROM property_documents pd
JOIN propiedades p ON p.id = pd.property_id
WHERE pd.estado = 'activo'
  AND pd.fecha_vencimiento IS NOT NULL;

-- 6. Vista de propiedades para publicación web
CREATE OR REPLACE VIEW vista_propiedades_web AS
SELECT 
  p.id,
  p.direccion,
  p.ciudad,
  p.provincia,
  p.tipo,
  p.ambientes,
  p.dormitorios,
  p.banos,
  p.metros_cuadrados,
  p.cochera,
  p.titulo_publicacion,
  p.descripcion_publica,
  p.en_alquiler,
  p.precio_alquiler,
  p.moneda_alquiler,
  p.en_venta,
  p.precio_venta,
  p.moneda_venta,
  p.destacada,
  p.fecha_disponible,
  p.amenities,
  p.video_url,
  p.tour_virtual_url,
  (
    SELECT json_agg(json_build_object(
      'id', pi.id,
      'url', pi.url,
      'es_principal', pi.es_principal,
      'orden', pi.orden,
      'titulo', pi.titulo
    ) ORDER BY pi.es_principal DESC, pi.orden ASC)
    FROM property_images pi 
    WHERE pi.property_id = p.id AND pi.visible_web = true
  ) as imagenes
FROM propiedades p
WHERE p.publicar_web = true
  AND (p.en_alquiler = true OR p.en_venta = true);
