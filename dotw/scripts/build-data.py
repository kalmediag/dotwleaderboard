import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

LEADERBOARD = [
    ("Xhawkzy", 53, 13, 4, 189),
    ("Prime", 9, 7, 3, 44),
    ("Strian", 3, 7, 13, 36),
    ("Aichi", 5, 7, 2, 31),
    ("Dayhou", 4, 5, 7, 29),
    ("Wasureta", 2, 8, 3, 25),
    ("JB", 2, 5, 6, 22),
    ("Boor", 4, 2, 4, 20),
    ("Nathea", 2, 4, 4, 18),
    ("Yand", 2, 2, 8, 18),
    ("Synz", 1, 2, 7, 14),
    ("7co", 0, 3, 5, 11),
    ("Famfd", 2, 1, 1, 9),
    ("JG", 2, 1, 1, 9),
    ("mgdzns", 1, 2, 1, 8),
    ("Plackoo", 1, 2, 1, 8),
    ("Ryu", 1, 2, 1, 8),
    ("Nizardzns", 0, 3, 2, 8),
    ("wow", 0, 3, 2, 8),
    ("Nath92", 0, 1, 5, 7),
    ("Gehor", 1, 1, 0, 5),
    ("Cassius", 0, 2, 0, 4),
    ("Finn", 0, 1, 2, 4),
    ("Silva", 1, 0, 0, 3),
    ("Tony", 1, 0, 0, 3),
    ("Adrian", 0, 1, 1, 3),
    ("Nabil", 0, 1, 1, 3),
    ("Vino", 0, 1, 1, 3),
    ("Apis", 0, 1, 0, 2),
    ("Kibord", 0, 1, 0, 2),
    ("Panji", 0, 1, 0, 2),
    ("Rayhan", 0, 1, 0, 2),
    ("BobonDesign", 0, 0, 2, 2),
    ("dae.fut", 0, 0, 1, 1),
    ("Lexy", 0, 0, 1, 1),
    ("M-lan", 0, 0, 1, 1),
    ("Myles", 0, 0, 1, 1),
    ("Impface", 0, 0, 1, 1),
]

ALIASES = {
    "xhawkzy": "Xhawkzy",
    "xhawkzy17": "Xhawkzy",
    "xhawsky": "Xhawkzy",
    "xhawshy": "Xhawkzy",
    "prime": "Prime",
    "primebits": "Prime",
    "⍟ㄕr!mσ™": "Prime",
    "⍟ㄕr!mΣ™".lower(): "Prime",
    "strian": "Strian",
    "striancardcreator": "Strian",
    "aichi": "Aichi",
    "aichi331": "Aichi",
    "dayhou": "Dayhou",
    "wasureta": "Wasureta",
    "wasuretaaaa.": "Wasureta",
    "jb": "JB",
    "iamjb.": "JB",
    "㊄ 𝐉𝔹™".lower(): "JB",
    "boor": "Boor",
    "b00r0.": "Boor",
    "kingboor.": "Boor",
    "nathea": "Nathea",
    "nathyf1ve": "Nathea",
    "yand": "Yand",
    "yan": "Yand",
    "yanddzns.": "Yand",
    "synz": "Synz",
    "synzz_zz": "Synz",
    "7co": "7co",
    "famfd": "Famfd",
    "famreth": "Famfd",
    "jg": "JG",
    "jggg388": "JG",
    "'𝕁g".lower(): "JG",
    "mgdzns": "mgdzns",
    "! mgdzns ✘": "mgdzns",
    "plackoo": "Plackoo",
    "ryu": "Ryu",
    "nizardzns": "Nizardzns",
    "nizardiamond25": "Nizardzns",
    "wow": "wow",
    "._.wow_.": "wow",
    "nath92": "Nath92",
    "gehor": "Gehor",
    "ske-va": "Gehor",
    "vaske": "Gehor",
    "vaske6160": "Gehor",
    "cassius": "Cassius",
    "cassius05": "Cassius",
    "finn": "Finn",
    "finndesign02": "Finn",
    "silva": "Silva",
    "tony": "Tony",
    "adrian": "Adrian",
    "nabil": "Nabil",
    "nabil1695": "Nabil",
    "vino": "Vino",
    "apis": "Apis",
    "kibord": "Kibord",
    "panji": "Panji",
    "rayhan": "Rayhan",
    "rayhan0162_95845": "Rayhan",
    "bobondesign": "BobonDesign",
    "dae.fut": "dae.fut",
    "lexy": "Lexy",
    "lexy4azarne": "Lexy",
    "m-lan": "M-lan",
    "myles": "Myles",
    "impface": "Impface",
    "i b a g impface™": "Impface",
}


def slugify(value):
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def strip_tags(value):
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def normalize_name(value):
    if not value:
        return ""
    clean = value.lstrip("@").strip()
    return ALIASES.get(clean.lower(), clean)


def parse_date(timestamp):
    match = re.match(r"^(\d{2})/(\d{2})/(\d{4})", timestamp or "")
    if not match:
        return ""
    return f"{match.group(3)}-{match.group(1)}-{match.group(2)}"


