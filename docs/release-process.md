# Release process

This is the standard publishing process for Indian Restaurant London. Use it for normal website changes.

## Normal release

1. Create or update the matching Trello card before starting work.
2. Make the change locally and run the relevant checks.
3. Create a GitHub pull request from a non-`main` branch.
4. Let the required GitHub checks pass and address any actionable review feedback.
5. Merge the approved pull request into `main`.
6. Cloudflare Workers Builds automatically runs `npm run build:static` and deploys with `wrangler.workers.jsonc`.
7. Confirm the Cloudflare Workers Builds GitHub check succeeds, then check the live homepage and any affected route.
8. Update the Trello card with the deployed result and mark it complete.

## Environments

| Purpose | Git branch | Worker |
| --- | --- | --- |
| Production | `main` | `indianrestaurantlondon-workers` |
| Preview | any non-`main` branch | `indianrestaurantlondon-workers-preview` |

Production serves both `indianrestaurantlondon.co.uk` and `www.indianrestaurantlondon.co.uk` through Worker routes defined in `wrangler.workers.jsonc`.

## Rule

Do not use a manual local Wrangler production upload for a normal release. The GitHub-to-Cloudflare process is the source of truth. Use a manual deployment only for a deliberate emergency recovery, then document it on the related Trello card.

## Historical records

`deployment-performance-audit-2026-08-06.md` and `pagespeed-performance-report-2026-06-19.md` retain useful historical timing and performance evidence. They are not deployment instructions: their Pages Direct Upload commands and estimates predate Workers Builds.
