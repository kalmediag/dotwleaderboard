const body = document.body;
const base = body.dataset.base || ".";

const state = {
  leaderboard: [],
  entries: [],
};

const readJson = async (file) => {
  const response = await fetch(`${base}/data/${file}`);
  if (!response.ok) throw new Error(`Could not load ${file}`);
  return response.json();
};

const asset = (assetPath) => {
  if (!assetPath) return "";
  if (/^https?:\/\//.test(assetPath)) return assetPath;
  return `${base}/${assetPath}`;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const initials = (name) =>
  name
    .split(/\s|\.|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const placementLabel = (placement) => {
  if (placement === 1) return "1st";
  if (placement === 2) return "2nd";
  if (placement === 3) return "3rd";
  if (placement % 100 >= 11 && placement % 100 <= 13) return `${placement}th`;
  if (placement % 10 === 1) return `${placement}st`;
  if (placement % 10 === 2) return `${placement}nd`;
  if (placement % 10 === 3) return `${placement}rd`;
  return `${placement}th`;
};

const currentSort = () => {
  const sort = new URLSearchParams(window.location.search).get("sort");
  return sort === "oldest" ? "oldest" : "newest";
};

const currentQuery = () => new URLSearchParams(window.location.search).get("q")?.trim() || "";

const searchUrl = (params = {}) => {
  const next = new URLSearchParams(window.location.search);
  Object.entries(params).forEach(([key, value]) => {
    if (value) next.set(key, value);
    else next.delete(key);
  });
  const query = next.toString();
  return query ? `?${query}` : window.location.pathname;
};

const sortEntries = (entries, sort = currentSort()) =>
  [...entries].sort((a, b) => {
    const dateCompare = sort === "oldest" ? a.week - b.week : b.week - a.week;
    return dateCompare || a.placement - b.placement || a.designer.localeCompare(b.designer);
  });

const sortControls = (sort = currentSort()) => `
  <div class="sort-control" aria-label="Sort designs">
    <a class="${sort === "newest" ? "active" : ""}" href="${searchUrl({ sort: "newest" })}">Newest</a>
    <a class="${sort === "oldest" ? "active" : ""}" href="${searchUrl({ sort: "oldest" })}">Oldest</a>
  </div>
`;

const searchForm = (query = currentQuery(), placeholder = "Search designer") => `
  <form class="search-form" role="search">
    <label class="sr-only" for="designer-search">Search designer</label>
    <input id="designer-search" name="q" type="search" value="${escapeHtml(query)}" placeholder="${escapeHtml(placeholder)}" autocomplete="off">
    <input type="hidden" name="sort" value="${currentSort()}">
    <button type="submit">Search</button>
    ${query ? `<a class="clear-search" href="${searchUrl({ q: "" })}">Clear</a>` : ""}
  </form>
`;

const matchesDesignerQuery = (designer, query = currentQuery()) => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return [designer.name, designer.slug].some((value) => value?.toLowerCase().includes(needle));
};

const matchesEntryQuery = (entry, query = currentQuery()) => {
  if (!query) return true;
  const needle = query.toLowerCase();
  return [entry.designer, entry.designerSlug, ...(entry.collaborators || []), entry.notes]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle));
};

