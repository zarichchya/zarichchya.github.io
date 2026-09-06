module Zarichchya
  # Categories are gone, but old posts still carry the `category_id` they were
  # imported with (see README), so their pre-refactor URLs
  # (`/articles/<category_id>/<article_id>/` and `/articles/<category_id>/`)
  # are rebuilt here as thin redirect pages instead of 404ing. New articles
  # don't set `category_id`, so they get no redirect page and live only at
  # their `/articles/<article_id>/` permalink.
  class RedirectPage < Jekyll::Page
    def initialize(site, dir, redirect_to)
      @site = site
      @base = site.source
      @dir = dir
      @name = "index.html"

      process(@name)

      @data = {
        "layout"      => "redirect",
        "redirect_to" => redirect_to,
        "sitemap"     => false,
      }
      @content = ""
    end
  end

  class LegacyCategoryRedirectGenerator < Jekyll::Generator
    priority :lowest

    def generate(site)
      category_ids = []

      site.posts.docs.each do |post|
        category_id = post.data["category_id"]
        next unless category_id

        category_ids << category_id
        site.pages << RedirectPage.new(site, "articles/#{category_id}/#{post.data['article_id']}", post.url)
      end

      category_ids.uniq.each do |category_id|
        site.pages << RedirectPage.new(site, "articles/#{category_id}", "/articles/")
      end
    end
  end
end
