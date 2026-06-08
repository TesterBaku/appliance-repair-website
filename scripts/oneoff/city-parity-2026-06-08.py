# -*- coding: utf-8 -*-
"""One-off (P2-2): bring a thin-tier city hub to rich-tier parity.
Adds Common Appliance Issues prose, Service Area Details (+ zero-JS CSS
service-area locator), and Repair Resources internal links, plus hasMap in
the LocalBusiness JSON-LD. Run once per city:  python city-parity-2026-06-08.py <slug>
City hubs are not articles/, so no modified_time bump applies."""
import sys

CID = "https://www.google.com/maps?cid=6142328803939874574"

CITIES = {
 "santa-ana": {
   "name": "Santa Ana", "mapsq": "Santa+Ana,+CA",
   "ziprange": "92701&ndash;92707",
   "locdesc": "Service area centered on Santa Ana, covering ZIP codes 92701&ndash;92707. Dispatched from our Stanton base, a short drive northwest.",
   "issues": [
     "Santa Ana is one of Orange County's oldest and most densely built cities, and that range of housing shows up in the repairs we run.",
     "In Floral Park and Wilshire Square, the historic homes from the 1920s through the 1940s often still run older gas ranges and freestanding refrigerators. We see weak oven igniters, oven thermostats that drift off temperature, and compressors that have simply aged out. These kitchens reward careful repair over replacement, since many were updated with mid-grade units that are very fixable.",
     "Around Downtown, the 4th Street Arts District, and Midtown, much of the housing is apartments and older multi-family buildings. Stackable and apartment-sized laundry is common, and the calls skew toward dryers that need two or three cycles to dry a load (usually a clogged vent or a worn heating element) and washers that will not drain.",
     "In the South Coast Metro high-rises and condos near South Coast Plaza, newer high-efficiency front-load washers and integrated dishwashers dominate. Door-boot-seal leaks and clogged drain-pump filters on the washers, and quiet Bosch dishwashers that stop draining, are the everyday requests there.",
   ],
   "area": "Stanton sits just northwest of Santa Ana, so most of the city is a 15 to 20 minute drive from our dispatch point via the 22 freeway or Bristol Street. Downtown, Floral Park, and Washington Square are quick to reach; the South Coast Metro neighborhoods near the 405 take a few minutes longer. Same-day slots are available across every Santa Ana ZIP code for calls received before noon, with a two-hour arrival window and a call when the technician is on the way.",
   "resources": [
     ("Dryer", "../articles/article-dryer-not-heating-santa-ana.html", "Dryer Not Heating in Santa Ana? Here's Why and What to Do", "Read the guide &rarr;"),
     ("Oven", "../articles/article-oven-repair-santa-ana.html", "Oven Repair in Santa Ana, CA: What to Expect", "Read the guide &rarr;"),
     ("Service Hub", "dryer-repair-orange-county.html", "Dryer Repair in Orange County", "See all dryer services &rarr;"),
   ],
 },
 "garden-grove": {
   "name": "Garden Grove", "mapsq": "Garden+Grove,+CA",
   "ziprange": "92840&ndash;92845",
   "locdesc": "Service area centered on Garden Grove, covering ZIP codes 92840&ndash;92845. Dispatched from our neighboring Stanton base.",
   "issues": [
     "Garden Grove is built largely from postwar tract housing, and most of those single-story homes from the 1950s and 1960s are still in daily use, which shapes the repairs we see.",
     "Across Downtown, West Garden Grove, and Central Garden Grove, the original kitchens have mostly been updated once or twice, so we work on a wide mix of brands. The constant is hard water: Garden Grove's mineral-heavy supply scales up dishwasher spray arms, clogs washer inlet screens, and shortens the life of water-valve assemblies. Descaling and valve replacements are routine calls.",
     "In Little Saigon and the Koreatown stretch along Garden Grove Boulevard, many households cook heavily and run laundry every day. High-use ranges, vent hoods, and dryers wear faster here, so we see more burner and igniter work and more dryer heating-element and thermal-fuse replacements than in lighter-use neighborhoods.",
     "Newer condo clusters near the Anaheim border and the Resort area bring stackable laundry and compact dishwashers. These are space-constrained installs, and we handle the tight-fit removals and reinstalls those units require.",
   ],
   "area": "Garden Grove borders Stanton directly, so it is one of the closest cities to our dispatch point, typically a 10 to 15 minute drive via Chapman Avenue or the 22 freeway. Every Garden Grove ZIP code, from West Garden Grove to Little Saigon and the Anaheim border, is well inside our same-day range for calls received before noon, with a two-hour arrival window.",
   "resources": [
     ("Refrigerator", "../articles/article-fridge-repair-garden-grove.html", "Refrigerator Repair in Garden Grove, CA: What to Expect", "Read the guide &rarr;"),
     ("Washer", "../articles/article-washer-repair-garden-grove.html", "Washer Repair in Garden Grove, CA: Signs You Need a Pro", "Read the guide &rarr;"),
     ("Service Hub", "refrigerator-repair-orange-county.html", "Refrigerator Repair in Orange County", "See all refrigerator services &rarr;"),
   ],
 },
 "costa-mesa": {
   "name": "Costa Mesa", "mapsq": "Costa+Mesa,+CA",
   "ziprange": "92626&ndash;92628",
   "locdesc": "Service area centered on Costa Mesa, covering ZIP codes 92626&ndash;92628. Dispatched from our Stanton base via the 405.",
   "issues": [
     "Costa Mesa splits cleanly into older neighborhoods and newer high-density pockets, and the appliance work tracks that divide.",
     "On the Westside and in the older parts of Eastside Costa Mesa, the housing runs to 1950s and 1960s bungalows and cottages. Appliances here are a mix of aging builders' units and owner upgrades, so a single street might mean an old top-load washer on one call and a recent slide-in range on the next. Garbage disposals get heavy use in these remodeled kitchens, and jammed or leaking disposals are one of our most common Costa Mesa requests.",
     "Mesa Verde's 1960s tract homes are now well past the point where original dishwashers, ovens, and refrigerators start to fail. We replace bake elements, oven control boards, and refrigerator fan motors regularly in that part of town.",
     "Around the SoCo and Segerstrom district and the Triangle Square area near South Coast Plaza, newer condos and lofts bring built-in microwaves, compact dishwashers, and stackable laundry. Built-in microwave failures (no heat, or a turntable that will not turn) and quiet dishwashers that stop draining are the everyday calls there.",
   ],
   "area": "From our Stanton base, Costa Mesa is roughly a 20 to 25 minute drive down the 405 freeway. Mesa Verde and the Westside are first off the freeway; the SoCo and Segerstrom neighborhoods near South Coast Plaza and East Costa Mesa toward the Newport border take a few minutes more. Same-day appointments are available across 92626, 92627, and 92628 for calls received before noon, with a two-hour arrival window.",
   "resources": [
     ("Garbage Disposal", "../articles/article-garbage-disposal-repair-costa-mesa.html", "Garbage Disposal Repair in Costa Mesa, CA", "Read the guide &rarr;"),
     ("Microwave", "../articles/article-microwave-not-heating-costa-mesa.html", "Microwave Not Heating in Costa Mesa? Here's Why", "Read the guide &rarr;"),
     ("Service Hub", "garbage-disposal-repair-orange-county.html", "Garbage Disposal Repair in Orange County", "See all disposal services &rarr;"),
   ],
 },
 "mission-viejo": {
   "name": "Mission Viejo", "mapsq": "Mission+Viejo,+CA",
   "ziprange": "92691&ndash;92692",
   "locdesc": "Service area centered on Mission Viejo, covering ZIP codes 92691&ndash;92692. Dispatched from our Stanton base via the 5 freeway.",
   "issues": [
     "Mission Viejo is one of Orange County's original master-planned cities, built out mostly between the early 1970s and the 1990s, and that shared construction era creates predictable appliance patterns.",
     "In the planned villages, La Paz, Cordova, Galicia and Barcelona, O'Neill Ranch, and Aegean Hills, many homes still have the appliances that came with their last big kitchen remodel in the 1990s or 2000s. Those units are now reaching the age where refrigerator sealed systems, dishwasher pumps, and oven control boards start to fail, and that is the bulk of what we repair here.",
     "Casta del Sol is a 55-plus community, and we get a lot of calls there for reliability fixes on well-kept older appliances: refrigerators that have stopped cooling evenly, dryers that take too long, and microwaves that have quit heating. Homeowners in these neighborhoods tend to repair rather than replace, and most of these units are very fixable.",
     "Newer hillside homes carry built-in and premium appliances, including Sub-Zero, Bosch, and Thermador. We service those brands and stock the common failure parts, so a built-in refrigerator or wall oven does not have to wait days for a specialist.",
   ],
   "area": "Mission Viejo is in south Orange County, roughly a 30 to 40 minute drive from our Stanton base via the 5 freeway. We reach the La Paz and Marguerite corridors first, with Casta del Sol, Aegean Hills, and the neighborhoods around Lake Mission Viejo a few minutes further. Same-day service is available across 92691 and 92692 for calls received before noon when scheduling allows, always with a two-hour arrival window.",
   "resources": [
     ("Microwave", "../articles/article-microwave-not-heating-mission-viejo.html", "Microwave Not Heating in Mission Viejo? 5 Causes", "Read the guide &rarr;"),
     ("Service Hub", "refrigerator-repair-orange-county.html", "Refrigerator Repair in Orange County", "See all refrigerator services &rarr;"),
     ("Service Hub", "washer-repair-orange-county.html", "Washer Repair in Orange County", "See all washer services &rarr;"),
   ],
 },
 "newport-beach": {
   "name": "Newport Beach", "mapsq": "Newport+Beach,+CA",
   "ziprange": "92660 through 92663",
   "locdesc": "Service area centered on Newport Beach, covering ZIP codes 92660 through 92663 plus Corona del Mar and Newport Coast. Dispatched from our Stanton base.",
   "issues": [
     "Newport Beach homes lean heavily toward built-in and luxury appliances, and the coastal setting adds wear you do not see inland, so the repairs here have their own character.",
     "In Newport Center, the Port Streets, Eastbluff, and Dover Shores, custom and upper-tier homes are full of built-in Sub-Zero refrigerators, Wolf and Viking ranges, Thermador cooktops, and Miele dishwashers. Sealed-system cooling repairs, wine-cooler thermostat and compressor work, and built-in dishwasher leaks are routine, and our technicians carry parts for these platforms.",
     "On the Balboa Peninsula and Balboa Island, the older cottages and remodeled bungalows sit close to the water, where salt air corrodes condenser coils, hinges, and exposed metal faster than inland. We service coastal-exposed refrigerators and laundry units that show early corrosion, and we replace parts that have rusted or seized.",
     "Wine storage is a Newport specialty. Dedicated wine coolers and dual-zone built-ins are common across Corona del Mar and Newport Coast, and a wine cooler that drifts off temperature or stops cooling is one of our more frequent calls in these neighborhoods.",
   ],
   "area": "Newport Beach is a coastal city in south Orange County, roughly a 25 to 35 minute drive from our Stanton base via the 55 freeway. We reach Newport Heights and the Newport Center area first; Corona del Mar, Balboa Island, and Newport Coast are a few minutes further along the coast. Same-day appointments are available across the Newport ZIP codes for calls received before noon, with a two-hour arrival window.",
   "resources": [
     ("Wine Cooler", "../articles/article-wine-cooler-repair-newport-beach.html", "Wine Cooler Repair in Newport Beach, CA: What to Expect", "Read the guide &rarr;"),
     ("Service Hub", "wine-cooler-repair-orange-county.html", "Wine Cooler Repair in Orange County", "See all wine cooler services &rarr;"),
     ("Brand Hub", "sub-zero-appliance-repair-orange-county.html", "Sub-Zero Repair in Orange County", "See Sub-Zero services &rarr;"),
   ],
 },
 "orange": {
   "name": "Orange", "mapsq": "Orange,+CA",
   "ziprange": "92866&ndash;92869",
   "locdesc": "Service area centered on the City of Orange, covering ZIP codes 92866&ndash;92869. Dispatched from our Stanton base.",
   "issues": [
     "The City of Orange has one of the most varied housing stocks in the county, from century-old homes downtown to mid-century Eichlers and newer hillside tracts, and each era brings its own appliance issues.",
     "In Old Towne Orange and the Chapman University area, the historic Craftsman and early-1900s homes (ZIP 92866) often have compact or older kitchens, and many are rentals with hard-working, frequently replaced appliances. Quick-turn repairs on ranges, dishwashers, and laundry are the norm, and we work around tight historic kitchen layouts.",
     "The Eichler tract in Panorama Heights is a mid-century-modern landmark, and those homes have distinctive galley kitchens. Built-in ovens and slide-in ranges in Eichlers can be tricky to service around the original cabinetry, and we take the care these homes need when removing and reinstalling built-in units.",
     "Up in Serrano Heights, El Modena, Orange Hills, and Orange Park Acres, newer and larger homes carry built-in refrigerators, double wall ovens, and premium brands. Sealed-system cooling, control-board, and built-in dishwasher repairs are the common requests in the hillside neighborhoods.",
   ],
   "area": "The City of Orange sits in central Orange County, roughly a 15 to 25 minute drive from our Stanton base via the 22 or 55 freeway. Old Towne and the Chapman area are quick to reach off the 22; Serrano Heights, Orange Hills, and Orange Park Acres in the 92869 hills take a few minutes more. Same-day appointments are available across 92866 through 92869 for calls received before noon, with a two-hour arrival window.",
   "resources": [
     ("Dishwasher", "../articles/article-dishwasher-repair-orange.html", "Dishwasher Repair in Orange CA: What to Expect", "Read the guide &rarr;"),
     ("Service Hub", "dishwasher-repair-orange-county.html", "Dishwasher Repair in Orange County", "See all dishwasher services &rarr;"),
     ("Service Hub", "refrigerator-repair-orange-county.html", "Refrigerator Repair in Orange County", "See all refrigerator services &rarr;"),
   ],
 },
}

