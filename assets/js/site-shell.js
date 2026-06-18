(function () {
  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeRoot(root) {
    if (!root) {
      return "../";
    }
    return root.endsWith("/") ? root : `${root}/`;
  }

  function shellConfig() {
    const body = document.body;
    const root = normalizeRoot(body.dataset.shellRoot || "../");
    const active = body.dataset.shellActive || "";
    const modelHref = body.dataset.shellModelHref || `${root}model/index.html`;
    const modelResourcesHref = body.dataset.shellModelResourcesHref || `${root}model/index.html#model-resources`;
    const siteConfig = window.H2RES_SITE_CONFIG || {};
    const links = siteConfig.links || {};
    const navLabels = siteConfig.navLabels || {};
    const uiText = siteConfig.uiText || {};

    return {
      siteConfig,
      links,
      navLabels,
      uiText,
      root,
      active,
      modelHref,
      modelResourcesHref,
      homeHref: `${root}index.html#home`,
      startHereHref: `${root}index.html#start-here`,
      aboutHref: `${root}index.html#about`,
      tutorialsHref: `${root}index.html#tutorials`,
      publicationsHref: `${root}index.html#publications`,
      teamHref: `${root}index.html#team`,
      communityHref: `${root}index.html#community`
    };
  }

  function navItems(config) {
    return [
      { key: "start-here", label: config.navLabels.startHere || "Start Here", href: config.startHereHref },
      { key: "about", label: config.navLabels.about || "About", href: config.aboutHref },
      { key: "tutorials", label: config.navLabels.tutorials || "Tutorials", href: config.tutorialsHref },
      { key: "publications", label: config.navLabels.publications || "Publications", href: config.publicationsHref },
      { key: "team", label: config.navLabels.team || "Team", href: config.teamHref },
      { key: "community", label: config.navLabels.community || "Community", href: config.communityHref },
      { key: "model-resources", label: config.navLabels.modelResources || "Model Resources", href: config.modelResourcesHref },
      { key: "model", label: config.navLabels.model || "Model", href: config.modelHref }
    ];
  }

  function renderNavLinks(config, mobile) {
    return navItems(config).map((item) => {
      const activeClass = item.key === config.active ? ' class="active"' : "";
      return `${mobile ? "        " : "          "}<a href="${escapeHtml(item.href)}"${activeClass}>${escapeHtml(item.label)}</a>`;
    }).join("\n");
  }

  function renderHeader(config) {
    return `
  <header class="site-header">
    <div class="site-header-inner">
      <div class="site-nav-pill">
        <a class="site-logo" href="${escapeHtml(config.homeHref)}" aria-label="H2RES Home">
          <img src="${escapeHtml(config.root)}assets/h2res-logo.png" alt="H2RES logo">
        </a>
        <nav class="site-nav">
${renderNavLinks(config, false)}
        </nav>
        <div class="site-header-actions">
          <a class="icon-btn" href="${escapeHtml(config.links.githubRepo || "#")}" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"></path>
            </svg>
          </a>
          <button class="icon-btn mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu" aria-controls="mobileNav" aria-expanded="false" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <nav class="mobile-nav" id="mobileNav" aria-hidden="true">
    <div class="mobile-nav-panel">
      <div class="mobile-nav-top">
        <a class="site-logo" href="${escapeHtml(config.homeHref)}" aria-label="H2RES Home">
          <img src="${escapeHtml(config.root)}assets/h2res-logo.png" alt="H2RES logo">
        </a>
        <button class="icon-btn" id="mobileCloseBtn" aria-label="Close menu" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="mobile-nav-links">
${renderNavLinks(config, true)}
      </div>
    </div>
  </nav>`;
  }

  function renderFooter(config) {
    return `
  <footer class="site-footer">
    <div class="container">
      <div class="site-footer-card">
        <div class="site-footer-main">
          <div class="site-footer-brand">
            <a class="site-logo" href="${escapeHtml(config.homeHref)}"><img src="${escapeHtml(config.root)}assets/h2res-logo.png" alt="H2RES logo"></a>
            <p>${escapeHtml(config.uiText.footerTagline || "Open-source framework for integrated energy system planning, optimization, and decarbonization pathway analysis.")}</p>
          </div>
          <div class="site-footer-links-grid">
            <div class="site-footer-links-group">
              <h4>Quick Links</h4>
              <a href="${escapeHtml(config.aboutHref)}">About H2RES</a>
              <a href="${escapeHtml(config.publicationsHref)}">Publications</a>
              <a href="${escapeHtml(config.modelHref)}">${escapeHtml(config.navLabels.model || "Model")}</a>
              <a href="${escapeHtml(config.teamHref)}">${escapeHtml(config.navLabels.team || "Team")}</a>
            </div>
            <div class="site-footer-links-group">
              <h4>Resources</h4>
              <a href="${escapeHtml(config.startHereHref)}">${escapeHtml(config.navLabels.startHere || "Start Here")}</a>
              <a href="${escapeHtml(config.modelResourcesHref)}">${escapeHtml(config.navLabels.modelResources || "Model Resources")}</a>
              <a href="${escapeHtml(config.tutorialsHref)}">${escapeHtml(config.navLabels.tutorials || "Tutorials")}</a>
              <a href="${escapeHtml(config.links.githubRepo || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(config.uiText.githubRepository || "GitHub Repository")}</a>
            </div>
            <div class="site-footer-links-group">
              <h4>Community</h4>
              <a href="${escapeHtml(config.communityHref)}">${escapeHtml(config.uiText.howToCite || "How to Cite")}</a>
              <a href="${escapeHtml(config.links.youtube || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(config.uiText.youtubeChannel || "YouTube Channel")}</a>
              <a href="${escapeHtml(config.links.summerSchool || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(config.uiText.summerSchool || "Summer School")}</a>
            </div>
          </div>
        </div>
        <div class="site-footer-divider"></div>
        <div class="site-footer-bottom">
          <div>${escapeHtml(config.uiText.footerAddress || "Ivana Lucica 5, Faculty of Mechanical Engineering and Naval Architecture, University of Zagreb, Croatia.")}</div>
          <div>${escapeHtml(config.uiText.footerCopyright || "© 2026 H2RES Team.")}</div>
        </div>
      </div>
    </div>
  </footer>`;
  }

  function renderShell() {
    const config = shellConfig();
    const headerRoot = document.querySelector("[data-site-shell-header]");
    const footerRoot = document.querySelector("[data-site-shell-footer]");

    if (headerRoot) {
      headerRoot.outerHTML = renderHeader(config);
    }

    if (footerRoot) {
      footerRoot.outerHTML = renderFooter(config);
    }
  }

  function initSiteShell() {
    if (typeof window.H2RES_applySiteConfig === "function") {
      window.H2RES_applySiteConfig(document);
    }

    renderShell();

    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileCloseBtn = document.getElementById("mobileCloseBtn");
    const mobileNav = document.getElementById("mobileNav");
    const mobileNavPanel = mobileNav ? mobileNav.querySelector(".mobile-nav-panel") : null;

    if (!mobileMenuBtn || !mobileCloseBtn || !mobileNav || !mobileNavPanel) return;

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    function setMenuState(isOpen) {
      mobileNav.classList.toggle("open", isOpen);
      mobileNav.setAttribute("aria-hidden", isOpen ? "false" : "true");
      mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.classList.toggle("mobile-nav-open", isOpen);

      if (isOpen) {
        const firstFocusable = mobileNavPanel.querySelector(focusableSelector);
        if (firstFocusable) firstFocusable.focus();
      } else {
        mobileMenuBtn.focus();
      }
    }

    function trapFocus(event) {
      if (event.key !== "Tab" || !mobileNav.classList.contains("open")) return;
      const focusable = Array.from(mobileNavPanel.querySelectorAll(focusableSelector));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    mobileMenuBtn.addEventListener("click", () => setMenuState(true));
    mobileCloseBtn.addEventListener("click", () => setMenuState(false));

    mobileNav.addEventListener("click", (event) => {
      if (event.target === mobileNav) setMenuState(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && mobileNav.classList.contains("open")) {
        event.preventDefault();
        setMenuState(false);
        return;
      }
      trapFocus(event);
    });

    document.querySelectorAll(".mobile-nav-links a").forEach((link) => {
      link.addEventListener("click", () => setMenuState(false));
    });

    mobileNav.setAttribute("aria-hidden", "true");
    mobileMenuBtn.setAttribute("aria-expanded", "false");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSiteShell);
  } else {
    initSiteShell();
  }
})();
