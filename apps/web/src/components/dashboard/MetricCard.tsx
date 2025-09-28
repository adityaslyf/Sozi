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
      case 'files': return 'Files';
      case 'notes': return 'Notes';
      case 'exercises': return 'Exercises';
      case 'summaries': return 'Summaries';
      default: return 'Metric';
    }
  };

  const getCardColor = (title: string) => {
    switch (title.toLowerCase()) {
      case 'files': return 'bg-white/25 border-white/40';
      case 'notes': return 'bg-green-50/40 border-green-200/50';
      case 'exercises': return 'bg-purple-50/40 border-purple-200/50';
      case 'summaries': return 'bg-yellow-50/40 border-yellow-200/50';
      default: return 'bg-white/25 border-white/40';
    }
  };

  return (
    <div className={`card relative p-6 cursor-pointer hover:scale-[0.97] active:scale-[0.9] transition-all duration-400 backdrop-blur-lg ${getCardColor(title)} border rounded-[2.5em] shadow-xl`}>
      <div className="card-content flex flex-col justify-between gap-16 h-full transition-transform duration-400 hover:scale-[0.96]">
        <div className="card-top flex justify-between">
          <span className="card-title font-bold text-sm" style={{ color: "var(--corp-muted)" }}>{getIcon(title)}</span>
          <div className="w-2.5 h-2.5 rounded-full opacity-70" 
               style={{ background: getAccentColor(title) }}></div>
        </div>
        <div className="card-bottom flex justify-between items-end">
          <p className="text-3xl font-bold m-0" style={{ color: "var(--corp-text)" }}>{value}</p>
          <div className="h-1.5 w-16 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
                 style={{ 
                   width: `${Math.min(value * 10, 100)}%`, 
                   background: `linear-gradient(90deg, ${getAccentColor(title)}, ${getAccentColor(title)}aa)`
                 }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
