export function ActivityCard() {
  // Enhanced mock line chart with multiple data series
  const points = [2, 3, 6, 4, 8, 10, 12, 11, 13, 14];
  const points2 = [1, 4, 3, 7, 5, 9, 8, 12, 10, 11];
  const max = Math.max(...points, ...points2);
  
  const createPath = (data: number[]) => 
    data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * 28} ${100 - (p / max) * 80}`).join(' ');

  return (
    <div className="card relative p-6 hover:scale-[0.97] active:scale-[0.9] transition-all duration-400 backdrop-blur-lg bg-white/25 border border-white/40 rounded-[2.5em] shadow-xl">
      <div className="card-content flex flex-col justify-between h-full transition-transform duration-400 hover:scale-[0.96]">
        <div className="card-top flex justify-between mb-4">
          <h3 className="card-title font-bold text-base m-0" style={{ color: "var(--corp-text)" }}>Activity Overview</h3>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="opacity-70" style={{ color: "var(--corp-muted)" }}>Study</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="opacity-70" style={{ color: "var(--corp-muted)" }}>Progress</span>
            </div>
          </div>
        </div>
        
        <div className="h-32 rounded-2xl corp-surface-soft p-3 relative overflow-hidden">
          <svg width="100%" height="100" className="absolute inset-3">
            <defs>
              <pattern id="grid" width="28" height="20" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
              </pattern>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path d={`${createPath(points)} L ${(points.length-1) * 28} 100 L 0 100 Z`} fill="url(#areaGradient)" />
            <path d={createPath(points)} stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <path d={createPath(points2)} stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {points.map((p, i) => (
              <circle key={i} cx={i * 28} cy={100 - (p / max) * 80} r="4" fill="#3b82f6"/>
            ))}
            {points2.map((p, i) => (
              <circle key={i} cx={i * 28} cy={100 - (p / max) * 80} r="4" fill="#10b981"/>
            ))}
          </svg>
        </div>
        
        <div className="card-bottom flex justify-between items-end text-xs opacity-70" style={{ color: "var(--corp-muted)" }}>
          <p className="m-0 font-semibold">Last 10 days</p>
          <p className="m-0 font-semibold">Trending up ↗</p>
        </div>
      </div>
    </div>
  );
}
