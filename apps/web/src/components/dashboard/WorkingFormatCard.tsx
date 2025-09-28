export function WorkingFormatCard() {
  return (
    <div className="corp-glass p-4 h-full group hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-xl">📊</div>
          <h3 className="text-lg font-bold" style={{ color: "var(--corp-text)" }}>Working format</h3>
        </div>
        <button className="w-7 h-7 rounded-full corp-surface-soft grid place-items-center text-xs opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-200">
          ⋯
        </button>
      </div>
      
      <div className="flex items-center justify-center py-4">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12"/>
            
            {/* Progress segments with glow effect */}
            {/* Teal segment - 50% (180 degrees) */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="#14b8a6" strokeWidth="12" 
                    strokeDasharray="141 283" strokeDashoffset="0" strokeLinecap="round"
                    className="drop-shadow-lg"/>
            
            {/* Purple segment - 30% (108 degrees) */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="#c084fc" strokeWidth="12" 
                    strokeDasharray="85 283" strokeDashoffset="-141" strokeLinecap="round"
                    className="drop-shadow-lg"/>
            
            {/* Yellow segment - 20% (72 degrees) */}
            <circle cx="60" cy="60" r="45" fill="none" stroke="#fbbf24" strokeWidth="12" 
                    strokeDasharray="57 283" strokeDashoffset="-226" strokeLinecap="round"
                    className="drop-shadow-lg"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-black group-hover:scale-105 transition-transform duration-300" style={{ color: "var(--corp-text)" }}>500</div>
            <div className="text-[10px] font-medium opacity-70 tracking-wider" style={{ color: "var(--corp-muted)" }}>DAYS</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center mb-3">
        <div className="p-2 corp-surface-soft rounded-xl hover:scale-105 transition-transform duration-200 cursor-pointer">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm"></div>
            <span className="font-bold text-sm" style={{ color: "var(--corp-text)" }}>50%</span>
          </div>
          <div className="text-[10px] font-medium opacity-70 tracking-wider" style={{ color: "var(--corp-muted)" }}>OFFICE</div>
        </div>
        <div className="p-2 corp-surface-soft rounded-xl hover:scale-105 transition-transform duration-200 cursor-pointer">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm"></div>
            <span className="font-bold text-sm" style={{ color: "var(--corp-text)" }}>30%</span>
          </div>
          <div className="text-[10px] font-medium opacity-70 tracking-wider" style={{ color: "var(--corp-muted)" }}>HYBRID</div>
        </div>
        <div className="p-2 corp-surface-soft rounded-xl hover:scale-105 transition-transform duration-200 cursor-pointer">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></div>
            <span className="font-bold text-sm" style={{ color: "var(--corp-text)" }}>20%</span>
          </div>
          <div className="text-[10px] font-medium opacity-70 tracking-wider" style={{ color: "var(--corp-muted)" }}>REMOTE</div>
        </div>
      </div>

      <div className="text-xs font-medium opacity-70 flex items-center gap-2" style={{ color: "var(--corp-muted)" }}>
        <div className="text-sm">📅</div>
        <span>Exam date: 03/10/2025</span>
      </div>
    </div>
  );
}
