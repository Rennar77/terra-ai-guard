interface RiskIndicatorProps {
  level: string | null;
  label: string;
}

const RiskIndicator = ({ level, label }: RiskIndicatorProps) => {
  const getRiskColor = (risk: string | null) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'moderate':
        return 'bg-yellow-500 text-yellow-50';
      case 'low':
        return 'bg-green-500 text-green-50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const displayLevel = level || 'N/A';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(level)}`}>
        {displayLevel.toUpperCase()}
      </span>
    </div>
  );
};

export default RiskIndicator;
