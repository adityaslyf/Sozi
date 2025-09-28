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
  

  return (
    <div className={`p-4 sm:p-5 lg:p-6 ${glass ? 'backdrop-blur-lg bg-white/30 border border-white/40 rounded-2xl sm:rounded-3xl shadow-xl' : 'corp-surface'} h-fit transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6">
        <h3 className="text-lg sm:text-xl lg:text-xl font-bold text-gray-900 truncate pr-2">Onboarding tasks</h3>
        <div className="text-2xl sm:text-3xl lg:text-3xl font-black text-gray-900 flex-shrink-0">{progress}%</div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4 sm:mb-5 lg:mb-6">
        <div className="flex justify-between text-xs sm:text-xs lg:text-xs text-gray-600 mb-2">
          <span>0%</span>
          <span className="hidden sm:inline">50%</span>
          <span>100%</span>
        </div>
        <div className="h-1.5 sm:h-2 lg:h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-green-500 rounded-full transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Task List */}
      <div className="space-y-3 sm:space-y-4 lg:space-y-4">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-3 sm:gap-4 lg:gap-4 group cursor-pointer">
            {/* Task Image */}
            <div className="flex-shrink-0">
              <img 
                src={it.img} 
                className="w-12 h-12 sm:w-14 sm:h-14 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl lg:rounded-2xl object-cover shadow-sm" 
                alt={it.title}
              />
            </div>
            
            {/* Task Content */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-bold text-xs sm:text-sm lg:text-sm text-gray-900 mb-1 uppercase tracking-wide truncate ${
                it.done ? 'line-through opacity-60' : ''
              }`}>
                {it.title}
              </h4>
              <p className="text-xs sm:text-sm lg:text-sm text-gray-600 uppercase tracking-wide truncate">
                {it.time}
              </p>
            </div>
            
            {/* Completion Status */}
            <div className="flex-shrink-0">
              {it.done ? (
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-8 lg:h-8 rounded-full bg-black flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-8 lg:h-8 rounded-full border-2 border-gray-300"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
