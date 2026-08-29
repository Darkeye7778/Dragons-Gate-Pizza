import Link from "next/link";

const entertainmentSystems = [
    { code: "01", title: "Arcade", description: "A planned mix of cabinet games and approachable social competition." },
    { code: "02", title: "Tabletop", description: "Real tables and room for campaigns, card games, and one-shot adventures." },
    { code: "03", title: "Social Play", description: "Games and gathering spaces designed for friends, families, and new parties." },
    { code: "04", title: "Themed Experiences", description: "Future interactive moments that make the world of the Gate feel alive." },
];

export default function DevHomePage() {
    return (
        <div className="dev-home">
            <section className="dev-hero-full section-warm">
                <div className="dev-hero-video">
                    <video className="dev-hero-video-el" src="/videos/Test Background Video.mp4" autoPlay muted loop playsInline />
                    <div className="dev-hero-video-overlay" />
                </div>
                <div className="dev-hero-content-full">
                    <span className="dev-eyebrow">Pizza • Arcade • Tabletop • A place to stay</span>
                    <h1 className="dev-hero-title">Come for the pizza. Stay for the adventure.</h1>
                    <p className="dev-hero-subtitle">
                        Dragon&apos;s Gate Pizza is a fantasy tavern, arcade, and tabletop gathering
                        place in development—built around good food, shared games, and enough room
                        to settle in with your party.
                    </p>
                    <div className="dev-hero-actions">
                        <Link href="/dev/order" className="dev-hero-btn primary">Order</Link>
                        <Link href="/dev/menu" className="dev-hero-btn secondary">View Menu</Link>
                    </div>
                </div>
            </section>

            <section className="dev-section section-warm dev-pizza-section">
                <span className="dev-section-kicker">Hand stretched. Never pressed.</span>
                <h2 className="dev-section-title">Our Pizza</h2>
                <p className="dev-section-intro">
                    The food comes first. DGP is developing a menu around hand-stretched dough,
                    high-heat hearth-style baking, flexible builds, and prices meant to keep a
                    shared meal within reach.
                </p>
                <div className="dev-feature-grid dev-pizza-grid">
                    <div className="dev-feature-card"><h3>Signature Pies</h3><p>Distinct recipes with fantasy names and combinations that still make sense at the table.</p></div>
                    <div className="dev-feature-card"><h3>Build Your Own</h3><p>Choose a size, crust, sauce, cheese, toppings, and post-bake finishes in the current ordering prototype.</p></div>
                    <div className="dev-feature-card"><h3>Pizza Pockets</h3><p>A compact, portable part of the developing food lineup.</p></div>
                    <div className="dev-feature-card"><h3>Different Paths</h3><p>The menu prototype includes gluten-free, cauliflower, keto, and vegan crust selections. Final venue availability is still being developed.</p></div>
                </div>
            </section>

            <section className="dev-section section-neon dev-arcade-section">
                <span className="dev-section-kicker">Planned venue experience</span>
                <h2 className="dev-section-title">Arcades &amp; Games</h2>
                <p className="dev-section-intro">
                    Play is part of the floor plan, not decoration around the edges. The future
                    venue is intended to give arcade players, tabletop groups, and casual visitors
                    different ways to spend time together.
                </p>
                <div className="dev-section-arcade-layout">
                    <div className="dev-split-text">
                        <h3 className="dev-subheading">Eat. Play. Win.</h3>
                        <p>
                            DGP is being designed around repeatable fun rather than a single
                            attraction. Tabletop gaming receives real space and seating alongside
                            arcade and social play.
                        </p>
                    </div>
                    <div className="dev-split-visual">
                        <div className="dev-adventure-directory" aria-label="Planned entertainment categories">
                            <div className="dev-directory-heading"><span>Choose your adventure</span><small>Planned experiences for the future full venue</small></div>
                            {entertainmentSystems.map((system) => (
                                <div className="dev-directory-row" key={system.code}>
                                    <span className="dev-directory-code">{system.code}</span>
                                    <div><strong>{system.title}</strong><p>{system.description}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="dev-section dev-third-place-section">
                <span className="dev-section-kicker">A place for every party</span>
                <h2 className="dev-section-title">Your table. Your game. Your place.</h2>
                <p className="dev-section-intro">
                    Dragon&apos;s Gate Pizza is intended to become a third place: somewhere outside
                    home, work, or school where people can meet, eat, play, study when the setting
                    allows, run a campaign, or simply spend time together.
                </p>
                <div className="dev-feature-grid dev-third-place-points">
                    <div className="dev-feature-card"><h3>Meet Your People</h3><p>Bring friends, family, a study partner, or an entire adventuring party.</p></div>
                    <div className="dev-feature-card"><h3>Stay for More Than a Meal</h3><p>The goal is a welcoming place to spend time—not a room designed to rush every table back out the door.</p></div>
                    <div className="dev-feature-card"><h3>Choose Your Pace</h3><p>Play a cabinet, start a tabletop session, share pizza, or just catch up.</p></div>
                    <div className="dev-feature-card"><h3>Keep It Within Reach</h3><p>Good food, entertainment, and gathering space should not feel financially inaccessible.</p></div>
                </div>
            </section>

            <section className="dev-section dev-lore-section">
                <span className="dev-section-kicker">The world around the restaurant</span>
                <h2 className="dev-section-title">Welcome to the Gate</h2>
                <p className="dev-section-intro">
                    Loric Flamecord and the wider Dark Eye cast give DGP its fantasy frame. Their
                    stories are intended to appear through environmental details, interactive
                    moments, and—farther down the road—a planned animatronic and robotic cast.
                    The lore supports the experience; it never replaces the pizza or the people at the table.
                </p>
                <div className="dev-lore-tags">
                    <span className="lore-pill">Fantasy tavern</span>
                    <span className="lore-pill">Arcane technology</span>
                    <span className="lore-pill">Future interactive characters</span>
                </div>
            </section>

            <section className="dev-section dev-building-section">
                <span className="dev-section-kicker">Building the first Gate</span>
                <h2 className="dev-section-title">From Prototype to Place</h2>
                <p className="dev-section-intro">
                    The ordering software and venue systems are under development while the first
                    full physical location remains in the planning stage. No opening date or site
                    has been announced.
                </p>
                <div className="dev-visit-grid dev-gate-facts">
                    <div className="visit-card"><h3>First Market</h3><p>Central Florida is currently a target market for the first full venue.</p></div>
                    <div className="visit-card"><h3>Venue Format</h3><p>Pizza, arcade and tabletop play, themed entertainment, and social seating.</p></div>
                    <div className="visit-card"><h3>Current Status</h3><p>Business concept, menu, ordering software, and venue systems development.</p></div>
                </div>
                <Link href="/dev/about" className="dev-visit-btn">Learn why DGP is being built</Link>
            </section>

            <section className="dev-section dev-closing-section">
                <div className="dev-section-arcade-layout dev-closing-paths">
                    <div className="dev-split-text">
                        <h3 className="dev-subheading">Grow With the Gate</h3>
                        <p>Future teams will span hospitality, kitchens, attractions, tabletop experiences, operations, and interactive technology. There are no public venue openings yet, but the working principles are already taking shape.</p>
                        <Link href="/dev/careers" className="dev-link-btn">Explore future careers</Link>
                    </div>
                    <div className="dev-split-text">
                        <h3 className="dev-subheading">Bring the Gate to Your City</h3>
                        <p>DGP&apos;s long-term expansion model is centered on company-controlled locations and trusted local operators—not disconnected franchises.</p>
                        <Link href="/dev/expansion" className="dev-link-btn">Expansion &amp; operators</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
