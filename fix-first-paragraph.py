#!/usr/bin/env python3
"""
fix-first-paragraph.py
======================
Adds the missing opening <p> to the first paragraph of a page, i.e. bare
text that follows the page's first heading, as in:

    <H1>Rejection of the aforesaid Opinion ...</h1>

    THE above opinion arises partly from custom ...

    <p>1. Nor is the existence of God ...

becomes

    <H1>Rejection of the aforesaid Opinion ...</h1>

    <p>THE above opinion arises partly from custom ...

    <p>1. Nor is the existence of God ...

Only an opening <p> is added, matching the rest of the page (a <p> ends
at the next <p> or block element).

Usage
-----
  python3 fix-first-paragraph.py                       # dry run, whole repo
  python3 fix-first-paragraph.py --only GC/            # dry run, one folder
  python3 fix-first-paragraph.py --only GC/ --write    # apply

  --root DIR    repo root (default: current directory)
  --only PREFIX only files whose path (relative to root) starts with PREFIX
  --show N      number of before/after samples to print (default: 8)
  --backup      also write <file>.bak before changing a file

Safety
------
 - Dry run unless --write is given.
 - Idempotent: running it twice changes nothing the second time.
 - Files are read and written byte-for-byte; only the inserted "<p>" differs
   (no re-encoding, line endings untouched).
 - Commit your repo before using --write, so `git diff` shows exactly what
   changed and `git checkout .` undoes it. (No .bak files by default,
   because GitHub Pages would publish them.)
 - Pages with no heading, or where the text after the heading doesn't look
   like a bare paragraph, are left alone and listed in the report.
"""

import argparse
import os
import re
import sys

BODY_OPEN = re.compile(r"<body\b[^>]*>", re.I)
HEADING_OPEN = re.compile(r"<h[1-6]\b[^>]*>", re.I)
HEADING_CLOSE = re.compile(r"</h[1-6]\s*>", re.I)

# Things that may sit between the heading and the first paragraph without
# counting as content: whitespace, comments, empty <a name=...></a>, <hr>.
SKIPPABLE = [
    re.compile(r"\s+"),
    re.compile(r"<!--.*?-->", re.S),
    re.compile(r"<a\s+name\s*=\s*[^>]*>\s*</a\s*>", re.I),
    re.compile(r"<hr\b[^>]*>", re.I),
]

TAG = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)")

# Tags that can start a paragraph of running text.
INLINE = {
    "a", "i", "b", "em", "strong", "span", "font", "sup", "sub", "u",
    "cite", "q", "small", "big", "tt", "code", "abbr", "dfn", "var", "s",
    "strike",
}


def skip(s, i):
    """Advance past whitespace, comments, empty anchors and <hr>."""
    moved = True
    while moved:
        moved = False
        for rx in SKIPPABLE:
            m = rx.match(s, i)
            if m and m.end() > i:
                i = m.end()
                moved = True
    return i


def find_insert_point(s):
    """Return (index, status). index is where '<p>' should go, or None."""
    body = BODY_OPEN.search(s)
    start = body.end() if body else 0

    m = HEADING_CLOSE.search(s, start)
    if not m:
        return None, "no-heading"

    j = skip(s, m.end())

    # Stacked headings (<h1>..</h1> <h2>..</h2> text): continue past them.
    while True:
        mo = HEADING_OPEN.match(s, j)
        if not mo:
            break
        mc = HEADING_CLOSE.search(s, mo.end())
        if not mc:
            return None, "unclosed-heading"
        j = skip(s, mc.end())

    if j >= len(s):
        return None, "nothing-after-heading"

    if s[j] == "<":
        t = TAG.match(s, j)
        if not t:
            return None, "unusual-markup"      # doctype, stray '<', etc.
        closing, name = t.group(1), t.group(2).lower()
        if closing:
            return None, "unusual-markup"      # e.g. </body>, </center>
        if name not in INLINE:
            return None, "already-ok"          # <p>, <blockquote>, <table>...
    return j, "wrap"


def snippet(s, j):
    before = s[max(0, j - 40):j].replace("\n", "\\n")
    after = s[j:j + 60].replace("\n", "\\n")
    return before, after


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--root", default=".")
    ap.add_argument("--only", default="")
    ap.add_argument("--show", type=int, default=8)
    ap.add_argument("--backup", action="store_true")
    args = ap.parse_args()

    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        sys.exit("ERROR: %s is not a directory" % root)

    only = args.only.replace("\\", "/")
    counts = {}
    samples = []
    odd = {}

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if not d.startswith("."))
        for fname in sorted(filenames):
            if not fname.lower().endswith((".htm", ".html")):
                continue
            path = os.path.join(dirpath, fname)
            rel = os.path.relpath(path, root).replace(os.sep, "/")
            if only and not rel.startswith(only):
                continue

            # Byte-faithful: invalid UTF-8 bytes survive unchanged,
            # and newline='' keeps CRLF/LF exactly as they are.
            with open(path, "r", encoding="utf-8", errors="surrogateescape",
                      newline="") as f:
                s = f.read()

            j, status = find_insert_point(s)
            counts[status] = counts.get(status, 0) + 1

            if status == "wrap":
                if len(samples) < args.show:
                    samples.append((rel,) + snippet(s, j))
                if args.write:
                    new = s[:j] + "<p>" + s[j:]
                    if args.backup:
                        with open(path + ".bak", "w", encoding="utf-8",
                                  errors="surrogateescape", newline="") as f:
                            f.write(s)
                    with open(path, "w", encoding="utf-8",
                              errors="surrogateescape", newline="") as f:
                        f.write(new)
            elif status != "already-ok":
                odd.setdefault(status, []).append(rel)

    print(("WRITE" if args.write else "DRY RUN") +
          " - root: %s%s" % (root, ("  only: " + only) if only else ""))
    print()

    if samples:
        print("Sample changes (text before | inserted <p> | text after):")
        for rel, before, after in samples:
            print("  %s" % rel)
            print("    ...%s | <p> | %s..." % (before, after))
        print()

    for status, files in sorted(odd.items()):
        print("Left alone - %s: %d file(s)" % (status, len(files)))
        for rel in files[:5]:
            print("    " + rel)
        if len(files) > 5:
            print("    ... and %d more" % (len(files) - 5))
    if odd:
        print()

    total = sum(counts.values())
    print("=" * 60)
    print("  Files scanned:            %d" % total)
    print("  Already fine:             %d" % counts.get("already-ok", 0))
    print("  %-25s %d" % ("Modified:" if args.write else "Would modify:",
                          counts.get("wrap", 0)))
    print("  Left alone (see above):   %d" % sum(len(v) for v in odd.values()))
    if not args.write:
        print()
        print("  Dry run only. Review the samples, then add --write.")
    print("=" * 60)


if __name__ == "__main__":
    main()
