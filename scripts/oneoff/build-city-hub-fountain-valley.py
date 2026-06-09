# -*- coding: utf-8 -*-
"""One-off: build the Fountain Valley city hub from the Tustin hub template.
Transforms a copy of pages/appliance-repair-tustin-ca.html (preserves the
partial-stamped nav/footer + CSS byte-exact) by replacing each content block.
Each replacement is asserted to match exactly once; aborts (no write) otherwise.
Also: geo -> Stanton business base, adds hasMap, bumps dates to 2026-06-09."""
import re

SRC = "pages/appliance-repair-tustin-ca.html"
OUT = "pages/appliance-repair-fountain-valley-ca.html"

c = open(SRC, encoding="utf-8").read()
edits = []

# --- head: title / meta / canonical / og / twitter ---
edits.append(("<title>Appliance Repair Tustin, CA</title>",
              "<title>Appliance Repair Fountain Valley, CA</title>"))
TDESC = "Same-day appliance repair in Tustin, CA. Old Town, Tustin Ranch, Tustin Legacy &amp; North Tustin. Refrigerators, washers, dryers, ovens. Call (949) 629-5365."
FDESC = "Same-day appliance repair in Fountain Valley, CA. Green Valley, the Mile Square area &amp; all of 92708. Refrigerators, washers, dryers, ovens. Call (949) 629-5365."
edits.append((TDESC, FDESC, 3))  # description, og:description, twitter:description
edits.append(('content="appliance repair Tustin, refrigerator repair Tustin, washer repair Tustin Ranch, dryer repair Tustin Legacy, oven repair Tustin CA, same-day appliance service Tustin, appliance repair 92780, appliance repair 92782"',
              'content="appliance repair Fountain Valley, refrigerator repair Fountain Valley, washer repair 92708, dryer repair Fountain Valley CA, oven repair Fountain Valley, same-day appliance service Fountain Valley"'))
edits.append(("https://fixappliancesfast.com/pages/appliance-repair-tustin-ca.html",
              "https://fixappliancesfast.com/pages/appliance-repair-fountain-valley-ca.html", 4))  # canonical, og:url, Article url, BreadcrumbList item
edits.append(('content="Appliance Repair Tustin, CA"',
              'content="Appliance Repair Fountain Valley, CA"', 2))  # og:title, twitter:title

# --- Article + Service schema name (same string appears twice) ---
edits.append(('"Appliance Repair in Tustin, CA"', '"Appliance Repair in Fountain Valley, CA"', 2))
edits.append(('"description": "Same-day appliance repair in Tustin, CA. Serving Old Town Tustin, Tustin Ranch, Tustin Legacy, Columbus Square, Tustin Meadows, and North Tustin. Whirlpool, GE, Samsung, LG, KitchenAid, Bosch, and all major brands.",',
              '"description": "Same-day appliance repair in Fountain Valley, CA. Serving Green Valley, Downtown Village, and the Mile Square Regional Park area in ZIP 92708. Whirlpool, GE, Samsung, LG, KitchenAid, Bosch, and all major brands.",'))
edits.append(('"datePublished": "2026-06-08T00:00:00+00:00",\n    "dateModified": "2026-06-08T00:00:00+00:00",',
              '"datePublished": "2026-06-09T00:00:00+00:00",\n    "dateModified": "2026-06-09T00:00:00+00:00",'))

# --- LocalBusiness: geo -> Stanton base, add hasMap, areaServed city ---
edits.append(('"latitude": "33.745800",\n      "longitude": "-117.826100"',
              '"latitude": "33.805113",\n      "longitude": "-118.004093"'))
edits.append(('"longitude": "-118.004093"\n    },\n    "sameAs": [',
              '"longitude": "-118.004093"\n    },\n    "hasMap": "https://www.google.com/maps?cid=6142328803939874574",\n    "sameAs": ['))
edits.append(('{ "@type": "City", "name": "Tustin", "addressRegion": "CA" },',
              '{ "@type": "City", "name": "Fountain Valley", "addressRegion": "CA" },'))
edits.append(('"@type": "City",\n      "name": "Tustin",\n      "addressRegion": "CA",',
              '"@type": "City",\n      "name": "Fountain Valley",\n      "addressRegion": "CA",'))

