/**
 * Site search over /search.json (every post's text, built by search.json).
 *
 * Always case-insensitive. By default a word matches anywhere, even inside a
 * longer one ("прут" finds "Прутом"); with "whole words only" checked
 * (?exact=1) it must stand alone ("прут" finds "Прут" but not "Прутом").
 * With several words, an article must contain every one of them. Articles
 * where the words appear whole rank above ones with only partial matches.
 *
 * Matches are highlighted in the results, and each result links to its
 * article with the same ?q=...&exact=... so the words are highlighted there
 * too -- this same file runs on article pages for that.
 */
(function () {
	/* Letters, digits, combining marks and the apostrophe (as in Клим'юк) all
	 * count as part of a word, so a match can't start or end inside one. */
	var WORD_CHAR = "[\\p{L}\\p{N}\\p{M}']";

	var SNIPPET_BEFORE = 90;
	var SNIPPET_AFTER = 210;

	/* Pause after the last keystroke before searching. The whole index is a
	 * few hundred KB held in memory, so a search takes a few milliseconds and
	 * this only needs to skip the in-between states of fast typing. */
	var TYPING_DELAY = 80;

	/* Typographic apostrophes are folded to ASCII ' so either spelling matches
	 * the other. Each is a single UTF-16 unit, so indices into the folded
	 * string still line up with the original text. */
	function fold(text) {
		return text.replace(/[’ʼ‘`]/g, "'");
	}

	function parseQuery(query) {
		return fold(query).split(/\s+/).map(function (word) {
			return word.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');
		}).filter(Boolean);
	}

	function escapeRegExp(text) {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	/* Matches any of `words`, case-insensitively. `exact` additionally requires
	 * each match to be a whole word, not part of a longer one. */
	function wordRegex(words, exact) {
		var alternatives = '(?:' + words.map(escapeRegExp).join('|') + ')';
		if (exact) alternatives = '(?<!' + WORD_CHAR + ')' + alternatives + '(?!' + WORD_CHAR + ')';
		return new RegExp(alternatives, 'giu');
	}

	function readParams() {
		var params = new URLSearchParams(location.search);
		return { query: params.get('q') || '', exact: params.get('exact') === '1' };
	}

	function paramString(query, exact) {
		return '?q=' + encodeURIComponent(query) + (exact ? '&exact=1' : '');
	}

	/* Ukrainian plural form for n: 1 стаття, 2 статті, 5 статей. */
	function plural(n, one, few, many) {
		var n10 = n % 10, n100 = n % 100;
		if (n10 === 1 && n100 !== 11) return one;
		if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
		return many;
	}

	/* Appends `text` to `parent`, wrapping every match of `re` in <mark>.
	 * Built from text nodes, never innerHTML, so article text can't inject
	 * markup. Returns the number of matches. */
	function appendMarked(parent, text, re) {
		var folded = fold(text);
		var last = 0, count = 0, match;
		re.lastIndex = 0;
		while ((match = re.exec(folded))) {
			if (match.index > last) parent.appendChild(document.createTextNode(text.slice(last, match.index)));
			var mark = document.createElement('mark');
			mark.textContent = text.slice(match.index, match.index + match[0].length);
			parent.appendChild(mark);
			last = match.index + match[0].length;
			count++;
		}
		if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
		return count;
	}

	/* ---- Search page ------------------------------------------------------ */

	var indexPromise = null;

	function loadIndex(source) {
		if (!indexPromise) {
			indexPromise = fetch(source)
				.then(function (response) {
					if (!response.ok) throw new Error('HTTP ' + response.status);
					return response.json();
				})
				.then(function (articles) {
					articles.forEach(function (article) {
						/* strip_html leaves entities like &nbsp; behind; decode them. */
						article.text = new DOMParser()
							.parseFromString(article.text || '', 'text/html')
							.documentElement.textContent;
						article.folded = fold([article.title, article.descr || '', article.text].join('\n'));
					});
					return articles;
				});
			indexPromise.catch(function () { indexPromise = null; });
		}
		return indexPromise;
	}

	function countMatches(text, re) {
		return (text.match(re) || []).length;
	}

	function search(articles, words, exact) {
		var perWord = words.map(function (word) { return wordRegex([word], exact); });
		var wholeWord = words.map(function (word) { return wordRegex([word], true); });
		var results = [];
		articles.forEach(function (article) {
			var hits = 0;
			for (var i = 0; i < perWord.length; i++) {
				var found = countMatches(article.folded, perWord[i]);
				if (!found) return;
				hits += found;
			}
			var wholeHits = exact ? hits : wholeWord.reduce(function (sum, re) {
				return sum + countMatches(article.folded, re);
			}, 0);
			results.push({ article: article, hits: hits, wholeHits: wholeHits });
		});
		/* Whole-word matches first, then most matches overall; the sort is
		 * stable, so ties keep the index's newest-first order. */
		results.sort(function (a, b) { return (b.wholeHits - a.wholeHits) || (b.hits - a.hits); });
		return results;
	}

	/* A window of text around the first match, trimmed to whole words. */
	function snippet(text, re) {
		re.lastIndex = 0;
		var match = re.exec(fold(text));
		var at = match ? match.index : 0;
		var length = match ? match[0].length : 0;
		var start = Math.max(0, at - SNIPPET_BEFORE);
		var end = Math.min(text.length, at + SNIPPET_AFTER);
		if (start > 0) {
			var space = text.indexOf(' ', start);
			if (space !== -1 && space < at) start = space + 1;
		}
		if (end < text.length) {
			var lastSpace = text.lastIndexOf(' ', end);
			if (lastSpace > at + length) end = lastSpace;
		}
		return (start > 0 ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : '');
	}

	function element(tag, className) {
		var node = document.createElement(tag);
		if (className) node.className = className;
		return node;
	}

	function render(container, status, results, words, exact) {
		container.textContent = '';
		if (!words.length) {
			status.textContent = '';
			return;
		}
		if (!results.length) {
			status.textContent = 'Нічого не знайдено.';
			return;
		}
		status.textContent = 'Знайдено ' + results.length + ' ' + plural(results.length, 'статтю', 'статті', 'статей') + '.';

		var re = wordRegex(words, exact);
		var params = paramString(words.join(' '), exact);
		results.forEach(function (result) {
			var article = result.article;
			var item = element('article', 'item');

			var heading = element('h3');
			var link = element('a');
			link.href = article.url + params;
			appendMarked(link, article.title, re);
			heading.appendChild(link);
			item.appendChild(heading);

			var meta = element('p', 'where');
			meta.textContent = article.date + ' · ' + result.hits + ' ' + plural(result.hits, 'збіг', 'збіги', 'збігів');
			item.appendChild(meta);

			var summary = element('p', 'sum');
			appendMarked(summary, snippet(article.text, re), re);
			item.appendChild(summary);

			container.appendChild(item);
		});
	}

	function initSearchPage(form) {
		var input = document.getElementById('search-input');
		var exactBox = document.getElementById('search-exact');
		var status = document.getElementById('search-status');
		var container = document.getElementById('search-results');
		var source = container.getAttribute('data-index') || '/search.json';
		var timer;

		function run() {
			var query = input.value.trim();
			var exact = exactBox.checked;
			/* Keep the URL in step so a search can be bookmarked or shared. */
			history.replaceState(null, '', query ? paramString(query, exact) : location.pathname);

			var words = parseQuery(query);
			if (!words.length) {
				render(container, status, [], words, exact);
				return;
			}
			status.textContent = 'Шукаю…';
			loadIndex(source)
				.then(function (articles) {
					/* The query or mode changed while the index loaded. */
					if (input.value.trim() !== query || exactBox.checked !== exact) return;
					render(container, status, search(articles, words, exact), words, exact);
				})
				.catch(function () {
					status.textContent = 'Не вдалося завантажити пошук. Спробуйте оновити сторінку.';
				});
		}

		form.addEventListener('submit', function (event) {
			event.preventDefault();
			clearTimeout(timer);
			run();
		});
		input.addEventListener('input', function () {
			clearTimeout(timer);
			timer = setTimeout(run, TYPING_DELAY);
		});
		exactBox.addEventListener('change', function () {
			clearTimeout(timer);
			run();
		});

		var initial = readParams();
		exactBox.checked = initial.exact;
		if (initial.query) {
			input.value = initial.query;
			run();
		}
	}

	/* ---- Article page: highlight the words that led here ------------------ */

	function highlightArticle(article) {
		var params = readParams();
		var words = parseQuery(params.query);
		if (!words.length) return;
		var re = wordRegex(words, params.exact);

		/* Collect first, then replace -- editing while walking would skip nodes. */
		var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
		var nodes = [];
		while (walker.nextNode()) nodes.push(walker.currentNode);

		nodes.forEach(function (node) {
			re.lastIndex = 0;
			if (!re.test(fold(node.nodeValue))) return;
			var fragment = document.createDocumentFragment();
			appendMarked(fragment, node.nodeValue, re);
			node.parentNode.replaceChild(fragment, node);
		});

		var first = article.querySelector('mark');
		if (first) first.scrollIntoView({ block: 'center' });
	}

	function init() {
		var form = document.getElementById('search-form');
		if (form) initSearchPage(form);

		var article = document.querySelector('article[data-highlight]');
		if (article) highlightArticle(article);
	}

	/* On the search page head.html loads this inside <head>, before the form
	 * exists. Wait for the parser before looking for it. */
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
