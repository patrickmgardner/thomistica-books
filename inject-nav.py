#!/usr/bin/env python3
"""
inject-nav.py
=============
Batch-inserts  <script src="/thomistica-nav.js"></script>
into every .htm / .html file in the books.thomistica.net repo
that doesn't already have it.

Usage
-----
  python3 inject-nav.py                  # dry run — shows what WOULD change
  python3 inject-nav.py --write          # actually modifies files
  python3 inject-nav.py --write --root /path/to/repo   # explicit root dir

By default the script runs from the current working directory.

Safety features
---------------
 - Dry-run mode by default (pass --write to commit changes)
 - Skips files that already contain the script tag
 - Writes a .bak backup of each file before modifying
 - Reports a summary at the end
"""

import os
import sys
import argparse
import shutil

SCRIPT_TAG = '<script src="/thomistica-nav.js"></script>'

# We insert just before </body> when present, otherwise at end of file.
# If the file has no </body> at all we append a newline + the tag at the end.

def inject(content: str) -> tuple[str, str]:
    """
    Returns (new_content, action_description).
    action_description is one of: 'already_present', 'injected_before_body',
    'injected_at_end'.
    """
    if SCRIPT_TAG in content:
        return content, "already_present"

    lower = content.lower()
    idx = lower.rfind("</body>")   # last </body> in the file
    if idx != -1:
        new_content = content[:idx] + SCRIPT_TAG + "\n" + content[idx:]
        return new_content, "injected_before_body"
    else:
        # No </body> tag — append at the very end
        new_content = content.rstrip() + "\n" + SCRIPT_TAG + "\n"
        return new_content, "injected_at_end"


def find_html_files(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        # Skip hidden directories (e.g. .git)
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        for fname in filenames:
            if fname.lower().endswith((".htm", ".html")):
                yield os.path.join(dirpath, fname)


def main():
    parser = argparse.ArgumentParser(description="Inject thomistica-nav.js into HTML files.")
    parser.add_argument(
        "--write", action="store_true",
        help="Actually write changes. Without this flag, runs in dry-run mode."
    )
    parser.add_argument(
        "--root", default=".",
        help="Root directory of the repo (default: current directory)."
    )
    parser.add_argument(
        "--no-backup", action="store_true",
        help="Skip creating .bak backup files (not recommended)."
    )
    args = parser.parse_args()

    root = os.path.abspath(args.root)
    if not os.path.isdir(root):
        print(f"ERROR: {root} is not a directory.", file=sys.stderr)
        sys.exit(1)

    print(f"{'DRY RUN — ' if not args.write else ''}Scanning: {root}")
    print()

    counts = {"already_present": 0, "injected": 0, "error": 0}
    files_modified = []

    for filepath in sorted(find_html_files(root)):
        rel = os.path.relpath(filepath, root)
        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                original = f.read()
        except Exception as e:
            print(f"  ERROR reading {rel}: {e}")
            counts["error"] += 1
            continue

        new_content, action = inject(original)

        if action == "already_present":
            counts["already_present"] += 1
            # Uncomment the next line if you want verbose output for skipped files:
            # print(f"  SKIP   {rel}  (tag already present)")
            continue

        counts["injected"] += 1
        files_modified.append((rel, action))
        print(f"  {'WRITE' if args.write else 'WOULD'} {rel}  ({action})")

        if args.write:
            if not args.no_backup:
                shutil.copy2(filepath, filepath + ".bak")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)

    print()
    print("=" * 60)
    print(f"  Files scanned:       {counts['already_present'] + counts['injected'] + counts['error']}")
    print(f"  Already up to date:  {counts['already_present']}")
    print(f"  {'Modified' if args.write else 'Would modify'}:         {counts['injected']}")
    if counts["error"]:
        print(f"  Errors:              {counts['error']}")
    if not args.write:
        print()
        print("  This was a DRY RUN. Run with --write to apply changes.")
    else:
        if not args.no_backup:
            print()
            print("  Backups saved as <filename>.bak")
            print("  To remove backups after verifying:")
            print("    find . -name '*.bak' -delete")
    print("=" * 60)


if __name__ == "__main__":
    main()