const formatDate = (value) => {
  if (!value) return "Unknown date";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const imageMarkup = (src, alt, className = "") => {
  if (!src) return `<span class="image-placeholder">Image pending</span>`;
  return `<img class="${className}" src="${asset(src)}" alt="${alt || ""}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'image-placeholder', textContent: 'Image unavailable' }))">`;
};

const avatarMarkup = (designer, size = "avatar") => {
  if (!designer?.avatar) return `<span class="${size}-fallback">${initials(designer?.name || "?")}</span>`;
  return `<img class="${size}" src="${asset(designer.avatar)}" alt="${designer.name} profile picture" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: '${size}-fallback', textContent: '${initials(designer.name)}' }))">`;
};

const designHref = (entry) => `${base}/designs/?id=${encodeURIComponent(entry.id)}`;
const designerHref = (designer) => `${base}/${designer.slug}/`;

const renderDesignCard = (entry) => `
  <a class="design-card" href="${designHref(entry)}">
    <div class="design-card-media">${imageMarkup(entry.localImage || entry.image, entry.imageAlt || `${entry.designer} DOTW design`)}</div>
    <div class="design-card-body">
      <div class="meta-row">
        <span>Week ${entry.week}</span>
        <span class="placement-pill">${placementLabel(entry.placement)}</span>
      </div>
      <h3 class="design-title">${entry.designer}</h3>
      <div class="meta-row">
        <span>${formatDate(entry.dateJudged)}</span>
        <span>${entry.rating ? `${entry.rating}/10` : "No rating"}</span>
      </div>
    </div>
  </a>
`;

const renderWeeks = () => {
  const mount = document.querySelector("[data-weeks-archive]");
  if (!mount) return;

  const query = currentQuery();
  const filteredEntries = state.entries.filter((entry) => matchesEntryQuery(entry, query));
  const weeks = new Map();
  for (const entry of filteredEntries) {
    if (!weeks.has(entry.week)) weeks.set(entry.week, []);
    weeks.get(entry.week).push(entry);
  }

  const sort = currentSort();
  const sortedWeeks = [...weeks.entries()]
    .sort((a, b) => (sort === "oldest" ? a[0] - b[0] : b[0] - a[0]))
    .map(([week, entries]) => [
      week,
      entries.sort((a, b) => a.placement - b.placement || a.designer.localeCompare(b.designer)),
    ]);

  document.title = "DOTW Weekly Archive | Entity Designs";
  mount.innerHTML = `
    <header class="masthead">
      <div>
        <p class="eyebrow">Entity Designs</p>
        <h1>DOTW Weeks</h1>
        <p class="brandline"><a href="${base}/">Leaderboard</a> / Every archived DOTW week and design.</p>
      </div>
      <div class="summary" aria-label="Weekly archive summary">
        ${searchForm(query, "Search a designer")}
        ${sortControls(sort)}
        <div class="stat"><span>Weeks</span><strong>${sortedWeeks.length}</strong></div>
        <div class="stat"><span>Designs</span><strong>${filteredEntries.length}</strong></div>
      </div>
    </header>

    <div class="weeks-stack">
      ${
        sortedWeeks.length
          ? sortedWeeks
              .map(([week, entries]) => {
                const judgedDate = entries[0]?.dateJudged || "";
                return `
                  <section class="archive-panel week-panel" id="week-${week}">
                    <header class="archive-panel-header">
                      <div>
                        <p class="eyebrow">Week ${week}</p>
                        <h2>${formatDate(judgedDate)}</h2>
                      </div>
                      <span class="archive-count">${entries.length} designs</span>
                    </header>
                    <div class="design-grid">${entries.map(renderDesignCard).join("")}</div>
                  </section>
                `;
              })
              .join("")
          : `<section class="archive-panel"><div class="empty-state">No DOTW designs found for "${escapeHtml(query)}".</div></section>`
      }
    </div>
  `;
};

const renderLeaderboard = () => {
  const tableBody = document.querySelector("[data-leaderboard-body]");
  if (!tableBody) return;

  const query = currentQuery();
  const filteredDesigners = state.leaderboard.filter((designer) => matchesDesignerQuery(designer, query));
  document.querySelector("[data-leaderboard-search]")?.replaceChildren();
  document.querySelector("[data-leaderboard-search]")?.insertAdjacentHTML("beforeend", searchForm(query, "Search a designer"));

  tableBody.innerHTML = filteredDesigners.length
    ? filteredDesigners
    .map((designer) => {
      const rankClass = designer.rank === 1 ? "gold" : designer.rank === 2 ? "silver" : designer.rank === 3 ? "bronze" : "";
      const rowClass = designer.rank === 1 ? "top-one" : designer.rank === 2 ? "top-two" : designer.rank === 3 ? "top-three" : "";
      return `
        <tr class="${rowClass} clickable" data-href="${designerHref(designer)}">
          <td><span class="rank ${rankClass}">${designer.rank}</span></td>
          <td>
            <a class="designer-cell" href="${designerHref(designer)}">
              ${avatarMarkup(designer)}
              <span>${designer.name}</span>
            </a>
          </td>
          <td>${designer.wins}</td>
          <td>${designer.second}</td>
          <td>${designer.third}</td>
          <td>${designer.points}</td>
        </tr>
      `;
    })
    .join("")
    : `<tr><td colspan="6"><span class="empty-row">No designers found for "${escapeHtml(query)}".</span></td></tr>`;

  tableBody.querySelectorAll("tr[data-href]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      window.location.href = row.dataset.href;
    });
  });
};

const currentDesignerSlug = () => {
  const fromQuery = new URLSearchParams(window.location.search).get("designer");
  if (fromQuery) return slugify(fromQuery);
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts.at(-1) === "designers" ? "" : parts.at(-1);
};

