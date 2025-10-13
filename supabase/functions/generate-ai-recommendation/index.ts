import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  locationName: string;
  ndviScore?: number;
  soilMoisture?: number;
  temperature?: number;
  latitude: number;
  longitude: number;
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

    const { locationName, ndviScore, soilMoisture, temperature, latitude, longitude }: AIRequest = body;

    if (!locationName || latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: locationName, latitude, and longitude' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
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

    console.log(`Generating AI recommendation for ${locationName}`);

    // Prepare context for AI analysis
    const context = `
Location: ${locationName} (${latitude}, ${longitude})
NDVI Score: ${ndviScore !== undefined ? ndviScore.toFixed(2) : 'N/A'}
Soil Moisture: ${soilMoisture !== undefined ? `${soilMoisture}%` : 'N/A'}
Temperature: ${temperature !== undefined ? `${temperature}°C` : 'N/A'}

Analyze this land data and provide a structured assessment including:
1. Degradation level (low/moderate/high)
2. Specific restoration recommendations
3. Flood risk assessment (low/moderate/high)
4. Drought risk assessment (low/moderate/high)

Respond in this exact JSON format:
{
  "degradation_level": "low|moderate|high",
  "ai_recommendation": "specific actionable recommendations",
  "flood_risk": "low|moderate|high",
  "drought_risk": "low|moderate|high"
}
`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert land restoration and climate risk analyst. Analyze environmental data and provide structured assessments in JSON format.'
          },
          {
            role: 'user',
            content: context
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      // Return fallback recommendation on AI API error
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

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response:', aiResponse);

    // Parse JSON response
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback to default values
      result = {
        degradation_level: 'moderate',
        ai_recommendation: aiResponse,
        flood_risk: 'low',
        drought_risk: 'low',
      };
    }

    console.log('Parsed AI recommendation:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-ai-recommendation function:', error);
    // Return fallback recommendation on any error
    return new Response(
      JSON.stringify({
        degradation_level: 'moderate',
        ai_recommendation: 'Implement sustainable land management practices. Monitor vegetation health regularly and consider reforestation efforts in degraded areas.',
        flood_risk: 'low',
        drought_risk: 'moderate',
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
