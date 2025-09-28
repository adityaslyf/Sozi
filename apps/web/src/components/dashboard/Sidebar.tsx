export function Sidebar() {
  return (
    <aside className="hidden lg:block col-span-2 xl:col-span-2 corp-sidebar p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="corp-pill w-9 h-9 grid place-items-center text-black text-sm font-bold shadow-sm">AI</div>
        <div className="font-bold tracking-wide text-base">SOZI</div>
      </div>
      <nav className="space-y-2 text-sm">
        <div className="opacity-60 mb-4 text-xs font-medium tracking-wider">MENU</div>
        <a className="corp-nav-item active flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200">
          <div className="w-1.5 h-1.5 rounded-full bg-white/70"></div>
          <span className="font-medium">Dashboard</span>
        </a>
        <a className="corp-nav-item flex items-center gap-3 px-4 py-3 rounded-xl opacity-70 transition-all duration-200">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
          <span className="font-medium">Files</span>
        </a>
        <a className="corp-nav-item flex items-center gap-3 px-4 py-3 rounded-xl opacity-70 transition-all duration-200">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
          <span className="font-medium">Exercises</span>
        </a>
        <a className="corp-nav-item flex items-center gap-3 px-4 py-3 rounded-xl opacity-70 transition-all duration-200">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
          <span className="font-medium">Notes</span>
        </a>
        <a className="corp-nav-item flex items-center gap-3 px-4 py-3 rounded-xl opacity-70 transition-all duration-200">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
          <span className="font-medium">Settings</span>
        </a>
      </nav>
      <div className="mt-auto pt-8">
        <div className="corp-surface-soft p-4 rounded-2xl text-black backdrop-blur-sm">
          <div className="font-semibold mb-2 text-sm">AI for results</div>
          <p className="text-xs opacity-70 mb-4 leading-relaxed">Get suggestions to improve your study sessions</p>
          <button className="corp-pill px-4 py-2 text-xs font-medium hover:scale-105 transition-transform duration-200">Try now</button>
        </div>
      </div>
    </aside>
  );
}
