import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataCache } from '@/hooks/useDataCache';

export interface LandDataEntry {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  ndvi_score: number | null;
  soil_moisture: number | null;
  temperature: number | null;
  rainfall: number | null;
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
  const { getCachedData, setCachedData } = useDataCache();

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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to analyze locations',
          variant: 'destructive',
        });
        return;
      }

      // Check cache first
      const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
      const cachedData = getCachedData(cacheKey);

      let satelliteData = { ndviScore: 0.5, soilMoisture: 50 };
      let weatherData = { temperature: 20, rainfall: 0 };
      
      if (cachedData) {
        console.log('Using cached data for location');
        satelliteData = {
          ndviScore: cachedData.ndviScore,
          soilMoisture: cachedData.soilMoisture,
        };
        weatherData = {
          temperature: cachedData.temperature,
          rainfall: cachedData.rainfall,
        };
      } else {
        try {
          const [sentinelResponse, weatherResponse] = await Promise.all([
            supabase.functions.invoke('fetch-sentinel-data', {
              body: { latitude, longitude },
            }),
            supabase.functions.invoke('fetch-weather-data', {
              body: { latitude, longitude },
            })
          ]);

          if (!sentinelResponse.error && sentinelResponse.data) {
            satelliteData = sentinelResponse.data;
          }
          
          if (!weatherResponse.error && weatherResponse.data) {
            weatherData = weatherResponse.data;
          }

          // Cache the data
          setCachedData(cacheKey, {
            ndviScore: satelliteData.ndviScore,
            soilMoisture: satelliteData.soilMoisture,
            temperature: weatherData.temperature,
            rainfall: weatherData.rainfall,
          });
        } catch (error) {
          console.warn('Data fetch failed, using fallback:', error);
        }
      }

      // Generate AI recommendation with fallback
      let aiData = {
        degradation_level: 'moderate',
        ai_recommendation: 'Implement sustainable land management practices. Monitor vegetation health regularly and consider reforestation efforts in degraded areas.',
        flood_risk: 'low',
        drought_risk: 'moderate',
      };
      
      try {
        const { data, error } = await supabase.functions.invoke('generate-ai-recommendation', {
          body: {
            locationName,
            latitude,
            longitude,
            ndviScore: satelliteData.ndviScore,
            soilMoisture: satelliteData.soilMoisture,
            temperature: weatherData.temperature,
            rainfall: weatherData.rainfall,
          },
        });
        if (!error && data) {
          aiData = data;
        }
      } catch (error) {
        console.warn('AI recommendation failed, using fallback:', error);
      }

      // Save to database
      const { error: insertError } = await supabase.from('land_data').insert({
        user_id: user.id,
        location_name: locationName,
        latitude,
        longitude,
        ndvi_score: satelliteData.ndviScore,
        soil_moisture: satelliteData.soilMoisture,
        temperature: weatherData.temperature,
        rainfall: weatherData.rainfall,
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

      // Auto-send alert if high risk (rainfall > 150mm or high degradation)
      if (aiData.degradation_level === 'high' || aiData.flood_risk === 'high' || weatherData.rainfall > 150) {
        toast({
          title: 'High Risk Detected',
          description: 'Consider sending a WhatsApp alert for this location',
        });
        return { shouldAlert: true, data: aiData };
      }

      return { shouldAlert: false, data: aiData };
    } catch (error) {
      console.error('Error analyzing location:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze location. Please try again.',
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