# --- BreadcrumbList ---
# URL already swapped by the global replace above; only the breadcrumb display name remains
edits.append(('"name": "Appliance Repair Tustin CA",',
              '"name": "Appliance Repair Fountain Valley CA",'))

# --- FAQPage schema (whole mainEntity array) ---
TFAQ_SCHEMA = '''    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do you offer same-day appliance repair in Tustin, CA?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Same-day appliance repair is usually available in Tustin when you call before noon. Technicians reach most Tustin addresses quickly via the 5 and 55 freeways and Jamboree Road. Call (949) 629-5365 to confirm same-day availability for your address." }
      },
      {
        "@type": "Question",
        "name": "Which Tustin ZIP codes and neighborhoods do you cover?",
        "acceptedAnswer": { "@type": "Answer", "text": "We cover all of Tustin under ZIP codes 92780 and 92782, including Old Town Tustin, Tustin Ranch, Tustin Legacy, Columbus Square, Columbus Grove, Tustin Meadows, and Lower Peters Canyon. We also serve the adjacent unincorporated North Tustin area in ZIP 92705, including Lemon Heights and Cowan Heights. There are no travel surcharges for any Tustin address." }
      },
      {
        "@type": "Question",
        "name": "Do you service Tustin Ranch and Tustin Legacy homes?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Tustin Ranch homes from the 1990s often have original built-in appliances reaching 25 to 30 years old, and Tustin Legacy's newer construction comes with builder-installed appliance sets that are now aging out of manufacturer warranty. We repair both: original built-ins and out-of-warranty builder packages from Whirlpool, GE, Samsung, LG, KitchenAid, and Bosch." }
      },
      {
        "@type": "Question",
        "name": "How much does an appliance service call cost in Tustin?",
        "acceptedAnswer": { "@type": "Answer", "text": "Our diagnostic fee is $99, and it is applied toward the repair if you proceed. You receive a firm quote after diagnosis, before any work begins. Estimates vary by brand, part availability, and diagnosis. Final quote is provided before repair." }
      },
      {
        "@type": "Question",
        "name": "Which appliance brands do you repair in Tustin?",
        "acceptedAnswer": { "@type": "Answer", "text": "We service all major brands common in Tustin homes, including Whirlpool, GE, Samsung, LG, KitchenAid, Bosch, Maytag, Frigidaire, and Kenmore, plus premium brands like Sub-Zero, Wolf, Thermador, Viking, and Miele found in Tustin Ranch and North Tustin custom homes." }
      },
      {
        "@type": "Question",
        "name": "Is your appliance repair work covered by a warranty?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. All repairs carry a 90-day warranty on parts and labor. If the same issue recurs within the warranty period, we return and fix it at no additional charge." }
      }
    ]'''
FFAQ_SCHEMA = '''    "mainEntity": [
      {
        "@type": "Question",
        "name": "Do you offer same-day appliance repair in Fountain Valley, CA?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Same-day appliance repair is usually available in Fountain Valley when you call before noon. We dispatch from nearby Stanton and reach most addresses via the 405 and 22 freeways and Brookhurst Street. Call (949) 629-5365 to confirm same-day availability for your address." }
      },
      {
        "@type": "Question",
        "name": "Which Fountain Valley ZIP codes and neighborhoods do you cover?",
        "acceptedAnswer": { "@type": "Answer", "text": "We cover all of Fountain Valley under ZIP code 92708, including Green Valley, Downtown Village, the neighborhoods around Mile Square Regional Park, and the Talbert, Warner, and Brookhurst corridors. There are no travel surcharges for any Fountain Valley address." }
      },
      {
        "@type": "Question",
        "name": "Do you repair older appliances in Fountain Valley's 1960s and 1970s tract homes?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. Much of Fountain Valley was built in the 1960s and 1970s, so we see a lot of aging appliances: top-load washers with worn transmissions, gas ranges with weak igniters, and refrigerators on decades-old compressors. Many are still worth repairing, and we tell you honestly when a unit has reached the end of its life." }
      },
      {
        "@type": "Question",
        "name": "How much does an appliance service call cost in Fountain Valley?",
        "acceptedAnswer": { "@type": "Answer", "text": "Our diagnostic fee is $99, and it is applied toward the repair if you proceed. You receive a firm quote after diagnosis, before any work begins. Estimates vary by brand, part availability, and diagnosis. Final quote is provided before repair." }
      },
      {
        "@type": "Question",
        "name": "Which appliance brands do you repair in Fountain Valley?",
        "acceptedAnswer": { "@type": "Answer", "text": "We service all major brands common in Fountain Valley homes, including Whirlpool, GE, Samsung, LG, KitchenAid, Bosch, Maytag, Frigidaire, and Kenmore, plus premium brands like Sub-Zero, Wolf, Thermador, Viking, and Miele in remodeled and larger homes." }
      },
      {
        "@type": "Question",
        "name": "Is your appliance repair work covered by a warranty?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes. All repairs carry a 90-day warranty on parts and labor. If the same issue recurs within the warranty period, we return and fix it at no additional charge." }
      }
    ]'''
