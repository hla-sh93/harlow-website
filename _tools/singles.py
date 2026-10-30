"""Live's four single templates (Elementor theme-builder documents) and the parts of each that
show the item rather than the template.

The parts were found by comparing every item page of the reference that uses a template:
these widgets differ from item to item, nothing else does (the job template has one item;
its title heading, text and form are the ones the others' kinds show). Used by
seed_items.py (the fields only the pages show) and gen_blocks.py (the templates).
"""

# template id -> the reference page it is read from, the types it shows, and
# widget id -> what it shows: the item's title, date, featured picture, text, a field
# (meta:<name>), the picture gallery, or the application form
TEMPLATES = {
    "2473": {
        "name": "single-post",
        "types": ["post", "news"],
        "dynamic": {"f49cb78": "title", "3c45bee": "featured", "f4f7b25": "title", "81c2f40": "date",
                    "db612b2": "content"},
    },
    "4330": {
        "name": "single-project",
        "types": ["albahoo_project"],
        "dynamic": {"df29d32": "title", "54444eb": "meta:harlow_summary", "381be44": "title",
                    "ed0eaf3": "meta:harlow_year", "af09a63": "content", "125b6df": "featured",
                    "4ef022b": "meta:harlow_gallery"},
    },
    "2590": {
        "name": "single-gallery-item",
        "types": ["gallery_item"],
        "dynamic": {"26af750": "meta:harlow_gallery"},
    },
    "4152": {
        "name": "single-job",
        "types": ["job"],
        "dynamic": {"9b4429d": "title", "dd64e6a": "content"},
    },
}

# The fields only an item's page shows (live keeps them outside its REST API): widget id
# on the item's page -> field.
FIELDS = {
    "albahoo_project": {"54444eb": "harlow_summary", "ed0eaf3": "harlow_year", "4ef022b": "harlow_gallery"},
    "gallery_item": {"26af750": "harlow_gallery"},
}
