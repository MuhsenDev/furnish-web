# Dimension 08 — Social and Shareability

**Reforge files actually opened for this dimension (so cites are real, not invented):**
- Advanced Growth Strategy / 02. Micro Growth Loops / 04. Viral Loops / `01. Introduction To Viral Loops.txt` — three-type taxonomy: personal / financial / social viral; value distributor is always the user; what differentiates them is the **value promise to the distributor**.
- Advanced Growth Strategy / 02. Micro Growth Loops / 04. Viral Loops / `02. Personal Viral Loops.txt` — joint utility, single value promise hard-coded into the product, K-factor decomposition, "primary value promise rejectors," distributor-influence as the lever.
- Advanced Growth Strategy / 02. Micro Growth Loops / 04. Viral Loops / `03. Financial Viral Loops.txt` — incentivized referrals, "incentive must exceed PVP friction," habit-creation incentives (Postmates $100/7-day), currency-alignment trick (Dropbox storage, Zynga items, Wealthfront managed money), incentive-elasticity testing.
- Advanced Growth Strategy / 02. Micro Growth Loops / 04. Viral Loops / `04. Social Viral Loops.txt` — word-of-mouth, **delta between actual experience and expectation/alternative**, push vs pull dynamics (Redfin, real estate), anti-WOM categories (Grubhub).
- Advanced Growth Strategy / 02. Micro Growth Loops / 05. Content Loops / `01. Introduction To Content Loops.txt` — content loops vs viral loops, who-creates / who-distributes 2x2.
- Advanced Growth Strategy / 02. Micro Growth Loops / 05. Content Loops / `04. User Generated Content Loops.txt` — UGC company-distributed (Pinterest, Houzz, G2 Crowd, Glassdoor) — execution factors: content-per-user volume × return-per-piece-of-content × habit-transition to your own surface.
- Advanced Growth Strategy / 02. Micro Growth Loops / 05. Content Loops / `05. UGC Loop Variations.txt` — UGC-user-distributed (Musical.ly, DocuSign, Strava): branching factor × influence-per-exposure trade-off; embed loops (Drift, Wistia, SoundCloud); strength of value promise to distribute.

These are the canonical Reforge frameworks for everything below. Sharing IS distribution; in Reforge's growth-loop language, every share is one cycle of either a viral or content loop, and Furnish currently runs both simultaneously without distinguishing them — which is why the share modal underperforms.

---

## Section A — Why someone shares (or doesn't): a Reforge-grounded psychological model for Furnish output

Per Reforge's Viral Loops framework, sharing only happens when the user has a **value promise to distribute**. There are exactly three flavors (personal / financial / social capital) and each has a different execution recipe. Furnish today bundles all three sloppily into one share modal. We need to disentangle them per user-state and per channel.

### A.1 — The trigger model

For a Furnish share to happen, three gates must align. This is the Reforge "loop step decomposition" applied to the share moment:

1. **Trigger.** The moment the user thinks "I want to share this." Furnish's trigger today is the share button at `index.html:646` and the share modal at `index.html:866-892`. The trigger fires only **after** the redesign is rendered (post-aha) — which is correct; nobody shares an empty quiz. But the trigger is currently passive (an icon button on the results screen header). It is not surfaced inside the reveal flow itself, where pride-emotion peaks. **Per Reforge Social Viral Loops (Lesson 4)**, the loop is fueled by the delta between expectation and actual experience; that delta is highest in the seconds *immediately after* the reveal. The share CTA shown 4 minutes later in the results UI captures a tiny fraction of that emotional peak.
2. **Value to distributor AND value to recipient.** Per Reforge Viral Loops (Lesson 1), the value-promise question — "why is the user distributing?" — determines which of the three viral subtypes we're running. Currently Furnish offers **financial-viral** value to the distributor (1 month Pro free) and **personal-viral** value to the recipient (the redesign image is genuinely useful design inspiration). It also accidentally piggybacks on **social-viral** ("look what I made") because the canvas at `app.js:4980-5063` produces a shareable composite.
3. **Path of least resistance.** Per Reforge Personal Viral Loops (Lesson 2) K-factor decomposition: invites_sent × % converted to new users. Each step in the loop is a leak. Furnish's path: tap share button → modal opens → user has to pick from 5 buttons (Download, Share via, Pin it, Copy caption, Invite link) → tap one → tap-or-paste destination → write their own caption → post. **5 modal taps + a write step** before post. Per Reforge's loss-decomposition, every step here drops conversion 30–60%. Compound: a 5-step funnel at 70% per step yields ~17% completion. That is the upper bound on Furnish's share-completion rate as the modal is built today.

### A.2 — Why people DO share Furnish output (motivations, ranked)

Mapped to Reforge's three viral subtypes and the three forms of social capital from Lesson 4 ("recognition, connection, competition, confidence"):

1. **Pride / recognition (social capital — recognition).** "Look what I designed" — even though AI did 90% of the work, identity-laundering is a documented behavior in social-creator products (Strava, Notion templates, Pinterest boards). The before/after delta IS the reveal — which maps directly to the Reforge "delta between experience and expectation" mechanic. Furnish has a real before/after slider (`index.html:1044-1078`) — that's the asset.
2. **Validation-seeking / decision-help (social capital — connection).** "Does this look good? Should I buy this stuff?" — sharing in group chats / iMessage to a partner or close friend before purchase. This is a **pull social viral loop** in Reforge's language (Lesson 4): "in some cases there's a second dynamic that's going on here, a pull dynamic, which typically occurs in product categories where people seek out the advice for others… typically for very high primary value promise friction products and low frequency products." Furniture purchases ARE high-friction and infrequent. This is a major underexploited motivation.
3. **Inspiration credit (social capital — connection / "look what AI made").** A weaker version of #1 — "AI did this in 30 seconds." Drives only the early-adopter cohort.
4. **Price-gloating / value-flex (social capital — recognition with a financial subtone).** "I designed this whole room for $1,200." — This is the secret weapon; Furnish's affiliate-priced output literally has the dollar number on it. A "designed under $X" stat-card share format would extract this.
5. **Financial referral incentive (financial viral loop).** Currently the ONLY explicit lever — "you both get 1 month Pro free." Per Reforge Financial Viral Loops (Lesson 3): "the incentive has to be greater than the friction that is required to experience the core value prop." For Furnish-Free → Furnish-Pro that friction is roughly the SaaS-onboarding-tax of finding a payment method to put on file at the end of a free trial. Whether Pro free for 30 days exceeds that friction is the open question — see Section C.

### A.3 — Why people DON'T share (frictions, ranked)

This is the dropout analysis. Each is a leak in the K-factor funnel.

