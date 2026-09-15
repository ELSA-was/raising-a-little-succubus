/* =========================================================================
   《养成一个小魅魔》 —— 视觉小说引擎
   ========================================================================= */
import { STORY, PERSONALITY } from '../data/story.js';
import { ROUTES } from '../data/routes.js';
import { ENDINGS } from '../data/endings.js';
import {
  BG, CHARS, STAGES, ROUTE_KEYS, ROUTE_GATE, ROUTE_START, ROUTE_META,
  ENDING_META, STORAGE_KEY
} from './world.js';

/* 合并全部节点 */
const NODES = Object.assign({}, STORY, ROUTES, ENDINGS);

/* ---------------- 状态 ---------------- */
const SAVE_BASE = {
  name: '许沅',
  love: 0, bond: 0,
  aff: { guhuai: 0, shenyan: 0, jiangyu: 0, huoqing: 0, suwan: 0 },
  stage: 'egg',
  personality: null,
  twinCare: false,
  dark: false,
  nerve: 0,
  node: 'a0_1',
  r18: true,
  unlocked: []
};

let state = structuredClone(SAVE_BASE);
let reveal = false;
let bgKey = null;

const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- BGM：程序化环境氛围（无需外部文件） ---------------- */
const Music = (() => {
  let ctx = null, master = null, timer = null, playing = false;
  // 温柔的小调和弦循环
  const chords = [
    [220.00, 261.63, 329.63], // Am
    [196.00, 246.94, 293.66], // G
    [174.61, 220.00, 261.63], // F
    [164.81, 196.00, 246.94]  // E
  ];
  let ci = 0;
  function voice(freq, t, dur, gain) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 1.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.1);
  }
  function step() {
    const t = ctx.currentTime + 0.05;
    const ch = chords[ci % chords.length];
    ch.forEach((f, i) => voice(f, t, 4.2, 0.10 - i * 0.02));
    // 偶尔点一颗高音
    if (ci % 2 === 0) voice(ch[2] * 2, t + 1.6, 2.0, 0.05);
    ci++;
  }
  return {
    start() {
      if (playing) return;
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
      }
      ctx.resume();
      playing = true;
      step();
      timer = setInterval(step, 3800);
    },
    stop() {
      playing = false;
      if (timer) clearInterval(timer);
      if (ctx) ctx.suspend();
    },
    toggle() { playing ? this.stop() : this.start(); return playing; },
    get on() { return playing; },
    setVol(v) { if (master) master.gain.value = v; }
  };
})();

/* ---------------- 数值应用 ---------------- */
function applyGain(g) {
  if (!g) return;
  if (g.p) state.personality = g.p;
  if (g.twinCare) state.twinCare = true;
  if (g.stage) state.stage = g.stage;
  if (g.nerve) state.nerve += g.nerve;
  if (g.love) state.love = clamp(state.love + g.love, 0, 100);
  if (g.bond) state.bond = clamp(state.bond + g.bond, 0, 200);
  if (g.dark) state.dark = true;
  const map = { Gu: 'guhuai', Shen: 'shenyan', Jiang: 'jiangyu', Huo: 'huoqing', Su: 'suwan' };
  for (const k in map) if (g['aff' + k]) state.aff[map[k]] = clamp((state.aff[map[k]] || 0) + g['aff' + k], 0, 100);
}

function effAff(key) {
  return key === 'silas' ? state.bond : (state.aff[key] || 0);
}

/* ---------------- 渲染：背景 ---------------- */
function setBackground(key) {
  if (key === bgKey) return;
  bgKey = key;
  const url = BG[key] || BG.apartment_night;
  const img = new Image();
  img.onload = () => {
    const bg = $('#bg');
    bg.style.opacity = 0;
    setTimeout(() => { bg.src = url; bg.style.opacity = 1; }, 180);
  };
  img.src = url;
  $('#bg').src = url;
  $('#bg').style.opacity = 1;
}

/* ---------------- 渲染：立绘 ---------------- */
function renderSprites(cast) {
  const layer = $('#sprites');
  layer.innerHTML = '';
  (cast || []).forEach(([id, variant, pos]) => {
    const img = document.createElement('img');
    img.className = `sprite pos-${pos || 'center'}`;
    img.dataset.id = id;
    img.dataset.variant = variant || 'norm';
    layer.appendChild(img);
  });
  applySpriteImages();
}

