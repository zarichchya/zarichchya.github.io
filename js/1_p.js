/**
 * Homepage banner: crossfades between the photos in #slideshow every 5
 * seconds. The fade itself is a CSS transition (see #slideshow img in
 * template.css) -- this just toggles which image is .active and drives its
 * opacity to trigger that transition.
 */
(function () {
	function slideSwitch() {
		var images = document.querySelectorAll('#slideshow img');
		if (images.length < 2) return;

		var activeIndex = -1;
		for (var i = 0; i < images.length; i++) {
			if (images[i].classList.contains('active')) {
				activeIndex = i;
				break;
			}
		}

		var active = activeIndex === -1 ? images[images.length - 1] : images[activeIndex];
		var next = images[(activeIndex + 1) % images.length];

		active.classList.add('last-active');
		next.style.opacity = 0;
		next.classList.add('active');

		// Force a style flush between the two writes to next.style.opacity,
		// so the browser treats 0 as a real starting point for the CSS
		// transition to 1, instead of coalescing both into one frame.
		requestAnimationFrame(function () {
			requestAnimationFrame(function () {
				next.style.opacity = 1;
			});
		});

		setTimeout(function () {
			active.classList.remove('active', 'last-active');
		}, 1000);
	}

	document.addEventListener('DOMContentLoaded', function () {
		setInterval(slideSwitch, 5000);
	});
})();
