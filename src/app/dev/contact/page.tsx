const inquiryCategories = [
    ["General", "Questions about the Dragon’s Gate Pizza concept and its current development status."],
    ["Partnerships", "Potential vendors, technology partners, landlords, and other collaborators."],
    ["Events", "Future party, tabletop, group, and venue-experience inquiries."],
    ["Careers", "Questions about future employment and the types of teams DGP intends to build."],
    ["Media", "Press, interviews, and requests for accurate information about the project."],
];

export default function ContactPage() {
    return (
        <div className="dev-content-page">
            <header className="dev-content-hero">
                <span className="dev-section-kicker">Contact</span>
                <h1 className="dev-section-title">Contact the Gate</h1>
                <p className="dev-section-intro">Dragon&apos;s Gate Pizza is still developing its public contact infrastructure. These are the inquiry paths the future contact system is intended to support.</p>
            </header>
            <section className="dev-content-section section-neon">
                <h2>Where Your Message Belongs</h2>
                <div className="dev-contact-grid">
                    {inquiryCategories.map(([title, description]) => <article className="dev-contact-card" key={title}><h3>{title}</h3><p>{description}</p></article>)}
                </div>
            </section>
            <aside className="dev-status-callout"><span>Current status</span><strong>Public inquiry channels are not live yet.</strong><p>Verified contact details will be added as Dragon&apos;s Gate Pizza approaches physical operations. No form on this development build sends a message.</p></aside>
        </div>
    );
}