function spriteURL(id, variant, full) {
  // reveal 模式（查看完整立绘）复用 norm（已裁剪好的全身立绘），避免缺失 _full 文件导致裂图
  const v = full ? 'norm' : (variant || 'norm');
  return `assets/char/${id}_${v}.jpg`;
}

function applySpriteImages() {
  document.querySelectorAll('#sprites .sprite').forEach((img) => {
    img.src = spriteURL(img.dataset.id, img.dataset.variant, reveal);
  });
}

/* ---------------- 渲染：单节 ---------------- */
function renderNode(id) {
  const node = NODES[id];
  if (!node) { console.error('missing node', id); return; }
  state.node = id;
  autosave();

  setBackground(node.bg);
  renderSprites(node.cast);

  const isEnding = !!node.type; // endings have type field
  const isHub = node.special === 'hub';

  $('#chapter').textContent = node.title || '';
  $('#time').textContent = node.time || '';
  $('#stage-flag').textContent = STAGES[state.stage] || '';

  // 文本
  const dlg = $('#dialogue');
  dlg.innerHTML = '';
  let textArr = node.text || [];
  if (node.r18 && !state.r18) {
    textArr = ['✦ 此处为成人向内容，已按你的设置隐藏。\n\n（可随时在「设置」中开启 R18 内容，重新体验完整剧情。）'];
  }
  textArr.forEach((p, i) => {
    const el = document.createElement('p');
    el.textContent = p;
    el.style.animationDelay = (i * 0.12) + 's';
    dlg.appendChild(el);
  });
  // 说话人名字牌
  const sp = (node.cast && node.cast[0]) ? node.cast[0][0] : null;
  const nameEl = $('#speaker');
  if (sp && CHARS[sp] && !isEnding) {
    nameEl.textContent = CHARS[sp].name;
    nameEl.style.color = CHARS[sp].color;
    nameEl.style.display = '';
  } else if (isEnding) {
    nameEl.textContent = '— 结局 —';
    nameEl.style.color = '#fff';
    nameEl.style.display = '';
  } else {
    nameEl.style.display = 'none';
  }

  // 选项
  const ch = $('#choices');
  ch.innerHTML = '';
  if (!isHub) {
    const opts = node.choices || (node.next ? [{ t: '继续 ▸', to: node.next }] : []);
    opts.forEach((o) => {
      const b = document.createElement('button');
      b.className = 'choice';
      b.innerHTML = `<span class="ct">${o.t}</span>${o.hint ? `<span class="chint">${o.hint}</span>` : ''}`;
      b.addEventListener('click', (e) => { e.stopPropagation(); choose(o); });
      ch.appendChild(b);
    });
  } else {
    buildHub(ch);
  }

  if (isEnding) showEnding(state.node);

  showScreen('game');
  updateStatus();
}

/* ---------------- Hub（成熟期分线） ---------------- */
function buildHub(container) {
  const wrap = document.createElement('div');
  wrap.className = 'hub';
  wrap.innerHTML = `<div class="hub-title">▸ 选择你的下一步</div>`;

  const rows = [];
  ROUTE_KEYS.forEach((k) => {
    const gate = ROUTE_GATE[k];
    const v = effAff(k);
    const meta = ROUTE_META[k];
    if (v >= gate) {
      rows.push({ t: `${meta.emoji} 攻略 · ${meta.title}`, sub: meta.sub, to: ROUTE_START[k] });
    } else {
      const need = k === 'silas' ? '亲密值' : '好感';
      rows.push({ t: `🔒 ${meta.title}（${need}不足，需 ≥${gate}，当前 ${v}）`, sub: meta.sub, locked: true });
    }
  });

  // 隐藏：双生
  if (state.twinCare && state.bond >= 80 && state.aff.silas >= 60) {
    rows.push({ t: '🌑（隐藏）双生 · 那枚沉眠的蛋里，有人醒了', to: 'end_S1', special: true });
  }

  rows.forEach((r) => {
    const b = document.createElement('button');
    b.className = 'choice' + (r.locked ? ' locked' : '') + (r.special ? ' special' : '');
    b.innerHTML = `<span class="ct">${r.t}</span>${r.sub ? `<span class="chint">${r.sub}</span>` : ''}`;
    if (!r.locked) b.addEventListener('click', (e) => { e.stopPropagation(); go(r.to); });
    else b.disabled = true;
    wrap.appendChild(b);
  });

  const div = document.createElement('div');
  div.className = 'hub-divider';
  div.textContent = '—— 其他走向（均含完整可玩结局）——';
  wrap.appendChild(div);

  const others = [
    ['📸 《超模》', '走完自己的事业线', 'end_S2'],
    ['🏠 《独居动物》', '谁都不选，一个人也很好', 'end_S3'],
    ['💄 《姐妹淘》', '和苏晚才是一辈子的', 'end_S4'],
    ['🍼 《全职饲养员》', '只养魅魔，不谈恋爱', 'end_S5'],
    ['🎭 《修罗场》', '四个人一起？翻车现场', 'end_S6'],
    ['💔 《好好小姐》', '谁都答应，谁都不属于你', 'end_S7'],
    ['🌫 《错过》', '就差那么一句话', 'end_S8'],
    ['❄ 《S 市的第一场雪》', '就这样吧，都挺好', 'end_S9']
  ];
  others.forEach(([t, s, to]) => {
    const b = document.createElement('button');
    b.className = 'choice ghost';
    b.innerHTML = `<span class="ct">${t}</span><span class="chint">${s}</span>`;
    b.addEventListener('click', (e) => { e.stopPropagation(); go(to); });
    wrap.appendChild(b);
  });

  container.appendChild(wrap);
}

