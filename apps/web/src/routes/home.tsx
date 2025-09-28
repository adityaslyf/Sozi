import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { googleAuth } from '@/lib/google-auth';
import AUTH_CONFIG from '@/config/auth';
import { Sidebar } from '@/components/dashboard';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const isLoggedIn = googleAuth.isLoggedIn();

  useEffect(() => {
    async function loadWorkspaces() {
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
      } catch (err) {
        console.error('Error loading workspaces:', err);
        setError('Failed to load workspaces');
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaces();
  }, [isLoggedIn]);

  const user = googleAuth.getCurrentUser();

  if (!isLoggedIn) {
    return (
      <div className="corp-theme min-h-screen grid place-items-center" style={{ background: "var(--corp-bg)" }}>
        <div className="corp-glass p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--corp-text)" }}>
            Please log in to view your workspaces
          </h2>
          <p className="text-sm opacity-70 mb-6" style={{ color: "var(--corp-muted)" }}>
            You need to be authenticated to access your workspaces.
          </p>
          <button 
            onClick={() => googleAuth.signIn()} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="corp-theme min-h-screen lg:h-screen lg:overflow-hidden" style={{ background: "var(--corp-bg)" }}>
      <div className="grid grid-cols-12 gap-4 md:gap-6 lg:gap-8 px-3 md:px-4 lg:px-6 pt-24 pb-4 min-h-screen lg:h-full max-w-[1600px] mx-auto">
        {/* Sidebar Component */}
        <Sidebar />

        {/* Main Content */}
        <section className="col-span-12 lg:col-span-10 xl:col-span-10 flex flex-col lg:h-full lg:overflow-y-auto p-8">
          {loading ? (
            <div className="h-[60vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8 text-center">
              <div className="text-lg font-semibold mb-2 text-gray-900">Unable to load workspaces</div>
              <div className="text-sm text-gray-600">{error}</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.name?.split(" ")[0] || "User"}</span>
                  <span className="ml-2">👋</span>
                </h1>
                <p className="text-gray-600 text-lg">Continue your learning journey</p>
              </div>

              {/* Workspaces Grid */}
              {workspaces.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {workspaces.map((workspace, index) => {
                    const workspaceStyles = [
                      { 
                        bg: "from-blue-500/10 to-indigo-500/10", 
                        border: "border-blue-200/50", 
                        iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600", 
                        icon: "👨‍💻",
                        accent: "text-blue-600"
                      },
                      { 
                        bg: "from-green-500/10 to-emerald-500/10", 
                        border: "border-green-200/50", 
                        iconBg: "bg-gradient-to-br from-green-500 to-emerald-600", 
                        icon: "📊",
                        accent: "text-green-600"
                      },
                      { 
                        bg: "from-purple-500/10 to-violet-500/10", 
                        border: "border-purple-200/50", 
                        iconBg: "bg-gradient-to-br from-purple-500 to-violet-600", 
                        icon: "🎨",
                        accent: "text-purple-600"
                      },
                      { 
                        bg: "from-orange-500/10 to-red-500/10", 
                        border: "border-orange-200/50", 
                        iconBg: "bg-gradient-to-br from-orange-500 to-red-600", 
                        icon: "📈",
                        accent: "text-orange-600"
                      }
                    ];
                    
                    const style = workspaceStyles[index % workspaceStyles.length];
                    const isActive = index === 0;
                    
                    return (
                      <Link 
                        key={workspace.id} 
                        to="/workspaces/$workspaceId" 
                        params={{ workspaceId: workspace.id }} 
                        className="group block"
                      >
                        <div className={`relative bg-gradient-to-br ${style.bg} backdrop-blur-sm rounded-3xl border ${style.border} p-8 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}>
                          {isActive && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mb-6">
                            <div className={`w-16 h-16 ${style.iconBg} rounded-2xl flex items-center justify-center shadow-lg text-2xl`}>
                              {style.icon}
                            </div>
                            <div className={`text-xs font-semibold px-3 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                          
                          <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                            {workspace.name}
                          </h2>
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            {workspace.description || 'No description available'}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-sm text-gray-500">Score</div>
                              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-pink-400 rounded-full" style={{ width: '60%' }}></div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Exam</div>
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(workspace.createdAt).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">📚</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No workspaces yet</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">Create your first workspace to organize your learning materials and start your journey</p>
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                    Create Your First Workspace
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export const Route = createFileRoute('/home')({
  component: HomePage,
});