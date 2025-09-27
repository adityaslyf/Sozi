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

    const links = [
        { to: "#benefits", label: "Benefits" },
        { to: "#specs", label: "Specifications" },
        { to: "#howto", label: "How-to" },
        { to: "#contact", label: "Contact Us" },
    ] as const;

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
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
            <div className="mx-auto max-w-6xl px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="text-xl font-semibold">Sozi</Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm">
                        {links.map(({ to, label }) => (
                            <a key={to} href={to} className="hover:opacity-70">
                                {label}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        {isLoggedIn ? (
                            <>
                                <Link to="/dashboard" className="text-sm hover:opacity-70">
                                    Dashboard
                                </Link>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                                    <User className="w-4 h-4" />
                                    <span className="text-sm font-medium">{user?.name || 'User'}</span>
                                </div>
                                <Button variant="outline" className="rounded-full px-4" onClick={handleLogout}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <Button className="rounded-full px-5 bg-primary hover:bg-primary/90 text-white" size="lg" onClick={handleGoogleAuth}>
                                <Chrome className="w-4 h-4 mr-2" />
                                Sign in with Google
                            </Button>
                        )}
                    </div>

                    <button
                        aria-label="Open Menu"
                        className="md:hidden rounded-md p-2 border"
                        onClick={() => setOpen(true)}
                    >
                        <Menu className="size-5" />
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
                        <div className="mt-6 divide-y">
                            {links.map(({ to, label }) => (
                                <a key={to} href={to} onClick={() => setOpen(false)} className="block py-4 text-lg">
                                    {label}
                                </a>
                            ))}
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
