"""The handoff (stage 10): the theme as one zip a WordPress dashboard takes, and its pictures
as a second zip, with the notes. Written outside the repository (default ../harlow-handoff/).

    python -u _tools/package_theme.py [folder]

harlow.zip         the folder `harlow/`: theme/ with the repository's assets/ inside it (CSS,
                   JS, fonts, vendor files) and the design's own pictures: those the theme's
                   files name (`assets/uploads/...`, served from the theme) and those its
                   stylesheets name (`url(../../uploads/...)`). Every site needs them, the live
                   one too. Uploaded at Appearance > Themes > Add New Theme > Upload Theme.
harlow-pictures.zip  the folder `uploads/`: the pictures the installer copies into the Media
                   Library (theme/install/media.json, every size) and those the items' texts show
                   (`wp-content/uploads/...`), unpacked into the theme's assets/ on a new host (the
                   File Manager or FTP). On the live site they are its own already, under the same
                   ids, and this zip is not needed.
README.md, README-ar.md  the notes (docs/handoff.md, docs/handoff-ar.md).

Passing: `handoff: harlow.zip N files (X MB, P of the design's pictures), harlow-pictures.zip M
files (Y MB), 0 files named and not here -> <folder>`.
"""
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THEME = ROOT / "theme"
ASSETS = ROOT / "assets"
UPLOADS = (ASSETS / "uploads").resolve()
# A file named in a text: `<prefix>/<year>/<month>/<name>` up to a quote, an ASCII space (a
# name can hold U+202F: macOS screenshot names), a bracket, a backslash (a JSON escape) or a
# query; a comment's `assets/uploads/...` is not one.
TAIL = r"(\d{4}/\d{2}/[^\"' \t\r\n)<>?#\\]+)"
NAMED = re.compile(r"assets/uploads/" + TAIL)
IN_TEXTS = re.compile(r"wp-content/uploads/" + TAIL)
CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")]+)")


def design():
    """The pictures of the design: named by the theme's files and the stylesheets."""
    files = set()
    for path in list(THEME.rglob("*")) + list((ASSETS / "js").rglob("*.js")):
        if path.is_file() and path.suffix in (".php", ".json", ".html", ".css", ".js") and "install" not in path.parts:
            files |= set(NAMED.findall(path.read_text(encoding="utf-8", errors="ignore")))
    for css in (ASSETS / "css").rglob("*.css"):
        for ref in CSS_URL.findall(css.read_text(encoding="utf-8", errors="ignore")):
            if ref.startswith(("data:", "http", "#")):
                continue
            full = (css.parent / ref.split("?")[0]).resolve()
            if full.is_relative_to(UPLOADS):
                files.add(full.relative_to(UPLOADS).as_posix())
    return files


def pictures():
    """The Media Library's pictures (every size) and those the items' texts show."""
    media = json.loads((THEME / "install" / "media.json").read_text(encoding="utf-8"))["media"]
    files = set()
    for picture in media:
        files.add(picture["file"])
        folder = Path(picture["file"]).parent
        for size in (picture.get("sizes") or {}).values():
            files.add((folder / size["file"]).as_posix())
    for name in ("items.json", "site.json"):
        text = (THEME / "install" / name).read_text(encoding="utf-8", errors="ignore")
        files |= set(IN_TEXTS.findall(text)) | set(NAMED.findall(text))
    return files


def write_zip(target, entries):
    """entries: (path inside the zip, file on disk), written in their order."""
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, source in entries:
            z.write(source, name)


def main(out):
    out.mkdir(parents=True, exist_ok=True)
    looks = design()
    gallery = pictures() - looks
    missing = sorted(f for f in looks | gallery if not (UPLOADS / f).is_file())

    theme = []
    for path in sorted(THEME.rglob("*")):
        rel = path.relative_to(THEME).as_posix()
        # theme/assets/ is where the repository's assets/ is mounted for development
        if path.is_file() and not rel.startswith("assets/"):
            theme.append((f"harlow/{rel}", path))
    for path in sorted(ASSETS.rglob("*")):
        rel = path.relative_to(ASSETS).as_posix()
        if path.is_file() and not rel.startswith("uploads/"):
            theme.append((f"harlow/assets/{rel}", path))
    theme += [(f"harlow/assets/uploads/{f}", UPLOADS / f) for f in sorted(looks) if (UPLOADS / f).is_file()]
    write_zip(out / "harlow.zip", theme)

    present = [(f"uploads/{f}", UPLOADS / f) for f in sorted(gallery) if (UPLOADS / f).is_file()]
    write_zip(out / "harlow-pictures.zip", present)

    shutil.copyfile(ROOT / "docs" / "handoff.md", out / "README.md")
    shutil.copyfile(ROOT / "docs" / "handoff-ar.md", out / "README-ar.md")
    for f in missing:
        print("  named and not here:", f)
    mb = lambda p: (out / p).stat().st_size / 1e6  # noqa: E731
    print(f"handoff: harlow.zip {len(theme)} files ({mb('harlow.zip'):.1f} MB, {len(looks)} of the design's pictures), "
          f"harlow-pictures.zip {len(present)} files ({mb('harlow-pictures.zip'):.1f} MB), "
          f"{len(missing)} files named and not here -> {out}")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "harlow-handoff"
    sys.exit(main(folder))
