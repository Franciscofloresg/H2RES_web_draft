(function () {
  // Builds citation strings (RIS / APA / IEEE) from a parsed BibTeX entry.
  // It only reformats fields already present in the entry; missing fields are
  // omitted rather than invented.
  const normalize = (window.H2resBibUtils && window.H2resBibUtils.normalizeBibValue)
    ? window.H2resBibUtils.normalizeBibValue
    : (value) => String(value || "").replace(/[{}]/g, "").replace(/\s+/g, " ").trim();

  function field(entry, name) {
    return normalize((entry.fields && entry.fields[name]) || "");
  }

  function cleanDoi(entry) {
    return field(entry, "doi").replace(/^doi:\s*/i, "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
  }

  function doiUrl(entry) {
    const doi = cleanDoi(entry);
    return doi ? `https://doi.org/${doi}` : "";
  }

  // Parse one author token into { family, given } regardless of "Last, First"
  // or "First Last" ordering.
  function parseAuthor(token) {
    const name = normalize(token);
    if (!name) return null;
    if (name.includes(",")) {
      const parts = name.split(",");
      return { family: parts[0].trim(), given: parts.slice(1).join(" ").trim() };
    }
    const words = name.split(/\s+/);
    if (words.length === 1) return { family: words[0], given: "" };
    return { family: words[words.length - 1], given: words.slice(0, -1).join(" ") };
  }

  function authorList(entry) {
    return field(entry, "author")
      .split(/\s+and\s+/i)
      .map(parseAuthor)
      .filter(Boolean);
  }

  function initials(given) {
    return given
      .split(/[\s.-]+/)
      .filter(Boolean)
      .map((part) => `${part[0].toUpperCase()}.`)
      .join(" ");
  }

  // APA 7: "Family, G. M."
  function apaName(author) {
    const ini = initials(author.given);
    return ini ? `${author.family}, ${ini}` : author.family;
  }

  function apaAuthors(authors) {
    if (authors.length === 0) return "";
    const names = authors.map(apaName);
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
  }

  // IEEE: "G. M. Family"
  function ieeeName(author) {
    const ini = initials(author.given);
    return ini ? `${ini} ${author.family}` : author.family;
  }

  function ieeeAuthors(authors) {
    if (authors.length === 0) return "";
    const names = authors.map(ieeeName);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }

  function pages(entry) {
    return field(entry, "pages").replace(/\s*[-–—]+\s*/g, "–");
  }

  function splitPages(entry) {
    const p = field(entry, "pages");
    const m = p.split(/\s*[-–—]+\s*/);
    return { sp: (m[0] || "").trim(), ep: (m[1] || "").trim() };
  }

  function source(entry) {
    return field(entry, "journal") || field(entry, "booktitle") || field(entry, "publisher")
      || field(entry, "school") || field(entry, "institution");
  }

  function toAPA(entry) {
    const type = (entry.entryType || "").toLowerCase();
    const authors = apaAuthors(authorList(entry));
    const year = field(entry, "year") || "n.d.";
    const title = field(entry, "title");
    const doi = doiUrl(entry);
    const url = field(entry, "url");
    const tail = doi || url;
    const lead = `${authors}${authors ? " " : ""}(${year}). ${title}.`;

    if (type === "article") {
      const journal = field(entry, "journal");
      const vol = field(entry, "volume");
      const iss = field(entry, "number");
      const pg = pages(entry);
      let loc = journal;
      if (vol) loc += `, ${vol}`;
      if (iss) loc += `(${iss})`;
      if (pg) loc += `, ${pg}`;
      return `${lead} ${loc}.${tail ? ` ${tail}` : ""}`.replace(/\s+/g, " ").trim();
    }
    if (type === "inproceedings" || type === "conference") {
      const book = field(entry, "booktitle");
      const pg = pages(entry);
      return `${lead} In ${book}${pg ? ` (pp. ${pg})` : ""}.${tail ? ` ${tail}` : ""}`.replace(/\s+/g, " ").trim();
    }
    const src = source(entry);
    return `${lead}${src ? ` ${src}.` : ""}${tail ? ` ${tail}` : ""}`.replace(/\s+/g, " ").trim();
  }

  function toIEEE(entry) {
    const type = (entry.entryType || "").toLowerCase();
    const authors = ieeeAuthors(authorList(entry));
    const year = field(entry, "year");
    const title = field(entry, "title");
    const doi = cleanDoi(entry);
    const lead = authors ? `${authors}, "${title},"` : `"${title},"`;

    if (type === "article") {
      const journal = field(entry, "journal");
      const vol = field(entry, "volume");
      const iss = field(entry, "number");
      const pg = pages(entry);
      const seg = [journal];
      if (vol) seg.push(`vol. ${vol}`);
      if (iss) seg.push(`no. ${iss}`);
      if (pg) seg.push(`pp. ${pg}`);
      if (year) seg.push(year);
      let out = `${lead} ${seg.filter(Boolean).join(", ")}`;
      if (doi) out += `, doi: ${doi}`;
      return `${out}.`.replace(/\s+/g, " ").trim();
    }
    if (type === "inproceedings" || type === "conference") {
      const book = field(entry, "booktitle");
      const pg = pages(entry);
      const seg = [`in ${book}`];
      if (year) seg.push(year);
      if (pg) seg.push(`pp. ${pg}`);
      let out = `${lead} ${seg.filter(Boolean).join(", ")}`;
      if (doi) out += `, doi: ${doi}`;
      return `${out}.`.replace(/\s+/g, " ").trim();
    }
    const src = source(entry);
    const seg = [src, year].filter(Boolean);
    let out = `${lead}${seg.length ? ` ${seg.join(", ")}` : ""}`;
    if (doi) out += `, doi: ${doi}`;
    return `${out}.`.replace(/\s+/g, " ").trim();
  }

  const RIS_TYPE = {
    article: "JOUR",
    inproceedings: "CPAPER",
    conference: "CPAPER",
    proceedings: "CONF",
    techreport: "RPRT",
    report: "RPRT",
    manual: "RPRT",
    book: "BOOK",
    inbook: "CHAP",
    incollection: "CHAP",
    phdthesis: "THES",
    mastersthesis: "THES",
    thesis: "THES",
    dataset: "DATA",
    data: "DATA",
    software: "COMP",
    misc: "GEN"
  };

  function toRIS(entry) {
    const type = (entry.entryType || "").toLowerCase();
    const lines = [`TY  - ${RIS_TYPE[type] || "GEN"}`];
    authorList(entry).forEach((a) => {
      lines.push(`AU  - ${a.given ? `${a.family}, ${a.given}` : a.family}`);
    });
    const title = field(entry, "title");
    if (title) lines.push(`TI  - ${title}`);
    const journal = field(entry, "journal");
    const book = field(entry, "booktitle");
    if (journal) lines.push(`JO  - ${journal}`);
    if (book) lines.push(`T2  - ${book}`);
    const vol = field(entry, "volume");
    if (vol) lines.push(`VL  - ${vol}`);
    const iss = field(entry, "number");
    if (iss) lines.push(`IS  - ${iss}`);
    const { sp, ep } = splitPages(entry);
    if (sp) lines.push(`SP  - ${sp}`);
    if (ep) lines.push(`EP  - ${ep}`);
    const year = field(entry, "year");
    if (year) lines.push(`PY  - ${year}`);
    const publisher = field(entry, "publisher");
    if (publisher) lines.push(`PB  - ${publisher}`);
    const doi = cleanDoi(entry);
    if (doi) lines.push(`DO  - ${doi}`);
    const url = field(entry, "url") || doiUrl(entry);
    if (url) lines.push(`UR  - ${url}`);
    const abstractText = field(entry, "abstract");
    if (abstractText) lines.push(`AB  - ${abstractText}`);
    field(entry, "keywords")
      .split(/[;,]/)
      .map((k) => k.trim())
      .filter(Boolean)
      .forEach((k) => lines.push(`KW  - ${k}`));
    lines.push("ER  - ");
    return lines.join("\n");
  }

  function toBibTeX(entry) {
    return entry.bibtex || "";
  }

  window.H2resCite = {
    formats: ["bibtex", "ris", "apa", "ieee"],
    labels: { bibtex: "BibTeX", ris: "RIS", apa: "APA", ieee: "IEEE" },
    build(fmt, entry) {
      switch (fmt) {
        case "ris": return toRIS(entry);
        case "apa": return toAPA(entry);
        case "ieee": return toIEEE(entry);
        default: return toBibTeX(entry);
      }
    }
  };
})();
