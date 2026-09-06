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

Create one file in `_posts/`, named `YYYY-MM-DD-some-slug.md`. Markdown or HTML
both work — the imported articles are `.html` only because they came out of the
old WYSIWYG editor.

```markdown
---
layout: article
title: "Назва статті"
description: "Один рядок опису — показується у списку статей"
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
| `description` | The teaser under the title in `/articles/`, and the `<meta name="description">`. |
| `date` | Also the sort key for `/articles/` (newest first). |

Nothing else to update — `/articles/`, `feed.xml`, `sitemap.xml` and the random
home-page teaser all pick the post up automatically. Commit and push to
`main`; the workflow rebuilds and deploys.

The sidebar shown on every page is a site-wide menu, unrelated to individual
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
| `/articles/:article_id/` | `_posts/*.html` |
| `/articles/:category_id/` | `_plugins/legacy_category_redirects.rb` → redirects to `/articles/` |
| `/articles/:category_id/:article_id/` | `_plugins/legacy_category_redirects.rb` → redirects to `/articles/:article_id/` |
| `/about/` | `about.html` |
| `/gallery/` | `gallery/index.html` |
| `/gallery/13/` | `gallery/13/index.html` |
| — | `feed.xml`, `sitemap.xml`, `articles.json` (new) |

## How the PHP mapped over

| Zend Framework | Jekyll |
| --- | --- |
| `layouts/scripts/layout.phtml` | `_layouts/default.html` + `_includes/{head,topmenu,sidebar,footer,analytics}.html` |
| `views/scripts/articles/item.phtml` | `_layouts/article.html` |
| `views/scripts/articles/category.phtml` | dropped — categories removed, see below |
| `views/scripts/index/about.phtml` | `_layouts/page.html` + `about.html` |
| `static/UPA-gallery.html` (snapshot) | `_layouts/album.html` + `_data/gallery.yml` |
| `Model_Breadcrumbs` | `_includes/breadcrumbs.html` |
| `Model_Menu::CategoryMenu` | dropped — categories removed, see below |
| `DbTable_Menu::getGeneralMenuItems` | `_data/menu.yml` (`_includes/sidebar.html`) |
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
- **The random home-page teaser now runs client-side** (`ORDER BY RAND()` has no
  static equivalent), so it still changes between visits.
- Article #65 (`[заголовок1]`, `category_id` 999) was the CMS's "new article"
  placeholder and is not imported — the PHP app filtered it out of every query.
- Google Analytics only renders in `JEKYLL_ENV=production`.
