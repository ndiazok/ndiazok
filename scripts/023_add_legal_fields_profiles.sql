-- =====================================================
-- MIGRACIÓN: Agregar campos legales a profiles
-- Para validación de contratos en Sigma Inmobiliaria
-- =====================================================

-- Agregar campos para distinguir tipo de persona
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tipo_persona TEXT DEFAULT 'humana' CHECK (tipo_persona IN ('humana', 'juridica'));

-- =====================================================
-- CAMPOS PARA PERSONA HUMANA
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cuit TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domicilio_real TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domicilio_ciudad TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domicilio_provincia TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domicilio_codigo_postal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS estado_civil TEXT CHECK (estado_civil IN ('soltero', 'casado', 'divorciado', 'viudo', 'union_convivencial', NULL));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nacionalidad TEXT DEFAULT 'Argentina';

-- =====================================================
-- CAMPOS PARA PERSONA JURÍDICA
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tipo_societario TEXT CHECK (tipo_societario IN ('SA', 'SRL', 'SAS', 'sociedad_civil', 'fideicomiso', 'consorcio', 'asociacion_civil', 'fundacion', 'cooperativa', 'otro', NULL));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domicilio_legal TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domicilio_legal_ciudad TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS domicilio_legal_provincia TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fecha_constitucion DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS numero_inscripcion TEXT; -- IGJ, Registro Público, etc.

-- =====================================================
-- REPRESENTANTE LEGAL / APODERADO (para personas jurídicas)
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS representante_nombre TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS representante_dni TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS representante_cuit TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS representante_cargo TEXT CHECK (representante_cargo IN ('representante_legal', 'apoderado', 'presidente', 'gerente', 'administrador', NULL));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS representante_documento_poder TEXT; -- Referencia al documento de poder

-- =====================================================
-- ESTADO DE VALIDACIÓN DE DATOS
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS datos_validados BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS datos_validados_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS datos_validados_por UUID REFERENCES profiles(id);

-- =====================================================
-- FUNCIÓN PARA VERIFICAR DATOS COMPLETOS
-- =====================================================
CREATE OR REPLACE FUNCTION check_profile_legal_completeness(profile_id UUID)
RETURNS TABLE (
  is_complete BOOLEAN,
  missing_fields TEXT[],
  profile_type TEXT
) AS $$
DECLARE
  p RECORD;
  missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SELECT * INTO p FROM profiles WHERE id = profile_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, ARRAY['Perfil no encontrado']::TEXT[], 'unknown'::TEXT;
    RETURN;
  END IF;
  
  -- Campos comunes obligatorios
  IF p.full_name IS NULL OR p.full_name = '' THEN
    missing := array_append(missing, 'Nombre completo');
  END IF;
  
  IF p.tipo_persona = 'humana' OR p.tipo_persona IS NULL THEN
    -- Validación para persona humana
    IF p.dni IS NULL OR p.dni = '' THEN
      missing := array_append(missing, 'DNI');
    END IF;
    IF p.cuit IS NULL OR p.cuit = '' THEN
      missing := array_append(missing, 'CUIT/CUIL');
    END IF;
    IF p.domicilio_real IS NULL OR p.domicilio_real = '' THEN
      missing := array_append(missing, 'Domicilio real');
    END IF;
    
    RETURN QUERY SELECT 
      array_length(missing, 1) IS NULL OR array_length(missing, 1) = 0,
      missing,
      'humana'::TEXT;
      
  ELSE
    -- Validación para persona jurídica
    IF p.razon_social IS NULL OR p.razon_social = '' THEN
      missing := array_append(missing, 'Razón social');
    END IF;
    IF p.cuit IS NULL OR p.cuit = '' THEN
      missing := array_append(missing, 'CUIT');
    END IF;
    IF p.tipo_societario IS NULL THEN
      missing := array_append(missing, 'Tipo societario');
    END IF;
    IF p.domicilio_legal IS NULL OR p.domicilio_legal = '' THEN
      missing := array_append(missing, 'Domicilio legal');
    END IF;
    -- Representante legal obligatorio para personas jurídicas
    IF p.representante_nombre IS NULL OR p.representante_nombre = '' THEN
      missing := array_append(missing, 'Representante legal - Nombre');
    END IF;
    IF p.representante_dni IS NULL OR p.representante_dni = '' THEN
      missing := array_append(missing, 'Representante legal - DNI');
    END IF;
    IF p.representante_cuit IS NULL OR p.representante_cuit = '' THEN
      missing := array_append(missing, 'Representante legal - CUIT');
    END IF;
    IF p.representante_cargo IS NULL THEN
      missing := array_append(missing, 'Representante legal - Cargo');
    END IF;
    
    RETURN QUERY SELECT 
      array_length(missing, 1) IS NULL OR array_length(missing, 1) = 0,
      missing,
      'juridica'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA VALIDAR CONTRATO COMPLETO
