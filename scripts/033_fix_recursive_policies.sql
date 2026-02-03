-- Fix infinite recursion in RLS policies
-- The issue is policies on profiles/leads/etc reference user_roles which references profiles

-- Drop problematic policies
DROP POLICY IF EXISTS "admins_select_all" ON profiles;
DROP POLICY IF EXISTS "leads_admin_all" ON leads;
DROP POLICY IF EXISTS "admins_liquidaciones_all" ON liquidaciones;
DROP POLICY IF EXISTS "property_owners_admin_all" ON property_owners;

-- Create a security definer function to check admin status
-- This bypasses RLS and avoids recursion
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate policies using the function
CREATE POLICY "admins_select_all" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "leads_admin_all" ON leads
  FOR ALL USING (is_admin());

CREATE POLICY "admins_liquidaciones_all" ON liquidaciones
  FOR ALL USING (is_admin());

CREATE POLICY "property_owners_admin_all" ON property_owners
  FOR ALL USING (is_admin());

-- Also fix other tables that might have the same issue
DROP POLICY IF EXISTS "admins_propiedades_all" ON propiedades;
CREATE POLICY "admins_propiedades_all" ON propiedades
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "admins_contratos_all" ON contratos;
CREATE POLICY "admins_contratos_all" ON contratos
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "admins_movimientos_all" ON movimientos;
CREATE POLICY "admins_movimientos_all" ON movimientos
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "admins_cuentas_all" ON cuentas_corrientes;
CREATE POLICY "admins_cuentas_all" ON cuentas_corrientes
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "admins_indices_all" ON indices_ajuste;
CREATE POLICY "admins_indices_all" ON indices_ajuste
  FOR ALL USING (is_admin());
