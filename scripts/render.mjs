// Renderer: turns data/snapshot.json into a single static page.
// Everything is baked in at build time, so the browser never calls the API.
import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL = process.env.SITE_URL || "https://raizo07.github.io/taskmarket-visualizer";
const BRAND = path.join(process.cwd(), "..", "brandkit");

const snapshot = JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "snapshot.json"), "utf8"));

const fmt = (n) => new Intl.NumberFormat("en-US").format(n ?? 0);
const usd = (base) => (Number(base || 0) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 0 });
const asOf = new Date(snapshot.generatedAt).toLocaleString("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
}) + " UTC";

async function main() {
  const pub = path.join(process.cwd(), "public");
  await fs.mkdir(path.join(pub, "fonts"), { recursive: true });

  const fonts = [
    ["assets/fonts/instrument-serif.woff2", "instrument-serif.woff2"],
    ["assets/fonts/instrument-serif-italic.woff2", "instrument-serif-italic.woff2"],
    ["assets/fonts/inter-tight.woff2", "inter-tight.woff2"],
    ["../brandkit/DepartureMono-Regular.woff2", "departure-mono.woff2"],
  ];
  for (const [src, dest] of fonts) {
    await fs.copyFile(path.resolve(src), path.join(pub, "fonts", dest));
  }
  await fs.copyFile(path.join(BRAND, "taskmarket-lockup.png"), path.join(pub, "lockup.png"));
  // The share image is committed, so CI needs no browser.
  try { await fs.copyFile(path.resolve("assets/og.png"), path.join(pub, "og.png")); } catch {}

  const data = JSON.stringify(snapshot);
  await fs.writeFile(path.join(pub, "index.html"), page(data), "utf8");
  await fs.writeFile(path.join(pub, "og.html"), ogPage(), "utf8");
  process.stderr.write(`rendered public/index.html (${(page(data).length / 1024).toFixed(0)} KB)\n`);
}

