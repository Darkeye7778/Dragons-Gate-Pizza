const marketSignals = [
    ["Room to Gather", "A market where people are looking for affordable social entertainment and places to spend time."],
    ["A Repeat Audience", "A strong local mix of residents, students, young adults, families, and groups who can return regularly."],
    ["Real Food Demand", "A location where the restaurant can stand on the strength and value of its food—not attractions alone."],
    ["The Right Footprint", "Enough space to support the intended mix of dining, arcade, tabletop, and social areas."],
];

export default function ExpansionPage() {
    return (
        <div className="dev-content-page">
            <header className="dev-content-hero">
                <span className="dev-section-kicker">Expansion &amp; operators</span>
                <h1 className="dev-section-title">Bring the Gate to Your City</h1>
                <p className="dev-section-intro">Dragon&apos;s Gate Pizza intends to grow carefully, protecting the food, venue experience, technology, and working culture instead of selling locations as quickly as possible.</p>
            </header>
            <section className="dev-content-section section-warm">
                <h2>How Future Locations May Happen</h2>
                <ol className="dev-process-list">
                    <li><span>01</span><div><strong>Identify a market</strong><p>DGP or a prospective operator may bring forward a city or potential location.</p></div></li>
                    <li><span>02</span><div><strong>Evaluate the case</strong><p>The company would assess the market, site, venue fit, operating needs, and business case.</p></div></li>
                    <li><span>03</span><div><strong>Develop the location</strong><p>If approved, DGP would guide and control the location&apos;s design, systems, standards, and launch.</p></div></li>
                    <li><span>04</span><div><strong>Operate as one realm</strong><p>A trusted local operator and management team would run the venue within the larger DGP structure.</p></div></li>
                </ol>
                <p className="dev-content-note">This operator structure is still being developed and is not a finalized legal or investment program.</p>
            </section>
            <section className="dev-content-section section-neon">
                <h2>What We Care About</h2>
                <div className="dev-feature-grid">
                    {marketSignals.map(([title, description]) => <article className="dev-feature-card" key={title}><h3>{title}</h3><p>{description}</p></article>)}
                </div>
            </section>
            <aside className="dev-status-callout"><span>Not a traditional franchise</span><strong>Dragon&apos;s Gate Pizza is not currently offering conventional franchises.</strong><p>The long-term model is being designed around company-controlled locations and trusted operators. There are no published franchise fees, investment ranges, royalties, earnings projections, or applications.</p></aside>
        </div>
    );
}
