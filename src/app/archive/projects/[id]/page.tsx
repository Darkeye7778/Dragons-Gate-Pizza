import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveHeader } from "../../components/ArchiveHeader";
import { ProjectMedia } from "../../components/ProjectMedia";
import { projects } from "../../data/portfolio";

export function generateStaticParams() {
    return projects
        .filter((project) => project.media?.length)
        .map((project) => ({ id: project.id }));
}

export default async function ProjectMediaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = projects.find((candidate) => candidate.id === id);

    if (!project?.media?.length) notFound();

    return (
        <div className="archive-shell" id="top">
            <a className="archive-skip-link" href="#archive-main">Skip to project media</a>
            <div className="archive-noise" aria-hidden="true" />
            <ArchiveHeader rooted />
            <main className="project-media-page" id="archive-main">
                <section className="project-media-page-header" aria-labelledby="project-media-title">
                    <Link className="project-media-back" href={`/archive#project-${project.id}`}>
                        <span aria-hidden="true">←</span> Back to case study
                    </Link>
                    <p className="project-eyebrow">Media archive // {String(project.media.length).padStart(2, "0")}</p>
                    <p className="project-category">{project.category}</p>
                    <h1 id="project-media-title">{project.title}</h1>
                    <p>{project.summary}</p>
                </section>

                <ProjectMedia media={project.media} />
            </main>
            <footer className="archive-footer">
                <p>Dark Eye // Engineering Archive</p>
                <p>{project.title} · Media record</p>
                <Link href={`/archive#project-${project.id}`}>Return to case study <span aria-hidden="true">↗</span></Link>
            </footer>
        </div>
    );
}