edits.append((TFAQ_SCHEMA, FFAQ_SCHEMA))

# --- Reviews ItemList (3 testimonials) ---
TREVIEWS = '''      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Surma Karimova" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "reviewBody": "Ag fixed my General Electric oven. Fast service!!! Thank you",
        "itemReviewed": { "@id": "https://fixappliancesfast.com/#business" }
      },
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "B P" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "reviewBody": "Super reliable & goes above to help solve your problems!",
        "itemReviewed": { "@id": "https://fixappliancesfast.com/#business" }
      },
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Darina Martirosyan" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "reviewBody": "Thank you for fixing my microwave !!!",
        "itemReviewed": { "@id": "https://fixappliancesfast.com/#business" }
      }'''
FREVIEWS = '''      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Lale" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "reviewBody": "AG fixed my old GE Monogram refrigerator. Very friendly, fast and good service. Recommend",
        "itemReviewed": { "@id": "https://fixappliancesfast.com/#business" }
      },
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Pawan Deepak" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "reviewBody": "Agee was very professional and did a great job repairing the light fixture of the hood.",
        "itemReviewed": { "@id": "https://fixappliancesfast.com/#business" }
      },
      {
        "@type": "Review",
        "author": { "@type": "Person", "name": "Marcy Kucik" },
        "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
        "reviewBody": "Absolutely excellent! AG fixed my refrigerator in a timely and professional manner with great customer service. He is now my go-to for appliance repair. I highly recommend AG as your tech.",
        "itemReviewed": { "@id": "https://fixappliancesfast.com/#business" }
      }'''
edits.append((TREVIEWS, FREVIEWS))

# --- HERO ---
edits.append(('<h1>Appliance Repair in<br/>Tustin, CA</h1>\n      <p>Serving Old Town, Tustin Ranch, Tustin Legacy and all of central Orange County. Same-day service. Licensed and insured.</p>',
              '<h1>Appliance Repair in<br/>Fountain Valley, CA</h1>\n      <p>Serving Green Valley, the Mile Square area and all of central Orange County. Same-day service. Licensed and insured.</p>'))

# --- BREADCRUMB visible label ---
edits.append(('<span style="color:#333;">Appliance Repair Tustin, CA</span>',
              '<span style="color:#333;">Appliance Repair Fountain Valley, CA</span>'))

# --- AI ANSWER BLOCK ---
edits.append(('<p>Universal Appliances Repair Group Inc. provides appliance repair in Tustin, California, including Old Town Tustin, Tustin Ranch, Tustin Legacy, Columbus Square, and Tustin Meadows (ZIP codes 92780 and 92782), plus the adjacent North Tustin area (92705). We repair refrigerators, washers, dryers, dishwashers, ovens, stoves, freezers, microwaves, wine coolers, and garbage disposals from brands including Whirlpool, GE, Samsung, LG, KitchenAid, Bosch, Sub-Zero, and Wolf. Same-day appointments are usually available when you call by midday. Call (949) 629-5365 or book online at fixappliancesfast.com.</p>',
              '<p>Universal Appliances Repair Group Inc. provides appliance repair in Fountain Valley, California, including Green Valley, Downtown Village, and the neighborhoods around Mile Square Regional Park (ZIP code 92708). We repair refrigerators, washers, dryers, dishwashers, ovens, stoves, freezers, microwaves, wine coolers, and garbage disposals from brands including Whirlpool, GE, Samsung, LG, KitchenAid, Bosch, Sub-Zero, and Wolf. Same-day appointments are usually available when you call by midday. Call (949) 629-5365 or book online at fixappliancesfast.com.</p>'))

