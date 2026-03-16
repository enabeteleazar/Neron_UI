/**
 * NEXUS — Avatar + LLM Chat
 * Avatar dessiné en Canvas 2D avec animations naturelles
 * Chat connecté au serveur LLM local
 */

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────
const LLM_URL = 'http://192.168.1.130:8010/';
const LLM_MODEL = 'local-model'; // adapte selon ton serveur (ex: "mistral", "llama3", etc.)

// ─────────────────────────────────────────
// CANVAS SETUP
// ─────────────────────────────────────────
const canvas = document.getElementById('avatarCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ─────────────────────────────────────────
// AVATAR STATE
// ─────────────────────────────────────────
const avatar = {
  // Position cible (centre pied)
  x: 0, y: 0,
  // Position actuelle (interpolée)
  cx: 0, cy: 0,
  // Dimensions de base
  scale: 1,

  // Animation state
  time: 0,
  breathPhase: 0,
  blinkTimer: 0,
  blinkDuration: 0,
  blinkInterval: 0,
  nextBlink: 3.5,
  eyeOpenness: 1,

  // Head sway
  headSway: 0,
  headNod: 0,

  // Arm swing
  armSwing: 0,
  armSwingTarget: 0,

  // Body bob
  bodyBob: 0,

  // Walk animation
  walking: false,
  walkPhase: 0,
  walkSpeed: 0,
  legAngleL: 0,
  legAngleR: 0,

  // Mood / expression
  mouthOpen: 0,     // 0=closed, 1=talking
  mouthPhase: 0,
  isTalking: false,
  talkTimer: 0,

  // Colors
  skin: '#FDBCB4',
  skinDark: '#F0A090',
  skinLight: '#FECEC6',
  hair: '#3B2314',
  shirt: '#3B6EAA',
  shirtDark: '#2B5080',
  pants: '#2C3E50',
  shoe: '#1a1a1a',
  eye: '#2C3E50',

  // Float movement path
  floatAngle: 0,
  floatRadius: 0,
  targetX: 0,
  targetY: 0,
  idleTimer: 0,
  idleInterval: 4,
};

// ─────────────────────────────────────────
// INIT POSITION
// ─────────────────────────────────────────
function initAvatar() {
  avatar.x  = canvas.width  * 0.42;
  avatar.y  = canvas.height * 0.88;
  avatar.cx = avatar.x;
  avatar.cy = avatar.y;
  avatar.targetX = avatar.x;
  avatar.targetY = avatar.y;
  avatar.scale   = Math.min(canvas.height / 800, 1.3);
  avatar.blinkInterval = 3.5 + Math.random() * 2;
  avatar.nextBlink     = avatar.blinkInterval;
}

// ─────────────────────────────────────────
// RANDOM IDLE MOVEMENT
// ─────────────────────────────────────────
function updateIdleMovement(dt) {
  avatar.idleTimer += dt;
  if (avatar.idleTimer >= avatar.idleInterval) {
    avatar.idleTimer = 0;
    avatar.idleInterval = 3 + Math.random() * 5;

    const margin = 120;
    const chatW   = window.innerWidth <= 480 ? 0 : 400;
    avatar.targetX = margin + Math.random() * (canvas.width - margin * 2 - chatW);
    avatar.targetY = canvas.height * 0.72 + Math.random() * canvas.height * 0.18;
  }

  const dx = avatar.targetX - avatar.cx;
  const dy = avatar.targetY - avatar.cy;
  const dist = Math.sqrt(dx*dx + dy*dy);

  if (dist > 4) {
    avatar.walking = true;
    const speed = Math.min(dist * 2.5, 200);
    avatar.cx += (dx / dist) * speed * dt;
    avatar.cy += (dy / dist) * speed * dt;
    avatar.walkSpeed = speed;
  } else {
    avatar.walking = false;
    avatar.walkSpeed = 0;
    avatar.cx = avatar.targetX;
    avatar.cy = avatar.targetY;
  }
}

// ─────────────────────────────────────────
// UPDATE ANIMATION STATE
// ─────────────────────────────────────────
let lastTime = 0;
function updateAvatar(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  avatar.time += dt;

  // Breathing (chest rise ~0.3Hz)
  avatar.breathPhase = Math.sin(avatar.time * 1.9) * 0.5 + Math.sin(avatar.time * 0.7) * 0.3;

  // Head sway (very subtle)
  avatar.headSway = Math.sin(avatar.time * 0.6 + 0.3) * 2.5
                  + Math.sin(avatar.time * 0.23)       * 1.2;
  avatar.headNod  = Math.sin(avatar.time * 0.44)       * 1.8;

  // Arm gentle swing
  avatar.armSwingTarget = Math.sin(avatar.time * 0.8) * 5;
  avatar.armSwing += (avatar.armSwingTarget - avatar.armSwing) * dt * 3;

  // Blink
  avatar.blinkTimer += dt;
  if (avatar.blinkTimer >= avatar.nextBlink) {
    avatar.blinkDuration = 0.12 + Math.random() * 0.06;
    avatar.blinkTimer = 0;
    avatar.nextBlink  = 2.5 + Math.random() * 3.5;
  }
  const blinkProgress = avatar.blinkTimer / avatar.blinkDuration;
  if (blinkProgress < 1) {
    avatar.eyeOpenness = blinkProgress < 0.5
      ? 1 - blinkProgress * 2
      : (blinkProgress - 0.5) * 2;
    avatar.eyeOpenness = Math.max(0, avatar.eyeOpenness);
  } else {
    avatar.eyeOpenness = 1;
  }

  // Walk / legs
  if (avatar.walking) {
    avatar.walkPhase += dt * (avatar.walkSpeed / 60);
    avatar.legAngleL  = Math.sin(avatar.walkPhase * Math.PI * 2) * 25;
    avatar.legAngleR  = -avatar.legAngleL;
    avatar.bodyBob    = Math.abs(Math.sin(avatar.walkPhase * Math.PI * 2)) * 3;
    avatar.armSwing   = Math.sin(avatar.walkPhase * Math.PI * 2 + Math.PI) * 18;
  } else {
    avatar.legAngleL += (-avatar.legAngleL) * dt * 6;
    avatar.legAngleR += (-avatar.legAngleR) * dt * 6;
    avatar.bodyBob   += (-avatar.bodyBob)   * dt * 5;
  }

  // Talking mouth
  if (avatar.isTalking) {
    avatar.talkTimer += dt;
    avatar.mouthOpen = 0.3 + Math.abs(Math.sin(avatar.talkTimer * 8)) * 0.7;
    avatar.mouthPhase = Math.sin(avatar.talkTimer * 12) * 0.3;
  } else {
    avatar.mouthOpen += (-avatar.mouthOpen) * dt * 10;
  }

  // Idle position wandering
  updateIdleMovement(dt);

  // Scale responsive
  avatar.scale = Math.min(canvas.height / 900, 1.3) * 0.9;

  // Update room shadow position
  const shadow = document.querySelector('.room-shadow');
  if (shadow) {
    shadow.style.left = avatar.cx + 'px';
    shadow.style.bottom = (canvas.height - avatar.cy + 10) + 'px';
    shadow.style.transform = 'translateX(-50%)';
    const sc = avatar.scale;
    shadow.style.width  = (180 * sc) + 'px';
    shadow.style.opacity = 0.7 + avatar.breathPhase * 0.05;
  }
}

// ─────────────────────────────────────────
// DRAW HELPERS
// ─────────────────────────────────────────
function deg2rad(d) { return d * Math.PI / 180; }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─────────────────────────────────────────
// DRAW AVATAR (origin = feet centre)
// ─────────────────────────────────────────
function drawAvatar() {
  const sc  = avatar.scale;
  const bx  = avatar.cx;
  const by  = avatar.cy - avatar.bodyBob * sc;

  // --- Total height guide (used for proportions):
  // feet  = 0
  // knee  ~ -100
  // waist ~ -200
  // chest ~ -280
  // neck  ~ -330
  // head top ~ -390

  ctx.save();
  ctx.translate(bx, by);

  // ── SHADOW UNDER FEET ──
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, -2, 55 * sc, 10 * sc, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── SHOES ──
  drawShoe(ctx, sc, -30, 0, avatar.legAngleL, false);
  drawShoe(ctx, sc,  30, 0, avatar.legAngleR, true);

  // ── LEGS ──
  drawLeg(ctx, sc, -28, -20, avatar.legAngleL);
  drawLeg(ctx, sc,  28, -20, avatar.legAngleR);

  // ── BODY (shirt) ──
  const breathY = avatar.breathPhase * 1.5 * sc;
  ctx.save();
  ctx.translate(0, breathY);

  // Torso
  ctx.fillStyle = avatar.shirt;
  roundRect(ctx, -34 * sc, -290 * sc, 68 * sc, 100 * sc, 10 * sc);
  ctx.fill();

  // Shirt gradient overlay
  const tg = ctx.createLinearGradient(-34 * sc, -290 * sc, 34 * sc, -290 * sc);
  tg.addColorStop(0, 'rgba(255,255,255,0.12)');
  tg.addColorStop(0.4, 'rgba(255,255,255,0.0)');
  tg.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = tg;
  roundRect(ctx, -34 * sc, -290 * sc, 68 * sc, 100 * sc, 10 * sc);
  ctx.fill();

  // Collar / neck skin
  ctx.fillStyle = avatar.skin;
  ctx.beginPath();
  ctx.ellipse(0, -290 * sc, 14 * sc, 18 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── ARMS ──
  const armSwingRad = deg2rad(avatar.armSwing);
  drawArm(ctx, sc, -34, -275, -0.15 - armSwingRad, 'left');
  drawArm(ctx, sc,  34, -275,  0.15 + armSwingRad, 'right');

  ctx.restore(); // end breathY

  // ── HEAD ──
  const headX = avatar.headSway * sc;
  const headY = (-330 + avatar.headNod) * sc + breathY;

  ctx.save();
  ctx.translate(headX, headY);

  // Neck
  ctx.fillStyle = avatar.skin;
  roundRect(ctx, -10 * sc, -20 * sc, 20 * sc, 25 * sc, 5 * sc);
  ctx.fill();

  // Head shape
  ctx.fillStyle = avatar.skin;
  ctx.beginPath();
  ctx.ellipse(0, -40 * sc, 38 * sc, 45 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  // Face light
  const fg = ctx.createRadialGradient(8 * sc, -50 * sc, 5 * sc, 0, -40 * sc, 45 * sc);
  fg.addColorStop(0, 'rgba(255,230,220,0.45)');
  fg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.ellipse(0, -40 * sc, 38 * sc, 45 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ear left
  ctx.fillStyle = avatar.skinDark;
  ctx.beginPath();
  ctx.ellipse(-37 * sc, -38 * sc, 7 * sc, 10 * sc, deg2rad(10), 0, Math.PI * 2);
  ctx.fill();
  // Ear right
  ctx.beginPath();
  ctx.ellipse( 37 * sc, -38 * sc, 7 * sc, 10 * sc, deg2rad(-10), 0, Math.PI * 2);
  ctx.fill();

  // ── HAIR ──
  ctx.fillStyle = avatar.hair;
  ctx.beginPath();
  ctx.ellipse(0, -72 * sc, 38 * sc, 25 * sc, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Hair sides
  ctx.beginPath();
  ctx.ellipse(-30 * sc, -58 * sc, 15 * sc, 20 * sc, deg2rad(-20), Math.PI * 0.5, Math.PI * 1.8);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse( 30 * sc, -58 * sc, 15 * sc, 20 * sc, deg2rad(20), Math.PI * 1.2, Math.PI * 2.5);
  ctx.fill();
  // Top hair wave
  ctx.beginPath();
  ctx.moveTo(-30 * sc, -68 * sc);
  ctx.bezierCurveTo(-20 * sc, -92 * sc, 5 * sc, -88 * sc, 15 * sc, -82 * sc);
  ctx.bezierCurveTo(25 * sc, -76 * sc, 35 * sc, -80 * sc, 38 * sc, -72 * sc);
  ctx.lineWidth = 0; ctx.strokeStyle = 'transparent';
  ctx.fillStyle = avatar.hair;
  ctx.fill();

  // ── EYEBROWS ──
  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = 2.5 * sc;
  ctx.lineCap = 'round';
  // Left brow
  ctx.beginPath();
  ctx.moveTo(-22 * sc, -58 * sc);
  ctx.quadraticCurveTo(-14 * sc, -63 * sc, -6 * sc, -59 * sc);
  ctx.stroke();
  // Right brow
  ctx.beginPath();
  ctx.moveTo(6 * sc, -59 * sc);
  ctx.quadraticCurveTo(14 * sc, -63 * sc, 22 * sc, -58 * sc);
  ctx.stroke();

  // ── EYES ──
  drawEye(ctx, sc, -14, -50, avatar.eyeOpenness, false);
  drawEye(ctx, sc,  14, -50, avatar.eyeOpenness, true);

  // ── NOSE ──
  ctx.strokeStyle = avatar.skinDark;
  ctx.lineWidth = 1.8 * sc;
  ctx.fillStyle = 'transparent';
  ctx.beginPath();
  ctx.moveTo(0, -44 * sc);
  ctx.quadraticCurveTo(-6 * sc, -28 * sc, -5 * sc, -24 * sc);
  ctx.quadraticCurveTo(0, -20 * sc, 5 * sc, -24 * sc);
  ctx.quadraticCurveTo(6 * sc, -28 * sc, 0, -44 * sc);
  ctx.stroke();

  // ── MOUTH ──
  drawMouth(ctx, sc, avatar.mouthOpen);

  // ── SUBTLE CHEEK BLUSH ──
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#ff8080';
  ctx.beginPath();
  ctx.ellipse(-24 * sc, -35 * sc, 10 * sc, 6 * sc, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse( 24 * sc, -35 * sc, 10 * sc, 6 * sc, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore(); // end head

  ctx.restore(); // end avatar translate
}

function drawEye(ctx, sc, ex, ey, openness, isRight) {
  const w = 10 * sc, h = 7 * sc * openness;

  // White
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(ex * sc, ey * sc, w, Math.max(h, 0.5), 0, 0, Math.PI * 2);
  ctx.fill();

  if (openness > 0.05) {
    // Iris
    ctx.fillStyle = '#4a6fa5';
    ctx.beginPath();
    ctx.ellipse(ex * sc, ey * sc, 5 * sc, Math.min(5 * sc, h * 0.9), 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(ex * sc, ey * sc, 2.5 * sc, Math.min(2.5 * sc, h * 0.6), 0, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse((ex - 2) * sc, (ey - 2) * sc, 1.5 * sc, 1.5 * sc, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyelid line top
  ctx.strokeStyle = '#2a1a0a';
  ctx.lineWidth = 1.4 * sc;
  ctx.beginPath();
  ctx.ellipse(ex * sc, ey * sc, w, Math.max(h, 1), 0, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(ex * sc, ey * sc, w, Math.max(h * 0.7, 0.5), 0, 0, Math.PI);
  ctx.stroke();
}

function drawMouth(ctx, sc, openness) {
  const my = -20 * sc;
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1.8 * sc;
  ctx.fillStyle = openness > 0.15 ? '#3a0a0a' : 'transparent';

  ctx.beginPath();
  ctx.moveTo(-12 * sc, my);
  ctx.quadraticCurveTo(0, (my + openness * 18 * sc), 12 * sc, my);
  if (openness > 0.15) {
    ctx.quadraticCurveTo(0, (my - openness * 6 * sc), -12 * sc, my);
    ctx.fill();
  }
  ctx.stroke();

  // Lip edges (smile lines)
  ctx.strokeStyle = '#c08060';
  ctx.lineWidth = 1 * sc;
  ctx.beginPath();
  ctx.arc(-12 * sc, my, 3 * sc, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc( 12 * sc, my, 3 * sc, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
}

function drawLeg(ctx, sc, lx, ly, angle) {
  ctx.save();
  ctx.translate(lx * sc, ly * sc);
  ctx.rotate(deg2rad(angle));

  // Thigh
  ctx.fillStyle = avatar.pants;
  roundRect(ctx, -13 * sc, 0, 26 * sc, 85 * sc, 8 * sc);
  ctx.fill();

  // Knee cap subtle
  ctx.fillStyle = '#3a5068';
  ctx.beginPath();
  ctx.ellipse(0, 82 * sc, 13 * sc, 9 * sc, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shin
  ctx.fillStyle = avatar.pants;
  roundRect(ctx, -11 * sc, 82 * sc, 22 * sc, 80 * sc, 6 * sc);
  ctx.fill();

  ctx.restore();
}

function drawShoe(ctx, sc, sx, sy, angle, isRight) {
  ctx.save();
  ctx.translate(sx * sc, sy * sc);
  ctx.rotate(deg2rad(angle * 0.5));

  ctx.fillStyle = avatar.shoe;
  roundRect(ctx, -14 * sc, -12 * sc, (isRight ? 34 : 34) * sc, 14 * sc, 7 * sc);
  ctx.fill();

  // Sole highlight
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, -12 * sc, -10 * sc, 30 * sc, 5 * sc, 4 * sc);
  ctx.fill();

  ctx.restore();
}

function drawArm(ctx, sc, ax, ay, angle, side) {
  ctx.save();
  ctx.translate(ax * sc, ay * sc);
  ctx.rotate(angle);

  const flip = side === 'left' ? -1 : 1;

  // Upper arm
  ctx.fillStyle = avatar.shirt;
  roundRect(ctx, (flip < 0 ? -22 : 0) * sc, 0, 22 * sc, 75 * sc, 9 * sc);
  ctx.fill();

  // Forearm skin
  ctx.fillStyle = avatar.skin;
  roundRect(ctx, (flip < 0 ? -20 : 0) * sc, 70 * sc, 20 * sc, 60 * sc, 8 * sc);
  ctx.fill();

  // Hand
  ctx.beginPath();
  ctx.ellipse((flip < 0 ? -10 : 10) * sc, 135 * sc, 11 * sc, 13 * sc, 0, 0, Math.PI * 2);
  ctx.fillStyle = avatar.skin;
  ctx.fill();

  ctx.restore();
}

// ─────────────────────────────────────────
// MAIN RENDER LOOP
// ─────────────────────────────────────────
function render(ts) {
  updateAvatar(ts);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawAvatar();

  requestAnimationFrame(render);
}

// ─────────────────────────────────────────
// INIT WAVE BARS IN CHIP
// ─────────────────────────────────────────
function initChip() {
  const chip = document.getElementById('chipWave');
  for (let i = 0; i < 5; i++) {
    const b = document.createElement('div');
    b.className = 'chip-wave-bar';
    chip.appendChild(b);
  }
}

// ─────────────────────────────────────────
// CHAT LOGIC
// ─────────────────────────────────────────
const chatMessages = document.getElementById('chatMessages');
const userInput    = document.getElementById('userInput');
const sendBtn      = document.getElementById('sendBtn');
const statusDot    = document.getElementById('statusDot');
const statusLabel  = document.getElementById('statusLabel');

let conversationHistory = [];
let isConnected = false;

// Auto-resize textarea
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
});

// Send on Enter (Shift+Enter = new line)
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// Test connection on load
async function testConnection() {
  try {
    const res = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: 5,
        messages: [{ role: 'user', content: 'hi' }]
      }),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      setStatus(true);
    } else {
      setStatus(false, `Erreur ${res.status}`);
    }
  } catch (e) {
    setStatus(false, 'Hors ligne');
  }
}

function setStatus(online, label) {
  isConnected = online;
  statusDot.className   = 'status-dot ' + (online ? 'online' : 'offline');
  statusLabel.textContent = online ? 'Connecté · LLM actif' : (label || 'Serveur inaccessible');
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  // Add user message
  addBubble('user', text);
  userInput.value = '';
  userInput.style.height = 'auto';
  conversationHistory.push({ role: 'user', content: text });

  // Disable input
  sendBtn.disabled     = true;
  userInput.disabled   = true;

  // Show typing indicator
  const typingId = addTyping();

  // Avatar starts talking
  avatar.isTalking = true;

  try {
    const res = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: "Tu es NEXUS, un assistant IA bienveillant et intelligent. Réponds en français, de manière concise et utile."
          },
          ...conversationHistory
        ]
      }),
      signal: AbortSignal.timeout(30000)
    });

    removeTyping(typingId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data   = await res.json();
    const reply  = data.choices?.[0]?.message?.content
                ?? data.message?.content
                ?? data.response
                ?? JSON.stringify(data);

    addBubble('assistant', reply);
    conversationHistory.push({ role: 'assistant', content: reply });
    setStatus(true);

  } catch (err) {
    removeTyping(typingId);
    addBubble('assistant', `⚠️ Impossible de contacter le serveur LLM.\n\n_${err.message}_\n\nVérifiez que le serveur tourne sur \`${LLM_URL}\`.`);
    setStatus(false, 'Erreur de connexion');
  } finally {
    sendBtn.disabled   = false;
    userInput.disabled = false;
    userInput.focus();

    // Stop talking after a short delay
    setTimeout(() => { avatar.isTalking = false; }, 800);
  }
}

function addBubble(role, text) {
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  // Basic markdown: *bold*, `code`, line breaks
  bubble.innerHTML = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.07);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
    .replace(/\n/g, '<br>');
  msg.appendChild(bubble);
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

let typingIdCounter = 0;
function addTyping() {
  const id = ++typingIdCounter;
  const msg = document.createElement('div');
  msg.className = 'msg assistant';
  msg.dataset.typingId = id;
  msg.innerHTML = `<div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = chatMessages.querySelector(`[data-typing-id="${id}"]`);
  if (el) el.remove();
}

// ─────────────────────────────────────────
// CHAT TOGGLE (collapse/expand)
// ─────────────────────────────────────────
const chatPanel  = document.getElementById('chatPanel');
const chatToggle = document.getElementById('chatToggle');

chatToggle.addEventListener('click', () => {
  chatPanel.classList.toggle('collapsed');
});

// ─────────────────────────────────────────
// CLICK TO MOVE AVATAR
// ─────────────────────────────────────────
canvas.style.pointerEvents = 'auto';
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx   = e.clientX - rect.left;
  const my   = e.clientY - rect.top;
  // Only move if click not on chat panel area
  const chatRect = chatPanel.getBoundingClientRect();
  if (e.clientX >= chatRect.left && e.clientY >= chatRect.top) return;

  avatar.targetX    = mx;
  avatar.targetY    = Math.min(my, canvas.height * 0.92);
  avatar.idleTimer  = 0;
  avatar.idleInterval = 5 + Math.random() * 5;
});

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────
initChip();
initAvatar();
testConnection();
requestAnimationFrame(render);
