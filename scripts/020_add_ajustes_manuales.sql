-- Add ajustes_manuales column to contratos table
-- This column stores manual adjustments as JSONB array
ALTER TABLE public.contratos
ADD COLUMN IF NOT EXISTS ajustes_manuales jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.contratos.ajustes_manuales IS 'Array of manual rent adjustments with date, type (index or fixed), and value';
