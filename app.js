/* ═══════════════════════════════════════
   CONFIG
═══════════════════════════════════════ */
const _CFG  = window.NERON_CONFIG || {};
const API     = _CFG.API_URL || 'http://192.168.1.130:8000';
const API_KEY = _CFG.API_KEY || '';

function apiHeaders(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  if (API_KEY) h['X-API-Key'] = API_KEY;
  return h;
}

document.addEventListener('DOMContentLoaded', () => {

/* ═══════════════════════════════════════
   DOM
═══════════════════════════════════════ */
const homeEl        = document.getElementById('home');
const chatEl        = document.getElementById('chat');
const msgsEl        = document.getElementById('msgs');
const txtEl         = document.getElementById('txt');
const sendBtn       = document.getElementById('send-btn');
const sDot          = document.getElementById('s-dot');
const sLbl          = document.getElementById('s-lbl');
const sDotDesk      = document.getElementById('s-dot-desk');
const sLblDesk      = document.getElementById('s-lbl-desk');
const sidebarModel  = document.getElementById('sidebar-model');
const orbEl         = document.getElementById('orb');
const orbLbl        = document.getElementById('orb-lbl');
const kbdBtn        = document.getElementById('kbd-btn');
const textRow       = document.getElementById('text-row');
const backBtn       = document.getElementById('back-btn');
const backBtnDesk   = document.getElementById('back-btn-desk');
const morphEl       = document.getElementById('morph');
const loaderEl      = document.getElementById('loader');
const toastEl       = document.getElementById('toast');

const missing = [
  ['home',homeEl],['chat',chatEl],['msgs',msgsEl],['txt',txtEl],
  ['send-btn',sendBtn],['s-dot',sDot],['s-lbl',sLbl],
  ['orb',orbEl],['kbd-btn',kbdBtn],['text-row',textRow],
  ['back-btn',backBtn],['morph',morphEl],['loader',loaderEl],['toast',toastEl]
].filter(([,el]) => !el).map(([id]) => id);

if (missing.length) { console.error('❌ DOM manquant :', missing.join(', ')); return; }

console.log(`✅ Néron prêt — API : ${API}`);

/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
let busy      = false;
let recording = false;
let kbdOpen   = false;
let mediaRec  = null;
let chunks    = [];
let toastTmr  = null;

/* ═══════════════════════════════════════
   GREETING
═══════════════════════════════════════ */
(function () {
  const h = new Date().getHours();
  const g = h < 5  ? 'Bonne nuit,'     :
            h < 12 ? 'Bonjour,'        :
            h < 18 ? 'Bon après-midi,' : 'Bonsoir,';
  document.getElementById('greet-1').textContent = g;
})();

/* ═══════════════════════════════════════
   STATUS — sync mobile + desktop
═══════════════════════════════════════ */
const STATUS_LABELS = {
  ''         : 'en ligne',
  offline    : 'hors ligne',
  thinking   : 'réfléchit…',
  connecting : 'connexion…',
};

function setStatus(s) {
  const cls  = 's-dot ' + s;
  const lbl  = STATUS_LABELS[s] ?? s;

  // Mobile header
  sDot.className   = cls;
  sLbl.textContent = lbl;

  // Sidebar desktop
  if (sDotDesk) { sDotDesk.className = cls; }
  if (sLblDesk) { sLblDesk.textContent = lbl; }
}

/* ═══════════════════════════════════════
   ORB STATE
═══════════════════════════════════════ */
function setOrb(s) {
  orbEl.dataset.state = s;
  orbLbl.textContent = {
    idle      : 'maintenir pour parler',
    recording : 'relâcher pour envoyer',
    thinking  : 'néron réfléchit…',
  }[s] ?? '';
}

/* ═══════════════════════════════════════
   TOAST
═══════════════════════════════════════ */
function toast(msg, ms = 3500) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTmr);
  toastTmr = setTimeout(() => toastEl.classList.remove('show'), ms);
}

