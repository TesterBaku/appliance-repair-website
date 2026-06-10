# -*- coding: utf-8 -*-
"""Audit testimonial hub usage from LIVE HTML (ground truth) per the
testimonial-capacity-fix plan (2026-06-10).

Rule: a review may appear on at most 2 HUBS. Hubs = city hubs
(pages/appliance-repair-*-ca.html) + service/brand/cost hubs
(pages/*-orange-county.html). Homepage, testimonials page, about, etc. are
NOT hubs and do not count.

Parses Review JSON-LD author.name (and LocalBusiness.review[]) on each hub
page, maps names to data/testimonials.json IDs, and reports per-review hub
counts, free slots, and any review on >2 hubs.

Usage: python audit-testimonial-hub-usage-2026-06-10.py [--emit-tracker]
"""
import glob, re, json, sys, os

ROOT = os.getcwd()

def is_hub(path):
    p = path.replace(os.sep, "/")
    base = p.split("/")[-1]
    if not p.startswith("pages/"):
        return False
    # city hubs: appliance-repair-<city>-ca.html (but NOT the cost hub which is -orange-county)
    if re.match(r"appliance-repair-.*-ca\.html$", base):
        return True
    # service / brand / cost hubs: *-orange-county.html
    if base.endswith("-orange-county.html"):
        return True
    return False

def review_names_in(html):
    """Return list of Review author names found in JSON-LD on the page."""
    names = []
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(block)
        except Exception:
            continue
        # walk the structure for any dict with @type == Review
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, list):
                stack.extend(node)
            elif isinstance(node, dict):
                if node.get("@type") == "Review":
                    auth = node.get("author")
                    if isinstance(auth, dict) and auth.get("name"):
                        names.append(auth["name"].strip())
                stack.extend(node.values())
    return names

# Build name -> [ids] map from the pool
pool = json.load(open("data/testimonials.json", encoding="utf-8"))["reviews"]
name_to_ids = {}
for r in pool:
    name_to_ids.setdefault(r["name"].strip(), []).append(r["id"])

# Case-insensitive canonical map: fold display-name variants (e.g. "Andrea Hall"
# vs pool "andrea hall") to ONE person so hub counts aren't double-counted.
canon = {}
for r in pool:
    canon[r["name"].strip().lower()] = r["name"].strip()
def canonical(nm):
    return canon.get(nm.lower(), nm)

# Scan all candidate pages
pages = glob.glob("index.html") + glob.glob("pages/*.html")
hub_usage = {}      # review-name -> set of hub files
nonhub_pages = {}   # for context
unmapped = set()
for f in pages:
    html = open(f, encoding="utf-8").read()
    names = review_names_in(html)
    if not names:
        continue
    hub = is_hub(f)
    for nm in names:
        if nm not in name_to_ids:
            unmapped.add((nm, f.replace(os.sep, "/")))
        if hub:
            hub_usage.setdefault(canonical(nm), set()).add(f.replace(os.sep, "/"))

# Tally
dist = {0: 0, 1: 0, 2: 0, 3: 0}
over = []
free_slots = 0
rows = []
all_review_names = set(r["name"].strip() for r in pool)
# include reviews displayed on hubs even if name matches pool
for nm in sorted(set(list(hub_usage.keys()))):
    c = len(hub_usage.get(nm, ()))
    rows.append((nm, c, sorted(hub_usage.get(nm, ()))))
    if c >= 3:
        over.append((nm, c, sorted(hub_usage[nm])))

# counts across the pool's displayable-ish view: count hub usage per displayed name
counted = {nm: len(hs) for nm, hs in hub_usage.items()}
for nm, c in counted.items():
    dist[min(c, 3)] = dist.get(min(c, 3), 0) + 1
    free_slots += max(0, 2 - c)

print("=== Hub-usage audit (live HTML, ground truth) ===")
print("Hub pages scanned:", sum(1 for f in pages if is_hub(f) and review_names_in(open(f,encoding='utf-8').read())))
print("Distinct reviews displayed on >=1 hub:", len(counted))
print("Distribution by hub count: 1 hub=%d  2 hubs=%d  3+ hubs=%d" % (
    sum(1 for c in counted.values() if c==1),
    sum(1 for c in counted.values() if c==2),
    sum(1 for c in counted.values() if c>=3)))
print("FREE SLOTS among already-used reviews (2 - count):", free_slots)
print()
print("OVER CAP (>2 hubs) — should be exactly the 4 grandfathered exceptions:")
for nm, c, hubs in over:
    print("  %-22s %d hubs: %s" % (nm, c, ", ".join(h.split("/")[-1] for h in hubs)))
if unmapped:
    print("\nUNMAPPED displayed names (not found in pool by exact name):")
    for nm, f in sorted(unmapped):
        print("  %r on %s" % (nm, f.split("/")[-1]))

