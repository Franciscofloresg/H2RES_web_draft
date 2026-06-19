(function () {
  const VERSION_DATA = window.H2RES_VERSION_DATA || {};
  const COMPARE_DIMENSIONS = [
    { label: "Planning approach", key: "planningApproach" },
    { label: "Spatial scope", key: "spatialScope" },
    { label: "Primary focus", key: "primaryFocus" },
    { label: "Best for", key: "bestFor" },
    { label: "Key strength", key: "keyStrength" },
    { label: "Limitations", key: "limitations" }
  ];

  function renderVersionCards() {
    const grid = document.getElementById("versionCardGrid");
    if (!grid) return;
    grid.innerHTML = "";
    Object.entries(VERSION_DATA).forEach(([id, version]) => {
      const card = document.createElement("a");
      card.className = "version-card";
      card.href = version.link;
      card.innerHTML = `<strong>${version.name}</strong><span class="version-card-tag">${version.versionTag || ""}</span><span>${version.cardSummary || version.preview || ""}</span>`;
      grid.appendChild(card);
    });
  }

  function updatePreview(versionId) {
    const version = VERSION_DATA[versionId];
    if (!version) return;
    document.getElementById("versionPreviewTitle").textContent = version.name;
    document.getElementById("versionPreviewText").textContent = version.preview;
    document.getElementById("versionPreviewLink").href = version.link;
  }

  function setupDiagramPreview() {
    document.querySelectorAll(".node-link[data-version]").forEach((node) => {
      const versionId = node.dataset.version;
      node.addEventListener("mouseenter", () => updatePreview(versionId));
      node.addEventListener("focus", () => updatePreview(versionId));
    });
  }

  function renderCompareTable() {
    const selectA = document.getElementById("compareVersionA");
    const selectB = document.getElementById("compareVersionB");
    const versionA = VERSION_DATA[selectA.value];
    const versionB = VERSION_DATA[selectB.value];
    if (!versionA || !versionB) return;

    document.getElementById("compareHeadA").textContent = versionA.name;
    document.getElementById("compareHeadB").textContent = versionB.name;
    document.getElementById("compareLinkA").href = versionA.link;
    document.getElementById("compareLinkB").href = versionB.link;
    document.getElementById("compareLinkA").textContent = "Open " + versionA.name;
    document.getElementById("compareLinkB").textContent = "Open " + versionB.name;

    const tbody = document.getElementById("compareBody");
    const mobileCards = document.getElementById("compareMobileCards");
    tbody.innerHTML = "";
    if (mobileCards) mobileCards.innerHTML = "";
    COMPARE_DIMENSIONS.forEach((dimension) => {
      const valueA = versionA[dimension.key] || "-";
      const valueB = versionB[dimension.key] || "-";
      const tr = document.createElement("tr");
      const different = valueA !== valueB;
      tr.innerHTML = [
        "<td>" + dimension.label + "</td>",
        "<td" + (different ? " class=\"compare-diff\"" : "") + ">" + valueA + "</td>",
        "<td" + (different ? " class=\"compare-diff\"" : "") + ">" + valueB + "</td>"
      ].join("");
      tbody.appendChild(tr);

      if (mobileCards) {
        const card = document.createElement("article");
        card.className = "compare-mobile-card";
        card.innerHTML = [
          "<strong>" + dimension.label + "</strong>",
          "<div class=\"compare-mobile-values\">",
          "<div class=\"compare-mobile-value" + (different ? " compare-diff" : "") + "\"><span>" + versionA.name + "</span><p>" + valueA + "</p></div>",
          "<div class=\"compare-mobile-value" + (different ? " compare-diff" : "") + "\"><span>" + versionB.name + "</span><p>" + valueB + "</p></div>",
          "</div>"
        ].join("");
        mobileCards.appendChild(card);
      }
    });
  }

  function setupCompare() {
    const selectA = document.getElementById("compareVersionA");
    const selectB = document.getElementById("compareVersionB");
    if (!selectA || !selectB) return;
    const options = Object.entries(VERSION_DATA).map(([id, version]) => ({ id, name: version.name, tag: version.versionTag || "" }));
    options.forEach((option) => {
      const optionA = document.createElement("option");
      optionA.value = option.id;
      optionA.textContent = option.tag ? `${option.name} (${option.tag})` : option.name;
      selectA.appendChild(optionA);
      const optionB = document.createElement("option");
      optionB.value = option.id;
      optionB.textContent = option.tag ? `${option.name} (${option.tag})` : option.name;
      selectB.appendChild(optionB);
    });
    selectA.value = "v1-2-myopic";
    selectB.value = "v2-0";
    renderCompareTable();
    selectA.addEventListener("change", renderCompareTable);
    selectB.addEventListener("change", renderCompareTable);
  }

  function init() {
    renderVersionCards();
    updatePreview("v1-0");
    setupDiagramPreview();
    setupCompare();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
