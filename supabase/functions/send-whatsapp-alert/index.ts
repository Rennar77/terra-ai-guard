import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRequest {
  phone: string;
  locationName: string;
  degradationLevel?: string;
  aiRecommendation?: string;
  floodRisk?: string;
  droughtRisk?: string;
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

    const { phone, locationName, degradationLevel, aiRecommendation, floodRisk, droughtRisk }: AlertRequest = body;

    if (!phone || !locationName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: phone and locationName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const whatsappNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!accountSid || !authToken || !whatsappNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // Format the alert message
    let message = `🚨 *GaiaGuard Alert*\n\nLocation: ${locationName}\n`;
    
    if (degradationLevel) {
      message += `Status: ${degradationLevel}\n`;
    }
    if (floodRisk && floodRisk !== 'low') {
      message += `Flood Risk: ${floodRisk}\n`;
    }
    if (droughtRisk && droughtRisk !== 'low') {
      message += `Drought Risk: ${droughtRisk}\n`;
    }
    if (aiRecommendation) {
      message += `\nRecommendation: ${aiRecommendation}\n`;
    }
    
    message += `\nStay safe and take early action. 🌿`;

    console.log('Sending WhatsApp alert to:', phone);

    // Send WhatsApp message via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${whatsappNumber}`,
        To: `whatsapp:${phone}`,
        Body: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio error:', response.status, errorText);
      
      let errorMessage = `Twilio API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.code === 63007) {
          errorMessage = 'WhatsApp number not activated. Please activate your Twilio WhatsApp sender in the Twilio console.';
        } else {
          errorMessage = errorJson.message || errorMessage;
        }
      } catch (e) {
        // Use default error message
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('WhatsApp alert sent successfully:', data.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: data.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-whatsapp-alert function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
