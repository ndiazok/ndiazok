-- Tabla para soportar múltiples roles por usuario
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('propietario', 'inquilino', 'garante', 'profesional', 'admin')),
  context_type text, -- 'property', 'contract', 'guarantee', null for admin
  context_id uuid, -- ID de la propiedad, contrato o garantía que originó el rol
  assigned_at timestamp with time zone DEFAULT now(),
  assigned_by uuid REFERENCES profiles(id),
  notes text,
  UNIQUE(user_id, role, context_type, context_id)
);

-- Índices
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_context ON user_roles(context_type, context_id);

-- RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_admin_all" ON user_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "user_roles_self_select" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Vista para obtener todos los roles de un usuario
CREATE OR REPLACE VIEW user_roles_summary AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL) as roles,
  p.created_at
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id
GROUP BY p.id, p.full_name, p.email, p.created_at;

-- Migrar roles existentes del campo profiles.role a user_roles
INSERT INTO user_roles (user_id, role, context_type, notes)
SELECT id, role, null, 'Migrado desde profiles.role'
FROM profiles
WHERE role IS NOT NULL AND role != ''
ON CONFLICT DO NOTHING;
