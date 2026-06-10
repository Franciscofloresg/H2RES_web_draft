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
    const H2RES_WEBSITE_CITATION_TEXT = 'Duic, N., et al. (2026). H2RES Web Platform. Retrieved May 25, 2026, from https://franciscofloresg.github.io/H2RES_web_draft/';
    const HERO_TICKER_FIXED_ITEMS = [
      {
        label: 'Summer School 2026',
        title: 'Energy Planning of 100% Renewable Energy Systems',
        url: 'https://www.sdewes.org/summerschool/2026/'
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

    function escapeHtml(text) {
      return String(text || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function normalizeBibValue(value) {
      return (value || '')
        .replace(/\r\n?/g, '\n')
        .replace(/\\&/g, '&')
        .replace(/\\%/g, '%')
        .replace(/\\_/g, '_')
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function findTopLevelComma(text) {
      let depth = 0;
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prev = i > 0 ? text[i - 1] : '';
        if (char === '"' && prev !== '\\') {
          inQuotes = !inQuotes;
          continue;
        }
        if (inQuotes) {
          continue;
        }
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth = Math.max(0, depth - 1);
        } else if (char === ',' && depth === 0) {
          return i;
        }
      }
      return -1;
    }

    function readBibValue(text, startIndex) {
      let index = startIndex;
      while (index < text.length && /\s/.test(text[index])) {
        index++;
      }

      const first = text[index];
      if (!first) {
        return { value: '', nextIndex: index };
      }

      if (first === '{') {
        let depth = 1;
        let i = index + 1;
        let inQuotes = false;
        while (i < text.length && depth > 0) {
          const char = text[i];
          const prev = i > 0 ? text[i - 1] : '';
          if (char === '"' && prev !== '\\') {
            inQuotes = !inQuotes;
          }
          if (!inQuotes) {
            if (char === '{') {
              depth++;
            } else if (char === '}') {
              depth--;
            }
          }
          i++;
        }
        return {
          value: text.slice(index + 1, Math.max(index + 1, i - 1)),
          nextIndex: i
        };
      }

      if (first === '"') {
        let i = index + 1;
        while (i < text.length) {
          if (text[i] === '"' && text[i - 1] !== '\\') {
            break;
          }
          i++;
        }
        return {
          value: text.slice(index + 1, i),
          nextIndex: Math.min(i + 1, text.length)
        };
      }

      let i = index;
      while (i < text.length && text[i] !== ',') {
        i++;
      }
      return {
        value: text.slice(index, i).trim(),
        nextIndex: i
      };
    }

    function parseBibFields(fieldsText) {
      const fields = {};
      let index = 0;

      while (index < fieldsText.length) {
        while (index < fieldsText.length && /[\s,]/.test(fieldsText[index])) {
          index++;
        }
        if (index >= fieldsText.length) {
          break;
        }

        const fieldStart = index;
        while (index < fieldsText.length && /[a-zA-Z0-9_-]/.test(fieldsText[index])) {
          index++;
        }
        const fieldName = fieldsText.slice(fieldStart, index).toLowerCase();
        while (index < fieldsText.length && /\s/.test(fieldsText[index])) {
          index++;
        }
        if (fieldsText[index] !== '=') {
          const nextComma = findTopLevelComma(fieldsText.slice(index));
          if (nextComma === -1) {
            break;
          }
          index += nextComma + 1;
          continue;
        }
        index++;

        const parsedValue = readBibValue(fieldsText, index);
        fields[fieldName] = normalizeBibValue(parsedValue.value);
        index = parsedValue.nextIndex;
      }

      return fields;
    }

    function parseBibTeX(text) {
      const cleanText = (text || '')
        .replace(/\r\n?/g, '\n')
        .replace(/^\s*%.*$/gm, '');

      const entries = [];
      let index = 0;

      while (index < cleanText.length) {
        const atIndex = cleanText.indexOf('@', index);
        if (atIndex === -1) {
          break;
        }

        const headerMatch = cleanText.slice(atIndex + 1).match(/^([A-Za-z]+)\s*([{(])/);
        if (!headerMatch) {
          index = atIndex + 1;
          continue;
        }

        const entryType = headerMatch[1].toLowerCase();
        const openChar = headerMatch[2];
        const closeChar = openChar === '{' ? '}' : ')';
        const openIndex = atIndex + 1 + headerMatch[0].length - 1;
        let i = openIndex + 1;
        let depth = 1;
        let inQuotes = false;

        while (i < cleanText.length && depth > 0) {
          const char = cleanText[i];
          const prev = i > 0 ? cleanText[i - 1] : '';
          if (char === '"' && prev !== '\\') {
            inQuotes = !inQuotes;
          } else if (!inQuotes) {
            if (char === openChar) {
              depth++;
            } else if (char === closeChar) {
              depth--;
            }
          }
          i++;
        }

        if (depth !== 0) {
          break;
        }

        const rawBody = cleanText.slice(openIndex + 1, i - 1).trim();
        const commaIndex = findTopLevelComma(rawBody);
        if (commaIndex === -1) {
          index = i;
          continue;
        }

        const citationKey = rawBody.slice(0, commaIndex).trim();
        const fieldsText = rawBody.slice(commaIndex + 1).trim();
        const fields = parseBibFields(fieldsText);

        entries.push({
          entryType,
          citationKey,
          fields,
          bibtex: cleanText.slice(atIndex, i).trim()
        });

        index = i;
      }

      return entries;
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
        const yearHint = activePubYear === 'all' ? '' : ` for year <code>${escapeHtml(activePubYear)}</code>`;
        pubGrid.innerHTML = `<div class="pub-status">No records found for this category${yearHint} in <code>h2res_research_outputs.bib</code>.</div>`;
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

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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

    function setActiveSection(sectionId) {
      navSectionLinks.forEach(link => {
        const isActive = link.getAttribute('href') === `#${sectionId}`;
        link.classList.toggle('active', isActive);
      });
    }

    function updateActiveSection() {
      const offset = headerOffset();
      let activeSection = 'home';

      navSections.forEach(section => {
        if (window.scrollY + offset >= section.element.offsetTop) {
          activeSection = section.id;
        }
      });

      setActiveSection(activeSection);
    }

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('hashchange', updateActiveSection);
    window.addEventListener('load', () => {
      if (window.location.hash) {
        const sectionId = window.location.hash.slice(1);
        const target = document.getElementById(sectionId);
        if (target) {
          window.setTimeout(() => {
            scrollToSectionById(sectionId, false);
            updateActiveSection();
          }, 0);
        }
      }
    });

    // Header scroll effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
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
