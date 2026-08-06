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
description: "Один рядок опису — показується у списках розділу"
date: 2026-08-02
permalink: /articles/7/nazva-statti/
article_id: 66
category_id: 7
category_name: "Дослідження краєзнавців"
priority: 1
sidebar: category
---

Текст статті у **Markdown**.
```

What each field is for:

| Field | Why it matters |
| --- | --- |
| `category_id` | **Puts the link in the sidebar.** `_includes/sidebar.html` selects posts by this and it must match a row in `_data/categories.yml`. |
| `priority` | Position within the sidebar and the category listing, ascending. Not the date. |
| `category_name` | The sidebar heading and the breadcrumb label. |
| `sidebar: category` | Shows the category menu instead of the site-wide one. |
| `article_id` | Any unused number. Only needs to be present so the breadcrumb renders the category crumb. |
| `permalink` | Free-form for new articles. Only the imported ones need their legacy `/articles/<cat>/<id>/` form. |
| `description` | The teaser under the title in listings, and the `<meta name="description">`. |

Nothing else to update — the sidebar, the category page, `/articles/`,
`feed.xml`, `sitemap.xml` and the random home-page teaser all pick the post up
from `category_id` and `priority`. Commit and push to `main`; the workflow
rebuilds and deploys.

The sidebar shown on the home, about and gallery pages is a different, site-wide
menu — edit `_data/menu.yml` for that. To add a whole new category, add a row to
`_data/categories.yml` and a listing page at `articles/<id>/index.html` (copy an
existing one).

## Provenance

`_posts/`, `_data/categories.yml` and `articles/<id>/` were originally imported
from the old application's MySQL dump by a one-shot script. The migration is
finished and both the script and the dump have been deleted — every file here is
now hand-maintained, and articles are added by writing files as above.

## URLs

Every legacy URL still resolves, so inbound links and search results keep
working. Posts carry an explicit `permalink` built from the old primary keys:

| Legacy route | Jekyll source |
| --- | --- |
| `/` | `index.html` |
| `/articles/` | `articles/index.html` |
| `/articles/:category_id/` | `articles/<id>/index.html` |
| `/articles/:category_id/:article_id/` | `_posts/*.html` |
| `/about/` | `about.html` |
| `/gallery/` | `gallery/index.html` |
| `/gallery/13/` | `gallery/13/index.html` |
| — | `feed.xml`, `sitemap.xml`, `articles.json` (new) |

## How the PHP mapped over

| Zend Framework | Jekyll |
| --- | --- |
| `layouts/scripts/layout.phtml` | `_layouts/default.html` + `_includes/{head,topmenu,sidebar,footer,analytics}.html` |
| `views/scripts/articles/item.phtml` | `_layouts/article.html` |
| `views/scripts/articles/category.phtml` | `_layouts/category.html` |
| `views/scripts/index/about.phtml` | `_layouts/page.html` + `about.html` |
| `static/UPA-gallery.html` (snapshot) | `_layouts/album.html` + `_data/gallery.yml` |
| `Model_Breadcrumbs` | `_includes/breadcrumbs.html` |
| `Model_Menu::CategoryMenu` | `_includes/sidebar.html` (`sidebar: category`) |
| `DbTable_Menu::getGeneralMenuItems` | `_data/menu.yml` |
| `Model_Photos::FirstPageImageSlider` | `site.static_files` loop in `index.html` |
| `Model_ArticlesGeneral::getRandomArticle` | `articles.json` + `js/random-article.js` |
| `settings` table | `_config.yml` |
| `AdminController` / TinyMCE CMS | dropped — edit files and rebuild |

## Notes

- **The imported posts' dates are synthetic.** The `articles` table had no
  timestamps, so the import dated them backwards from 2015-08-25 (the day the
  dump was taken) in the order the PHP app displayed them. Listings sort on the
  `priority` front matter, never on the date, so this only affects `feed.xml`.
- **The random home-page teaser now runs client-side** (`ORDER BY RAND()` has no
  static equivalent), so it still changes between visits.
- Article #65 (`[заголовок1]`, `category_id` 999) was the CMS's "new article"
  placeholder and is not imported — the PHP app filtered it out of every query.
- Google Analytics only renders in `JEKYLL_ENV=production`.