const renderDesigner = () => {
  const mount = document.querySelector("[data-designer-profile]");
  if (!mount) return;

  const slug = currentDesignerSlug();
  const designer = state.leaderboard.find((item) => item.slug === slug);
  const entries = sortEntries(state.entries.filter((entry) => entry.designerSlug === slug));

  if (!designer) {
    mount.innerHTML = `
      <p class="eyebrow">Entity Designs</p>
      <h1>Designer not found</h1>
      <p class="brandline"><a href="${base}/">Back to leaderboard</a></p>
    `;
    return;
  }

  document.title = `${designer.name} | Entity Designs DOTW`;
  mount.innerHTML = `
    <header class="profile-hero">
      ${avatarMarkup(designer, "profile-avatar")}
      <div>
        <p class="eyebrow">Entity Designs</p>
        <h1>${designer.name}</h1>
        <p class="brandline"><a href="${base}/">Leaderboard</a> / Designer profile</p>
      </div>
    </header>

    <div class="summary" aria-label="${designer.name} totals">
      <div class="stat"><span>Wins</span><strong>${designer.wins}</strong></div>
      <div class="stat"><span>2nd</span><strong>${designer.second}</strong></div>
      <div class="stat"><span>3rd</span><strong>${designer.third}</strong></div>
      <div class="stat"><span>Points</span><strong>${designer.points}</strong></div>
      ${sortControls()}
    </div>

    <section class="archive-panel" style="margin-top:18px">
      <header class="archive-panel-header">
        <h2>DOTW Designs</h2>
        <span class="archive-count">${entries.length} archived designs</span>
      </header>
      ${
        entries.length
          ? `<div class="design-grid">${entries.map(renderDesignCard).join("")}</div>`
          : `<div class="empty-state">No archived designs are matched to this profile yet.</div>`
      }
    </section>
  `;
};

const renderDetail = () => {
  const mount = document.querySelector("[data-design-detail]");
  if (!mount) return;

  const id = new URLSearchParams(window.location.search).get("id");
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) {
    mount.innerHTML = `
      <p class="eyebrow">Entity Designs</p>
      <h1>Design not found</h1>
      <p class="brandline"><a href="${base}/">Back to leaderboard</a></p>
    `;
    return;
  }

  const designer = state.leaderboard.find((item) => item.slug === entry.designerSlug);
  document.title = `Week ${entry.week} ${entry.designer} Design | Entity Designs DOTW`;
  mount.innerHTML = `
    <header class="masthead">
      <div>
        <p class="eyebrow">Entity Designs</p>
        <h1>Week ${entry.week} Design</h1>
        <p class="brandline"><a href="${base}/">Leaderboard</a> / <a href="${base}/${entry.designerSlug}/">${entry.designer}</a></p>
      </div>
    </header>

    <section class="design-detail">
      <div class="design-detail-media">${imageMarkup(entry.localImage || entry.image, entry.imageAlt || `${entry.designer} DOTW design`)}</div>
      <aside class="detail-panel">
        <div class="detail-panel-inner">
          <div class="designer-cell">
            ${avatarMarkup(designer || { name: entry.designer })}
            <strong>${entry.designer}</strong>
          </div>
          <div class="detail-list">
            <div class="detail-item"><span>Placement</span><span>${placementLabel(entry.placement)}</span></div>
            <div class="detail-item"><span>Rating</span><span>${entry.rating ? `${entry.rating}/10` : "No rating"}</span></div>
            <div class="detail-item"><span>Date judged</span><span>${formatDate(entry.dateJudged)}</span></div>
            <div class="detail-item"><span>DOTW week</span><span>${entry.week}</span></div>
            <div class="detail-item"><span>Points</span><span>${entry.points}</span></div>
            <div class="detail-item"><span>Collaborators</span><span>${entry.collaborators.length ? entry.collaborators.join(", ") : "None listed"}</span></div>
          </div>
          <p class="brandline">${entry.notes || "No notes provided."}</p>
          ${entry.source ? `<p><a class="button-link" href="${asset(entry.source)}">Open source message</a></p>` : ""}
        </div>
      </aside>
    </section>
  `;
};

const init = async () => {
  try {
    const [leaderboard, entries] = await Promise.all([readJson("leaderboard.json"), readJson("entries.json")]);
    state.leaderboard = leaderboard;
    state.entries = entries;
    renderLeaderboard();
    renderDesigner();
    renderDetail();
    renderWeeks();
  } catch (error) {
    document.querySelector(".shell")?.insertAdjacentHTML("beforeend", `<div class="empty-state">${error.message}</div>`);
  }
};

init();