# --- COMMON SYMPTOMS (intro line + last item) ---
edits.append(('Here are the symptoms we diagnose every day across Tustin.',
              'Here are the symptoms we diagnose every day across Fountain Valley.'))
edits.append(('<div class="symptom-item">Stackable washer or dryer in a condo not starting</div>',
              '<div class="symptom-item">Washer leaking from a worn door boot seal</div>'))
edits.append(('<div class="symptom-item">Builder-installed appliance failing just out of warranty</div>',
              '<div class="symptom-item">Original 1970s built-in appliance finally failing</div>'))

# --- NEIGHBORHOODS (whole section inner) ---
T_NB_H2 = '<h2 class="h2-page">Tustin Neighborhoods We Serve</h2>'
edits.append((T_NB_H2, '<h2 class="h2-page">Fountain Valley Neighborhoods We Serve</h2>'))
edits.append(('<p style="font-size:14px;color:#666;line-height:1.7;max-width:700px;">Tustin spans everything from a 19th-century Old Town to brand-new construction at Tustin Legacy, and the appliances change with the housing stock. We cover every neighborhood in ZIP codes 92780 and 92782, plus unincorporated North Tustin, with no travel surcharges.</p>',
              '<p style="font-size:14px;color:#666;line-height:1.7;max-width:700px;">Fountain Valley is a compact, family-oriented city built mostly of 1960s and 1970s single-family tract homes around Mile Square Regional Park. We cover every neighborhood in ZIP code 92708, with no travel surcharges.</p>'))
# Replace the 9 Tustin neighborhood cards (from first card open to the grid close) with FV cards.
T_CARDS = c[c.index('<div class="neighborhoods-grid">'):c.index('</div>\n      </div>\n    </div>\n  </section>\n\n  <!-- BRANDS -->')]
F_CARDS = '''<div class="neighborhoods-grid">
        <div class="neighborhood-card">
          <div class="neighborhood-name">Green Valley</div>
          <div class="neighborhood-zip">ZIP 92708</div>
          <div class="neighborhood-note">Family-focused area near Mile Square Park. 1960s and 70s tract homes with appliances now well past the 20-year mark.</div>
        </div>
        <div class="neighborhood-card">
          <div class="neighborhood-name">Downtown Village</div>
          <div class="neighborhood-zip">ZIP 92708</div>
          <div class="neighborhood-note">The town-center area along the Slater and Brookhurst corridor. A mix of original and replacement appliances.</div>
        </div>
        <div class="neighborhood-card">
          <div class="neighborhood-name">Mile Square Park area</div>
          <div class="neighborhood-zip">ZIP 92708</div>
          <div class="neighborhood-note">Established neighborhoods ringing the 640-acre regional park. Original built-in ovens and ranges reaching repair-or-replace age.</div>
        </div>
        <div class="neighborhood-card">
          <div class="neighborhood-name">Talbert &amp; Brookhurst</div>
          <div class="neighborhood-zip">ZIP 92708</div>
          <div class="neighborhood-note">Central tract homes near the Recreation Center &amp; Sports Park. Top-load washers and aging refrigerators are common calls.</div>
        </div>
        <div class="neighborhood-card">
          <div class="neighborhood-name">Warner &amp; Magnolia</div>
          <div class="neighborhood-zip">ZIP 92708</div>
          <div class="neighborhood-note">North-side neighborhoods near Fountain Valley Regional Hospital. Many kitchens have been remodeled with high-efficiency units.</div>
        </div>
        <div class="neighborhood-card">
          <div class="neighborhood-name">Slater &amp; Euclid</div>
          <div class="neighborhood-zip">ZIP 92708</div>
          <div class="neighborhood-note">South-east Fountain Valley near the Santa Ana River Trail. Single-family homes with a mix of mainstream and premium appliances.</div>
        </div>
      </div>'''
