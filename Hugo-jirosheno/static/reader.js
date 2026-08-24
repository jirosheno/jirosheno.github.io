(() => {
  const reader = document.querySelector('[data-article-reader]');
  const articleBody = document.querySelector('.article-body');
  const audioSrc = articleBody?.dataset.audioSrc;

  if (!reader || !audioSrc) return;

  const playButton = reader.querySelector('[data-reader-play]');
  const progressInput = reader.querySelector('[data-reader-progress]');
  const currentTime = reader.querySelector('[data-reader-current]');
  const durationTime = reader.querySelector('[data-reader-duration]');
  const status = reader.querySelector('[data-reader-status]');
  const speedButtons = reader.querySelectorAll('[data-speed]');

  if (!playButton) return;

  const audio = new Audio(audioSrc);
  audio.preload = 'metadata';

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '--:--';
    const value = Math.max(0, Math.round(seconds));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  };

  const setStatus = (value) => {
    if (status) status.textContent = value;
  };

  const setButtonState = (playing) => {
    playButton.setAttribute('aria-label', playing ? 'Pause article audio' : 'Play article audio');
    playButton.innerHTML = `<i data-lucide="${playing ? 'pause' : 'play'}" aria-hidden="true"></i>`;
    window.lucide?.createIcons({ nodes: [playButton] });
  };

  const updateTimeline = () => {
    const duration = audio.duration;
    const rate = audio.playbackRate || 1;
    const progress = Number.isFinite(duration) && duration > 0
      ? (audio.currentTime / duration) * 100
      : 0;

    if (progressInput) progressInput.value = String(progress);
    if (currentTime) currentTime.textContent = formatTime(audio.currentTime / rate);
    if (durationTime) durationTime.textContent = formatTime(duration / rate);
  };

  audio.addEventListener('loadedmetadata', updateTimeline);
  audio.addEventListener('durationchange', updateTimeline);
  audio.addEventListener('timeupdate', updateTimeline);

  audio.addEventListener('play', () => {
    setStatus('Playing recorded narration');
    setButtonState(true);
  });

  audio.addEventListener('pause', () => {
    if (!audio.ended) setStatus('Paused');
    setButtonState(false);
  });

  audio.addEventListener('ended', () => {
    if (progressInput) progressInput.value = '100';
    updateTimeline();
    setStatus('Finished');
    setButtonState(false);
  });

  audio.addEventListener('error', () => {
    setStatus('Audio unavailable');
    setButtonState(false);
  });

  playButton.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => setStatus('Playback was blocked'));
    } else {
      audio.pause();
    }
  });

  progressInput?.addEventListener('input', () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = (Number(progressInput.value) / 100) * audio.duration;
    updateTimeline();
  });

  speedButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const rate = Number(button.dataset.speed) || 1;
      audio.playbackRate = rate;
      speedButtons.forEach((item) => item.classList.toggle('active', item === button));
      updateTimeline();
    });
  });

  setButtonState(false);
  updateTimeline();
  window.addEventListener('beforeunload', () => audio.pause());
})();
