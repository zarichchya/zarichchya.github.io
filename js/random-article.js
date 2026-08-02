/**
 * Replaces the old `SELECT ... ORDER BY RAND() LIMIT 1` teaser on the home page
 * (Application_Model_ArticlesGeneral::getRandomArticle). Same markup, picked in
 * the browser so it still differs between visits on a static site.
 */
(function () {
	function render(container, article) {
		var category = document.createElement('div');
		category.id = 'category';
		category.textContent = article.category;

		var teaser = document.createElement('div');
		teaser.id = 'text2';

		var title = document.createElement('i');
		title.textContent = article.title;
		teaser.appendChild(title);
		teaser.appendChild(document.createTextNode(' // ' + article.descr));

		var more = document.createElement('a');
		more.href = article.url;
		more.textContent = '... далі';
		teaser.appendChild(more);

		container.appendChild(category);
		container.appendChild(teaser);
	}

	function init() {
		var container = document.getElementById('randomArticle');
		if (!container) return;

		var source = container.getAttribute('data-articles') || '/articles.json';

		fetch(source)
			.then(function (response) {
				if (!response.ok) throw new Error('HTTP ' + response.status);
				return response.json();
			})
			.then(function (articles) {
				if (articles.length) render(container, articles[Math.floor(Math.random() * articles.length)]);
			})
			.catch(function () {
				/* The teaser is decorative — leave the block empty if it can't load. */
			});
	}

	/* head.html renders page scripts inside <head>, so #randomArticle does not
	 * exist yet when this runs. Wait for the parser before looking for it. */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