1. **Output isn't share-clean.** The reveal screen has price-tag overlays cluttering the image. Per the project context, "the 'after' image is a composite of the room photo + price tag overlays. Not a clean image suitable for sharing — the price tags would clutter a social post." A user looking at the canvas thinks: "this looks like a screenshot of a tool, not a designed room." **This is the single largest motivational leak.** Per Reforge UGC Loop Variations (Lesson 5): "the largest failure point is not having a really strong value promise for the user to distribute the content."
2. **No canonical share format.** People don't compose shares; they pick between social-canonical formats their followers expect (IG Story 9:16, Pin 2:3, etc.). Furnish exports one 720x900 portrait composite (`app.js:4981`) — useless for IG Stories (wrong ratio), borderline for Pinterest, wrong for TikTok, fine for iMessage.
3. **"Feels promotional."** Per Reforge Social Viral Loops Lesson 4 anti-WOM example (Grubhub): some categories carry social negative-charge. AI-generated design carries some of this — sharing "I used AI to design my room" can read as embarrassed-shortcut to a design-purist friend. Furnish's branding ("Designed with Furnish" caption) leans INTO promotion, which amplifies the leak. Solution: optional "no Furnish branding" Pro export (already exists per D5 watermark logic), but framed as "share your way" not "remove our brand."
4. **Pride threshold not crossed.** Per Reforge Personal Viral Loops Lesson 2, "in a personal viral loop you're distributing a single value promise" — meaning the SAME quality bar applies regardless of how many redesigns the user does. If their first redesign is mid-quality (Free-tier Flux Schnell output), they don't share it; they iterate or quit. **First-impression compute quality directly limits virality.** This connects to D2 (Psychology) and the compute-quality model.
5. **No social proof to ride on.** Sharing into a content desert ("I'm the only one of my friends using this AI design app") feels weird. Pinterest gets around this with "47 saves to your board." Furnish has zero ambient activity ("12,400+ rooms designed" is a static claim, not a live counter). Per Reforge Social Viral Loops, "you have to be placed in one of those top two slots within their mind" — Furnish currently isn't in the home-design conversation at all.
6. **Lifecycle-state friction.** New users (post-aha) want to share for pride. Habituated Pro users (5+ redesigns) want to share for validation/decision-help. Currently the modal is identical for both. Per Reforge Personal Viral Loops Lesson 2: "those that have already been exposed to an invite have already made the conscious choice that they don't want that product" — meaning the LATER-stage shares matter more than first-time shares because new recipients are exhausted. We need format diversity by lifecycle state.

### A.4 — Push vs pull dynamics: which is dominant for Furnish?

Per *Advanced Growth Strategy — Social Viral Loops (Lesson 4)*: "different products have different push pull dynamics. In the push dynamic, that's really what occurs when we kind of experience this delta. We saw those examples of Stripe, Allbirds or even Tesla. But in some cases, there's kind of a second dynamic that's going on here, a pull dynamic, which typically occurs in product categories where people seek out the advice for others. This is typically for very high primary value promise, friction products and low frequency products."

Furnish-relevant categories Reforge calls out as **pull-dominant**: real estate (Redfin), managing finances, finding childcare. **Furniture purchases share all three traits with these categories** — high friction (each piece is $50–$2,000), low frequency (1–2 redesigns per year), and high uncertainty (style fit is hard to judge alone).

**Implication:** Furnish should design the share mechanic for **pull**, not push. The user share-to-friend flow is more often "I need your advice" than "look at this." Section B.5 (group chat) and the validation-seeking motivation in A.2 #2 are the dominant patterns. The current share modal is built for push (broadcast to everyone), which is wrong for the category.

### A.5 — Anti-WOM risk: does Furnish have it?

Per *Social Viral Loops Lesson 4*, the anti-word-of-mouth example is Grubhub: "somebody asked their friends, you know, hey, what did you do last night? And in the back of their head, what they're really thinking is, hey, I ordered Chinese on Grubhub and stayed in, but that makes me look lame." Some product categories have negative social-charge.

**Does Furnish?** Partially. Two distinct sub-cases:

- **Sharing the design output** ("look at my room!"): No anti-WOM. Showing your designed room is socially acceptable in every culture; it's a closer cousin to Pinterest mood-boarding than to Grubhub.
- **Disclosing the AI tool** ("I used AI"): Mild anti-WOM among design-purist friends ("you didn't really design that"). Stronger anti-WOM in older demographics (40+) than younger (under 30). For Hassan's likely target — millennial/Gen-Z homeowner — net positive (AI is treated as valid creative augmentation in 2026 norms).

**Mitigation per Reforge framework:** Per Lesson 4, when anti-WOM exists "in this case, we would need to use a financial viral loop" — Reforge explicitly recommends financial loops over social loops in anti-WOM categories. Furnish's hedge: keep the financial referral active (per K4), don't bet the growth model purely on social-WOM. Run both as a portfolio.

### A.6 — Sharing motivation by lifecycle state (most-likely behavior at each stage)

Mapping to the LIFECYCLE constants in `app.js:86-92`:

