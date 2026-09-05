(() => {
  const reader = document.querySelector('[data-article-reader]');
  const articleBody = document.querySelector('.article-body');
  const audioSrc = articleBody?.dataset.audioSrc;
  if (!reader || !audioSrc) return;

  const playButton = reader.querySelector('[data-reader-play]');
  const muteButton = reader.querySelector('[data-reader-mute]');
  const progressInput = reader.querySelector('[data-reader-progress]');
  const currentTime = reader.querySelector('[data-reader-current]');
  const elapsedTime = reader.querySelector('[data-reader-elapsed]');
  const durationTime = reader.querySelector('[data-reader-duration]');
  const remainingTime = reader.querySelector('[data-reader-remaining]');
  const remainingBottom = reader.querySelector('[data-reader-remaining-bottom]');
  const status = reader.querySelector('[data-reader-status]');
  const speedButtons = reader.querySelectorAll('[data-speed]');
  const waveBars = [...reader.querySelectorAll('[data-reader-wave] span')];
  if (!playButton) return;

  const audio = new Audio(audioSrc);
  audio.preload = 'metadata';
  let audioContext;
  let analyser;
  let frequencyData;
  let animationFrame;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '--:--';
    const value = Math.max(0, Math.round(seconds));
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = value % 60;
    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const setStatus = (value) => { if (status) status.textContent = value; };
  const renderIcon = (button, icon, label) => {
    if (!button) return;
    button.setAttribute('aria-label', label);
    button.innerHTML = `<i data-lucide="${icon}" aria-hidden="true"></i>`;
    window.lucide?.createIcons({ nodes: [button] });
  };

  const updateTimeline = () => {
    const { duration, currentTime: current } = audio;
    const rate = audio.playbackRate || 1;
    const validDuration = Number.isFinite(duration) && duration > 0;
    const remaining = validDuration ? Math.max(0, duration - current) : 0;
    if (progressInput) progressInput.value = String(validDuration ? (current / duration) * 100 : 0);
    if (currentTime) currentTime.textContent = formatTime(current / rate);
    if (elapsedTime) elapsedTime.textContent = formatTime(current / rate);
    if (durationTime) durationTime.textContent = formatTime(validDuration ? duration / rate : NaN);
    if (remainingTime) remainingTime.textContent = `-${formatTime(remaining / rate)}`;
    if (remainingBottom) remainingBottom.textContent = `-${formatTime(remaining / rate)}`;
  };

  const resetWave = () => {
    waveBars.forEach((bar, index) => {
      bar.style.transform = `scaleY(${0.16 + (index % 4) * 0.035})`;
      bar.style.opacity = '0.38';
    });
  };

  const animateWave = () => {
    if (!analyser || audio.paused) return;
    analyser.getByteFrequencyData(frequencyData);
    waveBars.forEach((bar, index) => {
      const start = Math.floor((index / waveBars.length) * frequencyData.length * 0.72);
      const end = Math.max(start + 1, Math.floor(((index + 1) / waveBars.length) * frequencyData.length * 0.72));
      let sum = 0;
      for (let cursor = start; cursor < end; cursor += 1) sum += frequencyData[cursor];
      const level = sum / ((end - start) * 255);
      const scale = 0.18 + level * 1.35;
      bar.style.transform = `scaleY(${scale})`;
      bar.style.opacity = String(0.38 + Math.min(level * 1.15, 0.62));
    });
    animationFrame = requestAnimationFrame(animateWave);
  };

  const startWave = () => {
    if (!waveBars.length || animationFrame) return;
    animationFrame = requestAnimationFrame(animateWave);
  };
  const stopWave = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    resetWave();
  };
  const connectAnalyser = () => {
    if (analyser || !waveBars.length) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext = new AudioContextClass();
    const source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  };

  audio.addEventListener('loadedmetadata', updateTimeline);
  audio.addEventListener('durationchange', updateTimeline);
  audio.addEventListener('timeupdate', updateTimeline);
  audio.addEventListener('play', () => {
    reader.classList.add('is-playing');
    setStatus(audio.muted ? 'Playing · muted' : 'Playing recorded narration');
    renderIcon(playButton, 'pause', 'Pause article audio');
    startWave();
  });
  audio.addEventListener('pause', () => {
    reader.classList.remove('is-playing');
    if (!audio.ended) setStatus('Paused');
    renderIcon(playButton, 'play', 'Play article audio');
    stopWave();
  });
  audio.addEventListener('ended', () => {
    reader.classList.remove('is-playing');
    setStatus('Finished');
    renderIcon(playButton, 'play', 'Play article audio');
    stopWave();
    updateTimeline();
  });
  audio.addEventListener('volumechange', () => {
    renderIcon(muteButton, audio.muted ? 'volume-x' : 'volume-2', audio.muted ? 'Unmute audio' : 'Mute audio');
    if (!audio.paused) setStatus(audio.muted ? 'Playing · muted' : 'Playing recorded narration');
  });
  audio.addEventListener('error', () => { setStatus('Audio unavailable'); stopWave(); });

  playButton.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        connectAnalyser();
        if (audioContext?.state === 'suspended') await audioContext.resume();
        await audio.play();
      } catch { setStatus('Playback was blocked'); }
    } else { audio.pause(); }
  });
  muteButton?.addEventListener('click', () => { audio.muted = !audio.muted; });
  progressInput?.addEventListener('input', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = (Number(progressInput.value) / 100) * audio.duration;
      updateTimeline();
    }
  });
  speedButtons.forEach((button) => button.addEventListener('click', () => {
    audio.playbackRate = Number(button.dataset.speed) || 1;
    speedButtons.forEach((item) => item.classList.toggle('active', item === button));
    updateTimeline();
  }));

  resetWave();
  renderIcon(playButton, 'play', 'Play article audio');
  renderIcon(muteButton, 'volume-2', 'Mute audio');
  updateTimeline();
  window.addEventListener('beforeunload', () => audio.pause());
})();
