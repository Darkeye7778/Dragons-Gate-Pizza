export default function OrderAheadPage() {
    return (
        <section className="dev-section">
            <h1 className="dev-section-title">Order Ahead</h1>
            <p className="dev-section-intro">
                This will eventually be the flow for guests to place pickup orders
                online. For now, use this page to design the UX: cart, time selection,
                payment handoff, etc.
            </p>
            <p>
                When you pick an ordering provider (Slice, Toast, in-house, whatever),
                this page can either:
            </p>
            <ul className="dev-list">
                <li>Embed their ordering widget, or</li>
                <li>Link out to a white-label ordering URL, or</li>
                <li>Use their API to build a fully custom flow.</li>
            </ul>
        </section>
    );
}