-- =====================================================
CREATE OR REPLACE FUNCTION validate_contract_for_generation(contract_id UUID)
RETURNS TABLE (
  can_generate BOOLEAN,
  validation_status TEXT,
  issues JSONB
) AS $$
DECLARE
  contract RECORD;
  participant RECORD;
  all_issues JSONB := '[]'::JSONB;
  has_inquilino BOOLEAN := FALSE;
  has_propietario BOOLEAN := FALSE;
  all_complete BOOLEAN := TRUE;
  participant_check RECORD;
BEGIN
  -- Obtener contrato
  SELECT * INTO contract FROM contratos WHERE id = contract_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'CONTRATO_NO_ENCONTRADO'::TEXT, '[]'::JSONB;
    RETURN;
  END IF;
  
  -- Verificar cada participante
  FOR participant IN 
    SELECT cp.*, p.full_name, p.tipo_persona
    FROM contract_participants cp
    JOIN profiles p ON p.id = cp.person_id
    WHERE cp.contract_id = contract_id
  LOOP
    -- Marcar que existe al menos uno de cada rol requerido
    IF participant.party_role = 'INQUILINO' THEN
      has_inquilino := TRUE;
    END IF;
    IF participant.party_role = 'PROPIETARIO' THEN
      has_propietario := TRUE;
    END IF;
    
    -- Verificar estado del participante
    IF participant.status IN ('PENDING_INVITE', 'REVOKED', 'EXPIRED') THEN
      all_issues := all_issues || jsonb_build_object(
        'type', 'participant_status',
        'person_id', participant.person_id,
        'person_name', participant.full_name,
        'role', participant.party_role,
        'message', 'El participante tiene estado: ' || participant.status
      );
      all_complete := FALSE;
    END IF;
    
    -- Verificar datos legales del participante
    SELECT * INTO participant_check FROM check_profile_legal_completeness(participant.person_id);
    
    IF NOT participant_check.is_complete THEN
      all_issues := all_issues || jsonb_build_object(
        'type', 'missing_data',
        'person_id', participant.person_id,
        'person_name', participant.full_name,
        'person_type', participant_check.profile_type,
        'role', participant.party_role,
        'missing_fields', participant_check.missing_fields,
        'message', 'Faltan datos de ' || participant.full_name
      );
      all_complete := FALSE;
    END IF;
  END LOOP;
  
  -- Verificar que exista al menos un inquilino
  IF NOT has_inquilino THEN
    all_issues := all_issues || jsonb_build_object(
      'type', 'missing_role',
      'role', 'INQUILINO',
      'message', 'El contrato debe tener al menos un inquilino'
    );
    all_complete := FALSE;
  END IF;
  
  -- Verificar que exista al menos un propietario
  IF NOT has_propietario THEN
    all_issues := all_issues || jsonb_build_object(
      'type', 'missing_role',
      'role', 'PROPIETARIO',
      'message', 'El contrato debe tener al menos un propietario'
    );
    all_complete := FALSE;
  END IF;
  
  -- Determinar estado final
  IF all_complete THEN
    RETURN QUERY SELECT TRUE, 'READY_TO_CONTRACT'::TEXT, '[]'::JSONB;
  ELSIF NOT has_inquilino OR NOT has_propietario THEN
    RETURN QUERY SELECT FALSE, 'BLOCKED_MISSING_PARTIES'::TEXT, all_issues;
  ELSE
    RETURN QUERY SELECT FALSE, 'BLOCKED_MISSING_DATA'::TEXT, all_issues;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ÍNDICES PARA BÚSQUEDA RÁPIDA
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_dni ON profiles(dni) WHERE dni IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_cuit ON profiles(cuit) WHERE cuit IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_tipo_persona ON profiles(tipo_persona);
CREATE INDEX IF NOT EXISTS idx_profiles_datos_validados ON profiles(datos_validados);
