// src/screens/Login.jsx
// Login screen ported from the dc-runtime prototype (legacy/index.html) into a
// real React component. No dc-runtime, no eval. The embedded 3D voxel world was
// dropped — in this app the game is a separate screen (Task 5). On a successful
// (mock) login we reveal the character-select overlay; picking a character calls
// props.onChoose(characterKey).
import React from 'react';
import { s } from '../lib/style.js';
import { MODALS, CHARACTERS } from '../data/content.js';

class LoginInner extends React.Component {
  state = {
    email: '', password: '', showPass: false, remember: true,
    focus: null, loading: false, error: '', btnHover: false,
    reunited: false, activeModal: null,
    phase: 'login', // 'login' -> 'select'
  };

  // ----- Bible-object modals -----
  openCross = () => this.setState({ activeModal: 'cross' });
  openDove = () => this.setState({ activeModal: 'dove' });
  openJesus = () => this.setState({ activeModal: 'jesus' });
  openSheep = () => this.setState({ activeModal: 'sheep' });
  closeModal = () => this.setState({ activeModal: null });
  stopProp = (e) => e.stopPropagation();

  // ----- scene refs -----
  rootRef = React.createRef();
  flockRef = React.createRef();
  playerRef = React.createRef();
  playerSpriteRef = React.createRef();

  // ----- minigame state -----
  keys = { left: false, right: false, up: false, down: false };
  player = { x: 0, y: 0, vy: 0, dir: 1, grounded: true, joined: false };
  flockX = 0;

  // ----- decorative arrays -----
  sheep = [{ delay: '0s' }, { delay: '0.18s' }, { delay: '0.34s' }];

  fireflies = Array.from({ length: 16 }).map(() => ({
    top: (20 + Math.random() * 70).toFixed(0) + '%',
    left: (4 + Math.random() * 52).toFixed(0) + '%',
    size: (4 + Math.random() * 5).toFixed(0) + 'px',
    dur: (5 + Math.random() * 5).toFixed(1) + 's',
    delay: (Math.random() * 5).toFixed(1) + 's',
  }));

  componentDidMount() {
    this._onMove = (ev) => {
      const el = this.rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = (ev.clientX - (r.left + r.width / 2)) / r.width;
      const ny = (ev.clientY - (r.top + r.height / 2)) / r.height;
      el.style.setProperty('--mx', (nx * 44).toFixed(1) + 'px');
      el.style.setProperty('--my', (ny * 30).toFixed(1) + 'px');
    };
    window.addEventListener('mousemove', this._onMove, { passive: true });

    this._kd = (e) => this._onKey(e, true);
    this._ku = (e) => this._onKey(e, false);
    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);

