(function () {
  const siteConfig = {
    links: {
      githubRepo: "https://github.com/H2RES-model",
      website: "https://h2res.org/",
      summerSchool: "https://www.sdewes.org/summerschool/2026/",
      youtube: "https://www.youtube.com/@H2REScommunity",
      newsletterEndpoint: "https://script.google.com/macros/s/AKfycbxKY_VFE4v7mEZt7niy7p6fSgOcruP2uVHFx-fpRmxr-V0GaigjUc5URzUiWrRyjsYxGA/exec"
    },
    labels: {
      newsletterSource: "H2RES website"
    },
    citations: {
      websiteText: "Duic, N., et al. (2026). H2RES Web Platform. Retrieved May 25, 2026, from https://h2res.org/",
      websiteHtml: "Duic, N., et al. (2026). <em>H2RES Web Platform</em>. Retrieved May 25, 2026, from https://h2res.org/"
    }
  };

  function getConfigValue(path) {
    return String(path || "")
      .split(".")
      .reduce((value, key) => (value && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined), siteConfig);
  }

  function applySiteConfig(root = document) {
    root.querySelectorAll("[data-config-link]").forEach((element) => {
      const value = getConfigValue(element.dataset.configLink);
      if (typeof value === "string" && value) {
        element.setAttribute("href", value);
      }
    });

    root.querySelectorAll("[data-config-endpoint]").forEach((element) => {
      const value = getConfigValue(element.dataset.configEndpoint);
      if (typeof value === "string" && value) {
        element.dataset.endpoint = value;
        if (element.tagName === "FORM") {
          element.setAttribute("action", value);
        }
      }
    });

    root.querySelectorAll("[data-config-value]").forEach((element) => {
      const value = getConfigValue(element.dataset.configValue);
      if (typeof value === "string") {
        if ("value" in element) {
          element.value = value;
        } else {
          element.setAttribute("value", value);
        }
      }
    });

    root.querySelectorAll("[data-config-text]").forEach((element) => {
      const value = getConfigValue(element.dataset.configText);
      if (typeof value === "string") {
        element.textContent = value;
      }
    });

    root.querySelectorAll("[data-config-html]").forEach((element) => {
      const value = getConfigValue(element.dataset.configHtml);
      if (typeof value === "string") {
        element.innerHTML = value;
      }
    });
  }

  window.H2RES_SITE_CONFIG = siteConfig;
  window.H2RES_getSiteConfigValue = getConfigValue;
  window.H2RES_applySiteConfig = applySiteConfig;
})();
