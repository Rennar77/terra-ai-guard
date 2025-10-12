import { Droplets, Thermometer, Cloud, Leaf } from "lucide-react";
import DataCard from "@/components/DataCard";
import MapView from "@/components/MapView";
import AIRecommendation from "@/components/AIRecommendation";
import LandDataTable from "@/components/LandDataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLandData } from "@/hooks/useLandData";

const Dashboard = () => {
  const navigate = useNavigate();
  const { landData, loading, sendAlert } = useLandData();

  // Calculate aggregate data from all entries
  const aggregateData = landData.length > 0 ? {
    ndvi: landData.reduce((sum, entry) => sum + (entry.ndvi_score || 0), 0) / landData.length,
    soilMoisture: landData.reduce((sum, entry) => sum + (entry.soil_moisture || 0), 0) / landData.length,
    temperature: landData.reduce((sum, entry) => sum + (entry.temperature || 0), 0) / landData.length,
    rainfall: 125, // Mock data - can be extended with weather API
  } : {
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
            value={aggregateData.ndvi.toFixed(2)}
            icon={Leaf}
            trend="up"
            description={landData.length > 0 ? `Average across ${landData.length} locations` : "No data"}
          />
          <DataCard
            title="Soil Moisture"
            value={Math.round(aggregateData.soilMoisture)}
            unit="%"
            icon={Droplets}
            trend="neutral"
            description="Average levels"
          />
          <DataCard
            title="Rainfall Forecast"
            value={aggregateData.rainfall}
            unit="mm"
            icon={Cloud}
            trend="up"
            description="Next 7 days"
          />
          <DataCard
            title="Temperature"
            value={Math.round(aggregateData.temperature)}
            unit="°C"
            icon={Thermometer}
            trend="up"
            description="Average temperature"
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

        {/* Land Data Monitoring */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Location Monitoring & Alerts</CardTitle>
              <CardDescription>
                Track land health across locations and send WhatsApp alerts for critical conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading land data...</p>
                </div>
              ) : (
                <LandDataTable data={landData} onSendAlert={sendAlert} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
