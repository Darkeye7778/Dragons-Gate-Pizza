import Link from "next/link";

export default function DevHomePage() {
    return (
        <section className="dev-home">
            <h1 className="dev-home-title">Dragon's Gate Pizza - Dev Hub</h1>
            <p className="dev-home-subtitle">
                Internal build of the main site. Use these sections to design flows and content
                before swapping this into production.
            </p>

            <div className="dev-grid">
                <Link href="/dev/order" className="dev-card">
                    <h2>Order Ahead</h2>
                    <p>Pickup ordering flow. Later will connect to your POS or provider.</p>
                </Link>

                <Link href="/dev/menu" className="dev-card">
                    <h2>Menu</h2>
                    <p>Full menu layout: pizzas, pockets, sides, desserts, drinks.</p>
                </Link>

                <Link href="/dev/careers" className="dev-card">
                    <h2>Join Our Team</h2>
                    <p>Careers page and application info.</p>
                </Link>

                <Link href="/dev/franchise" className="dev-card">
                    <h2>Franchise</h2>
                    <p>For potential operators: concept, requirements, interest form.</p>
                </Link>

                <Link href="/dev/about" className="dev-card">
                    <h2>About Us</h2>
                    <p>The story, the world, and the animatronics behind DGP.</p>
                </Link>

                <Link href="/dev/contact" className="dev-card">
                    <h2>Contact Us</h2>
                    <p>Basic contact and party/event inquiries.</p>
                </Link>
            </div>
        </section>
    );
}
