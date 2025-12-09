import Link from "next/link";

export default function DevHomePage() {
    return (
        <main className="dev-home">

            {/* HERO */}
            <section className="dev-hero">
                <div className="dev-hero-content">
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

                <div className="dev-hero-visual">
                    {/* Placeholder for future animation */}
                    <div className="visual-placeholder">[ Pizza Animation WIP ]</div>
                </div>
            </section>

            {/* OUR PIZZA SECTION */}
            <section className="dev-section">
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

            {/* ARCADE SECTION */}
            <section className="dev-section split">
                <div className="dev-split-text">
                    <h2 className="dev-section-title">Arcades & Games</h2>
                    <p>
                        From retro cabinets to modern prize games, DGP offers an arcade
                        experience designed for every age.
                    </p>
                    <ul>
                        <li>Retro arcade machines</li>
                        <li>Prize and ticket games</li>
                        <li>Tabletop zones & party rooms</li>
                    </ul>
                </div>

                <div className="dev-split-visual">
                    <div className="visual-placeholder">[ Arcade Visual WIP ]</div>
                </div>
            </section>

            {/* LORE SECTION */}
            <section className="dev-section">
                <h2 className="dev-section-title">Welcome to the Gate</h2>
                <p className="dev-section-intro">
                    Meet Loric Flamecord and the adventuring band who retired from questing
                    to become our animatronic performers.
                </p>
                <div className="dev-lore-tags">
                    <span className="lore-pill">Animatronic Band</span>
                    <span className="lore-pill">Dark Eye Universe</span>
                    <span className="lore-pill">Live Experiences</span>
                </div>
            </section>

            {/* PLAN YOUR VISIT */}
            <section className="dev-section">
                <h2 className="dev-section-title">Plan Your Visit</h2>
                <p className="dev-section-intro">
                    Our first location is opening soon. Here's what to expect:
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
                        <p>Birthdays, tournaments, tabletop nights.</p>
                    </div>
                </div>

                <Link href="/dev/contact" className="dev-visit-btn">
                    Contact Us
                </Link>
            </section>

            {/* CAREERS + FRANCHISE */}
            <section className="dev-section split">
                <div className="dev-split-text">
                    <h3 className="dev-subheading">Careers</h3>
                    <p>
                        Work in a place where the pizza’s hot and the dice never stop
                        rolling.
                    </p>
                    <Link href="/dev/careers" className="dev-link-btn">
                        View Careers
                    </Link>
                </div>

                <div className="dev-split-text">
                    <h3 className="dev-subheading">Franchise</h3>
                    <p>
                        Interested in helping expand the Dragon’s Gate experience to your
                        city?
                    </p>
                    <Link href="/dev/franchise" className="dev-link-btn">
                        Franchise Info
                    </Link>
                </div>
            </section>
        </main>
    );
}
