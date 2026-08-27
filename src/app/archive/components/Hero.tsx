import type { CSSProperties } from "react";
import Link from "next/link";
import {
    profile,
    projects,
    type PortfolioProject,
    type ProjectMaturity,
} from "../data/portfolio";

const maturityRadius: Record<ProjectMaturity, number> = {
    Deployed: 10,
    Built: 18,
    "Pitch Prototype": 27,
    Prototype: 31,
    "In Development": 38,
    Research: 43,
    Concept: 46,
};

type RadarProject = PortfolioProject & {
    radarLabel: string;
    status: ProjectMaturity;
};

type RadarContactStyle = CSSProperties & {
    "--radar-float-x": string;
    "--radar-float-y": string;
    "--radar-float-duration": string;
    "--radar-float-delay": string;
};

function hashProjectId(value: string) {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function seededUnit(projectId: string, channel: string) {
    return hashProjectId(`${projectId}:${channel}`) / 0xffffffff;
}

function getRadarPlacement(project: RadarProject) {
    const rawAngle = seededUnit(project.id, "angle") * 360;
    const nearestAxis = Math.round(rawAngle / 90) * 90;
    const axisOffset = rawAngle - nearestAxis;
    const angle = Math.abs(axisOffset) < 12
        ? nearestAxis + (seededUnit(project.id, "axis-side") > 0.5 ? 13 : -13)
        : rawAngle;
    const radiusJitter = (seededUnit(project.id, "radius") - 0.5) * 5;
    const radius = maturityRadius[project.status] + radiusJitter;
    const radians = (angle * Math.PI) / 180;
    const x = 50 + Math.cos(radians) * radius;
    const y = 50 + Math.sin(radians) * radius;
    const horizontalDrift = (seededUnit(project.id, "float-x") - 0.5) * 3;
    const upwardFloat = -(3 + seededUnit(project.id, "float-y") * 2.5);

    return {
        labelSide: x >= 50 ? "right" : "left",
        labelEdge: y < 20 ? "top" : y > 80 ? "bottom" : "middle",
        style: {
            left: `${x.toFixed(3)}%`,
            top: `${y.toFixed(3)}%`,
            "--radar-float-x": `${horizontalDrift.toFixed(2)}px`,
            "--radar-float-y": `${upwardFloat.toFixed(2)}px`,
            "--radar-float-duration": `${(5 + seededUnit(project.id, "duration") * 4).toFixed(2)}s`,
            "--radar-float-delay": `-${(seededUnit(project.id, "delay") * 9).toFixed(2)}s`,
        } satisfies RadarContactStyle,
    };
}

export function Hero() {
    const radarProjects = projects.filter((project): project is RadarProject => (
        !project.placeholder && Boolean(project.radarLabel && project.status)
    ));

    return (
        <section className="archive-hero" aria-labelledby="archive-title">
            <div className="hero-copy">
                <p className="archive-kicker">
                    <span aria-hidden="true" /> {profile.archiveLabel}
                </p>
                <h1 id="archive-title">{profile.name}</h1>
                <p className="archive-role">{profile.title}</p>
                <p className="archive-intro">{profile.intro}</p>
                <div className="hero-actions">
                    <Link className="archive-button archive-button--primary" href="#projects">
                        Explore selected work <span aria-hidden="true">↘</span>
                    </Link>
                    <Link className="archive-button archive-button--quiet" href="#contact">
                        Contact
                    </Link>
                </div>
            </div>

            <div className="hero-instrument" role="group" aria-label="Project maturity radar">
                <div className="instrument-orbit instrument-orbit--outer" aria-hidden="true" />
                <div className="instrument-orbit instrument-orbit--inner" aria-hidden="true" />
                <div className="instrument-axis instrument-axis--x" aria-hidden="true" />
                <div className="instrument-axis instrument-axis--y" aria-hidden="true" />
                <div className="instrument-core" aria-hidden="true">FL</div>
                <span className="instrument-label instrument-label--top" aria-hidden="true">SYS.ARCHIVE</span>
                <span className="instrument-label instrument-label--bottom" aria-hidden="true">
                    SYS.ARCHIVE / {String(radarProjects.length).padStart(2, "0")}
                </span>
                <div className="radar-link-indicator" aria-hidden="true">
                    <span className="radar-link-indicator-dot">○</span> LINK.LIVE
                </div>

                {radarProjects.map((project) => {
                    const placement = getRadarPlacement(project);

                    return (
                        <a
                            className={`radar-contact radar-contact--${placement.labelSide} radar-contact--${placement.labelEdge}`}
                            href={`#project-${project.id}`}
                            aria-label={`Jump to ${project.title}, ${project.status}`}
                            style={placement.style}
                            key={project.id}
                        >
                            <span className="radar-contact-body" aria-hidden="true">
                                <span className="radar-contact-target">
                                    <span className="radar-contact-dot" />
                                </span>
                                <span className="radar-contact-label">
                                    <strong>{project.radarLabel}</strong>
                                    <small>{project.status}</small>
                                </span>
                            </span>
                        </a>
                    );
                })}
            </div>

            <dl className="hero-index" aria-label="Portfolio focus areas">
                <div><dt>01</dt><dd>Simulation</dd></div>
                <div><dt>02</dt><dd>Robotics</dd></div>
                <div><dt>03</dt><dd>Interactive systems</dd></div>
                <div><dt>04</dt><dd>Physical computing</dd></div>
            </dl>
        </section>
    );
}
