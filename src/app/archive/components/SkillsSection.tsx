import { skillGroups } from "../data/portfolio";
import { SectionHeading } from "./SectionHeading";

export function SkillsSection() {
    return (
        <section className="archive-section" id="skills">
            <SectionHeading
                index="02"
                eyebrow="Capabilities"
                title="A cross-disciplinary toolset."
                description="Working inventory—intentionally structured for quick edits as experience and project evidence are added."
            />
            <div className="skills-grid">
                {skillGroups.map((group) => (
                    <article className="skill-group" key={group.title}>
                        <header>
                            <span aria-hidden="true">{group.index}</span>
                            <h3>{group.title}</h3>
                        </header>
                        <ul>
                            {group.skills.map((skill) => <li key={skill}>{skill}</li>)}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    );
}
