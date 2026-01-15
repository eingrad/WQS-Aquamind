export function makeSeries(seed = 1) {
  const now = Date.now();
  const pts = [];
  let a = 50 + seed * 7;
  for (let i = 20; i >= 0; i--) {
    a += Math.sin((i + seed) / 2) * 80 + (Math.random() - 0.5) * 60;
    pts.push({
      t: new Date(now - i * 15 * 60 * 1000).toISOString(),
      so2: Math.max(0, 120 + a / 5),
      h2s: Math.max(0, 2 + a / 50),
      no2: Math.max(0, 1 + a / 60),
      btx: Math.max(0, 0.5 + a / 80),
      solar: Math.random() * 1000,
      temp: 20 + Math.random() * 15,
      humidity: 50 + Math.random() * 40,
      windSpeed: Math.random() * 10,
      windDir: Math.floor(Math.random() * 360),
    });
  }
  return pts;
}