/* ---------------- 选择 / 跳转 ---------------- */
function choose(opt) {
  applyGain(opt.gain);
  if (opt.to) go(opt.to);
}

function go(id) {
  const node = NODES[id];
  if (!node) { console.error('未知节点', id); return; }
  if (node.type) { // 结局
    if (!state.unlocked.includes(id)) state.unlocked.push(id);
    autosave();
  }
  renderNode(id);
}

/* ---------------- 结局界面 ---------------- */
function showEnding(id) {
  const node = ENDINGS[id];
  // renderNode 已处理结局内文与立绘；此处只补底部操作
  const ch = $('#choices');
  ch.innerHTML = '';
  const b1 = document.createElement('button');
  b1.className = 'choice';
  b1.innerHTML = '<span class="ct">📖 查看结局图鉴</span>';
  b1.addEventListener('click', (e) => { e.stopPropagation(); openGallery(); });
  const b2 = document.createElement('button');
  b2.className = 'choice ghost';
  b2.innerHTML = '<span class="ct">↺ 再玩一次（回到序章）</span>';
  b2.addEventListener('click', (e) => { e.stopPropagation(); restart(); });
  ch.appendChild(b1); ch.appendChild(b2);
}

/* ---------------- 状态栏 ---------------- */
function updateStatus() {
  const p = state.personality ? (PERSONALITY[state.personality] ? PERSONALITY[state.personality].name : '') : '';
  const rows = [
    ['爱意值', state.love, 100, '#ff9ec4'],
    ['亲密值', state.bond, 200, '#c9a6ff'],
    ['塞拉斯', state.bond, 200, '#c9a6ff'],
    ['顾淮', state.aff.guhuai, 100, '#7fb6d6'],
    ['沈砚', state.aff.shenyan, 100, '#86d6a4'],
    ['江屿', state.aff.jiangyu, 100, '#ff9a8b'],
    ['霍青', state.aff.huoqing, 100, '#e0a3a3'],
    ['苏晚', state.aff.suwan, 100, '#ffc06f']
  ];
  const box = $('#status-rows');
  box.innerHTML = rows.map(([n, v, mx, c]) => `
    <div class="srow">
      <span class="sn" style="color:${c}">${n}</span>
      <span class="sbar"><i style="width:${clamp(v / mx * 100, 0, 100)}%;background:${c}"></i></span>
      <span class="sv">${Math.round(v)}/${mx}</span>
    </div>`).join('');
  $('#status-stage').textContent = STAGES[state.stage] || '';
  $('#status-persona').textContent = p || '—';
}

/* ---------------- 屏幕切换 ---------------- */
function showScreen(name) {
  const t = $('#screen-title');
  if (t) t.classList.toggle('active', name === 'title');
}

/* ---------------- 18+ 门槛 ---------------- */
function openGate() {
  $('#screen-gate').classList.add('active');
}
function closeGate() {
  $('#screen-gate').classList.remove('active');
  showTitle();
}

/* ---------------- 标题 / 图鉴 ---------------- */
function showTitle() {
  $('#screen-title').classList.add('active');
}

