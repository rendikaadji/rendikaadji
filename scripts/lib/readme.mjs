import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const ACTIVITY_START = "<!-- AUTO:ACTIVITY:START -->";
export const ACTIVITY_END = "<!-- AUTO:ACTIVITY:END -->";

// Semua gambar di README harus dari sumber yang stabil:
// - shields.io untuk badge
// - asset lokal (assets/metrics, assets/hero) yang dibuat GitHub Actions di repo ini
// - branch `output` untuk snake animation
// JANGAN pakai layanan stats pihak ketiga (github-readme-stats.vercel.app, *.herokuapp.com):
// sudah terbukti mati/503 dan membuat gambar rusak di profil.

const INK = "0B1220";
const ACCENT = "38BDF8";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function badgeSegment(value) {
  return encodeURIComponent(String(value).replaceAll("-", "--").replaceAll("_", "__").replaceAll(" ", "_"));
}

function shield(label, { color = INK, logo = "", logoColor = ACCENT, style = "flat-square" } = {}) {
  const logoPart = logo ? `&logo=${encodeURIComponent(logo)}&logoColor=${logoColor}` : "";
  return `https://img.shields.io/badge/${badgeSegment(label)}-${color}?style=${style}${logoPart}`;
}

function stripEmoji(text) {
  return String(text).replace(/\p{Extended_Pictographic}/gu, "").trim();
}

function renderInfoBadges(config) {
  const { profile, links } = config;
  const items = [
    `  <img alt="Location" src="${shield(profile.location, { logo: "googlemaps" })}">`,
    `  <img alt="Affiliation" src="${shield(profile.affiliation, { logo: "bookstack" })}">`,
    `  <img alt="Status" src="${shield(stripEmoji(profile.status), { logo: "probot" })}">`,
    ...links.map((link) =>
      `  <a href="${escapeHtml(link.url)}"><img alt="${escapeHtml(link.label)}" src="${shield(link.label, { color: link.color, logo: link.logo })}"></a>`)
  ];
  return `<p align="center">\n${items.join("\n")}\n</p>`;
}

const FOCUS_ICONS = ["🌐", "📱", "🔌", "🤖", "⚙️", "🧪"];

function renderFocus(focus) {
  const cells = focus.map((item, index) => `    <td width="50%" valign="top">
      <h4>${FOCUS_ICONS[index % FOCUS_ICONS.length]} ${escapeHtml(item.name)}</h4>
      ${escapeHtml(item.description)}
    </td>`);
  const rows = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(`  <tr>\n${cells.slice(i, i + 2).join("\n")}\n  </tr>`);
  return `<table>\n${rows.join("\n")}\n</table>`;
}

const PROJECT_STYLES = [
  { icon: "🌱", color: "16A34A" },
  { icon: "🎬", color: "DB2777" },
  { icon: "⏱️", color: "2563EB" },
  { icon: "🧩", color: "9333EA" },
  { icon: "🚀", color: "EA580C" },
  { icon: "📦", color: "0891B2" }
];

function renderProjects(projects) {
  const width = `${Math.floor(100 / Math.min(projects.length, 3))}%`;
  const cells = projects.map((project, index) => {
    const style = PROJECT_STYLES[index % PROJECT_STYLES.length];
    // Ada homepage -> tombol Live Demo (repo bisa private = 404 bagi pengunjung).
    const button = project.homepage
      ? `<a href="${escapeHtml(project.homepage)}"><img alt="Live Demo" src="${shield("Live Demo", { logo: "googlechrome", style: "for-the-badge" })}"></a>`
      : `<a href="${escapeHtml(project.url)}"><img alt="Repository" src="${shield("Repository", { logo: "github", style: "for-the-badge" })}"></a>`;
    return `    <td width="${width}" valign="top">
      <h4>${style.icon} ${escapeHtml(project.name)}</h4>
      <img alt="${escapeHtml(project.focus)}" src="${shield(project.focus, { color: style.color, logoColor: "white" })}"><br><br>
      ${escapeHtml(project.summary)}<br><br>
      ${button}
    </td>`;
  });
  const rows = [];
  for (let i = 0; i < cells.length; i += 3) rows.push(`  <tr>\n${cells.slice(i, i + 3).join("\n")}\n  </tr>`);
  return `<table>\n${rows.join("\n")}\n</table>`;
}

const TECH_BADGE_META = {
  "PHP": { color: "777BB4", logo: "php", group: "Backend" },
  "Laravel": { color: "FF2D20", logo: "laravel", group: "Backend" },
  "Livewire": { color: "4E56A6", logo: "livewire", group: "Backend" },
  "Python": { color: "3776AB", logo: "python", group: "Backend" },
  "Tailwind CSS": { color: "06B6D4", logo: "tailwindcss", group: "Frontend" },
  "Alpine.js": { color: "8BC0D0", logo: "alpinedotjs", group: "Frontend", logoColor: "black" },
  "Flutter": { color: "02569B", logo: "flutter", group: "Mobile" },
  "Dart": { color: "0175C2", logo: "dart", group: "Mobile" },
  "MySQL": { color: "4479A1", logo: "mysql", group: "Database" },
  "PostgreSQL": { color: "4169E1", logo: "postgresql", group: "Database" },
  "AI Agents": { color: "6C5CE7", logo: "probot", group: "AI &amp; Tools" },
  "Automation": { color: "2496ED", logo: "githubactions", group: "AI &amp; Tools" },
  "C++": { color: "00599C", logo: "cplusplus", group: "AI &amp; Tools" },
  "Git": { color: "F05032", logo: "git", group: "AI &amp; Tools" }
};
const TECH_GROUP_ORDER = ["Backend", "Frontend", "Mobile", "Database", "AI &amp; Tools", "More"];

