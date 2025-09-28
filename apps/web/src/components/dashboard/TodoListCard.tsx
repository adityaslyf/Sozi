interface TodoListCardProps {
  glass?: boolean;
}

export function TodoListCard({ glass = false }: TodoListCardProps) {
  const items = [
    { 
      title: 'Onboarding session', 
      time: 'Mon, Feb 3 | 10:00', 
      done: true, 
      img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=200&auto=format&fit=crop',
      priority: 'high'
    },
    { 
      title: 'Interview', 
      time: 'Mon, Feb 3 | 14:00', 
      done: true, 
      img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=200&auto=format&fit=crop',
      priority: 'medium'
    },
    { 
      title: 'Project update', 
      time: 'Mon, Feb 3 | 14:30', 
      done: true, 
      img: 'https://images.unsplash.com/photo-1552664730-7d8c2a5f59c7?q=80&w=200&auto=format&fit=crop',
      priority: 'low'
    },
    { 
      title: 'HR policy review', 
      time: 'Mon, Feb 3 | 16:00', 
      done: false, 
      img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=200&auto=format&fit=crop',
      priority: 'medium'
    },
    { 
      title: 'Team meeting prep', 
      time: 'Tue, Feb 4 | 09:00', 
      done: false, 
      img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=200&auto=format&fit=crop',
      priority: 'high'
    },
  ];
  
  const progress = Math.round((items.filter(i => i.done).length / items.length) * 100);
  
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`p-6 ${glass ? 'corp-glass' : 'corp-surface'} h-fit hover:scale-[1.01] transition-all duration-300`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-xl">✅</div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: "var(--corp-text)" }}>Onboarding tasks</h3>
            <p className="text-xs opacity-70 mt-1" style={{ color: "var(--corp-muted)" }}>
              {items.filter(i => !i.done).length} remaining
            </p>
          </div>
        </div>
        <div className="text-2xl font-black" style={{ color: "var(--corp-text)" }}>{progress}%</div>
      </div>
      
      <div className="h-4 rounded-full corp-surface-soft overflow-hidden mb-6 shadow-inner">
        <div className="h-full rounded-full transition-all duration-1000 shadow-sm" 
             style={{ 
               width: `${progress}%`, 
               background: "linear-gradient(90deg, var(--corp-green), #22c55e)"
             }} />
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {items.map((it, idx) => (
          <div key={idx} className="corp-task-item flex items-center gap-4 p-4 rounded-2xl corp-surface-soft group cursor-pointer hover:shadow-md transition-all duration-200">
            <div className="relative">
              <img src={it.img} className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-200" />
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(it.priority)} shadow-sm`}></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-sm truncate transition-all duration-200 ${
                it.done ? 'line-through opacity-70' : 'group-hover:translate-x-1'
              }`} style={{ color: "var(--corp-text)" }}>
                {it.title}
              </div>
              <div className="text-xs mt-1 font-medium opacity-70 flex items-center gap-2" 
                   style={{ color: "var(--corp-text-secondary)" }}>
                <span>📅</span>
                <span>{it.time}</span>
              </div>
            </div>
            <div className={`w-7 h-7 rounded-full grid place-items-center flex-shrink-0 text-sm font-bold transition-all duration-200 shadow-sm ${
              it.done
                ? 'bg-green-500 text-white scale-110 animate-pulse'
                : 'border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 hover:scale-110'
            }`}>
              {it.done ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs opacity-70" style={{ color: "var(--corp-muted)" }}>
          <span>Updated 2 mins ago</span>
          <span>Keep going! 🚀</span>
        </div>
      </div>
    </div>
  );
}
