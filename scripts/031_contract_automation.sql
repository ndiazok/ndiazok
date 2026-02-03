-- ============================================
-- AUTOMATIZACIÓN DE CONTRATOS - MIGRACIÓN
-- ============================================

-- 1. Tabla de documentos de personas
CREATE TABLE IF NOT EXISTS person_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'dni_frente', 'dni_dorso', 'recibo_sueldo_1', 'recibo_sueldo_2', 'recibo_sueldo_3',
    'escritura_propiedad', 'certificado_dominio', 'libre_deuda', 'cuit_constancia',
    'contrato_trabajo', 'certificado_ingresos', 'declaracion_jurada', 'otro'
  )),
  url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'validado', 'rechazado', 'vencido')),
  rejection_reason TEXT,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id),
  -- Datos extraídos por OCR
  ocr_data JSONB,
  ocr_processed_at TIMESTAMPTZ,
  ocr_confidence DECIMAL(3,2),
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agregar estados granulares a contratos
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'borrador' 
  CHECK (pipeline_status IN (
    'borrador',           -- Recién creado
    'seña_pendiente',     -- Esperando seña
    'seña_recibida',      -- Seña cobrada
    'docs_inquilino',     -- Esperando docs del inquilino
    'docs_garantes',      -- Esperando docs de garantes
    'revision_legal',     -- En revisión por el equipo
    'pre_aprobado',       -- Docs OK, falta generar contrato
    'contrato_generado',  -- PDF generado, falta firmar
    'firma_pendiente',    -- Enviado a firmar
    'firmado',            -- Firmado por todas las partes
    'activo',             -- Contrato vigente
    'finalizado',         -- Contrato terminado
    'cancelado'           -- Cancelado antes de firmar
  ));

ALTER TABLE contratos ADD COLUMN IF NOT EXISTS seña_monto DECIMAL(12,2);
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS seña_fecha DATE;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS seña_comprobante_url TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS checklist_completado BOOLEAN DEFAULT FALSE;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS contrato_pdf_url TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS firma_digital_id TEXT;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS notas_internas TEXT;

-- 3. Tabla de inventario de propiedades
CREATE TABLE IF NOT EXISTS property_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES propiedades(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contratos(id),
  inventory_type TEXT DEFAULT 'entrada' CHECK (inventory_type IN ('entrada', 'salida')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  signed_by_tenant BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES property_inventory(id) ON DELETE CASCADE,
  ambiente TEXT NOT NULL,
  item TEXT NOT NULL,
  cantidad INTEGER DEFAULT 1,
  estado TEXT CHECK (estado IN ('nuevo', 'bueno', 'regular', 'malo', 'faltante')),
  observaciones TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de checklist de requisitos por contrato
CREATE TABLE IF NOT EXISTS contract_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('inquilino', 'garante', 'propietario', 'inmobiliaria')),
  participant_id UUID REFERENCES profiles(id),
  requirement TEXT NOT NULL,
  requirement_type TEXT CHECK (requirement_type IN ('documento', 'validacion', 'firma', 'pago', 'otro')),
  is_required BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  document_id UUID REFERENCES person_documents(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de plantillas de contrato
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('alquiler_vivienda', 'alquiler_comercial', 'alquiler_temporario')),
  template_content TEXT NOT NULL,
  variables JSONB, -- Lista de variables que usa la plantilla
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- 6. Historial de cambios de estado del contrato
CREATE TABLE IF NOT EXISTS contract_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Invitaciones a garantes/participantes
CREATE TABLE IF NOT EXISTS contract_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('inquilino', 'garante', 'co_inquilino')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES profiles(id),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_person_documents_person ON person_documents(person_id);
CREATE INDEX IF NOT EXISTS idx_person_documents_type ON person_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_person_documents_status ON person_documents(status);
CREATE INDEX IF NOT EXISTS idx_contratos_pipeline ON contratos(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_contract_checklist_contract ON contract_checklist(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_invitations_token ON contract_invitations(token);
CREATE INDEX IF NOT EXISTS idx_contract_invitations_email ON contract_invitations(email);

-- RLS Policies
ALTER TABLE person_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_invitations ENABLE ROW LEVEL SECURITY;

-- Policies para person_documents
CREATE POLICY "Users can view own documents" ON person_documents
  FOR SELECT USING (person_id = auth.uid());
CREATE POLICY "Users can insert own documents" ON person_documents
  FOR INSERT WITH CHECK (person_id = auth.uid());
CREATE POLICY "Admins can manage all documents" ON person_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies para property_inventory
CREATE POLICY "Admins can manage inventory" ON property_inventory
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies para inventory_items
CREATE POLICY "Admins can manage inventory items" ON inventory_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies para contract_checklist
CREATE POLICY "Admins can manage checklist" ON contract_checklist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Participants can view own checklist" ON contract_checklist
  FOR SELECT USING (participant_id = auth.uid());

-- Policies para contract_templates
CREATE POLICY "Admins can manage templates" ON contract_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies para contract_status_history
CREATE POLICY "Admins can view history" ON contract_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Policies para contract_invitations
CREATE POLICY "Admins can manage invitations" ON contract_invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Anyone can view invitation by token" ON contract_invitations
  FOR SELECT USING (true);

-- Insertar plantilla de contrato base
INSERT INTO contract_templates (name, description, contract_type, template_content, variables) VALUES
('Contrato Alquiler Vivienda - Estándar', 'Plantilla estándar para alquiler de vivienda según Ley 27.551', 'alquiler_vivienda', 
'CONTRATO DE LOCACIÓN DE INMUEBLE PARA VIVIENDA

Entre {{locador_nombre}}, {{locador_tipo_doc}} N° {{locador_documento}}, con domicilio en {{locador_domicilio}}, en adelante EL LOCADOR, y {{locatario_nombre}}, {{locatario_tipo_doc}} N° {{locatario_documento}}, con domicilio en {{locatario_domicilio}}, en adelante EL LOCATARIO, convienen en celebrar el presente contrato de locación sujeto a las siguientes cláusulas:

PRIMERA: OBJETO. El LOCADOR da en locación al LOCATARIO, quien acepta, el inmueble ubicado en {{propiedad_direccion}}, {{propiedad_localidad}}, Provincia de {{propiedad_provincia}}, destinado exclusivamente a vivienda familiar.

SEGUNDA: PLAZO. El plazo de la presente locación es de {{contrato_duracion_meses}} meses, comenzando a regir el día {{contrato_fecha_inicio}} y finalizando el día {{contrato_fecha_fin}}, fecha en que el LOCATARIO deberá restituir el inmueble libre de ocupantes y en las mismas condiciones en que lo recibió.

TERCERA: PRECIO. El precio de la locación se establece de la siguiente manera:
{{ajustes_detalle}}

CUARTA: FORMA DE PAGO. El alquiler se abonará por mes adelantado, del 1 al 10 de cada mes, en {{forma_pago}}.

QUINTA: DEPÓSITO EN GARANTÍA. El LOCATARIO entrega en este acto la suma de {{deposito_monto}} ({{deposito_monto_letras}}) en concepto de depósito en garantía, equivalente a {{deposito_meses}} meses de alquiler.

SEXTA: EXPENSAS Y SERVICIOS. Serán a cargo del LOCATARIO las expensas ordinarias y todos los servicios del inmueble.

SÉPTIMA: GARANTÍA. {{garantia_clausula}}

OCTAVA: PROHIBICIONES. Queda prohibido al LOCATARIO: a) Subalquilar total o parcialmente; b) Ceder el contrato; c) Introducir mejoras sin autorización escrita del LOCADOR; d) Destinar el inmueble a otro uso que no sea vivienda.

