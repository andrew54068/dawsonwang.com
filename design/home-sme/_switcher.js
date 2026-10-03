// Floating style switcher + "pick this one" feedback for the home-page style
// picker. Rendered inside a shadow root so it can't inherit or leak any of the
// design pages' own styles. `?clean=1` hides it (used for screenshots).
(() => {
  const STYLES = [
    { id: 'A', file: 'a-editorial.html', name: '商業雜誌' },
    { id: 'B', file: 'b-firm.html', name: '專業事務所' },
    { id: 'C', file: 'c-letterpress.html', name: '老字號活版' },
    { id: 'D', file: 'd-utility.html', name: '務實清單' },
    { id: 'E', file: 'e-warm.html', name: '溫暖陪跑' },
  ];
  if (new URLSearchParams(location.search).has('clean')) return;

  const file = location.pathname.split('/').pop() || 'index.html';
  const index = STYLES.findIndex((s) => s.file === file);
  const current = STYLES[index];
  const COLLAPSE_KEY = 'sme-switcher-collapsed';
  const readCollapsed = () => { try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; } };
  const writeCollapsed = (v) => { try { localStorage.setItem(COLLAPSE_KEY, v ? '1' : '0'); } catch {} };

  const host = document.createElement('div');
  host.setAttribute('data-style-switcher', '');
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .wrap {
        position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%);
        z-index: 2147483000; max-width: calc(100vw - 16px);
        font: 500 14px/1.2 -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", sans-serif;
        color: #fff; -webkit-font-smoothing: antialiased;
      }
      .bar {
        display: flex; align-items: center; gap: 2px; padding: 6px;
        background: rgba(17, 17, 17, .92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border-radius: 999px; white-space: nowrap; overflow-x: auto; scrollbar-width: none;
        box-shadow: 0 10px 30px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.08);
      }
      .bar::-webkit-scrollbar { display: none; }
      a, button { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
        min-height: 40px; padding: 0 13px; border-radius: 999px; color: rgba(255,255,255,.74); }
      a:hover, button:hover { background: rgba(255,255,255,.1); color: #fff; }
      a[aria-current="page"] { background: #fff; color: #111; }
      .letter { font-weight: 800; }
      .sep { flex: none; width: 1px; height: 22px; background: rgba(255,255,255,.18); margin: 0 4px; }
      .pick { background: #f5c542; color: #111; font-weight: 700; }
      .pick:hover { background: #ffd666; color: #111; }
      .x { padding: 0 11px; font-size: 16px; }
      .mini { all: unset; cursor: pointer; position: fixed; right: 16px; bottom: 16px; z-index: 2147483000;
        padding: 12px 16px; border-radius: 999px; background: rgba(17,17,17,.92); color: #fff;
        font: 600 14px/1 -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif;
        box-shadow: 0 10px 30px rgba(0,0,0,.28); }
      .pop { position: absolute; right: 0; bottom: calc(100% + 10px); width: min(360px, calc(100vw - 24px));
        padding: 18px; border-radius: 18px; background: #151515; color: #fff;
        box-shadow: 0 18px 50px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.08); }
      .pop h2 { margin: 0 0 4px; font-size: 17px; font-weight: 700; }
      .pop p { margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,.7); }
      textarea { all: unset; display: block; width: 100%; min-height: 96px; padding: 12px; border-radius: 12px;
        background: #262626; color: #fff; font-size: 15px; line-height: 1.6; white-space: pre-wrap; }
      textarea::placeholder { color: rgba(255,255,255,.45); }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; }
      .send { background: #f5c542; color: #111; font-weight: 700; min-height: 44px; padding: 0 18px; }
      .send:hover { background: #ffd666; color: #111; }
      .status { font-size: 14px; line-height: 1.5; color: rgba(255,255,255,.8); }
      [hidden] { display: none !important; }
      :focus-visible { outline: 2px solid #f5c542; outline-offset: 2px; }
      @media (max-width: 680px) {
        .wrap { bottom: 10px; }
        .name { display: none; }
        a, button { padding: 0 11px; }
      }
    </style>
    <div class="wrap" part="wrap">
      <div class="pop" role="dialog" aria-label="選這個風格" hidden>
        <h2></h2>
        <p>想保留或想改的地方（選填）——送出後 Claude 會收到。</p>
        <textarea maxlength="2000" placeholder="例如：喜歡配色和首屏，但字可以再大一點"></textarea>
        <div class="row">
          <span class="status" aria-live="polite"></span>
          <button type="button" class="send">送出 →</button>
        </div>
      </div>
      <nav class="bar" aria-label="切換首頁風格">
        <a href="index.html" ${file === 'index.html' ? 'aria-current="page"' : ''}>全部</a>
        <span class="sep" aria-hidden="true"></span>
        ${STYLES.map((s) => `<a href="${s.file}" ${s === current ? 'aria-current="page"' : ''} title="${s.id} · ${s.name}"><span class="letter">${s.id}</span><span class="name">${s.name}</span></a>`).join('')}
        ${current ? '<span class="sep" aria-hidden="true"></span><button type="button" class="pick">★ 選這個</button>' : ''}
        <button type="button" class="x" aria-label="收起切換列">×</button>
      </nav>
    </div>
    <button type="button" class="mini" hidden>風格 A–E</button>
  `;
  document.body.appendChild(host);

  const wrap = root.querySelector('.wrap');
  const mini = root.querySelector('.mini');
  const pop = root.querySelector('.pop');
  const note = root.querySelector('textarea');
  const status = root.querySelector('.status');
  const send = root.querySelector('.send');

  const setCollapsed = (v) => { wrap.hidden = v; mini.hidden = !v; writeCollapsed(v); };
  setCollapsed(readCollapsed());
  root.querySelector('.x').addEventListener('click', () => setCollapsed(true));
  mini.addEventListener('click', () => setCollapsed(false));

  const pick = root.querySelector('.pick');
  if (pick) {
    root.querySelector('.pop h2').textContent = `選這個：${current.id} · ${current.name}`;
    pick.addEventListener('click', () => {
      pop.hidden = !pop.hidden;
      if (!pop.hidden) note.focus();
    });
    send.addEventListener('click', async () => {
      send.disabled = true;
      status.textContent = '送出中⋯';
      try {
        const res = await fetch('api/pick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ style: `${current.id} ${current.name}`, note: note.value.trim() }),
        });
        if (!res.ok) throw new Error(String(res.status));
        status.textContent = '已送出 ✓';
        note.value = '';
        setTimeout(() => { pop.hidden = true; status.textContent = ''; }, 1800);
      } catch {
        status.textContent = '送出失敗，直接在 Claude 回覆也可以。';
      } finally {
        send.disabled = false;
      }
    });
  }

  // ←/→ flips between styles, but never while typing or dragging a slider.
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const path = e.composedPath();
    if (path.some((el) => el instanceof Element && el.matches('input, textarea, select, [contenteditable=""], [contenteditable="true"]'))) return;
    const from = index === -1 ? (e.key === 'ArrowRight' ? -1 : 0) : index;
    const next = STYLES[(from + (e.key === 'ArrowRight' ? 1 : -1) + STYLES.length) % STYLES.length];
    location.href = next.file;
  });
})();
