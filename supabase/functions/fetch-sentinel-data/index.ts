import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentinelDataRequest {
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
    const body = await req.json();
    const { latitude, longitude, startDate, endDate }: SentinelDataRequest = body;

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: latitude and longitude' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('SENTINEL_CLIENT_ID');
    const clientSecret = Deno.env.get('SENTINEL_CLIENT_SECRET');
    const instanceId = Deno.env.get('SENTINEL_INSTANCE_ID');

    if (!clientId || !clientSecret || !instanceId) {
      console.error('Sentinel Hub credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Sentinel Hub configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching Sentinel Hub data for coordinates: ${latitude}, ${longitude}`);

    // Get OAuth token
    const tokenResponse = await fetch('https://services.sentinel-hub.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to get Sentinel Hub token:', await tokenResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with Sentinel Hub' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Calculate date range (default: last 30 days)
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Define bounding box (small area around the point)
    const bufferDegrees = 0.01; // ~1km at equator
    const bbox = [
      longitude - bufferDegrees,
      latitude - bufferDegrees,
      longitude + bufferDegrees,
      latitude + bufferDegrees
    ];

    // Evalscript for NDVI and soil moisture index
    const evalscript = `
      //VERSION=3
      function setup() {
        return {
          input: [{
            bands: ["B04", "B08", "B11", "B12"],
            units: "REFLECTANCE"
          }],
          output: {
            bands: 3,
            sampleType: "FLOAT32"
          }
        };
      }

      function evaluatePixel(sample) {
        // NDVI = (NIR - Red) / (NIR + Red)
        let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
        
        // Soil Moisture Index (NDMI) = (NIR - SWIR) / (NIR + SWIR)
        let ndmi = (sample.B08 - sample.B11) / (sample.B08 + sample.B11);
        
        // Normalize soil moisture to 0-100 scale
        let soilMoisture = ((ndmi + 1) / 2) * 100;
        
        return [ndvi, soilMoisture, 0];
      }
    `;

    // Request satellite data
    const processRequest = {
      input: {
        bounds: {
          bbox: bbox,
          properties: {
            crs: "http://www.opengis.net/def/crs/EPSG/0/4326"
          }
        },
        data: [{
          type: "sentinel-2-l2a",
          dataFilter: {
            timeRange: {
              from: `${start}T00:00:00Z`,
              to: `${end}T23:59:59Z`
            }
          }
        }]
      },
      output: {
        width: 10,
        height: 10,
        responses: [{
          identifier: "default",
          format: {
            type: "application/json"
          }
        }]
      },
      evalscript: evalscript
    };

    const dataResponse = await fetch(
      `https://sh.dataspace.copernicus.eu/api/v1/process`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(processRequest)
      }
    );

    if (!dataResponse.ok) {
      console.error('Sentinel Hub API error:', dataResponse.status, await dataResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch satellite data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await dataResponse.json();
    
    // Extract NDVI and soil moisture from response
    let ndviScore = 0.5;
    let soilMoisture = 50;

    if (data && Array.isArray(data) && data.length > 0) {
      // Average the values from the grid
      let ndviSum = 0;
      let soilSum = 0;
      let count = 0;

      for (const pixel of data) {
        if (pixel && pixel.length >= 2) {
          ndviSum += pixel[0];
          soilSum += pixel[1];
          count++;
        }
      }

      if (count > 0) {
        ndviScore = ndviSum / count;
        soilMoisture = soilSum / count;
      }
    }

    console.log('Sentinel data fetched successfully, NDVI:', ndviScore, 'Soil Moisture:', soilMoisture);

    return new Response(
      JSON.stringify({
        ndviScore: Math.max(-1, Math.min(1, ndviScore)), // Clamp to [-1, 1]
        soilMoisture: Math.max(0, Math.min(100, soilMoisture)), // Clamp to [0, 100]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-sentinel-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        ndviScore: 0.5,
        soilMoisture: 50
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
