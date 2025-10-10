import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

const DataCard = ({ title, value, unit, icon: Icon, trend, description }: DataCardProps) => {
  const trendColors = {
    up: "text-accent",
    down: "text-destructive",
    neutral: "text-muted-foreground"
  };

  return (
    <Card className="hover:shadow-elevation transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">{value}</div>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {description && (
          <p className={`text-xs mt-1 ${trend ? trendColors[trend] : "text-muted-foreground"}`}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DataCard;