if "--list" in sys.argv:
    print("\n=== Per-review hub usage ===")
    for nm, c, hubs in sorted(rows, key=lambda x:(-x[1], x[0])):
        print("  %-24s %d  %s" % (nm, c, ", ".join(h.split('/')[-1] for h in hubs)))


def short(h):
    return h.split("/")[-1].replace("appliance-repair-", "").replace("-orange-county.html", "-hub").replace("-ca.html", "")

if "--emit-tracker" in sys.argv:
    over_names = {nm for nm, _, _ in over}
    used = sum(1 for c in counted.values() if c >= 1)
    at_cap = sum(1 for c in counted.values() if c == 2)
    one = sum(1 for c in counted.values() if c == 1)
    L = []
    L.append("# Testimonial Hub-Usage Tracker")
    L.append("")
    L.append("> **Auto-generated from live HTML on 2026-06-10** by `scripts/oneoff/audit-testimonial-hub-usage-2026-06-10.py`")
    L.append("> (parses `Review.author.name` JSON-LD across every hub page). Do not hand-edit the tables below —")
    L.append("> re-run the script (`python scripts/oneoff/audit-testimonial-hub-usage-2026-06-10.py --emit-tracker`)")
    L.append("> after any hub testimonial change so this stays ground-truth, not a drifted hand-log.")
    L.append("")
    L.append("## The rule (canonical: `.claude/rules/testimonial-selection.md`)")
    L.append("")
    L.append("**A review may appear on at most 2 HUBS.** A hub is a city hub")
    L.append("(`pages/appliance-repair-*-ca.html`) or a service/brand/cost hub (`pages/*-orange-county.html`).")
    L.append("The **homepage** and the **testimonials page** are NOT hubs and do NOT count toward the limit.")
    L.append("")
    L.append("## Capacity at a glance")
    L.append("")
    L.append("| Metric | Value |")
    L.append("|---|---|")
    L.append("| Distinct reviews currently on >=1 hub | %d |" % used)
    L.append("| On exactly 1 hub (1 free slot each) | %d |" % one)
    L.append("| On exactly 2 hubs (at cap) | %d |" % at_cap)
    L.append("| On 3 hubs (grandfathered exceptions) | %d |" % len(over))
    L.append("| **Free hub-slots available now** | **%d** |" % free_slots)
    L.append("| Approx. new city hubs supportable @ 3/hub | **~%d** (before appliance-match / brand-variety / row-balance filters) |" % (free_slots // 3))
    L.append("")
    L.append("The pool is **not** exhausted: the %d reviews sitting on a single hub each have a free" % one)
    L.append("second slot. Allocate from the \"1 free slot\" list below when building new hubs.")
    L.append("")
    L.append("## Accepted exceptions (3 hubs each — grandfathered, DO NOT move)")
    L.append("")
    L.append("These four predate the ≤2-hubs rule and are sanctioned. Future audits must treat them as allowed,")
    L.append("not as violations to fix. No other review may exceed 2 hubs.")
    L.append("")
    L.append("| Review | Hubs (3) |")
    L.append("|---|---|")
    for nm, c, hubs in sorted(over):
        L.append("| %s | %s |" % (nm, ", ".join(short(h) for h in hubs)))
    L.append("")
    L.append("## Reviews with a free slot (on exactly 1 hub) — allocate these first")
    L.append("")
    L.append("| Review | On hub |")
    L.append("|---|---|")
    for nm, c, hubs in sorted(rows):
        if c == 1:
            L.append("| %s | %s |" % (nm, short(hubs[0])))
    L.append("")
    L.append("## Reviews at cap (on 2 hubs) — do not add to a 3rd hub")
    L.append("")
    L.append("| Review | Hubs (2) |")
    L.append("|---|---|")
    for nm, c, hubs in sorted(rows):
        if c == 2:
            L.append("| %s | %s |" % (nm, ", ".join(short(h) for h in hubs)))
    L.append("")
    L.append("## Name-normalization note")
    L.append("")
    L.append("Counts above are computed **case-insensitively against the pool `name`**, so display-name")
    L.append("case variants (e.g. `Andrea Hall` on the cost hub vs pool `andrea hall` on the freezer hub,")
    L.append("and `Mike Bonilla` vs `mike bonilla`) are correctly folded to ONE person — both of those")
    L.append("people are therefore counted at their true 2-hub (at-cap) position, not as two free singles.")
    if unmapped:
        rem = sorted({nm for nm, _ in unmapped if nm.lower() not in canon})
        if rem:
            L.append("")
            L.append("Display names still not matched to any pool `name` (normalize in source on next edit): "
                     + ", ".join("`%s`" % n for n in rem) + ".")
    L.append("")
    out = "\n".join(L) + "\n"
    open("tasks/testimonial-usage.md", "w", encoding="utf-8", newline="\n").write(out)
    print("\nWrote tasks/testimonial-usage.md (%d lines)" % len(L))
