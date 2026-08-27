import type { ProjectMedia as ProjectMediaItem } from "../data/portfolio";

export function ProjectMedia({ media }: { media?: ProjectMediaItem[] }) {
    if (!media?.length) return null;

    const className = `project-media-grid${media.length === 1 ? " project-media-grid--single" : ""}`;

    return (
        <div className={className} role="group" aria-label="Project media">
            {media.map((item) => (
                <div className="project-media-item" key={`${item.type}-${item.src}`}>
                    {item.type === "image" ? (
                        // Native images preserve the unknown intrinsic dimensions of future evidence assets.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
                    ) : (
                        <video controls preload="metadata" playsInline aria-label={item.alt}>
                            <source src={item.src} />
                            Your browser does not support embedded video.
                        </video>
                    )}
                </div>
            ))}
        </div>
    );
}
