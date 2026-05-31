(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   *  thomistica-nav.js
   *  Drop one copy of this file at the root of books.thomistica.net,
   *  then add  <script src="/thomistica-nav.js"></script>
   *  to every HTML page (see inject-nav.py for the batch tool).
   *
   *  What it does:
   *   1. Injects a top header bar (branding + breadcrumb + back-link)
   *   2. Injects a bottom footer bar
   *   3. Styles both bars + improves body typography
   *   4. Reads the page <title> to build the breadcrumb automatically
   * ------------------------------------------------------------------ */

  /* ---------- helpers ---------- */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "className") node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else if (c) node.appendChild(c);
    });
    return node;
  }

  /* ---------- breadcrumb logic ----------
   *
   *  Title conventions found in the collection:
   *   "St. Thomas Aquinas / by Placid Conway, OP"          → TOC page
   *   "St. Thomas Aquinas / by Placid Conway, OP \n1"      → chapter page
   *   "History of Medieval Philosophy"                      → title-only TOC
   *   "Jacques Maritain Center: Revival 1"                  → Maritain-origin chapter
   *
   *  Strategy: strip noise, derive a short book title and (if present)
   *  a chapter/section label.
   */

  function parseTitleParts(raw) {
    var title = raw.replace(/\s+/g, " ").trim();

    // Remove "Jacques Maritain Center: " prefix if present
    title = title.replace(/^Jacques Maritain Center:\s*/i, "");

    // Split on " / " — left side = book name, right = author noise
    var slashParts = title.split(/\s*\/\s*/);
    var bookTitle = slashParts[0].trim();

    // Trailing digits or short codes like "000", "1", "2" indicate a chapter
    var chapterMatch = bookTitle.match(/\s+(\d{1,4})\s*$/);
    var chapterLabel = null;
    if (chapterMatch) {
      var num = parseInt(chapterMatch[1], 10);
      chapterLabel = "Chapter\u00a0" + num; // non-breaking space
      bookTitle = bookTitle.replace(/\s+\d{1,4}\s*$/, "").trim();
    }

    // Trim to a reasonable display length
    if (bookTitle.length > 60) {
      bookTitle = bookTitle.substring(0, 57) + "\u2026";
    }

    return { bookTitle: bookTitle, chapterLabel: chapterLabel };
  }

  /* ---------- find the book's TOC href ----------
   *
   *  The first <a> on chapter pages typically points back to the TOC.
   *  We use it for the breadcrumb link.
   */
  function findTocHref() {
    var links = document.querySelectorAll("body a");
    for (var i = 0; i < Math.min(links.length, 5); i++) {
      var href = links[i].getAttribute("href") || "";
      // TOC pages typically have short filenames without digits in the stem,
      // or end in index patterns. Heuristic: first link whose text looks like
      // a book title (longer than 15 chars) or whose href lacks a number suffix.
      if (href && href.match(/\.html?$/i) && !href.match(/\d{2,}\.html?$/i)) {
        return href;
      }
    }
    return null;
  }

  /* ---------- CSS ---------- */

  var CSS = [
    /* ---- reset interference with existing page layout ---- */
    "#thn-header *, #thn-footer * { box-sizing: border-box; margin: 0; padding: 0; }",

    /* ---- body nudge: push content below fixed header ---- */
    "body { margin-top: 56px !important; }",

    /* ---- header ---- */
    "#thn-header {",
    "  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;",
    "  height: 56px;",
    "  background: #495A58;",
    "  border-bottom: 2px solid #8b7040;",
    "  display: flex; align-items: center;",
    "  font-family: 'Georgia', 'Times New Roman', serif;",
    "  padding: 0 20px;",
    "  gap: 0;",
    "}",

    /* wordmark */
    "#thn-wordmark {",
    "  text-decoration: none;",
    "  color: #e8dfc8;",
    "  font-size: 18px;",
    "  font-weight: normal;",
    "  letter-spacing: 0.04em;",
    "  white-space: nowrap;",
    "  flex-shrink: 0;",
    "}",
    "#thn-wordmark span.thn-dot { color: #8b7040; }",

    /* separator pipe */
    "#thn-sep {",
    "  color: #555;",
    "  margin: 0 14px;",
    "  font-size: 18px;",
    "  flex-shrink: 0;",
    "}",

    /* breadcrumb area */
    "#thn-breadcrumb {",
    "  display: flex; align-items: center; gap: 6px;",
    "  font-size: 12.5px;",
    "  color: #999;",
    "  overflow: hidden;",
    "  white-space: nowrap;",
    "  min-width: 0;",
    "}",
    "#thn-breadcrumb a {",
    "  color: #b8a878;",
    "  text-decoration: none;",
    "}",
    "#thn-breadcrumb a:hover { color: #e8dfc8; text-decoration: underline; }",
    "#thn-breadcrumb .thn-crumb-sep { color: #555; flex-shrink: 0; }",
    "#thn-breadcrumb .thn-crumb-current {",
    "  color: #ccc;",
    "  overflow: hidden;",
    "  text-overflow: ellipsis;",
    "}",

    /* right-side back link */
    "#thn-back {",
    "  margin-left: auto;",
    "  flex-shrink: 0;",
    "  font-size: 12px;",
    "  color: #777;",
    "  text-decoration: none;",
    "  padding-left: 20px;",
    "  white-space: nowrap;",
    "}",
    "#thn-back:hover { color: #b8a878; }",

    /* ---- footer ---- */
    "#thn-footer {",
    "  margin-top: 48px;",
    "  padding: 20px 24px;",
    "  border-top: 1px solid #d0c8b0;",
    "  font-family: 'Georgia', 'Times New Roman', serif;",
    "  font-size: 12.5px;",
    "  color: #888;",
    "  text-align: center;",
    "  background: #faf8f3;",
    "}",
    "#thn-footer a { color: #7a6535; text-decoration: none; }",
    "#thn-footer a:hover { text-decoration: underline; }",
    "#thn-footer .thn-footer-sep { margin: 0 10px; color: #ccc; }",

    /* ---- body typography improvements (light touch) ---- */
    "body {",
    "  font-family: 'Georgia', 'Times New Roman', serif;",
    "  line-height: 1.7;",
    "  color: #222;",
    "  background: #faf8f3;",
    "  max-width: 780px;",
    "  margin-left: auto !important;",
    "  margin-right: auto !important;",
    "  padding: 0 24px 48px;",
    "}",

    /* Keep existing nav links (`<< >>` etc.) readable */
    "body > p > b > a, body > center > b > a, body > p > a {",
    "  color: #7a6535;",
    "}",
  ].join("\n");

  /* ---------- inject stylesheet ---------- */

  function injectStyles() {
    var style = document.createElement("style");
    style.id = "thn-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ---------- build header ---------- */

  function buildHeader(parts) {
    var header = el("div", { id: "thn-header" });

    // Wordmark — links to main site
    var wordmark = el("a", {
      id: "thn-wordmark",
      href: "https://thomistica.net",
      title: "Thomistica — home",
    });
    wordmark.innerHTML =
      "Thomistica";
    header.appendChild(wordmark);

    // Separator
    header.appendChild(el("span", { id: "thn-sep" }, ["|"]));

    // Breadcrumb
    var bc = el("div", { id: "thn-breadcrumb" });

    // "Leonine Revival Books" — links to book index
    var libLink = el("a", { href: "https://books.thomistica.net/" }, [
      "Leonine Revival Books",
    ]);
    bc.appendChild(libLink);

    // If we have a book title, add it
    if (parts.bookTitle) {
      bc.appendChild(
        el("span", { className: "thn-crumb-sep" }, ["\u203a"])
      );

      if (parts.chapterLabel) {
        // We're on a chapter page; link the book title to its TOC
        var tocHref = findTocHref();
        if (tocHref) {
          bc.appendChild(
            el("a", { href: tocHref }, [parts.bookTitle])
          );
        } else {
          bc.appendChild(
            el("span", { className: "thn-crumb-current" }, [parts.bookTitle])
          );
        }
        bc.appendChild(
          el("span", { className: "thn-crumb-sep" }, ["\u203a"])
        );
        bc.appendChild(
          el("span", { className: "thn-crumb-current" }, [parts.chapterLabel])
        );
      } else {
        // We're on a TOC page; book title is the terminal crumb
        bc.appendChild(
          el("span", { className: "thn-crumb-current" }, [parts.bookTitle])
        );
      }
    }

    header.appendChild(bc);

    // Right-side "← Thomistica" link
    var backLink = el("a", {
      id: "thn-back",
      href: "https://thomistica.net",
    }, ["\u2190\u00a0thomistica.net"]);
    header.appendChild(backLink);

    return header;
  }

  /* ---------- build footer ---------- */

  function buildFooter() {
    var footer = el("div", { id: "thn-footer" });
    var line = el("p", {});
    line.innerHTML =
      "Part of\u00a0" +
      "<a href='https://thomistica.net'>Thomistica.net</a>" +
      "<span class='thn-footer-sep'>&middot;</span>" +
      "<a href='https://books.thomistica.net'>Leonine Revival Books</a>" +
      "<span class='thn-footer-sep'>&middot;</span>" +
      "Under the direction of the " +
      "<a href='https://www.sacradoctrinaproject.org/'>Sacra Doctrina Project</a>";
    footer.appendChild(line);
    return footer;
  }

  /* ---------- main ---------- */

  function init() {
    var rawTitle = document.title || "";
    var parts = parseTitleParts(rawTitle);

    injectStyles();

    // Insert header at very top of <body>
    var header = buildHeader(parts);
    document.body.insertBefore(header, document.body.firstChild);

    // Append footer at bottom of <body>
    document.body.appendChild(buildFooter());
  }

  // Run after DOM is ready
  if (
    document.readyState === "loading" ||
    document.readyState === "uninitialized"
  ) {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
