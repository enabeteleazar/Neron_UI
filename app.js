const _CFG  = window.NERON_CONFIG || {};
const API     = _CFG.API_URL || 'http://192.168.1.130:8010';
const API_KEY = _CFG.API_KEY || '';

function apiHeaders(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  if (API_KEY) h['X-API-Key'] = API_KEY;
  return h;
}

document.addEventListener('DOMContentLoaded', () => {

const homeEl       = document.getElementById('home');
const chatEl       = document.getElementById('chat');
const msgsEl       = document.getElementById('msgs');
const txtEl        = document.getElementById('txt');
const sendBtn      = document.getElementById('send-btn');
const sDot         = document.getElementById('s-dot');
const sLbl         = document.getElementById('s-lbl');
const sDotDesk     = document.getElementById('s-dot-desk');
const sLblDesk     = document.getElementById('s-lbl-desk');
const sidebarModel = document.getElementById('sidebar-model');
const orbEl        = document.getElementById('orb');
const orbInline    = document.getElementById('orb-inline');
const orbLbl       = document.getElementById('orb-lbl');
const kbdBtn       = document.getElementById('kbd-btn');
const textRow      = document.getElementById('text-row');
const actionBar    = document.getElementById('action-bar');
const backBtn      = document.getElementById('back-btn');
const backBtnDesk  = document.getElementById('back-btn-desk');
const morphEl      = document.getElementById('morph');
const loaderEl     = document.getElementById('loader');
const toastEl      = document.getElementById('toast');

let busy=false, recording=false, kbdOpen=false, mediaRec=null, chunks=[], toastTmr=null;

(function(){
  const h=new Date().getHours();
  const g=h<5?'Bonne nuit,':h<12?'Bonjour,':h<18?'Bon après-midi,':'Bonsoir,';
  document.getElementById('greet-1').textContent=g;
})();

const WEATHER_ICONS={113:'☀️',116:'⛅',119:'☁️',122:'☁️',143:'🌫',176:'🌦',179:'🌨',182:'🌧',185:'🌧',200:'⛈',227:'🌨',230:'❄️',248:'🌫',260:'🌫',263:'🌦',266:'🌧',281:'🌧',284:'🌧',293:'🌦',296:'🌧',299:'🌧',302:'🌧',305:'🌧',308:'🌧',311:'🌧',314:'🌧',317:'🌧',320:'🌨',323:'🌨',326:'🌨',329:'❄️',332:'❄️',335:'❄️',338:'❄️',350:'🌧',353:'🌦',356:'🌧',359:'🌧',362:'🌧',365:'🌧',368:'🌨',371:'❄️',374:'🌧',377:'🌧',386:'⛈',389:'⛈',392:'⛈',395:'❄️'};

async function loadWeather(){
  try{
    const res=await fetch('https://wttr.in/?format=j1',{signal:AbortSignal.timeout(5000)});
    if(!res.ok)throw new Error();
    const data=await res.json();
    const cur=data.current_condition[0];
    const code=parseInt(cur.weatherCode);
    document.getElementById('weather-icon').textContent=WEATHER_ICONS[code]||'🌡';
    document.getElementById('weather-temp').textContent=cur.temp_C+'°';
    document.getElementById('weather-desc').textContent=(cur.lang_fr?.[0]?.value||cur.weatherDesc?.[0]?.value||'').toLowerCase();
  }catch(e){document.getElementById('weather-temp').textContent='—';}
}
loadWeather();

function renderWidget(event){
  const inner=document.getElementById('widget-inner');
  if(!inner)return;
  if(!event){
    inner.innerHTML='<div class="widget-empty"><span class="widget-empty-icon">📅</span><span class="widget-empty-txt">Aucun événement à venir</span></div>';
    return;
  }
  inner.innerHTML=`<div class="widget-event"><span class="widget-event-time">${event.time}</span><span class="widget-event-title">${event.title}</span>${event.sub?`<span class="widget-event-sub">${event.sub}</span>`:''}</div>`;
}

async function loadCalendar(){
  const gcalKey=window.NERON_CONFIG?.GCAL_KEY||'';
  const gcalId=window.NERON_CONFIG?.GCAL_ID||'';
  if(!gcalKey||!gcalId){renderWidget(null);return;}
  try{
    const now=new Date().toISOString();
    const url=`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(gcalId)}/events?key=${gcalKey}&timeMin=${now}&maxResults=1&singleEvents=true&orderBy=startTime`;
    const res=await fetch(url,{signal:AbortSignal.timeout(5000)});
    if(!res.ok)throw new Error();
    const data=await res.json();
    const item=data.items?.[0];
    if(!item){renderWidget(null);return;}
    const start=item.start?.dateTime||item.start?.date;
    const d=new Date(start);
    const isToday=d.toDateString()===new Date().toDateString();
    const time=isToday?`Aujourd'hui · ${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`:d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
    renderWidget({time,title:item.summary,sub:item.location||''});
  }catch{renderWidget(null);}
}
loadCalendar();

const _tts=window.speechSynthesis;
let _ttsVoice=null;
function initTTSVoice(){
  if(!_tts)return;
  const voices=_tts.getVoices();
  const fr=voices.filter(v=>v.lang.startsWith('fr'));
  _ttsVoice=fr.find(v=>!v.name.includes('Compact'))||fr[0]||null;
  if(_ttsVoice)console.log('🔊 Voix TTS :',_ttsVoice.name);
}
if(_tts){initTTSVoice();_tts.onvoiceschanged=initTTSVoice;}

function speak(text){
  if(!_tts||!text)return Promise.resolve();
  return new Promise((resolve)=>{
    _tts.cancel();
    const utt=new SpeechSynthesisUtterance(text);
    utt.lang='fr-FR';utt.rate=1.0;utt.pitch=1.0;
    if(_ttsVoice)utt.voice=_ttsVoice;
    setOrb('speaking');setStatus('speaking');
    utt.onend=()=>{setOrb('idle');setStatus('');resolve();};
    utt.onerror=()=>{setOrb('idle');setStatus('');resolve();};
    _tts.speak(utt);
  });
}

const STATUS_LABELS={'':'en ligne',offline:'hors ligne',thinking:'réfléchit…',connecting:'connexion…',speaking:'parle…'};
function setStatus(s){
  const cls='s-dot '+s,lbl=STATUS_LABELS[s]??s;
  if(sDot){sDot.className=cls;sLbl.textContent=lbl;}
  if(sDotDesk)sDotDesk.className=cls;
  if(sLblDesk)sLblDesk.textContent=lbl;
}

function setOrb(s){
  if(orbEl)orbEl.dataset.state=s;
  if(orbInline)orbInline.dataset.state=s;
  if(orbLbl)orbLbl.textContent={idle:'maintenir pour parler',recording:'relâcher pour envoyer',thinking:'néron réfléchit…',speaking:'néron parle…'}[s]??'';
}

function toast(msg,ms=3500){
  toastEl.textContent=msg;toastEl.classList.add('show');
  clearTimeout(toastTmr);toastTmr=setTimeout(()=>toastEl.classList.remove('show'),ms);
}

function isDesktop(){return window.innerWidth>=1024;}

if(kbdBtn)kbdBtn.addEventListener('click',toggleKbd);
function toggleKbd(){
  kbdOpen=!kbdOpen;
  kbdBtn.classList.toggle('on',kbdOpen);
  if(kbdOpen){
    if(actionBar)actionBar.style.display='none';
    textRow.classList.add('open');
    setTimeout(()=>txtEl.focus(),300);
  }else{
    textRow.classList.remove('open');
    if(actionBar)actionBar.style.display='';
    txtEl.blur();
    sendBtn.style.display='none';
    if(orbInline)orbInline.style.display='';
  }
}

txtEl.addEventListener('input',()=>{
  txtEl.style.height='auto';
  txtEl.style.height=Math.min(txtEl.scrollHeight,120)+'px';
  const hasText=!!txtEl.value.trim();
  if(!isDesktop()){
    if(orbInline)orbInline.style.display=hasText?'none':'';
    sendBtn.style.display=hasText?'':'none';
  }else{
    sendBtn.style.display='';
    sendBtn.disabled=!hasText;
  }
});

txtEl.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendText();}
});
sendBtn.addEventListener('click',sendText);

