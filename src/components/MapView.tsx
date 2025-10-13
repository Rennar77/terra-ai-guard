import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { useLandData } from '@/hooks/useLandData';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { landData, analyzeLocation } = useLandData();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current || map.current) return;

      try {
        // Fetch token from authenticated edge function
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error || !data?.token) {
          console.error('Mapbox token error:', error);
          toast({
            title: 'Configuration Error',
            description: 'Unable to load map configuration',
            variant: 'destructive',
          });
          return;
        }

        mapboxgl.accessToken = data.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center: [0, 20],
          zoom: 2,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add click handler
        map.current.on('click', (e) => {
          setSelectedCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
          
          // Add temporary marker
          new mapboxgl.Marker({ color: '#ff6b6b' })
            .setLngLat([e.lngLat.lng, e.lngLat.lat])
            .addTo(map.current!);
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add markers for existing land data
  useEffect(() => {
    if (!map.current || !landData.length) return;

    landData.forEach((entry) => {
      const color = entry.degradation_level === 'high' ? '#ef4444' : 
                    entry.degradation_level === 'moderate' ? '#eab308' : '#22c55e';

      new mapboxgl.Marker({ color })
        .setLngLat([entry.longitude, entry.latitude])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${entry.location_name}</strong><br/>
             NDVI: ${entry.ndvi_score?.toFixed(2) || 'N/A'}<br/>
             Status: ${entry.degradation_level || 'N/A'}`
          )
        )
        .addTo(map.current!);
    });
  }, [landData]);

  const handleAnalyze = async () => {
    if (!selectedCoords || !locationName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please click on the map and enter a location name',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);
    try {
      await analyzeLocation(locationName, selectedCoords.lat, selectedCoords.lng);
      setLocationName('');
      setSelectedCoords(null);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Land Health Map
        </CardTitle>
        <CardDescription>
          Click anywhere on the map to analyze land health
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div ref={mapContainer} className="w-full h-[400px] rounded-lg overflow-hidden" />
        
        {selectedCoords && (
          <div className="flex gap-2">
            <Input
              placeholder="Enter location name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              disabled={analyzing}
            />
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapView;
