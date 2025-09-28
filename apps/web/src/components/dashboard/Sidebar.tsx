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
    <aside className="hidden lg:block col-span-2 xl:col-span-2 corp-sidebar p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="corp-pill w-9 h-9 grid place-items-center text-black text-sm font-bold shadow-sm">AI</div>
        <div className="font-bold tracking-wide text-base">SOZI</div>
      </div>

      {/* Home Section */}
      <div className="mb-8">
        <Link 
          to="/home" 
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
            location.pathname === '/home' 
              ? 'bg-pink-500 text-white shadow-lg' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          <Home className="w-5 h-5" />
        </Link>
      </div>

      {/* Workspaces Section */}
      <div className="space-y-3 mb-8">
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

      {/* Bottom Section */}
      <div className="mt-auto space-y-3">
        {/* Chat/Support */}
        <button className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200">
          <span className="text-lg">💬</span>
        </button>
        
        {/* Help */}
        <button className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200">
          <span className="text-lg">❓</span>
        </button>
        
        {/* Profile */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-gray-800 font-semibold text-sm">
          AV
        </div>
      </div>
    </aside>
  );
}
