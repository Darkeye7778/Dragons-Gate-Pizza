"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PORTFOLIO_PREVIEW_COOKIE = "dgp_portfolio_preview";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function hasPreviewCookie() {
    return document.cookie
        .split(";")
        .some((cookie) => cookie.trim().startsWith(`${PORTFOLIO_PREVIEW_COOKIE}=`));
}

export default function PortfolioPreviewPage() {
    const router = useRouter();

    useEffect(() => {
        if (hasPreviewCookie()) router.replace("/dev");
    }, [router]);

    const enterPreview = () => {
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `${PORTFOLIO_PREVIEW_COOKIE}=accepted; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
        router.push("/dev");
    };

    return (
        <div className="page-wrapper">
            <div className="bg-glow" />
            <header className="site-header">
                <div className="logo">Dragon&apos;s Gate Pizza</div>
                <nav className="site-nav" aria-label="Preview status">
                    <span className="nav-pill">Portfolio preview</span>
                </nav>
            </header>

            <main className="hero">
                <section className="hero-content">
                    <p className="nav-pill">Development build</p>
                    <h1 className="hero-title">Step through the gate.</h1>
                    <p className="hero-subtitle">
                        You&apos;re entering the current Dragon&apos;s Gate Pizza development site.
                        Features, copy, pricing, and ordering flows may still change.
                    </p>
                    <button className="notify-button" type="button" onClick={enterPreview}>
                        Enter development site
                    </button>
                    <p className="notify-note">
                        This acknowledgement is remembered on this browser for 30 days.
                    </p>
                </section>
            </main>
        </div>
    );
}
