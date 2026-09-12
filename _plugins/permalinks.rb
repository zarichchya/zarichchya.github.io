module Zarichchya
  # The legacy `/articles/<article_id>/` route is fully determined by
  # `article_id`, so there's no need to hand-maintain a matching `permalink`
  # in every file's front matter. An explicit `permalink` in front matter
  # still wins, so a new article can opt out with a free-form slug.
  class LegacyPermalinkGenerator < Jekyll::Generator
    priority :highest

    def generate(site)
      check_unique_article_ids(site.posts.docs)
      (site.posts.docs + site.pages).each { |doc| set_permalink(doc) }
    end

    private

    # Two posts sharing an article_id would get the same URL, and one would
    # silently overwrite the other in _site. The CMS assigns IDs from the
    # last published /articles.json, so this can happen if two articles are
    # created before a rebuild -- fail the build instead.
    def check_unique_article_ids(posts)
      posts.group_by { |post| post.data["article_id"] }.each do |article_id, docs|
        next if article_id.nil? || docs.size < 2

        raise Jekyll::Errors::FatalException,
              "article_id #{article_id} is used by more than one post: " \
              "#{docs.map(&:relative_path).join(', ')}"
      end
    end

    def set_permalink(doc)
      return if doc.data["permalink"]

      article_id = doc.data["article_id"]
      return unless article_id

      doc.data["permalink"] = "/articles/#{article_id}/"
    end
  end
end
