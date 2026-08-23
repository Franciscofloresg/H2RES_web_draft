(function () {
  const VERSIONS = window.H2RES_VERSION_DATA || {};
  const DEFAULT_RESOURCE_FALLBACK = "../model/index.html#model-resources";
  const SITE_LINKS = (window.H2RES_SITE_CONFIG && window.H2RES_SITE_CONFIG.links) || {};
  const DEFAULT_GITHUB_FALLBACK = SITE_LINKS.coreReleases || SITE_LINKS.githubRepo || "https://github.com/H2RES-model/H2RES-core/releases";
  const params = new URLSearchParams(window.location.search);
  const versionId = params.get("id");
  const version = VERSIONS[versionId];

  function setSectionVisibility(isVisible) {
    document.querySelectorAll("[data-version-section]").forEach((section) => {
      section.hidden = !isVisible;
    });
  }

  function renderMissingVersionState() {
    document.title = "Model Version Not Found - H2RES Model";
    document.getElementById("crumbVersionName").textContent = "Not found";
    document.getElementById("versionName").textContent = "Model version not found";
    document.getElementById("versionSubtitle").textContent = "The requested model version is not available in the current version tree.";
    document.getElementById("versionDescription").textContent = "Use the version index to open a documented model page or return to the general documentation section.";
    document.getElementById("versionLineage").textContent = "Unavailable";
    document.getElementById("versionStatus").textContent = "Check the version URL";
    document.getElementById("versionKeywords").innerHTML = "<span class=\"chip\">Invalid or missing version ID</span>";
    document.getElementById("versionFallbackActions").hidden = false;
    setSectionVisibility(false);
  }

  function renderList(targetId, items) {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = "";
    const safeItems = (items && items.length) ? items : ["To be documented."];
    safeItems.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      target.appendChild(li);
    });
  }

  function setResourceLink(anchorId, href, fallbackHref) {
    const link = document.getElementById(anchorId);
    if (link) link.href = href || fallbackHref;
  }

  function setVersionAccessLinks(versionData) {
    const githubLink = document.getElementById("versionGithubLink");
    const releaseIndexLink = document.getElementById("versionReleaseIndexLink");
    const accessDescription = document.getElementById("versionAccessDescription");
    const accessMeta = document.getElementById("versionAccessMeta");

    if (githubLink) {
      githubLink.href = versionData.githubUrl || DEFAULT_GITHUB_FALLBACK;
      githubLink.textContent = versionData.githubButtonText || "View on GitHub";
    }

    if (releaseIndexLink) {
      releaseIndexLink.href = versionData.releaseIndexUrl || DEFAULT_GITHUB_FALLBACK;
    }

    if (accessDescription) {
      accessDescription.textContent = versionData.githubDescription
        || "Open GitHub to access the implementation, source files, and release-level code associated with this version.";
    }

    if (accessMeta) {
      accessMeta.textContent = versionData.githubLabel || "GitHub source link configured for this version.";
    }
  }

  function setVersionResources(versionData) {
    const resources = versionData.resources || {};
    const formulationExists = Boolean(resources.hasFormulation);
    const manualExists = Boolean(resources.hasManual);
    const formulationUrl = resources.formulationUrl || DEFAULT_RESOURCE_FALLBACK;
    const manualUrl = resources.manualUrl || DEFAULT_RESOURCE_FALLBACK;

    setResourceLink("versionFormulationLink", formulationExists ? formulationUrl : DEFAULT_RESOURCE_FALLBACK, DEFAULT_RESOURCE_FALLBACK);
    setResourceLink("versionManualLink", manualExists ? manualUrl : DEFAULT_RESOURCE_FALLBACK, DEFAULT_RESOURCE_FALLBACK);

    document.getElementById("versionFormulationText").textContent = formulationExists
      ? "Open the mathematical and methodological formulation for this model version."
      : "Model formulation PDF not added yet. The link currently falls back to the general documentation page.";

    document.getElementById("versionManualText").textContent = manualExists
      ? "Open the version-specific user guide and workflow instructions."
      : "User manual PDF not added yet. The link currently falls back to the general documentation page.";
  }

  function renderVersionPage() {
    if (!version) {
      renderMissingVersionState();
      return;
    }

    setSectionVisibility(true);
    document.title = version.name + " - H2RES Model";
    document.getElementById("crumbVersionName").textContent = version.name;
    document.getElementById("versionTag").textContent = version.versionTag || "H2RES version";
    document.getElementById("versionName").textContent = version.name;
    document.getElementById("versionSubtitle").textContent = version.subtitle;
    document.getElementById("versionDescription").textContent = version.description;
    document.getElementById("versionLineage").textContent = version.lineage;
    document.getElementById("versionStatus").textContent = version.status;

    const keywordWrap = document.getElementById("versionKeywords");
    version.keywords.forEach((keyword) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = keyword;
      keywordWrap.appendChild(chip);
    });

    renderList("versionWhatChanged", version.whatChanged);
    renderList("versionUseCases", version.useCases);
    renderList("versionCompatibility", version.compatibility);
    renderList("versionKeyIO", version.keyIO);
    renderList("versionUseIf", version.useIf);
    renderList("versionAvoidIf", version.avoidIf);
    setVersionAccessLinks(version);
    setVersionResources(version);

    const navWrap = document.getElementById("versionNav");
    version.links.forEach((item) => {
      const link = document.createElement("a");
      link.className = "version-link";
      // If the target version points to a dedicated page (e.g. the H2RES 2.0
      // model map), link there directly instead of through the version page.
      const target = VERSIONS[item.id];
      const direct = target && target.link && target.link.indexOf("version.html") === -1;
      link.href = direct ? target.link : ("version.html?id=" + encodeURIComponent(item.id));
      link.innerHTML = "<strong>" + item.label + "</strong><span>" + item.note + "</span>";
      navWrap.appendChild(link);
    });
  }

  if (version && version.redirectTo) {
    // This version routes straight to a dedicated page (e.g. the interactive
    // H2RES 2.0 model map) instead of the standard version profile.
    window.location.replace(version.redirectTo);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderVersionPage);
  } else {
    renderVersionPage();
  }
})();
