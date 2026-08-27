import { projects } from "../data/portfolio";
import { ProjectCard } from "./ProjectCard";
import { SectionHeading } from "./SectionHeading";

export function ProjectSection() {
    const [featuredProject, ...projectSlots] = projects;

    return (
        <section className="archive-section projects-section" id="projects" aria-labelledby="projects-title">
            <SectionHeading
                index="01"
                eyebrow="Selected work"
                title="Systems, experiments, and applied engineering."
                description="Case studies separate shipped work from prototypes, research, and future concepts."
            />
            <span id="projects-title" className="visually-hidden">Featured projects</span>
            <ProjectCard project={featuredProject} featured />
            <div className="project-slot-grid">
                {projectSlots.map((project) => <ProjectCard project={project} key={project.id} />)}
            </div>
        </section>
    );
}
