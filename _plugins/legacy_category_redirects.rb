module Zarichchya
  # Categories are gone, including the category_id each post used to carry.
  # Old inbound links still point at pre-refactor URLs
  # (`/articles/<category_id>/<article_id>/` and `/articles/<category_id>/`),
  # so every legacy category id is redirected here regardless of which
  # article it's paired with -- article_id alone is globally unique and picks
  # the right target, so there's no need to track which category each old
  # article actually belonged to.
  LEGACY_CATEGORY_IDS = [7, 8, 9, 10, 11, 12].freeze

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
      LEGACY_CATEGORY_IDS.each do |category_id|
        site.pages << RedirectPage.new(site, "articles/#{category_id}", "/articles/")

        site.posts.docs.each do |post|
          site.pages << RedirectPage.new(site, "articles/#{category_id}/#{post.data['article_id']}", post.url)
        end
      end
    end
  end
end
