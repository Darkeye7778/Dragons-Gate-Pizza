import type { PortfolioProject, ProjectMaturity, WorkstreamStatus, } from "../data/portfolio";

type BadgeStatus = ProjectMaturity | WorkstreamStatus;

function StatusBadge({ status }: { status: BadgeStatus }) {
    const className = `status-badge status-badge--${status.toLowerCase().replaceAll(" ", "-")}`;
    return <span className={className}>{status}</span>;
}

function ProjectLinks({ project }: { project: PortfolioProject }) {
    const links = [
        project.github && { href: project.github, label: "View on GitHub" },
        project.demo && { href: project.demo, label: "Open prototype" },
        project.caseStudy && { href: project.caseStudy, label: "Full case study" },
    ].filter((link): link is { href: string; label: string } => Boolean(link));

    if (links.length === 0) return null;

    return (
        <div className="project-links">
            {links.map((link) => (
                <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                    {link.label} <span aria-hidden="true">↗</span>
                </a>
            ))}
        </div>
    );
}

export function ProjectCard({ project, featured = false }: { project: PortfolioProject; featured?: boolean }) {
    if (project.placeholder) {
        return (
            <article className="project-card project-card--placeholder">
                <div className="placeholder-index" aria-hidden="true">+</div>
                <p className="project-category">{project.category}</p>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <span className="placeholder-label">Reserved project record</span>
            </article>
        );
    }

    return (
        <article className={`project-card${featured ? " project-card--featured" : ""}`}>
            <header className="project-card-header">
                <div>
                    {project.eyebrow && <p className="project-eyebrow">{project.eyebrow}</p>}
                    <p className="project-category">{project.category}</p>
                    <h3>{project.title}</h3>
                </div>
                {project.status && (
                    <div className="project-status">
                        <span className="project-status-label">Project maturity</span>
                        <StatusBadge status={project.status} />
                     </div>
                )}
            </header>

            <p className="project-summary">{project.summary}</p>

            {(project.problem || project.approach) && (
                <div className="project-narrative">
                    {project.problem && (
                        <div>
                            <h4>Problem</h4>
                            <p>{project.problem}</p>
                        </div>
                    )}
                    {project.approach && (
                        <div>
                            <h4>Approach</h4>
                            <p>{project.approach}</p>
                        </div>
                    )}
                </div>
            )}

            {project.workstreams && project.workstreams.length > 0 && (
                <div className="workstream-block">
                    <div className="workstream-heading">
                        <h4>System workstreams</h4>
                        <span>Completion at a glance</span>
                    </div>
                    <div className="workstream-grid">
                        {project.workstreams.map((workstream) => (
                            <div className="workstream" key={workstream.title}>
                                <div>
                                    <h5>{workstream.title}</h5>
                                    <StatusBadge status={workstream.status} />
                                </div>
                                <p>{workstream.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <footer className="project-card-footer">
                <div>
                    <h4>Tools & disciplines</h4>
                    <ul className="technology-list" aria-label={`${project.title} technologies`}>
                        {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
                    </ul>
                </div>
                {project.outcome && (
                    <div className="project-outcome">
                        <h4>Current outcome</h4>
                        <p>{project.outcome}</p>
                    </div>
                )}
            </footer>

            <ProjectLinks project={project} />
        </article>
    );
}
