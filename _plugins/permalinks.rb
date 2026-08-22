module Zarichchya
  # The legacy `/articles/<category_id>/` and `/articles/<category_id>/<article_id>/`
  # routes are fully determined by `category_id` (and `article_id`, for posts),
  # so there's no need to hand-maintain a matching `permalink` in every file's
  # front matter. An explicit `permalink` in front matter still wins, so a new
  # article can opt out with a free-form slug.
  class LegacyPermalinkGenerator < Jekyll::Generator
    priority :highest

    def generate(site)
      (site.posts.docs + site.pages).each { |doc| set_permalink(doc) }
    end

    private

    def set_permalink(doc)
      return if doc.data["permalink"]

      category_id = doc.data["category_id"]
      return unless category_id

      article_id = doc.data["article_id"]
      doc.data["permalink"] =
        if article_id
          "/articles/#{category_id}/#{article_id}/"
        else
          "/articles/#{category_id}/"
        end
    end
  end
end
