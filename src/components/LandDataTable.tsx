import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bell, Loader2 } from 'lucide-react';
import RiskIndicator from './RiskIndicator';
import { LandDataEntry } from '@/hooks/useLandData';

interface LandDataTableProps {
  data: LandDataEntry[];
  onSendAlert: (entry: LandDataEntry, phone: string) => Promise<void>;
}

const LandDataTable = ({ data, onSendAlert }: LandDataTableProps) => {
  const [phoneNumbers, setPhoneNumbers] = useState<{ [key: string]: string }>({});
  const [sendingAlerts, setSendingAlerts] = useState<{ [key: string]: boolean }>({});

  const handleSendAlert = async (entry: LandDataEntry) => {
    const phone = phoneNumbers[entry.id];
    if (!phone) {
      alert('Please enter a phone number');
      return;
    }

    setSendingAlerts({ ...sendingAlerts, [entry.id]: true });
    try {
      await onSendAlert(entry, phone);
    } finally {
      setSendingAlerts({ ...sendingAlerts, [entry.id]: false });
    }
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No land data available. Add a location to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((entry) => (
        <Card key={entry.id} className="overflow-hidden">
          <CardHeader className="bg-accent/5">
            <CardTitle className="flex items-center justify-between">
              <span>{entry.location_name}</span>
              {entry.whatsapp_status && (
                <span className="text-xs font-normal text-muted-foreground">Alert Sent ✓</span>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Coordinates: {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">NDVI Score:</span>
                  <span className="font-medium">{entry.ndvi_score?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Soil Moisture:</span>
                  <span className="font-medium">{entry.soil_moisture ? `${entry.soil_moisture}%` : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Temperature:</span>
                  <span className="font-medium">{entry.temperature ? `${entry.temperature}°C` : 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <RiskIndicator level={entry.degradation_level} label="Degradation" />
                <RiskIndicator level={entry.flood_risk} label="Flood Risk" />
                <RiskIndicator level={entry.drought_risk} label="Drought Risk" />
              </div>
            </div>

            {entry.ai_recommendation && (
              <div className="mb-4 p-3 bg-accent/5 rounded-lg">
                <p className="text-sm font-medium mb-1">AI Recommendation:</p>
                <p className="text-sm text-muted-foreground">{entry.ai_recommendation}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                type="tel"
                placeholder="+1234567890"
                value={phoneNumbers[entry.id] || ''}
                onChange={(e) => setPhoneNumbers({ ...phoneNumbers, [entry.id]: e.target.value })}
                className="flex-1"
              />
              <Button
                onClick={() => handleSendAlert(entry)}
                disabled={sendingAlerts[entry.id] || entry.whatsapp_status === true}
                variant="default"
              >
                {sendingAlerts[entry.id] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Send Alert
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LandDataTable;
