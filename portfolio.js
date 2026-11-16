// Short excerpts play while visible. Full trials remain user-controlled.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const initialized = new WeakSet();
  function attach(video) {
    if (initialized.has(video)) return;
    initialized.add(video);
    video.muted = true;
    // Retry one failed overview request without reusing a cached error response.
    if (video.closest('#projects')) {
      video.addEventListener('error', () => {
        const retryUrl = new URL(video.currentSrc || video.src, document.baseURI);
        retryUrl.searchParams.set('retry', String(Date.now()));
        video.src = retryUrl.href;
        video.load();
      }, {once: true});
      video.addEventListener('loadeddata', () => update());
    }

    let inView = false, userPaused = false, automaticPause = false;
    const pause = () => {
      if (!video.paused) { automaticPause = true; video.pause(); }
    };
    const update = () => {
      if (inView && !document.hidden && !reduceMotion.matches && !userPaused) video.play().catch(() => {});
      else pause();
    };
    video.addEventListener('pause', () => {
      if (!automaticPause && inView && !document.hidden) userPaused = true;
      automaticPause = false;
    });
    video.addEventListener('play', () => { userPaused = false; });
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      update();
    }, {threshold: 0.3}).observe(video);
    reduceMotion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
  }
  const scan = () => document.querySelectorAll('video[data-loop]').forEach(attach);
  scan();
  new MutationObserver(scan).observe(document.body, {childList: true, subtree: true});
})();

// Keep the current section when switching between the translated pages.
(() => {
  const links = document.querySelectorAll('[data-language-link]');
  function syncSection() {
    links.forEach(link => {
      const url = new URL(link.getAttribute('href'), document.baseURI);
      url.hash = location.hash;
      link.href = url.href;
    });
  }
  syncSection();
  window.addEventListener('hashchange', syncSection);
  links.forEach(link => link.addEventListener('click', () => {
    if (location.hash) return;
    const sections = [...document.querySelectorAll('main > section[id]')];
    const current = sections.filter(section => section.getBoundingClientRect().top <= 120).at(-1);
    if (current) {
      const url = new URL(link.href);
      url.hash = current.id;
      link.href = url.href;
    }
  }));
})();
