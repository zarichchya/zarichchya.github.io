module Zarichchya
  # `_layouts/category.html` renders a category listing entirely from
  # `category_id`, so a hand-maintained `articles/<id>/index.html` per row in
  # `_data/categories.yml` is just that row's id/name/url copied into a file.
  # Generate the pages instead: add a category to `_data/categories.yml` and
  # its listing page exists, no second file to create or keep in sync.
  class CategoryPage < Jekyll::Page
    def initialize(site, category)
      @site = site
      @base = site.source
      @dir = "articles/#{category["id"]}"
      @name = "index.html"

      process(@name)

      @data = {
        "layout"      => "category",
        "title"       => category["name"],
        "permalink"   => category["url"],
        "category_id" => category["id"],
        "sidebar"     => "category",
      }
      @content = ""
    end
  end

  class CategoryPagesGenerator < Jekyll::Generator
    priority :highest

    def generate(site)
      site.data["categories"].each do |category|
        site.pages << CategoryPage.new(site, category)
      end
    end
  end
end
