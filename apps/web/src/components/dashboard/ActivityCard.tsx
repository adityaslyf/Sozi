export function ActivityCard() {
  // Enhanced mock line chart with multiple data series
  const points = [2, 3, 6, 4, 8, 10, 12, 11, 13, 14];
  const points2 = [1, 4, 3, 7, 5, 9, 8, 12, 10, 11];
  const max = Math.max(...points, ...points2);
  
  const createPath = (data: number[]) => 
    data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * 28} ${100 - (p / max) * 80}`).join(' ');

  return (
    <div className="corp-glass p-4 group hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-xl">📈</div>
          <h3 className="font-bold text-base" style={{ color: "var(--corp-text)" }}>Activity Overview</h3>
        </div>
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
      
      <div className="h-36 rounded-2xl corp-surface-soft p-3 relative overflow-hidden group-hover:shadow-inner transition-shadow duration-300">
        <svg width="100%" height="108" className="absolute inset-3">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="28" height="20" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Area fill for first line */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          <path d={`${createPath(points)} L ${(points.length-1) * 28} 100 L 0 100 Z`} 
                fill="url(#areaGradient)" />
          
          {/* Lines */}
          <path d={createPath(points)} stroke="#3b82f6" strokeWidth="3" fill="none" 
                strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm"/>
          <path d={createPath(points2)} stroke="#10b981" strokeWidth="3" fill="none" 
                strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm"/>
          
          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={i * 28} cy={100 - (p / max) * 80} r="4" fill="#3b82f6" 
                    className="hover:r-6 transition-all duration-200 cursor-pointer drop-shadow-sm"/>
          ))}
          {points2.map((p, i) => (
            <circle key={i} cx={i * 28} cy={100 - (p / max) * 80} r="4" fill="#10b981" 
                    className="hover:r-6 transition-all duration-200 cursor-pointer drop-shadow-sm"/>
          ))}
        </svg>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs opacity-70" style={{ color: "var(--corp-muted)" }}>
        <span>Last 10 days</span>
        <span>Trending up ↗</span>
      </div>
    </div>
  );
}
