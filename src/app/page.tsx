"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CountdownState = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
};

const launchTarget = new Date("2027-03-07T00:00:00-05:00").getTime();

const DEV_USERNAME = "loric";      // change these to whatever you want
const DEV_PASSWORD = "flamecord";
const DEV_AUTH_KEY = "dgp_dev_auth";

export default function LandingPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState<CountdownState>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    const [showLogin, setShowLogin] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [passInput, setPassInput] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const update = () => {
            const now = new Date().getTime();
            const diff = launchTarget - now;

            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const totalSeconds = Math.floor(diff / 1000);
            const days = Math.floor(totalSeconds / (60 * 60 * 24));
            const hours = Math.floor(
                (totalSeconds % (60 * 60 * 24)) / (60 * 60)
            );
            const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
            const seconds = totalSeconds % 60;

            setCountdown({ days, hours, minutes, seconds });
        };

        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    const handleDevLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (userInput === DEV_USERNAME && passInput === DEV_PASSWORD) {
            if (typeof window !== "undefined") {
                window.localStorage.setItem(DEV_AUTH_KEY, "true");
            }
            router.push("/dev");
        } else {
            setError("Wrong login.");
        }
    };

    return (
        <div className="page-wrapper">
            <div className="bg-glow" />

            <header className="site-header">
                <div className="logo">Dragon's Gate Pizza</div>
                <nav className="site-nav">
                    <span className="nav-pill">A Dark Eye Co. Project</span>
                    <button
                        className="dev-login-button"
                        type="button"
                        onClick={() => setShowLogin(true)}
                    >
                        Dev Login
                    </button>
                </nav>
            </header>

            <main className="hero">
                <section className="hero-content">
                    <h1 className="hero-title">The portal opens soon.</h1>
                    <p className="hero-subtitle">
                        Pizza, arcades, and tabletop adventures in one place.
                        <br />
                        A new realm is almost ready.
                    </p>

                    <div className="countdown">
                        <span className="countdown-label">Countdown to launch</span>
                        <div className="countdown-values">
                            <div className="time-block">
                                <span className="time-value">{countdown.days}</span>
                                <span className="time-unit">Days</span>
                            </div>
                            <div className="time-block">
                                <span className="time-value">
                                    {countdown.hours.toString().padStart(2, "0")}
                                </span>
                                <span className="time-unit">Hours</span>
                            </div>
                            <div className="time-block">
                                <span className="time-value">
                                    {countdown.minutes.toString().padStart(2, "0")}
                                </span>
                                <span className="time-unit">Minutes</span>
                            </div>
                            <div className="time-block">
                                <span className="time-value">
                                    {countdown.seconds.toString().padStart(2, "0")}
                                </span>
                                <span className="time-unit">Seconds</span>
                            </div>
                        </div>
                    </div>

                    <form
                        className="notify-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            alert("You will be notified when the gate opens.");
                        }}
                    >
                        <input
                            type="email"
                            className="notify-input"
                            placeholder="Enter your email to be notified"
                            required
                        />
                        <button type="submit" className="notify-button">
                            Notify Me
                        </button>
                    </form>
                    <p className="notify-note">No spam. Just the call to adventure.</p>
                </section>
            </main>

            <footer className="site-footer">
                <p>(c) 2025 Dragon's Gate Pizza. All rights reserved.</p>
            </footer>

            {showLogin && (
                <div className="login-overlay" onClick={() => setShowLogin(false)}>
                    <div
                        className="login-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="login-title">Developer access</h2>
                        <form onSubmit={handleDevLogin} className="login-form">
                            <input
                                type="text"
                                placeholder="Username"
                                className="login-input"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                className="login-input"
                                value={passInput}
                                onChange={(e) => setPassInput(e.target.value)}
                            />
                            {error && <p className="login-error">{error}</p>}
                            <div className="login-actions">
                                <button
                                    type="button"
                                    className="login-cancel"
                                    onClick={() => setShowLogin(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="login-submit">
                                    Enter /dev
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
