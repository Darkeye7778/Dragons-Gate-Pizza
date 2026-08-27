export type ProjectStatus =
    | "Built"
    | "Prototype"
    | "In Development"
    | "Concept"
    | "Research";

export type ProjectLink = {
    label: string;
    href: string;
};

export type ProjectMedia = {
    type: "image" | "video";
    src: string;
    alt: string;
};

export type ProjectWorkstream = {
    title: string;
    status: ProjectStatus;
    description: string;
};

export type PortfolioProject = {
    id: string;
    title: string;
    category: string;
    status?: ProjectStatus;
    eyebrow?: string;
    summary: string;
    problem?: string;
    approach?: string;
    technologies: string[];
    outcome?: string;
    workstreams?: ProjectWorkstream[];
    media?: ProjectMedia[];
    github?: string;
    demo?: string;
    caseStudy?: string;
    placeholder?: boolean;
};

export type SkillGroup = {
    title: string;
    index: string;
    skills: string[];
};

export type ContactDetails = {
    email: string | null;
    github: string | null;
    linkedin: string | null;
    otherLinks: ProjectLink[];
};

export const profile = {
    name: "Finnagain Larose",
    title: "Simulation Engineer · Robotics · Interactive Systems",
    intro:
        "I design systems that bridge software, simulation, electronics, robotics, and physical experience.",
    archiveLabel: "Dark Eye // Engineering Archive",
};

export const projects: PortfolioProject[] = [
    {
        id: "dragons-gate-pizza",
        title: "Dragon’s Gate Pizza",
        category: "Interactive systems · Venture platform",
        status: "In Development",
        eyebrow: "Featured system study // 001",
        summary:
            "An evolving restaurant and entertainment concept approached as an integrated systems-design challenge—not simply a hospitality brand. The current software is a prototype foundation; venue-scale physical systems remain explicitly labeled as concepts or research.",
        problem:
            "Bring ordering, operations, navigation, entertainment, and themed physical interactions into one coherent guest and operator experience.",
        approach:
            "Develop the digital foundation as modular systems, then evaluate higher-risk venue technologies as distinct prototypes and research tracks before operational deployment.",
        technologies: [
            "Next.js",
            "React",
            "TypeScript",
            "Pricing logic",
            "Interface prototyping",
            "Systems architecture",
        ],
        outcome:
            "Current output includes a working web prototype with menu, pricing, cart, checkout-validation, and customer-interface foundations. No venue-scale concept below is presented as operational.",
        workstreams: [
            {
                title: "Customer web experience",
                status: "Prototype",
                description: "Responsive menu, ordering, and customer-facing interface foundation.",
            },
            {
                title: "Menu & pricing software",
                status: "Prototype",
                description: "Typed catalog, pricing rules, cart totals, and checkout validation.",
            },
            {
                title: "Ordering / POS architecture",
                status: "In Development",
                description: "System boundaries and workflows for the future operating environment.",
            },
            {
                title: "BLE runner navigation",
                status: "Concept",
                description: "Indoor-positioning and route-optimization concepts for order delivery.",
            },
            {
                title: "Building-wide navigation",
                status: "Research",
                description: "Camera-assisted navigation and spatial-system integration exploration.",
            },
            {
                title: "Interactive venue systems",
                status: "Concept",
                description: "Arcade, tabletop, robotics, and animatronic integration concepts.",
            },
        ],
    },
    {
        id: "robotics-project",
        title: "Robotics & Motion Systems",
        category: "Future case study slot",
        summary: "Project description coming soon.",
        technologies: [],
        placeholder: true,
    },
    {
        id: "embedded-project",
        title: "Embedded Interaction",
        category: "Future case study slot",
        summary: "Project description coming soon.",
        technologies: [],
        placeholder: true,
    },
    {
        id: "simulation-project",
        title: "Real-Time Simulation",
        category: "Future case study slot",
        summary: "Project description coming soon.",
        technologies: [],
        placeholder: true,
    },
];

// This is an editable working inventory, not a claim of finalized resume content.
export const skillGroups: SkillGroup[] = [
    {
        title: "Software",
        index: "01",
        skills: ["TypeScript", "JavaScript", "C++", "Python", "Next.js", "React"],
    },
    {
        title: "Simulation / Game Technology",
        index: "02",
        skills: ["Unreal Engine", "Real-time simulation", "VR / XR"],
    },
    {
        title: "Hardware / Embedded",
        index: "03",
        skills: ["Microcontrollers", "Sensors", "Electronics", "Embedded systems"],
    },
    {
        title: "Robotics / Physical Systems",
        index: "04",
        skills: ["Robotics", "Motion systems", "Navigation", "Human-machine interaction"],
    },
    {
        title: "Engineering",
        index: "05",
        skills: ["Systems design", "Prototyping", "Testing", "Integration"],
    },
];

export const about = {
    label: "Working philosophy",
    heading: "Build the whole system, not just the visible layer.",
    paragraphs: [
        "My work centers on the boundary between digital logic and physical experience: where simulation informs behavior, software coordinates hardware, and an interface becomes part of a larger operating system.",
        "I’m interested in multidisciplinary engineering problems across robotics, real-time simulation, themed entertainment, and interactive physical systems—especially work that benefits from rapid prototyping, careful integration, and clear communication between disciplines.",
    ],
    focusAreas: [
        "Simulation engineering",
        "Robotics & physical computing",
        "Interactive experience systems",
        "Multidisciplinary prototyping",
    ],
};

export const resumeUrl: string | null = null;

export const contact: ContactDetails = {
    email: null,
    github: null,
    linkedin: null,
    otherLinks: [],
};
