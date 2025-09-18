# ODyn-StAndrews.github.io

Modular Jekyll site for Ocean Dynamics @ St Andrews.

How to add content

- Add a person: create a Markdown file in `_people/` with front matter:

  ---
  title: Dr. Jane Doe
  role: Expert in Computational Biology
  image: https://example.com/jane.jpg
  order: 1
  ---

  Then add the bio below the front matter. A profile page is generated at `/people/jane-doe/`, and the person appears on the homepage automatically.

- Add a research topic: create a Markdown file in `_research/` with front matter:

  ---
  title: Topic Title
  summary: One-line summary shown on home page
  image: https://example.com/topic.jpg
  order: 1
  ---

  Add detailed content below. A page is generated at `/research/topic-title/`, and the topic appears on the homepage automatically.

Structure

- `_layouts/` page templates
- `_includes/` reusable HTML snippets
- `_people/` collection of people (auto-rendered)
- `_research/` collection of research topics (auto-rendered)
- `assets/css/styles.css` site styles
- `assets/js/main.js` site JavaScript
- `assets/video/wash1.mp4` header background video

Local preview (Jekyll)

Option A: Quick one‑liner
- Install dependencies and serve in one go:
  - `BUNDLE_PATH=vendor/bundle bundle install && bundle exec jekyll serve --livereload`
  - Open: http://127.0.0.1:4000/

Option B: Helper script
- Run `./scripts/serve.sh`
- It installs gems locally under `vendor/bundle` and starts the server detached.
- Open: http://127.0.0.1:4000/

Notes
- Requires Ruby (>= 3.0 recommended) and Bundler (`gem install bundler`).
- Live reload rebuilds on file changes. Stop the detached server with `pkill -f jekyll` if needed.

Publications data and author highlighting

- Source: Publications are fetched via ORCID (preferred) and resolved with Crossref.
- Filtering: Only peer‑reviewed journal articles are kept (`type == journal-article`).
- Who is included: Only current members with an `orcid` set in `_data/members.yml`.
- Highlighting: On the homepage, authors that match an Ocean Dynamics member are bolded.
  - Matching uses case‑insensitive normalization that removes spaces, periods, commas, and hyphens.
  - It also matches on first‑initial + last name (e.g., `gmacgilchrist`, `macgilchristg`).
  - For names with diacritics or known variants, add `aliases:` under that member, e.g.:

    - slug: nelson-poumaere
      name: Nelson Poumaëre
      orcid: 0000-0000-0000-0000
      aliases:
        - Nelson Poumaere

- Update: Trigger the GitHub Action “Update publications” (manual or weekly), or run locally:

  `python3 scripts/update_publications.py`