/* ═══════════════════════════════════════
   TRANSITION HOME → CHAT
═══════════════════════════════════════ */
function goChat() {
  const phoneR = document.querySelector('.phone').getBoundingClientRect();
  const orbR   = document.getElementById('home-orb').getBoundingClientRect();
  const cx = orbR.left + orbR.width  / 2 - phoneR.left;
  const cy = orbR.top  + orbR.height / 2 - phoneR.top;
  const sz = orbR.width;

  morphEl.style.cssText = `width:${sz}px;height:${sz}px;left:${cx-sz/2}px;top:${cy-sz/2}px;bottom:auto;opacity:0`;
  morphEl.classList.remove('expand','collapse');
  homeEl.classList.add('out');

  requestAnimationFrame(() => requestAnimationFrame(() => morphEl.classList.add('expand')));
  setTimeout(() => loaderEl.classList.add('show'), 350);

  checkHealth().then(() => {
    setTimeout(() => {
      loaderEl.classList.remove('show');
      morphEl.classList.remove('expand');
      morphEl.classList.add('collapse');
      chatEl.classList.add('show');
      setTimeout(() => addMsg('neron', 'Bonsoir. Comment puis-je vous aider ?'), 120);
    }, 600);
  });
}

/* ═══════════════════════════════════════
   TRANSITION CHAT → HOME
═══════════════════════════════════════ */
function goHome() {
  chatEl.classList.remove('show');
  homeEl.classList.remove('out');
  morphEl.classList.remove('expand','collapse');
  morphEl.style.opacity = '0';
  msgsEl.innerHTML = '';
  if (kbdOpen) toggleKbd();
  setStatus('');
}

/* ═══════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════ */
homeEl.addEventListener('click', goChat);
backBtn.addEventListener('click', e => { e.stopPropagation(); goHome(); });
if (backBtnDesk) backBtnDesk.addEventListener('click', goHome);

/* ═══════════════════════════════════════
   KEYBOARD TOGGLE (mobile/tablet)
═══════════════════════════════════════ */
if (kbdBtn) kbdBtn.addEventListener('click', toggleKbd);

function toggleKbd() {
  kbdOpen = !kbdOpen;
  kbdBtn.classList.toggle('on', kbdOpen);
  textRow.classList.toggle('open', kbdOpen);
  if (kbdOpen) setTimeout(() => txtEl.focus(), 300);
  else txtEl.blur();
}

/* Sur desktop le champ est toujours visible */
function isDesktop() { return window.innerWidth >= 1024; }

/* ═══════════════════════════════════════
   TEXTAREA
═══════════════════════════════════════ */
txtEl.addEventListener('input', () => {
  txtEl.style.height = 'auto';
  txtEl.style.height = Math.min(txtEl.scrollHeight, 120) + 'px';
  sendBtn.disabled = !txtEl.value.trim();
});

txtEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
});

sendBtn.addEventListener('click', sendText);

/* ═══════════════════════════════════════
   MESSAGES
═══════════════════════════════════════ */
function scrollEnd() { msgsEl.scrollTo({ top: msgsEl.scrollHeight, behavior: 'smooth' }); }

function addMsg(role, text) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + role;

  const who = document.createElement('span');
  who.className = 'msg-who';
  who.textContent = role === 'user' ? 'vous' : 'néron';

  const bub = document.createElement('div');
  bub.className = 'bubble';
  bub.textContent = text;

  wrap.append(who, bub);
  msgsEl.appendChild(wrap);
  scrollEnd();
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in')));
  return wrap;
}

function showTyping() {
  if (document.getElementById('typing')) return;
  const wrap = document.createElement('div');
  wrap.className = 'typing'; wrap.id = 'typing';
  const who = document.createElement('span');
  who.className = 'typing-who'; who.textContent = 'néron';
  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';
  wrap.append(who, dots);
  msgsEl.appendChild(wrap);
  scrollEnd();
}

function hideTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

