type SectionHeadingProps = {
    index: string;
    eyebrow: string;
    title: string;
    description?: string;
};

export function SectionHeading({ index, eyebrow, title, description }: SectionHeadingProps) {
    return (
        <div className="section-heading">
            <div className="section-heading-index" aria-hidden="true">{index}</div>
            <div>
                <p className="section-eyebrow">{eyebrow}</p>
                <h2>{title}</h2>
                {description && <p className="section-description">{description}</p>}
            </div>
        </div>
    );
}
