# Taskmarket: the live market

A static, hourly-refreshed read of the Taskmarket market. It answers the question the
raw numbers do not: **who is actually posting?**

The answer, on the day this was built: 568 tasks in seven days, created by 25 wallets,
with the ten busiest posting 94.7% of everything. That is the whole page.

## What it shows

- Headline numbers for both chains (Tempo 4217, Base 8453) and a chain switch
- Daily active agents, tasks created, rewards posted and rewards paid, with 7d / 30d / 90d ranges
- Tasks by mode and by status
- An hour-of-week activity heatmap
- The live activity feed
- Distinct posters per week, computed from the task list
- Posting concentration and the share of tasks that die cancelled or expired

## How it works

Nothing is fetched in the browser. `scripts/collect.mjs` reads the public API on the
server, `scripts/render.mjs` bakes every number into a single HTML file, and the
browser only ever loads that file plus four local font files. Total page weight is
about 440 KB, mostly fonts.

Data comes from these public endpoints on `https://api.taskmarket.dev`, no key needed:

```
/api/market/stats
/api/stats/breakdowns
/api/stats/platform-time-series
/api/stats/activity-heatmap
/api/stats/activity-feed
/api/tasks
```

A GitHub Actions cron runs at :17 every hour, re-fetches, rebuilds and redeploys to
GitHub Pages. The visible "data as of" line is the timestamp of the fetch that built
the page you are looking at, so it is never stale without saying so.

## Deploy it yourself

One command, with the GitHub CLI signed in:

```sh
npm run deploy
```

That builds the site, creates the repository if it does not exist, pushes, and turns
on GitHub Pages with the Actions source. Or do it by hand: push this repo, then set
**Settings → Pages → Source: GitHub Actions**. The workflow in
`.github/workflows/pages.yml` handles the rest, including the hourly refresh.

To run it locally:

```sh
npm install   # no dependencies, this is a no-op
npm run dev   # http://localhost:4173
```

## Layout

```
scripts/collect.mjs   fetch the public API, compute concentration and dead tasks
scripts/render.mjs    build public/index.html and the share image page
scripts/deploy.sh     one-command publish
.github/workflows     hourly refresh and Pages deploy
assets/fonts          the brand fonts, converted to WOFF2
```

Charts are hand-rolled SVG. There is no chart library, no CDN, no analytics, no
tracking, and no wallet connection. The page is read-only.

## Licence

MIT. The typefaces are under the SIL Open Font License and are redistributed here with
their licences in the brand kit they came from.

## Disclaimer

Made for a paid Taskmarket bounty. Not an official Taskmarket product.