/* ═══════════════════════════════════════
   SEND TEXT → POST /input/text
═══════════════════════════════════════ */
async function sendText() {
  const text = txtEl.value.trim();
  if (!text || busy) return;

  txtEl.value = '';
  txtEl.style.height = 'auto';
  sendBtn.disabled = true;
  busy = true;

  addMsg('user', text);
  showTyping();
  setStatus('thinking');
  setOrb('thinking');

  try {
    const res = await fetch(`${API}/input/text`, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(90000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    hideTyping();
    addMsg('neron', data.response || '…');
    setStatus('');
    setOrb('idle');

    // Afficher le modèle dans la sidebar si présent
    if (data.model && sidebarModel) {
      sidebarModel.textContent = data.model;
    }

  } catch (err) {
    hideTyping();
    addMsg('error', `Connexion impossible — ${err.message}`);
    setStatus('offline');
    setOrb('idle');
    toast(`Backend hors ligne · ${API}`);
  } finally {
    busy = false;
    sendBtn.disabled = !txtEl.value.trim();
    if (isDesktop() || kbdOpen) txtEl.focus();
  }
}

/* ═══════════════════════════════════════
   VOICE → POST /input/audio
═══════════════════════════════════════ */
if (orbEl) {
  orbEl.addEventListener('mousedown',   startRec);
  orbEl.addEventListener('touchstart',  e => { e.preventDefault(); startRec(); }, { passive: false });
  orbEl.addEventListener('mouseup',     stopRec);
  orbEl.addEventListener('mouseleave',  stopRec);
  orbEl.addEventListener('touchend',    stopRec);
  orbEl.addEventListener('touchcancel', stopRec);
}

async function startRec() {
  if (busy || recording) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRec = new MediaRecorder(stream);
    mediaRec.ondataavailable = e => chunks.push(e.data);
    mediaRec.onstop = sendAudio;
    mediaRec.start();
    recording = true;
    setOrb('recording');
    setStatus('thinking');
  } catch (err) {
    setStatus('offline');
    toast('Microphone inaccessible — ' + err.message);
  }
}

function stopRec() {
  if (!recording || !mediaRec) return;
  mediaRec.stop();
  mediaRec.stream.getTracks().forEach(t => t.stop());
  recording = false;
  setOrb('thinking');
}

async function sendAudio() {
  if (!chunks.length) { setOrb('idle'); return; }
  busy = true;

  const blob = new Blob(chunks, { type: 'audio/webm' });
  const form = new FormData();
  form.append('file', blob, 'voice.webm');
  showTyping();

  const headers = {};
  if (API_KEY) headers['X-API-Key'] = API_KEY;

  try {
    const res = await fetch(`${API}/input/audio`, {
      method: 'POST', headers, body: form,
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`STT ${res.status}`);
    const data = await res.json();
    const tx = data.transcription || data.text || '';
    if (tx) addMsg('user', '🎙 ' + tx);
    hideTyping();
    addMsg('neron', data.response || '…');
    setStatus('');
    setOrb('idle');
    if (data.model && sidebarModel) sidebarModel.textContent = data.model;
  } catch (err) {
    hideTyping();
    addMsg('error', `Erreur audio — ${err.message}`);
    setStatus('offline');
    setOrb('idle');
    toast(`Backend hors ligne · ${API}`);
  } finally {
    busy = false;
  }
}

/* ═══════════════════════════════════════
   HEALTH CHECK → GET /health
═══════════════════════════════════════ */
async function checkHealth() {
  setStatus('connecting');
  try {
    const res = await fetch(`${API}/health`, {
      headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) { setStatus(''); return true; }
    setStatus('offline');
    toast(`Backend hors ligne · ${API}`);
    return false;
  } catch {
    setStatus('offline');
    toast(`Backend hors ligne · ${API}`);
    return false;
  }
}

/* Focus auto sur desktop au démarrage du chat */
chatEl.addEventListener('transitionend', () => {
  if (chatEl.classList.contains('show') && isDesktop()) {
    txtEl.focus();
  }
});

}); // DOMContentLoaded
