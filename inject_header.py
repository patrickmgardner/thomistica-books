#!/usr/bin/env python3

from pathlib import Path
import re
import sys

HEADER_HTML = """
<div class="thomistica-header">
  <div class="thomistica-header-inner">
    <div class="thomistica-brand">
      <a href="https://thomistica.net">Thomistica</a>
    </div>
    <nav class="thomistica-nav" aria-label="Books site">
      <a href="https://books.thomistica.net">Thomistic Revival Books</a>
    </nav>
  </div>
</div>
""".strip()

BODY_RE = re.compile(r"(<body\b[^>]*>)", re.I)

def inject_header(path: Path):
    text = path.read_text(errors="ignore")

    if 'class="thomistica-header"' in text:
        return

    new_text, count = BODY_RE.subn(r"\1\n" + HEADER_HTML + "\n", text, count=1)

    if count:
        path.write_text(new_text)

def main():
    if len(sys.argv) < 2:
        print("Usage: python inject_header.py file1.htm [file2.htm ...]")
        return

    for name in sys.argv[1:]:
        inject_header(Path(name))

if __name__ == "__main__":
    main()