function ogPage() {
  const t = snapshot.chains["4217"];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:"Instrument Serif";src:url(fonts/instrument-serif.woff2)}
  @font-face{font-family:"Instrument Serif";src:url(fonts/instrument-serif-italic.woff2);font-style:italic}
  @font-face{font-family:"Inter Tight";src:url(fonts/inter-tight.woff2)}
  @font-face{font-family:"Departure Mono";src:url(fonts/departure-mono.woff2)}
  body{margin:0;width:1200px;height:630px;background:#12100E;color:#EFE9E2;font-family:"Inter Tight";position:relative;overflow:hidden}
  .glow{position:absolute;inset:0;background:radial-gradient(90% 70% at 85% -15%, #3A1420 0%, rgba(58,20,32,0) 60%)}
  .wrap{position:relative;padding:64px 72px}
  h1{font-family:"Instrument Serif";font-weight:400;font-size:76px;line-height:1.02;margin:0 0 18px;letter-spacing:-.01em}
  h1 em{color:#E74079;font-style:italic}
  p{font-size:26px;color:#B0A79D;margin:0;max-width:900px}
  .row{display:flex;gap:52px;margin-top:44px}
  .n{font-family:"Departure Mono";font-size:44px;color:#FFF6E8}
  .l{font-size:18px;color:#B0A79D;margin-top:4px}
  .foot{position:absolute;bottom:44px;left:72px;display:flex;align-items:center;gap:18px}
  .foot img{height:44px}
  .addr{font-family:"Departure Mono";font-size:22px}
  </style></head><body><div class="glow"></div><div class="wrap">
  <h1>The market is a <em>${t.distinctPosters7d} wallets.</em></h1>
  <p>${fmt(t.tasksLast7d)} tasks in seven days. ${t.distinctPosters7d} wallets posted them. The top ten posted ${t.top10Share}%.</p>
  <div class="row">
    <div><div class="n">${fmt(t.stats.activeAgents7d)}</div><div class="l">active agents, 7 days</div></div>
    <div><div class="n">${fmt(t.stats.openTasks)}</div><div class="l">open tasks</div></div>
    <div><div class="n">${fmt(t.stats.paidWorkers)}</div><div class="l">paid workers</div></div>
  </div></div>
  <div class="foot"><img src="lockup.png"><span class="addr">taskmarket.dev</span></div>
  </body></html>`;
}

function page(dataJson) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Taskmarket: the live market</title>
<meta name="description" content="A live read of the Taskmarket market: agents, tasks, rewards and the shape of who posts.">
<meta property="og:type" content="website">
<meta property="og:title" content="The market is twenty-five people.">
<meta property="og:description" content="568 tasks in seven days, 25 wallets posting them. A live read of Taskmarket.">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE_URL}/og.png">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%2312100E'/%3E%3Crect x='30' y='30' width='18' height='18' fill='%23E74079'/%3E%3Crect x='52' y='30' width='18' height='18' fill='%23FFF6E8'/%3E%3Crect x='30' y='52' width='18' height='18' fill='%23FFF6E8'/%3E%3Crect x='52' y='52' width='18' height='18' fill='%23E74079'/%3E%3C/svg%3E">
<style>
@font-face{font-family:"Instrument Serif";src:url(fonts/instrument-serif.woff2) format("woff2");font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:"Instrument Serif";src:url(fonts/instrument-serif-italic.woff2) format("woff2");font-weight:400;font-style:italic;font-display:swap}
@font-face{font-family:"Inter Tight";src:url(fonts/inter-tight.woff2) format("woff2");font-weight:100 900;font-display:swap}
@font-face{font-family:"Departure Mono";src:url(fonts/departure-mono.woff2) format("woff2");font-display:swap}
:root{--ground:#12100E;--maroon:#3A1420;--panel:#221E1A;--line:#453E37;--cream:#EFE9E2;--paper:#FFF6E8;--muted:#B0A79D;--magenta:#E74079;--salmon:#D9A097}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(120% 70% at 85% -10%,var(--maroon) 0%,rgba(58,20,32,0) 55%),var(--ground);color:var(--cream);font-family:"Inter Tight",system-ui,sans-serif;font-weight:500;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding:0 22px 80px}
header{padding:56px 0 10px}
h1{font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:clamp(38px,6.4vw,72px);line-height:1.02;margin:0 0 16px;letter-spacing:-.01em}
h1 em{color:var(--magenta);font-style:italic}
.lede{color:var(--muted);font-size:clamp(16px,2.1vw,19px);max-width:62ch;margin:0}
.meta{font-family:"Departure Mono",ui-monospace,monospace;font-size:12.5px;color:var(--muted);margin-top:18px;display:flex;gap:18px;flex-wrap:wrap}
.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:26px 0 0}
.chip{font-family:"Departure Mono",monospace;font-size:13px;background:transparent;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:7px 14px;cursor:pointer}
.chip[aria-pressed="true"]{color:var(--ground);background:var(--cream);border-color:var(--cream)}
.chip:focus-visible{outline:2px solid var(--magenta);outline-offset:2px}
.grid{display:grid;gap:18px;margin-top:28px}
.cols-4{grid-template-columns:repeat(4,1fr)}
.cols-2{grid-template-columns:1fr 1fr}
@media(max-width:820px){.cols-4{grid-template-columns:repeat(2,1fr)}.cols-2{grid-template-columns:1fr}}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px}
.k{font-family:"Departure Mono",monospace;font-size:34px;color:var(--paper);line-height:1.1}
.kl{font-size:13px;color:var(--muted);margin-top:6px}
h2{font-family:"Instrument Serif",serif;font-weight:400;font-size:clamp(24px,3.2vw,34px);margin:52px 0 6px}
h2 em{color:var(--magenta);font-style:italic}
.sub{color:var(--muted);font-size:15px;margin:0 0 14px;max-width:70ch}
svg{display:block;width:100%;height:auto}
.feed{list-style:none;margin:0;padding:0}
.feed li{display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px;align-items:baseline}
.feed li:last-child{border-bottom:0}
.feed .t{font-family:"Departure Mono",monospace;font-size:11.5px;color:var(--muted);white-space:nowrap}
.feed .ty{color:var(--salmon);font-size:12px;text-transform:lowercase}
.feed .ti{color:var(--cream);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hm{display:grid;grid-template-columns:34px repeat(24,1fr);gap:3px;align-items:center}
.hm .lab{font-family:"Departure Mono",monospace;font-size:10px;color:var(--muted)}
.hm .cell{aspect-ratio:1;border-radius:2px;background:#2a2522}
.hm .hdr{font-family:"Departure Mono",monospace;font-size:9px;color:var(--muted);text-align:center}
.note{font-size:13px;color:var(--muted);margin-top:10px}
footer{margin-top:64px;padding-top:26px;border-top:1px solid var(--line);color:var(--muted);font-size:13.5px}
footer img{height:30px;display:block;margin-bottom:12px}
footer .addr{font-family:"Departure Mono",monospace;color:var(--cream)}
details{margin-top:12px}
summary{cursor:pointer;color:var(--cream);font-size:13.5px}
code{font-family:"Departure Mono",monospace;font-size:12.5px;color:var(--salmon);word-break:break-all}
</style>
</head>
<body>
<div class="wrap">
<header>
  <h1 id="hero">The market is a <em>few wallets.</em></h1>
  <p class="lede" id="lede"></p>
  <div class="meta"><span id="asof"></span><span>·</span><span>public data, no key</span><span>·</span><span>read-only</span></div>
  <div class="bar" role="group" aria-label="Chain">
    <button class="chip" data-chain="4217" aria-pressed="true">Tempo</button>
    <button class="chip" data-chain="8453" aria-pressed="false">Base</button>
  </div>
</header>

<div class="grid cols-4" id="headline"></div>

<h2>What gets <em>posted</em></h2>
<p class="sub">Tasks created, agents active, rewards put up and rewards actually paid, day by day.</p>
<div class="bar" role="group" aria-label="Range" id="ranges"></div>
<div class="grid cols-2">
  <div class="panel"><svg id="c-agents" viewBox="0 0 560 220" role="img" aria-label="Active agents and tasks per day"></svg></div>
  <div class="panel"><svg id="c-money" viewBox="0 0 560 220" role="img" aria-label="Rewards posted against rewards paid"></svg></div>
</div>

<h2>Who is <em>posting</em></h2>
<p class="sub">The number that surprised me. A market of thousands of workers, run by a couple of dozen wallets.</p>
<div class="grid cols-2">
  <div class="panel" id="conc"></div>
  <div class="panel"><svg id="c-mode" viewBox="0 0 560 220" role="img" aria-label="Tasks by mode"></svg></div>
</div>

<h2>The shape of a <em>week</em></h2>
<p class="sub">When the market is awake, by hour of the week. Times are UTC.</p>
<div class="panel"><div class="hm" id="heat"></div></div>

<h2>Every <em>status</em></h2>
<p class="sub">Where tasks end up. Cancelled and expired are the quiet failure modes.</p>
<div class="grid cols-2">
  <div class="panel"><svg id="c-status" viewBox="0 0 560 240" role="img" aria-label="Tasks by status"></svg></div>
  <div class="panel" id="dead"></div>
</div>

<h2>Right <em>now</em></h2>
<p class="sub">The live feed, straight from the platform's activity endpoint.</p>
<div class="panel"><ul class="feed" id="feed"></ul></div>

<footer>
  <img src="lockup.png" alt="Taskmarket">
  <div><span class="addr">taskmarket.dev</span> · data as of <span id="asof2"></span></div>
  <div style="margin-top:10px">Made for a paid Taskmarket bounty. Not an official Taskmarket product.</div>
  <details><summary>Methods</summary>
    <p class="note">Every figure is fetched at build time from <code>https://api.taskmarket.dev</code> and baked into this page; the browser calls no API. Endpoints used:
    <code>/api/market/stats</code>, <code>/api/stats/breakdowns</code>, <code>/api/stats/platform-time-series</code>,
    <code>/api/stats/activity-heatmap</code>, <code>/api/stats/activity-feed</code>, <code>/api/tasks</code>.
    Chains: Tempo (4217) and Base (8453). Rewards are base units divided by 1e6.
    "Distinct posters" counts unique <code>requester</code> addresses on tasks created in the last seven days.
    The page is rebuilt hourly by a scheduled job; the visible timestamp is when that build fetched its data.</p>
  </details>
</footer>
</div>

<script>
const DATA = ${dataJson};
let chainId = "4217";
let range = "7d";

const fmt = n => new Intl.NumberFormat("en-US").format(n ?? 0);
const usd = b => (Number(b || 0) / 1e6).toLocaleString("en-US", { maximumFractionDigits: 0 });
const C = { line: "#453E37", cream: "#EFE9E2", muted: "#B0A79D", magenta: "#E74079", salmon: "#D9A097", panel: "#221E1A", paper: "#FFF6E8" };

const chain = () => DATA.chains[chainId];

document.getElementById("asof").textContent = "data as of " + new Date(DATA.generatedAt).toISOString().replace("T", " ").slice(0, 16) + " UTC";
document.getElementById("asof2").textContent = new Date(DATA.generatedAt).toISOString().slice(0, 16).replace("T", " ") + " UTC";

function headline() {
  const c = chain(), s = c.stats;
  const hero = document.getElementById("hero");
  if (hero) hero.innerHTML = "The market is <em>" + c.distinctPosters7d + " wallets.</em>";
  document.getElementById("lede").textContent =
    fmt(c.tasksLast7d) + " tasks were created in the last seven days on " + c.name +
    ". " + c.distinctPosters7d + " distinct wallets posted them, and the ten busiest posted " +
    c.top10Share + "% of everything.";
  const cells = [
    ["registered workers", s.registeredWorkers],
    ["active agents, 7d", s.activeAgents7d],
    ["open tasks", s.openTasks],
    ["paid workers", s.paidWorkers],
  ];
  document.getElementById("headline").innerHTML = cells.map(([l, v]) =>
    '<div class="panel"><div class="k">' + fmt(v) + '</div><div class="kl">' + l + "</div></div>").join("");
}

function ranges() {
  const el = document.getElementById("ranges");
  el.innerHTML = ["7d", "30d", "90d"].map(r =>
    '<button class="chip" data-range="' + r + '" aria-pressed="' + (r === range) + '">' + r + "</button>").join("");
  el.querySelectorAll("[data-range]").forEach(b => b.onclick = () => { range = b.dataset.range; ranges(); charts(); });
}

// ---- tiny SVG chart helpers (no libraries) ----
function scale(vals, max) { const m = max || Math.max(...vals, 1); return v => 190 - (v / m) * 160; }

function lineChart(id, series, opts) {
  const svg = document.getElementById(id);
  const W = 560, pad = 30;
  const n = series[0].values.length;
  const all = series.flatMap(s => s.values);
  const max = Math.max(...all, 1);
  const sy = scale(all, max);
  const x = i => pad + (i * (W - pad * 2)) / Math.max(n - 1, 1);
  let g = "";
  for (let i = 0; i < 4; i++) {
    const y = 30 + i * (160 / 3);
    g += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.line + '" stroke-width="1" opacity=".5"/>';
  }
  for (const s of series) {
    const d = s.values.map((v, i) => (i ? "L" : "M") + x(i) + " " + sy(v)).join(" ");
    g += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.2" stroke-linejoin="round"/>';
  }
  // legend
  const leg = series.map((s, i) =>
    '<rect x="' + (pad + i * 150) + '" y="8" width="9" height="9" rx="2" fill="' + s.color + '"/>' +
    '<text x="' + (pad + i * 150 + 15) + '" y="17" fill="' + C.muted + '" font-size="11" font-family="Inter Tight">' + s.label + "</text>"
  ).join("");
  // first/last labels
  const labels = '<text x="' + pad + '" y="212" fill="' + C.muted + '" font-size="10" font-family="Departure Mono">' + opts.first + '</text>' +
    '<text x="' + (W - pad) + '" y="212" text-anchor="end" fill="' + C.muted + '" font-size="10" font-family="Departure Mono">' + opts.last + '</text>';
  svg.innerHTML = g + leg + labels;
}

function barChart(id, rows, opts) {
  const svg = document.getElementById(id);
  const W = 560, left = 96, right = 44, top = 26;
  const rowH = 30;
  const H = top + rows.length * rowH + 10;
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  const max = Math.max(...rows.map(r => r.value), 1);
  let g = "";
  rows.forEach((r, i) => {
    const y = top + i * rowH;
    const w = ((W - left - right) * r.value) / max;
    g += '<text x="' + (left - 10) + '" y="' + (y + 14) + '" text-anchor="end" fill="' + C.muted + '" font-size="12" font-family="Inter Tight">' + r.label + "</text>" +
      '<rect x="' + left + '" y="' + (y + 3) + '" width="' + Math.max(w, 2) + '" height="14" rx="4" fill="' + (r.color || C.salmon) + '"/>' +
      '<text x="' + (left + w + 8) + '" y="' + (y + 14) + '" fill="' + C.cream + '" font-size="11.5" font-family="Departure Mono">' + fmt(r.value) + "</text>";
  });
  svg.innerHTML = g + '<text x="' + left + '" y="14" fill="' + C.muted + '" font-size="11" font-family="Inter Tight">' + (opts.title || "") + "</text>";
}

function charts() {
  const c = chain();
  const s = c.series[range] || [];
  const first = s.length ? s[0].bucket.slice(5) : "";
  const last = s.length ? s[s.length - 1].bucket.slice(5) : "";
  lineChart("c-agents", [
    { label: "active agents", values: s.map(d => d.activeAgents), color: C.cream },
    { label: "tasks created", values: s.map(d => d.tasksCreated), color: C.magenta },
  ], { first, last });

  // rewards put up vs paid, in whole tokens
  const put = s.map(d => Number(d.rewardVolume) / 1e6);
  const paid = s.map(d => Number(d.paidVolume) / 1e6);
  lineChart("c-money", [
    { label: "rewards posted", values: put, color: C.magenta },
    { label: "rewards paid", values: paid, color: C.salmon },
  ], { first, last });

  const b = c.breakdowns;
  barChart("c-mode", (b.mode || []).slice().sort((x, y) => y.count - x.count).map(m => ({ label: m.mode, value: m.count })), { title: "tasks by mode" });
  barChart("c-status", (b.status || []).slice().sort((x, y) => y.count - x.count).map(m => ({ label: m.status.replace(/_/g, " "), value: m.count, color: /cancel|expire/.test(m.status) ? C.magenta : C.salmon })), { title: "tasks by status" });

  // concentration
  document.getElementById("conc").innerHTML =
    '<div class="k">' + c.top10Share + '%</div>' +
    '<div class="kl">of the last 7 days of tasks were posted by just ten wallets</div>' +
    '<div class="note">' + c.distinctPosters7d + " distinct posters across " + fmt(c.tasksLast7d) +
    " tasks. The busiest single wallet posted " + c.topPosterCount + ".</div>";

  // dead tasks
  document.getElementById("dead").innerHTML =
    '<div class="k">' + c.deadShare + '%</div>' +
    '<div class="kl">of the last 7 days ended cancelled or expired</div>' +
    '<div class="note">' + c.deadLast7d + " tasks died quietly in the window. Most tasks that get posted still finish: " +
    fmt((b.status || []).find(x => x.status === "completed")?.count || 0) + " completed all time on " + c.name + ".</div>";
}

function heatmap() {
  const c = chain();
  const el = document.getElementById("heat");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const map = {};
  let max = 1;
  for (const cell of c.heatmap.cells || []) {
    map[cell.row + ":" + cell.col] = cell.count;
    max = Math.max(max, cell.count);
  }
  let html = '<div class="lab"></div>';
  for (let h = 0; h < 24; h++) html += '<div class="hdr">' + h + "</div>";
  for (let d = 0; d < 7; d++) {
    html += '<div class="lab">' + (days[d] || d) + "</div>";
    for (let h = 0; h < 24; h++) {
      const v = map[d + ":" + h] || 0;
      const a = v === 0 ? 0.06 : 0.14 + 0.86 * (v / max);
      html += '<div class="cell" title="' + v + ' events" style="background:rgba(231,64,121,' + a.toFixed(3) + ')"></div>';
    }
  }
  el.innerHTML = html;
}

function feed() {
  const c = chain();
  const items = (c.feed.items || []).slice(0, 14);
  document.getElementById("feed").innerHTML = items.map(i => {
    const t = new Date(i.timestamp).toISOString().slice(11, 16);
    const title = (i.taskTitle || i.taskId || "").replace(/</g, "&lt;");
    return '<li><span class="t">' + t + '</span><span class="ty">' + String(i.type).replace(/_/g, " ") +
      '</span><span class="ti">' + title + '</span></li>';
  }).join("");
}

function all() { headline(); ranges(); charts(); heatmap(); feed(); }

document.querySelectorAll("[data-chain]").forEach(b => b.onclick = () => {
  chainId = b.dataset.chain;
  document.querySelectorAll("[data-chain]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  all();
});

all();
</script>
</body>
</html>`;
}

main().catch((e) => { console.error(e); process.exit(1); });
