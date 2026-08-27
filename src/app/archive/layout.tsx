import type { Metadata } from "next";
import "./archive.css";

export const metadata: Metadata = {
    title: "Engineering Archive // Finnagain Larose",
    description: "Engineering portfolio for Finnagain Larose—simulation, robotics, and interactive systems.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
    return children;
}