def build(city):
    P = '<p style="font-size:14px;color:#666;line-height:1.75;max-width:760px;%s">%s</p>'
    issues = P % ("", city["issues"][0])
    for para in city["issues"][1:]:
        issues += "\n      " + (P % ("margin-top:16px;", para))
    cards = ""
    for kind, url, title, cta in city["resources"]:
        cards += (
          '\n        <a href="%s" style="display:block;background:#fff;border-radius:12px;padding:20px 22px;box-shadow:0 1px 10px rgba(0,0,0,0.07);text-decoration:none;">\n'
          '          <div style="font-size:10px;font-weight:700;color:var(--brand-text);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">%s</div>\n'
          '          <div style="font-size:14px;font-weight:700;color:#111;line-height:1.4;margin-bottom:6px;">%s</div>\n'
          '          <div style="font-size:12px;color:var(--brand-text);font-weight:600;">%s</div>\n'
          '        </a>\n' % (url, kind, title, cta))
    nm = city["name"]
    common_and_area = (
'  <!-- COMMON ISSUES -->\n'
'  <section class="section section-gray">\n'
'    <div class="container-lg">\n'
'      <h2 class="h2-page">Common Appliance Issues in %s Homes</h2>\n'
'      %s\n'
'    </div>\n'
'  </section>\n\n'
'  <!-- SERVICE AREA DETAILS -->\n'
'  <section class="section section-white">\n'
'    <div class="container-lg">\n'
'      <h2 class="h2-page">%s Service Area Details</h2>\n'
'      <p style="font-size:14px;color:#666;line-height:1.75;max-width:760px;">%s</p>\n'
'      <div style="background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-top:24px;max-width:760px;">\n'
'        <div style="height:120px;background:linear-gradient(rgba(232,76,30,0.05),rgba(232,76,30,0.05)),repeating-linear-gradient(0deg,#f7fafc 0 23px,#e2e8f0 23px 24px),repeating-linear-gradient(90deg,#f7fafc 0 23px,#e2e8f0 23px 24px);display:flex;align-items:center;justify-content:center;" role="img" aria-label="Service area map locator for %s, CA">\n'
'          <div style="text-align:center;">\n'
'            <div style="font-size:30px;line-height:1;">&#128205;</div>\n'
'            <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-top:4px;">%s, CA</div>\n'
'          </div>\n'
'        </div>\n'
'        <div style="padding:16px 20px;">\n'
'          <div style="font-size:12.5px;color:var(--text-sub);line-height:1.7;">%s</div>\n'
'          <a href="https://www.google.com/maps/place/%s/" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:600;color:var(--brand-text);text-decoration:none;">View %s on Google Maps &rarr;</a>\n'
'        </div>\n'
'      </div>\n'
'    </div>\n'
'  </section>\n\n'
'  <!-- PRICING LINE -->') % (nm, issues, nm, city["area"], nm, nm, city["locdesc"], city["mapsq"], nm)

    resources = (
'  <!-- REPAIR RESOURCES -->\n'
'  <section class="section section-gray" style="padding-bottom:40px;">\n'
'    <div class="container-lg">\n'
'      <h2 class="h2-page" style="text-align:center;margin-bottom:8px;">Repair Resources for %s Homeowners</h2>\n'
'      <p style="text-align:center;font-size:13.5px;color:#666;margin-bottom:32px;">Guides written for appliances common in %s homes.</p>\n'
'      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;max-width:940px;margin:0 auto;">\n'
'%s'
'      </div>\n'
'    </div>\n'
'  </section>\n\n'
'  <!-- CTA -->') % (nm, nm, cards)
    return common_and_area, resources

def main(slug):
    city = CITIES[slug]
    f = "pages/appliance-repair-%s-ca.html" % slug
    c = open(f, encoding="utf-8").read()
    # 1. hasMap
    geo_anchor = '      "longitude": "-118.004093"\n    },\n    "sameAs": ['
    geo_new = '      "longitude": "-118.004093"\n    },\n    "hasMap": "%s",\n    "sameAs": [' % CID
    # 2 + 3
    common_area, resources = build(city)
    edits = [
        (geo_anchor, geo_new, "hasMap"),
        ("  <!-- PRICING LINE -->", common_area, "common+area"),
        ("  <!-- CTA -->", resources, "resources"),
    ]
    for old, new, label in edits:
        n = c.count(old)
        if n != 1:
            print("ABORT %s: anchor '%s' matched %d times (expected 1)" % (f, label, n))
            return 1
        c = c.replace(old, new)
    open(f, "w", encoding="utf-8", newline="").write(c)
    print("OK %s: hasMap + Common Issues + Service Area + Repair Resources added" % f)
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
