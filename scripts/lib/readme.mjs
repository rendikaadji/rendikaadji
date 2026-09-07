import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const ACTIVITY_START = "<!-- AUTO:ACTIVITY:START -->";
export const ACTIVITY_END = "<!-- AUTO:ACTIVITY:END -->";

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function badgeSegment(value) {
  return encodeURIComponent(String(value).replaceAll("-", "--").replaceAll("_", "__").replaceAll(" ", "_"));
}

function renderLinks(links) {
  return links.map((link) => {
    const logo = link.logo ? `&logo=${encodeURIComponent(link.logo)}&logoColor=white` : "";
    const image = `https://img.shields.io/badge/${badgeSegment(link.label)}-${badgeSegment(link.value)}-${link.color}?style=for-the-badge${logo}`;
    return `  <a href="${link.url}"><img alt="${link.label}" src="${image}"></a>`;
  }).join("\n");
}

function renderFocus(focus) {
  return [
    "| Area | What I am exploring |",
    "| --- | --- |",
    ...focus.map((item) => `| **${escapeCell(item.name)}** | ${escapeCell(item.description)} |`)
  ].join("\n");
}

const TECH_BADGE_META = {
  "PHP": { color: "777BB4", logo: "php" },
  "Laravel": { color: "FF2D20", logo: "laravel" },
  "Flutter": { color: "02569B", logo: "flutter" },
  "Dart": { color: "0175C2", logo: "dart" },
  "MySQL": { color: "4479A1", logo: "mysql" },
  "PostgreSQL": { color: "4169E1", logo: "postgresql" },
  "Tailwind CSS": { color: "06B6D4", logo: "tailwindcss" },
  "Alpine.js": { color: "8BC0D0", logo: "alpinedotjs" },
  "Python": { color: "3776AB", logo: "python" },
  "C++": { color: "00599C", logo: "cplusplus" },
  "AI Agents": { color: "6C5CE7", logo: "openai" },
  "Automation": { color: "2496ED", logo: "githubactions" }
};

function renderTechBadges(techStack) {
  const badges = techStack.map((item) => {
    const meta = TECH_BADGE_META[item] || { color: "555555", logo: "" };
    const logo = meta.logo ? `&logo=${meta.logo}&logoColor=white` : "";
    const image = `https://img.shields.io/badge/${badgeSegment(item)}-${meta.color}?style=for-the-badge${logo}`;
    return `  <img src="${image}" alt="${item}">`;
  }).join("\n");
  return `<p align="center">\n${badges}\n</p>`;
}

function renderContributionsSection(githubUser) {
  return `## Contributions in the Last Year

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${githubUser}/${githubUser}/output/github-contribution-grid-snake-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${githubUser}/${githubUser}/output/github-contribution-grid-snake.svg">
    <img alt="Contribution Snake Animation" src="https://raw.githubusercontent.com/${githubUser}/${githubUser}/output/github-contribution-grid-snake.svg">
  </picture>
</p>

<p align="center">
  <img src="./assets/metrics/metrics.svg" alt="GitHub Metrics" width="100%">
</p>

## GitHub Stats

<p align="center">
  <img height="165" src="https://github-readme-stats.vercel.app/api?username=${githubUser}&show_icons=true&theme=tokyonight&hide_border=true&count_private=true" alt="GitHub Stats">
  <img height="165" src="https://github-readme-stats.vercel.app/api/top-langs/?username=${githubUser}&layout=compact&theme=tokyonight&hide_border=true" alt="Top Languages">
</p>

<p align="center">
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=${githubUser}&theme=tokyonight&hide_border=true" alt="GitHub Streak">
</p>

<p align="center">
  <img src="https://github-profile-trophy.vercel.app/?username=${githubUser}&theme=tokyonight&no-frame=true&row=1&margin-w=10" alt="Trophies">
</p>

> \u26a0\ufe0f Note: stats/streak/trophy cards above use free public services (Vercel/Heroku) that can be temporarily unavailable (503/402) during peak load. The **Metrics card** above is self-hosted via GitHub Actions and always up to date.`;
}

function renderProjects(projects) {
  return [
    "| Project | Focus | Why it matters |",
    "| --- | --- | --- |",
    ...projects.map((project) => {
      const homepage = project.homepage ? ` [Live](${project.homepage})` : "";
      return `| [**${escapeCell(project.name)}**](${project.url}) | ${escapeCell(project.focus)} | ${escapeCell(project.summary)}${homepage} |`;
    })
  ].join("\n");
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
    ? `\n## Recent Activity\n\n${ACTIVITY_START}\n${activity}\n${ACTIVITY_END}\n`
    : "";
  const techStack = renderTechBadges(config.techStack);
  const about = config.profile.about.join("\n\n");
  const githubUser = config.profile.githubUser || "rendikaadji";

  const readme = `<!-- Generated by GitHub Profile Agent Console. Edit profile.config.json, then run npm run generate. -->
<p align="center">
  <picture>
    <source media="(max-width: 760px) and (prefers-color-scheme: dark)" srcset="./assets/hero/${manifest.assets.mobileDark}">
    <source media="(max-width: 760px)" srcset="./assets/hero/${manifest.assets.mobileLight}">
    <source media="(prefers-color-scheme: dark)" srcset="./assets/hero/${manifest.assets.desktopDark}">
    <source media="(prefers-color-scheme: light)" srcset="./assets/hero/${manifest.assets.desktopLight}">
    <img src="./assets/hero/${manifest.assets.desktopDark}" alt="${config.profile.name} - ${config.profile.headline}" width="100%">
  </picture>
</p>

<p align="center">
${renderLinks(config.links)}
</p>

## About Me

${about}

## Current Focus

${renderFocus(config.focus)}

## Featured Work

${renderProjects(config.projects)}

## Research Direction

${config.research.narrative}

## Tech Stack

${techStack}

${renderContributionsSection(githubUser)}
${activitySection}
---

<p align="center">
  ${config.footer}
</p>
`;

  await writeFile(resolve(readmePath), readme);
  return readme;
}
