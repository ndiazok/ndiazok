-- Agregar foreign keys que no se pudieron crear antes por dependencias circulares

-- FK de movimientos a liquidaciones y reparaciones
ALTER TABLE movimientos 
  ADD CONSTRAINT fk_movimientos_liquidacion 
  FOREIGN KEY (liquidacion_id) REFERENCES liquidaciones(id) ON DELETE SET NULL;

ALTER TABLE movimientos 
  ADD CONSTRAINT fk_movimientos_reparacion 
  FOREIGN KEY (reparacion_id) REFERENCES reparaciones(id) ON DELETE SET NULL;
