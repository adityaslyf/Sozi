import { Link, useLocation } from '@tanstack/react-router';
import { Home, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { googleAuth } from '@/lib/google-auth';
import AUTH_CONFIG from '@/config/auth';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export function Sidebar() {
  const location = useLocation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspaces() {
      const isLoggedIn = googleAuth.isLoggedIn();
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const token = googleAuth.getAccessToken();
        const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        const data = await response.json();
        setWorkspaces(data?.workspaces ?? []);
      } catch (error) {
        console.error('Error loading workspaces:', error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaces();
  }, []);

  const getWorkspaceInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getWorkspaceColor = (index: number) => {
    const colors = [
      'bg-pink-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <aside className="hidden lg:flex w-20 corp-sidebar p-4 h-full overflow-y-auto flex-col">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="corp-pill w-10 h-10 grid place-items-center text-black text-xs font-bold shadow-sm mb-2">AI</div>
        <div className="font-bold text-xs text-center text-white/90">SOZI</div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 space-y-6">
        {/* Home Section */}
        <div className="flex flex-col items-center">
          <Link 
            to="/home" 
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 mb-2 ${
              location.pathname === '/home' 
                ? 'bg-pink-500 text-white shadow-lg' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Home className="w-5 h-5" />
          </Link>
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">HOME</span>
        </div>

        {/* Workspaces Section */}
        <div className="flex flex-col items-center">
          <div className="space-y-3 mb-2">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-12 h-12 bg-white/10 rounded-full animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {workspaces.map((workspace, index) => {
                  const isActive = location.pathname.includes(`/workspaces/${workspace.id}`);
                  return (
                    <Link
                      key={workspace.id}
                      to="/workspaces/$workspaceId"
                      params={{ workspaceId: workspace.id }}
                      className={`flex items-center justify-center w-12 h-12 rounded-full text-white font-semibold text-sm transition-all duration-200 ${
                        isActive 
                          ? `${getWorkspaceColor(index)} shadow-lg scale-110` 
                          : `${getWorkspaceColor(index)} opacity-70 hover:opacity-100 hover:scale-105`
                      }`}
                      title={workspace.name}
                    >
                      {getWorkspaceInitial(workspace.name)}
                    </Link>
                  );
                })}
                
                {/* Add New Workspace */}
                <button className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 hover:scale-105">
                  <Plus className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">SPACES</span>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="space-y-6">
        {/* Tools Section */}
        <div className="flex flex-col items-center">
          <div className="space-y-3 mb-2">
            {/* Chat/Support */}
            <button className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200">
              <span className="text-lg">💬</span>
            </button>
            
            {/* Help */}
            <button className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200">
              <span className="text-lg">❓</span>
            </button>
          </div>
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">TOOLS</span>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center pt-4 border-t border-white/10">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-800 font-semibold text-sm mb-2">
            AV
          </div>
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">PROFILE</span>
        </div>
      </div>
    </aside>
  );
}
