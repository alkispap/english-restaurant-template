# Listing Media Rights and Enrichment Policy — 2026-07-16

## Technical summary

The directory previously treated a remotely loadable image as publishable. That was not a sufficient rights control: all 59 gallery URLs and 2,877 logos could be traced to the historical CSV, but none carried creator, licence, permission, or attribution evidence.

Phase 5E moved all 2,936 unknown-rights assets into a server-side registry and removed them from published listing/search data. The original URLs and source lineage remain available for review, while the website uses its designed non-image fallbacks. No asset can return through the enrichment command unless the write includes explicit source and rights evidence.

The site remains `not_ready`: 0 of the 100 launch-priority listings has a rights-approved gallery image. Long-tail coverage is a medium post-launch improvement rather than a requirement to clear all 3,186 images before launch.

## Unknown-rights media is no longer publicly exposed

| Control | Before Phase 5E | After Phase 5E | Result |
| --- | ---: | ---: | --- |
| Public gallery URLs | 59 | 0 | Unknown-rights gallery media quarantined |
| Public remote logos | 2,877 | 0 | Unknown-rights logo media quarantined |
| Traceable registry assets | 0 | 2,936 | Origin retained for review |
| Public unregistered URLs | Not measured | 0 | Critical origin gap closed |
| Public unapproved-rights URLs | 2,936 | 0 | Rights gate enforced |
| Priority listings with approved gallery image | 0/100 | 0/100 | High launch blocker remains |
| Long-tail listings using fallback | 3,086 | 3,086 | Accepted medium backlog |

No chart is included because this is a point-in-time control inventory with a single before/after transition; the exact audit table is clearer and does not imply a trend.

## Scope and definitions

- **Display media:** gallery images, menu images, and logos referenced by canonical listing data.
- **Source-traced:** the asset URL is registered against an immutable source snapshot or a declared enrichment source.
- **Rights-approved:** `permission-confirmed`, `licensed`, or `public-domain`, with retained non-secret evidence and all required licence/attribution fields.
- **Quarantined:** retained in `data/listing-media-provenance.json` but absent from published listing and browser-search data.
- **Published:** present in canonical listing data and backed by an approved registry record.
- **Launch-priority cohort:** the top 100 listings under the deterministic proxy below. This is not measured traffic.

## Current source inventory has origin but no reuse permission

| Source domain | Registered assets | Current status |
| --- | ---: | --- |
| `lh3.googleusercontent.com` | 803 | Quarantined; rights unknown |
| `lh4.googleusercontent.com` | 743 | Quarantined; rights unknown |
| `lh5.googleusercontent.com` | 711 | Quarantined; rights unknown |
| `lh6.googleusercontent.com` | 678 | Quarantined; rights unknown |
| `thecurryclub.uk` | 1 | Quarantined; rights unknown |

All URLs were present in the immutable historical listing source. That proves data origin only. Neither the historical CSV nor the inspected Outscraper photo exports contains licence terms, creator attribution, permission evidence, or a public-domain declaration.

## Publication policy

An asset may be published only when all applicable controls pass:

1. The URL is registered with a stable source reference and listing usage.
2. Rights status is not `unknown`.
3. A non-secret evidence reference is retained.
4. Licensed assets include licence name and HTTP(S) licence URL.
5. Assets requiring attribution include attribution text and a valid attribution URL when supplied.
6. Remote validation confirms an image content type before the write.
7. The asset is added to canonical listing data, the verbose search records, and the packed browser search index in the same operation.
8. `npm run audit:media`, the registry integrity test, and the full regression suite pass.

Business logos are not automatically considered licensed merely because they identify the listed business. Obtain permission or a documented legal/editorial decision before publishing them.

## Enrichment writes require evidence

The enrichment command is read-only by default and has no laptop-specific input paths:

```powershell
npm run enrich:outscraper-media -- data\photo-export.csv
```

A write requires the real source and rights record. Example structure only—do not reuse placeholder evidence:

```powershell
npm run enrich:outscraper-media -- data\owner-photo-export.csv --write `
  --source-ref=owner-photo-export `
  --source-name="Restaurant owner photo export" `
  --rights-status=permission-confirmed `
  --rights-evidence=docs/permissions/owner-photo-export.md
```

Licensed media additionally requires `--license-name` and an HTTP(S) `--license-url`. Add `--attribution-required`, `--attribution-text`, and `--attribution-url` when the terms require attribution. The command refuses incomplete writes before media validation or data changes.

## The first 100 listings are the launch gate

The deterministic priority score is:

