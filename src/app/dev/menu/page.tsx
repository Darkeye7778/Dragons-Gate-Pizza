export default function MenuPage() {
    return (
        <section className="dev-section">
            <h1 className="dev-section-title">Menu</h1>
            <p className="dev-section-intro">
                Showcase pizzas, sides, desserts, and drinks here. Later this can pull
                from a JSON file or CMS so stores can have local variations.
            </p>

            <h2 className="dev-subheading">Sections to plan:</h2>
            <ul className="dev-list">
                <li>Signature Pizzas (with DGP-lore names)</li>
                <li>Build-Your-Own Pizza</li>
                <li>Pizza Pockets / Specials</li>
                <li>Sides &amp; Appetizers</li>
                <li>Desserts &amp; Shakes</li>
                <li>Drinks (fountain, specialty, maybe potions-style)</li>
            </ul>
        </section>
    );
}
