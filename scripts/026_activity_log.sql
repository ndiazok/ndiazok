-- Activity log table for timeline/history
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Actor
  actor_id UUID REFERENCES profiles(id),
  actor_name TEXT,
  
  -- Entity being affected
  entity_type TEXT NOT NULL, -- 'contrato', 'propiedad', 'cliente', 'pago', 'liquidacion', 'reparacion'
  entity_id UUID NOT NULL,
  entity_label TEXT, -- Human readable label like "Contrato #123" or "Caceros 40"
  
  -- Action
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed', 'payment_received', etc.
  action_label TEXT, -- Human readable like "creó", "actualizó", "cambió estado"
  
  -- Details
  old_value JSONB,
  new_value JSONB,
  description TEXT, -- Human readable description
  
  -- Related entities
  related_entity_type TEXT,
  related_entity_id UUID,
  related_entity_label TEXT
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON activity_log(actor_id);

-- RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_log_admin_all ON activity_log;
CREATE POLICY activity_log_admin_all ON activity_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS activity_log_own_select ON activity_log;
CREATE POLICY activity_log_own_select ON activity_log
  FOR SELECT USING (actor_id = auth.uid());

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_actor_id UUID,
  p_actor_name TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_label TEXT,
  p_action TEXT,
  p_action_label TEXT,
  p_description TEXT DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_related_entity_label TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO activity_log (
    actor_id, actor_name, entity_type, entity_id, entity_label,
    action, action_label, description, old_value, new_value,
    related_entity_type, related_entity_id, related_entity_label
  ) VALUES (
    p_actor_id, p_actor_name, p_entity_type, p_entity_id, p_entity_label,
    p_action, p_action_label, p_description, p_old_value, p_new_value,
    p_related_entity_type, p_related_entity_id, p_related_entity_label
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
