import Link from "next/link";
import { profile } from "../data/portfolio";

export function Hero() {
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

            <div className="hero-instrument" aria-hidden="true">
                <div className="instrument-orbit instrument-orbit--outer" />
                <div className="instrument-orbit instrument-orbit--inner" />
                <div className="instrument-axis instrument-axis--x" />
                <div className="instrument-axis instrument-axis--y" />
                <div className="instrument-core">FL</div>
                <span className="instrument-label instrument-label--top">SYS.ARCHIVE</span>
                <span className="instrument-label instrument-label--bottom">40.7128 / 74.0060</span>
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
