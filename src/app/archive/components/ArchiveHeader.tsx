import Link from "next/link";

const navigation = [
    { href: "#projects", label: "Projects" },
    { href: "#skills", label: "Skills" },
    { href: "#about", label: "About" },
    { href: "#resume", label: "Resume" },
    { href: "#contact", label: "Contact" },
];

export function ArchiveHeader() {
    return (
        <header className="archive-header">
            <Link className="archive-brand" href="#top" aria-label="Engineering archive, back to top">
                <span className="archive-brand-mark" aria-hidden="true">DE</span>
                <span>
                    <strong>Engineering Archive</strong>
                    <small>Dark Eye // Restricted index</small>
                </span>
            </Link>

            <nav className="archive-nav" aria-label="Portfolio navigation">
                {navigation.map((item) => (
                    <Link key={item.href} href={item.href}>
                        {item.label}
                    </Link>
                ))}
            </nav>
        </header>
    );
}
