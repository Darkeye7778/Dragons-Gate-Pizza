import { about } from "../data/portfolio";
import { SectionHeading } from "./SectionHeading";

export function AboutSection() {
    return (
        <section className="archive-section about-section" id="about">
            <SectionHeading index="03" eyebrow="About" title={about.heading} />
            <div className="about-layout">
                <div className="about-copy">
                    <p className="about-label">{about.label}</p>
                    {about.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                <div className="focus-panel">
                    <p>Current focus</p>
                    <ol>
                        {about.focusAreas.map((area, index) => (
                            <li key={area}><span>0{index + 1}</span>{area}</li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
