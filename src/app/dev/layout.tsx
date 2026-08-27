"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const DEV_AUTH_KEY = "dgp_dev_auth";
const PORTFOLIO_PREVIEW_COOKIE = "dgp_portfolio_preview";

const navLinks = [
    { href: "/dev", label: "Home" },
    { href: "/dev/order", label: "Order Ahead" },
    { href: "/dev/menu", label: "Menu" },
    { href: "/dev/franchise", label: "Franchise" },
    { href: "/dev/careers", label: "Join Our Team" },
    { href: "/dev/about", label: "About Us" },
    { href: "/dev/contact", label: "Contact Us" },
];

export default function DevLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [checkedAuth, setCheckedAuth] = useState(false);

    useEffect(() => {
        const hasPreviewCookie = document.cookie
            .split(";")
            .some((cookie) => cookie.trim().startsWith(`${PORTFOLIO_PREVIEW_COOKIE}=`));
        const auth = localStorage.getItem(DEV_AUTH_KEY) || hasPreviewCookie;

        if (!auth) {
            router.replace("/");
            return;
        }

        // delay state change to next tick to satisfy lint rule
        setTimeout(() => {
            setCheckedAuth(true);
        }, 0);
    }, [router]);

    if (!checkedAuth) {
        return (
            <div className="dev-loading">
                <p>Checking credentials...</p>
            </div>
        );
    }

    const handleLogout = () => {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(DEV_AUTH_KEY);
            document.cookie = `${PORTFOLIO_PREVIEW_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
        }
        router.push("/");
    };

    return (
        <div className="dev-root">
            <header className="dev-header">
                <div className="dev-logo">Dragon&apos;s Gate Pizza</div>
                <nav className="dev-nav">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={
                                "dev-nav-link" +
                                (pathname === link.href ? " dev-nav-link--active" : "")
                            }
                        >
                            {link.label}
                        </Link>
                    ))}
                    <button className="dev-logout" onClick={handleLogout}>
                        Log out
                    </button>
                </nav>
            </header>

            <main className="dev-main">{children}</main>

            <footer className="dev-footer">
                <p>(c) 2025 Dragon&apos;s Gate Pizza. Internal build.</p>
            </footer>
        </div>
    );
}
