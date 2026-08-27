import Link from "next/link";
import { resumeUrl } from "../data/portfolio";

export function ResumeSection() {
    return (
        <section className="archive-section resume-section" id="resume">
            <div>
                <p className="section-eyebrow">04 // Resume</p>
                <h2>Experience, in a portable format.</h2>
                <p>
                    A downloadable resume will be available here once the final document is added to the archive.
                </p>
            </div>
            {resumeUrl ? (
                <Link className="archive-button archive-button--primary" href={resumeUrl} download>
                    Download resume PDF <span aria-hidden="true">↓</span>
                </Link>
            ) : (
                <span className="archive-button archive-button--disabled" aria-disabled="true">
                    Resume coming soon
                </span>
            )}
        </section>
    );
}
