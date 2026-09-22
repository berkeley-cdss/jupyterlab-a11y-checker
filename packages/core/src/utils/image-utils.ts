/**
 * Shared image-finding utilities used by image and color detection.
 */

/**
 * Find all <img ...> tags using indexOf-based scanning (no ReDoS).
 */
export function findImgTags(
  html: string,
): Array<{ tag: string; start: number; end: number }> {
  const results: Array<{ tag: string; start: number; end: number }> = [];
  const lower = html.toLowerCase();
  let searchFrom = 0;
  while (searchFrom < lower.length) {
    const idx = lower.indexOf("<img", searchFrom);
    if (idx === -1) {
      break;
    }
    // Ensure it's actually an <img tag (next char must be space, >, /)
    const charAfter = lower[idx + 4];
    if (
      charAfter !== undefined &&
      charAfter !== ">" &&
      charAfter !== " " &&
      charAfter !== "\t" &&
      charAfter !== "\n" &&
      charAfter !== "\r" &&
      charAfter !== "/"
    ) {
      searchFrom = idx + 1;
      continue;
    }
    const closeIdx = html.indexOf(">", idx + 4);
    if (closeIdx === -1) {
      break;
    }
    const end = closeIdx + 1;
    results.push({ tag: html.slice(idx, end), start: idx, end });
    searchFrom = end;
  }
  return results;
}

/**
 * Find all markdown images ![...](...) using indexOf scanning (no ReDoS).
 */
export function findMarkdownImages(
  text: string,
): Array<{ match: string; start: number; end: number }> {
  const results: Array<{ match: string; start: number; end: number }> = [];
  let searchFrom = 0;
  while (searchFrom < text.length) {
    const bangIdx = text.indexOf("![", searchFrom);
    if (bangIdx === -1) {
      break;
    }
    const bracketClose = text.indexOf("](", bangIdx + 2);
    if (bracketClose === -1) {
      searchFrom = bangIdx + 1;
      continue;
    }
    const parenClose = text.indexOf(")", bracketClose + 2);
    if (parenClose === -1) {
      searchFrom = bracketClose + 1;
      continue;
    }
    const end = parenClose + 1;
    results.push({ match: text.slice(bangIdx, end), start: bangIdx, end });
    searchFrom = end;
  }
  return results;
}

/**
 * Extract image URL from a matched image string (markdown or HTML).
 */
export function extractImageUrl(imageStr: string): string | null {
  // Markdown: ![...](url)
  const parenOpen = imageStr.indexOf("(");
  if (parenOpen !== -1) {
    const parenClose = imageStr.indexOf(")", parenOpen + 1);
    if (parenClose !== -1) {
      return imageStr.slice(parenOpen + 1, parenClose).trim();
    }
  }
  // HTML: src="url" or src='url'
  const lower = imageStr.toLowerCase();
  const srcIdx = lower.indexOf("src=");
  if (srcIdx !== -1) {
    const quote = imageStr[srcIdx + 4];
    if (quote === '"' || quote === "'") {
      const closeQuote = imageStr.indexOf(quote, srcIdx + 5);
      if (closeQuote !== -1) {
        return imageStr.slice(srcIdx + 5, closeQuote);
      }
    }
  }
  return null;
}

/**
 * Resolve the directory that a notebook's relative image paths are relative to.
 *
 * Callers hand us the notebook's own path (e.g. JupyterLab's
 * `NotebookPanel.context.path`), which points at the `.ipynb` file, not the
 * folder holding it. Interpolating that directly produced URLs like
 * `files/PS0/intro.ipynb/diagram.png`, which always 404.
 *
 * Returns "" for a notebook at the root, so callers join to `files/diagram.png`
 * rather than `files//diagram.png`.
 */
export function getNotebookDirectory(notebookPath: string): string {
  if (!notebookPath) {
    return "";
  }
  const lastSlash = notebookPath.lastIndexOf("/");
  return lastSlash === -1 ? "" : notebookPath.slice(0, lastSlash);
}

/**
 * Join a notebook-relative directory and an image path without producing an
 * empty segment when the directory is "" (notebook at the root).
 */
export function joinNotebookPath(
  directory: string,
  imagePath: string,
): string {
  return directory ? `${directory}/${imagePath}` : imagePath;
}
