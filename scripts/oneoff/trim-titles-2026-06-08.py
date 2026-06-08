"""One-off: trim over-length <title> tags to <=60 rendered chars (P1-4).
Drops the ' | Universal Appliances Repair' brand suffix where present; applies
hand-authored trims to suffix-less long titles. Updates <title>, og:title, and
twitter:title together (context-targeted, never touches JSON-LD headline / <h1>).
Bumps article modified_time + dateModified for any changed articles/ file.
"""
import glob, re, html, os

SUF = " | Universal Appliances Repair"
TODAY = "2026-06-08T00:00:00+00:00"

NOSUF = {
 "articles/article-maintenance-skip-cost-statistics.html": "The Real Cost of Skipping Appliance Maintenance (2026)",
 "articles/article-appliance-failure-rates-by-year.html": "Appliance Failure Rates by Year (2026 Data)",
 "articles/article-built-in-refrigerator-repair-orange-county.html": "Built-In Refrigerator Repair in Orange County, CA",
 "articles/article-freezer-cost-rancho-santa-margarita.html": "Freezer Repair Cost in Rancho Santa Margarita, CA",
 "articles/article-dishwasher-not-draining-anaheim.html": "Dishwasher Not Draining? 6 Common Causes (Anaheim)",
 "articles/article-sub-zero-not-cooling-orange-county.html": "Sub-Zero Refrigerator Not Cooling? 5 Common Causes",
 "articles/article-dishwasher-cost-orange-county.html": "Dishwasher Repair Cost in Orange County (2026 Guide)",
 "articles/article-sub-zero-repair-vs-replace.html": "Sub-Zero Refrigerator: Repair or Replace? (OC Guide)",
 "articles/article-lg-fridge-repair-laguna-beach.html": "LG Refrigerator Repair in Laguna Beach, CA",
 "articles/article-appliance-lifespan-data-2026.html": "How Long Do Appliances Last? 2026 Lifespan Data",
 "articles/article-fridge-maintenance.html": "7 Refrigerator Maintenance Tips From Repair Pros (2026)",
 "articles/article-dryer-repair-cost-orange-county.html": "Dryer Repair Cost in Orange County, CA (2026 Guide)",
 "articles/article-microwave-not-heating-mission-viejo.html": "Microwave Not Heating in Mission Viejo? 5 Causes",
 "articles/article-samsung-fridge-not-cooling-irvine.html": "Samsung Refrigerator Not Cooling, Freezer Is (Irvine)",
 "articles/article-repair-replace.html": "Appliance Repair or Replace? The 50% Rule (2026, OC)",
 "articles/article-mini-fridge.html": "Best Mini Fridges for College Students 2026 (5 Picks)",
 "articles/article-whirlpool-dryer-repair-los-alamitos.html": "Whirlpool Dryer Repair in Los Alamitos, CA",
 "articles/article-stove-burner-not-lighting-orange-county.html": "Stove Burner Not Lighting After Cleaning? 3 Causes",
 "articles/article-washer-not-spinning-huntington-beach.html": "Washing Machine Not Spinning in Huntington Beach?",
 "articles/article-oven-not-heating-tustin.html": "Oven Not Heating in Tustin, CA: What to Check",
 "articles/article-dishwasher-leaking-dana-point.html": "Dishwasher Leaking in Dana Point, CA: Common Causes",
 "articles/article-gas-vs-electric-range-repair-cost-orange-county.html": "Gas vs Electric Range Repair Cost in Orange County",
 "pages/appliance-repair-laguna-beach-ca.html": "Appliance Repair in Laguna Beach, CA (Sub-Zero)",
 "articles/article-sub-zero-repair-cost-orange-county.html": "Sub-Zero Repair Cost in Orange County (2026 Guide)",
 "articles/article-fridge-not-cooling-fountain-valley.html": "Refrigerator Not Cooling in Fountain Valley, CA",
 "articles/article-freezer-not-freezing-westminster.html": "Freezer Not Freezing in Westminster, CA: 5 Causes",
 "pages/appliance-repair-mission-viejo-ca.html": "Appliance Repair in Mission Viejo, CA: Fridges & Washers",
 "articles/article-miele-dishwasher-error-codes.html": "Miele Dishwasher Error Codes: F11, F14, F70 Explained",
 "articles/article-dishwasher-maintenance-fullerton.html": "5 Dishwasher Maintenance Tips for Fullerton Homes",
 "articles/article-washer-repair-irvine.html": "Washer Repair in Irvine, CA: Costs & Timeline",
 "articles/article-fridge-not-cooling-huntington-beach.html": "Refrigerator Not Cooling in Huntington Beach?",
 "articles/article-dorm-appliances.html": "5 Essential Dorm Room Appliances 2026 (Buy & Skip)",
}

def esc(s):
    return s.replace("&", "&amp;")

def norm(p):
    return p.replace(os.sep, "/").replace("\\", "/")

files = glob.glob("index.html") + glob.glob("pages/*.html") + glob.glob("pages/blog/*.html") + glob.glob("articles/*.html")
changed = []
errors = []
for f in files:
    key = norm(f)
    c = open(f, encoding="utf-8").read()
    m = re.search(r"<title>(.*?)</title>", c, re.S)
    if not m:
        continue
    old = m.group(1)
    rend = html.unescape(old)
    if key in NOSUF:
        new = esc(NOSUF[key])
    elif rend.endswith(SUF) and len(rend) > 60:
        new = old[:-len(SUF)]
    else:
        continue
    if len(html.unescape(new)) > 60:
        errors.append("LEN>60: %s -> %s (%d)" % (f, html.unescape(new), len(html.unescape(new))))
        continue
    reps = [
        ("<title>%s</title>" % old, "<title>%s</title>" % new),
        ('property="og:title" content="%s"' % old, 'property="og:title" content="%s"' % new),
        ('name="twitter:title" content="%s"' % old, 'name="twitter:title" content="%s"' % new),
    ]
    n = 0
    for a, b in reps:
        if a in c:
            c = c.replace(a, b)
            n += 1
    if n != 3:
        errors.append("CTX!=3 (%d): %s" % (n, f))
    # bump article dates if this is an articles/ file
    if key.startswith("articles/"):
        c2 = re.sub(r'(<meta property="article:modified_time" content=")[^"]*(")', r"\g<1>%s\g<2>" % TODAY, c)
        c2 = re.sub(r'("dateModified"\s*:\s*")[^"]*(")', r"\g<1>%s\g<2>" % TODAY, c2)
        c = c2
    open(f, "w", encoding="utf-8", newline="").write(c)
    changed.append((key, rend, html.unescape(new)))

print("CHANGED: %d files; ERRORS: %d" % (len(changed), len(errors)))
for e in errors:
    print("  !!", e)
print()
for f, o, nw in sorted(changed):
    print("%2d  %s\n      OLD: %s\n      NEW: %s" % (len(nw), f, o, nw))
