const SITE_LINKS = (window.H2RES_SITE_CONFIG && window.H2RES_SITE_CONFIG.links) || {};
const DEFAULT_VERSION_GITHUB_URL = SITE_LINKS.coreReleases || SITE_LINKS.githubRepo || "https://github.com/H2RES-model/H2RES-core/releases";

window.H2RES_VERSION_DATA = {
  "v1-0": {
    versionTag: "H2RES v1.0",
    name: "Baseline Core Model",
    link: "../versions/version.html?id=v1-0",
    treeLabel: "Baseline Core",
    timelineNote: "Initial version",
    cardSummary: "Baseline integrated optimization model for hourly long-term energy planning and transition pathway analysis.",
    preview: "Baseline open-source model for hourly long-term energy planning with capacity expansion, system operation, sector coupling, storage, hydrogen, and power-to-X.",
    planningApproach: "Integrated long-term optimization",
    spatialScope: "Single-system integrated representation",
    primaryFocus: "Capacity expansion and hourly system operation",
    bestFor: "Baseline transition studies and integrated scenario analysis",
    keyStrength: "Combines investments, operations, flexibility, and multiple energy sectors in one framework",
    limitations: "Does not yet reflect the specialized logic introduced in later versions",
    subtitle: "Baseline integrated energy system planning model.",
    description: "H2RES v1.0 is the baseline open-source model version for long-term energy planning at hourly resolution. It is designed to evaluate transition pathways in integrated energy systems by combining capacity expansion, technology retirement, system operation, sector coupling, storage, hydrogen, and power-to-X options within a single optimization framework.",
    lineage: "Root of this model tree",
    status: "Reference version",
    githubUrl: "https://github.com/H2RES-model/H2RES-core/releases/tag/v1.0",
    downloadUrl: "",
    githubButtonText: "Open GitHub Release",
    releaseIndexUrl: DEFAULT_VERSION_GITHUB_URL,
    githubLabel: "Release page configured for H2RES v1.0.",
    githubDescription: "Use this page to understand the scope of H2RES v1.0, then open the GitHub release page associated with this baseline version.",
    resources: {
      formulationUrl: "../assets/version-resources/v1-0/model-formulation.pdf",
      manualUrl: "../assets/version-resources/v1-0/user-manual.pdf",
      hasFormulation: true,
      hasManual: true
    },
    keywords: ["Baseline", "Core structure", "Model root"],
    whatChanged: [
      "Establishes the baseline optimization structure used in later H2RES versions.",
      "Combines data processing, model building, and LP/MILP optimization into a single workflow for scenario analysis."
    ],
    useCases: [
      "Run baseline long-term energy transition scenarios at hourly resolution.",
      "Study investments, dispatch, flexibility, sector coupling, hydrogen, and power-to-X strategies in an integrated framework."
    ],
    compatibility: [
      "Acts as the reference structure for downstream v1.x versions.",
      "Suitable as the parent benchmark for methodological comparisons across later versions."
    ],
    keyIO: [
      "Inputs: demand, technology, policy, economic, and resource data processed through read_process_data.py.",
      "Outputs: costs, dispatch, capacity expansion, reserves, and emissions indicators from the optimization model.",
      "Model formulation: version-specific reference to be linked.",
      "User manual: version-specific reference to be linked."
    ],
    useIf: [
      "You need a transparent baseline model for long-term integrated energy planning.",
      "You want to analyze energy transition pathways with investments, hourly operation, storage, hydrogen, and sector coupling in one framework."
    ],
    avoidIf: [
      "You require a later version with additional specialized features or revised structure.",
      "You are specifically looking for a more advanced version tailored to myopic or multizonal-myopic analysis."
    ],
    links: [
      { id: "v1-1", label: "Adequacy and Preprocessing Update", note: "Next model in the diagram" }
    ]
  },
  "v1-1": {
    versionTag: "H2RES v1.1",
    name: "Adequacy and Preprocessing Update",
    link: "../versions/version.html?id=v1-1",
    treeLabel: "Adequacy Update",
    timelineNote: "Derived from v1.0",
    cardSummary: "Version upgrade with explicit unmet-service variables, scarcity penalties, and improved data-processing traceability.",
    preview: "v1.1 extends the baseline model with explicit unmet-service variables, transparent scarcity penalties, new scenario controls, and updated preprocessing for active data packages.",
    planningApproach: "Integrated long-term optimization with explicit adequacy relaxation",
    spatialScope: "Single-system integrated representation",
    primaryFocus: "Improved adequacy handling and data-processing traceability",
    bestFor: "Studies comparing v1.0 and v1.1 behavior under explicit scarcity treatment",
    keyStrength: "Makes unmet electricity and heat service explicit in both balances and objective terms",
    limitations: "Precedes myopic and multizonal developments and includes an implementation-specific reduced time horizon setting",
    subtitle: "Baseline-plus formulation update with explicit adequacy treatment.",
    description: "H2RES v1.1 builds directly on the v1.0 baseline while introducing a clearer implementation of adequacy relaxation, unmet-service accounting, and active data preprocessing. It keeps the integrated long-term optimization structure, but adds explicit unmet-service variables for electricity and heat services, monetized scarcity terms in the objective, scenario controls affecting CEEP and fossil dispatch, and an updated CSV/XLSX preprocessing workflow for active data packages and technology-specific CAPEX trajectories.",
    lineage: "Derived from H2RES v1.0",
    status: "Reference upgrade within v1.x",
    githubUrl: "https://github.com/H2RES-model/H2RES-core/releases/tag/v1.1",
    downloadUrl: "",
    githubButtonText: "Open GitHub Release",
    releaseIndexUrl: DEFAULT_VERSION_GITHUB_URL,
    githubLabel: "Release page configured for H2RES v1.1.",
    githubDescription: "Use this page to review the methodological updates in H2RES v1.1, then open the GitHub release page associated with this release line.",
    resources: {
      formulationUrl: "../assets/version-resources/v1-1/model-formulation.pdf",
      manualUrl: "../assets/version-resources/v1-1/user-manual.pdf",
      hasFormulation: true,
      hasManual: true
    },
    keywords: ["v1.1", "Adequacy relaxation", "Unmet-service variables", "Data preprocessing"],
    whatChanged: [
      "Introduced explicit unmet-service variables for electricity, district heating, and general or industrial heat instead of relying only on the legacy aggregate slack representation.",
      "Extended the objective with explicit scarcity and unmet-service penalty terms, together with scenario controls such as ceep_penalty and fossil_dispatch.",
      "Updated preprocessing to read the active v1.1 CSV/XLSX data package and build technology-specific annual CAPEX trajectories for major flexibility technologies."
    ],
    useCases: [
      "Compare baseline v1.0 behavior against a more explicit adequacy and scarcity formulation.",
      "Run integrated energy planning studies where unmet electricity and heat service should appear transparently in balances, outputs, and objective costs."
    ],
    compatibility: [
      "Maintains continuity with the v1.0 integrated model structure and version lineage.",
      "Acts as the methodological predecessor to later v1.x developments, while still remaining a non-myopic and non-multizonal implementation."
    ],
    keyIO: [
      "Inputs: active v1.1 CSV and XLSX data packages, identifier-matched technology data, policy and economic assumptions, and annual CAPEX trajectories for flexibility technologies.",
      "Outputs: costs, dispatch, capacity, reserves, and explicit unmet-service indicators across electricity and heat balances.",
      "Model formulation: version-specific reference to be linked.",
      "User manual: version-specific reference to be linked."
    ],
    useIf: [
      "You need the v1.0 logic but want scarcity treatment and unmet-service behavior represented more explicitly.",
      "You want a traceable formulation tied closely to the implemented Build_model.py and read_process_data.py workflow."
    ],
    avoidIf: [
      "You require myopic planning, multizonal representation, or later specialized derivatives.",
      "You need a full-horizon implementation that does not rely on the reduced time-horizon setting currently present in the v1.1 code."
    ],
    links: [
      { id: "v1-0", label: "Baseline Core Model", note: "Previous model" },
      { id: "v1-2-myopic", label: "Myopic Planning Extension", note: "Next model" }
    ]
  },
  "v1-2-myopic": {
    versionTag: "H2RES v1.2",
    name: "Myopic Planning Extension",
    link: "../versions/version.html?id=v1-2-myopic",
    treeLabel: "Myopic Planning",
    timelineNote: "Derived from v1.1",
    cardSummary: "Version focused on rolling-horizon planning behavior and phased transition analysis.",
    preview: "v1.2 introduces a rolling-horizon counterpart to the core model, explicit horizon controls, investment carryover between windows, overflow investment penalties, and monetized hydro spill handling.",
    planningApproach: "Full-horizon or rolling-horizon optimization",
    spatialScope: "Single-system integrated representation",
    primaryFocus: "Intertemporal planning through linked windows and investment carryover",
    bestFor: "Phased transition studies comparing full-horizon and rolling-horizon behavior",
    keyStrength: "Adds transparent rolling-horizon logic without abandoning the core integrated model structure",
    limitations: "Window design and carryover settings can materially affect interpretation of pathway results",
    subtitle: "Rolling-horizon and myopic planning extension within v1.x.",
    description: "H2RES v1.2 extends the v1.1 structure by adding a rolling-horizon counterpart to the core optimization model while preserving the integrated system representation. It introduces explicit horizon controls for periods, years, and windows, investment carryover logic between linked subproblems, overflow investment variables with penalty costs, and monetized hydro spillage. The result is a version suited to phased or myopic pathway analysis while remaining directly comparable with full-horizon studies.",
    lineage: "Derived from H2RES v1.1",
    status: "Major transition-planning upgrade",
    githubUrl: "https://github.com/H2RES-model/H2RES-core/releases/tag/v1.2",
    downloadUrl: "",
    githubButtonText: "Open GitHub Release",
    releaseIndexUrl: DEFAULT_VERSION_GITHUB_URL,
    githubLabel: "Release page configured for H2RES v1.2.",
    githubDescription: "Use this page to understand the rolling-horizon logic of H2RES v1.2, then open the GitHub release page associated with this version.",
    resources: {
      formulationUrl: "../assets/version-resources/v1-2-myopic/model-formulation.pdf",
      manualUrl: "../assets/version-resources/v1-2-myopic/user-manual.pdf",
      hasFormulation: true,
      hasManual: true
    },
    keywords: ["Myopic", "Rolling horizon", "Investment carryover", "v1.2"],
    whatChanged: [
      "Added a rolling-horizon implementation alongside the full-horizon model so the same system can be solved through linked subproblems.",
      "Made the active optimization horizon explicit through periods, years, and window controls rather than leaving horizon definition hidden inside builder internals.",
      "Introduced cumulative investment carryover equations, overflow investment variables, hydro spill costs, and clearer non-negativity domains for most continuous variables."
    ],
    useCases: [
      "Run phased pathway studies where investment decisions should depend on previous-window commitments.",
      "Compare full-horizon and rolling-horizon behavior under the same integrated system structure."
    ],
    compatibility: [
      "Builds directly on the v1.1 formulation and preprocessing workflow.",
      "Acts as the upstream methodological base for both the v1.3 multizonal-myopic line and the v2.0 downstream branch."
    ],
    keyIO: [
      "Inputs: rolling-window controls, explicit horizon definitions, investment carryover settings, policy and economic trajectories, and the active data package processed through read_process_data.py.",
      "Outputs: pathway indicators, window-linked investment decisions, dispatch, capacity, reserves, costs, and hydro spill or unmet-service effects relevant to phased transition analysis.",
      "Model formulation: version-specific reference to be linked.",
      "User manual: version-specific reference to be linked."
    ],
    useIf: [
      "You need phased or sequential transition decision analysis rather than only a single full-horizon solve.",
      "You want to study how investment decisions evolve across linked planning windows under explicit carryover rules."
    ],
    avoidIf: [
      "You only need the simpler baseline or v1.1 full-horizon formulation without rolling-horizon logic.",
      "You require spatial detail across multiple zones rather than a single-system myopic formulation."
    ],
    links: [
      { id: "v1-1", label: "Adequacy and Preprocessing Update", note: "Previous model" },
      { id: "v1-3-multizonal-myopic", label: "Multizonal Myopic Extension", note: "Forward model" },
      { id: "v2-0", label: "Next-Generation Model", note: "Downstream model" }
    ]
  },
  "v1-3-multizonal-myopic": {
    versionTag: "H2RES v1.3",
    name: "Multizonal Myopic Extension",
    link: "../versions/version.html?id=v1-3-multizonal-myopic",
    treeLabel: "Multizonal Myopic",
    timelineNote: "Derived from v1.2",
    cardSummary: "Advanced v1.x model combining multizonal structure, transfer decisions, and staged pathway analysis.",
    preview: "v1.3 restructures the model around an explicit multizone architecture with regional variables, bilateral electricity transfers, endogenous transfer investment, national policy layers, and rolling-horizon sequencing managed through the workflow wrapper.",
    planningApproach: "Multizonal full-horizon or rolling-horizon optimization",
    spatialScope: "Multiple interconnected systems or zones",
    primaryFocus: "Regional coupling, transfer decisions, and multizone policy analysis",
    bestFor: "Regional pathway analysis with phased planning and interzonal electricity exchanges",
    keyStrength: "Adds a true multizone architecture while preserving continuity with earlier sector-coupled logic",
    limitations: "Requires consistent topology, transfer data, and more demanding multiregional inputs",
    subtitle: "Multizone and rolling-horizon regional extension of the v1.x line.",
    description: "H2RES v1.3 preserves the sector-coupled logic of earlier releases but restructures the implementation around an explicit multizone architecture. Core operational, investment, storage, heat, hydrogen, import, and emissions variables are instantiated by system and linked through bilateral inter-system electricity flows, endogenous transfer-capacity investments, and national policy layers. Rolling-horizon execution is embedded procedurally through the workflow wrapper rather than a separate builder, making this version appropriate for regional pathway studies with cross-zone interactions.",
    lineage: "Derived from H2RES v1.2 (Myopic)",
    status: "Advanced regional planning upgrade",
    githubUrl: "https://github.com/H2RES-model/H2RES-core/releases/tag/v1.3",
    downloadUrl: "",
    githubButtonText: "Open GitHub Release",
    releaseIndexUrl: DEFAULT_VERSION_GITHUB_URL,
    githubLabel: "Release page configured for H2RES v1.3.",
    githubDescription: "Use this page to review the multizonal-myopic scope of H2RES v1.3, then open the GitHub release page associated with this regional release line.",
    resources: {
      formulationUrl: "../assets/version-resources/v1-3-multizonal-myopic/model-formulation.pdf",
      manualUrl: "../assets/version-resources/v1-3-multizonal-myopic/user-manual.pdf",
      hasFormulation: true,
      hasManual: true
    },
    keywords: ["Multizonal", "Rolling horizon", "Transfer investment", "v1.3"],
    whatChanged: [
      "Restructured most operational and investment variables so they carry a leading system index and are evaluated region by region.",
      "Introduced a dedicated multizone preprocessing layer and a system-level workbook defining topology and transfer limits before technology and demand mapping.",
      "Added bilateral electricity transfer variables, endogenous transfer-capacity investment, explicit national policy layers, and wrapper-managed rolling-horizon sequencing."
    ],
    useCases: [
      "Run regional transition studies where electricity exchanges and transmission expansion between zones matter.",
      "Analyze interactions between regional balances, transfer limits, and national policy constraints under phased planning."
    ],
    compatibility: [
      "Builds directly on the v1.2 rolling-horizon and sector-coupled logic while extending it to multiple systems.",
      "Acts as the parent regional platform for the downstream v1.4 e-fuels derivative."
    ],
    keyIO: [
      "Inputs: system-level topology data, transfer limits, regional demand and technology datasets, national policy vectors, and rolling-window controls.",
      "Outputs: regional flows, transfer-capacity decisions, exported result dictionaries, and multizone pathway indicators across costs, dispatch, capacity, reserves, and emissions.",
      "Model formulation: version-specific reference to be linked.",
      "User manual: version-specific reference to be linked."
    ],
    useIf: [
      "You need multi-zone representation with explicit electricity exchanges and possible transfer-capacity expansion.",
      "You want staged or rolling-horizon transition analysis that keeps both regional and national policy layers visible."
    ],
    avoidIf: [
      "You need a simpler single-system setup without multiregional topology and transfer data requirements.",
      "You need a more specialized downstream model focused specifically on e-fuels rather than general regional coupling."
    ],
    links: [
      { id: "v1-2-myopic", label: "Myopic Planning Extension", note: "Previous model" },
      { id: "v1-4-efuels", label: "E-fuels Extension", note: "Next model" }
    ]
  },
  "v1-4-efuels": {
    versionTag: "H2RES v1.4",
    name: "E-fuels Extension",
    link: "../versions/version.html?id=v1-4-efuels",
    treeLabel: "E-fuels Extension",
    timelineNote: "Derived from v1.3",
    cardSummary: "Documentation in preparation for the downstream e-fuels branch.",
    preview: "Documentation for v1.4 is currently in preparation. This version is expected to extend the v1.3 regional line with e-fuels-specific modeling and sector-coupling details.",
    planningApproach: "Documentation in preparation",
    spatialScope: "To be documented",
    primaryFocus: "E-fuels extension under development",
    bestFor: "Users waiting for version-specific documentation",
    keyStrength: "Positioned as the downstream e-fuels branch from v1.3",
    limitations: "Methodological description and supporting resources are still being prepared",
    subtitle: "Documentation in preparation for the e-fuels extension.",
    description: "The detailed description for H2RES v1.4 is currently being prepared. This version is positioned as the e-fuels-oriented continuation of the v1.3 multizonal-myopic line, but the full methodological documentation and version-specific explanatory material are still under development.",
    lineage: "Derived from H2RES v1.3 (Multizonal Myopic)",
    status: "Documentation in progress",
    githubUrl: DEFAULT_VERSION_GITHUB_URL,
    downloadUrl: "",
    githubButtonText: "Open All Releases",
    releaseIndexUrl: DEFAULT_VERSION_GITHUB_URL,
    githubLabel: "General releases page configured while branch-specific release links are prepared.",
    githubDescription: "Use this page for version guidance and open the general GitHub releases page while the branch-specific release entry for v1.4 is finalized.",
    resources: {
      formulationUrl: "../assets/version-resources/v1-4-efuels/model-formulation.pdf",
      manualUrl: "../assets/version-resources/v1-4-efuels/user-manual.pdf",
      hasFormulation: false,
      hasManual: false
    },
    keywords: ["E-fuels", "v1.4", "Documentation in preparation"],
    whatChanged: [
      "The detailed formulation changes for v1.4 are currently being documented.",
      "This page will be updated once the version-specific methodological notes and supporting files are finalized."
    ],
    useCases: [
      "Use this page as a placeholder reference while the v1.4 documentation is being assembled.",
      "Return here once the user manual and mathematical formulation for the e-fuels branch are published."
    ],
    compatibility: [
      "Expected to remain aligned with the v1.3 multizonal-myopic lineage.",
      "Detailed compatibility notes will be added when the technical documentation is completed."
    ],
    keyIO: [
      "Inputs: to be documented.",
      "Outputs: to be documented.",
      "Model formulation: documentation in preparation.",
      "User manual: documentation in preparation."
    ],
    useIf: [
      "You want to track the upcoming documentation for the e-fuels branch.",
      "You need to know where the v1.x e-fuels extension sits within the overall version tree."
    ],
    avoidIf: [
      "You need a fully documented version today for immediate methodological use.",
      "You need version-specific implementation details that have not yet been published."
    ],
    links: [
      { id: "v1-3-multizonal-myopic", label: "Multizonal Myopic Extension", note: "Previous model" }
    ]
  },
  "v2-0": {
    versionTag: "H2RES v2.0",
    name: "Next-Generation Model",
    link: "../versions/version.html?id=v2-0",
    treeLabel: "Next-Generation",
    timelineNote: "Derived from v1.2 (parallel major line)",
    cardSummary: "Documentation in preparation for the next-generation major version.",
    preview: "Documentation for v2.0 is currently under development. This version is shown as the next major downstream line, but its full methodological description is still being assembled.",
    planningApproach: "Documentation in preparation",
    spatialScope: "To be documented",
    primaryFocus: "Next-generation framework under documentation",
    bestFor: "Users monitoring the upcoming major-version release",
    keyStrength: "Represents the major downstream branch after the v1.x line",
    limitations: "Description, resources, and implementation notes are still being prepared",
    subtitle: "Documentation in preparation for the next-generation model line.",
    description: "The detailed description for H2RES v2.0 is currently under development. In the version tree, v2.0 appears as the major downstream branch from the v1.x line, but its full documentation, assumptions, and implementation notes are still being prepared.",
    lineage: "Downstream from the v1.x development line",
    status: "Documentation in progress",
    githubUrl: DEFAULT_VERSION_GITHUB_URL,
    downloadUrl: "",
    githubButtonText: "Open All Releases",
    releaseIndexUrl: DEFAULT_VERSION_GITHUB_URL,
    githubLabel: "General releases page configured while v2.0 release material is prepared.",
    githubDescription: "Use this page for version guidance and open the general GitHub releases page while the version-specific release entry for v2.0 is prepared.",
    resources: {
      formulationUrl: "../assets/version-resources/v2-0/model-formulation.pdf",
      manualUrl: "../assets/version-resources/v2-0/user-manual.pdf",
      hasFormulation: false,
      hasManual: false
    },
    keywords: ["v2.0", "Next generation", "Documentation in preparation"],
    whatChanged: [
      "The major-version changes for v2.0 are currently being compiled and documented.",
      "This page will be expanded once the methodological description and supporting resources are finalized."
    ],
    useCases: [
      "Use this page as a reference point for the upcoming next-generation branch.",
      "Return here when the formal v2.0 documentation package becomes available."
    ],
    compatibility: [
      "Maintains a lineage connection to the v1.x development path.",
      "Detailed compatibility and migration notes will be added once documentation is completed."
    ],
    keyIO: [
      "Inputs: to be documented.",
      "Outputs: to be documented.",
      "Model formulation: documentation in preparation.",
      "User manual: documentation in preparation."
    ],
    useIf: [
      "You want to track the upcoming documentation for the next-generation branch.",
      "You need to understand where v2.0 sits in the overall H2RES evolution."
    ],
    avoidIf: [
      "You need a fully documented model version for immediate use.",
      "You need implementation details or resources that have not yet been published."
    ],
    links: [
      { id: "v1-2-myopic", label: "H2RES v1.2 (Myopic)", note: "Related upstream model" }
    ]
  }
};