edits.append((T_CARDS, F_CARDS))

# --- BRANDS intro ---
edits.append(('Tustin Legacy and Columbus Square run heavily on builder-grade packages from Whirlpool, GE, Samsung, and KitchenAid, while Tustin Ranch and North Tustin custom homes add built-in and premium brands. We service the full range.',
              'Fountain Valley\'s 1960s and 1970s tract homes run mostly mainstream brands like Whirlpool, GE, Samsung, and KitchenAid, with built-in and premium brands in remodeled and larger homes. We service the full range.'))

# --- BRANDS h2 ---
edits.append(('<h2 class="h2-page" style="text-align:center;">Brands We Service in Tustin</h2>',
              '<h2 class="h2-page" style="text-align:center;">Brands We Service in Fountain Valley</h2>'))

# --- SERVICES h2 ---
edits.append(('<h2 class="h2-page" style="text-align:center;">Services We Offer in Tustin</h2>',
              '<h2 class="h2-page" style="text-align:center;">Services We Offer in Fountain Valley</h2>'))

# --- REPAIR PROCESS step 2 freeway ref ---
edits.append(('Your technician arrives via the 5 or 55 freeway and runs a full diagnostic on your appliance. The $99 fee is credited toward the repair.',
              'Your technician arrives via the 405 or 22 freeway and runs a full diagnostic on your appliance. The $99 fee is credited toward the repair.'))

# --- LANDMARKS / About ---
edits.append(('<h2 class="h2-page">About Tustin</h2>', '<h2 class="h2-page">About Fountain Valley</h2>'))
T_LAND = '''<p>Tustin sits at the center of Orange County, bordered by <a href="appliance-repair-santa-ana-ca.html">Santa Ana</a>, <a href="appliance-repair-irvine-ca.html">Irvine</a>, and <a href="appliance-repair-orange-ca.html">Orange</a>. Few OC cities cover this much housing history in one place: the <strong>Old Town historic district</strong> dates to the 1880s, <strong>Tustin Meadows</strong> and the central tracts filled in through the 1960s and 70s, <strong>Tustin Ranch</strong> brought Mediterranean-style homes and the <strong>Tustin Ranch Golf Club</strong> in the 1990s, and <strong>Tustin Legacy</strong> is still building out on the former Marine Corps Air Station beneath its landmark WWII blimp hangar. Residents shop at <strong>The Market Place</strong> on Jamboree Road and hike <strong>Peters Canyon Regional Park</strong> on the east side. That spread of home ages means we see everything here: 30-year-old built-ins in Tustin Ranch, aging tract appliances near <strong>Centennial Park</strong>, and builder-grade packages in Tustin Legacy failing just past their warranty.</p>'''
F_LAND = '''<p>Fountain Valley is a quiet, family-oriented city in central Orange County, bordered by <a href="appliance-repair-huntington-beach-ca.html">Huntington Beach</a>, <a href="appliance-repair-santa-ana-ca.html">Santa Ana</a>, and <a href="appliance-repair-costa-mesa-ca.html">Costa Mesa</a>. Its motto, "A Nice Place to Live," fits a city built mostly of 1960s and 1970s single-family tract homes around the 640-acre <strong>Mile Square Regional Park</strong>, with its golf courses, fishing lakes, and Friday farmers market. Families gather at the <strong>Fountain Valley Recreation Center &amp; Sports Park</strong> and along the <strong>Santa Ana River Trail</strong>, and <strong>Fountain Valley Regional Hospital</strong> anchors the Warner corridor. Because so much of the housing dates to the same two decades, the appliances age in waves: original built-ins and decades-old refrigerators, washers, and ranges are the bulk of what we repair here, alongside the high-efficiency units in remodeled kitchens.</p>'''
edits.append((T_LAND, F_LAND))

