module Zarichchya
  # The legacy `/articles/<article_id>/` route is fully determined by
  # `article_id`, so there's no need to hand-maintain a matching `permalink`
  # in every file's front matter. An explicit `permalink` in front matter
  # still wins, so a new article can opt out with a free-form slug.
  class LegacyPermalinkGenerator < Jekyll::Generator
    priority :highest

    def generate(site)
      (site.posts.docs + site.pages).each { |doc| set_permalink(doc) }
    end

    private

    def set_permalink(doc)
      return if doc.data["permalink"]

      article_id = doc.data["article_id"]
      return unless article_id

      doc.data["permalink"] = "/articles/#{article_id}/"
    end
  end
end