- featured listing: 100 points
- review volume: `round(log10(reviewCount + 1) × 20)`
- rating: `round(rating × 4)`
- category present: 5 points
- contact or map action present: 5 points

This proxy ranks likely visitor/business value using available data; it does not claim actual sessions, conversions, or revenue.

| Rank | Listing | Area | Reviews | Score |
| ---: | --- | --- | ---: | ---: |
| 1 | `royal-nawaab-perivale` | Ealing | 45,689 | 123 |
| 2 | `dishoom-shoreditch` | Tower Hamlets | 41,773 | 122 |
| 3 | `dishoom-covent-garden` | Westminster | 27,794 | 119 |
| 4 | `govinda-s-soho-street` | Westminster | 25,466 | 118 |
| 5 | `dishoom-carnaby` | Westminster | 21,362 | 117 |
| 6 | `dishoom-king-s-cross` | Camden | 18,695 | 115 |
| 7 | `royal-nawaab` | Redbridge | 18,625 | 115 |
| 8 | `vasantha-vilas-east-ham` | Newham | 17,870 | 115 |
| 9 | `dishoom-kensington` | Kensington & Chelsea | 16,300 | 114 |
| 10 | `maharaja-of-india` | Westminster | 14,303 | 113 |
| 11 | `fatt-pundit` | Westminster | 13,973 | 113 |
| 12 | `haweli-restaurant` | Redbridge | 12,495 | 112 |
| 13 | `indian-lounge` | Camden | 12,152 | 112 |
| 14 | `dawat-tooting` | Wandsworth | 11,830 | 111 |
| 15 | `aladin-brick-lane` | Tower Hamlets | 10,671 | 111 |
| 16 | `spice-village-southall` | Ealing | 9,671 | 110 |
| 17 | `haweli-restaurant-southall` | Ealing | 9,602 | 110 |
| 18 | `udaya-kerala-restaurant` | Newham | 9,435 | 109 |
| 19 | `chettinad-restaurant` | Camden | 9,233 | 109 |
| 20 | `dishoom-canary-wharf` | Tower Hamlets | 8,522 | 109 |
| 21 | `the-mughal-s-indian-restaurant-paddington` | Westminster | 8,069 | 108 |
| 22 | `sheba-restaurant-awarded-best-curry-house-in-uk` | Tower Hamlets | 7,766 | 108 |
| 23 | `spice-village-tooting` | Wandsworth | 7,737 | 108 |
| 24 | `khan-s-of-kensington` | Kensington & Chelsea | 7,603 | 108 |
| 25 | `dishoom-battersea` | Wandsworth | 7,483 | 107 |

Run `npm run audit:media` for the current top 50 and launch-cohort result; the ranking updates automatically when listing data changes.

## Method and robustness checks

- Profiled canonical gallery, menu, and logo URLs by listing, domain, protocol, duplication, and source coverage.
- Reproduced the historical CSV import and confirmed every formerly displayed URL appears in that immutable snapshot.
- Preserved 2,936 unique assets and their listing/source usages in the registry.
- Rebuilt canonical listings and all derived search/filter/shortlist indexes after quarantine.
- Verified a second quarantine dry run removes zero assets.
- Verified an enrichment write without rights metadata exits non-zero before network validation or writes.
- Verified the ordinary enrichment path completes read-only without modifying files.

## Limitations and uncertainty

- This policy is an engineering control, not legal advice. Permission and licence evidence must be assessed for its actual scope, territory, duration, modification rights, and attribution duties.
- Source origin does not establish copyright ownership or permission.
- Remote URL validation proves loadability/content type at one point in time, not future availability or rights.
- The top-100 score is a proxy because the project has no trustworthy traffic, conversion, or commercial-value dataset.
- Fallbacks keep layouts stable but do not provide the visual quality of approved photography.
- No images were downloaded, relicensed, attributed, or approved in this phase.

## Recommended next steps

1. Contact or use owner-controlled sources for the first 25 listings, retaining written permission with the evidence template.
2. Clear at least one suitable gallery image for each top-100 listing before launch.
3. Prefer controlled local WebP/AVIF derivatives only after source rights permit downloading, modification, and hosting.
4. Record attribution requirements in the registry and render attribution near the asset if required.
5. Continue long-tail enrichment after launch; do not weaken the gate to improve coverage numbers.

## Further questions

- Will the launch use owner-supplied images, a licensed stock/provider library, direct restaurant-site permission, or a combination?
- Who will retain permission evidence and handle revocation/correction requests?
- Should the first launch threshold remain 100 listings after real analytics become available?