function scrollEnd(){msgsEl.scrollTo({top:msgsEl.scrollHeight,behavior:'smooth'});}

function addMsg(role,text){
  const wrap=document.createElement('div');wrap.className='msg '+role;
  const who=document.createElement('span');who.className='msg-who';who.textContent=role==='user'?'vous':'néron';
  const bub=document.createElement('div');bub.className='bubble';bub.textContent=text;
  wrap.append(who,bub);msgsEl.appendChild(wrap);scrollEnd();
  requestAnimationFrame(()=>requestAnimationFrame(()=>wrap.classList.add('in')));
  return wrap;
}

function showTyping(){
  if(document.getElementById('typing'))return;
  const wrap=document.createElement('div');wrap.className='typing';wrap.id='typing';
  const who=document.createElement('span');who.className='typing-who';who.textContent='néron';
  const dots=document.createElement('div');dots.className='typing-dots';
  dots.innerHTML='<span></span><span></span><span></span>';
  wrap.append(who,dots);msgsEl.appendChild(wrap);scrollEnd();
}

function hideTyping(){const t=document.getElementById('typing');if(t)t.remove();}

function goChat(){
  const phoneR=document.querySelector('.phone').getBoundingClientRect();
  const orbR=document.getElementById('home-orb').getBoundingClientRect();
  const cx=orbR.left+orbR.width/2-phoneR.left,cy=orbR.top+orbR.height/2-phoneR.top,sz=orbR.width;
  morphEl.style.cssText=`width:${sz}px;height:${sz}px;left:${cx-sz/2}px;top:${cy-sz/2}px;bottom:auto;opacity:0`;
  morphEl.classList.remove('expand','collapse');homeEl.classList.add('out');
  requestAnimationFrame(()=>requestAnimationFrame(()=>morphEl.classList.add('expand')));
  setTimeout(()=>loaderEl.classList.add('show'),350);
  checkHealth().then(()=>{
    setTimeout(()=>{
      loaderEl.classList.remove('show');morphEl.classList.remove('expand');morphEl.classList.add('collapse');
      chatEl.classList.add('show');
      setTimeout(()=>{const g='Bonsoir. Comment puis-je vous aider ?';addMsg('neron',g);speak(g);},120);
    },600);
  });
}

