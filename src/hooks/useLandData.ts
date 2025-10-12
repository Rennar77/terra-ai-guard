import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LandDataEntry {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  ndvi_score: number | null;
  soil_moisture: number | null;
  temperature: number | null;
  degradation_level: string | null;
  ai_recommendation: string | null;
  flood_risk: string | null;
  drought_risk: string | null;
  whatsapp_status: boolean | null;
  created_at: string | null;
}

export const useLandData = () => {
  const [landData, setLandData] = useState<LandDataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLandData = async () => {
    try {
      const { data, error } = await supabase
        .from('land_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLandData(data || []);
    } catch (error) {
      console.error('Error fetching land data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch land data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendAlert = async (entry: LandDataEntry, phone: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-alert', {
        body: {
          phone,
          locationName: entry.location_name,
          degradationLevel: entry.degradation_level,
          aiRecommendation: entry.ai_recommendation,
          floodRisk: entry.flood_risk,
          droughtRisk: entry.drought_risk,
        },
      });

      if (error) throw error;

      // Update whatsapp_status
      await supabase
        .from('land_data')
        .update({ whatsapp_status: true })
        .eq('id', entry.id);

      toast({
        title: 'Alert Sent',
        description: `WhatsApp alert sent successfully for ${entry.location_name}`,
      });

      // Refresh data
      fetchLandData();
    } catch (error) {
      console.error('Error sending alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to send WhatsApp alert',
        variant: 'destructive',
      });
    }
  };

  const analyzeLocation = async (locationName: string, latitude: number, longitude: number) => {
    try {
      // Fetch NASA data
      const { data: nasaData, error: nasaError } = await supabase.functions.invoke('fetch-nasa-data', {
        body: { latitude, longitude },
      });

      if (nasaError) throw nasaError;

      // Generate AI recommendation
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-ai-recommendation', {
        body: {
          locationName,
          latitude,
          longitude,
          ndviScore: nasaData.ndviScore,
          soilMoisture: nasaData.soilMoisture,
          temperature: nasaData.temperature,
        },
      });

      if (aiError) throw aiError;

      // Save to database
      const { error: insertError } = await supabase.from('land_data').insert({
        location_name: locationName,
        latitude,
        longitude,
        ndvi_score: nasaData.ndviScore,
        soil_moisture: nasaData.soilMoisture,
        temperature: nasaData.temperature,
        degradation_level: aiData.degradation_level,
        ai_recommendation: aiData.ai_recommendation,
        flood_risk: aiData.flood_risk,
        drought_risk: aiData.drought_risk,
      });

      if (insertError) throw insertError;

      toast({
        title: 'Analysis Complete',
        description: `Location ${locationName} has been analyzed successfully`,
      });

      // Refresh data
      fetchLandData();

      // Auto-send alert if high risk
      if (aiData.degradation_level === 'high' || aiData.flood_risk === 'high' || aiData.drought_risk === 'high') {
        return { shouldAlert: true, data: aiData };
      }

      return { shouldAlert: false, data: aiData };
    } catch (error) {
      console.error('Error analyzing location:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze location',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchLandData();
  }, []);

  return { landData, loading, sendAlert, analyzeLocation, refetch: fetchLandData };
};