NOVENA: RESCISIÓN ANTICIPADA. El LOCATARIO podrá rescindir el presente contrato a partir de los seis (6) meses de vigencia, debiendo notificar en forma fehaciente al LOCADOR con al menos un (1) mes de anticipación.

DÉCIMA: JURISDICCIÓN. Para todos los efectos del presente contrato, las partes se someten a la jurisdicción de los Tribunales Ordinarios de {{jurisdiccion}}.

En prueba de conformidad, se firman dos ejemplares de un mismo tenor y a un solo efecto, en {{lugar_firma}}, a los {{dia_firma}} días del mes de {{mes_firma}} de {{anio_firma}}.


_____________________          _____________________
     LOCADOR                        LOCATARIO


{{garantes_firmas}}
',
'["locador_nombre", "locador_tipo_doc", "locador_documento", "locador_domicilio", "locatario_nombre", "locatario_tipo_doc", "locatario_documento", "locatario_domicilio", "propiedad_direccion", "propiedad_localidad", "propiedad_provincia", "contrato_duracion_meses", "contrato_fecha_inicio", "contrato_fecha_fin", "ajustes_detalle", "forma_pago", "deposito_monto", "deposito_monto_letras", "deposito_meses", "garantia_clausula", "jurisdiccion", "lugar_firma", "dia_firma", "mes_firma", "anio_firma", "garantes_firmas"]'::jsonb
) ON CONFLICT DO NOTHING;

-- Vista para pipeline de contratos con semáforo
CREATE OR REPLACE VIEW vista_contratos_pipeline AS
SELECT 
  c.*,
  p.direccion as propiedad_direccion,
  p.ciudad as propiedad_ciudad,
  -- Calcular semáforo
  CASE 
    WHEN c.pipeline_status IN ('cancelado') THEN 'gris'
    WHEN c.pipeline_status IN ('firmado', 'activo') THEN 'azul'
    WHEN c.pipeline_status IN ('pre_aprobado', 'contrato_generado', 'firma_pendiente') THEN 'verde'
    WHEN c.pipeline_status IN ('docs_inquilino', 'docs_garantes', 'revision_legal') THEN 'amarillo'
    WHEN c.pipeline_status IN ('borrador', 'seña_pendiente', 'seña_recibida') THEN 'rojo'
    ELSE 'rojo'
  END as semaforo,
  -- Contar documentos pendientes
  (SELECT COUNT(*) FROM contract_checklist cc WHERE cc.contract_id = c.id AND NOT cc.is_completed AND cc.is_required) as docs_pendientes,
  -- Contar documentos completados
  (SELECT COUNT(*) FROM contract_checklist cc WHERE cc.contract_id = c.id AND cc.is_completed) as docs_completados,
  -- Total documentos requeridos
  (SELECT COUNT(*) FROM contract_checklist cc WHERE cc.contract_id = c.id AND cc.is_required) as docs_total
FROM contratos c
LEFT JOIN propiedades p ON c.propiedad_id = p.id;
