-- Add rainfall column to land_data table
ALTER TABLE public.land_data 
ADD COLUMN IF NOT EXISTS rainfall double precision;

-- Create favorite_locations table for saving monitored locations
CREATE TABLE IF NOT EXISTS public.favorite_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  location_name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, location_name)
);

-- Enable Row Level Security
ALTER TABLE public.favorite_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for favorite_locations
CREATE POLICY "Users can view their own favorite locations" 
ON public.favorite_locations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite locations" 
ON public.favorite_locations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite locations" 
ON public.favorite_locations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_favorite_locations_user_id 
ON public.favorite_locations(user_id);