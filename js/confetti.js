'use strict';
window.NQ = window.NQ || {};

NQ.fireConfetti = function(primaryColor) {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;

  const W = canvas.width  = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  const c = canvas.getContext('2d');

  const COLORS = primaryColor
    ? [primaryColor, '#ffffff', '#e8b923', '#f2efe4']
    : ['#e8b923', '#7fb069', '#3a6ea5', '#8e6bae', '#c0392b', '#f2efe4'];

  
  const sources = [W * 0.35, W * 0.65];
  const particles = [];

  sources.forEach(sx => {
    for (let i = 0; i < 55; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI;     
      const speed = Math.random() * 7 + 2;
      particles.push({
        x:        sx,
        y:        H * 0.25,
        vx:       Math.cos(angle) * speed,
        vy:       Math.sin(angle) * speed - 3,
        color:    COLORS[Math.floor(Math.random() * COLORS.length)],
        w:        Math.random() * 9 + 4,
        h:        Math.random() * 5 + 3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        alpha:    1,
        shape:    Math.random() < 0.55 ? 'rect' : 'circle'
      });
    }
  });

  let rafId;
  function draw() {
    c.clearRect(0, 0, W, H);
    let alive = false;

    particles.forEach(p => {
      p.x        += p.vx;
      p.y        += p.vy;
      p.vy       += 0.2;    
      p.vx       *= 0.985;  
      p.rotation += p.rotSpeed;
      p.alpha    -= 0.013;
      if (p.alpha > 0) alive = true;

      c.save();
      c.globalAlpha = Math.max(0, p.alpha);
      c.translate(p.x, p.y);
      c.rotate(p.rotation);
      c.fillStyle = p.color;

      if (p.shape === 'circle') {
        c.beginPath();
        c.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        c.fill();
      } else {
        c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      c.restore();
    });

    if (alive) {
      rafId = requestAnimationFrame(draw);
    } else {
      c.clearRect(0, 0, W, H);
    }
  }

  if (rafId) cancelAnimationFrame(rafId);
  draw();
};
