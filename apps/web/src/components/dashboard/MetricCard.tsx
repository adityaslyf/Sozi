interface MetricCardProps {
  title: string;
  value: number;
}

export function MetricCard({ title, value }: MetricCardProps) {
  const getAccentColor = (title: string) => {
    switch (title.toLowerCase()) {
      case 'files': return 'var(--corp-blue)';
      case 'notes': return 'var(--corp-green)';
      case 'exercises': return 'var(--corp-purple)';
      case 'summaries': return '#f59e0b';
      default: return 'var(--corp-text)';
    }
  };

  const getIcon = (title: string) => {
    switch (title.toLowerCase()) {
      case 'files': return '📁';
      case 'notes': return '📝';
      case 'exercises': return '🏋️';
      case 'summaries': return '📊';
      default: return '📈';
    }
  };

  return (
    <div className="corp-glass corp-metric-card p-4 group cursor-pointer hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-lg">{getIcon(title)}</div>
          <p className="text-xs font-semibold opacity-80" style={{ color: "var(--corp-muted)" }}>{title}</p>
        </div>
        <div className="w-2.5 h-2.5 rounded-full opacity-70 group-hover:opacity-100 transition-opacity" 
             style={{ background: getAccentColor(title) }}></div>
      </div>
      <p className="text-3xl font-black group-hover:scale-105 transition-transform duration-200 mb-3" 
         style={{ color: "var(--corp-text)" }}>
        {value}
      </p>
      <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 delay-300 shadow-sm"
             style={{ 
               width: `${Math.min(value * 10, 100)}%`, 
               background: `linear-gradient(90deg, ${getAccentColor(title)}, ${getAccentColor(title)}aa)`
             }}></div>
      </div>
    </div>
  );
}
