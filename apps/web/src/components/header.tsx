import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Chrome, LogOut, User } from "lucide-react";
import { googleAuth, type AuthUser } from "@/lib/google-auth";
import { toast } from "sonner";

export default function Header() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);


    useEffect(() => {
        // Initialize Google Auth when component mounts
        googleAuth.initialize().catch(console.error);
        
        // Check initial login status
        const currentUser = googleAuth.getCurrentUser();
        const loggedIn = googleAuth.isLoggedIn();
        setUser(currentUser);
        setIsLoggedIn(loggedIn);

        // Listen for login/logout events
        const handleLogin = (event: CustomEvent<{ user?: AuthUser } | AuthUser>) => {
            const detail = event.detail as { user?: AuthUser } | AuthUser;
            const authUser: AuthUser | undefined = (detail as { user?: AuthUser })?.user || (detail as AuthUser);
            setUser(authUser ?? null);
            setIsLoggedIn(true);
        };

        const handleLogout = () => {
            setUser(null);
            setIsLoggedIn(false);
        };

        window.addEventListener('userLoggedIn', handleLogin as EventListener);
        window.addEventListener('userSignedOut', handleLogout as EventListener);

        return () => {
            window.removeEventListener('userLoggedIn', handleLogin as EventListener);
            window.removeEventListener('userSignedOut', handleLogout as EventListener);
        };
    }, []);


    const handleGoogleAuth = async () => {
        // Trigger Google authentication
        try {
            await googleAuth.signInWithPopup();
        } catch (error) {
            console.error("Google auth failed:", error);
            toast.error("Google authentication failed. Please try again.");
        }
    };

    const handleLogout = () => {
        googleAuth.signOut();
    };

    return (
        <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-fit">
            <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-full shadow-xl px-6 py-3">
                <div className="flex items-center gap-8">
                    <Link to="/" className="text-lg font-bold text-gray-800">Sozi</Link>

                    <div className="hidden md:flex items-center gap-3">
                        {isLoggedIn ? (
                            <>
                                <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                                    Dashboard
                                </Link>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-sm">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-800">{user?.name || 'User'}</span>
                                </div>
                                <Button variant="outline" className="rounded-full px-4 py-1.5 text-sm bg-white/20 border-white/30 hover:bg-white/30" onClick={handleLogout}>
                                    <LogOut className="w-3 h-3 mr-1" />
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <Button className="rounded-full px-4 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white" onClick={handleGoogleAuth}>
                                <Chrome className="w-3 h-3 mr-1" />
                                Sign in
                            </Button>
                        )}
                    </div>

                    <button
                        aria-label="Open Menu"
                        className="md:hidden rounded-full p-2 bg-white/20 border border-white/30"
                        onClick={() => setOpen(true)}
                    >
                        <Menu className="w-4 h-4 text-gray-700" />
                    </button>
                </div>
            </div>

            {open && (
                <div className="md:hidden fixed inset-0 z-50 bg-white/95">
                    <div className="mx-auto max-w-md px-6 py-6">
                        <div className="flex items-center justify-between">
                            <span className="text-xl font-semibold">Sozi</span>
                            <button
                                aria-label="Close Menu"
                                className="rounded-md p-2 border"
                                onClick={() => setOpen(false)}
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="mt-6 space-y-3">
                            {isLoggedIn ? (
                                <>
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-100">
                                        <User className="w-5 h-5" />
                                        <div>
                                            <p className="font-medium">{user?.name || 'User'}</p>
                                            <p className="text-sm text-gray-600">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Link 
                                        to="/dashboard" 
                                        className="block w-full p-3 text-center rounded-2xl border border-gray-200 hover:bg-gray-50"
                                        onClick={() => setOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Button variant="outline" className="w-full rounded-2xl h-12 text-base" onClick={handleLogout}>
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <Button className="w-full rounded-2xl h-12 text-base bg-primary hover:bg-primary/90 text-white" onClick={handleGoogleAuth}>
                                    <Chrome className="w-4 h-4 mr-2" />
                                    Sign in with Google
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