# --- TESTIMONIAL CARDS (3) ---
T_TCARDS = '''<div class="testimonial-card">
          <div class="stars" role="img" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-quote">"Ag fixed my General Electric oven. Fast service!!! Thank you"</p>
          <div class="t-initial" style="background:#444444;">SK</div>
          <div class="testimonial-name">Surma Karimova &middot; GE oven repair &middot; Orange County, CA</div>
        </div>

        <div class="testimonial-card">
          <div class="stars" role="img" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-quote">"Super reliable &amp; goes above to help solve your problems!"</p>
          <div class="t-initial" style="background:#444444;">BP</div>
          <div class="testimonial-name">B P &middot; Orange County, CA</div>
        </div>

        <div class="testimonial-card">
          <div class="stars" role="img" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-quote">"Thank you for fixing my microwave !!!"</p>
          <div class="t-initial" style="background:#444444;">DM</div>
          <div class="testimonial-name">Darina Martirosyan &middot; Microwave repair &middot; Orange County, CA</div>
        </div>'''
F_TCARDS = '''<div class="testimonial-card">
          <div class="stars" role="img" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-quote">"AG fixed my old GE Monogram refrigerator. Very friendly, fast and good service. Recommend"</p>
          <div class="t-initial" style="background:#444444;">L</div>
          <div class="testimonial-name">Lale &middot; GE Monogram refrigerator repair &middot; Orange County, CA</div>
        </div>

        <div class="testimonial-card">
          <div class="stars" role="img" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-quote">"Agee was very professional and did a great job repairing the light fixture of the hood."</p>
          <div class="t-initial" style="background:#444444;">PD</div>
          <div class="testimonial-name">Pawan Deepak &middot; Range hood repair &middot; Orange County, CA</div>
        </div>

        <div class="testimonial-card">
          <div class="stars" role="img" aria-label="5 out of 5 stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
          <p class="testimonial-quote">"Absolutely excellent! AG fixed my refrigerator in a timely and professional manner with great customer service. He is now my go-to for appliance repair. I highly recommend AG as your tech."</p>
          <div class="t-initial" style="background:#444444;">MK</div>
          <div class="testimonial-name">Marcy Kucik &middot; Refrigerator repair &middot; Orange County, CA</div>
        </div>'''
edits.append((T_TCARDS, F_TCARDS))

# --- FAQ accordion (visible) ---
T_FAQ_VIS = '''<button class="faq-q">Do you offer same-day appliance repair in Tustin, CA?<span class="icon">+</span></button>
          <div class="faq-a">Yes. Same-day appliance repair is usually available in Tustin when you call before noon. Technicians reach most Tustin addresses quickly via the 5 and 55 freeways and Jamboree Road. Call (949) 629-5365 to confirm same-day availability for your address.</div>'''
F_FAQ_VIS = '''<button class="faq-q">Do you offer same-day appliance repair in Fountain Valley, CA?<span class="icon">+</span></button>
          <div class="faq-a">Yes. Same-day appliance repair is usually available in Fountain Valley when you call before noon. We dispatch from nearby Stanton and reach most addresses via the 405 and 22 freeways and Brookhurst Street. Call (949) 629-5365 to confirm same-day availability for your address.</div>'''
edits.append((T_FAQ_VIS, F_FAQ_VIS))
edits.append(('''<button class="faq-q">Which Tustin ZIP codes and neighborhoods do you cover?<span class="icon">+</span></button>
          <div class="faq-a">We cover all of Tustin under ZIP codes 92780 and 92782, including Old Town Tustin, Tustin Ranch, Tustin Legacy, Columbus Square, Columbus Grove, Tustin Meadows, and Lower Peters Canyon. We also serve the adjacent unincorporated North Tustin area in ZIP 92705, including Lemon Heights and Cowan Heights. There are no travel surcharges for any Tustin address.</div>''',
              '''<button class="faq-q">Which Fountain Valley ZIP codes and neighborhoods do you cover?<span class="icon">+</span></button>
          <div class="faq-a">We cover all of Fountain Valley under ZIP code 92708, including Green Valley, Downtown Village, the neighborhoods around Mile Square Regional Park, and the Talbert, Warner, and Brookhurst corridors. There are no travel surcharges for any Fountain Valley address.</div>'''))
