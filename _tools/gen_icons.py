"""Write the editor's icon library (theme/editor/icon-library.json) from WordPress's own icon
set (the @wordpress/icons package the editor is built with, GPL-2.0-or-later), each icon as
the page prints an icon: one line of SVG with Elementor's icon classes.

    python _tools/gen_icons.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "node_modules" / "@wordpress" / "icons" / "src" / "library"
OUT = ROOT / "theme" / "editor" / "icon-library.json"


def one(name, text):
    """An icon's SVG on one line: Elementor's classes, its box, its shapes; a stroked icon's
    `style="fill: none"` as an attribute (the page's icon cleaner keeps no style)."""
    svg = re.search(r"<svg([^>]*)>(.*)</svg>", text, re.S)
    attrs, inner = svg.group(1), svg.group(2)
    box = re.search(r'viewBox="([^"]+)"', attrs).group(1)
    extra = ""
    if re.search(r"fill:\s*none", attrs):
        extra += ' fill="none"'
    for key in ("stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule", "clip-rule"):
        m = re.search(rf'\s{key}="([^"]+)"', attrs)
        if m:
            extra += f' {key}="{m.group(1)}"'
    inner = re.sub(r"\s+", " ", inner).strip()
    inner = re.sub(r">\s+<", "><", inner)
    return (f'<svg aria-hidden="true" class="e-font-icon-svg e-wp-{name}" viewBox="{box}"{extra} '
            f'xmlns="http://www.w3.org/2000/svg">{inner}</svg>')


def main():
    if not SOURCE.is_dir():
        sys.exit(f"no icon set at {SOURCE} (run npm install)")
    # An icon drawn by its outline keeps fill="none" (modules.css colours its line instead).
    icons = [{"name": p.stem, "svg": one(p.stem, p.read_text(encoding="utf-8"))} for p in sorted(SOURCE.glob("*.svg"))]
    OUT.write_text(json.dumps(icons, ensure_ascii=False, indent="\t") + "\n", encoding="utf-8", newline="\n")
    print(f"{len(icons)} icons -> {OUT.relative_to(ROOT).as_posix()}")


if __name__ == "__main__":
    main()
