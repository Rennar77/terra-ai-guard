import { Droplets, Thermometer, Cloud, Leaf } from "lucide-react";
import DataCard from "@/components/DataCard";
import MapView from "@/components/MapView";
import AIRecommendation from "@/components/AIRecommendation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  // Mock data - will be replaced with real API data
  const mockData = {
    ndvi: 0.67,
    soilMoisture: 34,
    rainfall: 125,
    temperature: 24
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">GaiaGuard</h1>
            </div>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Land Health Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring and AI-powered restoration insights
          </p>
        </div>

        {/* Data Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DataCard
            title="Vegetation Index (NDVI)"
            value={mockData.ndvi}
            icon={Leaf}
            trend="up"
            description="+0.08 from last month"
          />
          <DataCard
            title="Soil Moisture"
            value={mockData.soilMoisture}
            unit="%"
            icon={Droplets}
            trend="neutral"
            description="Stable levels"
          />
          <DataCard
            title="Rainfall Forecast"
            value={mockData.rainfall}
            unit="mm"
            icon={Cloud}
            trend="up"
            description="Next 7 days"
          />
          <DataCard
            title="Temperature"
            value={mockData.temperature}
            unit="°C"
            icon={Thermometer}
            trend="up"
            description="+2°C above average"
          />
        </div>

        {/* Map and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MapView />
          </div>
          <div className="lg:col-span-1">
            <AIRecommendation />
          </div>
        </div>

        {/* Climate Risk Chart Placeholder */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Climate Risk Trends</CardTitle>
              <CardDescription>Historical and projected degradation levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Chart visualization will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