function goHome(){
  _tts&&_tts.cancel();chatEl.classList.remove('show');homeEl.classList.remove('out');
  morphEl.classList.remove('expand','collapse');morphEl.style.opacity='0';
  msgsEl.innerHTML='';if(kbdOpen)toggleKbd();setStatus('');
  loadWeather();loadCalendar();
}

homeEl.addEventListener('click',goChat);
backBtn.addEventListener('click',e=>{e.stopPropagation();goHome();});
if(backBtnDesk)backBtnDesk.addEventListener('click',goHome);

async function sendText(){
  const text=txtEl.value.trim();if(!text||busy)return;
  txtEl.value='';txtEl.style.height='auto';
  if(!isDesktop()){sendBtn.style.display='none';if(orbInline)orbInline.style.display='';}
  else{sendBtn.disabled=true;}
  busy=true;addMsg('user',text);
  setStatus('thinking');setOrb('thinking');

  // Créer bulle vide pour le stream
  const wrap=document.createElement('div');wrap.className='msg neron';
  const who=document.createElement('span');who.className='msg-who';who.textContent='néron';
  const bub=document.createElement('div');bub.className='bubble';bub.textContent='';
  wrap.append(who,bub);msgsEl.appendChild(wrap);scrollEnd();
  requestAnimationFrame(()=>requestAnimationFrame(()=>wrap.classList.add('in')));

  let fullResponse='';

  try{
    const res=await fetch(`${API}/input/stream`,{
      method:'POST',headers:apiHeaders(),
      body:JSON.stringify({text}),
      signal:AbortSignal.timeout(90000),
    });
    if(!res.ok)throw new Error(`HTTP ${res.status}`);

    const reader=res.body.getReader();
    const decoder=new TextDecoder();
    let buffer='';

    while(true){
      const{done,value}=await reader.read();
      if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split('\n');
      buffer=lines.pop();

      for(const line of lines){
        if(!line.startsWith('data:'))continue;
        try{
          const json=JSON.parse(line.slice(5).trim());
          if(json.token){
            fullResponse+=json.token;
            bub.textContent=fullResponse;
            scrollEnd();
          }
          if(json.done&&fullResponse){
            setStatus('');setOrb('idle');
            await speak(fullResponse);
          }
        }catch{}
      }
    }
  }catch(err){
    bub.textContent=`Connexion impossible — ${err.message}`;
    wrap.className='msg error';
    setStatus('offline');setOrb('idle');
    toast(`Backend hors ligne · ${API}`);
  }finally{
    busy=false;
    if(isDesktop()){sendBtn.disabled=false;txtEl.focus();}
  }
}

