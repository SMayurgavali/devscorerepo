// Real public-API integrations.
// All endpoints used here are CORS-enabled and require no auth.
// For platforms without a friendly public API (HackerRank), we accept manual
// entry — the same approach used by other talent platforms.

import type { UserStats } from "./db";

/**
 * Extracts a username or handle from a full URL.
 * Handles cases like:
 * - https://github.com/username
 * - https://leetcode.com/username/
 * - https://leetcode.com/u/username/
 * - username
 */
export function parseHandle(input: string, platform: string): string {
  const s = input.trim();
  if (!s) return "";
  if (!s.includes("/")) return s;
  try {
    const url = new URL(s.startsWith("http") ? s : `https://${s}`);
    const parts = url.pathname.split("/").filter(Boolean);
    if (platform === "leetcode") {
      // leetcode.com/u/username -> username
      if (parts[0] === "u" && parts[1]) return parts[1];
      return parts[0] || s;
    }
    if (platform === "linkedin") {
      // linkedin.com/in/username -> username
      const inIdx = parts.indexOf("in");
      if (inIdx !== -1 && parts[inIdx + 1]) return parts[inIdx + 1];
    }
    return parts[0] || s;
  } catch {
    return s;
  }
}

export async function fetchGithubStats(username: string): Promise<NonNullable<UserStats["github"]>> {
  const u = encodeURIComponent(parseHandle(username, "github"));
  const [userRes, reposRes, eventsRes] = await Promise.all([
    fetch(`https://api.github.com/users/${u}`),
    fetch(`https://api.github.com/users/${u}/repos?per_page=100&sort=updated`),
    fetch(`https://api.github.com/users/${u}/events/public?per_page=100`),
  ]);
  if (!userRes.ok) throw new Error(`GitHub user '${username}' not found`);
  const user = await userRes.json();
  const repos: any[] = reposRes.ok ? await reposRes.json() : [];
  const events: any[] = eventsRes.ok ? await eventsRes.json() : [];

  const totalStars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((a, r) => a + (r.forks_count || 0), 0);
  const languages: Record<string, number> = {};
  for (const r of repos) if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;

  const pushEvents = events.filter((e: any) => e.type === "PushEvent");
  const recentCommits = pushEvents.reduce((a: number, e: any) => a + (e.payload?.commits?.length || 0), 0);

  const days = new Set(pushEvents.map((e: any) => new Date(e.created_at).toISOString().slice(0, 10)));
  const sortedDays = [...days].sort().reverse();
  let streakDays = 0;
  if (sortedDays.length > 0) {
    let cur = new Date(sortedDays[0]);
    for (const d of sortedDays) {
      const dt = new Date(d);
      const diff = Math.round((cur.getTime() - dt.getTime()) / 86400000);
      if (diff === streakDays) { streakDays++; cur = dt; } else break;
    }
  }

  return {
    followers: user.followers || 0,
    publicRepos: user.public_repos || 0,
    totalStars, totalForks, languages, recentCommits, streakDays,
    avatar: user.avatar_url,
  } as NonNullable<UserStats["github"]>;
}

export async function fetchGitlabStats(username: string): Promise<NonNullable<UserStats["gitlab"]>> {
  const u = encodeURIComponent(parseHandle(username, "gitlab"));
  const res = await fetch(`https://gitlab.com/api/v4/users?username=${u}`);
  if (!res.ok) throw new Error("GitLab lookup failed");
  const arr = await res.json();
  if (!arr.length) throw new Error(`GitLab user '${username}' not found`);
  const id = arr[0].id;
  const [reposRes, followersRes] = await Promise.all([
    fetch(`https://gitlab.com/api/v4/users/${id}/projects?per_page=100`),
    fetch(`https://gitlab.com/api/v4/users/${id}/followers`),
  ]);
  const repos = reposRes.ok ? await reposRes.json() : [];
  const followers = followersRes.ok ? await followersRes.json() : [];
  return { publicRepos: repos.length, followers: followers.length };
}

export async function fetchLeetcodeStats(username: string): Promise<NonNullable<UserStats["leetcode"]>> {
  const u = encodeURIComponent(parseHandle(username, "leetcode"));
  // Use Faisal Shohag's Vercel-hosted API as it's more reliable than the Heroku one.
  const res = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${u}`);
  if (!res.ok) {
    // Fallback to Heroku if Vercel is down
    const fb = await fetch(`https://leetcode-stats-api.herokuapp.com/${u}`);
    if (!fb.ok) throw new Error("LeetCode lookup failed");
    const fbData = await fb.json();
    if (fbData.status && fbData.status !== "success") throw new Error(fbData.message || "LeetCode user not found");
    return {
      totalSolved: fbData.totalSolved || 0,
      easySolved: fbData.easySolved || 0,
      mediumSolved: fbData.mediumSolved || 0,
      hardSolved: fbData.hardSolved || 0,
      ranking: fbData.ranking || 0,
      acceptanceRate: fbData.acceptanceRate || 0,
    };
  }
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0]?.message || "LeetCode user not found");
  
  return {
    totalSolved: data.totalSolved || 0,
    easySolved: data.easySolved || 0,
    mediumSolved: data.mediumSolved || 0,
    hardSolved: data.hardSolved || 0,
    ranking: data.ranking || 0,
    acceptanceRate: data.acceptanceRate || 0,
  };
}

export async function fetchCodechefStats(username: string): Promise<NonNullable<UserStats["codechef"]>> {
  const u = encodeURIComponent(parseHandle(username, "codechef"));
  // Community-maintained CORS proxy of CodeChef profile.
  const res = await fetch(`https://codechef-api.vercel.app/handle/${u}`);
  if (!res.ok) throw new Error("CodeChef lookup failed");
  const data = await res.json();
  if (!data || data.success === false) throw new Error("CodeChef user not found");
  return {
    rating: Number(data.currentRating) || 0,
    stars: Number((data.stars || "").toString().replace("★", "")) || 0,
    problemsSolved: 0, // not exposed by this endpoint
  };
}
