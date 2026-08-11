# Standing Rule — Verify Platform Policies Before Suggesting External Actions

**Before writing any copy, captions, posts, or instructions for any external platform (Google Business Profile, Instagram, Facebook, TikTok, YouTube, Yelp, or any other third-party service), Claude MUST first verify the platform's current content policies, restrictions, and penalties.**

This is a hard stop — not a suggestion. Unverified advice on live business accounts can result in post rejections, account flags, suspension, or permanent penalties that damage the business's reputation with those platforms.

## What "verify" means in practice

- Check the platform's official help/policy documentation before recommending any action
- If uncertain whether something is allowed, say so explicitly and link to the relevant policy — do NOT guess
- Flag known restrictions proactively before the user acts
- Never assume copy that works on one platform (e.g., Instagram) works on another (e.g., GBP)

## Origin of this rule

In May 2026, Claude suggested GBP post copy with promotional language ("We handle installs, not just repairs") without checking Google's content policy. Two posts were rejected and the account received a content policy violation warning from Google ("your post violates Google's content policy", Routing ID DPNB). This caused real damage to the business's standing with Google.

## GBP-specific rules confirmed — do not deviate

- **Posts must be purely descriptive.** Brand + job type + city. No marketing claims, no comparisons, no promotional framing.
  - ⚠️ **This is OUR house risk rule, stricter than Google's published policy. Do not cite it as Google's own text.** Re-verified 2026-07-30: Google provides a free **Offers** post type explicitly for promotional deals, and the only categorical promotions ban **on the posts content-policy page** is **hotels-only** (that page also incorporates Google's broader prohibited-content policies by reference). The prohibited-content policy does carry a flat "no promotional or commercial content" line, but its examples are review-scoped and Google never states whether it binds owner-authored posts. The two policies are in tension, enforcement is automated, and Google never explains a rejection. Our May 2026 rejection is consistent with the stricter reading, so **the rule stays in force** — we just stop misattributing it.
- **No phone numbers in post body text.** Use the "Call now" button only. (Confirmed on two Google pages: "we do not allow your post content to include a phone number".)
- **No captions on photos.** GBP does not support photo captions. (Confirmed: photo management exposes only photo *type* and the file. Specs: JPG/PNG, 10 KB–5 MB, 720×720 recommended, 250×250 minimum, no heavy filtering, 24–48 h review.)
  - ⚠️ **This is GBP-specific and does NOT generalise. Yelp's photo upload does have a description field** (see the Yelp section). Do not carry "photos have no caption" across platforms — that inference was made on 2026-08-11 and was wrong.
- **Links and CTA buttons ARE allowed** — this is Google's intended mechanism, not a loophole. Update posts support a photo/video plus an action button linking to the site. Do not infer that links are banned by analogy to phone numbers.
- **Avoid "auto-generated" text.** Google's post guidelines name auto-generated content explicitly. Our pipeline is AI-assisted, so a human must read and adjust any GBP post before it is published.
- **Post lifecycle:** every post is auto-reviewed and lands in **Live / Pending / Not approved**. Pending is not rejection; wait before re-posting.
- **Character limit: 1,500** (UI-enforced). Undocumented by Google and absent from the API reference, so treat as product behaviour, not policy. Google publishes **no** recommended length — do not invent one.
- **Approved formula:** `[Brand] [appliance] [job type] — [City], CA.`
- **Example of approved post:** "Replacing old Thermador cooktop with new KitchenAid cooktop in Newport Beach, California" — published without issue.
- **Example of rejected post:** "We handle installs, not just repairs — properly fitted, leveled, and tested before we leave." — rejected for promotional language.

## Yelp — verified 2026-07-30. Sharpest divergence from Google; read before touching Yelp.

- ❌ **NEVER solicit reviews. From anyone. Ever.** Yelp: *"Don't ask anyone to review your business, be it customers, mailing list subscribers, friends, family, etc."* and *"Don't ask for reviews after requesting customer feedback in other places like surveys or contact forms."* Solicited reviews get filtered to the "not recommended" section. Yelp also runs a **Consumer Alerts** program that puts a **public pop-up warning on the business page**; its documented triggers are compensated or incentivized reviews and suspicious review activity, so a plain review request is not itself the stated trigger, but the two sit one step apart and the downside is public and severe. Google permits asking; **Yelp does not**. Never carry a Google review-request tactic across to Yelp.
- ✅ **Sanctioned alternative:** say "Find us on Yelp" with **no** review request. Display Yelp signage. Respond to reviews, including critical ones. Use Request A Quote.
- ❌ **Do not draft "Yelp posts" as if a free posts surface existed.** The documented business-updates product is **Yelp Connect**, which is **paid** (bundled in the Page Upgrade Package). That no free equivalent exists is an **inference from absence** in Yelp's help docs, not a quoted rule, but plan around Connect being paid.
- ❌ **Check-In Offers, Yelp Deals, and Gift Certificates were DISCONTINUED in 2024.** Do not propose them.
- ❌ **No promotional material in the photo gallery** outside a paid ad product; coupon/offer images may be removed.
- ❌ **No customer full names; no close-up photos of customers without permission; no private information.** City-level location only, never a street address.
- ⚠️ **Yelp's Content Guidelines tell owners not to use "chatbots or other AI tools to create reviews or other content."** The exact scope of "other content" is unconfirmed, but treat as binding: **a human writes and owns any Yelp text**, we supply facts, not finished copy.
- ✅ **Photos of real completed work are encouraged.** Yelp explicitly prefers real work over stock and logos. Under 5000×5000 px, unlimited for owners.
- ✅ **Yelp's photo upload HAS a description field** (owner-confirmed from the Yelp business UI, 2026-08-11). A bare GBP photo upload carries no text at all; a Yelp photo can. (Note this is about the *photo upload* specifically, not GBP posts, which do have body text plus an action button.) Two consequences: (a) never assume a platform lacks captions because GBP does; (b) that description **is Yelp text**, so the AI-authorship bullet above governs it — a human writes it. Supply the job facts (appliance, fault, outcome, city, setting) and let the owner write the sentence. Same content limits as everything else on Yelp: city level only, nothing promotional, and claim only what the photo actually shows.

## Instagram — verified 2026-07-30

- **Hashtag cap is 5.** Instagram's Help Center (`help.instagram.com/351460621611097`) states you can use up to 5 tags on a post and that a comment with more than 5 will not post. Use 3–5 specific tags.
  - ⚠️ **The page is JS-rendered, so automated fetches return an empty shell.** Anyone re-verifying this must open it in a real browser. Do not "verify" it from a search-result snippet: cached snippets still show the old cap of 30, and trusting one is exactly how a wrong figure got into this file on 2026-07-30.
  - Whether the cap counts caption and comments combined is **unconfirmed** — assume it does and stay at 5 total.
- **Caption limit ~2,200 chars, ~125 visible** before truncation. Front-load the hook. (Limit unconfirmed on an official page today; help pages are JS-rendered.)
- ✅ **Ordinary marketing language is fine on organic posts.** Meta's Advertising Standards apply to **paid ads only**; organic posts answer to the Community Standards. Before/after photos carry no restriction for appliance work.
- ⚠️ **AI disclosure:** Meta requires disclosure of photorealistic imagery that was digitally created or altered. Real job photos are fine; an AI-generated or AI-enhanced image must be disclosed.
- **Location tagging:** you cannot create a new place. Tag an existing public place (the city), never a customer's home.

## Sources

Re-verified 2026-07-30 against official docs. **One later addition, 2026-08-11:** the Yelp photo-description field is **owner-confirmed from the live business UI**, not from a help-doc citation — it is a product observation, so treat it as current-behaviour rather than published policy, and re-check it if Yelp's upload flow changes. GBP: `support.google.com/business/answer/7213077`, `/7342169`, `/7400114`, `/6103862`. Yelp: `yelp.com/guidelines`, `biz.yelp.com/support-center/Reviews/Best_Practices/Don-t-Ask-for-Reviews/en-US`, `.../What-is-Yelp-Connect`, `.../Yelp-Deals-Gift-Certificates-Check-In-Offers-FAQ-for-Business-Owners`. Instagram: `help.instagram.com/351460621611097`, Meta Community Standards + Advertising Standards at `transparency.meta.com`.
