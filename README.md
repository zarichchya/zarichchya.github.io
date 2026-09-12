# Моє Заріччя над Прутом — Jekyll site

Static Jekyll rebuild of the Zend Framework 1 application that previously served
this site. All content now comes from files in this repo; there is no database
and no PHP at runtime.

Published to <https://zarichchya.github.io> by
`.github/workflows/pages.yml` on every push to `main`.

## Build

No local Ruby needed — everything runs in Docker:

```sh
docker compose run --rm build   # build into _site/
docker compose up serve         # http://localhost:4000 with live reload
```

With a local Ruby toolchain:

```sh
bundle install
bundle exec jekyll serve
```

## Adding a new article

Create one Markdown file in `_posts/`, named `YYYY-MM-DD-some-slug.md` — or
use the CMS at `/admin/`, which writes the same file. Every article is
Markdown.

```markdown
---
layout: article
title: "Назва статті"
date: 2026-08-02
article_id: 66
---

Текст статті у **Markdown**.
```

What each field is for:

| Field | Why it matters |
| --- | --- |
| `article_id` | Any unused number. `_plugins/permalinks.rb` derives the article's permalink from it (`/articles/<article_id>/`), and its mere presence is what makes the breadcrumb render the "Статті" crumb. |
| `permalink` | Only set this to opt out with a free-form slug — omit it and it's auto-generated from `article_id` (see above). |
| first paragraph | There's no separate description field: the article's first paragraph (Jekyll's excerpt, via `_includes/post-summary.html`) is its summary in `/articles/`, the home-page teaser and the `<meta name="description">`. Open with a sentence that sums the article up. |
| `date` | Also the sort key for `/articles/` (newest first). |

Nothing else to update — `/articles/`, `feed.xml`, `sitemap.xml`, the search
index (`search.json`) and the random home-page teaser all pick the post up
automatically. Commit and push to
`main`; the workflow rebuilds and deploys.

The top bar shown on every page is a site-wide menu, unrelated to individual
articles — edit `_data/menu.yml` for that.

## Provenance

`_posts/` was originally imported from the old application's MySQL dump by a
one-shot script. The migration script and the dump have both been deleted —
every file here is hand-maintained, and articles are added by writing files
as above.

## URLs

Every legacy URL still resolves, so inbound links and search results keep
working. `_plugins/permalinks.rb` derives each post's permalink from
`article_id`, and `_plugins/legacy_category_redirects.rb` generates a thin
redirect page for every `(legacy category id) × (post)` combination at build
time — since `article_id` alone is globally unique and picks the redirect
target, it doesn't matter whether a given old category id was ever really
paired with that article:

| Legacy route | Jekyll source |
| --- | --- |
| `/` | `index.html` |
| `/articles/` | `articles/index.html` (flat list, newest first) |
| `/articles/:article_id/` | `_posts/*.md` |
| `/articles/:category_id/` | `_plugins/legacy_category_redirects.rb` → redirects to `/articles/` |
| `/articles/:category_id/:article_id/` | `_plugins/legacy_category_redirects.rb` → redirects to `/articles/:article_id/` |
| `/about/` | `about.html` |
| `/gallery/` | `gallery/index.html` |
| `/gallery/13/` | `gallery/13/index.html` |
| `/search/` (new) | `search.html` + `js/search.js`, over `search.json` |
| — | `feed.xml`, `sitemap.xml`, `articles.json`, `search.json` (new) |

## How the PHP mapped over

| Zend Framework | Jekyll |
| --- | --- |
| `layouts/scripts/layout.phtml` | `_layouts/default.html` + `_includes/{head,topmenu,footer,analytics}.html` |
| `views/scripts/articles/item.phtml` | `_layouts/article.html` |
| `views/scripts/articles/category.phtml` | dropped — categories removed, see below |
| `views/scripts/index/about.phtml` | `_layouts/page.html` + `about.html` |
| `static/UPA-gallery.html` (snapshot) | `_layouts/album.html` + `_data/gallery.yml` |
| `Model_Breadcrumbs` | dropped — see below |
| `Model_Menu::CategoryMenu` | dropped — categories removed, see below |
| `DbTable_Menu::getGeneralMenuItems` | `_data/menu.yml` (`_includes/topmenu.html`) |
| `Model_Photos::FirstPageImageSlider` | `site.static_files` loop in `index.html` |
| `Model_ArticlesGeneral::getRandomArticle` | `articles.json` + `js/random-article.js` |
| `settings` table | `_config.yml` |
| `AdminController` / TinyMCE CMS | dropped — edit files and rebuild |

## Notes

- **The imported posts' dates are synthetic.** The `articles` table had no
  timestamps, so the import dated them backwards from 2015-08-25 (the day the
  dump was taken) in the order the PHP app displayed them. `/articles/` now
  sorts on this same date, newest first.
- **Categories were removed in 2026.** The site used to group articles under
  categories (`_data/categories.yml`, `_layouts/category.html`,
  `_plugins/category_pages.rb`, a `category_id` on every post, a category
  sidebar mode); `/articles/` is now a single flat, newest-first list, and no
  post front matter mentions categories anymore. Pre-2026 category-based URLs
  still redirect instead of 404ing — see `_plugins/legacy_category_redirects.rb`
  and the URLs table above.
- **The sidebar and breadcrumb trail were removed in 2026.** Every page used
  to carry a second nav column (`_includes/sidebar.html`, `_data/menu.yml`'s
  `sidebar:` list) and a breadcrumb trail (`_includes/breadcrumbs.html`).
  Both are gone: the top bar (`_includes/topmenu.html`, `_data/menu.yml`'s
  `top:` list) is now the site's only nav, and it highlights the current
  section (a `.current` class on the matching link, computed from `page.url`
  in `_includes/topmenu.html`) instead of a breadcrumb trail saying where you
  are.
- **The random home-page teaser now runs client-side** (`ORDER BY RAND()` has no
  static equivalent), so it still changes between visits.
- Article #65 (`[заголовок1]`, `category_id` 999) was the CMS's "new article"
  placeholder and is not imported — the PHP app filtered it out of every query.
- Google Analytics only renders in `JEKYLL_ENV=production`.
