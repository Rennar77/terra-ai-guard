import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const MapView = () => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Land Health Map
        </CardTitle>
        <CardDescription>
          Interactive satellite view showing vegetation and degradation levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden border-2 border-border">
          {/* Placeholder for map - will integrate Mapbox/Leaflet later */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Interactive map will load here
              </p>
              <p className="text-xs text-muted-foreground">
                Click locations to analyze land health
              </p>
            </div>
          </div>
          
          {/* Mock location markers */}
          <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-accent rounded-full animate-pulse" />
          <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-secondary rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};

export default MapView;
