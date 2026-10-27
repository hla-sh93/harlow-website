# Harlow Group website

A rebuild of https://www.harlowgroup.com/ in two phases:

1. **html site v1** (current): every public page as plain HTML with hand-written CSS and
   JS, rendering identically to the live site at 1440x900 and 479x900.
2. **WordPress theme**: a classic theme built from the approved HTML site.

## Layout

| path | what |
|---|---|
| `_inventory/` | stage A: `inventory.md`, `urls.csv`, `pages.json` |
| `_tools/` | crawler, report and (later) the checking tools |

Pages and `assets/` arrive from stage D onwards.

## How to run

Any static file server from the project root:

```bash
python -m http.server 8000
```

## Deliberate differences from live

None yet.

## Known gaps

None yet.