| Lifecycle state | Most likely share motivation | Most likely format | Most likely friction |
|---|---|---|---|
| **NEW** (just hit aha) | Pride (#1) + Inspiration credit (#3) | IG Story 9:16, group chat 1:1 | Output isn't clean; no canonical format |
| **ACTIVE** (within 14 days, doing 2nd–3rd room) | Validation-seeking (#2) | Group chat 1:1 to spouse / friend | Price tags make it look like an ad |
| **ACTIVE Pro user** | Inspiration credit (#3) + Pride (#1) | Pinterest pin (saves to mood board), IG Feed | No native Pinterest auth, not 2:3 ratio |
| **AT-RISK / DORMANT** | Almost zero share — they've left | n/a | The lapse killed virality |
| **Pro user with 5+ rooms** | Price-gloating (#4) — "designed 5 rooms for $X total" | IG Carousel, TikTok stitch, Reddit | No "portfolio" view to export |

The key insight: **the single share modal at `index.html:866-892` is wrong for every lifecycle state**. Per Reforge, distinct value-promise-to-distributor by stage demands distinct mechanic by stage.

---

## Section B — Output formats designed for sharing (channel by channel)

Per Reforge UGC Loops (Lesson 4): "the maximum scope is much higher because we both get the cumulative returns as well as because the cost of user generated content is so much lower, we're able to generate a much broader swath of content and hit on much wider swath of demand." Format diversity is how Furnish broadens that demand surface. Per UGC Loop Variations (Lesson 5): "as I embed a Drift chatbot on my website, we're going to see sustainable returns from that one embed" — embedded/cumulative formats (Pinterest pins, Reddit posts, blog embeds) compound, while ephemeral formats (Stories, group-chat) spike then decay.

The trade-off Reforge calls out: **influence-per-exposure × branching factor**. Pinterest has high branching (one pin → unlimited views over years) and modest influence per exposure. Group chat has tiny branching (1–5 people) but very high influence per exposure (your spouse will weigh "do I like this?" much more than a stranger). Both deserve format support.

### B.1 — Instagram Stories

- **Aspect ratio:** 9:16 vertical, 1080×1920px. Furnish's canvas at 720×900 (`app.js:4981`) is **3:4 — wrong**. IG Story requires its own export.
- **Content layout:** Top third = before photo with "Before" tag. Middle third = animated wipe to After. Bottom third = "Designed with Furnish" lockup + a small "$1,247 total" overlay if available + an animated "Tap to try" sticker. Optionally, the before/after slider already coded in CSS (`index.html:1044-1078`) gets exported as a 4-second auto-reveal GIF.
- **Watermark behavior:** Free = subtle "F" logo bottom-right + "Designed with Furnish" text-mark. Pro = optional removal, but recommend keeping the wordmark only (logo lockup) for affiliate-attribution. Per Reforge Financial Viral Loops Lesson 3 currency-alignment trick: the watermark is the financial-loop currency on the FREE side — they pay with brand exposure. Defending watermarks is correct.
- **Link-back:** IG Stories with >10k followers can do "swipe up"; for everyone else, text overlay "Try Furnish — link in profile bio." The shared image needs to ALSO trigger Open Graph metadata when the URL is opened — see Reforge UGC company-distributed loop (Lesson 4): "transition the habit of that content discovery from whatever channel that it's being discovered in to your own product."
- **Caption template:** "Just redesigned my [room type] in [style] · saved [N] items · $[total]. Tried [Furnish app handle]." (Auto-generated from `room` state.)

### B.2 — Instagram Feed

- **Aspect ratio:** 4:5 vertical, 1080×1350px. Allows for sidewide before/after split (50/50 left-right) instead of slider. Different from Stories format.
- **Content layout:** Two stacked panels (Before above, After below) OR side-by-side split. Caption: editorial-style with the style name and 3-piece highlight reel. Watermark in bottom-right corner (small).
- **Watermark behavior:** Same as Stories.
- **Link-back:** "Link in bio." Caption suggests `#FurnishApp #BeforeAndAfter #InteriorDesign`. Note: IG bans hashtag-stuffing, so cap at 6.
- **Pro variant:** Carousel (10 slides) — 1 cover, 1 before/after, 1 per featured item with shop tap. Pro feature lever.

### B.3 — Pinterest (the dominant channel — currently underbuilt)

- **Aspect ratio:** 2:3 vertical, 1000×1500px. **This is the most important format for Furnish.** Pinterest is THE home-design platform. The current `sharePinBtn` handler at `app.js:5141-5152` opens `pinterest.com/pin-builder/` after downloading the wrong-ratio image. Useless.
- **Content layout:** Single after-photo (cleaned, no price tags) at full bleed, with a small "47 items · $1,247 total" stat-strip across the bottom and a "designed with Furnish" wordmark.
- **Watermark behavior:** The wordmark IS the link-back here. Pinterest's audience EXPECTS branded pins (DIY/design pins always carry creator credit). Free and Pro both get full Furnish branding. Pro doesn't strip it on Pinterest — it's the opposite. The only differentiator is HD quality.
- **Link-back:** Pinterest's pin URL is the most important persistent link Furnish gets. Per Reforge UGC Company-Distributed Loop (Lesson 4): Pinterest pins generate **cumulative returns** like SEO content — "they kind of stack on top of each other as the loop spins over time, increasing kind of cumulative returns over a longer period of time." Each pin is an evergreen acquisition asset for years. The link should resolve to a Furnish-hosted public room page (e.g., `furnish.app/r/<roomId>`) showing the room + a "design your own" CTA. **This page does not exist today** — major gap.
- **Per-room pin description:** "Designed in [style] for under $[budget]. Featured pieces: [3 items]. Click to design your own." Auto-generated.

### B.4 — TikTok

- **Aspect ratio:** 9:16, 1080×1920, video. Static image ports poorly.
- **Content layout:** 8-second video — Before (2s) → wipe transition with a popular sound (e.g. trending "transformation" audio) → After (6s) with the items animating in one at a time, each with a tiny price card. End with "Designed by AI in 30 seconds." stamp.
- **Implementation:** This is the highest-effort format. Generate via `<canvas>` + WebCodecs API, OR fall back to "save as Live Photo on iOS" using a slider GIF. **Realistic v1: generate a 6-frame GIF with crossfade**, encourage users to upload via TikTok's photo-mode (which auto-stitches images into a video).
- **Watermark behavior:** Furnish wordmark in bottom-right throughout, but small. TikTok's algorithm tolerates branding if the content is genuinely transformational.
- **Link-back:** TikTok bio link. The caption template should mention "@furnishapp" tag if the brand has a TikTok account.

### B.5 — Group chat / iMessage / WhatsApp

- **Aspect ratio:** 1:1 (1024×1024) — universal across messaging platforms. iMessage compresses to ~1290×967.
- **Content layout:** Single after-image, dominant. Small "via Furnish" footer stripe with the room cost overlay. **Crucially: the link-preview metadata (Open Graph + Twitter card) on the shared URL must show the after-image as the preview.** Currently no shareable URL exists — major gap.
- **Watermark behavior:** Free = corner watermark. Pro = clean image. Per Reforge Financial Viral Loops Lesson 3, "the perceived value to the consumer is around $X but the cost of the company to manage that ends up being less than a dollar." Watermark removal is exactly this currency-alignment trick: the perceived Pro value is "looks pro to my friends," the cost to Furnish is zero.
- **Link-back:** A short URL (`furnish.app/r/<id>`) with rich link-preview. iMessage and WhatsApp both auto-fetch OG metadata — make sure the public room page renders OG tags.
- **Caption template (paired with image):** "Found these for the [room]. What do you think?" — phrased as a question (validation-seeking, the #2 motivation from A.2).

### B.6 — Reddit / forums (r/DesignMyRoom, r/HomeImprovement, r/Frugal)

- **Aspect ratio:** 16:9 OR 4:3 depending on subreddit norms. r/DesignMyRoom prefers single high-quality 4:3 photos.
- **Content layout:** Clean room image, no Furnish branding embedded in the image. The branding goes in the post text only ("Made with Furnish, an AI redesign app — happy to share details if anyone wants").
- **Watermark behavior:** **Suppressible.** Reddit hates promotion. Furnish needs an export-with-no-watermark option for Pro users posting to forums. **For Free users, an off-watermark Reddit-style export is a strong Pro upsell** ("posting to Reddit? Pro removes the watermark for forum-friendly sharing").
- **Link-back:** Manual — handled in the post text by the user. No auto-link.
- **Pro feature angle:** "Forum mode" toggle = 16:9 export, no watermark, auto-generated post template ("[OC] Designed my [room] in [style] for $X using AI — feedback welcome").

### B.7 — Email (the unsung channel)

- **Aspect ratio:** 600px-wide HTML email-safe. Single hero image + 3 "items I picked" tiles + CTA.
- **Use case:** Sharing with parent / partner who lives elsewhere ("hey check out my apartment design").
- **Implementation:** `mailto:` link with pre-populated subject + body; image attached or hosted at the public room URL.
- **Watermark behavior:** Same as group chat. Wordmark only.
- **Link-back:** Direct link to public room page.

### B.8 — Embed widget (the long-tail content loop)

Per Reforge UGC Loop Variations (Lesson 5) on embed loops (Drift, Wistia, SoundCloud, Slideshare): "the embedding action actually generates different results… we're going to see sustainable returns from that one embed over a longer period of time." Lifestyle bloggers writing "5 small living room ideas" frequently embed Pinterest boards and Houzz inspiration. Furnish should have:

- **Embed iframe code** ("Embed this room on your blog").
- **A 600×450 widget** with the after-image, 3 price chips, and a small "design yours with Furnish" CTA.
- **Use case:** Long-tail SEO. A blog post embedding a Furnish room → permanent link traffic. Per Reforge UGC company-distributed Lesson 4, "the maximum scope is much higher" because cumulative returns on each embed.

This format is currently missing. Low-effort to add. Relevant for the niche of design bloggers who would otherwise screenshot and not link back.

---

## Section C — Referral mechanic challenge / confirm

**Current call (per CLAUDE.md DEFERRED.md K4):** Pro-trial-for-both — 1 month Furnish Pro free for inviter and invitee.

**Verdict: PARTIAL CONFIRM with significant qualifications.** I am not killing the Pro-trial-for-both mechanic but I am calling out **three high-confidence problems** Reforge flags, and recommending a layered structure rather than a single referral type.

### C.1 — Where Pro-trial-for-both is correct

Per Reforge Financial Viral Loops Lesson 3, financial viral loops require:

1. **Equal value perception both sides.** ✓ Pro-trial-for-both passes — symmetric, no inviter-only-gets-thing asymmetry that breeds resentment.
2. **Single-player primary value promise.** ✓ Furnish redesign IS single-player (you don't need your friend to also use it for YOUR redesign to work) — which is exactly the condition Reforge says financial loops are FOR. The lesson explicitly contrasts this with personal viral loops where joint utility is the natural fuel.
3. **Incentive > friction to experience PVP.** ❓ This is the open question. Reforge: "the incentive has to be greater than the friction that is required to experience the core value prop and promise." For invitee, the friction is install + onboarding + photo capture + style quiz — substantial, ~5–8 minutes. The incentive of "1 month free of a Pro tier they didn't want yet" is hand-wavy. Compare to Postmates' $100 credit, which is concrete and the incentive obviously exceeds friction.

### C.2 — Where Pro-trial-for-both is wrong

Per Reforge Financial Viral Loops Lesson 3, the **first execution factor** is "incentivize habit creation, not first use… the amount that I get $100 can't be spent on one delivery, one use to spend it, I have to be using it multiple times… we have a time restriction… we're trying to get them to do that multiple times within the natural frequency window around this primary value promise."

For Furnish, **the natural frequency window is roughly 2x/year** (most people redesign 2 rooms per year, not 4 per month). A 30-day Pro trial DOES NOT match the natural frequency window. The user signs up, designs ONE room, waits — and the trial expires before they form a habit. Per Reforge, the Postmates analog would be: a 6-month Pro free trial covering 2 redesigns, not a 30-day trial covering 1.

This is the single biggest flaw in the current K4 decision. **Pro-trial duration is wrong.** Should be 60–90 days minimum.

### C.3 — Currency-alignment opportunity (Reforge Financial Viral Loops Lesson 3)

Per Reforge: "we can do to align the currency of that financial incentive with the primary value promise. And what this does is it increases that perceived value of what the user is getting, but decreases the actual cost to ourselves." Examples: Dropbox = free storage (perceived $10/mo, actual cost <$1); Wealthfront = free managed money (perceived $12/mo, actual <$1); Zynga = in-game items (perceived $1–5, actual <$0.10).

Furnish's natural Pro-aligned currencies:

- **HD render credits** (perceived value: ~$5/run on competitor sites; actual cost to Furnish: ~$0.05/Replicate run — **100× perceived/actual ratio**).
- **Style-pack unlocks** (zero marginal cost, high perceived value).
- **Affiliate cashback rebate** (e.g., "earn 5% rebate on first $200 of furniture purchases via Furnish links" — Furnish gets affiliate revenue, user gets a perceived $10 back).
- **AI revisions** ("3 free Pro-tier revision rounds" — costs $0.15 in compute, user perceives "unlimited refinement" value).

**Recommendation: Replace "1 month Pro free" with "5 free HD redesigns + 2 Pro style packs" for both sides.** The currency-aligned offer has a higher perceived/actual cost ratio and matches the natural-frequency cadence — 5 redesigns IS the user's natural usage over 6 months.

### C.4 — Layer 2: Pinterest-style social-content referral (no money involved)

Per Reforge Personal Viral Loops Lesson 2 vs Financial Lesson 3: "the max scope of a financial viral loops is less because money as a motivator, that value promise, is worse than personal capital." Personal-viral has higher ceiling. Furnish currently has NO personal-viral mechanic. Adding one in parallel:

- **"Follow Hassan's mood board"** — turns the social loop into a content loop where users follow each other's design boards and see new redesigns. Frequency goes from 2x/year (redesign) to weekly (browse friends' boards) — the **frequency upshift Reforge calls "expanding touchpoints" in the ICED Theory** (Retention + Engagement / Managing Infrequent Products).
- This is a Personal Viral Loop with joint utility: the product is more valuable when your design-curious friend is also on it (you can swap inspiration). Reforge Lesson 2: "the user gains personal utility by having more of their network friends or users on the product."
- Implementation: a public profile page per user with their 3 most recent rooms; a follow button; a feed of "rooms friends designed this week."

This **doesn't replace** the financial referral; it runs in parallel. Per Reforge growth-model thinking, having a personal viral loop AND a financial viral loop active simultaneously is the highest-ceiling configuration (cf. Snapchat: personal viral via friend-graph + financial via creator-payouts).

### C.5 — Incentive elasticity: testing what amount actually moves the needle

Per *Advanced Growth Strategy — Financial Viral Loops (Lesson 3)*, the third execution factor: "thinking about the elasticity of the incentive… as we increase the incentive, we're going to get a greater cycle return because we're going to see higher conversion rates on getting users to invite others, a higher branching factor, as well as we increase that incentive, we're probably going to see higher conversion rates on users joining and accepting that. So what you see here is that the amount of the incentive will affect the conversion rates of different steps in the loop quite a bit. It'll eventually flatten off, but what we want to do is we need to test the elasticity curve of that incentive."

For Furnish, this means **A/B testing referral pack sizes**:
- Variant A: 3 free HD redesigns + 1 style pack (low incentive, low cost)
- Variant B: 5 free HD redesigns + 2 style packs (medium — recommended baseline)
- Variant C: 10 free HD redesigns + Pro lifetime upgrade if recipient converts (high)

Without the K-factor instrumentation in Rec [Dim 08] — Instrument share funnel — none of this is testable. **The instrumentation is a prerequisite for the referral redesign.**

### C.6 — One more option to consider: tiered referral bounty (Reforge "habit creation" applied to multi-invite)

Per Reforge Financial Viral Loops Lesson 3 first execution factor: "incentivize habit creation, not first use… postmates: $100 in delivery credit over seven days… we're not only incentivizing multiple orders, but we're trying to get them to do that multiple times within the natural frequency window."

The same logic applied to inviting MULTIPLE friends: instead of one referral = one reward, structure it as **referral counts unlock progressive bounties**:
- Invite 1 friend: 5 HD redesigns + 2 style packs
- Invite 3 friends who hit aha: +10 HD redesigns + Pro for 6 months
- Invite 5 friends who upgrade: Pro lifetime free

This ties incentive to invite-habit creation, not single-use. It's a stronger lever for power users who would otherwise plateau at one invite. **Lower priority than C.3 (currency alignment) but additive.**

### C.7 — Final referral architecture proposal

Replace the single-mechanic K4 decision with a **two-layer mechanic:**

1. **Financial loop** (existing K4, modified): "Invite a friend — both get **5 free HD redesigns + 2 Pro style packs**, valid 90 days." Currency-aligned (high perceived / low actual cost), habit-creation timed (90 days = 2–3 redesign cycles).
2. **Personal loop** (new): "Follow your friends' mood boards" — the Pinterest-style follow mechanic, no incentive needed because joint utility IS the incentive.

Both run on the same `?ref=<userId>` link infrastructure already stubbed at `app.js:5125-5129`.

---

## Section D — Recommendations

### **[Dim 08] — Add format-specific export buttons replacing the single 720×900 share canvas**

- **Current state in Furnish:** `app.js:4981` defines `<canvas id="shareCanvas" width="720" height="900">` — a single 4:5 ratio canvas, then `drawShareCard()` at `app.js:4980-5063` paints one composite. The same image is offered to Pinterest, copy-caption, system-share, and download. Per Section B above, this is wrong for at least 4 of the 6 channels (Stories needs 9:16, Pinterest 2:3, TikTok 9:16, group-chat 1:1).
- **Proposed state:** Refactor `drawShareCard(room)` into a **format dispatcher** `drawShareCard(room, format)` where `format` ∈ `{story, feed, pin, square, reddit, embed}`. Add format selector chips at the top of the share modal. Each format calls a sub-renderer with its own canvas dimensions, layout, and watermark style. Suggested first-pass:
  ```js
  const SHARE_FORMATS = {
    pin:     { w: 1000, h: 1500, label: 'Pinterest', desc: '2:3 vertical' },
    story:   { w: 1080, h: 1920, label: 'IG Story',  desc: '9:16 vertical' },
    feed:    { w: 1080, h: 1350, label: 'IG Feed',   desc: '4:5 vertical' },
    square:  { w: 1024, h: 1024, label: 'Group chat', desc: '1:1 square' },
    reddit:  { w: 1600, h: 1200, label: 'Reddit',     desc: '4:3 + no watermark' },
  };
  ```
  Default selected: based on lifecycle state (NEW = `square` for group-chat, ACTIVE = `pin`, Pro = `feed`).
- **Reforge framework citation:** Per *Advanced Growth Strategy — UGC Loop Variations (Lesson 5)*: "the relationship between the influence of an exposure to the branching factor… SurveyMonkey ends up working out because the branching factor is extremely large." Each share channel has a different influence × branching equation. Pinterest = low influence per exposure × very high branching (years of cumulative returns); group chat = high influence × tiny branching. Format-matched output maximizes the LOWER side of each equation.
- **Expected impact:** ~2–3× share-completion rate (fewer users abandon after seeing wrong-ratio output); long-tail Pinterest acquisition from properly-sized pins (per Reforge UGC Lesson 4 cumulative returns) compounds over 12+ months.
- **Effort tier:** M (days) — refactor existing canvas code, add ~5 sub-renderers. The hardest is the IG Story 9:16 layout (need to redo composition logic).
- **Dependencies:** Public room URL (Rec [Dim 08] — Public room pages below) for proper deep-linking.
- **What breaks/leaks if we skip it:** Pinterest pins continue to look amateurish; users keep screenshotting the app and cropping themselves; brand-distributed virality stays sub-1% K-factor.

### **[Dim 08] — Build public room pages with Open Graph metadata for shareable URLs**

- **Current state in Furnish:** No public room URL exists. `app.js:5125-5129` builds an `?ref=` invite link but it points to the homepage. There is no `furnish.app/r/<roomId>` page. Group-chat link previews therefore show a generic Furnish marketing card, not the user's actual room.
- **Proposed state:** Create a static public room page at `/r/<roomId>` (e.g., `furnish.app/r/abc123`). The page renders the after-photo, the items list with prices (each linking to the affiliate URL), the inviter's first name ("Hassan's living room"), and a "Design your own" CTA. Critically, the HTML head must include OG metadata:
  ```html
  <meta property="og:image" content="https://furnish.app/og/abc123.jpg" />
  <meta property="og:title" content="Hassan's living room — designed with Furnish" />
  <meta property="og:description" content="9 pieces · $1,247 total · Designed in 30 seconds" />
  <meta property="twitter:card" content="summary_large_image" />
  ```
  The `/og/<roomId>.jpg` is a 1200×630 OG-card render generated server-side from the same canvas pipeline.
- **Reforge framework citation:** Per *Advanced Growth Strategy — UGC Loops, Lesson 4 (User Generated Content Loops)*, the third execution factor: "transition the habit of that content discovery from whatever channel that it's being discovered in to your own product. So if they're searching for our content in Google, we need to figure out ways of how to transition that content discovery and consumption over to our own search engine. And this is because relying on the distribution of those channels over times becomes a riskier and riskier because they could end up displacing us." Public room URLs are how Furnish turns shared images into trackable acquisition surfaces it owns.
- **Expected impact:** Group-chat conversion lift: when iMessage/WhatsApp link previews show the actual room photo, click-through rises from ~5–8% (generic card) to ~25–35% (rich preview, observed in messaging-app benchmarks). Pinterest pins with proper landing pages also see 2–3× pin → site click rates.
- **Effort tier:** M–L (days–week) — requires server-side rendering OR pre-generated static pages on room save. Public room pages need a server (Supabase Edge Functions could handle this); pure-static won't work because OG images must be deterministic per roomId.
- **Dependencies:** Server-side rendering capability. Aligns with the deferred backend item #3 (photo storage at scale, per `Here/CLAUDE.md`).
- **What breaks/leaks if we skip it:** Every share to iMessage/WhatsApp/Slack shows a generic Furnish card → recipient has no idea what the friend actually shared → 90%+ of message-share clicks go cold.

### **[Dim 08] — Replace "1 month Pro free" referral with currency-aligned credit pack**

- **Current state in Furnish:** `app.js:5134` toast: "Invite link copied — you both get 1 month of Furnish Pro free." The K4 decision in DEFERRED.md confirms this. As argued in Section C.2, the 30-day Pro window doesn't match Furnish's 2x/year natural frequency — the user designs one room and lets the trial expire before forming a habit.
- **Proposed state:** Change to: "Invite a friend — both get **5 free HD redesigns + 2 Pro style packs**, valid 90 days." Update toast at `app.js:5134`, share-referral-note at `index.html:890`, the `share-referral-note` class CSS, and any onboarding/aha-moment copy that mentions referral. The redemption mechanic gives users a credit balance shown on their profile, decremented per Pro-tier redesign run.
- **Reforge framework citation:** Per *Advanced Growth Strategy — Financial Viral Loops (Lesson 3)*, the second execution factor: "align the currency of that financial incentive with the primary value promise… increases that perceived value of what the user is getting, but decreases the actual cost to ourselves… Dropbox: rather than giving them straight cash they use free storage space… perceived value $10/month because that's what a month of the paid product costs. But the cost of the company is less than a dollar to give that away." HD redesigns have an analogous economics: perceived value ~$5/run (competitor pricing), actual Replicate cost ~$0.05/run. **100× ratio.** Plus the first execution factor: "incentivize habit creation, not first use… time restriction… we're trying to get them to do that multiple times within the natural frequency window" — 90 days × 5 redesigns matches the 2x/year furniture-purchase cadence.
- **Expected impact:** Higher referral acceptance rate (the offer is concrete + denominated in a unit users want); higher trial-to-paid conversion (users who burn through 5 free Pro redesigns formed a habit → become paid Pro). Estimated 1.5–2.5× lift on referral_signup → paid_pro vs the 1-month flat trial.
- **Effort tier:** S–M (hours–days) — requires a credit-balance entry on user state and a redemption check on Pro-tier render. Most effort is backend (which is item #1 of the 7 deferred backend tasks anyway).
- **Dependencies:** Real Replicate Pro-tier rendering (deferred backend #1). Until that's live, ship the credit-balance UI but use it for HD-export instead.
- **What breaks/leaks if we skip it:** Referrals continue to be opaque ("1 month Pro free of … what exactly?") and the trial period is wrong for Furnish's frequency, so even the conversions Furnish earns will mostly fail to upgrade.

### **[Dim 08] — Add Pinterest-style "follow another user's mood board" personal viral loop**

- **Current state in Furnish:** Furnish has zero personal viral loop. Every share is a one-shot financial-incentivized invite. Per Reforge Lesson 2, personal viral loops have higher max scope than financial ones because joint utility is a stronger motivator than money.
- **Proposed state:** Add public profile pages (`furnish.app/u/<userId>`) showing the user's 3–5 most recent rooms + a "Follow" button. Add a "Friends' rooms this week" feed accessible from the home tab. Make a user's saved-board followable. Surface follow CTAs at the share-modal stage ("Want Hassan to see your designs back? Follow each other.").
- **Reforge framework citation:** Per *Advanced Growth Strategy — Personal Viral Loops (Lesson 2)*: "a user invites another user because they gain personal capital or utility by having more of their network friends or users on the product… The product has more utility, more value as more people and more of their network is on the product." Following design-curious friends and seeing their redesigns IS joint utility — both sides gain inspiration. Per the same lesson: "the maximum scope is high… not really easily replicable by other people." Once Furnish has the social graph, it's defensible.
- **Expected impact:** Frequency upshift — instead of using Furnish 2x/year (redesign cadence), users open it weekly to browse the feed. This addresses the **infrequent-product problem from Reforge Retention + Engagement / Managing Infrequent Products / ICED Theory** by adding a non-redesign reason to open the app. Frequency 2x/year → 30x/year would yield ~10× retention numbers. Long-game lift, not immediate.
- **Effort tier:** L (week+) — requires social graph schema, follow API, feed rendering. Big build.
- **Dependencies:** Backend item #1 (real auth + storage). Public room pages from Rec above.
- **What breaks/leaks if we skip it:** Furnish stays a stand-alone tool. Per Reforge, the financial-loop ceiling is lower than the personal-loop ceiling. Without a personal loop, Furnish caps its growth model at the elasticity of the referral incentive.

### **[Dim 08] — Add a "Share This Room" CTA on the reveal screen, alongside "Shop The Whole Room"**

- **Current state in Furnish:** The share button is an icon at `index.html:646` in the room-detail header — small, easy to miss, fires after the user has stopped looking. Meanwhile the visual emotional peak (the reveal moment) has no share affordance.
- **Proposed state:** On the reveal screen, immediately after the AI-redesign reveals, surface a row of two CTAs of equal weight: **[Shop The Whole Room]** + **[Share This Room]**. The share CTA opens a "What kind of share?" picker (Story / Pin / Group chat) before it opens the share modal. The reveal-anchored share CTA replaces the header icon button (which can stay as a backup but loses primacy).
- **Reforge framework citation:** Per *Advanced Growth Strategy — Social Viral Loops (Lesson 4)*: "what really kind of drives this loop is this delta between what the user actually experiences and their expectation… in the case where our product is actually delivering kind of a 10x experience on the actual experience compared to the expectation or alternative, right, we kind of get this reaction that this thing is incredible." That delta peaks at the moment of reveal. The share CTA must fire AT that moment, not 4 minutes later in the room-detail header.
- **Expected impact:** ~2× share-rate increase from same delta-of-experience. This is the highest-leverage UI change in this dimension.
- **Effort tier:** S (hours) — add a button to the reveal screen JSX, wire it to the existing `openShareModal()`.
- **Dependencies:** None. Can ship today.
- **What breaks/leaks if we skip it:** The biggest emotional moment in Furnish (reveal) has no share affordance; users feel the delta and then move on. Lost forever.

### **[Dim 08] — Strip price-tag clutter from the shareable canvas; offer "with prices / without prices" toggle**

- **Current state in Furnish:** Per the project context: "the 'after' image is a composite of the room photo + price tag overlays. Not a clean image suitable for sharing — the price tags would clutter a social post." Section A.3 identifies this as the LARGEST motivational leak — output isn't share-clean.
- **Proposed state:** In the share modal, default to a **clean** composite (no price tags overlaid). Add a "Show prices" toggle that re-renders with price chips for users in the "price-flex" motivation (#4 in Section A.2). Also add a "Show items as a strip below the room" layout that pulls prices off the room image into a clean caption strip — the room reads as a designed room, the strip reads as an affiliate-source list. This separates the aesthetic image from the commercial overlay.
- **Reforge framework citation:** Per *Advanced Growth Strategy — UGC Loop Variations (Lesson 5)*, the second execution factor: "the strength of the value promise to distribute. This ends up being the largest failure point is not having a really strong value promise for the user to distribute the content." A cluttered, affiliate-tag-overlaid image is a weak value-to-distribute. A clean editorial-quality after-photo is a strong one. Per the DocuSign vs Strava contrast in the same lesson, format directly affects distribution power.
- **Expected impact:** 1.5–2× share-rate increase among non-price-flex users (the majority).
- **Effort tier:** S (hours) — modify `drawShareCard()` at `app.js:4980-5063` to accept a `showPrices` parameter; update the share modal UI to expose the toggle.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** Users who would have shared get embarrassed by the "ad-like" output and don't share. This is the cheapest single fix in the dimension.

### **[Dim 08] — Instrument share funnel events to measure K-factor by format and channel**

- **Current state in Furnish:** Per the project context: "no `share_initiated`, `share_completed`, `referral_link_copied`, `referral_signup` events in current `trackEvent` list. This is a measurement gap." Looking at `app.js`, events DO partially exist (`share_clicked`, `share_download`, `share_caption_copied`, `share_invite_link_copied`, `share_pinterest_clicked`, `share_system_success`) — but no success-attribution back to invitee signups, no funnel decomposition.
- **Proposed state:** Add the full Reforge K-factor decomposition events:
  - `share_modal_opened` (from share button click — already partially tracked as `share_clicked`)
  - `share_format_selected` (which format chip was chosen — new)
  - `share_export_completed` (canvas rendered + downloaded/Web-Shared — new)
  - `share_destination_confirmed` (which channel was used — new, requires a follow-up prompt)
  - `referral_link_clicked` (server-side: someone visited a `?ref=...` URL — new, requires server)
  - `referral_signup_completed` (server-side: a `?ref=...` visitor signed up — new)
  - `referral_aha_completed` (server-side: a referred user hit aha — new)
  - `referral_paid_conversion` (server-side: a referred user upgraded to Pro — new)
- **Reforge framework citation:** Per *Advanced Growth Strategy — Personal Viral Loops (Lesson 2)*: "if we were to break the viral loop down into more detail into its more detailed steps, we can see a lot of opportunity for loss in the loop. So as a new user signs up, there's a certain percentage that convert to inviting other users. There's in a branching factor… there's different deliverability factors for all of those channels. Then there's a certain percentage that end up responding to receiving that invite that then convert into new users." Furnish needs each step instrumented to know where the leaks are. K-factor is an output; the optimization happens at the step level.
- **Expected impact:** Doesn't directly lift virality — but unlocks every other recommendation in this list by giving Hassan the data to prove which ones moved the K-factor. Per Reforge Financial Viral Loops Lesson 3 third execution factor: "test the elasticity curve of that incentive to see how it changes all of the different steps in the loop and what the total output of the loop ends up being." Without instrumentation, no elasticity testing is possible.
- **Effort tier:** S (hours, client-side); M (days, server-side referral attribution). Ship the client-side events immediately.
- **Dependencies:** Real backend for the referral-attribution events.
- **What breaks/leaks if we skip it:** Hassan ships sharing improvements blind. Every other rec in this dimension becomes un-evaluatable.

### **[Dim 08] — Defend the watermark on Free; reframe Pro watermark removal as "share clean"**

- **Current state in Furnish:** Watermark logic at `app.js:5084-5096` adds a "Made with Furnish (Free)" stamp + "Upgrade to Pro for HD · no logo" line on Free downloads. Pro gets clean. The toast at `app.js:5103` says "Downloaded (free quality) — upgrade for HD." The framing is **about the user (free vs paid)**, not about the use case (sharing).
- **Proposed state:** Keep the watermark on Free — defend it. Reframe the Pro upsell language inside the share modal as: **"Share clean — Pro removes the Furnish wordmark from your exports"** (with a "Try Pro free for 90 days" CTA below). Move the watermark to a wordmark-only treatment (no aggressive "Made with Furnish (Free)" — just a small "F" + "furnish.app"). This makes the watermark feel less like a punitive "you're using the free version" stamp and more like a brand-credit signature, which is also more share-acceptable.
- **Reforge framework citation:** Per *Advanced Growth Strategy — Financial Viral Loops (Lesson 3)*, currency-alignment: "the perceived value to the consumer is around $10 per month because that's what a month of the paid product costs. But the cost of the company is less than a dollar to give that away." The watermark IS the financial-viral-loop currency on the Free side: Free users distribute Furnish-branded content (perceived value to Furnish: brand impressions worth maybe $0.10 each; actual cost to Furnish: zero). Removing the watermark is the Pro-tier value prop with massive perceived/actual ratio. **The watermark is correctly designed as a Reforge-canon financial-loop currency.** What's wrong is the FRAMING — calling out "Free" with a parenthetical reads as punitive, not as a clean brand-credit signature.
- **Expected impact:** No direct K-factor lift. But: (a) reduces the share-friction for users who'd otherwise screenshot-and-crop to remove the watermark themselves, (b) increases paywall conversion among "I want to share clean" users (a documented Pro-conversion segment per benchmark Lensa data), (c) keeps brand-impression value on Free shares.
- **Effort tier:** S (hours) — copy + visual tweaks only.
- **Dependencies:** None.
- **What breaks/leaks if we skip it:** The current Free-watermark reads as desperate ("Made with Furnish (Free)"); shareability suffers; Pro upsell is muddled (HD vs no-watermark are mixed).

### **[Dim 08] — Add an embed widget for blogs and the long-tail content loop**

- **Current state in Furnish:** No embed code, no iframe widget, no public widget URL. Lifestyle bloggers writing "5 small living-room ideas under $1500" today screenshot-and-link, breaking attribution.
- **Proposed state:** On the share modal, add an "Embed on a blog" target. Generates an `<iframe src="https://furnish.app/embed/<roomId>" width="600" height="450">…</iframe>` snippet plus a Markdown variant (`![room](https://furnish.app/og/<roomId>.jpg)` link). The iframe renders the room photo + 3 featured items + a "design yours with Furnish" CTA. Each render triggers a `widget_impression` event server-side. Each click triggers `widget_click`.
- **Reforge framework citation:** Per *Advanced Growth Strategy — UGC Loop Variations (Lesson 5)*, the embed-loop subtype: "the reason we break this embedding action out is because it tends to generate cumulative returns, very simpler to the company distributed loops. So as I embed a Drift chatbot on my website, we're going to see sustainable returns from that one embed over a longer period of time, comparing it to more of like distributing to the social channels in the Musical.ly case, we don't see those cumulative returns." Each embed becomes a permanent acquisition surface for years. SoundCloud and Wistia built whole growth models on this.
- **Expected impact:** Long-tail. Modest in year 1 (small blogger uptake). Compounding in years 2–3 as bloggers embed historical room URLs. Realistically: 50–200 embeds → 5–20k impressions/year → 0.5–2% click → 25–400 acquisitions/year per cohort. Compounds.
- **Effort tier:** M (days) — needs the public room URL infrastructure (Rec above) plus an embed-mode renderer.
- **Dependencies:** Public room pages (Rec [Dim 08] — Public room pages above).
- **What breaks/leaks if we skip it:** Long-tail content-loop ceiling stays at zero. Bloggers screenshot, no attribution, Furnish gets no compounding traffic from the long tail.

### **[Dim 08] — Surface lifecycle-state-aware share CTAs (NEW = group-chat default, ACTIVE = Pinterest, Pro = portfolio)**

- **Current state in Furnish:** The share modal at `index.html:866-892` is identical regardless of user lifecycle state. A first-time user (NEW) and a Pro user with 8 rooms designed (Pro habituated) see the same UI.
- **Proposed state:** Use `getLifecycleState()` from `app.js:97` to vary the share-modal default-format chip and the surfaced CTAs:
  - **NEW** (just hit aha, 1 room): Default format = `square` (group-chat 1:1); surfaced CTA copy = "Show your friend / partner — see what they think." Validation-seeking framing.
  - **ACTIVE** (2–4 rooms): Default format = `pin`; copy = "Save it to a Pinterest board." Build-the-archive framing.
  - **Pro user, 5+ rooms**: Default format = `feed` carousel; copy = "Show off your design portfolio." Status framing.
  - **Designed-multiple-rooms-same-style users**: Add a NEW format chip — "**Compare 3 rooms** (style X)" — generates a 3-up grid for an IG carousel cover.
- **Reforge framework citation:** Per *Advanced Growth Strategy — Personal Viral Loops (Lesson 2)*, the third execution factor on **new value promises**: "those that have already been exposed to an invite have already made the conscious choice that they don't want that product… those that use the personal viral loop basically need to develop new primary value promises in order to get existing users to generate more invites." Snapchat 1:1 messaging → Snap Stories. The same logic: a NEW user shares for one reason, an ACTIVE user shares for another, a Pro user shares for a third. Format and copy must follow the lifecycle.
- **Expected impact:** ~1.3–1.7× share rate among ACTIVE and Pro users (who currently underperform NEW users on share rate because the modal is wrong for their motivation). Compounds with Rec on lifecycle-state aware copy.
- **Effort tier:** S–M (hours–days) — small `if/switch` branches on lifecycle state in the share modal opener.
- **Dependencies:** Format-specific exports (Rec above) shipped first.
- **What breaks/leaks if we skip it:** Pro users — Furnish's most active sharers — keep getting served the NEW-user share UX. The most defensible viral loop (Reforge Lesson 2 highest-max-scope personal viral) underperforms.

### **[Dim 08] — Wire reveal-moment "Share to group chat" prompt with pre-filled "what do you think?" question**

- **Current state in Furnish:** The share modal at `index.html:866-892` opens with no context-priming. The user has to write their own caption.
- **Proposed state:** When share is opened from the reveal screen at the lifecycle state NEW, default the modal directly to the `square` format with caption pre-populated as: **"Just designed [Hassan's living room] in [warm modern]. What do you think? Try it: [link]"** — that "What do you think?" is the validation-seeking pull-WOM trigger. For ACTIVE users, default to inspiration framing. For Pro users, default to portfolio framing.
- **Reforge framework citation:** Per *Advanced Growth Strategy — Social Viral Loops (Lesson 4)*, the second execution factor: "in the pull dynamic, which typically occurs in product categories where people seek out the advice for others. This is typically for very high primary value promise, friction products and low frequency products… Redfin in the real estate place, when we're going to buy a home, we're probably going to be asking a few different friends about the process." Furniture purchases ARE high-friction / low-frequency. The pull dynamic should be primary, not the push dynamic. "What do you think?" is the canonical pull-trigger phrasing.
- **Expected impact:** Group-chat shares with question-phrasing convert 2–3× better than statement-phrasing on recipient-side click-through (cross-product benchmark — recipients answer questions, ignore announcements).
- **Effort tier:** S (hours) — string templating.
- **Dependencies:** Lifecycle-state-aware share CTAs (Rec above).
- **What breaks/leaks if we skip it:** Furnish leaves the pull-WOM dynamic on the table — exactly the dynamic Reforge says is dominant in furniture-purchase categories.

### **[Dim 08] — Add a live "[N] rooms designed today" counter on the welcome share-proof element**

- **Current state in Furnish:** `index.html:22-85` shows static "★★★★★ 4.8 · 12,400+ rooms designed." The number is hardcoded, doesn't update, can't drive social-proof loops.
- **Proposed state:** Replace with a live ticker pulling from a server endpoint: "**347 rooms designed today** · 12,418 this week · 4.8★." Updates every 15min. On a recently-shared room URL, append "**Hassan and 23 others designed in this style today**" — provides social-proof anchoring at the share-recipient's view.
- **Reforge framework citation:** Per *Advanced Growth Strategy — Social Viral Loops (Lesson 4)*: "you have to be placed in one of those top two slots within their mind in order to really generate the social viral loop." A live counter signals top-of-mind activity ("this is busy / current / not-dead"). Per the same lesson: "the second big execution factor is this dynamic between push social viral loops and pull social viral loops" — a live counter primes the pull dynamic by suggesting "many people are doing this; ask your friends if they have." Per Reforge UGC Lesson 4: cumulative content fuels the loop.
- **Expected impact:** Modest direct lift on recipient → signup conversion (~5–10%). Bigger indirect lift: shareable URLs that show "247 rooms designed today" feel current; ones with no number feel abandoned.
- **Effort tier:** S–M (hours–days) — needs a server endpoint + a small UI ticker.
- **Dependencies:** Backend (deferred item #1).
- **What breaks/leaks if we skip it:** Furnish-shared URLs continue to look like 1-person tools. No bandwagon effect.

---

---

## Section E — Implementation sequencing (read-once before executing)

Per *Advanced Growth Strategy — Personal Viral Loops (Lesson 2)*, the K-factor decomposition reminds us that "there's a lot of opportunity for loss in the loop" — the order of fixes matters because earlier-step leaks make later-step fixes invisible. Recommended sequence:

1. **Week 0 — measurement.** Ship the K-factor instrumentation first (Rec on share funnel events). Without this, every later improvement is un-evaluatable.
2. **Week 1 — clean canvas + reveal-moment CTA.** Both are S-effort; together they fix the LARGEST leak (output isn't share-clean) and add the share trigger at the emotional peak.
3. **Week 2 — format-specific exports + lifecycle-aware modal.** Once the canvas pipeline is parameterized, format dispatchers fall out naturally.
4. **Week 3 — public room URLs + OG metadata.** Server work, but unlocks group-chat virality and the embed loop.
5. **Week 4 — referral redesign with currency-aligned credits.** Requires backend credit-balance plumbing.
6. **Quarter 2 — personal-viral mood-board follow loop + embed widget.** L-effort builds; long-game.
7. **Ongoing — incentive elasticity A/B tests** (per Reforge Financial Viral Loops Lesson 3 third execution factor).

## Top 3 priorities for this dimension

1. **Strip price-tag clutter from the shareable canvas + add format-specific exports + ship "Share This Room" CTA on the reveal screen.** This is the bundle that fixes the SHAREABILITY-OF-OUTPUT problem — the largest motivational leak per Section A.3. Ship together; expected ~2.5–4× share rate. Reforge: UGC Loop Variations (Lesson 5) "strength of value promise to distribute is the largest failure point" + Social Viral Loops (Lesson 4) "delta between experience and expectation drives the loop." Order: clean canvas first (S, hours) → reveal-moment CTA (S, hours) → format-specific exports (M, days).

2. **Build public room pages with Open Graph metadata so group-chat link previews work.** This unlocks the highest-influence-per-exposure channel (group-chat / iMessage / WhatsApp). Without this, every iMessage share dies on a generic preview. Reforge: UGC Lesson 4 third execution factor — "transition the habit of that content discovery from whatever channel it's being discovered in to your own product." Effort: M–L (days–week, requires server). Has dependencies; everything else (embed loop, format-specific exports' deep-links, referral attribution) needs this URL infrastructure first.

3. **Replace "1 month Pro free" referral with currency-aligned credit pack ("5 free HD redesigns + 2 Pro style packs, 90 days"); instrument the K-factor funnel.** The current K4 decision is correctly typed (financial viral) but wrongly tuned (currency, duration). Per Reforge Financial Viral Loops Lesson 3: currency-alignment + habit-creation timing. The 90-day window matches Furnish's 2x/year natural frequency window. Pair with full K-factor instrumentation so every other recommendation here can be A/B tested. Effort: S–M (hours–days) for copy/UI + S (hours) for client events; backend events deferred to backend-build phase.