def placement_from_text(text):
    clean = text.strip().lower()
    if re.match(r"^(1|#1|🥇)\b", clean) or clean.startswith("🥇.") or clean.startswith("winner"):
        return 1
    if re.match(r"^(2|#2|🥈)\b", clean) or clean.startswith("🥈."):
        return 2
    if re.match(r"^(3|#3|🥉)\b", clean) or clean.startswith("🥉."):
        return 3
    match = re.match(r"^#?(\d{1,2})(?:[\).\s]|$)", clean)
    if match:
        return int(match.group(1))
    return None


def points_for(placement):
    return {1: 3, 2: 2, 3: 1}.get(placement, 0)


def designer_from_text(text):
    lowered = text.lower()
    for alias, name in ALIASES.items():
        if len(alias) > 2 and alias.lower() in lowered:
            return name
    return ""


def load_export_data(source):
    match = re.search(r'<script type="application/json" id="export-data">([\s\S]*?)</script>', source)
    if not match:
        return {"users": {}}
    return json.loads(match.group(1))


PROFILE_PAGE = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Designer Profile | Entity Designs DOTW</title>
    <link rel="stylesheet" href="../styles/main.css">
    <script type="module" src="../scripts/app.js" defer></script>
  </head>
  <body data-page="designer" data-base="..">
    <main class="page">
      <section class="shell" data-designer-profile></section>
    </main>
  </body>
</html>
"""


def main():
    source = (ROOT / "dotw-page-1.html").read_text(encoding="utf-8")
    export_data = load_export_data(source)
    users = export_data.get("users", {})

    leaderboard = []
    for index, (name, wins, second, third, points) in enumerate(LEADERBOARD, start=1):
        slug = slugify(name)
        matched_user = None
        for user in users.values():
            names = [normalize_name(user.get("displayName")), normalize_name(user.get("username"))]
            if name in names:
                matched_user = user
                break
        local_avatar = f"images/profiles/{slug}.png"
        leaderboard.append(
            {
                "rank": index,
                "name": name,
                "slug": slug,
                "wins": wins,
                "second": second,
                "third": third,
                "points": points,
                "avatar": local_avatar if (ROOT / local_avatar).exists() else (matched_user.get("avatarUrl") if matched_user else local_avatar),
            }
        )

    entries = []
    weeks = {}
    week_counter = 0
    last_timestamp = ""
    message_pattern = re.compile(
        r'<div class="message[^"]*" id="msg-([^"]+)" data-message-id="([^"]+)">([\s\S]*?)(?=\s*<div class="message[^"]*" id="msg-|\s*<div class="date-divider"|\s*</main>)'
    )

    for _, message_id, block in message_pattern.findall(source):
        timestamp_match = re.search(r'<span class="(?:timestamp|grouped-timestamp)">([^<]+)</span>', block)
        if timestamp_match:
            last_timestamp = timestamp_match.group(1)
        judged_date = parse_date(last_timestamp)
        if not judged_date or judged_date < "2024-06-22":
            continue

        text_match = re.search(r'<div class="message-text">([\s\S]*?)</div>', block)
        if not text_match:
            continue
        text_html = text_match.group(1)
        text = strip_tags(text_html)
        placement = placement_from_text(text)
        if not placement:
            continue

        mentions = []
        for user_id, mention_text in re.findall(r'<span class="user-mention" data-user-id="([^"]+)">([^<]+)</span>', text_html):
            user = users.get(user_id, {})
            mentions.append(normalize_name(user.get("displayName") or user.get("username") or mention_text))

        designer = (normalize_name(mentions[0]) if mentions else "") or designer_from_text(text)
        if not designer:
            continue

        if judged_date not in weeks:
            week_counter += 1
            weeks[judged_date] = week_counter

        image_match = re.search(r'<img class="attachment-preview attachment-preview-img" src="([^"]+)" alt="([^"]*)"', block)
        image_path = image_match.group(1) if image_match else ""
        image_exists = bool(image_path and (ROOT / image_path).exists())
        rating_match = re.search(r"(\d+(?:\.\d+)?)\s*/\s*10", text)
        slug = slugify(designer)
        entry_id = f"week-{weeks[judged_date]:03d}-{slug}-{placement}-{message_id}"

        entries.append(
            {
                "id": entry_id,
                "designer": designer,
                "designerSlug": slug,
                "collaborators": [name for name in mentions[1:] if name != designer],
                "week": weeks[judged_date],
                "dateJudged": judged_date,
                "placement": placement,
                "points": points_for(placement),
                "rating": float(rating_match.group(1)) if rating_match else None,
                "image": image_path if image_exists else "",
                "localImage": image_path if image_exists else "",
                "imageAlt": html.unescape(image_match.group(2)) if image_match else "",
                "exportedImage": image_path,
                "source": f"dotw-page-1.html#msg-{message_id}",
                "notes": text,
            }
        )

    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "leaderboard.json").write_text(json.dumps(leaderboard, indent=2) + "\n", encoding="utf-8")
    (ROOT / "data" / "entries.json").write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")

    (ROOT / "designers").mkdir(exist_ok=True)
    (ROOT / "designers" / "index.html").write_text(PROFILE_PAGE, encoding="utf-8")
    for designer in leaderboard:
        folder = ROOT / designer["slug"]
        folder.mkdir(exist_ok=True)
        (folder / "index.html").write_text(PROFILE_PAGE, encoding="utf-8")

    print(f"Wrote {len(leaderboard)} leaderboard rows and {len(entries)} archive entries.")


if __name__ == "__main__":
    main()
