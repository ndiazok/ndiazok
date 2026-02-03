-- Script para establecer usuario como admin
-- Este script actualiza el perfil del usuario a rol admin una vez registrado

-- Actualizar el rol del usuario a admin por email
UPDATE profiles
SET 
  role = 'admin',
  updated_at = NOW()
WHERE email = 'ktamiozzo@gmail.com';

-- Si el usuario aún no existe en profiles (no se ha registrado),
-- crear una función que lo haga admin automáticamente al registrarse
CREATE OR REPLACE FUNCTION set_admin_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'ktamiozzo@gmail.com' THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para auto-asignar admin (se ejecuta ANTES del insert en profiles)
DROP TRIGGER IF EXISTS set_admin_trigger ON profiles;
CREATE TRIGGER set_admin_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_on_signup();
