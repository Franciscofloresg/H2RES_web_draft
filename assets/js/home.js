    if (typeof window.H2RES_applySiteConfig === 'function') {
      window.H2RES_applySiteConfig(document);
    }

    // Theme Toggle Functionality (temporarily disabled)
    const THEME_TOGGLE_ENABLED = false;
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    // Keep a fixed light theme while toggle is disabled.
    html.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    if (themeToggle) {
      themeToggle.disabled = !THEME_TOGGLE_ENABLED;
    }

    if (THEME_TOGGLE_ENABLED && themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });
    }

    // Publications from BibTeX
    const siteConfig = window.H2RES_SITE_CONFIG || {};
    const siteLinks = siteConfig.links || {};
    const siteCitations = siteConfig.citations || {};
    const siteLabels = siteConfig.labels || {};
    const PUB_BIB_SOURCE = 'h2res_research_outputs.bib';
    const H2RES_CITATION_BIBTEX = `@article{FEIJOO2022112781,
  title = {A long-term capacity investment and operational energy planning model with power-to-X and flexibility technologies},
  author = {Feijoo, Felipe and Pfeifer, Antun and Herc, Luka and Groppi, Daniele and Duic, Neven},
  journal = {Renewable and Sustainable Energy Reviews},
  volume = {167},
  pages = {112781},
  year = {2022},
  doi = {10.1016/j.rser.2022.112781},
  url = {https://www.sciencedirect.com/science/article/pii/S1364032122006657}
}`;
    const H2RES_ACKNOWLEDGEMENT_TEXT = 'This work uses the open-source H2RES modeling framework. Please cite Feijoo, F., Pfeifer, A., Herc, L., Groppi, D., and Duic, N. (2022), A long-term capacity investment and operational energy planning model with power-to-X and flexibility technologies, Renewable and Sustainable Energy Reviews, 167, 112781. https://doi.org/10.1016/j.rser.2022.112781';
    const H2RES_WEBSITE_CITATION_TEXT = siteCitations.websiteText || 'Duic, N., et al. (2026). H2RES Web Platform. Retrieved May 25, 2026, from https://h2res.org/';
    const HERO_TICKER_FIXED_ITEMS = [
      {
        label: 'Summer School 2026',
        title: 'Energy Planning of 100% Renewable Energy Systems',
        url: siteLinks.summerSchool || 'https://www.sdewes.org/summerschool/2026/'
      }
    ];
    const HERO_TICKER_FEATURED_KEYS = [
      'BELJAN2026125674',
      'CALISE2026100234',
      'VILLANI2026117662',
      'HERC2025101067',
      'PASTORE2025136384'
    ];
    const pubGrid = document.getElementById('pubGrid');
    const pubTabs = document.querySelectorAll('.pub-tab');
    const pubYearFilter = document.getElementById('pubYearFilter');
    const pubShowMoreButton = document.getElementById('pubShowMore');
    const heroTickerPrimary = document.getElementById('heroTickerPrimary');
    const heroTickerSecondary = document.getElementById('heroTickerSecondary');
    const PUB_PAGE_SIZE = 4;
    let activePubFilter = 'articles';
    let activePubYear = 'all';
    let visiblePubCount = PUB_PAGE_SIZE;
    let publicationEntries = [];
    const { normalizeBibValue, parseBibTeX } = window.H2resBibUtils;
    const teamData = window.H2RES_TEAM_DATA || {};
    const teamHome = window.H2RES_TEAM_HOME || {};

    function escapeHtml(text) {
      return String(text || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function formatAuthors(authorsValue) {
      const rawAuthors = (authorsValue || '')
        .split(/\s+and\s+/i)
        .map(part => normalizeBibValue(part))
        .filter(Boolean);

      if (rawAuthors.length === 0) {
        return '';
      }

      const shortNames = rawAuthors.map(name => {
        if (name.includes(',')) {
          return name.split(',')[0].trim();
        }
        const words = name.trim().split(/\s+/);
        return words[words.length - 1] || name.trim();
      });

      if (shortNames.length > 3) {
        return `${shortNames[0]} et al.`;
      }
      return shortNames.join(', ');
    }

    function resolveBibLink(fields) {
      const doi = normalizeBibValue(fields.doi || fields.DOI || '');
      const rawUrl = normalizeBibValue(fields.url || fields.URL || '');
      if (rawUrl) {
        return rawUrl;
      }
      if (doi) {
        return doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
      }
      return '#publications';
    }

    function shortenTickerTitle(title) {
      const clean = normalizeBibValue(title);
      if (clean.length <= 96) {
        return clean;
      }
      return `${clean.slice(0, 93).trimEnd()}...`;
    }

    function buildHeroTickerMarkup(items) {
      return items.map(item => `
        <a class="hero-ticker-item" href="${escapeHtml(item.url)}" ${item.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>
          <strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.title)}
        </a>
        <span class="hero-ticker-sep"></span>
      `).join('');
    }

    function renderHeroTicker(entries) {
      if (!heroTickerPrimary || !heroTickerSecondary) {
        return;
      }

      const fixedItems = HERO_TICKER_FIXED_ITEMS.map(item => ({
        ...item,
        external: true
      }));

      const entryMap = new Map(entries.map(entry => [entry.citationKey, entry]));
      const publicationItems = HERO_TICKER_FEATURED_KEYS
        .map(key => entryMap.get(key))
        .filter(Boolean)
        .map(entry => ({
          label: `${entry.fields.year || 'Article'} Article`,
          title: shortenTickerTitle(entry.fields.title || entry.citationKey),
          url: resolveBibLink(entry.fields),
          external: true
        }));

      const tickerItems = [...fixedItems, ...publicationItems];
      const markup = buildHeroTickerMarkup(tickerItems);
      heroTickerPrimary.innerHTML = markup;
      heroTickerSecondary.innerHTML = markup;
    }

    function resolveCategory(entryType, fields) {
      const normalizedType = (entryType || '').toLowerCase();
      const context = [
        fields.title,
        fields.keywords,
        fields.note,
        fields.journal,
        fields.booktitle,
        fields.howpublished
      ].join(' ').toLowerCase();

      // Strict category rules requested:
      // - Articles tab: only @article
      // - Conference tab: only @inproceedings
      if (normalizedType === 'article') {
        return 'articles';
      }
      if (normalizedType === 'inproceedings') {
        return 'conference';
      }

      if (normalizedType === 'mastersthesis' || normalizedType === 'phdthesis' || normalizedType === 'thesis') {
        return 'thesis';
      }

      if (
        normalizedType === 'dataset' ||
        normalizedType === 'data' ||
        normalizedType === 'software' ||
        /dataset|data set|database|zenodo|figshare|kaggle/.test(context)
      ) {
        return 'database';
      }

      if (
        normalizedType === 'conference' ||
        normalizedType === 'proceedings'
      ) {
        return 'conference';
      }

      if (
        normalizedType === 'techreport' ||
        normalizedType === 'report' ||
        normalizedType === 'manual' ||
        normalizedType === 'inbook' ||
        normalizedType === 'incollection' ||
        normalizedType === 'book' ||
        /deliverable/.test(context)
      ) {
        return 'report';
      }

      const normalizedHowPublished = normalizeBibValue(fields.howpublished || '').toLowerCase();
      if (normalizedType === 'misc' && normalizedHowPublished === 'research project') {
        return 'project';
      }

      return 'report';
    }

    function typeLabel(entryType) {
      const labelMap = {
        article: 'Journal Article',
        inbook: 'Book Chapter',
        incollection: 'Book Chapter',
        inproceedings: 'Conference Paper',
        conference: 'Conference Paper',
        proceedings: 'Conference Proceedings',
        techreport: 'Technical Report',
        report: 'Report',
        thesis: 'Thesis',
        mastersthesis: 'Master Thesis',
        phdthesis: 'PhD Thesis',
        dataset: 'Dataset',
        data: 'Dataset',
        software: 'Software',
        misc: 'Record'
      };
      return labelMap[(entryType || '').toLowerCase()] || 'Publication';
    }

    function publicationIcon(category) {
      if (category === 'conference') {
        return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
      }
      if (category === 'thesis') {
        return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
      }
      if (category === 'database') {
        return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>';
      }
      if (category === 'project') {
        return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/></svg>';
      }
      return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
    }

    function buildPublicationLinks(entry) {
      const links = [];
      const doiRaw = (entry.fields.doi || '').replace(/^doi:\s*/i, '').trim();
      const doiUrl = doiRaw.startsWith('http') ? doiRaw : (doiRaw ? `https://doi.org/${doiRaw}` : '');
      const entryUrl = entry.fields.url || '';
      const pdfUrl = entry.fields.pdf || '';

      if (doiUrl) {
        links.push(`<a class="pub-link" href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener noreferrer">DOI ↗</a>`);
      }
      if (entryUrl) {
        links.push(`<a class="pub-link" href="${escapeHtml(entryUrl)}" target="_blank" rel="noopener noreferrer">URL ↗</a>`);
      }
      if (pdfUrl) {
        links.push(`<a class="pub-link" href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer">PDF ↗</a>`);
      }
      links.push(`<a class="pub-link bibtex-copy" href="#" data-key="${escapeHtml(entry.citationKey)}">BibTeX</a>`);

      return links.join('');
    }

    function detailsIdFromKey(citationKey) {
      return `details-${String(citationKey || 'entry').replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    }

    function projectPageUrl(entry) {
      return `projects/project.html?id=${encodeURIComponent(entry.citationKey || '')}`;
    }

    function buildPublicationDetails(entry) {
      const abstractText = entry.fields.abstract ? normalizeBibValue(entry.fields.abstract) : '';
      const keywordsText = entry.fields.keywords ? normalizeBibValue(entry.fields.keywords) : '';
      const keywords = keywordsText
        .split(/[;,]/)
        .map(item => item.trim())
        .filter(Boolean);

      const detailParts = [];
      if (abstractText) {
        detailParts.push(`<p class="pub-details-row"><span class="pub-details-label">Abstract:</span> ${escapeHtml(abstractText)}</p>`);
      }
      if (keywords.length > 0) {
        detailParts.push(`<p class="pub-details-row"><span class="pub-details-label">Keywords:</span> ${escapeHtml(keywords.join(', '))}</p>`);
      }
      if (detailParts.length === 0) {
        detailParts.push('<p class="pub-details-row">No abstract or keywords available in this BibTeX entry.</p>');
      }

      const detailsId = detailsIdFromKey(entry.citationKey);
      return `<div class="pub-details" id="${escapeHtml(detailsId)}" hidden>${detailParts.join('')}</div>`;
    }

    function buildPublicationCard(entry) {
      const title = entry.fields.title || entry.citationKey || 'Untitled publication';
      const source = entry.fields.journal || entry.fields.booktitle || entry.fields.school || entry.fields.publisher || entry.fields.institution || 'Unknown source';
      const year = entry.fields.year || 'n.d.';
      const authors = formatAuthors(entry.fields.author);
      const meta = `${source}, ${year}${authors ? ` • ${authors}` : ''}`;
      const detailsId = detailsIdFromKey(entry.citationKey);

      if (entry.category === 'project') {
        const projectUrl = projectPageUrl(entry);
        return `
          <div class="pub-card pub-card-project" data-project-url="${escapeHtml(projectUrl)}" role="link" tabindex="0">
            <div class="pub-icon">${publicationIcon(entry.category)}</div>
            <div class="pub-content">
              <span class="pub-type">Research Project</span>
              <h4 class="pub-title">${escapeHtml(title)}</h4>
              <p class="pub-meta">${escapeHtml(meta)}</p>
              <div class="pub-links">${buildPublicationLinks(entry)}</div>
              <p class="pub-project-hint">Open project page for full details</p>
            </div>
          </div>
        `;
      }

      return `
        <div class="pub-card" data-key="${escapeHtml(entry.citationKey)}" data-details-id="${escapeHtml(detailsId)}" role="button" tabindex="0" aria-expanded="false" aria-controls="${escapeHtml(detailsId)}">
          <div class="pub-icon">${publicationIcon(entry.category)}</div>
          <div class="pub-content">
            <span class="pub-type">${escapeHtml(typeLabel(entry.entryType))}</span>
            <h4 class="pub-title">${escapeHtml(title)}</h4>
            <p class="pub-meta">${escapeHtml(meta)}</p>
            <div class="pub-links">${buildPublicationLinks(entry)}</div>
            ${buildPublicationDetails(entry)}
          </div>
        </div>
      `;
    }

    async function copyBibtexText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }

      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.left = '-9999px';
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(helper);

      if (!copied) {
        throw new Error('Copy command failed');
      }
    }

    function bindBibtexCopyActions() {
      document.querySelectorAll('.bibtex-copy').forEach(link => {
        link.addEventListener('click', async event => {
          event.preventDefault();
          const key = link.getAttribute('data-key');
          const selected = publicationEntries.find(entry => entry.citationKey === key);
          if (!selected) {
            return;
          }
          const originalText = link.textContent;
          try {
            await copyBibtexText(selected.bibtex);
            link.textContent = 'Copied';
          } catch (error) {
            link.textContent = 'Copy failed';
          }
          window.setTimeout(() => {
            link.textContent = originalText;
          }, 1200);
        });
      });
    }

    function bindCommunityCopyActions() {
      const copyBibtexButton = document.getElementById('copy-h2res-bibtex');
      const copyAcknowledgementButton = document.getElementById('copy-h2res-ack');
      const copyWebsiteCitationButton = document.getElementById('copy-h2res-webcite');

      function bindButtonAction(button, text, copiedLabel) {
        if (!button) {
          return;
        }
        const originalText = button.textContent;
        button.addEventListener('click', async () => {
          try {
            await copyBibtexText(text);
            button.textContent = copiedLabel;
          } catch (error) {
            button.textContent = 'Copy failed';
          }
          window.setTimeout(() => {
            button.textContent = originalText;
          }, 1200);
        });
      }

      bindButtonAction(copyBibtexButton, H2RES_CITATION_BIBTEX, 'BibTeX copied');
      bindButtonAction(copyAcknowledgementButton, H2RES_ACKNOWLEDGEMENT_TEXT, 'Text copied');
      bindButtonAction(copyWebsiteCitationButton, H2RES_WEBSITE_CITATION_TEXT, 'Web citation copied');
    }

    function bindPublicationCardToggleActions() {
      const projectCards = Array.from(document.querySelectorAll('.pub-card[data-project-url]'));
      projectCards.forEach(card => {
        const openProject = () => {
          const targetUrl = card.getAttribute('data-project-url');
          if (targetUrl) {
            window.location.href = targetUrl;
          }
        };

        card.addEventListener('click', event => {
          if (event.target.closest('.pub-link')) {
            return;
          }
          openProject();
        });

        card.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }
          if (event.target.closest('.pub-link')) {
            return;
          }
          event.preventDefault();
          openProject();
        });
      });

      const cards = Array.from(document.querySelectorAll('.pub-card[data-details-id]'));

      function setExpanded(card, expanded) {
        const detailsId = card.getAttribute('data-details-id');
        const details = detailsId ? document.getElementById(detailsId) : null;
        if (!details) {
          return;
        }
        if (expanded) {
          card.classList.add('expanded');
          card.setAttribute('aria-expanded', 'true');
          details.removeAttribute('hidden');
        } else {
          card.classList.remove('expanded');
          card.setAttribute('aria-expanded', 'false');
          details.setAttribute('hidden', '');
        }
      }

      function collapseOthers(activeCard) {
        cards.forEach(card => {
          if (card !== activeCard) {
            setExpanded(card, false);
          }
        });
      }

      cards.forEach(card => {
        card.addEventListener('click', event => {
          if (event.target.closest('.pub-link')) {
            return;
          }
          const isExpanded = card.getAttribute('aria-expanded') === 'true';
          collapseOthers(card);
          setExpanded(card, !isExpanded);
        });

        card.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }
          event.preventDefault();
          const isExpanded = card.getAttribute('aria-expanded') === 'true';
          collapseOthers(card);
          setExpanded(card, !isExpanded);
        });
      });
    }

    function updatePublicationYearOptions(resetSelection = false) {
      if (!pubYearFilter) {
        return;
      }

      const years = Array.from(new Set(
        publicationEntries
          .filter(entry => entry.category === activePubFilter && entry.sortYear > 0)
          .map(entry => entry.sortYear)
      )).sort((a, b) => b - a);

      if (resetSelection || !years.includes(Number(activePubYear))) {
        activePubYear = 'all';
      }

      const options = ['<option value="all">All years</option>']
        .concat(years.map(year => `<option value="${year}">${year}</option>`));

      pubYearFilter.innerHTML = options.join('');
      pubYearFilter.value = activePubYear;
      pubYearFilter.disabled = years.length === 0;
    }

    function filteredPublicationEntries() {
      let filtered = publicationEntries.filter(entry => entry.category === activePubFilter);
      if (activePubYear !== 'all') {
        filtered = filtered.filter(entry => String(entry.sortYear) === activePubYear);
      }
      return filtered;
    }

    function activePublicationSectionLabel() {
      const labels = {
        articles: 'Articles',
        conference: 'Conferences',
        report: 'Reports',
        thesis: 'Thesis',
        project: 'Projects',
        database: 'Databases'
      };
      return labels[activePubFilter] || 'Records';
    }

    function updateShowMoreButton(totalItems) {
      if (!pubShowMoreButton) {
        return;
      }

      if (totalItems <= visiblePubCount) {
        pubShowMoreButton.textContent = 'Show more';
        pubShowMoreButton.setAttribute('hidden', '');
        return;
      }

      const sectionLabel = activePublicationSectionLabel();
      pubShowMoreButton.textContent = `Show more (${totalItems} ${sectionLabel})`;
      pubShowMoreButton.removeAttribute('hidden');
    }

    function renderPublicationGrid() {
      const filtered = filteredPublicationEntries();
      if (filtered.length === 0) {
        pubGrid.innerHTML = '';
        if (pubShowMoreButton) {
          pubShowMoreButton.setAttribute('hidden', '');
        }
        return;
      }

      const visible = filtered.slice(0, visiblePubCount);
      pubGrid.innerHTML = visible.map(buildPublicationCard).join('');
      bindPublicationCardToggleActions();
      bindBibtexCopyActions();
      updateShowMoreButton(filtered.length);
    }

    function activatePublicationTabs() {
      pubTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          activePubFilter = tab.getAttribute('data-filter') || 'articles';
          pubTabs.forEach(item => item.classList.remove('active'));
          tab.classList.add('active');
          visiblePubCount = PUB_PAGE_SIZE;
          updatePublicationYearOptions(true);
          renderPublicationGrid();
        });
      });
    }

    function activatePublicationYearFilter() {
      if (!pubYearFilter) {
        return;
      }

      pubYearFilter.addEventListener('change', () => {
        activePubYear = pubYearFilter.value || 'all';
        visiblePubCount = PUB_PAGE_SIZE;
        renderPublicationGrid();
      });
    }

    function activatePublicationShowMore() {
      if (!pubShowMoreButton) {
        return;
      }

      pubShowMoreButton.addEventListener('click', () => {
        visiblePubCount = Math.max(PUB_PAGE_SIZE, filteredPublicationEntries().length);
        renderPublicationGrid();
      });
    }

    async function loadPublicationsFromBib() {
      try {
        const response = await fetch(PUB_BIB_SOURCE, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const bibText = await response.text();
        publicationEntries = parseBibTeX(bibText)
          .map(entry => ({
            ...entry,
            category: resolveCategory(entry.entryType, entry.fields),
            sortYear: Number.parseInt(entry.fields.year, 10) || 0
          }))
          .sort((a, b) => {
            if (b.sortYear !== a.sortYear) {
              return b.sortYear - a.sortYear;
            }
            return a.citationKey.localeCompare(b.citationKey);
          });

        renderHeroTicker(publicationEntries);
        updatePublicationYearOptions(true);
        renderPublicationGrid();
      } catch (error) {
        renderHeroTicker([]);
        const protocolHint = window.location.protocol === 'file:'
          ? ' Open this page through a local web server to allow loading external files.'
          : '';
        pubGrid.innerHTML = `<div class="pub-status">Could not load <code>${escapeHtml(PUB_BIB_SOURCE)}</code>.${protocolHint}</div>`;
        if (pubShowMoreButton) {
          pubShowMoreButton.setAttribute('hidden', '');
        }
        if (pubYearFilter) {
          pubYearFilter.disabled = true;
        }
      }
    }

    bindCommunityCopyActions();
    activatePublicationTabs();
    activatePublicationYearFilter();
    activatePublicationShowMore();
    loadPublicationsFromBib();

    function normalizeTeamPhotoPath(photo) {
      if (!photo) {
        return '';
      }
      if (/^https?:\/\//i.test(photo)) {
        return photo;
      }
      return photo.replace(/^\.\.\//, '');
    }

    function buildTeamAvatar(person, cardName) {
      const photo = normalizeTeamPhotoPath(person.photo || '');
      if (!photo) {
        return '<div class="team-avatar"></div>';
      }
      return `<div class="team-avatar"><img src="${escapeHtml(photo)}" alt="${escapeHtml(cardName)}"></div>`;
    }

    function buildTeamCard(config) {
      const person = teamData[config.id];
      if (!person) {
        return '';
      }

      const profileUrl = `team/member.html?id=${encodeURIComponent(config.id)}`;
      const cardName = config.cardName || person.name;
      const cardSubtitle = config.cardSubtitle || person.institution || '';
      const avatar = buildTeamAvatar(person, cardName);

      if (config.scopusUrl) {
        return `
          <div class="team-member team-member-clickable" data-profile-url="${escapeHtml(profileUrl)}" role="link" tabindex="0">
            ${avatar}
            <div class="team-info">
              <h4>${escapeHtml(cardName)}</h4>
              <p>${escapeHtml(cardSubtitle)}</p>
              <div class="team-member-meta">
                <a class="scopus-link" href="${escapeHtml(config.scopusUrl)}" target="_blank" rel="noopener noreferrer">
                  <span class="scopus-logo">S</span> Scopus
                </a>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <a class="team-member" href="${escapeHtml(profileUrl)}">
          ${avatar}
          <div class="team-info">
            <h4>${escapeHtml(cardName)}</h4>
            <p>${escapeHtml(cardSubtitle)}</p>
          </div>
        </a>
      `;
    }

    function renderTeamGroup(containerId, members) {
      const container = document.getElementById(containerId);
      if (!container) {
        return;
      }
      container.innerHTML = (members || [])
        .map(buildTeamCard)
        .filter(Boolean)
        .join('');
    }

    function renderTeamSection() {
      renderTeamGroup('teamCoreMembers', teamHome.core);
      renderTeamGroup('teamContributorMembers', teamHome.contributors);
      renderTeamGroup('teamAdvisoryMembers', teamHome.advisory);
    }

    function activateClickableTeamMembers() {
      document.querySelectorAll('.team-member-clickable').forEach(member => {
        const profileUrl = member.getAttribute('data-profile-url');
        if (!profileUrl) {
          return;
        }

        member.addEventListener('click', event => {
          if (event.target.closest('.scopus-link')) {
            return;
          }
          window.location.href = profileUrl;
        });

        member.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }
          if (event.target.closest('.scopus-link')) {
            return;
          }
          event.preventDefault();
          window.location.href = profileUrl;
        });
      });
    }

    renderTeamSection();
    activateClickableTeamMembers();

    function headerOffset() {
      const headerElement = document.querySelector('.header');
      return headerElement ? headerElement.offsetHeight + 20 : 100;
    }

    function scrollToSectionById(sectionId, updateHash = true) {
      if (!sectionId) {
        return;
      }

      const target = document.getElementById(sectionId);
      if (!target) {
        return;
      }

      const top = Math.max(0, target.offsetTop - headerOffset());
      window.scrollTo({ top, behavior: 'smooth' });

      if (updateHash) {
        history.pushState(null, '', `#${sectionId}`);
      }
    }

    // Smooth scroll only for in-page navigation links that target sections.
    const sectionAnchorLinks = document.querySelectorAll('.nav a[href^="#"], .mobile-nav-links a[href^="#"], .scroll-link[href^="#"]');
    sectionAnchorLinks.forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') {
          return;
        }

        const sectionId = href.slice(1);
        const target = document.getElementById(sectionId);
        if (!target) {
          return;
        }

        e.preventDefault();
        scrollToSectionById(sectionId);
      });
    });

    // Active section highlight for desktop and mobile navigation
    const navSectionLinks = Array.from(document.querySelectorAll('.nav a[href^="#"], .mobile-nav-links a[href^="#"]'));
    const navSections = navSectionLinks
      .map(link => {
        const href = link.getAttribute('href');
        const section = href && href !== '#' ? document.querySelector(href) : null;
        return section ? { id: section.id, element: section } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.element.offsetTop - b.element.offsetTop);

    const header = document.querySelector('.header');

    function setActiveSection(sectionId) {
      navSectionLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${sectionId}`;
        link.classList.toggle('active', isActive);
      });
    }

    function updateActiveSection(scrollY = window.scrollY) {
      const offset = headerOffset();
      let activeSection = 'home';

      navSections.forEach(section => {
        if (scrollY + offset >= section.element.offsetTop) {
          activeSection = section.id;
        }
      });

      setActiveSection(activeSection);
    }

    function updateHeaderState(scrollY = window.scrollY) {
      if (!header) {
        return;
      }

      header.classList.toggle('scrolled', scrollY > 50);
    }

    let scrollTicking = false;
    function syncScrollState() {
      const scrollY = window.scrollY;
      updateActiveSection(scrollY);
      updateHeaderState(scrollY);
      scrollTicking = false;
    }

    function handleScroll() {
      if (scrollTicking) {
        return;
      }

      scrollTicking = true;
      window.requestAnimationFrame(syncScrollState);
    }

    syncScrollState();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', syncScrollState);
    window.addEventListener('load', () => {
      if (window.location.hash) {
        const sectionId = window.location.hash.slice(1);
        const target = document.getElementById(sectionId);
        if (target) {
          window.setTimeout(() => {
            scrollToSectionById(sectionId, false);
            syncScrollState();
          }, 0);
        }
      }
    });

    // Newsletter subscription via Google Apps Script web app.
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmail = document.getElementById('newsletterEmail');
    const newsletterSubmit = document.getElementById('newsletterSubmit');
    const newsletterStatus = document.getElementById('newsletterStatus');
    const newsletterTarget = document.getElementById('newsletterTarget');
    let newsletterPending = false;
    let newsletterPendingEmail = '';
    let newsletterTimeoutId = null;
    let newsletterFallbackSuccessId = null;

    function setNewsletterStatus(message, tone = '') {
      if (!newsletterStatus) return;
      newsletterStatus.textContent = message;
      newsletterStatus.classList.remove('is-success', 'is-error');
      if (tone === 'success') {
        newsletterStatus.classList.add('is-success');
      } else if (tone === 'error') {
        newsletterStatus.classList.add('is-error');
      }
    }

    function resetNewsletterPendingState() {
      newsletterPending = false;
      newsletterPendingEmail = '';
      if (newsletterTimeoutId) {
        window.clearTimeout(newsletterTimeoutId);
        newsletterTimeoutId = null;
      }
      if (newsletterFallbackSuccessId) {
        window.clearTimeout(newsletterFallbackSuccessId);
        newsletterFallbackSuccessId = null;
      }
      if (newsletterSubmit) {
        newsletterSubmit.disabled = false;
      }
    }

    function newsletterAllowedOrigins(endpoint) {
      const origins = new Set([window.location.origin]);
      if (!endpoint) {
        return origins;
      }
      try {
        const endpointUrl = new URL(endpoint, window.location.href);
        origins.add(endpointUrl.origin);
      } catch (error) {
        // Ignore malformed endpoint here; submit validation handles missing endpoint.
      }
      origins.add('https://script.google.com');
      origins.add('https://script.googleusercontent.com');
      return origins;
    }

    function submitNewsletterEmail(event) {
      if (!newsletterForm || !newsletterEmail || !newsletterSubmit) return;

      const endpoint = (newsletterForm.dataset.endpoint || siteLinks.newsletterEndpoint || '').trim();
      const email = newsletterEmail.value.trim();
      const newsletterPage = document.getElementById('newsletterPage');
      const newsletterSubmittedAt = document.getElementById('newsletterSubmittedAt');

      if (!email) {
        event.preventDefault();
        setNewsletterStatus('Please enter an email address.', 'error');
        return;
      }

      if (!endpoint) {
        event.preventDefault();
        setNewsletterStatus('Newsletter endpoint not configured yet. Add the Google Apps Script web app URL first.', 'error');
        return;
      }

      newsletterForm.action = endpoint;
      if (newsletterPage) {
        newsletterPage.value = window.location.href;
      }
      if (newsletterSubmittedAt) {
        newsletterSubmittedAt.value = new Date().toISOString();
      }

      newsletterPending = true;
      newsletterPendingEmail = email;
      newsletterSubmit.disabled = true;
      setNewsletterStatus('Submitting...');
      newsletterTimeoutId = window.setTimeout(() => {
        if (!newsletterPending) {
          return;
        }
        resetNewsletterPendingState();
        setNewsletterStatus('Submission could not be confirmed. Please try again.', 'error');
      }, 15000);
    }

    if (newsletterForm) {
      newsletterForm.addEventListener('submit', submitNewsletterEmail);
    }

    if (newsletterTarget) {
      newsletterTarget.addEventListener('load', () => {
        if (!newsletterPending) {
          return;
        }

        // Some Apps Script deployments complete the POST in the iframe
        // without sending a postMessage confirmation back to the parent page.
        // In that case, the successful iframe load is the only reliable signal.
        newsletterFallbackSuccessId = window.setTimeout(() => {
          if (!newsletterPending) {
            return;
          }
          resetNewsletterPendingState();
          if (newsletterForm) {
            newsletterForm.reset();
          }
          setNewsletterStatus('Subscription sent successfully.', 'success');
        }, 500);
      });
    }

    window.addEventListener('message', event => {
      if (!newsletterPending || !newsletterForm || !newsletterTarget) {
        return;
      }

      const endpoint = (newsletterForm.dataset.endpoint || siteLinks.newsletterEndpoint || '').trim();
      const allowedOrigins = newsletterAllowedOrigins(endpoint);
      if (!allowedOrigins.has(event.origin)) {
        return;
      }

      const payload = event.data;
      if (!payload || payload.type !== 'newsletter-result') {
        return;
      }

      if (payload.email && newsletterPendingEmail && payload.email !== newsletterPendingEmail) {
        return;
      }

      resetNewsletterPendingState();

      if (payload.status === 'success') {
        newsletterForm.reset();
        setNewsletterStatus('Subscription sent successfully.', 'success');
        return;
      }

      setNewsletterStatus(payload.message || 'Submission failed. Please try again.', 'error');
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');

    // Open mobile menu with body scroll lock
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    // Close mobile menu with X button
    mobileCloseBtn.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });

    if (mobileThemeToggle) {
      mobileThemeToggle.disabled = !THEME_TOGGLE_ENABLED;
    }

    // Mobile theme toggle
    if (THEME_TOGGLE_ENABLED && mobileThemeToggle) {
      mobileThemeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.mobile-nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
