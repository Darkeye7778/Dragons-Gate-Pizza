import { additionalRepositories } from "../data/portfolio";

export function PublicRepositoryIndex() {
    return (
        <div className="repository-index" aria-labelledby="repository-index-title">
            <header className="repository-index-header">
                <div>
                    <p className="project-eyebrow">Additional public work</p>
                    <h3 id="repository-index-title">Repository index</h3>
                </div>
                <p>
                    A smaller set of experiments and team work that adds context without diluting the primary case studies.
                </p>
            </header>
            <div className="repository-index-grid">
                {additionalRepositories.map((repository) => (
                    <a
                        href={repository.href}
                        key={repository.href}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="repository-index-meta">{repository.technology}</span>
                        <strong>{repository.name}</strong>
                        <p>{repository.description}</p>
                        <span className="repository-index-action">
                            View repository <span aria-hidden="true">↗</span>
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
}