    const root = this.rootRef.current;
    const W = root ? root.clientWidth : 1200;
    this.player.x = W * 0.46;
    this.flockX = W * 0.66;
    this._raf = requestAnimationFrame(this.tick);
  }
  componentWillUnmount() {
    if (this._onMove) window.removeEventListener('mousemove', this._onMove);
    if (this._kd) window.removeEventListener('keydown', this._kd);
    if (this._ku) window.removeEventListener('keyup', this._ku);
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _onKey = (e, down) => {
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
    const c = e.code;
    if (c === 'ArrowLeft' || c === 'KeyA') { this.keys.left = down; e.preventDefault(); }
    else if (c === 'ArrowRight' || c === 'KeyD') { this.keys.right = down; e.preventDefault(); }
    else if (c === 'ArrowUp' || c === 'KeyW') { this.keys.up = down; if (down && this.state.phase === 'login') this.hop(); e.preventDefault(); }
    else if (c === 'ArrowDown' || c === 'KeyS') { this.keys.down = down; e.preventDefault(); }
    else if (c === 'Space') { if (down && this.state.phase === 'login') this.hop(); e.preventDefault(); }
  };

  hop = () => { const p = this.player; if (p.grounded) { p.grounded = false; p.vy = 12.5; } };

  pressLeft = () => { this.keys.left = true; };
  releaseLeft = () => { this.keys.left = false; };
  pressRight = () => { this.keys.right = true; };
  releaseRight = () => { this.keys.right = false; };

  tick = (now) => {
    if (!this._last) this._last = now;
    const dt = Math.min(34, now - this._last); this._last = now;
    const k = dt / 16.67;
    this._t = (this._t || 0) + dt;
    if (this.state.phase !== 'login') { this._raf = requestAnimationFrame(this.tick); return; }
    const root = this.rootRef.current;
    const W = root ? root.clientWidth : 1200;
    const sway = Math.min(72, W * 0.05);
    this.flockX = W * 0.66 + Math.sin(this._t * 0.0004) * sway;
    const p = this.player;
    if (!p.x) p.x = W * 0.46;
    const minX = W * 0.40, maxX = W - 72;
    if (!p.joined) {
      let vx = 0; const sp = 3.6 * k;
      if (this.keys.left) vx -= sp;
      if (this.keys.right) vx += sp;
      p.x += vx;
      if (vx > 0.1) p.dir = 1; else if (vx < -0.1) p.dir = -1;
      p.x = Math.max(minX, Math.min(maxX, p.x));
      if (!p.grounded) { p.y += p.vy * k; p.vy -= 0.85 * k; if (p.y <= 0) { p.y = 0; p.vy = 0; p.grounded = true; } }
      if (Math.abs(p.x - this.flockX) < 80) { p.joined = true; p.dir = 1; this.setState({ reunited: true }); }
    } else {
      const target = this.flockX - 58;
      p.x += (target - p.x) * 0.06 * k;
      p.dir = 1;
      if (!p.grounded) { p.y += p.vy * k; p.vy -= 0.85 * k; if (p.y <= 0) { p.y = 0; p.vy = 0; p.grounded = true; } }
    }
    if (this.flockRef.current) this.flockRef.current.style.transform = `translateX(${this.flockX.toFixed(1)}px)`;
    if (this.playerRef.current) this.playerRef.current.style.transform = `translateX(${p.x.toFixed(1)}px) translateY(${(-p.y).toFixed(1)}px)`;
    if (this.playerSpriteRef.current) this.playerSpriteRef.current.style.transform = `scaleX(${p.dir > 0 ? -1 : 1})`;
    this._raf = requestAnimationFrame(this.tick);
  };

  emailIsValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.state.email.trim());
  }

  onSubmit = () => {
    if (this.state.loading) return;
    if (!this.emailIsValid()) { this.setState({ error: 'Escribe un correo válido 📧' }); return; }
    if (this.state.password.length < 4) { this.setState({ error: 'Tu clave necesita al menos 4 letras 🔑' }); return; }
    this.setState({ error: '', loading: true });
    setTimeout(() => this.setState({ loading: false, phase: 'select' }), 1200);
  };

  onGoogle = () => {
    this.setState({ error: '', loading: true });
    setTimeout(() => this.setState({ loading: false, phase: 'select' }), 1100);
  };

  // Picking a character hands the chosen key back to App, which switches screens.
  chooseChar = (key) => () => this.props.onChoose(key);

  // ----- form field handlers -----
  onEmail = (e) => this.setState({ email: e.target.value, error: '' });
  onPassword = (e) => this.setState({ password: e.target.value, error: '' });
  onFocusEmail = () => this.setState({ focus: 'email' });
  onFocusPass = () => this.setState({ focus: 'pass' });
  onBlur = () => this.setState({ focus: null });
  toggleShow = () => this.setState((p) => ({ showPass: !p.showPass }));
  toggleRemember = () => this.setState((p) => ({ remember: !p.remember }));
  btnEnter = () => this.setState({ btnHover: true });
  btnLeave = () => this.setState({ btnHover: false });
  gEnter = (e) => { e.currentTarget.style.background = '#f6f8f4'; e.currentTarget.style.borderColor = '#c9cec3'; };
  gLeave = (e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e3e6df'; };

  render() {
    const st = this.state;
    const accent = '#1f5d39';
    const emailValid = this.emailIsValid();
    const notReunited = !st.reunited;
    const m = st.activeModal ? MODALS[st.activeModal] : null;
    const modalHeaderBg = m ? `linear-gradient(150deg, ${m.c1}, ${m.c2})` : 'none';
    const modalColor = m ? m.c2 : '#1f5d39';

    const inputBase = (focused, ok) =>
      `width:100%;padding:16px 44px 16px 46px;border-radius:16px;font-family:'Nunito',sans-serif;font-size:15.5px;font-weight:600;color:#2a3327;outline:none;transition:all 0.2s;background:${focused ? '#fff' : '#f3f5f0'};border:2px solid ${focused ? accent : ok ? 'rgba(47,125,79,0.4)' : '#e6e9e1'};box-shadow:${focused ? '0 0 0 4px rgba(47,125,79,0.12)' : 'none'};`;

    const submitStyle =
      `width:100%;margin-top:2px;padding:17px;border-radius:18px;border:none;cursor:${st.loading ? 'wait' : 'pointer'};font-family:'Baloo 2',sans-serif;font-weight:700;font-size:17px;color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(145deg, #36925c, ${accent});box-shadow:0 14px 26px -10px rgba(31,93,57,${st.btnHover ? 0.7 : 0.5});transform:translateY(${st.btnHover && !st.loading ? '-2px' : '0'});transition:all 0.18s;`;

    const checkboxStyle =
      `width:22px;height:22px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;transition:all 0.15s;border:2px solid ${st.remember ? accent : '#c8ccc2'};background:${st.remember ? accent : '#fff'};`;

    const submitContent = st.loading
      ? <span style={s('width:22px;height:22px;border:3px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;display:inline-block;animation:ld-spin 0.7s linear infinite;')} />
      : <>Entrar a mi clase<span style={{ fontSize: '19px' }}>→</span></>;

    return (
      <div ref={this.rootRef} style={s("position: relative; width: 100%; min-height: 100vh; overflow: hidden; font-family: 'Nunito', sans-serif; --mx: 0px; --my: 0px; background: linear-gradient(180deg, #bfe6f3 0%, #d6eff0 32%, #e9f6e6 52%, #f7efd9 78%, #f6e3c4 100%);")}>

        {/* SKY GLOW / SUN behind cross */}
        <div className="ld-pl" style={s('position: absolute; inset: 0; transform: translate(calc(var(--mx) * 0.15), calc(var(--my) * 0.15));')}>
          <div style={s('position: absolute; top: 30%; right: 16%; width: 760px; height: 760px; transform: translate(-50%,-50%); background: repeating-conic-gradient(from 0deg, rgba(255,214,130,0.18) 0deg 7deg, transparent 7deg 18deg); border-radius: 50%; -webkit-mask: radial-gradient(circle, #000 26%, transparent 60%); mask: radial-gradient(circle, #000 26%, transparent 60%); animation: ld-rays 70s linear infinite;')}></div>
          <div style={s('position: absolute; top: 30%; right: 16%; width: 520px; height: 520px; transform: translate(-50%,-50%); border-radius: 50%; background: radial-gradient(circle, rgba(255,238,190,0.9) 0%, rgba(255,205,120,0.55) 32%, rgba(255,170,90,0.18) 58%, transparent 72%); animation: ld-glow 6s ease-in-out infinite;')}></div>
        </div>

        {/* CLOUDS (infinite drift to the right) */}
        <div className="ld-pl" style={s('position: absolute; inset: 0; overflow: hidden; transform: translate(calc(var(--mx) * 0.55), calc(var(--my) * 0.4));')}>
          <div style={s('position: absolute; top: 12%; left: 0; animation: ld-cloudloop 42s linear infinite; animation-delay: -6s;')}>
            <div style={s('width: 180px; height: 56px; background: rgba(255,255,255,0.92); border-radius: 40px; box-shadow: 60px 6px 0 -6px rgba(255,255,255,0.92), -46px 10px 0 -10px rgba(255,255,255,0.92); filter: blur(0.3px);')}></div>
          </div>
          <div style={s('position: absolute; top: 25%; left: 0; animation: ld-cloudloop 34s linear infinite; animation-delay: -20s;')}>
            <div style={s('width: 130px; height: 42px; background: rgba(255,255,255,0.82); border-radius: 30px; box-shadow: 44px 6px 0 -6px rgba(255,255,255,0.82);')}></div>
          </div>
          <div style={s('position: absolute; top: 7%; left: 0; animation: ld-cloudloop 52s linear infinite; animation-delay: -34s;')}>
            <div style={s('width: 150px; height: 46px; background: rgba(255,255,255,0.78); border-radius: 34px; box-shadow: 50px 8px 0 -8px rgba(255,255,255,0.78);')}></div>
          </div>
          <div style={s('position: absolute; top: 31%; left: 0; animation: ld-cloudloop 38s linear infinite; animation-delay: -12s;')}>
            <div style={s('width: 110px; height: 36px; background: rgba(255,255,255,0.7); border-radius: 26px; box-shadow: 38px 5px 0 -5px rgba(255,255,255,0.7);')}></div>
          </div>
        </div>

        {/* DOVE flying naturally side to side — clickable */}
        <div onClick={this.openDove} style={s('position: absolute; left: 3%; top: 22%; z-index: 4; pointer-events: auto; cursor: pointer; animation: ld-dovefly 22s ease-in-out infinite;')}>
          <div style={s('animation: ld-doveturn 22s linear infinite;')}>
            <div style={s('position: relative; width: 46px; height: 30px;')}>
              <div style={s('position: absolute; bottom: 6px; left: -5px; width: 15px; height: 11px; background: #eef3f6; clip-path: polygon(0 50%, 100% 0, 100% 100%); border-radius: 2px;')}></div>
              <div style={s('position: absolute; bottom: 6px; left: 5px; width: 30px; height: 16px; border-radius: 50% 60% 55% 50%; background: #fff; box-shadow: 0 3px 6px rgba(120,140,160,0.25);')}></div>
              <div style={s('position: absolute; top: 2px; right: 5px; width: 13px; height: 13px; border-radius: 50%; background: #fff;')}></div>
              <div style={s('position: absolute; top: 6px; right: -2px; width: 7px; height: 5px; background: #f0a32e; clip-path: polygon(0 0, 100% 50%, 0 100%);')}></div>
              <div style={s('position: absolute; top: 5px; right: 9px; width: 2.5px; height: 2.5px; border-radius: 50%; background: #3a3a3a;')}></div>
              <div style={s('position: absolute; bottom: 13px; left: 13px; width: 24px; height: 14px; border-radius: 50% 50% 40% 60%; background: #f4f8fb; transform-origin: 30% 95%; animation: ld-doveflap 0.5s ease-in-out infinite;')}></div>
              <div style={s('position: absolute; top: 9px; right: -13px; width: 11px; height: 4px; border-radius: 4px; background: #6bbf59;')}></div>
              <div style={s('position: absolute; top: 6px; right: -11px; width: 5px; height: 5px; border-radius: 50%; background: #6bbf59;')}></div>
            </div>
          </div>
        </div>

        {/* MOUNTAINS (far horizon) */}
        <div className="ld-pl" style={s('position: absolute; left: -8%; right: -8%; bottom: 28%; height: 30%; transform: translate(calc(var(--mx) * 0.12), calc(var(--my) * 0.1));')}>
          <svg viewBox="0 0 1200 220" preserveAspectRatio="none" style={s('position: absolute; bottom: 0; width: 116%; left: -8%; height: 100%;')}>
            <polygon points="-60,220 200,66 460,220" fill="#aebfd6"/>
            <polygon points="640,220 880,82 1120,220" fill="#aebfd6"/>
            <polygon points="300,220 560,38 820,220" fill="#9cb0cd"/>
            <polygon points="940,220 1160,58 1260,150 1260,220" fill="#9cb0cd"/>
            <polygon points="560,38 524,92 598,92" fill="#eff4f9"/>
            <polygon points="200,66 172,108 230,108" fill="#eff4f9"/>
            <polygon points="1160,58 1132,100 1190,100" fill="#eff4f9"/>
          </svg>
        </div>

        {/* FAR HILLS */}
        <div className="ld-pl" style={s('position: absolute; left: -8%; right: -8%; bottom: 0; height: 70%; transform: translate(calc(var(--mx) * 0.22), calc(var(--my) * 0.18));')}>
          <svg viewBox="0 0 1200 400" preserveAspectRatio="none" style={s('position: absolute; bottom: 0; width: 116%; left: -8%; height: 100%;')}>
            <path d="M0,260 C180,200 320,230 520,210 C760,186 920,250 1200,200 L1200,400 L0,400 Z" fill="#bfe0a8"/>
          </svg>
        </div>

        {/* MID HILLS */}
        <div className="ld-pl" style={s('position: absolute; left: -8%; right: -8%; bottom: 0; height: 56%; transform: translate(calc(var(--mx) * 0.45), calc(var(--my) * 0.32));')}>
          <svg viewBox="0 0 1200 340" preserveAspectRatio="none" style={s('position: absolute; bottom: 0; width: 116%; left: -8%; height: 100%;')}>
            <path d="M0,200 C220,140 360,210 600,180 C840,150 980,220 1200,160 L1200,340 L0,340 Z" fill="#82c178"/>
          </svg>
        </div>

        {/* TREES on the hills */}
        <div className="ld-pl" style={s('position: absolute; inset: 0; pointer-events: none; z-index: 2; transform: translate(calc(var(--mx) * 0.45), calc(var(--my) * 0.32));')}>
          {/* far small tree */}
          <div style={s('position: absolute; bottom: 41%; left: 70%; transform: scale(0.5); opacity: 0.92;')}>
            <div style={s('position: absolute; bottom: 0; left: 50%; margin-left: -8px; width: 16px; height: 60px; border-radius: 8px; background: linear-gradient(90deg,#7a4a28,#5e3920);')}></div>
            <div style={s('position: absolute; bottom: 46px; left: 50%; margin-left: -50px; width: 100px; height: 92px; transform-origin: bottom center; animation: ld-treesway 7s ease-in-out infinite;')}>
              <div style={s('position: absolute; bottom: 0; left: 6px; width: 56px; height: 56px; border-radius: 50%; background: #5aa860;')}></div>
              <div style={s('position: absolute; bottom: 18px; left: 34px; width: 60px; height: 60px; border-radius: 50%; background: #4f9c56;')}></div>
              <div style={s('position: absolute; bottom: 36px; left: 24px; width: 50px; height: 50px; border-radius: 50%; background: #67b86d;')}></div>
            </div>
          </div>
          {/* mid tree (left of the flock) */}
          <div style={s('position: absolute; bottom: 25%; left: 52%; transform: scale(0.82);')}>
            <div style={s('position: absolute; bottom: 0; left: 50%; margin-left: -9px; width: 18px; height: 72px; border-radius: 9px; background: linear-gradient(90deg,#7a4a28,#5e3920);')}></div>
            <div style={s('position: absolute; bottom: 56px; left: 50%; margin-left: -54px; width: 108px; height: 100px; transform-origin: bottom center; animation: ld-treesway 6s ease-in-out infinite;')}>
              <div style={s('position: absolute; bottom: 0; left: 8px; width: 60px; height: 60px; border-radius: 50%; background: #57a85d;')}></div>
              <div style={s('position: absolute; bottom: 20px; left: 38px; width: 66px; height: 66px; border-radius: 50%; background: #4d9a54;')}></div>
              <div style={s('position: absolute; bottom: 40px; left: 26px; width: 54px; height: 54px; border-radius: 50%; background: #67b86d;')}></div>
            </div>
          </div>
          {/* big tree (right edge) */}
          <div style={s('position: absolute; bottom: 22%; left: 90%; transform: scale(1.05);')}>
            <div style={s('position: absolute; bottom: 0; left: 50%; margin-left: -11px; width: 22px; height: 84px; border-radius: 10px; background: linear-gradient(90deg,#7a4a28,#5e3920);')}></div>
            <div style={s('position: absolute; bottom: 64px; left: 50%; margin-left: -62px; width: 124px; height: 114px; transform-origin: bottom center; animation: ld-treesway 6.6s ease-in-out infinite 0.5s;')}>
              <div style={s('position: absolute; bottom: 0; left: 10px; width: 68px; height: 68px; border-radius: 50%; background: #57a85d;')}></div>
              <div style={s('position: absolute; bottom: 22px; left: 44px; width: 72px; height: 72px; border-radius: 50%; background: #4d9a54;')}></div>
              <div style={s('position: absolute; bottom: 46px; left: 30px; width: 60px; height: 60px; border-radius: 50%; background: #67b86d;')}></div>
            </div>
          </div>
        </div>

        {/* ===== PLAYER: la oveja perdida que controlas para llegar con Jesús ===== */}
        <div style={s('position: absolute; left: 0; right: 0; bottom: 7%; pointer-events: none; z-index: 6;')}>
          <div ref={this.playerRef} style={s('position: absolute; bottom: 0; left: 0; will-change: transform;')}>
            {notReunited && (
              <div style={s('position: absolute; bottom: 64px; left: -52px; width: 176px; pointer-events: none; animation: ld-float 4s ease-in-out infinite;')}>
                <div style={s("background: #fff; border: 2px solid #e6ebe4; border-radius: 18px; padding: 9px 13px; text-align: center; font: 700 12.5px 'Nunito', sans-serif; color: #4a5546; line-height: 1.25; box-shadow: 0 8px 18px -8px rgba(60,80,60,0.3);")}>¡Estoy perdida!<br/>Quiero ir con Jesús 🙏</div>
                <div style={s('position: absolute; bottom: -8px; left: 80px; width: 12px; height: 12px; background: #fff; border-right: 2px solid #e6ebe4; border-bottom: 2px solid #e6ebe4; border-radius: 0 0 6px 0; transform: rotate(8deg);')}></div>
                <div style={s('position: absolute; bottom: -17px; left: 90px; width: 7px; height: 7px; border-radius: 50%; background: #fff; border: 2px solid #e6ebe4;')}></div>
              </div>
            )}
            <div ref={this.playerSpriteRef} style={s('transform-origin: bottom center; transition: transform 0.12s;')}>
              {/* LOST state */}
              {notReunited && (
                <div onClick={this.openSheep} style={s('position: relative; width: 78px; height: 64px; transform: scale(0.9); transform-origin: bottom center; cursor: pointer; pointer-events: auto;')}>
                  <div style={s("position: absolute; top: -16px; left: 4px; font: 800 18px 'Baloo 2', sans-serif; color: #9aa6a0; animation: ld-question 2.4s ease-in-out infinite;")}>?</div>
                  <div style={s('position: absolute; inset: 0; transform-origin: 60% 100%; animation: ld-hobble 1.7s ease-in-out infinite;')}>
                    <div style={s('position: absolute; bottom: 6px; left: 20px; width: 7px; height: 16px; border-radius: 4px; background: #4a4a52; transform-origin: top center; animation: ld-limpleg 1.7s ease-in-out infinite;')}></div>
                    <div style={s('position: absolute; bottom: 0; left: 30px; width: 7px; height: 20px; border-radius: 4px; background: #3d3d44; transform-origin: top center; animation: ld-walkB 0.85s ease-in-out infinite;')}></div>
                    <div style={s('position: absolute; bottom: 0; left: 44px; width: 7px; height: 20px; border-radius: 4px; background: #4a4a52; transform-origin: top center; animation: ld-walkA 0.85s ease-in-out infinite;')}></div>
                    <div style={s('position: absolute; bottom: 0; left: 54px; width: 7px; height: 20px; border-radius: 4px; background: #3d3d44; transform-origin: top center; animation: ld-walkB 0.85s ease-in-out infinite;')}></div>
                    <div style={s('position: absolute; bottom: 14px; left: 12px; width: 58px; height: 40px; border-radius: 50%; background: #f4f4f0; box-shadow: 0 4px 8px rgba(60,80,60,0.18);')}></div>
                    <div style={s('position: absolute; bottom: 30px; left: 16px; width: 22px; height: 22px; border-radius: 50%; background: #f8f8f4;')}></div>
                    <div style={s('position: absolute; bottom: 32px; left: 30px; width: 24px; height: 24px; border-radius: 50%; background: #f8f8f4;')}></div>
                    <div style={s('position: absolute; bottom: 30px; left: 46px; width: 20px; height: 20px; border-radius: 50%; background: #f8f8f4;')}></div>
                    <div style={s('position: absolute; bottom: 12px; left: 2px; width: 26px; height: 28px; border-radius: 52% 52% 50% 50%; background: #45454d;')}></div>
                    <div style={s('position: absolute; bottom: 32px; left: 0px; width: 14px; height: 9px; border-radius: 50%; background: #38383f; transform: rotate(-24deg);')}></div>
                    <div style={s('position: absolute; bottom: 32px; left: 16px; width: 14px; height: 9px; border-radius: 50%; background: #38383f; transform: rotate(24deg);')}></div>
                    <div style={s('position: absolute; bottom: 21px; left: 9px; width: 5px; height: 5px; border-radius: 50%; background: #fff;')}></div>
                    <div style={s('position: absolute; bottom: 30px; left: 66px; width: 12px; height: 12px; border-radius: 50%; background: #f8f8f4;')}></div>
                  </div>
                </div>
              )}
              {/* REUNITED (healed + happy) */}
              {st.reunited && (
                <div onClick={this.openSheep} style={s('position: relative; width: 78px; height: 64px; transform: scale(0.92); transform-origin: bottom center; cursor: pointer; pointer-events: auto;')}>
                  <div style={s('position: absolute; top: -18px; left: 5px; font-size: 17px; animation: ld-question 1.6s ease-in-out infinite;')}>❤️</div>
                  <div style={s('position: absolute; inset: 0; transform-origin: 60% 100%; animation: ld-bob2 0.7s ease-in-out infinite;')}>
                    <div style={s('position: absolute; bottom: 0; left: 20px; width: 7px; height: 20px; border-radius: 4px; background: #4a4a52; transform-origin: top center; animation: ld-walkA 0.5s ease-in-out infinite;')}></div>
                    <div style={s('position: absolute; bottom: 0; left: 30px; width: 7px; height: 20px; border-radius: 4px; background: #3d3d44; transform-origin: top center; animation: ld-walkB 0.5s ease-in-out infinite;')}></div>
                    <div style={s('position: absolute; bottom: 0; left: 44px; width: 7px; height: 20px; border-radius: 4px; background: #4a4a52; transform-origin: top center; animation: ld-walkB 0.5s ease-in-out infinite;')}></div>
                    <div style={s('position: absolute; bottom: 0; left: 54px; width: 7px; height: 20px; border-radius: 4px; background: #3d3d44; transform-origin: top center; animation: ld-walkA 0.5s ease-in-out infinite;')}></div>
                    <div style={s('position: absolute; bottom: 14px; left: 12px; width: 58px; height: 40px; border-radius: 50%; background: #fdfdfb; box-shadow: 0 4px 8px rgba(60,80,60,0.18);')}></div>
                    <div style={s('position: absolute; bottom: 30px; left: 16px; width: 22px; height: 22px; border-radius: 50%; background: #fff;')}></div>
                    <div style={s('position: absolute; bottom: 32px; left: 30px; width: 24px; height: 24px; border-radius: 50%; background: #fff;')}></div>
                    <div style={s('position: absolute; bottom: 30px; left: 46px; width: 20px; height: 20px; border-radius: 50%; background: #fff;')}></div>
                    <div style={s('position: absolute; bottom: 18px; left: 2px; width: 26px; height: 28px; border-radius: 52% 52% 50% 50%; background: #45454d;')}></div>
                    <div style={s('position: absolute; bottom: 38px; left: 0px; width: 14px; height: 9px; border-radius: 50%; background: #38383f; transform: rotate(-24deg);')}></div>
                    <div style={s('position: absolute; bottom: 38px; left: 16px; width: 14px; height: 9px; border-radius: 50%; background: #38383f; transform: rotate(24deg);')}></div>
                    <div style={s('position: absolute; bottom: 28px; left: 8px; width: 5px; height: 5px; border-radius: 50%; background: #fff;')}></div>
                    <div style={s('position: absolute; bottom: 30px; left: 66px; width: 12px; height: 12px; border-radius: 50%; background: #fff;')}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== CSS-DRAWN CROSS ON THE HILL ===== */}
        <div className="ld-pl" style={s('position: absolute; top: 0; right: 0; bottom: 0; width: 56%; min-width: 540px; pointer-events: none; transform: translate(calc(var(--mx) * 0.3), calc(var(--my) * 0.26)); z-index: 3;')}>
          {/* soft holy glow behind the cross */}
          <div style={s('position: absolute; bottom: 30%; right: 18%; width: 360px; height: 360px; transform: translate(-50%,-50%); border-radius: 50%; background: radial-gradient(circle, rgba(255,236,170,0.85) 0%, rgba(255,206,120,0.4) 40%, transparent 70%); animation: ld-crossglow 5s ease-in-out infinite;')}></div>
          {/* the cross (wooden, made of rounded rectangles) — clickable */}
          <div onClick={this.openCross} style={s('position: absolute; bottom: 22%; right: 22%; transform-origin: bottom center; animation: ld-sway 7s ease-in-out infinite; cursor: pointer; pointer-events: auto;')}>
            {/* vertical beam */}
            <div style={s('position: absolute; left: -19px; bottom: 0; width: 38px; height: 260px; border-radius: 10px; background: linear-gradient(95deg, #6b4527 0%, #8a5a33 45%, #5d3a20 100%); box-shadow: 0 14px 22px -8px rgba(70,40,15,0.45), inset -4px 0 6px rgba(0,0,0,0.18), inset 4px 0 5px rgba(255,220,170,0.25);')}></div>
            {/* horizontal beam */}
            <div style={s('position: absolute; left: -78px; bottom: 178px; width: 156px; height: 36px; border-radius: 10px; background: linear-gradient(180deg, #8a5a33 0%, #6b4527 55%, #553620 100%); box-shadow: 0 8px 14px -6px rgba(70,40,15,0.4), inset 0 -4px 6px rgba(0,0,0,0.18), inset 0 4px 5px rgba(255,220,170,0.25);')}></div>
            {/* tap hint */}
            <div style={s("position: absolute; left: 28px; bottom: 150px; width: 26px; height: 26px; border-radius: 50%; background: #fff; color: #1f5d39; display: flex; align-items: center; justify-content: center; font: 800 15px 'Nunito', sans-serif; animation: ld-tap 2s ease-in-out infinite;")}>i</div>
          </div>
        </div>

        {/* ===== JESUS + FLOCK (driven by the mini-game loop) ===== */}
        <div style={s('position: absolute; left: 0; right: 0; bottom: 7%; pointer-events: none; z-index: 5;')}>
          <div ref={this.flockRef} style={s('position: absolute; bottom: 0; left: 0; display: flex; align-items: flex-end; gap: 26px; width: max-content; will-change: transform;')}>

            {/* JESUS — clickable */}
            <div onClick={this.openJesus} style={s('position: relative; width: 92px; height: 150px; animation: ld-bob2 1.1s ease-in-out infinite; cursor: pointer; pointer-events: auto;')}>
              <div style={s("position: absolute; top: 0; right: -6px; width: 22px; height: 22px; border-radius: 50%; background: #fff; color: #c0832f; display: flex; align-items: center; justify-content: center; font: 800 13px 'Nunito', sans-serif; animation: ld-tap 2.2s ease-in-out infinite; z-index: 6;")}>i</div>
              {/* shepherd staff */}
              <div style={s('position: absolute; left: 74px; bottom: 0; transform-origin: bottom center; animation: ld-staff 2.2s ease-in-out infinite;')}>
                <div style={s('width: 7px; height: 138px; border-radius: 6px; background: linear-gradient(90deg,#8a5a33,#6b4527);')}></div>
                <div style={s('position: absolute; top: -4px; left: -11px; width: 22px; height: 22px; border: 7px solid #8a5a33; border-bottom-color: transparent; border-left-color: transparent; border-radius: 50%; transform: rotate(-45deg);')}></div>
              </div>
              {/* halo */}
              <div style={s('position: absolute; top: 2px; left: 50%; transform: translateX(-50%); width: 52px; height: 18px; border: 4px solid #ffd766; border-radius: 50%; animation: ld-halo 3s ease-in-out infinite;')}></div>
              {/* hair (back) */}
              <div style={s('position: absolute; top: 15px; left: 50%; transform: translateX(-50%); width: 46px; height: 46px; border-radius: 50% 50% 44% 44%; background: #6b4628;')}></div>
              {/* side locks */}
              <div style={s('position: absolute; top: 28px; left: 23px; width: 10px; height: 30px; border-radius: 8px; background: #6b4628;')}></div>
              <div style={s('position: absolute; top: 28px; right: 23px; width: 10px; height: 30px; border-radius: 8px; background: #6b4628;')}></div>
              {/* face */}
              <div style={s('position: absolute; top: 19px; left: 50%; transform: translateX(-50%); width: 38px; height: 41px; border-radius: 48% 48% 46% 46%; background: #efcaa2; box-shadow: inset 0 -3px 5px rgba(190,140,100,0.25);')}></div>
              {/* hairline / fringe */}
              <div style={s('position: absolute; top: 17px; left: 50%; transform: translateX(-50%); width: 40px; height: 17px; border-radius: 50% 50% 42% 42%; background: #6b4628;')}></div>
              {/* eyebrows */}
              <div style={s('position: absolute; top: 30px; left: 32px; width: 8px; height: 3px; border-radius: 3px; background: #5b3a24;')}></div>
              <div style={s('position: absolute; top: 30px; right: 32px; width: 8px; height: 3px; border-radius: 3px; background: #5b3a24;')}></div>
              {/* eyes */}
              <div style={s('position: absolute; top: 34px; left: 34px; width: 5px; height: 6px; border-radius: 50%; background: #3a2a1c;')}></div>
              <div style={s('position: absolute; top: 34px; right: 34px; width: 5px; height: 6px; border-radius: 50%; background: #3a2a1c;')}></div>
              {/* cheeks */}
              <div style={s('position: absolute; top: 40px; left: 28px; width: 8px; height: 5px; border-radius: 50%; background: rgba(228,130,110,0.45); filter: blur(1px);')}></div>
              <div style={s('position: absolute; top: 40px; right: 28px; width: 8px; height: 5px; border-radius: 50%; background: rgba(228,130,110,0.45); filter: blur(1px);')}></div>
              {/* nose */}
              <div style={s('position: absolute; top: 38px; left: 50%; transform: translateX(-50%); width: 5px; height: 6px; border-radius: 50%; background: rgba(200,150,110,0.55);')}></div>
              {/* beard (frames jaw + chin) */}
              <div style={s('position: absolute; top: 42px; left: 50%; transform: translateX(-50%); width: 40px; height: 30px; border-radius: 26% 26% 50% 50%; background: #6b4628; -webkit-mask: radial-gradient(circle at 50% 0%, transparent 38%, #000 39%); mask: radial-gradient(circle at 50% 0%, transparent 38%, #000 39%);')}></div>
              {/* mustache */}
              <div style={s('position: absolute; top: 41px; left: 50%; transform: translateX(-50%); width: 22px; height: 7px; border-radius: 0 0 10px 10px; background: #6b4628;')}></div>
              {/* smile */}
              <div style={s('position: absolute; top: 44px; left: 50%; transform: translateX(-50%); width: 13px; height: 7px; border-bottom: 2.5px solid #b5654a; border-radius: 0 0 60% 60%;')}></div>
              {/* robe */}
              <div style={s('position: absolute; top: 52px; left: 50%; transform: translateX(-50%); width: 74px; height: 96px; background: linear-gradient(100deg,#e9f0f7,#cdd9e8); border-radius: 30px 30px 14px 14px; clip-path: polygon(34% 0, 66% 0, 100% 100%, 0 100%); box-shadow: inset -6px 0 10px rgba(80,100,130,0.2);')}></div>
              {/* inner tunic / sash */}
              <div style={s('position: absolute; top: 56px; left: 50%; transform: translateX(-50%); width: 18px; height: 88px; background: linear-gradient(#4f7fc4,#3a64a8); clip-path: polygon(36% 0,64% 0,72% 100%,28% 100%);')}></div>
              {/* red sash across */}
              <div style={s('position: absolute; top: 70px; left: 50%; transform: translateX(-50%) rotate(-14deg); width: 70px; height: 11px; background: #c8523f; border-radius: 6px;')}></div>
              {/* feet */}
              <div style={s('position: absolute; bottom: -2px; left: 30px; width: 16px; height: 9px; border-radius: 8px; background: #d8b38c; transform-origin: top center; animation: ld-walkA 0.55s ease-in-out infinite;')}></div>
              <div style={s('position: absolute; bottom: -2px; left: 48px; width: 16px; height: 9px; border-radius: 8px; background: #c79f78; transform-origin: top center; animation: ld-walkB 0.55s ease-in-out infinite;')}></div>
            </div>

            {/* SHEEP x3 */}
            {this.sheep.map((sh, i) => (
              <React.Fragment key={i}>
                <div style={s(`position: relative; width: 78px; height: 64px; animation: ld-bob2 0.95s ease-in-out infinite; animation-delay: ${sh.delay};`)}>
                  {/* legs */}
                  <div style={s(`position: absolute; bottom: 0; left: 20px; width: 7px; height: 20px; border-radius: 4px; background: #4a4a52; transform-origin: top center; animation: ld-walkA 0.5s ease-in-out infinite; animation-delay: ${sh.delay};`)}></div>
                  <div style={s(`position: absolute; bottom: 0; left: 30px; width: 7px; height: 20px; border-radius: 4px; background: #3d3d44; transform-origin: top center; animation: ld-walkB 0.5s ease-in-out infinite; animation-delay: ${sh.delay};`)}></div>
                  <div style={s(`position: absolute; bottom: 0; left: 44px; width: 7px; height: 20px; border-radius: 4px; background: #4a4a52; transform-origin: top center; animation: ld-walkB 0.5s ease-in-out infinite; animation-delay: ${sh.delay};`)}></div>
                  <div style={s(`position: absolute; bottom: 0; left: 54px; width: 7px; height: 20px; border-radius: 4px; background: #3d3d44; transform-origin: top center; animation: ld-walkA 0.5s ease-in-out infinite; animation-delay: ${sh.delay};`)}></div>
                  {/* fluffy body */}
                  <div style={s('position: absolute; bottom: 14px; left: 12px; width: 58px; height: 40px; border-radius: 50%; background: #fdfdfb; box-shadow: 0 4px 8px rgba(60,80,60,0.18);')}></div>
                  <div style={s('position: absolute; bottom: 30px; left: 16px; width: 22px; height: 22px; border-radius: 50%; background: #fff;')}></div>
                  <div style={s('position: absolute; bottom: 32px; left: 30px; width: 24px; height: 24px; border-radius: 50%; background: #fff;')}></div>
                  <div style={s('position: absolute; bottom: 30px; left: 46px; width: 20px; height: 20px; border-radius: 50%; background: #fff;')}></div>
                  {/* head (front = left) */}
                  <div style={s('position: absolute; bottom: 18px; left: 2px; width: 26px; height: 28px; border-radius: 52% 52% 50% 50%; background: #45454d;')}></div>
                  {/* ears */}
                  <div style={s('position: absolute; bottom: 38px; left: 0px; width: 14px; height: 9px; border-radius: 50%; background: #38383f; transform: rotate(-24deg);')}></div>
                  <div style={s('position: absolute; bottom: 38px; left: 16px; width: 14px; height: 9px; border-radius: 50%; background: #38383f; transform: rotate(24deg);')}></div>
                  {/* eye */}
                  <div style={s('position: absolute; bottom: 28px; left: 8px; width: 5px; height: 5px; border-radius: 50%; background: #fff;')}></div>
                  {/* tiny tail */}
                  <div style={s('position: absolute; bottom: 30px; left: 66px; width: 12px; height: 12px; border-radius: 50%; background: #fff;')}></div>
                </div>
              </React.Fragment>
            ))}

          </div>
        </div>

        {/* FOREGROUND HILL + flowers */}
        <div className="ld-pl" style={s('position: absolute; left: -10%; right: -10%; bottom: 0; height: 34%; transform: translate(calc(var(--mx) * 1.05), calc(var(--my) * 0.7)); z-index: 4;')}>
          <svg viewBox="0 0 1200 220" preserveAspectRatio="none" style={s('position: absolute; bottom: 0; width: 120%; left: -10%; height: 100%;')}>
            <path d="M0,120 C260,70 420,140 680,110 C900,86 1040,140 1200,100 L1200,220 L0,220 Z" fill="#4d9a51"/>
          </svg>
          <div style={s('position: absolute; bottom: 8%; left: 8%; font-size: 26px; animation: ld-float 4s ease-in-out infinite;')}>🌼</div>
          <div style={s('position: absolute; bottom: 5%; left: 18%; font-size: 22px; animation: ld-float 5s ease-in-out infinite 0.5s;')}>🌷</div>
          <div style={s('position: absolute; bottom: 11%; left: 30%; font-size: 20px; animation: ld-float 4.4s ease-in-out infinite 0.8s;')}>🌿</div>
          <div style={s('position: absolute; bottom: 6%; right: 30%; font-size: 24px; animation: ld-float 4.8s ease-in-out infinite 0.3s;')}>🌻</div>
        </div>

        {/* FIREFLIES (foreground sparkle) */}
        <div className="ld-pl" style={s('position: absolute; inset: 0; pointer-events: none; transform: translate(calc(var(--mx) * 1.2), calc(var(--my) * 0.9)); z-index: 4;')}>
          {this.fireflies.map((f, i) => (
            <React.Fragment key={i}>
              <div style={s(`position: absolute; top: ${f.top}; left: ${f.left}; width: ${f.size}; height: ${f.size}; border-radius: 50%; background: radial-gradient(circle, #fff7c4, #ffd25a); box-shadow: 0 0 10px 2px rgba(255,214,90,0.8); animation: ld-firefly ${f.dur} ease-in-out infinite; animation-delay: ${f.delay};`)}></div>
            </React.Fragment>
          ))}
        </div>

        {/* ===== LOGIN CARD ===== */}
        <div style={s('position: relative; z-index: 10; min-height: 100vh; display: flex; align-items: center; padding: 40px 5%; pointer-events: none;')}>
          <div style={s('pointer-events: auto; width: 100%; max-width: 430px; background: rgba(255,255,255,0.94); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.85); border-radius: 32px; padding: 38px 40px 34px; box-shadow: 0 34px 80px -22px rgba(40,75,45,0.4), 0 2px 0 rgba(255,255,255,0.6) inset; animation: ld-cardin 0.7s cubic-bezier(0.22,1,0.36,1) both;')}>

            <div style={s('display: flex; align-items: center; gap: 10px; margin-bottom: 22px;')}>
              <div style={s('width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(145deg, #2f7d4f, #1f5d39); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 18px -6px rgba(31,93,57,0.6); animation: ld-bobble 3.5s ease-in-out infinite;')}>
                <span style={s('font-size: 24px;')}>✝️</span>
              </div>
              <div style={s('line-height: 1;')}>
                <div style={s("font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 17px; color: #1f5d39;")}>Pequeños Discípulos</div>
                <div style={s('font-size: 12px; font-weight: 700; color: #d98a3d; letter-spacing: 0.5px;')}>SALA DE CLASES</div>
              </div>
            </div>

            <div style={s('font-size: 13px; font-weight: 800; letter-spacing: 1.5px; color: #2f7d4f; margin-bottom: 4px;')}>¡QUÉ BUENO VERTE!</div>
            <h1 style={s("font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 38px; color: #25361f; margin: 0 0 22px;")}>Iniciar sesión</h1>

            <div style={s('position: relative; margin-bottom: 14px;')}>
              <div style={s('position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 18px; opacity: 0.7;')}>✉️</div>
              <input type="email" value={st.email} onChange={this.onEmail} onFocus={this.onFocusEmail} onBlur={this.onBlur} placeholder="Correo electrónico" style={s(inputBase(st.focus === 'email', emailValid))} />
              {emailValid && (
                <div style={s('position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; background: #2f7d4f; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; animation: ld-pop 0.35s ease;')}>✓</div>
              )}
            </div>

            <div style={s('position: relative; margin-bottom: 14px;')}>
              <div style={s('position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 17px; opacity: 0.7;')}>🔒</div>
              <input type={st.showPass ? 'text' : 'password'} value={st.password} onChange={this.onPassword} onFocus={this.onFocusPass} onBlur={this.onBlur} placeholder="Contraseña" style={s(inputBase(st.focus === 'pass', false))} />
              <button type="button" onClick={this.toggleShow} style={s('position: absolute; right: 10px; top: 50%; transform: translateY(-50%); border: none; background: transparent; cursor: pointer; font-size: 18px; padding: 6px; opacity: 0.65;')}>{st.showPass ? '🙈' : '👁️'}</button>
            </div>

            <div style={s('display: flex; align-items: center; justify-content: space-between; margin: 6px 2px 20px;')}>
              <label style={s("display: flex; align-items: center; gap: 9px; cursor: pointer; font-size: 14px; font-weight: 600; color: #4a5546;")}>
                <span onClick={this.toggleRemember} style={s(checkboxStyle)}>{st.remember ? '✓' : ''}</span>
                Recordarme
              </label>
              <a style={s('font-size: 14px; font-weight: 700; color: #2f7d4f; cursor: pointer; text-decoration: none;')}>¿Olvidaste tu clave?</a>
            </div>

            <button onClick={this.onSubmit} style={s(submitStyle)} onMouseEnter={this.btnEnter} onMouseLeave={this.btnLeave}>
              {submitContent}
            </button>

            {st.error && (
              <div style={s('margin-top: 12px; text-align: center; color: #d8553f; font-size: 13.5px; font-weight: 700;')}>{st.error}</div>
            )}

            <div style={s('display: flex; align-items: center; gap: 14px; margin: 24px 0 18px;')}>
              <div style={s('flex: 1; height: 1px; background: linear-gradient(to right, transparent, #d8dcd4);')}></div>
              <span style={s('font-size: 11.5px; font-weight: 800; letter-spacing: 1px; color: #98a193;')}>O CONTINÚA CON</span>
              <div style={s('flex: 1; height: 1px; background: linear-gradient(to left, transparent, #d8dcd4);')}></div>
            </div>

            <button onClick={this.onGoogle} style={s("width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px; border-radius: 16px; border: 1.5px solid #e3e6df; background: #fff; cursor: pointer; font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 800; color: #3a443a; transition: all 0.18s;")} onMouseEnter={this.gEnter} onMouseLeave={this.gLeave}>
              <span style={s('font-size: 18px; font-weight: 800; font-family: serif;')}><span style={s('color:#4285F4;')}>G</span><span style={s('color:#EA4335;')}>o</span><span style={s('color:#FBBC05;')}>o</span><span style={s('color:#4285F4;')}>g</span><span style={s('color:#34A853;')}>l</span><span style={s('color:#EA4335;')}>e</span></span>
              Entrar con Google
            </button>

            <div style={s('text-align: center; margin-top: 20px; font-size: 14.5px; font-weight: 600; color: #6b7566;')}>
              ¿No tienes cuenta? <a style={s('color: #2f7d4f; font-weight: 800; cursor: pointer; text-decoration: none;')}>Crear cuenta</a>
            </div>
            <div style={s('text-align: center; margin-top: 12px; font-size: 13px; font-weight: 700; color: #a7afa1; cursor: pointer;')}>Cambiar grupo</div>
            {this.props.onOpenRewards && (
              <div style={s('text-align: center; margin-top: 10px;')}>
                <button onClick={this.props.onOpenRewards} style={s("background: #f3f6f1; border: 1.5px solid #d8e3d4; cursor: pointer; font-family: 'Nunito', sans-serif; font-size: 13px; font-weight: 800; color: #2f7d4f; border-radius: 999px; padding: 7px 16px;")}>⭐ Recompensas</button>
              </div>
            )}
            {this.props.onReset && (
              <div style={s('text-align: center; margin-top: 8px;')}>
                <button onClick={this.props.onReset} style={s('background: none; border: none; cursor: pointer; font-size: 12px; font-weight: 600; color: #c0c7ba; text-decoration: underline; padding: 0;')}>Reiniciar progreso</button>
              </div>
            )}
          </div>
        </div>

        {/* TAP HINT */}
        <div style={s("position: absolute; top: 18px; right: 22px; z-index: 13; pointer-events: none; background: rgba(255,255,255,0.9); border: 1.5px solid #e6ebe4; border-radius: 999px; padding: 8px 16px; font: 800 12.5px 'Nunito', sans-serif; color: #6b7566; box-shadow: 0 6px 16px -8px rgba(40,75,45,0.3);")}>👆 Toca la cruz, la paloma, a Jesús o la oveja para descubrir más</div>

        {/* INFO MODAL (objetos bíblicos) */}
        {m && (
          <div onClick={this.closeModal} style={s('position: fixed; inset: 0; z-index: 40; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(35,50,35,0.42); backdrop-filter: blur(6px); animation: ld-cardin 0.3s ease;')}>
            <div onClick={this.stopProp} style={s('position: relative; width: 100%; max-width: 408px; background: #fff; border-radius: 28px; overflow: hidden; box-shadow: 0 40px 90px -20px rgba(20,40,20,0.5); animation: ld-pop 0.45s cubic-bezier(0.22,1.35,0.5,1);')}>
              <div style={s(`position: relative; padding: 32px 28px 26px; text-align: center; background: ${modalHeaderBg};`)}>
                <div style={s('width: 84px; height: 84px; margin: 0 auto 14px; border-radius: 50%; background: rgba(255,255,255,0.95); display: flex; align-items: center; justify-content: center; font-size: 42px; box-shadow: 0 10px 22px -8px rgba(0,0,0,0.3); animation: ld-bobble 3s ease-in-out infinite;')}>{m.emoji}</div>
                <div style={s("font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 25px; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.18);")}>{m.title}</div>
              </div>
              <div style={s('padding: 22px 28px 26px;')}>
                <div style={s("font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 600; line-height: 1.5; color: #4a5546; text-align: center; text-wrap: pretty;")}>{m.text}</div>
                <div style={s(`display: flex; align-items: center; justify-content: center; gap: 8px; margin: 18px auto 0; width: max-content; padding: 8px 16px; border-radius: 999px; background: #f3f6f1; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 13.5px; color: ${modalColor};`)}>📖 {m.verse}</div>
                <button onClick={this.closeModal} style={s(`width: 100%; margin-top: 20px; padding: 15px; border: none; border-radius: 16px; cursor: pointer; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 16px; color: #fff; background: ${modalColor};`)}>¡Entendido! 🙌</button>
              </div>
              <button onClick={this.closeModal} style={s('position: absolute; top: 14px; right: 14px; width: 34px; height: 34px; border-radius: 50%; border: none; background: rgba(255,255,255,0.32); color: #fff; font-size: 15px; font-weight: 800; cursor: pointer; line-height: 1;')}>✕</button>
            </div>
          </div>
        )}

        {/* GAME HUD */}
        <div style={s('position: absolute; left: 21%; bottom: 26px; transform: translateX(-50%); z-index: 14; display: flex; flex-direction: column; align-items: center; gap: 12px; pointer-events: none;')}>
          {notReunited && (
            <>
              <div style={s("background: rgba(255,255,255,0.94); border: 1.5px solid #e6ebe4; border-radius: 999px; padding: 8px 18px; font: 800 13px 'Nunito', sans-serif; color: #2f7d4f; box-shadow: 0 8px 20px -8px rgba(40,75,45,0.3);")}>🐑 Lleva a la ovejita perdida hasta Jesús</div>
              <div style={s('display: flex; gap: 14px;')}>
                <button onPointerDown={this.pressLeft} onPointerUp={this.releaseLeft} onPointerLeave={this.releaseLeft} style={s('pointer-events: auto; width: 58px; height: 58px; border-radius: 50%; border: none; background: #fff; color: #2f7d4f; font-size: 22px; font-weight: 800; cursor: pointer; box-shadow: 0 8px 18px -6px rgba(40,75,45,0.35); touch-action: none; user-select: none;')}>◀</button>
                <button onPointerDown={this.hop} style={s('pointer-events: auto; width: 58px; height: 58px; border-radius: 50%; border: none; background: linear-gradient(145deg,#36925c,#1f5d39); color: #fff; font-size: 22px; cursor: pointer; box-shadow: 0 8px 18px -6px rgba(31,93,57,0.5); touch-action: none; user-select: none;')}>↑</button>
                <button onPointerDown={this.pressRight} onPointerUp={this.releaseRight} onPointerLeave={this.releaseRight} style={s('pointer-events: auto; width: 58px; height: 58px; border-radius: 50%; border: none; background: #fff; color: #2f7d4f; font-size: 22px; font-weight: 800; cursor: pointer; box-shadow: 0 8px 18px -6px rgba(40,75,45,0.35); touch-action: none; user-select: none;')}>▶</button>
              </div>
            </>
          )}
          {st.reunited && (
            <div style={s("background: linear-gradient(145deg,#36925c,#1f5d39); color: #fff; border-radius: 999px; padding: 11px 24px; font: 800 15px 'Baloo 2', sans-serif; box-shadow: 0 12px 28px -8px rgba(31,93,57,0.55); animation: ld-pop 0.5s cubic-bezier(0.22,1.4,0.5,1) both;")}>🎉 ¡La oveja perdida volvió con Jesús! ❤️</div>
          )}
        </div>

        {/* ===== CHARACTER SELECT ===== */}
        {st.phase === 'select' && (
          <div style={s('position: fixed; inset: 0; z-index: 35; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 32px; background: radial-gradient(120% 120% at 50% 0%, #bfe6f3, #e9f6e6 55%, #f7efd9); animation: ld-cardin 0.4s ease;')}>
            <div style={s('font-size: 13px; font-weight: 800; letter-spacing: 1.5px; color: #2f7d4f;')}>¡BIENVENIDO A LA AVENTURA!</div>
            <div style={s("font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 34px; color: #25361f; margin-bottom: 4px;")}>Elige tu personaje</div>
            <div style={s('font-size: 15px; font-weight: 600; color: #6b7566; margin-bottom: 22px;')}>Vas a explorar el mundo abierto 🌍</div>
            <div style={s('display: flex; gap: 22px; flex-wrap: wrap; justify-content: center;')}>
              <div onClick={this.chooseChar('ovejita')} style={s('cursor: pointer; width: 210px; background: #fff; border: 2px solid #e6ebe4; border-radius: 24px; padding: 18px; text-align: center; box-shadow: 0 18px 40px -18px rgba(40,75,45,0.4); transition: transform 0.15s, box-shadow 0.15s;')}>
                <div style={s('height: 150px; display: flex; align-items: flex-end; justify-content: center; border-radius: 16px; background: linear-gradient(180deg,#eafbe6,#d6f0c8); animation: ld-float 3.5s ease-in-out infinite; font-size: 64px;')}>🐑</div>
                <div style={s("font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 21px; color: #25361f; margin-top: 12px;")}>{CHARACTERS.ovejita.name}</div>
                <div style={s('font-size: 13px; font-weight: 600; color: #6b7566; margin-top: 2px;')}>{CHARACTERS.ovejita.desc}</div>
                <div style={s("margin-top: 12px; padding: 11px; border-radius: 14px; background: linear-gradient(145deg,#36925c,#1f5d39); color: #fff; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 15px;")}>Elegir</div>
              </div>
              <div onClick={this.chooseChar('discipulo')} style={s('cursor: pointer; width: 210px; background: #fff; border: 2px solid #e6ebe4; border-radius: 24px; padding: 18px; text-align: center; box-shadow: 0 18px 40px -18px rgba(40,75,45,0.4); transition: transform 0.15s, box-shadow 0.15s;')}>
                <div style={s('height: 150px; display: flex; align-items: flex-end; justify-content: center; border-radius: 16px; background: linear-gradient(180deg,#fdf3df,#f6e3c0); animation: ld-float 3.5s ease-in-out infinite 0.3s; font-size: 64px;')}>🧑‍🌾</div>
                <div style={s("font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 21px; color: #25361f; margin-top: 12px;")}>{CHARACTERS.discipulo.name}</div>
                <div style={s('font-size: 13px; font-weight: 600; color: #6b7566; margin-top: 2px;')}>{CHARACTERS.discipulo.desc}</div>
                <div style={s("margin-top: 12px; padding: 11px; border-radius: 14px; background: linear-gradient(145deg,#e3aa52,#bf8129); color: #fff; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 15px;")}>Elegir</div>
              </div>
              <div onClick={this.chooseChar('nino')} style={s('cursor: pointer; width: 210px; background: #fff; border: 2px solid #e6ebe4; border-radius: 24px; padding: 18px; text-align: center; box-shadow: 0 18px 40px -18px rgba(40,75,45,0.4); transition: transform 0.15s, box-shadow 0.15s;')}>
                <div style={s('height: 150px; display: flex; align-items: flex-end; justify-content: center; border-radius: 16px; background: linear-gradient(180deg,#fbe7ea,#f6cdd3); animation: ld-float 3.5s ease-in-out infinite 0.6s; font-size: 64px;')}>🧒</div>
                <div style={s("font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 21px; color: #25361f; margin-top: 12px;")}>{CHARACTERS.nino.name}</div>
                <div style={s('font-size: 13px; font-weight: 600; color: #6b7566; margin-top: 2px;')}>{CHARACTERS.nino.desc}</div>
                <div style={s("margin-top: 12px; padding: 11px; border-radius: 14px; background: linear-gradient(145deg,#e3886a,#c8523f); color: #fff; font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 15px;")}>Elegir</div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }
}

export default function Login(props) {
  return <LoginInner {...props} />;
}
