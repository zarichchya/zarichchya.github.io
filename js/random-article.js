/**
 * Replaces the old `SELECT ... ORDER BY RAND() LIMIT 1` teaser on the home page
 * (Application_Model_ArticlesGeneral::getRandomArticle), picked in the browser
 * so it still differs between visits on a static site. Renders the same
 * title + summary markup as an entry in the /articles/ list.
 */
(function () {
	function render(container, article) {
		var heading = document.createElement('h3');
		var link = document.createElement('a');
		link.href = article.url;
		link.textContent = article.title;
		heading.appendChild(link);
		container.appendChild(heading);

		if (article.descr) {
			var summary = document.createElement('p');
			summary.className = 'sum';
			summary.textContent = article.descr;
			container.appendChild(summary);
		}
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
