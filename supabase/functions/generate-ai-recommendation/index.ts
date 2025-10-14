import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  locationName: string;
  latitude: number;
  longitude: number;
  ndviScore?: number;
  soilMoisture?: number;
  temperature?: number;
  rainfall?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      locationName, 
      latitude, 
      longitude, 
      ndviScore = 0.5, 
      soilMoisture = 50, 
      temperature = 20,
      rainfall = 0
    }: AIRequest = body;

    if (!locationName || !latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiKey) {
      console.warn('LOVABLE_API_KEY not configured, returning fallback recommendation');
      return new Response(
        JSON.stringify({
          degradation_level: 'moderate',
          ai_recommendation: 'Implement sustainable land management practices. Monitor vegetation health regularly and consider reforestation efforts in degraded areas.',
          flood_risk: 'low',
          drought_risk: 'moderate',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const context = `You are an environmental AI assistant specialized in land restoration and climate risk assessment.

Analyze the following location data and provide a comprehensive assessment:

Location: ${locationName}
Coordinates: ${latitude}, ${longitude}
NDVI Score: ${ndviScore} (range: -1 to 1, where >0.6 is healthy vegetation)
Soil Moisture: ${soilMoisture}% (optimal: 30-60%)
Temperature: ${temperature}°C
Rainfall: ${rainfall}mm

Based on this data, provide a JSON response with:
1. degradation_level: "low", "moderate", or "high"
2. ai_recommendation: Detailed restoration recommendations (2-3 sentences)
3. flood_risk: "low", "moderate", or "high"
4. drought_risk: "low", "moderate", or "high"

Consider:
- NDVI < 0.3 indicates severe degradation
- NDVI 0.3-0.6 indicates moderate vegetation health
- NDVI > 0.6 indicates healthy vegetation
- Soil moisture < 20% or > 80% indicates poor conditions
- Rainfall > 100mm increases flood risk
- Low rainfall + high temperature increases drought risk

Provide actionable, specific recommendations for this location.`;

    console.log('Calling Lovable AI for recommendation...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: context }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({
          degradation_level: 'moderate',
          ai_recommendation: 'Implement sustainable land management practices. Monitor vegetation health regularly and consider reforestation efforts in degraded areas.',
          flood_risk: rainfall > 100 ? 'high' : 'low',
          drought_risk: (soilMoisture < 20 || temperature > 30) ? 'high' : 'moderate',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let recommendation;
    try {
      recommendation = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw parseError;
    }

    console.log('AI recommendation generated successfully');

    return new Response(
      JSON.stringify(recommendation),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-ai-recommendation:', error);
    
    // Return intelligent fallback based on input data
    const body = await req.json().catch(() => ({}));
    const { ndviScore = 0.5, soilMoisture = 50, temperature = 20, rainfall = 0 } = body;
    
    return new Response(
      JSON.stringify({
        degradation_level: ndviScore < 0.3 ? 'high' : ndviScore < 0.6 ? 'moderate' : 'low',
        ai_recommendation: 'Implement sustainable land management practices. Monitor vegetation health regularly using satellite data. Consider reforestation efforts in degraded areas and implement soil conservation techniques.',
        flood_risk: rainfall > 100 ? 'high' : rainfall > 50 ? 'moderate' : 'low',
        drought_risk: (soilMoisture < 20 || temperature > 30) ? 'high' : soilMoisture < 40 ? 'moderate' : 'low',
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