function renderTechStack(techStack) {
  const groups = new Map();
  for (const item of techStack) {
    const meta = TECH_BADGE_META[item] || { color: "555555", logo: "", group: "More" };
    const badge = `      <img src="${shield(item, { color: meta.color, logo: meta.logo, logoColor: meta.logoColor || "white", style: "for-the-badge" })}" alt="${escapeHtml(item)}">`;
    if (!groups.has(meta.group)) groups.set(meta.group, []);
    groups.get(meta.group).push(badge);
  }
  const rows = TECH_GROUP_ORDER.filter((group) => groups.has(group)).map((group) => `  <tr>
    <td align="right"><b>${group}</b></td>
    <td>
${groups.get(group).join("\n")}
    </td>
  </tr>`);
  return `<table>\n${rows.join("\n")}\n</table>`;
}

function renderInsights(githubUser) {
  const snake = `https://raw.githubusercontent.com/${githubUser}/${githubUser}/output`;
  return `<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="${snake}/github-contribution-grid-snake-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="${snake}/github-contribution-grid-snake.svg">
    <img alt="Contribution snake animation" src="${snake}/github-contribution-grid-snake-dark.svg" width="100%">
  </picture>
</p>

<p align="center">
  <img src="./assets/metrics/metrics.svg" alt="GitHub stats and most used languages" width="480">
</p>

<p align="center">
  <img src="./assets/metrics/achievements.svg" alt="GitHub achievements" width="480">
</p>

<p align="center"><sub>Stats are self-hosted and refreshed daily by GitHub Actions, so they never break when third-party stat services go down.</sub></p>`;
}

function renderSnapshot(config) {
  const pad = (key) => `${key}:`.padEnd(10);
  return "```yaml\n" + [
    `${pad("role")} ${config.research.primary}`,
    `${pad("building")} ${config.research.direction}`,
    `${pad("approach")} ${config.research.themes}`,
    `${pad("now")} ${stripEmoji(config.profile.status)}`
  ].join("\n") + "\n```";
}

function extractActivity(readme) {
  const startIndex = readme.indexOf(ACTIVITY_START);
  const endIndex = readme.indexOf(ACTIVITY_END);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) return null;
  return readme.slice(startIndex + ACTIVITY_START.length, endIndex).trim();
}

async function readExistingActivity(readmePath) {
  try {
    const existing = await readFile(readmePath, "utf8");
    return extractActivity(existing);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

export async function generateProfileReadme({ config, manifest, readmePath }) {
  const existingActivity = await readExistingActivity(readmePath);
  const activity = existingActivity || "_Recent public activity will appear here after the workflow runs._";
  const activitySection = config.activity.enabled
    ? `\n## ⚡ Recent Activity\n\n${ACTIVITY_START}\n${activity}\n${ACTIVITY_END}\n`
    : "";
  const githubUser = config.profile.githubUser || config.profile.username;
  const tagline = config.profile.headline.replaceAll("|", "·").replaceAll("•", "·").replace(/\s+/g, " ");
  const about = config.profile.about.map(escapeHtml).join("\n\n");

  const readme = `<!-- Generated by GitHub Profile Agent Console. Edit profile.config.json, then run npm run generate. -->
<p align="center">
  <picture>
    <source media="(max-width: 760px) and (prefers-color-scheme: dark)" srcset="./assets/hero/${manifest.assets.mobileDark}">
    <source media="(max-width: 760px)" srcset="./assets/hero/${manifest.assets.mobileLight}">
    <source media="(prefers-color-scheme: dark)" srcset="./assets/hero/${manifest.assets.desktopDark}">
    <source media="(prefers-color-scheme: light)" srcset="./assets/hero/${manifest.assets.desktopLight}">
    <img src="./assets/hero/${manifest.assets.desktopDark}" alt="${escapeHtml(config.profile.name)} - ${escapeHtml(config.profile.headline)}" width="100%">
  </picture>
</p>

<h3 align="center">${escapeHtml(tagline)}</h3>

${renderInfoBadges(config)}

---

## 👋 About Me

${about}

${renderSnapshot(config)}

## 🎯 Current Focus

${renderFocus(config.focus)}

## 🚀 Featured Work

${renderProjects(config.projects)}

## 🧭 Engineering Philosophy

> ${escapeHtml(config.research.narrative)}

## 🛠️ Tech Stack

${renderTechStack(config.techStack)}

## 📊 GitHub Insights

${renderInsights(githubUser)}
${activitySection}
---

<p align="center">
  <sub>${escapeHtml(config.footer)}</sub>
</p>
`;

  await writeFile(resolve(readmePath), readme);
  return readme;
}
