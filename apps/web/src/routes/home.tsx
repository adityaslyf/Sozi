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

                      {/* Workspaces Grid */}
                      {workspaces.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                          {workspaces.map((workspace, index) => {
                            const workspaceStyles = [
                              { 
                                name: "DEV",
                                bottomText: "development space"
                              },
                              { 
                                name: "DATA",
                                bottomText: "analytics hub"
                              },
                              { 
                                name: "DESIGN",
                                bottomText: "creative studio"
                              },
                              { 
                                name: "MARKETING",
                                bottomText: "growth center"
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
                                <div className="workspace-card w-[300px] h-[200px] bg-[#243137] relative grid place-content-center rounded-[10px] overflow-hidden transition-all duration-500 ease-in-out hover:rounded-none hover:scale-110">
                                  {/* Border */}
                                  <div className="workspace-border absolute inset-0 border-2 border-[#bd9f67] opacity-0 rotate-[10deg] transition-all duration-500 ease-in-out group-hover:inset-[15px] group-hover:opacity-100 group-hover:rotate-0"></div>
                                  
                                  {/* Content */}
                                  <div className="workspace-content transition-all duration-500 ease-in-out">
                                    {/* Logo Container */}
                                    <div className="workspace-logo h-[35px] relative w-[33px] overflow-hidden transition-all duration-1000 ease-in-out group-hover:w-[134px]">
                                      {/* Logo 1 - Workspace Initial */}
                                      <div className="workspace-logo1 h-[33px] absolute left-0 bg-[#bd9f67] rounded-lg flex items-center justify-center text-[#243137] font-bold text-lg min-w-[33px]">
                                        {workspace.name.charAt(0).toUpperCase()}
                                      </div>
                                      
                                      {/* Logo 2 - Full Name */}
                                      <div className="workspace-logo2 h-[33px] absolute left-[33px] flex items-center">
                                        <span className="text-[#bd9f67] font-bold text-sm tracking-wider px-2">
                                          {style.name}
                                        </span>
                                      </div>
                                      
                                      {/* Trail Animation */}
                                      <span className="workspace-trail absolute right-0 h-full w-full opacity-0 group-hover:animate-pulse"></span>
                                    </div>
                                    
                                    {/* Logo Bottom Text */}
                                    <span className="workspace-logo-bottom-text absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-[30px] text-[#bd9f67] pl-2 text-[11px] opacity-0 transition-all duration-500 ease-in-out delay-500 group-hover:opacity-100 group-hover:tracking-[9.5px]">
                                      {workspace.name.toLowerCase()}
                                    </span>
                                  </div>
                                  
                                  {/* Bottom Text */}
                                  <span className="workspace-bottom-text absolute left-1/2 bottom-[13px] transform -translate-x-1/2 text-[6px] uppercase px-[5px] pl-2 text-[#bd9f67] bg-[#243137] opacity-0 tracking-[7px] transition-all duration-500 ease-in-out group-hover:tracking-[3px] group-hover:opacity-100">
                                    {style.bottomText}
                                  </span>

                                  {/* Active Indicator */}
                                  {isActive && (
                                    <div className="absolute top-4 right-4 w-2 h-2 bg-[#bd9f67] rounded-full animate-pulse"></div>
                                  )}
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