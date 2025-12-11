// src/app/dev/page.tsx
import Link from "next/link";

export default function DevHomePage() {
    return (
        <div className="dev-home">
            {/* HERO – warm tavern pizza focus */}
            <section className="dev-hero-full section-warm">
                <div className="dev-hero-video">
                    {/* drop your stock video at public/videos/pizza-hero.mp4 */}
                    <video
                        className="dev-hero-video-el"
                        src="/videos/Test Background Video.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                    <div className="dev-hero-video-overlay" />
                </div>

                <div className="dev-hero-content-full">
                    <span className="dev-eyebrow">Pizza • Arcades • Tabletop</span>

                    <h1 className="dev-hero-title">
                        Pizza, arcades, and adventure in one realm.
                    </h1>

                    <p className="dev-hero-subtitle">
                        Dragon’s Gate Pizza blends artisan pies, retro arcades, and a full
                        fantasy universe featuring our animatronic adventuring band.
                    </p>

                    <div className="dev-hero-actions">
                        <Link href="/dev/order" className="dev-hero-btn primary">
                            Order
                        </Link>
                        <Link href="/dev/menu" className="dev-hero-btn secondary">
                            View Menu
                        </Link>
                    </div>
                </div>
            </section>

            {/* OUR PIZZA – warm tavern section */}
            <section className="dev-section section-warm">
                <h2 className="dev-section-title">Our Pizza</h2>
                <p className="dev-section-intro">
                    Long-fermented dough. High-heat bake. Original recipes. Everything at
                    Dragon’s Gate Pizza is crafted with intention.
                </p>

                <div className="dev-feature-grid">
                    <div className="dev-feature-card">
                        <h3>Signature Pies</h3>
                        <p>Our flagship lineup — bold flavors, fantasy names.</p>
                    </div>
                    <div className="dev-feature-card">
                        <h3>Build Your Own</h3>
                        <p>Classic or experimental — your pizza, your rules.</p>
                    </div>
                    <div className="dev-feature-card">
                        <h3>Pizza Pockets</h3>
                        <p>A family tradition turned fan-favorite.</p>
                    </div>
                    <div className="dev-feature-card">
                        <h3>Vegan Options</h3>
                        <p>Plant-based cheese, dough, and topping choices.</p>
                    </div>
                </div>
            </section>

            {/* ARCADES & GAMES – neon underglow */}
            <section className="dev-section section-neon">
                <h2 className="dev-section-title">Arcades &amp; Games</h2>
                <p className="dev-section-intro">
                    From retro cabinets to modern prize games, DGP offers an arcade
                    experience designed for every age.
                </p>

                <div className="dev-section-arcade-layout">
                    <div className="dev-split-text">
                        <ul>
                            <li>Retro arcade machines</li>
                            <li>Prize and ticket games</li>
                            <li>Tabletop zones &amp; party rooms</li>
                        </ul>
                    </div>
                    <div className="dev-split-visual">
                        <div className="visual-placeholder">[ Arcade Visual WIP ]</div>
                    </div>
                </div>
            </section>

            {/* LORE – warm hybrid */}
            <section className="dev-section section-warm">
                <h2 className="dev-section-title">Welcome to the Gate</h2>
                <p className="dev-section-intro">
                    Meet Loric Flamecord and the adventuring band who retired from
                    questing to become our animatronic performers. Their tales fuel the
                    world of Dragon&apos;s Gate Pizza.
                </p>

                <div className="dev-lore-tags">
                    <span className="lore-pill">Animatronic Band</span>
                    <span className="lore-pill">Dark Eye Universe</span>
                    <span className="lore-pill">Live Experiences</span>
                </div>
            </section>

            {/* PLAN YOUR VISIT – warm */}
            <section className="dev-section section-warm">
                <h2 className="dev-section-title">Plan Your Visit</h2>
                <p className="dev-section-intro">
                    Our first location is opening soon. Here&apos;s what to expect:
                </p>

                <div className="dev-visit-grid">
                    <div className="visit-card">
                        <h3>Location</h3>
                        <p>Coming soon to Orlando, FL.</p>
                    </div>
                    <div className="visit-card">
                        <h3>Hours</h3>
                        <p>Evening-focused, family-friendly schedule.</p>
                    </div>
                    <div className="visit-card">
                        <h3>Parties</h3>
                        <p>Birthdays, tournaments, tabletop nights, and more.</p>
                    </div>
                </div>

                <Link href="/dev/contact" className="dev-visit-btn">
                    Contact Us
                </Link>
            </section>

            {/* CAREERS + FRANCHISE – leaning a bit more arcade/ops */}
            <section className="dev-section section-neon">
                <div className="dev-section-arcade-layout">
                    <div className="dev-split-text">
                        <h3 className="dev-subheading">Careers</h3>
                        <p>
                            Work in a place where the pizza&apos;s hot and the dice never stop
                            rolling. We&apos;re building a team that loves food, games, and
                            story-driven experiences.
                        </p>
                        <Link href="/dev/careers" className="dev-link-btn">
                            View Careers
                        </Link>
                    </div>

                    <div className="dev-split-text">
                        <h3 className="dev-subheading">Franchise</h3>
                        <p>
                            Interested in bringing Dragon&apos;s Gate Pizza to your city?
                            Learn more about our concept, requirements, and application
                            process.
                        </p>
                        <Link href="/dev/franchise" className="dev-link-btn">
                            Franchise Info
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
