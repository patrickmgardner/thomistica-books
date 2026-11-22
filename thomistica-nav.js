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
   *    levelPages  "gc{n}.htm"               Where the intermediate pages are,
   *                or { "1": "gc1.htm", ... } so that e.g. "Book 1" links to
   *                                          its own contents page. {n} is
   *                                          the number ("1", or "3.2" for a
   *                                          deeper level). Relative to the
   *                                          work's title page.
   *    numerals  "roman"                     Show II instead of 2. Or a list
   *                                          per level: ["roman", "arabic"].
   *    offset    -1, 1, ...                  Added to the file number before
   *                                          display (if file 2 is really
   *                                          Chapter 1, use offset: -1).
   *    zero      "Preface" / false           Label for file 000, or false
   *                                          to show nothing for it.
   *    nav       false                       Keep the page's own footer links
   *                                          (when they carry chapter titles).
   *    parent    {title:"...", href:"x.htm"} An overall work above this one:
   *                                          Parent > Book > Chapter.
   *    pages     { "file.htm": "Label" }     One-off crumb for a single file
   *                                          (replaces the computed crumbs).
   *    title     "Short Title"               Override the book title shown
   *                                          in the breadcrumb.
   *    divisions [ {from: N, label: "..."} ] Named groups of files, by the
   *                                          file number each one starts at.
   *                                          Adds a middle crumb, e.g.
   *                                          Book > Chapter I > Article 3.
   *                                          Optional per division:
   *                                          first: 1  restarts the chapter
   *                                            numbering there (file `from`
   *                                            becomes chapter 1; first: 0
   *                                            marks an introduction page
   *                                            with no chapter crumb);
   *                                          href: "part4.htm"  makes the
   *                                            label a link;
   *                                          only: true  the label REPLACES
   *                                            the chapter crumb: use for a
   *                                            single "Appendix" or "Index"
   *                                            page (Book > Appendix);
   *                                          unit: "Appendix"  uses that word
   *                                            instead of the work's unit, so
   *                                            several pages count Appendix I,
   *                                            II ... (give it first: 1, and
   *                                            leave out label);
   *                                          letters: true  one page per
   *                                            letter: Index > A, B, C ...
   *                                            The file at `from` is the menu
   *                                            page (just "Index"); with
   *                                            first: 1 it is already A.
   *                                          (A range where every file should
   *                                          just read "Index": only: true.)
   * ====================================================================== */

  var WORKS = {

    // Use the FULL path of the title page. Pages that have no back-link at
    // the top (such as the book-level contents pages) find their settings
    // through the folder, which only works with a full path.

    "Rickaby-SCG/gc.htm": {
      units: ["Book", "Chapter"],
      // "Book 1" links to gc_bk1.htm, "Book 2" to gc_bk2.htm, and so on
      // (same folder as the title page).
      levelPages: "gc_bk{n}.htm",
      // This work's own footer links carry the chapter titles; keep them
      // instead of replacing them with a generic Previous / Next.
      nav: false
    },

    "DeWulf/homp.htm": {
      unit: "Article",
      divisions: [
        { from: 474, label: "Index", letters: true }
      ]
    },

    "Conway/conway.htm": {
	unit: "Part",
	numerals: "roman"
    },

    // Template for a work whose files run 1, 2, 3 ... straight through but
    // whose text is divided into Parts with chapters restarting in each.
    // "from" is the number of the first file in each Part (emt20.htm -> 20).
    // Fill in the real numbers, remove the leading // marks, and add a comma
    // after the preceding entry's closing brace.

    "Elmendorf/emt.htm": {
	unit: "Chapter",
	numerals: "roman",
      	divisions: [
         { from: 1,  label: "Part I",   first: 1 },   
         { from: 8,  label: "Part II",  first: 1 },  
         { from: 12, label: "Part III", first: 1 }, 
         { from: 20, label: "Part IV",  first: 1 } 
     	]
    },

    "Bampton/mamt.htm": {
	unit: "Lecture",
	numerals: "roman"
    },

    "Turner/hop.htm": {
	numerals: "roman",
	divisions: [
	  { from: 0, label: "Oriental" },
	  { from: 1, label: "Greco-Roman" },
	  { from: 19, label: "Greco-Oriental" },
	  { from: 21, label: "Patristic" },
	  { from: 24, label: "Scholastic" },
	  { from: 48, label: "Modern" }
	]
    },

    "Rickaby-Moral/moral.htm": {
	zero: "Preface",
	units: ["Part","Chapter"],
	numerals: "roman"
    },

    "Rickaby-Principles/first.htm": {
        offset: -1,
        divisions: [
          { from: 1, label: "Preface" },
          { from: 2, label: "Part I", first: 1 },
          { from: 16, label: "Part II", first: 1 }
        ],
        numerals: "roman"
     },

    "Azarias/aatcc.htm": {
	numerals: "roman",
	divisions: [
	  { from: 14, label: "Appendix", only: true },
	  { from: 15, label: "Index",    only: true }
	]
    },

    "Coppens-Catholic/sscr.htm": {
	zero: "Introduction"
    },

    // Barnes: three works under one overall title page (westmin.htm).
    // `parent` puts the overall title in front of each sub-work:
    //   Westminster Lectures > The Witness of the Gospels > Chapter 3
    // westmin.htm itself is listed so it is recognised as a title page.
    "Barnes/westmin.htm": {},
    "Barnes/barnes.htm": { parent: { title: "Westminster Lectures", href: "westmin.htm" } },
    "Barnes/gerard.htm": { parent: { title: "Westminster Lectures", href: "westmin.htm" } },
    "Barnes/saf.htm":    { parent: { title: "Westminster Lectures", href: "westmin.htm" } },

    // Title pages whose <title> ends in a number: listing the page's own
    // path makes it count as a title page, not as a numbered chapter.
    "Louis/cp.htm": {},
    "Harper/tmots.htm": {},
    "Perrier/perrier.html": {},

    // Other examples:
    // , "SomeWork/w.htm": { pages: { "w000.htm": "Preface", "w99.htm": "Appendix" } }
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
    return (s || "")
      .replace(/[\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g, "")
      .replace(/\s+/g, " ").trim();
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
  function fromRoman(str) {
    var v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    var n = 0;
    for (var i = 0; i < str.length; i++) {
      var c = v[str.charAt(i)], next = v[str.charAt(i + 1)];
      n += (next && next > c) ? -c : c;
    }
    return n;
  }

  // "<book> : <unit word> <number>" at the end of a title
  var UNIT_TITLE = new RegExp(
    "^(.*?)(?:\\s*[:,;\\u2013\\u2014-]\\s*|\\s+)" +
    "(chapter|lecture|part|book|article|section|question|appendix|letter|" +
    "sermon|essay|discourse|treatise|dialogue)" +
    "\\s+([IVXLCDM]+|\\d{1,3}(?:\\.\\d{1,3})*)$", "i");

  function parsePageTitle() {
    var t = norm(document.title)
      .replace(/^Jacques Maritain Center:\s*/i, "")
      .replace(/\.html?$/i, "")          // "gc1_11.htm" typed into a title
      .replace(/\s*:\s*$/, "");         // trailing colon

    var nums = null, label = null, roman = false, sfx = "", named = "";

    // 1) A unit word and a number at the end of the title, roman or arabic:
    //    "Scholasticism: Chapter I", "Title, Lecture 4", "Title - Part II".
    //    The word becomes the crumb label and the numeral style is kept.
    var lm = t.match(UNIT_TITLE);
    if (lm && (/^[IVXLCDM]+$/.test(lm[3]) || /^\d/.test(lm[3]))) {
      label = lm[2].charAt(0).toUpperCase() + lm[2].slice(1).toLowerCase();
      if (/^[IVXLCDM]+$/.test(lm[3])) {
        nums = [fromRoman(lm[3])];
        roman = true;
      } else {
        nums = lm[3].split(".").map(function (x) { return parseInt(x, 10); });
      }
      t = lm[1];
    } else {
      // 2) Just a trailing number, possibly multi-level:
      //    "1", "003", "1.11", "3.2.5"
      //    A single trailing letter is kept: "1.100a" -> 100, suffix "a"
      var m = t.match(/^(.*?)\s+(\d{1,3}(?:\.\d{1,3})*)([a-z])?$/);
      if (m) {
        nums = m[2].split(".").map(function (x) { return parseInt(x, 10); });
        sfx = m[3] || "";
        t = m[1];
      } else {
        // 3) "Book: Bibliography" -- no number, a named section
        var cm = t.match(/^(.*?)\s*:\s*(.+)$/);
        if (cm && cm[1]) { named = cm[2]; t = cm[1]; }
      }
    }

    var parts = t.split(/\s+\/\s+/);
    return {
      book: parts[0],
      author: (parts[1] || "").replace(/^by\s+/i, ""),
      nums: nums,                      // null, or e.g. [3] or [1, 11]
      label: label,                    // "Chapter", "Lecture", ... or null
      roman: roman,                    // true if the title used I, II, IV ...
      sfx: sfx,                        // "a" in "100a", or ""
      named: named                     // "Bibliography" in "Book: Bibliography"
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
  function findTitleLink() {
    var anchors = document.body.querySelectorAll("a[href]");
    for (var i = 0; i < Math.min(anchors.length, 3); i++) {
      var a = anchors[i];
      var text = norm(a.textContent);
      if (!text || NAV_SYMBOLS.test(text)) continue;

      // Shape 1: the link sits alone at the top, directly followed by <hr>
      //   <a href="gc.htm">Of God and His Creatures</a><hr>
      // (it may be wrapped in <p>, <center>, ... as long as it is alone)
      var top = a;
      while (top.parentNode && top.parentNode !== document.body) {
        top = top.parentNode;
      }
      var after = top.nextElementSibling;
      if (after && after.tagName === "HR" && norm(top.textContent) === text) {
        return a;
      }

      // Shape 2: "Title / by Author" link text
      if (text.indexOf(" / ") !== -1) return a;
    }
    // Anything else (e.g. a chapter link in a table of contents) is NOT a
    // link back to the title page.
    return null;
  }

  /* ---------- find a work's settings ----------
   *
   *  Tried in order: the title page's path, its folder, its bare file name,
   *  then the current page's own path / folder / file name, and finally any
   *  full-path entry in WORKS that lives in the same folder as this page.
   *  That last step is what lets pages WITHOUT a back-link (such as a
   *  book-level contents page) find their work's settings.
   *  Returns { cfg: {...}, key: "matching key or null" }.
   */
  function findWork(tocPath, currentPath) {
    var tries = [];
    if (tocPath) {
      tries.push(tocPath, dirOf(tocPath), tocPath.split("/").pop());
    }
    tries.push(currentPath, dirOf(currentPath), currentPath.split("/").pop());

    for (var i = 0; i < tries.length; i++) {
      if (tries[i] && WORKS.hasOwnProperty(tries[i])) {
        return { cfg: WORKS[tries[i]], key: tries[i] };
      }
    }

    var here = dirOf(currentPath);
    var keys = Object.keys(WORKS);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      if (key.slice(-1) !== "/" && key.indexOf("/") !== -1 &&
          dirOf(key) === here) {
        return { cfg: WORKS[key], key: key };
      }
    }
    return { cfg: {}, key: null };
  }

  /* ---------- 3. put it all together ---------- */

  function analyse() {
    var info = parsePageTitle();
    var link = findTitleLink();   // (reassigned below for title pages)
    var currentPath = pathOf(location.href);

    var onTitlePage = (info.nums === null && !link && !info.named);

    // A page listed in WORKS under its own path is that work's title page,
    // even if its <title> ends in a number.
    if (WORKS.hasOwnProperty(currentPath) &&
        (!link || pathOf(link.getAttribute("href")) === currentPath)) {
      onTitlePage = true;
      info.nums = null;
      info.named = "";
      link = null;
    }

    var book = info.book;
    var author = info.author;
    if (link) {
      var lp = norm(link.textContent).split(/\s+\/\s+/);
      if (lp[0]) book = lp[0];
      if (lp[1]) author = lp[1].replace(/^by\s+/i, "");
    }

    var tocPath = link ? pathOf(link.getAttribute("href"))
                       : (onTitlePage ? currentPath : "");
    var tocHref = link ? link.getAttribute("href") : null;

    var found = findWork(tocPath, currentPath);
    var cfg = found.cfg;

    // A numbered page with no back-link (e.g. a book-level contents page):
    // if its work was found by a full-path key, that key IS the title page.
    if (!link && !onTitlePage && found.key &&
        found.key.slice(-1) !== "/" && found.key.indexOf("/") !== -1) {
      tocPath = found.key;
      tocHref = "/" + found.key;
    }

    function fmt(n, level) {
      var style = Array.isArray(cfg.numerals) ? cfg.numerals[level] : cfg.numerals;
      if (style === undefined && info.roman) style = "roman";
      return style === "roman" ? toRoman(n) : String(n);
    }

    // Address of an intermediate level's page (e.g. Book 1), from
    // cfg.levelPages: either { "1": "gc1.htm", ... } or a template such as
    // "gc{n}.htm". Relative addresses are resolved against the title page.
    function resolveRel(rel) {
      if (!rel) return null;
      try {
        return new URL(rel, new URL(tocHref || location.href, location.href)).href;
      } catch (e) {
        return null;
      }
    }

    function levelHref(prefix) {
      var lp = cfg.levelPages;
      if (!lp) return null;
      var rel = (typeof lp === "string") ? lp.replace(/\{n\}/g, prefix)
                                         : lp[prefix];
      return resolveRel(rel);
    }

    // Crumbs after the book title: [{ text: "Book 1", href: "..." | null }]
    var crumbs = [];
    var nums = info.nums;
    if (!nums && info.named && link) {
      crumbs.push({ text: info.named, href: null });
    }
    if (nums) {
      if (cfg.units) {
        // Multi-level: units ["Book", "Chapter"] + title "GC 1.11"
        //   -> Book 1 > Chapter 11   (and "GC 1" -> Book 1)
        // Every level except the last can link to its own page.
        if (nums.length === 1 && nums[0] === 0) {
          // file 0 (front matter): the work's `zero` label, not "Part 0"
          if (cfg.zero !== false) {
            crumbs.push({ text: cfg.zero || SETTINGS.zeroLabel, href: null });
          }
        } else nums.forEach(function (n, i) {
          var last = (i === nums.length - 1);
          crumbs.push({
            text: (cfg.units[i] || "Section") + " " + fmt(n, i),
            href: last ? null : levelHref(nums.slice(0, i + 1).join("."))
          });
        });
      } else if (nums.length > 1) {
        // Multi-level number but no settings for this work
        crumbs.push({ text: "Section " + nums.join("."), href: null });
      } else {
        var num = nums[0];
        var div = null;
        (cfg.divisions || []).forEach(function (d) {
          if (d.from <= num && (!div || d.from >= div.from)) div = d;
        });
        // A division with `only: true` IS the page ("Appendix", "Index"):
        // its label is the last crumb and no chapter crumb follows.
        var divIsPage = !!(div && div.only);
        if (div && div.label) {
          crumbs.push({ text: div.label,
                        href: divIsPage ? null : resolveRel(div.href) });
        }

        if (divIsPage) {
          // nothing more to add
        } else if (div && div.letters) {
          // Lettered pages (an Index with one page per letter): the file at
          // `from` is the menu page (no letter), the next is A, then B ...
          // With first: 1 the file at `from` is already A.
          var li = num - div.from + (div.first !== undefined ? div.first : 0);
          if (li >= 1 && li <= 26) {
            crumbs.push({ text: String.fromCharCode(64 + li), href: null });
          }
        } else if (num === 0) {
          if (!div && cfg.zero !== false) {
            crumbs.push({ text: cfg.zero || SETTINGS.zeroLabel, href: null });
          }
        } else {
          // A division's own `unit` (e.g. "Appendix") replaces the work's.
          var unit = (div && div.unit !== undefined) ? div.unit
            : (cfg.unit === undefined) ? (info.label || SETTINGS.defaultUnit)
            : cfg.unit;
          // A division with `first` restarts the numbering: the file where
          // it begins is chapter `first` (use 0 for an introduction page,
          // which then gets no chapter crumb), and later files count up
          // from there. Without `first`, numbering simply continues.
          var n1 = (div && div.first !== undefined)
            ? num - div.from + div.first
            : num + (cfg.offset || 0);
          if (unit && n1 >= 1) {
            crumbs.push({ text: unit + "\u00a0" + fmt(n1, 0), href: null });
          }
        }
      }
    }

    // A trailing letter ("100a") stays on the number, except for file 0.
    if (info.sfx && crumbs.length && nums && nums[nums.length - 1] !== 0) {
      crumbs[crumbs.length - 1].text += info.sfx;
    }

    // One-off labels for single files (cfg.pages)
    var fileName = currentPath.split("/").pop();
    if (cfg.pages && cfg.pages.hasOwnProperty(fileName) && !onTitlePage) {
      crumbs = [{ text: cfg.pages[fileName], href: null }];
    }

    return {
      parent: cfg.parent || null,
      keepNav: cfg.nav === false,
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

  /* ---------- 5. replace the old  << ... >>  navigation with a pager ----------
   *
   *  Old pages use either   << ======= >>        (middle is just symbols)
   *                    or   << Book Title >>     (middle is a real link to
   *                                               the title page).
   *  For each "<<" / ">>" link we climb to the largest ancestor that holds
   *  ONLY links plus symbol text (< > = | and whitespace), has at most three
   *  links, and is not the body. That element is the whole old navigation,
   *  and it is replaced by one pager. Any link other than << and >> in the
   *  group is kept as a middle button.
   */
  var SYMBOL_ONLY = /^[\s<>=|·•–—-]*$/;

  function isNavGroup(node) {
    if (node.querySelectorAll("a[href]").length > 3) return false;
    var clone = node.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll("a"), function (x) {
      x.parentNode.removeChild(x);
    });
    return SYMBOL_ONLY.test(clone.textContent);
  }

  function upgradeNav(ctx) {
    var anchors = Array.prototype.slice.call(
      document.body.querySelectorAll("a[href]"));
    var handled = [];
    var currentPath = pathOf(location.href);

    anchors.forEach(function (a) {
      var t = norm(a.textContent);
      if (t !== "<<" && t !== ">>") return;

      var box = a;
      while (box.parentNode &&
             box.parentNode !== document.body &&
             box.parentNode !== document.documentElement &&
             isNavGroup(box.parentNode)) {
        box = box.parentNode;
      }
      if (handled.indexOf(box) !== -1) return;
      handled.push(box);

      var prev = null, next = null, extras = [];
      var list = (box.tagName === "A") ? [box] :
        Array.prototype.slice.call(box.querySelectorAll("a[href]"));
      list.forEach(function (x) {
        var xt = norm(x.textContent);
        if (xt === "<<" && !prev) prev = x.getAttribute("href");
        else if (xt === ">>" && !next) next = x.getAttribute("href");
        else if (xt && !NAV_SYMBOLS.test(xt)) extras.push(x);
      });

      // On the title page "<<" only wraps around to the last page: drop it.
      if (ctx.onTitlePage) prev = null;

      var pager = el("nav", { className: "thn-pager" });
      pager.appendChild(prev
        ? el("a", { className: "thn-prev", href: prev }, ["‹ Previous"])
        : el("span", { className: "thn-spacer" }));

      // Middle button(s): the group's own links if it has any, otherwise
      // a "Title page" link built from the page's top link.
      var middle = [];
      if (extras.length) {
        extras.forEach(function (x) {
          var href = x.getAttribute("href");
          var p = pathOf(href);
          if (p === currentPath) return;                  // link to itself
          if (prev && p === pathOf(prev)) return;         // duplicates Previous
          middle.push({
            href: href,
            label: (ctx.tocPath && p === ctx.tocPath) ? "Title page"
                                                      : norm(x.textContent)
          });
        });
      } else {
        var prevIsToc = prev && pathOf(prev) === ctx.tocPath;
        if (ctx.tocHref && !ctx.onTitlePage && !prevIsToc) {
          middle.push({ href: ctx.tocHref, label: "Title page" });
        }
      }
      middle.forEach(function (m) {
        pager.appendChild(el("a", { className: "thn-toc", href: m.href }, [m.label]));
      });

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

    // Overall work above this one (Barnes: Westminster Lectures)
    if (ctx.parent) {
      bc.appendChild(el("a", {
        className: "thn-fixed thn-hide-sm",
        href: new URL(ctx.parent.href, location.href).href
      }, [ctx.parent.title]));
      bc.appendChild(chev("thn-hide-sm"));
    }

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

    ctx.crumbs.forEach(function (crumb, i) {
      bc.appendChild(chev());
      var last = (i === ctx.crumbs.length - 1);
      if (crumb.href && !last) {
        bc.appendChild(el("a", {
          className: "thn-fixed", href: crumb.href
        }, [crumb.text]));
      } else {
        bc.appendChild(el("span", {
          className: "thn-fixed" + (last ? " thn-current" : "")
        }, [crumb.text]));
      }
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
    if (SETTINGS.upgradeBottomNav && !ctx.keepNav) upgradeNav(ctx);

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