edits.append(('''<button class="faq-q">Do you service Tustin Ranch and Tustin Legacy homes?<span class="icon">+</span></button>
          <div class="faq-a">Yes. Tustin Ranch homes from the 1990s often have original built-in appliances reaching 25 to 30 years old, and Tustin Legacy's newer construction comes with builder-installed appliance sets that are now aging out of manufacturer warranty. We repair both: original built-ins and out-of-warranty builder packages from Whirlpool, GE, Samsung, LG, KitchenAid, and Bosch.</div>''',
              '''<button class="faq-q">Do you repair older appliances in Fountain Valley's 1960s and 1970s tract homes?<span class="icon">+</span></button>
          <div class="faq-a">Yes. Much of Fountain Valley was built in the 1960s and 1970s, so we see a lot of aging appliances: top-load washers with worn transmissions, gas ranges with weak igniters, and refrigerators on decades-old compressors. Many are still worth repairing, and we tell you honestly when a unit has reached the end of its life.</div>'''))
edits.append(('How much does an appliance service call cost in Tustin?<span class="icon">+</span></button>\n          <div class="faq-a">Our diagnostic fee is $99, and it is applied toward the repair if you proceed. You receive a firm quote after diagnosis, before any work begins. Estimates vary by brand, part availability, and diagnosis. Final quote is provided before repair.</div>',
              'How much does an appliance service call cost in Fountain Valley?<span class="icon">+</span></button>\n          <div class="faq-a">Our diagnostic fee is $99, and it is applied toward the repair if you proceed. You receive a firm quote after diagnosis, before any work begins. Estimates vary by brand, part availability, and diagnosis. Final quote is provided before repair.</div>'))
edits.append(('''<button class="faq-q">Which appliance brands do you repair in Tustin?<span class="icon">+</span></button>
          <div class="faq-a">We service all major brands common in Tustin homes, including Whirlpool, GE, Samsung, LG, KitchenAid, Bosch, Maytag, Frigidaire, and Kenmore, plus premium brands like <a href="sub-zero-appliance-repair-orange-county.html" style="color:var(--brand-text);font-weight:600;text-decoration:none;">Sub-Zero</a>, <a href="wolf-appliance-repair-orange-county.html" style="color:var(--brand-text);font-weight:600;text-decoration:none;">Wolf</a>, Thermador, Viking, and Miele found in Tustin Ranch and North Tustin custom homes.</div>''',
              '''<button class="faq-q">Which appliance brands do you repair in Fountain Valley?<span class="icon">+</span></button>
          <div class="faq-a">We service all major brands common in Fountain Valley homes, including Whirlpool, GE, Samsung, LG, KitchenAid, Bosch, Maytag, Frigidaire, and Kenmore, plus premium brands like <a href="sub-zero-appliance-repair-orange-county.html" style="color:var(--brand-text);font-weight:600;text-decoration:none;">Sub-Zero</a>, <a href="wolf-appliance-repair-orange-county.html" style="color:var(--brand-text);font-weight:600;text-decoration:none;">Wolf</a>, Thermador, Viking, and Miele in remodeled and larger homes.</div>'''))

# --- FAQ section heading + CTA ---
edits.append(('<h2 class="h2-page" style="text-align:center;">FAQ: Tustin Appliance Repair</h2>',
              '<h2 class="h2-page" style="text-align:center;">FAQ: Fountain Valley Appliance Repair</h2>'))
edits.append(('<h2>Need Appliance Repair in Tustin?</h2>\n        <p>Same-day service available in Old Town, Tustin Ranch, Tustin Legacy, and all of Tustin. Licensed technicians, 90-day warranty on every repair.</p>',
              '<h2>Need Appliance Repair in Fountain Valley?</h2>\n        <p>Same-day service available in Green Valley, Downtown Village, and all of Fountain Valley. Licensed technicians, 90-day warranty on every repair.</p>'))

# Apply with assertions
for e in edits:
    old, new = e[0], e[1]
    exp = e[2] if len(e) > 2 else 1
    n = c.count(old)
    if n != exp:
        print("ABORT: expected %d match(es), got %d for: %.70r" % (exp, n, old))
        raise SystemExit(1)
    c = c.replace(old, new)

open(OUT, "w", encoding="utf-8", newline="").write(c)
# sanity: no 'Tustin' left
left = c.count("Tustin")
print("WROTE %s | residual 'Tustin' occurrences: %d" % (OUT, left))
