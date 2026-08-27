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

export type PublicRepository = {
    name: string;
    description: string;
    technology: string;
    href: string;
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
            "Current development includes menu, pricing, cart-state, validation, and customer-interface foundations, while portions of the end-to-end ordering experience remain in development. No venue-scale concept below is presented as operational.",
        github: "https://github.com/Darkeye7778/Dragons-Gate-Pizza",
        workstreams: [
            {
                title: "Customer web experience",
                status: "Prototype",
                description: "Responsive menu and customer-interface foundations; the full ordering journey remains in development.",
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
        id: "just-in-time-training",
        title: "JustInTime Training",
        category: "XR training · Applied AI",
        status: "Prototype",
        eyebrow: "Integrated system study // 002",
        summary:
            "An Unreal Engine 5.6 nursing-training prototype that connects an interactive IV-pump simulation to locally hosted speech, language-model, text-to-speech, and contextual-media services.",
        problem:
            "Support hands-on equipment training with an assistant that can accept spoken questions and return useful answers, audio, and related training media inside an XR experience.",
        approach:
            "Combine Unreal C++ interaction and audio components with an HTTP/JSON client and a Python FastAPI service for local model inference, speech output, and video search.",
        technologies: [
            "Unreal Engine 5.6",
            "C++",
            "Python",
            "FastAPI",
            "HTTP / JSON",
            "Speech recognition",
            "Text-to-speech",
            "LoRA",
        ],
        outcome:
            "The repository establishes an integrated prototype path from an Unreal client to local AI and audio services. Retrieval grounding, full simulation-state awareness, and packaging remain in development.",
        github: "https://github.com/Darkeye7778/JustInTimeTraining",
        workstreams: [
            {
                title: "XR interaction layer",
                status: "Prototype",
                description: "Unreal C++ selectors, grabbers, controls, menus, and object-manipulation components.",
            },
            {
                title: "Voice input pipeline",
                status: "Prototype",
                description: "Runtime microphone capture and speech-recognition integration for Unreal.",
            },
            {
                title: "Local AI & speech service",
                status: "Prototype",
                description: "FastAPI endpoints connect local model inference, speech synthesis, and WAV delivery.",
            },
            {
                title: "Knowledge retrieval",
                status: "In Development",
                description: "Curated training data exists; the repository identifies database retrieval as incomplete.",
            },
            {
                title: "Contextual training media",
                status: "In Development",
                description: "Video transcription and search components exist, with end-to-end XR wiring still evolving.",
            },
        ],
    },
    {
        id: "obsidia-os",
        title: "Obsidia OS",
        category: "Operating systems · Low-level software",
        status: "In Development",
        eyebrow: "Systems study // 003",
        summary:
            "A freestanding x86 hobby operating-system kernel built in C to explore boot architecture, memory management, device input, graphics, storage, and shell design below the application layer.",
        problem:
            "Build a minimal computing environment without a standard library while making low-level hardware and memory behavior observable and testable.",
        approach:
            "Use Limine for the boot boundary, then develop modular framebuffer, console, keyboard, line-editor, memory, heap, initrd, and shell subsystems for QEMU-based iteration.",
        technologies: [
            "C",
            "x86",
            "Limine",
            "QEMU",
            "Make",
            "Framebuffer graphics",
            "Physical memory management",
            "Initramfs",
        ],
        outcome:
            "The current kernel renders a text console, handles keyboard input and line editing, manages physical pages, exposes heap groundwork, reads an initial filesystem, and runs a simple shell. Filesystem writes and user programs remain planned.",
        github: "https://github.com/Darkeye7778/obsidia-os",
    },
    {
        id: "var-vr-interaction",
        title: "VAR — VR Interaction Framework",
        category: "Real-time interaction · Unreal Engine",
        status: "Prototype",
        eyebrow: "Interaction study // 004",
        summary:
            "A component-driven Unreal Engine C++ framework for manipulating and assembling objects in VR through direct selection, ray-based pointing, grabbing, docking, world movement, and simulated physical controls.",
        problem:
            "Provide a reusable interaction layer for precise selection, object manipulation, assembly tasks, and instrument-like controls inside a real-time VR environment.",
        approach:
            "Separate selectors, grabbers, interactable objects, assembly behavior, and controls into focused components that communicate through transforms, collision, and snap-state logic.",
        technologies: [
            "Unreal Engine",
            "C++",
            "OpenXR",
            "VR interaction",
            "Component architecture",
            "Spatial transforms",
        ],
        outcome:
            "The repository contains C++ implementations for eye/hand ray selection, direct selection, grabbing, assembly and docking, world manipulation, dials, and sliders. Deployment and user-test results are not documented.",
        github: "https://github.com/Darkeye7778/VAR",
        workstreams: [
            {
                title: "Selection systems",
                status: "Prototype",
                description: "Direct, ray-based, and eye/hand selector components share a common interaction model.",
            },
            {
                title: "Manipulation",
                status: "Prototype",
                description: "Grabber and world-grabber components manage object and environment transforms.",
            },
            {
                title: "Assembly & docking",
                status: "Prototype",
                description: "Snap, detach, and unsnap-distance logic supports component assembly tasks.",
            },
            {
                title: "Physical controls",
                status: "Prototype",
                description: "Reusable dial and slider components model constrained interactive controls.",
            },
        ],
    },
];

export const additionalRepositories: PublicRepository[] = [
    {
        name: "Aether Gates",
        description:
            "Java/Fabric portal-system prototype with frame discovery, custom portal shapes, tier and color matching, and early same- and cross-dimension link logic.",
        technology: "Java · Fabric",
        href: "https://github.com/Darkeye7778/Aether_Gates",
    },
    {
        name: "TheGameP1",
        description:
            "Team Unity project featuring procedural level generation, weighted room dressing, level-state management, and custom editor tooling.",
        technology: "C# · Unity",
        href: "https://github.com/Darkeye7778/TheGameP1",
    },
];

// This is an editable working inventory, not a claim of finalized resume content.
export const skillGroups: SkillGroup[] = [
    {
        title: "Software",
        index: "01",
        skills: ["C++", "C", "C#", "Python", "Java", "TypeScript", "JavaScript", "Bash", "SQL", "x86 Assembly"],
    },
    {
        title: "Simulation / Real-Time",
        index: "02",
        skills: ["Unreal Engine 5", "Unity", "Real-time simulation", "VR / XR", "Meta Quest 3"],
    },
    {
        title: "Hardware / Embedded",
        index: "03",
        skills: ["Embedded systems", "FreeRTOS", "ESP32", "Raspberry Pi", "GPIO", "I²C"],
    },
    {
        title: "Robotics / Physical Systems",
        index: "04",
        skills: ["MOOG motion systems", "Motion control", "Electromechanical systems", "System calibration", "Hardware / software integration", "Human-machine interaction"],
    },
    {
        title: "Engineering / Systems",
        index: "05",
        skills: ["Systems design", "Client / server architecture", "REST · MQTT · TCP/IP", "Prototyping", "System testing", "Git"],
    },
];

export const about = {
    label: "Working philosophy",
    heading: "Build the whole system, not just the visible layer.",
    paragraphs: [
        "I work across real-time software, XR training, embedded platforms, low-level systems, and electromechanical simulation hardware. The common thread is integration: making software, interfaces, networks, and physical systems behave as one understandable whole.",
        "I’m drawn to multidisciplinary engineering problems in simulation, robotics, themed entertainment, and interactive physical systems—especially work that benefits from rapid prototyping, methodical testing, and clear communication between disciplines.",
    ],
    focusAreas: [
        "Real-time simulation & XR",
        "Embedded & low-level systems",
        "Interactive physical systems",
        "Systems integration & testing",
    ],
};

export const resumeUrl: string | null = "/Finnagain-LaRose-Resume.pdf";

export const contact: ContactDetails = {
    email: "finnagainlarose@gmail.com",
    github: "https://github.com/darkeye7778",
    linkedin: "https://www.linkedin.com/in/gideon-larose-59284b229/",
    otherLinks: [],
};
