const roleFamilies = [
    ["Guest & Front-of-House", "Welcome guests, explain the venue, support tables, and keep visits moving smoothly."],
    ["Pizza & Kitchen", "Prepare food consistently, safely, and with care for the craft."],
    ["Runner & Venue Operations", "Connect the kitchen, tables, games, and day-to-day needs of the floor."],
    ["Arcade & Attractions", "Maintain safe, understandable, and enjoyable game experiences."],
    ["Tabletop & Guest Experience", "Help groups use play spaces and support future events and organized games."],
    ["Technical & Interactive Systems", "Build and maintain the software, controls, media, and interactive systems behind the world."],
    ["Leadership & Management", "Train teams, set clear expectations, solve problems, and protect the guest and employee experience."],
];

export default function JoinOurTeamPage() {
    return (
        <div className="dev-content-page dev-careers-page">
            <header className="dev-content-hero">
                <span className="dev-section-kicker">Careers</span>
                <h1 className="dev-section-title">Join the Party</h1>
                <p className="dev-section-intro">Dragon&apos;s Gate Pizza intends to build teams across hospitality, food, entertainment, technical systems, and guest experience. The physical venue is still in development, so these are future role families—not open job listings.</p>
            </header>
            <section className="dev-content-section section-warm">
                <h2>How We Want Work to Work</h2>
                <div className="dev-feature-grid">
                    <div className="dev-feature-card"><h3>Clear Training</h3><p>People should be shown how to do the work and have a real chance to practice it.</p></div>
                    <div className="dev-feature-card"><h3>Useful Feedback</h3><p>Expectations and evaluation should be understandable, specific, and consistent.</p></div>
                    <div className="dev-feature-card"><h3>Competence Matters</h3><p>Good judgment, reliable work, and the willingness to improve should be recognized.</p></div>
                    <div className="dev-feature-card"><h3>Managers Help</h3><p>Leadership should remove confusion, coach people, and help teams succeed.</p></div>
                </div>
            </section>
            <section className="dev-content-section section-neon">
                <h2>Future Role Families</h2>
                <div className="dev-role-grid">
                    {roleFamilies.map(([title, description]) => <article className="dev-role-card" key={title}><h3>{title}</h3><p>{description}</p></article>)}
                </div>
            </section>
            <section className="dev-content-section section-warm">
                <h2>Grow With the Gate</h2>
                <p>DGP intends to train and promote from within when ability, readiness, and opportunity align. Not every path will look the same, but people should be able to understand what stronger work looks like and what skills can move them forward.</p>
            </section>
            <aside className="dev-status-callout"><span>Current status</span><strong>No public venue positions are currently open.</strong><p>Future openings will be posted here as Dragon&apos;s Gate Pizza moves toward physical operations.</p></aside>
        </div>
    );
}
