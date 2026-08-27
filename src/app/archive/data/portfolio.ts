export type ProjectMaturity =
    | "Built"
    | "Deployed"
    | "Prototype"
    | "Pitch Prototype"
    | "In Development"
    | "Concept"
    | "Research";

export type WorkstreamStatus =
    | "Implemented"
    | "Pitch-Ready"
    | "In Development"
    | "Research"
    | "Planned";

export type ProjectLink = {
    label: string;
    href: string;
};

export type ProjectMedia = {
    type: "image" | "video";
    src: string;
    alt: string;
};

// Store future evidence under public/archive/projects/<project-folder>/ and
// reference it here with a public path such as /archive/projects/f1/clip.mp4.

export type ProjectWorkstream = {
    title: string;
    status: WorkstreamStatus;
    description: string;
};

export type PortfolioProject = {
    id: string;
    title: string;
    category: string;
    status?: ProjectMaturity;
    radarLabel?: string;
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
        radarLabel: "DGP",
        eyebrow: "Featured system study // 001",
        summary:
            "I’m developing Dragon’s Gate Pizza as an integrated restaurant and entertainment system—not simply a hospitality brand. I’ve built the current software as a prototype foundation while keeping venue-scale physical systems explicitly labeled as concepts or research.",
        problem:
            "I’m working to bring ordering, operations, navigation, entertainment, and themed physical interactions into one coherent guest and operator experience.",
        approach:
            "I’m building the digital foundation as modular systems, then evaluating higher-risk venue technologies as distinct prototypes and research tracks before any operational deployment.",
        technologies: [
            "Next.js",
            "React",
            "TypeScript",
            "Pricing logic",
            "Interface prototyping",
            "Systems architecture",
        ],
        outcome:
            "I’ve implemented menu data, pricing rules, cart state, validation, and customer-interface foundations. I’m still developing parts of the end-to-end ordering experience, and I do not present any venue-scale concept below as operational.",
        github: "https://github.com/Darkeye7778/Dragons-Gate-Pizza",
        workstreams: [
            {
                title: "Customer web experience",
                status: "In Development",
                description: "I’ve built responsive menu and customer-interface foundations and am continuing the full ordering journey.",
            },
            {
                title: "Menu & pricing software",
                status: "Implemented",
                description: "I implemented the typed catalog, pricing rules, cart totals, and checkout validation.",
            },
            {
                title: "Ordering / POS architecture",
                status: "In Development",
                description: "I’m defining system boundaries and workflows for the future operating environment.",
            },
            {
                title: "BLE runner navigation",
                status: "Planned",
                description: "I plan to explore indoor positioning and route optimization for order delivery.",
            },
            {
                title: "Building-wide navigation",
                status: "Research",
                description: "I’m researching camera-assisted navigation and spatial-system integration.",
            },
            {
                title: "Interactive venue systems",
                status: "Planned",
                description: "I’m planning arcade, tabletop, robotics, and animatronic integration concepts.",
            },
        ],
    },
    {
        id: "just-in-time-training",
        title: "JustInTime Training",
        category: "XR training · Applied AI",
        status: "Pitch Prototype",
        radarLabel: "JIT",
        eyebrow: "Integrated system study // 002",

        summary:
            "The team and I built a pitch-ready Unreal Engine 5.6 nursing-training prototype that connects an interactive IV-pump simulation to locally hosted speech recognition, language-model, text-to-speech, and contextual-media systems.",

        problem:
            "We set out to support hands-on equipment training with an assistant that accepts spoken questions and returns useful answers, audio, and related training media inside an XR experience.",

        approach:
            "I combined Unreal C++ interaction and audio components with an HTTP/JSON client and a Python FastAPI service for local model inference, speech output, and contextual media.",

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
            "We completed the project as a pitch-ready prototype, integrating its XR interaction, voice, AI, speech, knowledge, and contextual-media systems for the final demonstration and pitch. We built it as a proof of concept rather than a production deployment, meant to show what advent health could do with current technologies.",

        github: "https://github.com/Darkeye7778/JustInTimeTraining",

        workstreams: [
            {
                title: "XR interaction layer",
                status: "Pitch-Ready",
                description:
                    "We completed the Unreal C++ selectors, grabbers, controls, menus, and object-manipulation systems used in the pitched prototype.",
            },
            {
                title: "Voice input pipeline",
                status: "Pitch-Ready",
                description:
                    "I implemented runtime microphone capture and speech-recognition integration for the final prototype.",
            },
            {
                title: "Local AI & speech service",
                status: "Pitch-Ready",
                description:
                    "I connected local model inference, speech synthesis, and audio delivery through FastAPI services.",
            },
            {
                title: "Knowledge retrieval",
                status: "Pitch-Ready",
                description:
                    "I integrated the training-knowledge and response systems required for the final prototype and pitch.",
            },
            {
                title: "Contextual training media",
                status: "Pitch-Ready",
                description:
                    "I aided in integrating contextual-media retrieval and its supporting systems into the completed pitch prototype.",
            },
        ],
    },
    {
        id: "obsidia-os",
        title: "Obsidia OS",
        category: "Operating systems · Low-level software",
        status: "In Development",
        radarLabel: "OBSIDIA",
        eyebrow: "Systems study // 003",
        summary:
            "I’m building a freestanding x86 hobby operating-system kernel in C to explore boot architecture, memory management, device input, graphics, storage, and shell design below the application layer.",
        problem:
            "I set out to build a minimal computing environment without a standard library while keeping low-level hardware and memory behavior observable and testable.",
        approach:
            "I use Limine for the boot boundary, then develop modular framebuffer, console, keyboard, line-editor, memory, heap, initrd, and shell subsystems through QEMU-based iteration.",
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
            "I’ve implemented a text console, keyboard input, line editing, physical-page management, heap groundwork, initial-filesystem reads, and a simple shell. Filesystem writes and user programs remain planned.",
        github: "https://github.com/Darkeye7778/obsidia-os",
        workstreams: [
            {
                title: "Console & framebuffer",
                status: "Implemented",
                description: "I implemented framebuffer rendering for the kernel’s current text-console output.",
            },
            {
                title: "Input & line editing",
                status: "Implemented",
                description: "I implemented keyboard handling and line editing for interactive console input.",
            },
            {
                title: "Memory management",
                status: "In Development",
                description: "I have physical-page management working and am continuing to build out heap support.",
            },
            {
                title: "Initial filesystem",
                status: "In Development",
                description: "I implemented reads from the initial filesystem; filesystem writes remain planned.",
            },
            {
                title: "Shell environment",
                status: "Implemented",
                description: "I built a simple command shell for the current kernel, while user programs remain planned.",
            },
        ],
    },
    {
        id: "var-vr-interaction",
        title: "VAR — VR Interaction Framework",
        category: "Real-time interaction · Unreal Engine",
        status: "Built",
        radarLabel: "VAR",
        eyebrow: "Interaction study // 004",
        summary:
            "I built a component-driven Unreal Engine C++ framework for manipulating and assembling objects in VR through direct selection, ray-based pointing, grabbing, docking, world movement, and simulated physical controls.",
        problem:
            "I wanted a reusable interaction layer for precise selection, object manipulation, assembly tasks, and instrument-like controls inside a real-time VR environment.",
        approach:
            "I separated selectors, grabbers, interactable objects, assembly behavior, and controls into focused components that communicate through transforms, collision, and snap-state logic.",
        technologies: [
            "Unreal Engine",
            "C++",
            "OpenXR",
            "VR interaction",
            "Component architecture",
            "Spatial transforms",
        ],
        outcome:
            "I completed VAR as a class project and brought it to its intended final state: a reusable VR interaction framework demonstrating selection, manipulation, docking, world movement, and simulated physical controls in Unreal Engine.",
        github: "https://github.com/Darkeye7778/VAR",
        workstreams: [
            {
                title: "Selection systems",
                status: "Implemented",
                description: "I implemented direct, ray-based, and eye/hand selector components around a common interaction model.",
            },
            {
                title: "Manipulation",
                status: "Implemented",
                description: "I built grabber and world-grabber components to manage object and environment transforms.",
            },
            {
                title: "Assembly & docking",
                status: "Implemented",
                description: "I implemented snap, detach, and unsnap-distance logic for component assembly tasks.",
            },
            {
                title: "Physical controls",
                status: "Implemented",
                description: "I built reusable dial and slider components for constrained interactive controls.",
            },
        ],
    },
    {
        id: "6dof-motion-platform",
        title: "6-DOF Motion Platform Implementation",
        category: "Motion systems · Electromechanical integration",
        status: "In Development",
        radarLabel: "6DOF",
        eyebrow: "Motion systems study // 005",
        summary:
            "My 6-DOF motion-platform work began with a custom Stewart-platform design using six servo-driven actuators, then expanded into hands-on integration and testing with an industrial MOOG motion platform as part of a larger Formula One simulator project.",
        problem:
            "I wanted to understand how a six-degree-of-freedom motion platform could translate simulated motion into coordinated physical movement across multiple actuators.",
        approach:
            "I started with a simpler six-servo Stewart-platform implementation to explore motion-platform geometry, actuator coordination, and control behavior, then applied that experience while working with the larger MOOG platform used in the Formula One simulator.",
        technologies: [
            "MOOG motion systems",
            "6-DOF motion platform",
            "Motion control",
            "Electromechanical systems",
            "Unreal Engine",
            "Hardware / software integration",
            "System calibration",
            "System testing",
        ],
        outcome:
            "I’m continuing this work through hands-on motion-base restoration, integration, calibration, and communication testing. This is collaborative work rather than a platform I built alone, and it remains in development.",
        workstreams: [
            {
                title: "Stewart-platform design",
                status: "Implemented",
                description:
                    "I developed a six-actuator Stewart-platform implementation as the initial motion-system design.",
            },
            {
                title: "Actuator coordination",
                status: "Implemented",
                description:
                    "I worked with coordinated servo motion to produce controlled platform movement across six degrees of freedom.",
            },
            {
                title: "Motion calibration",
                status: "In Development",
                description:
                    "I continued applying calibration and verification techniques as the work transitioned to the larger MOOG motion system.",
            },
            {
                title: "Industrial platform integration",
                status: "In Development",
                description:
                    "I applied the earlier Stewart-platform work while integrating and testing the industrial MOOG platform used in the F1 simulator.",
            },
        ],
    },
    {
        id: "f1-vehicle-simulator-system",
        title: "Formula One Motion-Base Simulator",
        category: "Vehicle simulation · Real-time systems",
        status: "In Development",
        radarLabel: "F1",
        eyebrow: "Vehicle simulation study // 006",
        summary:
            "I’m collaborating on a Full Sail University final project that combines Unreal Engine vehicle simulation, a six-degree-of-freedom MOOG motion base, three-projector display hardware, and a projection pipeline.",
        problem:
            "I’m helping coordinate real-time vehicle physics with physical motion and multi-projector visuals so the simulation, control, display, and hardware layers behave as one simulator.",
        approach:
            "I work on development and restoration, help connect Unreal Engine simulation output to the motion system, and test communication across the motion-control, display, and projection pipeline.",
        technologies: [
            "Unreal Engine",
            "Real-time vehicle simulation",
            "Simulator hardware",
            "MOOG motion base",
            "Three-projector display",
            "Projection pipeline",
            "Hardware / software integration",
            "System testing",
            "Composite fabrication",
            "Carbon-fiber layup",
            "Fiberglass layup",
            "Surface preparation",
            "Paint & finishing",
            "Bodywork fabrication",
            "Composite tooling",
            "Mold preparation",
        ],
        outcome:
            "My work so far includes collaborative simulator restoration, real-time simulation-to-motion integration, and cross-system communication testing. It remains an ongoing team project, not a complete platform I claim as my own.",
        workstreams: [
            {
                title: "Vehicle simulation output",
                status: "In Development",
                description: "I work with Unreal Engine output that provides real-time vehicle-physics data to the integrated simulator.",
            },
            {
                title: "Motion synchronization",
                status: "In Development",
                description: "I help synchronize simulation output with the six-degree-of-freedom motion platform during integration.",
            },
            {
                title: "Display integration",
                status: "In Development",
                description: "I work with the three-projector display hardware and projection pipeline in the simulator configuration.",
            },
            {
                title: "End-to-end testing",
                status: "In Development",
                description: "I test communication across the simulation software, motion control, display hardware, and projection systems.",
            },
            {
                title: "Fabrications & Layup",
                status: "In Development",
                description: "I helped fabricate, paint, and apply carbon fiber and fiberglass to the structure of the F1 Car.",
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
