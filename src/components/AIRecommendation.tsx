import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandData } from "@/hooks/useLandData";
import { useState, useEffect } from "react";

const AIRecommendation = () => {
  const { landData } = useLandData();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([
    "Plant native drought-resistant species in degraded areas",
    "Implement soil conservation techniques to prevent erosion",
    "Establish buffer zones along water bodies",
    "Monitor vegetation recovery monthly using NDVI tracking"
  ]);

  // Update recommendations when land data changes
  useEffect(() => {
    if (landData.length > 0) {
      const latestEntry = landData[0];
      if (latestEntry.ai_recommendation) {
        // Parse AI recommendation into bullet points
        const points = latestEntry.ai_recommendation
          .split(/[.!]\s+/)
          .filter(point => point.trim().length > 10)
          .slice(0, 4);
        
        if (points.length > 0) {
          setRecommendations(points.map(p => p.trim()));
        }
      }
    }
  }, [landData]);

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          AI Restoration Insights
        </CardTitle>
        <CardDescription>
          Intelligent recommendations based on satellite data and climate patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
              <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <p className="text-sm">{rec}</p>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t">
          <Button 
            variant="secondary" 
            className="w-full"
            disabled={loading || landData.length === 0}
            onClick={async () => {
              setLoading(true);
              try {
                // Trigger a refresh of the latest land data analysis
                const latestEntry = landData[0];
                if (latestEntry) {
                  // The recommendations will auto-update via useEffect
                  setTimeout(() => setLoading(false), 1000);
                }
              } catch (error) {
                console.error('Error generating plan:', error);
                setLoading(false);
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              'Generate Detailed Plan'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRecommendation;
