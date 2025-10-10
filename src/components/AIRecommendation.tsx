import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const AIRecommendation = () => {
  // Mock data - will be replaced with real AI recommendations
  const recommendations = [
    "Plant native drought-resistant species in degraded areas",
    "Implement soil conservation techniques to prevent erosion",
    "Establish buffer zones along water bodies",
    "Monitor vegetation recovery monthly using NDVI tracking"
  ];

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
          <Button variant="secondary" className="w-full">
            Generate Detailed Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRecommendation;
