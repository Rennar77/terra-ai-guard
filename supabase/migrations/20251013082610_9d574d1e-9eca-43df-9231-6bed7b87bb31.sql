-- Add user_id column to land_data table
ALTER TABLE public.land_data 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for user-specific access
DROP POLICY IF EXISTS "Allow public insert access on land_data" ON public.land_data;
DROP POLICY IF EXISTS "Allow public read access on land_data" ON public.land_data;
DROP POLICY IF EXISTS "Allow public update access on land_data" ON public.land_data;

-- Create user-specific RLS policies
CREATE POLICY "Users can view their own land data"
ON public.land_data
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own land data"
ON public.land_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own land data"
ON public.land_data
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own land data"
ON public.land_data
FOR DELETE
USING (auth.uid() = user_id);