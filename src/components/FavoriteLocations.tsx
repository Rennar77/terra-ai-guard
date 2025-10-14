import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MapPin, Trash2 } from "lucide-react";
import { useFavoriteLocations } from "@/hooks/useFavoriteLocations";
import { Button } from "@/components/ui/button";
import { useLandData } from "@/hooks/useLandData";
import { useState } from "react";

const FavoriteLocations = () => {
  const { favorites, removeFavorite } = useFavoriteLocations();
  const { analyzeLocation } = useLandData();
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const handleAnalyze = async (location: { id: string; location_name: string; latitude: number; longitude: number }) => {
    setAnalyzingId(location.id);
    try {
      await analyzeLocation(location.location_name, location.latitude, location.longitude);
    } finally {
      setAnalyzingId(null);
    }
  };

  if (favorites.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-accent" />
          Favorite Locations
        </CardTitle>
        <CardDescription>
          Quick access to your monitored locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {favorites.map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/10 hover:bg-accent/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{location.location_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAnalyze(location)}
                  disabled={analyzingId === location.id}
                >
                  {analyzingId === location.id ? 'Analyzing...' : 'Analyze'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFavorite(location.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoriteLocations;
