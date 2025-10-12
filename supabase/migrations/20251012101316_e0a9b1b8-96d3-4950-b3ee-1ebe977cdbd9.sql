-- Add flood_risk and drought_risk columns to land_data table
ALTER TABLE public.land_data 
ADD COLUMN IF NOT EXISTS flood_risk TEXT,
ADD COLUMN IF NOT EXISTS drought_risk TEXT;