/* ---------------- 新游戏 ---------------- */
function newGame() {
  restart();
  $('#screen-title').classList.remove('active');
}

function openGallery() {
  const g = $('#gallery');
  g.innerHTML = '';
  Object.keys(ENDING_META).forEach((code) => {
    const m = ENDING_META[code];
    const id = 'end_' + code;
    const got = state.unlocked.includes(id);
    const card = document.createElement('div');
    card.className = 'gcard ' + (m.type === 'long' ? 'g-long' : 'g-short') + (got ? '' : ' locked');
    card.innerHTML = got
      ? `<div class="gcode">${m.type === 'long' ? '长结局' : '短结局'} · ${code}</div>
         <div class="gtitle">${m.title}</div>
         <div class="gwho">${m.who}</div>
         <div class="gact">点击重温</div>`
      : `<div class="gcode">${m.type === 'long' ? '长结局' : '短结局'} · ${code}</div>
         <div class="gtitle">？？？</div>
         <div class="gwho">未解锁</div>
         <div class="gact">🔒</div>`;
    if (got) card.addEventListener('click', () => { closeGallery(); renderNode(id); });
    g.appendChild(card);
  });
  $('#screen-gallery').classList.add('active');
}
function closeGallery() { $('#screen-gallery').classList.remove('active'); }

/* ---------------- 存档 ---------------- */
function autosave() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
function saveNow() { autosave(); toast('已存档'); }
function loadNow() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) { toast('没有存档'); return; }
    state = JSON.parse(s);
    renderNode(state.node);
    toast('已读档');
  } catch (e) { toast('读档失败'); }
}

/* ---------------- 提示 ---------------- */
let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
}

/* ---------------- 重新开始 ---------------- */
function restart() {
  state = structuredClone(SAVE_BASE);
  reveal = false;
  bgKey = null;
  renderNode('a0_1');
}

/* ---------------- 暴露给 window ---------------- */
window.__STATE__ = () => state;

/* ---------------- 启动 ---------------- */
export function boot() {
  // 立绘点击：隐藏/复原 文字界面，查看完整立绘与背景
  $('#stage').addEventListener('click', () => toggleReveal());
  $('#btn-reveal').addEventListener('click', (e) => { e.stopPropagation(); toggleReveal(); });
  // 兜底逃生：Esc 键退出看立绘模式
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && reveal) toggleReveal(); });

  $('#btn-status').addEventListener('click', () => $('#status-panel').classList.toggle('open'));
  $('#btn-save').addEventListener('click', saveNow);
  $('#btn-load').addEventListener('click', loadNow);
  $('#btn-gallery').addEventListener('click', openGallery);
  $('#btn-gallery2').addEventListener('click', openGallery);
  $('#btn-title').addEventListener('click', () => { closeGallery(); showTitle(); });
  $('#btn-restart').addEventListener('click', restart);
  $('#gallery-close').addEventListener('click', closeGallery);

  // 设置
  $('#set-r18').addEventListener('change', (e) => {
    state.r18 = e.target.checked;
    autosave();
    toast('R18 内容已' + (state.r18 ? '开启' : '关闭'));
  });
  $('#set-bgm').addEventListener('change', (e) => {
    if (e.target.checked) Music.start(); else Music.stop();
  });
  $('#set-vol').addEventListener('input', (e) => Music.setVol(parseFloat(e.target.value)));
  $('#btn-settings').addEventListener('click', () => $('#settings').classList.toggle('open'));
  $('#settings-close').addEventListener('click', () => $('#settings').classList.remove('open'));

  // 18+ 门槛
  $('#gate-enter').addEventListener('click', () => {
    state.r18 = document.getElementById('gate-r18-cb').checked;
    Music.start(); // 用户手势内启动 BGM
    closeGate();
  });

  // 标题操作
  $('#btn-start-new').addEventListener('click', newGame);
  $('#btn-continue').addEventListener('click', loadNow);
  try {
    if (localStorage.getItem(STORAGE_KEY)) $('#btn-continue').style.display = '';
    else $('#btn-continue').style.display = 'none';
  } catch (e) {}

  openGate();
}

// 供 index.html 直接调用
export function _newGame() { newGame(); }

function toggleReveal() {
  reveal = !reveal;
  document.body.classList.toggle('reveal-mode', reveal);
  applySpriteImages();
  $('#btn-reveal').textContent = reveal ? '👁 复原文字' : '👁 看立绘';
}
