import { AboutSection } from "./components/AboutSection";
import { ArchiveHeader } from "./components/ArchiveHeader";
import { ContactSection } from "./components/ContactSection";
import { Hero } from "./components/Hero";
import { ProjectSection } from "./components/ProjectSection";
import { ResumeSection } from "./components/ResumeSection";
import { SkillsSection } from "./components/SkillsSection";

export default function ArchivePage() {
    return (
        <div className="archive-shell" id="top">
            <a className="archive-skip-link" href="#archive-main">Skip to portfolio content</a>
            <div className="archive-noise" aria-hidden="true" />
            <ArchiveHeader />
            <main id="archive-main">
                <Hero />
                <ProjectSection />
                <SkillsSection />
                <AboutSection />
                <ResumeSection />
                <ContactSection />
            </main>
            <footer className="archive-footer">
                <p>Dark Eye // Engineering Archive</p>
                <p>Finnagain Larose · Hosted within the Dragon’s Gate</p>
                <a href="#top">Return to top <span aria-hidden="true">↑</span></a>
            </footer>
        </div>
    );
}
