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
- `wash1.mp4` header background video

Local preview

GitHub Pages builds with Jekyll automatically. To preview locally, install Jekyll and run:

`bundle exec jekyll serve`

Then visit `http://127.0.0.1:4000/`.
