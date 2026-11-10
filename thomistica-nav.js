(function () {
  "use strict";

  /* ======================================================================
   *  thomistica-nav.js  (v2)
   *
   *  Lives at the root of books.thomistica.net and is loaded by one
   *  <script src="/thomistica-nav.js"></script> line per HTML page.
   *
   *  What it does on each page:
   *   1. Works out the book title, the book's title page, and the page's
   *      file number (from the <title> tag and the link at the top).
   *   2. Builds a header breadcrumb:  Thomistica | Library > Book > Chapter N
   *   3. Hides the old "Title / by Author" link and rule at the top
   *      (the breadcrumb replaces them).
   *   4. Replaces the ASCII  << ======= >>  navigation with styled links.
   *   5. Adds a footer.
   *
   *  Edit the two blocks below (SETTINGS and WORKS) to tune behavior.
   *  Everything under "ENGINE" normally needs no changes.
   * ====================================================================== */


  /* ======================================================================
   *  1. SETTINGS  (apply to the whole collection)
   * ====================================================================== */

  var SETTINGS = {
    // Label used for the numbered files when a work has no setting of its own.
    defaultUnit: "Chapter",

    // Label shown for file number 0 (usually contents / front matter).
    zeroLabel: "Contents",

    // Hide the old "Title / by Author" link and the <hr> after it,
    // since the breadcrumb now does that job. Set to false to keep them.
    hideTitleLink: true,

    // Replace  << ======= >>  with Previous / Title page / Next links.
    upgradeBottomNav: true,

    libraryName: "Leonine Revival Books",
    libraryUrl: "https://books.thomistica.net/",
    siteUrl: "https://thomistica.net"
  };


  /* ======================================================================
   *  2. WORKS  (per-work exceptions; works not listed here are automatic)
   *
   *  Key: the path of the work's title page, relative to the site root,
   *       e.g. "DeWulf/homp.htm".  A directory key such as "DeWulf/" also
   *       works and covers every page in that folder.
   *
   *  Options (all optional):
   *    unit      "Lecture", "Article", ...   Label for the numbered files.
   *              Use false for no numbered crumb at all.
   *    units     ["Book", "Chapter"]         For titles with multi-level
   *                                          numbers like "GC 1.11":
   *                                          Book 1 > Chapter 11.
   *    numerals  "roman"                     Show II instead of 2. Or a list
   *                                          per level: ["roman", "arabic"].
   *    offset    -1, 1, ...                  Added to the file number before
   *                                          display (if file 2 is really
   *                                          Chapter 1, use offset: -1).
   *    zero      "Preface" / false           Label for file 000, or false
   *                                          to show nothing for it.
   *    title     "Short Title"               Override the book title shown
   *                                          in the breadcrumb.
   *    divisions [ {from: N, label: "..."} ] Named groups of files, by the
   *                                          file number each one starts at.
   *                                          Adds a middle crumb, e.g.
   *                                          Book > Chapter I > Article 3.
   * ====================================================================== */

  var WORKS = {

    // Key can be just the file name ("gc.htm") or the full path
    // ("GC/gc.htm") if two works share a file name.
    "gc.htm": {
      units: ["Book", "Chapter"]
    },

    "DeWulf/homp.htm": {
      unit: "Article"
      // Add divisions once you have the ranges, for example:
      // , divisions: [
      //   { from: 1,  label: "Introduction" },
      //   { from: 3,  label: "Chapter I" },
      //   { from: 12, label: "Chapter II" }
      // ]
    }

    // Other examples:
    // , "SomeLectures/lect.htm": { unit: "Lecture", numerals: "roman" }
    // , "Another/another.htm":   { unit: "Chapter", offset: -1 }
    // , "OneFolder/":            { unit: false }
  };


  /* ======================================================================
   *  ENGINE
   * ====================================================================== */

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

  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  var NAV_SYMBOLS = /^[<>=\s]+$/;

  function toRoman(n) {
    var map = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
               [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
               [5, "V"], [4, "IV"], [1, "I"]];
    var out = "";
    map.forEach(function (p) {
      while (n >= p[0]) { out += p[1]; n -= p[0]; }
    });
    return out;
  }

  // Site-relative path of an href, without leading slash: "DeWulf/homp.htm"
  function pathOf(href) {
    try {
      return decodeURIComponent(new URL(href, location.href).pathname)
        .replace(/^\//, "");
    } catch (e) {
      return "";
    }
  }

  function dirOf(path) {
    return path.replace(/[^\/]*$/, "");
  }

  /* ---------- 1. read the page's <title> ----------
   *
   *  Examples:
   *    "Aristotle and the Christian Church / by Brother Azarias 1"
   *    "History of Medieval Philosophy 003"        (newlines collapsed)
   *    "Jacques Maritain Center: Revival 1"
   *    "History of Medieval Philosophy"            (title page: no number)
   *
   *  The file number is a trailing 1-3 digit number anywhere at the END of
   *  the whole title (it may come after the author, as in the Azarias case).
   */
  function parsePageTitle() {
    var t = norm(document.title)
      .replace(/^Jacques Maritain Center:\s*/i, "");

    // Trailing number, possibly multi-level: "1", "003", "1.11", "3.2.5"
    var nums = null;
    var m = t.match(/^(.*?)\s+(\d{1,3}(?:\.\d{1,3})*)$/);
    if (m) {
      nums = m[2].split(".").map(function (x) { return parseInt(x, 10); });
      t = m[1];
    }

    var parts = t.split(/\s+\/\s+/);
    return {
      book: parts[0],
      author: (parts[1] || "").replace(/^by\s+/i, ""),
      nums: nums                       // null, or e.g. [3] or [1, 11]
    };
  }

  /* ---------- 2. find the link at the top of the page ----------
   *
   *  Chapter pages start with  <a href="title-page.htm">Title / by Author</a><hr>
   *  The title page itself starts with a link around the title that points
   *  to the FIRST page, so it must not be mistaken for a link back.
   *  A link counts as "back to the title page" when the page has a file
   *  number, or when the link text has the "Title / by Author" shape.
   */
  function findTitleLink(info) {
    var anchors = document.body.querySelectorAll("a[href]");
    for (var i = 0; i < Math.min(anchors.length, 3); i++) {
      var text = norm(anchors[i].textContent);
      if (!text || NAV_SYMBOLS.test(text)) continue;
      if (info.nums !== null || text.indexOf(" / ") !== -1) return anchors[i];
    }
    return null;
  }

  /* ---------- 3. put it all together ---------- */

  function analyse() {
    var info = parsePageTitle();
    var link = findTitleLink(info);
    var currentPath = pathOf(location.href);

    var onTitlePage = (info.nums === null && !link);

    var book = info.book;
    var author = info.author;
    if (link) {
      var lp = norm(link.textContent).split(/\s+\/\s+/);
      if (lp[0]) book = lp[0];
      if (lp[1]) author = lp[1].replace(/^by\s+/i, "");
    }

    var tocPath = link ? pathOf(link.getAttribute("href"))
                       : (onTitlePage ? currentPath : "");
    var tocHref = link ? link.getAttribute("href")
                       : (onTitlePage ? null : null);

    // Settings lookup: exact title-page path, then its folder, then bare
    // file name (so "gc.htm" works without knowing the folder).
    var cfg = WORKS[tocPath] ||
              WORKS[dirOf(tocPath || currentPath)] ||
              WORKS[(tocPath || currentPath).split("/").pop()] ||
              {};

    function fmt(n, level) {
      var style = Array.isArray(cfg.numerals) ? cfg.numerals[level] : cfg.numerals;
      return style === "roman" ? toRoman(n) : String(n);
    }

    // Crumbs after the book title
    var crumbs = [];
    var nums = info.nums;
    if (nums) {
      if (cfg.units) {
        // Multi-level: units ["Book", "Chapter"] + title "GC 1.11"
        //   -> Book 1 > Chapter 11   (and "GC 1" -> Book 1)
        nums.forEach(function (n, i) {
          crumbs.push((cfg.units[i] || "Section") + " " + fmt(n, i));
        });
      } else if (nums.length > 1) {
        // Multi-level number but no settings for this work
        crumbs.push("Section " + nums.join("."));
      } else {
        var num = nums[0];
        var div = null;
        (cfg.divisions || []).forEach(function (d) {
          if (d.from <= num && (!div || d.from >= div.from)) div = d;
        });
        if (div) crumbs.push(div.label);

        if (num === 0) {
          if (!div && cfg.zero !== false) {
            crumbs.push(cfg.zero || SETTINGS.zeroLabel);
          }
        } else {
          var unit = (cfg.unit === undefined) ? SETTINGS.defaultUnit : cfg.unit;
          var n1 = num + (cfg.offset || 0);
          if (unit && n1 >= 1) {
            crumbs.push(unit + " " + fmt(n1, 0));
          }
        }
      }
    }

    return {
      bookTitle: cfg.title || book,
      author: author,
      crumbs: crumbs,
      titleLink: link,
      tocHref: tocHref,
      tocPath: tocPath,
      onTitlePage: onTitlePage
    };
  }

  /* ---------- 4. hide the old top link + rule ---------- */

  function hideTitleLink(ctx) {
    var a = ctx.titleLink;
    if (!a || ctx.onTitlePage) return;
    if (a.parentNode !== document.body) return; // unusual layout: leave alone
    a.style.display = "none";
    var next = a.nextElementSibling;
    if (next && next.tagName === "HR") next.style.display = "none";
  }

  /* ---------- 5. replace  << ======= >>  with a pager ----------
   *
   *  For each "<<" / ">>" link, climb to the largest ancestor whose text is
   *  only  < > =  and whitespace, and replace that whole element.
   */
  function upgradeNav(ctx) {
    var anchors = Array.prototype.slice.call(
      document.body.querySelectorAll("a[href]"));
    var handled = [];

    anchors.forEach(function (a) {
      var t = norm(a.textContent);
      if (t !== "<<" && t !== ">>") return;

      var box = a;
      while (box.parentNode && box.parentNode !== document.body) {
        var parent = box.parentNode;
        var leftover = norm(parent.textContent).replace(/[<>=\s]/g, "");
        if (leftover !== "") break;
        box = parent;
      }
      if (handled.indexOf(box) !== -1) return;
      handled.push(box);

      var prev = null, next = null;
      var inner = box.querySelectorAll ? box.querySelectorAll("a[href]") : [];
      var list = box.tagName === "A" ? [box] : Array.prototype.slice.call(inner);
      list.forEach(function (x) {
        var xt = norm(x.textContent);
        if (xt === "<<" && !prev) prev = x.getAttribute("href");
        if (xt === ">>" && !next) next = x.getAttribute("href");
      });

      // On the title page "<<" only wraps around to the last page: drop it.
      if (ctx.onTitlePage) prev = null;

      var pager = el("nav", { className: "thn-pager" });
      pager.appendChild(prev
        ? el("a", { className: "thn-prev", href: prev }, ["‹ Previous"])
        : el("span", { className: "thn-spacer" }));
      // Skip the middle link when "Previous" already goes to the title page.
      var prevIsToc = prev && pathOf(prev) === ctx.tocPath;
      if (ctx.tocHref && !ctx.onTitlePage && !prevIsToc) {
        pager.appendChild(
          el("a", { className: "thn-toc", href: ctx.tocHref }, ["Title page"]));
      }
      pager.appendChild(next
        ? el("a", { className: "thn-next", href: next }, ["Next ›"])
        : el("span", { className: "thn-spacer" }));

      box.parentNode.replaceChild(pager, box);
    });
  }

  /* ---------- CSS ---------- */

  var TEAL = "#495A58";
  var SERIF = "Georgia, 'Times New Roman', serif";

  var CSS = [
    "#thn-header *, #thn-footer *, .thn-pager * { box-sizing: border-box; }",

    /* push page content below the fixed header, with breathing room */
    "body { margin-top: 80px !important; }",

    /* ---- header ---- */
    "#thn-header {",
    "  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;",
    "  height: 56px;",
    "  background: " + TEAL + ";",
    "  font-family: " + SERIF + ";",
    "}",
    /* inner row lines up with the text column below */
    "#thn-inner {",
    "  height: 100%; max-width: 828px; margin: 0 auto; padding: 0 24px;",
    "  display: flex; align-items: center;",
    "}",
    "#thn-wordmark {",
    "  color: #fff; text-decoration: none;",
    "  font-size: 21px; letter-spacing: 0.03em; white-space: nowrap;",
    "  flex-shrink: 0;",
    "}",
    "#thn-sep {",
    "  width: 1px; height: 22px; margin: 0 16px;",
    "  background: rgba(255,255,255,0.35); flex-shrink: 0;",
    "}",
    "#thn-breadcrumb {",
    "  display: flex; align-items: center; gap: 9px;",
    "  font-size: 16px; color: rgba(255,255,255,0.75);",
    "  min-width: 0; overflow: hidden; white-space: nowrap;",
    "}",
    "#thn-breadcrumb a { color: #fff; text-decoration: none; }",
    "#thn-breadcrumb a:hover { text-decoration: underline; }",
    "#thn-breadcrumb .thn-chev { color: rgba(255,255,255,0.5); flex-shrink: 0; }",
    "#thn-breadcrumb .thn-fixed { flex-shrink: 0; }",
    "#thn-breadcrumb .thn-book {",
    "  min-width: 0; overflow: hidden; text-overflow: ellipsis;",
    "}",
    "#thn-breadcrumb .thn-current { color: #fff; }",
    "@media (max-width: 560px) {",
    "  #thn-wordmark { font-size: 18px; }",
    "  #thn-breadcrumb { font-size: 14px; }",
    "  .thn-hide-sm { display: none !important; }",
    "}",

    /* ---- pager (replaces << ======= >>) ---- */
    ".thn-pager {",
    "  display: flex; justify-content: space-between; align-items: center;",
    "  gap: 12px; margin: 2em 0 1em; padding-top: 1em;",
    "  border-top: 1px solid #d9d4c4;",
    "  font-family: " + SERIF + "; font-size: 16px; line-height: 1.2;",
    "}",
    ".thn-pager a {",
    "  color: " + TEAL + "; text-decoration: none;",
    "  padding: 7px 14px; border: 1px solid " + TEAL + "; border-radius: 3px;",
    "  white-space: nowrap;",
    "}",
    ".thn-pager a:hover { background: " + TEAL + "; color: #fff; }",
    ".thn-pager .thn-spacer { min-width: 1px; }",

    /* ---- footer ---- */
    "#thn-footer {",
    "  margin-top: 48px; padding: 20px 24px;",
    "  border-top: 1px solid #d9d4c4;",
    "  font-family: " + SERIF + "; font-size: 13.5px; color: #777;",
    "  text-align: center; background: #faf8f3;",
    "}",
    "#thn-footer a { color: " + TEAL + "; text-decoration: none; }",
    "#thn-footer a:hover { text-decoration: underline; }",
    "#thn-footer .thn-footer-sep { margin: 0 10px; color: #bbb; }",

    /* ---- body typography (light touch) ---- */
    "body {",
    "  font-family: " + SERIF + ";",
    "  line-height: 1.7; color: #222; background: #faf8f3;",
    "  max-width: 780px;",
    "  margin-left: auto !important; margin-right: auto !important;",
    "  padding: 0 24px 48px;",
    "}",

    /* ---- print: header once on page 1; no pager or footer ---- */
    "@media print {",
    "  #thn-header { position: static; break-after: avoid; }",
    "  body { margin-top: 0 !important; }",
    "  .thn-pager, #thn-footer { display: none; }",
    "}"
  ].join("\n");

  function injectStyles() {
    var style = document.createElement("style");
    style.id = "thn-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  /* ---------- header ---------- */

  function chev(extraClass) {
    return el("span", { className: "thn-chev " + (extraClass || "") },
              ["›"]);
  }

  function buildHeader(ctx) {
    var header = el("div", { id: "thn-header" });
    var inner = el("div", { id: "thn-inner" });

    inner.appendChild(el("a", {
      id: "thn-wordmark", href: SETTINGS.siteUrl, title: "Thomistica — home"
    }, ["Thomistica"]));

    inner.appendChild(el("span", { id: "thn-sep" }));

    var bc = el("div", { id: "thn-breadcrumb" });

    bc.appendChild(el("a", {
      className: "thn-fixed thn-hide-sm", href: SETTINGS.libraryUrl
    }, [SETTINGS.libraryName]));
    bc.appendChild(chev("thn-hide-sm"));

    // Book title: a link on inner pages, plain text on the title page
    var hasCrumbs = ctx.crumbs.length > 0;
    var bookAttrs = { className: "thn-book" };
    if (ctx.author) bookAttrs.title = ctx.bookTitle + " — " + ctx.author;
    var bookNode;
    if (ctx.tocHref && !ctx.onTitlePage) {
      bookAttrs.href = ctx.tocHref;
      bookNode = el("a", bookAttrs, [ctx.bookTitle]);
    } else {
      bookAttrs.className += " thn-current";
      bookNode = el("span", bookAttrs, [ctx.bookTitle]);
    }
    bc.appendChild(bookNode);

    ctx.crumbs.forEach(function (label, i) {
      bc.appendChild(chev());
      var last = (i === ctx.crumbs.length - 1);
      bc.appendChild(el("span", {
        className: "thn-fixed" + (last ? " thn-current" : "")
      }, [label]));
    });

    inner.appendChild(bc);
    header.appendChild(inner);
    return header;
  }

  /* ---------- footer ---------- */

  function buildFooter() {
    var footer = el("div", { id: "thn-footer" });
    var line = el("p", {});
    line.innerHTML =
      "Part of " +
      "<a href='" + SETTINGS.siteUrl + "'>Thomistica.net</a>" +
      "<span class='thn-footer-sep'>&middot;</span>" +
      "<a href='" + SETTINGS.libraryUrl + "'>" + SETTINGS.libraryName + "</a>" +
      "<span class='thn-footer-sep'>&middot;</span>" +
      "Under the direction of the " +
      "<a href='https://www.sacradoctrinaproject.org/'>Sacra Doctrina Project</a>";
    footer.appendChild(line);
    return footer;
  }

  /* ---------- main ---------- */

  function init() {
    // Analyse BEFORE touching the DOM, so our own header can't be mistaken
    // for page content.
    var ctx = analyse();

    if (SETTINGS.hideTitleLink) hideTitleLink(ctx);
    if (SETTINGS.upgradeBottomNav) upgradeNav(ctx);

    injectStyles();
    document.body.insertBefore(buildHeader(ctx), document.body.firstChild);
    document.body.appendChild(buildFooter());
  }

  if (document.readyState === "loading" ||
      document.readyState === "uninitialized") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
