"""The lists of the reference pages: which items each shows and how.

Live's loop widgets keep their query on the server, so this is read off the reference:
the items each list shows, in which order and how many (see stage 2 in AGENTS.md).
Used by gen_blocks.py (the list blocks of the pages) and verify_lists.py.
"""

# page, widget, layout, card, type, how many, by, which first, pager
LISTS = [
    ("index", "bb14510", "carousel", "business-model", "business_model", 5, "date", "DESC", ""),
    ("index", "2af964d", "grid", "post-card", "news", 3, "date", "DESC", ""),
    ("construction-iraq", "a4e4956", "grid", "project", "albahoo_project", 7, "date", "ASC", ""),
    ("about-us", "b193185", "carousel", "testimonial", "testimonial", 5, "date", "DESC", ""),
    ("blog", "1be6882", "grid", "post-card", "post", 6, "date", "DESC", "numbers"),
    ("harlows-people", "96e801d", "grid", "person", "harlows_person", 4, "date", "ASC", ""),
    ("latest-news", "6c728a64", "grid", "post-card", "news", 5, "date", "DESC", "prev_next"),
    ("photo-gallery", "25dbaa8", "grid", "gallery-item", "gallery_item", 5, "date", "DESC", ""),
    ("work-with-us", "52d2b59", "grid", "job", "job", 1, "date", "DESC", ""),
]

# The client logos: the cards alone, inside the "major clients" section.
LOGOS = ("client-logo", "client_logo", 100, "menu_order", "ASC")


def list_attributes(widget):
    """The list block's attributes for a reference widget id (without its design)."""
    for page, w, layout, card, post_type, count, by, order, pager in LISTS:
        if w == widget:
            return {"layout": layout, "postType": post_type, "template": card, "perPage": count,
                    "orderby": by, "order": order, "pagination": pager}
    raise KeyError(widget)
