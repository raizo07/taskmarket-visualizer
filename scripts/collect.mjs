// Collector: fetches every public endpoint on the server and writes a
// normalised snapshot. Nothing here runs in a browser.
import fs from "node:fs/promises";
import path from "node:path";

const API = "https://api.taskmarket.dev";
const CHAINS = [
  { id: 4217, name: "Tempo", token: "OUSD" },
  { id: 8453, name: "Base", token: "USDC" },
];
const RANGES = ["7d", "30d", "90d"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(pathname) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(API + pathname, {
      headers: { "user-agent": "taskmarket-visualizer/1.0 (+public data)" },
    });
    if (res.ok) return res.json();
    if (res.status === 429) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    throw new Error(`${pathname} -> HTTP ${res.status}`);
  }
  throw new Error(`${pathname} -> gave up after retries`);
}

// Walk the task list until the cursor runs out or we pass the cutoff.
async function collectTasks(chainId, sinceMs, maxPages = 24) {
  const out = [];
  let cursor = null;
  for (let page = 0; page < maxPages; page++) {
    const q = new URLSearchParams({
      chainId: String(chainId),
      sort: "newest",
      limit: "100",
    });
    if (cursor) q.set("cursor", cursor);
    const body = await get(`/api/tasks?${q}`);
    const tasks = body.tasks || [];
    let reachedOlder = false;
    for (const t of tasks) {
      const created = Date.parse(t.createdAt || 0);
      if (Number.isFinite(created) && created < sinceMs) {
        reachedOlder = true;
        continue;
      }
      out.push({
        id: t.id,
        requester: t.requester,
        status: t.status,
        mode: t.mode,
        reward: Number(t.reward || 0),
        createdAt: t.createdAt,
        completedAt: t.completedAt ?? null,
        submissionCount: t.submissionCount ?? 0,
        title: String(t.description || "").split("\n")[0].slice(0, 120),
      });
    }
    cursor = body.nextCursor;
    if (!cursor || reachedOlder) break;
  }
  return out;
}

const iso = (d) => new Date(d).toISOString();

async function main() {
  const generatedAt = new Date();
  const weekAgo = generatedAt.getTime() - 7 * 864e5;
  const out = { generatedAt: iso(generatedAt), api: API, chains: {} };

  for (const chain of CHAINS) {
    const c = { id: chain.id, name: chain.name, token: chain.token };

    c.stats = await get(`/api/market/stats?chainId=${chain.id}`);
    c.breakdowns = await get(`/api/stats/breakdowns?chainId=${chain.id}`);
    c.heatmap = await get(
      `/api/stats/activity-heatmap?chainId=${chain.id}&range=7d&dimension=hourOfWeek`
    );
    c.feed = await get(`/api/stats/activity-feed?chainId=${chain.id}&limit=18`);
    c.series = {};
    for (const range of RANGES) {
      c.series[range] = await get(
        `/api/stats/platform-time-series?chainId=${chain.id}&range=${range}&bucket=day`
      );
    }

    const tasks = await collectTasks(chain.id, weekAgo);
    c.tasksLast7d = tasks.length;

    // Distinct posters in the last 7 days, and how concentrated posting is.
    const byPoster = new Map();
    for (const t of tasks) {
      if (!t.requester) continue;
      byPoster.set(t.requester.toLowerCase(), (byPoster.get(t.requester.toLowerCase()) || 0) + 1);
    }
    const counts = [...byPoster.values()].sort((a, b) => b - a);
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    c.distinctPosters7d = byPoster.size;
    c.top10Share =
      Math.round((counts.slice(0, 10).reduce((a, b) => a + b, 0) / total) * 1000) / 10;
    c.topPosterCount = counts[0] || 0;

    // Tasks that died in the window, and how long decisions take.
    const dead = tasks.filter((t) => t.status === "cancelled" || t.status === "expired");
    c.deadLast7d = dead.length;
    c.deadShare =
      tasks.length > 0 ? Math.round((dead.length / tasks.length) * 1000) / 10 : 0;

    out.chains[String(chain.id)] = c;
    process.stderr.write(
      `chain ${chain.id}: ${tasks.length} tasks/7d, ${byPoster.size} posters, top10 ${c.top10Share}%\n`
    );
  }

  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "snapshot.json"), JSON.stringify(out, null, 2));
  process.stderr.write(`wrote data/snapshot.json at ${out.generatedAt}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
