# -*- coding: utf-8 -*-
"""One-off: remove banned em dashes from the 4 blog category pages (P1-5 residual).
Headings / blog-card titles "Title - Subtitle" -> colon (or comma for "- and");
all prose/parenthetical em dashes -> comma. blog.html is excluded (its only em
dashes are in CSS comments, not editorial copy)."""
import glob

EM = "—"  # em dash

FILES = [
    "pages/blog/refrigerator.html",
    "pages/blog/washer.html",
    "pages/blog/freezer.html",
    "pages/blog/oven-stove.html",
]

# Explicit heading / card-title replacements (file-unique strings). Applied first.
EXPLICIT = {
    # H1s -> colon
    "Refrigerator Repair %s Tips, Guides" % EM: "Refrigerator Repair: Tips, Guides",
    "Washer Repair %s Tips, Guides" % EM: "Washer Repair: Tips, Guides",
    "Freezer Repair %s Tips, Guides" % EM: "Freezer Repair: Tips, Guides",
    "Oven &amp; Stove Repair %s Tips, Guides" % EM: "Oven &amp; Stove Repair: Tips, Guides",
    # H2s
    "Why Refrigerators Fail %s and What It Usually Means" % EM: "Why Refrigerators Fail, and What It Usually Means",
    "The Most Common Washer Complaints %s and What's Behind Them" % EM: "The Most Common Washer Complaints, and What's Behind Them",
    "Washer Leaks %s Finding the Source Quickly" % EM: "Washer Leaks: Finding the Source Quickly",
    "Loud Noises During Spin %s What Each Sound Means" % EM: "Loud Noises During Spin: What Each Sound Means",
    "Why Freezers Stop Freezing %s The Most Common Causes" % EM: "Why Freezers Stop Freezing: The Most Common Causes",
    "Frost Buildup %s When Defrost System Fails" % EM: "Frost Buildup: When Defrost System Fails",
    "Freezer Making Noise %s What It Means" % EM: "Freezer Making Noise: What It Means",
    "Food Safety %s How Long Can You Wait?" % EM: "Food Safety: How Long Can You Wait?",
    "Oven Not Heating %s Gas vs. Electric Failures" % EM: "Oven Not Heating: Gas vs. Electric Failures",
    "Oven Temperature Running Off %s More Common Than You'd Think" % EM: "Oven Temperature Running Off: More Common Than You'd Think",
    # blog-card titles -> colon
    "Refrigerator Repair in Garden Grove, CA %s What to Expect" % EM: "Refrigerator Repair in Garden Grove, CA: What to Expect",
    "LG Refrigerator Repair in Laguna Beach, CA %s Common Issues" % EM: "LG Refrigerator Repair in Laguna Beach, CA: Common Issues",
    "Washer Repair in Garden Grove, CA %s Signs You Need a Pro" % EM: "Washer Repair in Garden Grove, CA: Signs You Need a Pro",
    "Washer Repair in Irvine, CA %s Costs, Timeline" % EM: "Washer Repair in Irvine, CA: Costs, Timeline",
    "Freezer Repair in Brea, CA %s What to Check Before Food Thaws" % EM: "Freezer Repair in Brea, CA: What to Check Before Food Thaws",
    "Freezer Repair Cost in Rancho Santa Margarita, CA %s What Homeowners Usually Pay" % EM: "Freezer Repair Cost in Rancho Santa Margarita, CA: What Homeowners Usually Pay",
    "Oven Repair in Laguna Niguel, CA %s What to Expect" % EM: "Oven Repair in Laguna Niguel, CA: What to Expect",
    "Oven Repair in Santa Ana, CA %s What to Expect" % EM: "Oven Repair in Santa Ana, CA: What to Expect",
}

for f in FILES:
    c = open(f, encoding="utf-8").read()
    before = c.count(EM)
    for a, b in EXPLICIT.items():
        c = c.replace(a, b)
    # Everything else: " <em> " (prose / parentheticals) -> ", "
    c = c.replace(" %s " % EM, ", ")
    after = c.count(EM)
    open(f, "w", encoding="utf-8", newline="").write(c)
    print("%s: %d em-dashes -> %d remaining" % (f, before, after))
