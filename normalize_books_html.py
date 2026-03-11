#!/usr/bin/env python3

from pathlib import Path
import re
import sys


BLOCK_ONLY_RE = re.compile(
    r'^\s*(?:'
    r'<!--[\s\S]*?-->\s*|'
    r'<a\s+name\b[^>]*>\s*</a>\s*|'
    r'<a\s+name\b[^>]*></a>\s*|'
    r'<a\s+name\b[^>]*/>\s*|'
    r'<(?:h[1-6]|center|div|blockquote|ul|ol|li|pre)\b[\s\S]*?</(?:h[1-6]|center|div|blockquote|ul|ol|li|pre)>\s*|'
    r'<hr\b[^>]*>\s*'
    r')+$',
    re.I,
)

COMMENT_OR_NAMED_ANCHOR_RE = re.compile(
    r'(?:<!--[\\s\\S]*?-->\\s*|<a\\s+name\\b[^>]*>\\s*</a>\\s*|<a\\s+name\\b[^>]*></a>\\s*|<a\\s+name\\b[^>]*/>\\s*)*',
    re.I,
)


def normalize_line_endings(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # remove spaces before <p>
    text = re.sub(r"[ \t]+<p\b", "\n<p", text, flags=re.I)

    # ensure <p> starts on new line
    text = re.sub(r"(?<!\n)<p\b", "\n<p", text, flags=re.I)

    text = re.sub(r"\n{3,}", "\n\n", text)

    return text


def split_body(text):

    m = re.search(r'(<body\b[^>]*>)([\s\S]*?)(</body>)', text, re.I)

    if not m:
        return None

    return m.start(2), m.end(2), m.group(2)


def should_wrap(segment, first):

    stripped = segment.strip()

    if not stripped:
        return False

    if first:
        return False

    if BLOCK_ONLY_RE.fullmatch(stripped):
        return False

    leadless = re.sub(COMMENT_OR_NAMED_ANCHOR_RE, '', stripped, count=1)

    if re.match(r'^\s*<(?:h[1-6]|hr|center|div|blockquote|ul|ol|li|pre)\b', leadless, re.I):
        return False

    return True


def clean_one(path):

    text = path.read_text(errors="ignore")

    text = normalize_line_endings(text)

    body = split_body(text)

    if not body:
        out = path.with_name(path.stem + "_clean.htm")
        out.write_text(text)
        return

    start, end, content = body

    segments = re.split(r'<p\b[^>]*>\s*', content, flags=re.I)

    rebuilt = []

    for i, seg in enumerate(segments):

        if not seg.strip():
            continue

        seg = seg.strip()

        if should_wrap(seg, i == 0):
            rebuilt.append(f"<p>{seg}</p>")
        else:
            rebuilt.append(seg)

    new_body = "\n\n".join(rebuilt)

    new_text = text[:start] + new_body + text[end:]

    new_text = re.sub(r'<p>\s*</p>\s*', '', new_text)

    new_text = re.sub(r'\n{3,}', '\n\n', new_text)

    out = path.with_name(path.stem + "_clean.htm")

    out.write_text(new_text)


def main():

    if len(sys.argv) < 2:
        print("Usage: python normalize_books_html.py *.htm")
        return

    for name in sys.argv[1:]:
        clean_one(Path(name))


if __name__ == "__main__":
    main()
