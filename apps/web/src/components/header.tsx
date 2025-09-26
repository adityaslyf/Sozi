import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function Header() {
    const [open, setOpen] = useState(false);
    const links = [
        { to: "#benefits", label: "Benefits" },
        { to: "#specs", label: "Specifications" },
        { to: "#howto", label: "How-to" },
        { to: "#contact", label: "Contact Us" },
    ] as const;

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

                    <div className="hidden md:block">
                        <Button className="rounded-full px-5" size="lg">Learn More ↗</Button>
                    </div>

                    <button
                        aria-label="Open Menu"
                        className="md:hidden rounded-md p-2 border"
                        onClick={() => setOpen(true)}
                    >
                        <span className="i-lucide-menu size-5" />
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
                                <span className="i-lucide-x size-5" />
                            </button>
                        </div>
                        <div className="mt-6 divide-y">
                            {links.map(({ to, label }) => (
                                <a key={to} href={to} onClick={() => setOpen(false)} className="block py-4 text-lg">
                                    {label}
                                </a>
                            ))}
                        </div>
                        <div className="mt-6">
                            <Button className="w-full rounded-2xl h-12 text-base">Learn More ↗</Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
