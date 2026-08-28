import Link from "next/link";

export default function DevDashboardPage() {
    return (
        <section className="dev-dashboard">
            <h1 className="dev-dashboard-title">Developer Dashboard</h1>
            <p className="dev-dashboard-subtitle">
                Internal navigation for building Dragon’s Gate Pizza. Not visible to guests.
            </p>

            <div className="dev-grid">
                <Link className="dev-card" href="/dev">
                    <h2>Home</h2>
                    <p>Preview the in-development homepage layout.</p>
                </Link>

                <Link className="dev-card" href="/dev/order">
                    <h2>Order</h2>
                    <p>Pickup ordering flow and integration planning.</p>
                </Link>

                <Link className="dev-card" href="/dev/menu">
                    <h2>Menu</h2>
                    <p>Menu layout and future CMS integration.</p>
                </Link>

                <Link className="dev-card" href="/dev/careers">
                    <h2>Careers</h2>
                    <p>Hiring content, job listings, application structure.</p>
                </Link>

                <Link className="dev-card" href="/dev/expansion">
                    <h2>Expansion</h2>
                    <p>Future markets, operator model, and location strategy.</p>
                </Link>

                <Link className="dev-card" href="/dev/about">
                    <h2>About</h2>
                    <p>The purpose, third-place philosophy, world, and technology vision behind DGP.</p>
                </Link>

                <Link className="dev-card" href="/dev/contact">
                    <h2>Contact</h2>
                    <p>General inquiries, parties, and media info.</p>
                </Link>
            </div>
        </section>
    );
}
