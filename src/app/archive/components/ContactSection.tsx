import { contact } from "../data/portfolio";
import { SectionHeading } from "./SectionHeading";

export function ContactSection() {
    const links = [
        contact.email && { label: "Email", href: `mailto:${contact.email}` },
        contact.github && { label: "GitHub", href: contact.github },
        contact.linkedin && { label: "LinkedIn", href: contact.linkedin },
        ...contact.otherLinks,
    ].filter((link): link is { label: string; href: string } => Boolean(link));

    return (
        <section className="archive-section contact-section" id="contact">
            <SectionHeading
                index="05"
                eyebrow="Contact"
                title="Let’s build something that crosses boundaries."
                description="Open to conversations about simulation, robotics, themed entertainment, and interactive-system engineering."
            />
            {links.length > 0 ? (
                <div className="contact-links">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            target={link.href.startsWith("http") ? "_blank" : undefined}
                            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                            <span>{link.label}</span><span aria-hidden="true">↗</span>
                        </a>
                    ))}
                </div>
            ) : (
                <div className="contact-empty">
                    <span className="contact-pulse" aria-hidden="true" />
                    <div>
                        <strong>Contact channel pending</strong>
                        <p>Professional contact links will appear here once added.</p>
                    </div>
                </div>
            )}
        </section>
    );
}
