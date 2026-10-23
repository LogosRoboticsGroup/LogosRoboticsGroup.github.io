'use strict';

// Original paper frames are readable as a contact sheet without JavaScript.
document.querySelectorAll('[data-sequence]').forEach(sequence => {
  const frames = [...sequence.querySelectorAll('.sequence-stage figure')];
  const play = sequence.querySelector('.sequence-play');
  const thumbnails = sequence.querySelector('.sequence-thumbnails');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer;
  let wantsPlayback = !motionPreference.matches;
  let inView = false;

  function syncPlayback() {
    clearTimeout(timer);
    const playing = wantsPlayback && inView && !document.hidden;
    play.textContent = playing ? 'Pause frames' : 'Play frames';
    play.setAttribute('aria-pressed', String(playing));
    if (playing) advance();
  }

  function show(next) {
    index = next;
    frames.forEach((frame, i) => frame.toggleAttribute('data-active', i === index));
    [...thumbnails.children].forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }

  function advance() {
    timer = setTimeout(() => {
      show((index + 1) % frames.length);
      advance();
    }, 1600);
  }

  frames.forEach((frame, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show frame ${i + 1} of ${frames.length}`);
    const image = frame.querySelector('img').cloneNode();
    image.alt = '';
    button.append(image);
    button.addEventListener('click', () => {
      wantsPlayback = false;
      show(i);
      syncPlayback();
    });
    thumbnails.append(button);
  });
  play.addEventListener('click', () => {
    wantsPlayback = !wantsPlayback;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    syncPlayback();
  }).observe(sequence);
  motionPreference.addEventListener('change', () => {
    wantsPlayback = !motionPreference.matches;
    syncPlayback();
  });
  show(0);
  sequence.classList.add('sequence-ready');
  sequence.querySelector('.sequence-toolbar').hidden = false;
  thumbnails.hidden = false;
  syncPlayback();
});

// Link task descriptions to the existing four-policy comparison without starting playback.
document.querySelectorAll('[data-compare-task]').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector(`[data-task="${link.dataset.compareTask}"]`).click();
  });
});

document.querySelectorAll('[data-result-view-target]').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector(`[data-results-view="${link.dataset.resultViewTarget}"]`).click();
  });
});
