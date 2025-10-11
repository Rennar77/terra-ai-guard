-- Create land_data table for storing satellite and climate data
CREATE TABLE IF NOT EXISTS public.land_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  ndvi_score FLOAT,
  soil_moisture FLOAT,
  temperature FLOAT,
  degradation_level TEXT,
  ai_recommendation TEXT,
  whatsapp_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.land_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (public dashboard)
CREATE POLICY "Allow public read access on land_data"
  ON public.land_data
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access on land_data"
  ON public.land_data
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access on land_data"
  ON public.land_data
  FOR UPDATE
  USING (true);

-- Create index for faster location queries
CREATE INDEX idx_land_data_coordinates ON public.land_data(latitude, longitude);
CREATE INDEX idx_land_data_created_at ON public.land_data(created_at DESC);