function bindOrb(el){
  if(!el)return;
  el.addEventListener('mousedown',startRec);
  el.addEventListener('touchstart',e=>{e.preventDefault();startRec();},{passive:false});
  el.addEventListener('mouseup',stopRec);el.addEventListener('mouseleave',stopRec);
  el.addEventListener('touchend',stopRec);el.addEventListener('touchcancel',stopRec);
}
bindOrb(orbEl);bindOrb(orbInline);

async function startRec(){
  if(busy||recording)return;
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    chunks=[];mediaRec=new MediaRecorder(stream);
    mediaRec.ondataavailable=e=>chunks.push(e.data);
    mediaRec.onstop=sendVoice;mediaRec.start();
    recording=true;setOrb('recording');
  }catch(err){setStatus('offline');toast('Microphone inaccessible — '+err.message);}
}

function stopRec(){
  if(!recording||!mediaRec)return;
  mediaRec.stop();mediaRec.stream.getTracks().forEach(t=>t.stop());
  recording=false;setOrb('thinking');setStatus('thinking');
}

async function sendVoice(){
  if(!chunks.length){setOrb('idle');setStatus('');return;}
  busy=true;
  const blob=new Blob(chunks,{type:'audio/webm'});
  const form=new FormData();form.append('file',blob,'voice.webm');
  showTyping();
  const headers={};if(API_KEY)headers['X-API-Key']=API_KEY;
  try{
    const sttRes=await fetch(`${API}/input/audio`,{method:'POST',headers,body:form,signal:AbortSignal.timeout(30000)});
    if(!sttRes.ok)throw new Error(`STT ${sttRes.status}`);
    const sttData=await sttRes.json();
    const transcription=sttData.transcription||sttData.text||sttData.content||'';
    const response=sttData.response||'';
    if(transcription)addMsg('user','🎙 '+transcription);
    hideTyping();
    if(response){
      addMsg('neron',response);
      if(sttData.model&&sidebarModel)sidebarModel.textContent=sttData.model;
      await speak(response);
    }
  }catch(err){
    hideTyping();addMsg('error',`Erreur vocal — ${err.message}`);
    setStatus('offline');setOrb('idle');toast(`Erreur pipeline vocal · ${err.message}`);
  }finally{busy=false;setOrb('idle');setStatus('');}
}

async function checkHealth(){
  setStatus('connecting');
  try{
    const res=await fetch(`${API}/health`,{headers:API_KEY?{'X-API-Key':API_KEY}:{},signal:AbortSignal.timeout(4000)});
    if(res.ok){setStatus('');return true;}
    setStatus('offline');toast(`Backend hors ligne · ${API}`);return false;
  }catch{setStatus('offline');toast(`Backend hors ligne · ${API}`);return false;}
}

chatEl.addEventListener('transitionend',()=>{
  if(chatEl.classList.contains('show')&&isDesktop())txtEl.focus();
});

});
