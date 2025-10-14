import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherDataRequest {
  latitude: number;
  longitude: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { latitude, longitude }: WeatherDataRequest = body;

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: latitude and longitude' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');

    if (!apiKey) {
      console.error('OpenWeather API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenWeather API key missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching weather data for coordinates: ${latitude}, ${longitude}`);

    // Fetch current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      console.error('OpenWeather API error:', weatherResponse.status, await weatherResponse.text());
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weatherData = await weatherResponse.json();

    const temperature = weatherData.main?.temp || 20;
    const rainfall = weatherData.rain?.['1h'] || 0; // Rainfall in last hour (mm)

    console.log('Weather data fetched successfully, Temperature:', temperature, 'Rainfall:', rainfall);

    return new Response(
      JSON.stringify({
        temperature,
        rainfall,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-weather-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        temperature: 20,
        rainfall: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
