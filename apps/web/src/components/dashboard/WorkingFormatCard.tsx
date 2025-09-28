export function WorkingFormatCard() {
  return (
    <div className="card relative p-6 h-full hover:scale-[0.97] active:scale-[0.9] transition-all duration-400 backdrop-blur-lg bg-white/25 border border-white/40 rounded-[2.5em] shadow-xl">
      <div className="card-content flex flex-col justify-between h-full transition-transform duration-400 hover:scale-[0.96]">
        <div className="card-top flex justify-between mb-4">
          <h3 className="card-title font-bold text-lg m-0" style={{ color: "var(--corp-text)" }}>Working format</h3>
          <button className="w-6 h-6 rounded-full bg-white/20 grid place-items-center text-xs opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-200">
            ⋯
          </button>
        </div>
        
        <div className="flex items-center justify-center py-2">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="12"/>
              <circle cx="60" cy="60" r="45" fill="none" stroke="#14b8a6" strokeWidth="12" 
                      strokeDasharray="141 283" strokeDashoffset="0" strokeLinecap="round"/>
              <circle cx="60" cy="60" r="45" fill="none" stroke="#c084fc" strokeWidth="12" 
                      strokeDasharray="85 283" strokeDashoffset="-141" strokeLinecap="round"/>
              <circle cx="60" cy="60" r="45" fill="none" stroke="#fbbf24" strokeWidth="12" 
                      strokeDasharray="57 283" strokeDashoffset="-226" strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-black" style={{ color: "var(--corp-text)" }}>500</div>
              <div className="text-[9px] font-medium opacity-70" style={{ color: "var(--corp-muted)" }}>DAYS</div>
            </div>
          </div>
        </div>

        <div className="card-bottom">
          <div className="grid grid-cols-3 gap-2 text-center mb-3">
            <div className="p-1.5 corp-surface-soft rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                <span className="font-bold text-xs" style={{ color: "var(--corp-text)" }}>50%</span>
              </div>
              <div className="text-[9px] font-medium opacity-70" style={{ color: "var(--corp-muted)" }}>OFFICE</div>
            </div>
            <div className="p-1.5 corp-surface-soft rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <span className="font-bold text-xs" style={{ color: "var(--corp-text)" }}>30%</span>
              </div>
              <div className="text-[9px] font-medium opacity-70" style={{ color: "var(--corp-muted)" }}>HYBRID</div>
            </div>
            <div className="p-1.5 corp-surface-soft rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="font-bold text-xs" style={{ color: "var(--corp-text)" }}>20%</span>
              </div>
              <div className="text-[9px] font-medium opacity-70" style={{ color: "var(--corp-muted)" }}>REMOTE</div>
            </div>
          </div>
          <div className="text-xs font-medium opacity-70" style={{ color: "var(--corp-muted)" }}>
            <span>Exam date: 03/10/2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}
