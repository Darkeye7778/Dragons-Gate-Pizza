import type { ProjectMedia as ProjectMediaItem } from "../data/portfolio";

export function ProjectMedia({ media }: { media?: ProjectMediaItem[] }) {
    if (!media?.length) return null;

    const className = `project-media-grid${media.length === 1 ? " project-media-grid--single" : ""}`;

    return (
        <div className={className} role="group" aria-label="Project media">
            {media.map((item) => (
                <figure className={`project-media-item project-media-item--${item.type}`} key={`${item.type}-${item.src}`}>
                    {item.type === "image" ? (
                        <a
                            className="project-media-link"
                            href={item.src}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${item.alt} at full size`}
                        >
                            {/* Native images preserve the unknown intrinsic dimensions of future evidence assets. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
                            <span className="project-media-description">
                                {item.description ?? item.alt}
                                <small>Open full size ↗</small>
                            </span>
                        </a>
                    ) : (
                        <>
                            <video controls preload="metadata" playsInline aria-label={item.alt}>
                                <source src={item.src} />
                                Your browser does not support embedded video.
                            </video>
                            <figcaption className="project-media-video-description">
                                {item.description ?? item.alt}
                            </figcaption>
                        </>
                    )}
                </figure>
            ))}
        </div>
    );
}
