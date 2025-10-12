import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NASADataRequest {
  latitude: number;
  longitude: number;
  startDate?: string;
  endDate?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { latitude, longitude, startDate, endDate }: NASADataRequest = body;

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: latitude and longitude' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nasaToken = Deno.env.get('NASA_EDL_TOKEN');
    if (!nasaToken) {
      throw new Error('NASA EDL token not configured');
    }

    console.log(`Fetching NASA data for coordinates: ${latitude}, ${longitude}`);

    // Calculate date range (default: last 30 days)
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch NDVI data from NASA MODIS
    const ndviUrl = `https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?latitude=${latitude}&longitude=${longitude}&startDate=${start}&endDate=${end}&kmAboveBelow=0&kmLeftRight=0`;
    
    const ndviResponse = await fetch(ndviUrl, {
      headers: {
        'Authorization': `Bearer ${nasaToken}`,
      },
    });

    if (!ndviResponse.ok) {
      console.error('NASA API error:', ndviResponse.status, await ndviResponse.text());
      throw new Error(`NASA API error: ${ndviResponse.status}`);
    }

    const ndviData = await ndviResponse.json();
    
    // Extract latest NDVI value
    let ndviScore = null;
    if (ndviData.subset && ndviData.subset.length > 0) {
      const latestData = ndviData.subset[ndviData.subset.length - 1];
      // NDVI is typically in the range -2000 to 10000, normalize to -1 to 1
      ndviScore = latestData.data && latestData.data.length > 0 
        ? latestData.data[0] / 10000 
        : null;
    }

    console.log('NASA data fetched successfully, NDVI:', ndviScore);

    return new Response(
      JSON.stringify({
        ndviScore,
        temperature: null, // Can be extended with additional NASA APIs
        soilMoisture: null, // Can be extended with additional NASA APIs
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-nasa-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
