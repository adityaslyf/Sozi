export function CalendarCard() {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const weekDays = ['MON, 3', 'TUE, 4', 'WED, 5', 'THU, 6', 'FRI, 7', 'SAT, 8', 'SUN, 9'];
  const timeSlots = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '13:00 PM'];

  return (
    <div className="corp-glass p-2 group hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <button className="corp-pill px-1.5 py-0.5 text-[9px] font-medium opacity-70 hover:opacity-100 hover:scale-105 transition-all duration-200">
          ← JAN
        </button>
        <div className="flex items-center gap-1.5">
          <div className="text-sm">📅</div>
          <h3 className="font-bold text-xs" style={{ color: "var(--corp-text)" }}>
            {currentMonth}
          </h3>
        </div>
        <button className="corp-pill px-1.5 py-0.5 text-[9px] font-medium opacity-70 hover:opacity-100 hover:scale-105 transition-all duration-200">
          MAR →
        </button>
      </div>
      
      <div className="corp-surface-soft rounded-lg p-2 backdrop-blur-sm">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-1.5 mb-1.5">
          <div className="text-[9px] font-medium opacity-60"></div>
          {weekDays.map(day => (
            <div key={day} className="text-[9px] font-semibold text-center opacity-80 p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer" 
                 style={{ color: "var(--corp-text)" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Time slots and events */}
        <div className="space-y-1.5">
          {timeSlots.map(time => (
            <div key={time} className="grid grid-cols-8 gap-1.5 items-center">
              <div className="text-[9px] font-medium opacity-70 p-0.5 rounded" style={{ color: "var(--corp-muted)" }}>
                {time}
              </div>
              <div className="col-span-7 relative h-5">
                {/* Event blocks */}
                {time === '10:00 AM' && (
                  <div className="absolute left-0 top-0 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[9px] font-medium shadow-lg hover:scale-105 transition-transform cursor-pointer">
                    <span>ONBOARDING SESSION</span>
                    <div className="flex -space-x-0.5">
                      {['👨‍💼', '👩‍💼', '👨‍💻'].map((avatar, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/20 grid place-items-center text-[7px] border border-white/30">
                          {avatar}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {time === '12:00 PM' && (
                  <div className="absolute left-16 top-0 bg-gradient-to-r from-gray-800 to-gray-700 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[9px] font-medium shadow-lg hover:scale-105 transition-transform cursor-pointer">
                    <span>DESIGN TEAM SYNC</span>
                    <div className="flex -space-x-0.5">
                      {['👩‍🎨', '👨‍🎨', '👩‍💻'].map((avatar, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/20 grid place-items-center text-[7px] border border-white/30">
                          {avatar}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Grid lines */}
                <div className="absolute inset-0 border-l border-dashed border-white/20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-1.5 flex items-center justify-between text-[9px] opacity-70" style={{ color: "var(--corp-muted)" }}>
        <span>This week</span>
        <span>2 events scheduled</span>
      </div>
    </div>
  );
}
