(function () {
  function normalizeBibValue(value) {
    return (value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/\\&/g, "&")
      .replace(/\\%/g, "%")
      .replace(/\\_/g, "_")
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findTopLevelComma(text) {
    let depth = 0;
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const prev = i > 0 ? text[i - 1] : "";

      if (char === '"' && prev !== "\\") {
        inQuotes = !inQuotes;
        continue;
      }

      if (inQuotes) {
        continue;
      }

      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth = Math.max(0, depth - 1);
      } else if (char === "," && depth === 0) {
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
      return { value: "", nextIndex: index };
    }

    if (first === "{") {
      let depth = 1;
      let i = index + 1;
      let inQuotes = false;

      while (i < text.length && depth > 0) {
        const char = text[i];
        const prev = i > 0 ? text[i - 1] : "";

        if (char === '"' && prev !== "\\") {
          inQuotes = !inQuotes;
        }

        if (!inQuotes) {
          if (char === "{") {
            depth++;
          } else if (char === "}") {
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
        if (text[i] === '"' && text[i - 1] !== "\\") {
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
    while (i < text.length && text[i] !== ",") {
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

      if (fieldsText[index] !== "=") {
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
    const cleanText = (text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/^\s*%.*$/gm, "");

    const entries = [];
    let index = 0;

    while (index < cleanText.length) {
      const atIndex = cleanText.indexOf("@", index);
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
      const closeChar = openChar === "{" ? "}" : ")";
      const openIndex = atIndex + 1 + headerMatch[0].length - 1;
      let i = openIndex + 1;
      let depth = 1;
      let inQuotes = false;

      while (i < cleanText.length && depth > 0) {
        const char = cleanText[i];
        const prev = i > 0 ? cleanText[i - 1] : "";

        if (char === '"' && prev !== "\\") {
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

  window.H2resBibUtils = {
    normalizeBibValue,
    parseBibTeX
  };
})();
