let ctx;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, vol, type) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type || 'triangle';
  o.frequency.value = freq;
  const t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  click: () => blip(880, 0.045, 0.035, 'triangle'),
  tick: () => blip(1300, 0.028, 0.022, 'sine'),
  select: () => blip(620, 0.06, 0.045, 'sine'),
  success: () => {
    blip(660, 0.08, 0.045, 'sine');
    setTimeout(() => blip(990, 0.12, 0.045, 'sine'), 55);
  },
};
