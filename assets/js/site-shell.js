(function () {
  function initSiteShell() {
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
