/* PilaLog · lista de logística de la estancia
 * Del río Pilagá a la estancia: Papá arma la lista, Javier compra y lleva.
 * JavaScript puro, sin dependencias ni paso de compilación.
 */
(function () {
  'use strict';

  /* ================================================================ datos fijos */
  var CATS = [
    { id: 'almacen', nombre: 'Almacén', icono: '🛒' },
    { id: 'ferreteria', nombre: 'Ferretería', icono: '🔧' },
    { id: 'veterinaria', nombre: 'Veterinaria', icono: '💉' },
    { id: 'repuestos', nombre: 'Repuestos', icono: '⚙️' },
    { id: 'otros', nombre: 'Otros', icono: '📦' }
  ];
  var ESTADO = { pedido: 'Pedido', comprado: 'Comprado', llevado: 'Llevado', noconseguido: 'No se consiguió' };
  var UNIDADES = ['u.', 'kg', 'g', 'l', 'ml', 'bolsa', 'caja', 'pack', 'rollo', 'metro'];
  var LS = { perfil: 'pilalog:perfil', escala: 'pilalog:escala', aviso: 'pilalog:ultimoAviso', instalarOculto: 'pilalog:instalarOculto' };
  var SES = { invitado: 'pilalog:modoInvitado', vista: 'pilalog:vistaInvitado' };
  var DEMO_CODIGO = 'demo-invitado';

  var logoN = 0;
  var LOGO = function (px) {
    var cid = 'pl-clip' + (++logoN);
    return '<svg class="logo" width="' + px + '" height="' + px + '" viewBox="0 0 64 64" aria-hidden="true">' +
      '<defs><clipPath id="' + cid + '"><circle cx="32" cy="32" r="29"/></clipPath></defs><circle cx="32" cy="32" r="30" fill="#f4e9d1"/><g clip-path="url(#' + cid + ')"><path d="M0 45q8-4 16 0t16 0t16 0t16 0V64H0Z" fill="#a0703f"/><path d="M0 45q8-4 16 0t16 0t16 0t16 0" fill="none" stroke="#2f6f9f" stroke-width="2.7"/><path d="M0 51.5q8-4 16 0t16 0t16 0t16 0" fill="none" stroke="#2f6f9f" stroke-width="2.4" opacity=".75"/><path d="M0 58q8-4 16 0t16 0t16 0t16 0" fill="none" stroke="#d2a56c" stroke-width="2.4" opacity=".85"/></g><circle cx="32" cy="32" r="30" fill="none" stroke="#d4a62a" stroke-width="3"/><path d="M20.6 35C19.6 22.5 25 16 32 16S44.4 22.5 43.4 35Z" fill="#3a2216"/><path d="M20.2 28.6Q32 31.2 43.8 28.6L43.5 34.6Q32 37 20.5 34.6Z" fill="#8f2d1d"/><path d="M26 21Q28 18 32 17.8" fill="none" stroke="#6b4630" stroke-width="1.3" stroke-linecap="round" opacity=".8"/><ellipse cx="32" cy="37.2" rx="26" ry="5.2" fill="#3a2216"/><ellipse cx="32" cy="37.2" rx="22.6" ry="3.7" fill="none" stroke="#6b4630" stroke-width=".7" opacity=".9"/>' +
      '</svg>';
  };
  var ICON = {
    lista: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3"/><circle cx="4.5" cy="12" r="1.3"/><circle cx="4.5" cy="18" r="1.3"/></svg>',
    costos: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M15 9.2c0-1.2-1.3-2-3-2s-3 .8-3 2 1.3 1.8 3 2.1 3 .9 3 2.2-1.3 2-3 2-3-.8-3-2"/></svg>',
    viaje: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 16.5V7h11v9.5M13.5 10h4l4 3.5v3h-2"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M9 17.5h6"/></svg>',
    ajustes: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9M18 7h2M4 17h2M11 17h9"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="8.5" cy="17" r="2.3"/></svg>'
  };

  /* =============================================================== utilidades */
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin espacio o bloqueado */ } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sin espacio o bloqueado */ } }
  function ssDel(k) { try { sessionStorage.removeItem(k); } catch (e) { /* nada */ } }

  var monedaEntera = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  var monedaCent = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function plata(n) {
    n = n || 0;
    return Math.abs(n - Math.round(n)) < 0.005 ? monedaEntera.format(n) : monedaCent.format(n);
  }

  // "1.500" -> 1500 · "1.500,50" -> 1500.5 · "2,5" -> 2.5 · "$ 800" -> 800
  function aNumero(txt) {
    var s = String(txt == null ? '' : txt).replace(/[^\d.,]/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    return parseFloat(s);
  }
  function cantTxt(n) { return String(Math.round(Number(n) * 100) / 100).replace('.', ','); }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDe(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hoyISO() { return isoDe(new Date()); }
  function fechaDe(iso) { var p = iso.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function fechaLarga(iso) { return fechaDe(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function fechaCorta(iso) { return fechaDe(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function diasHasta(iso) {
    var h = new Date(); h.setHours(0, 0, 0, 0);
    return Math.round((fechaDe(iso) - h) / 86400000);
  }
  function sumarMes(iso) {
    var p = iso.split('-').map(Number);
    var y = p[0], m = p[1];            // m ya es "mes siguiente" en base 0
    var ult = new Date(y, m + 1, 0).getDate();
    return isoDe(new Date(y, m, Math.min(p[2], ult)));
  }
  function cuentaTxt(iso) {
    var d = diasHasta(iso);
    if (d === 0) return '¡Es hoy!';
    if (d === 1) return 'Es mañana';
    if (d > 1) return 'Faltan ' + d + ' días';
    if (d === -1) return 'Fue ayer';
    return 'Pasó hace ' + (-d) + ' días';
  }

  function catDe(id) { return CATS.find(function (c) { return c.id === id; }) || CATS[CATS.length - 1]; }
  function rolNombre(rol) { return rol === 'papa' ? 'Papá' : rol === 'invitado' ? 'Invitado' : 'Javier'; }

  function normTel(txt) {
    var d = String(txt || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.indexOf('54') === 0 && d.length >= 12) return d;
    d = d.replace(/^0+/, '');
    var con15 = d.match(/^(\d{2,4})15(\d{6,8})$/);   // "3704 15 123456" -> quita el 15
    if (con15 && con15[1].length + con15[2].length === 10) d = con15[1] + con15[2];
    return '549' + d;                  // 549 + código de área + número (sin 0 ni 15)
  }

  function nuevoCodigo() {
    var abc = 'abcdefghijkmnpqrstuvwxyz23456789', out = '', a = new Uint8Array(12);
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < a.length; i++) out += abc[a[i] % abc.length];
    return 'pila-' + out;
  }
  function codigoValido(c) { return /^pila-[a-z0-9]{10,40}$/.test(c || ''); }
  function extraerCodigo(txt) {
    var m = String(txt || '').toLowerCase().match(/pila-[a-z0-9]{10,40}/);
    return m ? m[0] : '';
  }

  /* ===================================================================== estado */
  var S = {
    perfil: null,            // { codigo, rol: 'papa' | 'javier' | 'invitado', demo? }
    be: null,                // motor de datos
    desub: [],
    items: [], trips: [], ajustes: {},
    loaded: { items: false, settings: false },
    meta: { pending: false, fromCache: false },
    online: navigator.onLine !== false,
    tab: 'lista',
    error: '',
    sellos: {},              // id -> última modificación vista (para avisar cambios del otro)
    cb: null,
    instalar: null,
    raf: 0,
    tk: 0,                   // identifica la conexión vigente
    sembrando: false         // la demo ya se está sembrando
  };
  var sheetAbierto = false;

  function aj(k, def) { return S.ajustes[k] == null ? def : S.ajustes[k]; }
  function rol() { return S.perfil ? S.perfil.rol : 'papa'; }
  function esDemo() { return !!(S.perfil && S.perfil.demo); }
  function vistaInvitado() { return ssGet(SES.vista) === 'papa' ? 'papa' : 'javier'; }
  function esJavier() { return rol() === 'javier' || (esDemo() && vistaInvitado() === 'javier'); }
  function perfilDemo() { return { codigo: DEMO_CODIGO, rol: 'invitado', demo: true }; }

  function normItem(it) {
    it.nombre = it.nombre || 'Sin nombre';
    it.cant = Number(it.cant) > 0 ? Number(it.cant) : 1;
    it.unidad = it.unidad || 'u.';
    it.cat = it.cat || 'otros';
    it.estado = ESTADO[it.estado] ? it.estado : 'pedido';
    it.precios = Array.isArray(it.precios) ? it.precios : [];
    it.elegido = it.elegido || null;
    it.arrastrado = it.arrastrado || 0;
    return it;
  }

  /* ====================================================================== precios */
  // Costo real de un pedido según cómo se cargó el precio:
  // por unidad (monto × cantidad), de un pack cerrado (se compran packs enteros)
  // o el total de la línea del ticket.
  function costoDe(it, p) {
    var monto = Number(p.monto) || 0, cant = Number(it.cant) || 0;
    if (p.total) {
      return { sub: monto, packs: 0, pack: 1, unit: cant > 0 ? monto / cant : monto, sobra: 0, total: true };
    }
    if (p.pack > 1) {
      var packs = Math.max(1, Math.ceil(cant / p.pack - 1e-9));
      var sobra = Math.round((packs * p.pack - cant) * 100) / 100;
      return { sub: packs * monto, packs: packs, pack: p.pack, unit: monto / p.pack, sobra: sobra > 0 ? sobra : 0 };
    }
    return { sub: monto * cant, packs: 0, pack: 1, unit: monto, sobra: 0 };
  }
  function masBaratoDe(it) {
    var mejor = null, mc = null;
    it.precios.forEach(function (p) {
      var c = costoDe(it, p);
      if (!mejor || c.sub < mc.sub || (c.sub === mc.sub && c.unit < mc.unit)) { mejor = p; mc = c; }
    });
    return mejor;
  }
  function precioUnit(it) {
    if (!it.precios.length) return null;
    var el = it.precios.find(function (p) { return p.id === it.elegido; });
    var p = el || masBaratoDe(it);
    return Object.assign({ p: p, monto: p.monto, lugar: p.lugar, elegido: !!el }, costoDe(it, p));
  }
  function subtotal(it) { var u = precioUnit(it); return u ? u.sub : null; }
  function masBarataId(it) {
    if (it.precios.length < 2) return null;
    return masBaratoDe(it).id;
  }
  function lugaresConocidos() {
    var set = {};
    S.items.forEach(function (it) { it.precios.forEach(function (p) { set[p.lugar] = 1; }); });
    S.trips.forEach(function (t) { (t.items || []).forEach(function (i) { if (i.lugar) set[i.lugar] = 1; }); });
    return Object.keys(set).sort();
  }
  function nombresConocidos() {
    var set = {};
    S.items.forEach(function (i) { set[i.nombre] = 1; });
    S.trips.forEach(function (t) { (t.items || []).forEach(function (i) { set[i.nombre] = 1; }); });
    return Object.keys(set).sort().slice(0, 80);
  }
  function sugerencias() {
    var cuenta = {}, vigentes = {};
    S.items.forEach(function (i) { if (i.estado !== 'llevado') vigentes[i.nombre.toLowerCase()] = 1; });
    var todos = S.items.concat(S.trips.reduce(function (a, t) { return a.concat(t.items || []); }, []));
    todos.forEach(function (i) {
      var k = i.nombre.toLowerCase();
      if (vigentes[k]) return;
      if (!cuenta[k]) cuenta[k] = { n: 0, nombre: i.nombre, unidad: i.unidad || 'u.', cat: i.cat || 'otros' };
      cuenta[k].n++;
    });
    return Object.keys(cuenta).map(function (k) { return cuenta[k]; })
      .sort(function (a, b) { return b.n - a.n; }).slice(0, 8);
  }

  /* ============================================================ conexión a datos */
  function guardar(promesa) {
    // Sin señal las promesas de Firebase quedan pendientes: no se esperan.
    if (promesa && promesa.catch) promesa.catch(function (e) { aviso('No se pudo guardar: ' + (e && e.message ? e.message : e)); });
  }

  async function conectar() {
    S.error = '';
    S.desub.forEach(function (f) { try { f(); } catch (e) { /* ya cerrado */ } });
    S.desub = [];
    S.loaded = { items: false, settings: false };
    render();
    var tk = ++S.tk;
    try {
      var be = await window.PilaBackend.crear(S.perfil.codigo, { local: esDemo() });
      if (tk !== S.tk) return;      // mientras tanto se cambió de modo
      S.be = be;
    } catch (e) {
      if (tk !== S.tk) return;
      S.error = 'No se pudo cargar Firebase. Revisá la señal y probá de nuevo.';
      render();
      return;
    }
    S.desub.push(S.be.subscribe('items', alRecibirItems));
    S.desub.push(S.be.subscribe('trips', alRecibirViajes));
    S.desub.push(S.be.subscribe('settings', alRecibirAjustes));
  }

  function falloDatos(meta) {
    var msg = String(meta.error && (meta.error.code || meta.error.message) || '');
    S.error = /permission/i.test(msg)
      ? 'Firebase rechazó el acceso. Revisá que las reglas de firestore.rules estén publicadas.'
      : 'No se pudo leer la lista (' + msg + ').';
    render();
  }

  function alRecibirItems(datos, meta) {
    if (!datos) return falloDatos(meta);
    var nuevos = datos.map(normItem);
    if (S.loaded.items) detectarCambios(nuevos);
    nuevos.forEach(function (i) { S.sellos[i.id] = i.actualizado || 0; });
    S.items = nuevos;
    S.meta = meta;
    var primera = !S.loaded.items;
    S.loaded.items = true;
    render();
    if (primera) setTimeout(recordatorioDiario, 600);
    sembrarDemo();
  }
  function alRecibirViajes(datos, meta) {
    if (!datos) return falloDatos(meta);
    S.trips = datos.sort(function (a, b) { return (b.cerradoEn || 0) - (a.cerradoEn || 0); });
    render();
  }
  function alRecibirAjustes(datos, meta) {
    if (!datos) return falloDatos(meta);
    S.ajustes = datos;
    S.loaded.settings = true;
    render();
    sembrarDemo();
  }

  function detectarCambios(nuevos) {
    var cambios = nuevos.filter(function (i) {
      return i.por && i.por !== rol() && (S.sellos[i.id] || 0) < (i.actualizado || 0);
    });
    if (!cambios.length) return;
    var quien = rolNombre(cambios[0].por);
    var txt = cambios.length === 1
      ? quien + (S.sellos[cambios[0].id] == null ? ' agregó: ' : ' cambió: ') + cambios[0].nombre
      : quien + ' actualizó ' + cambios.length + ' pedidos';
    aviso(txt);
    if (document.hidden) mostrarNotif('PilaLog', txt, 'cambio');
  }

  /* ================================================================ notificaciones */
  async function mostrarNotif(titulo, cuerpo, tag) {
    if (esDemo()) return false;
    if (!('Notification' in window) || Notification.permission !== 'granted') return false;
    try {
      var reg = navigator.serviceWorker && await navigator.serviceWorker.ready;
      if (reg) {
        await reg.showNotification(titulo, { body: cuerpo, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: tag, lang: 'es-AR' });
        return true;
      }
    } catch (e) { /* se prueba el método clásico */ }
    try { new Notification(titulo, { body: cuerpo, icon: 'icons/icon-192.png', tag: tag }); return true; } catch (e2) { return false; }
  }

  function pendientesCount() {
    return S.items.filter(function (i) { return i.estado === 'pedido' || i.estado === 'noconseguido'; }).length;
  }
  function viajeCerca() {
    var f = S.ajustes.fechaViaje;
    if (!f) return null;
    var d = diasHasta(f);
    return d >= 0 && d <= aj('avisoDias', 3) ? d : null;
  }
  function recordatorioDiario() {
    if (esDemo()) return;
    var d = viajeCerca();
    if (d == null || lsGet(LS.aviso) === hoyISO()) return;
    lsSet(LS.aviso, hoyISO());
    var pend = pendientesCount();
    var txt = esJavier()
      ? (d === 0 ? 'El viaje es hoy.' : 'Faltan ' + d + ' día' + (d === 1 ? '' : 's') + ' para el viaje.') + ' Quedan ' + pend + ' cosas por comprar.'
      : (d === 0 ? 'Hoy es el viaje.' : 'Faltan ' + d + ' día' + (d === 1 ? '' : 's') + ' para el viaje.') + ' Si falta algo, agregalo hoy a la lista.';
    mostrarNotif('PilaLog · se acerca el viaje', txt, 'viaje');
  }

  /* ===================================================================== avisos UI */
  var toastTimer = 0;
  function aviso(txt) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = txt;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 3800);
  }

  function abrirSheet(titulo, cuerpo) {
    var sh = $('#sheet');
    sh.innerHTML = '<div class="sheet-fondo" data-a="cerrarSheet"></div>' +
      '<div class="sheet-card" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '">' +
      '<div class="guarda guarda-fina"></div><h2 class="sheet-t">' + esc(titulo) + '</h2>' + cuerpo + '</div>';
    sh.hidden = false;
    document.body.classList.add('con-sheet');
    if (!sheetAbierto) { try { history.pushState({ sheet: 1 }, ''); } catch (e) { /* sin historial */ } }
    sheetAbierto = true;
    var foco = sh.querySelector('[autofocus]');
    if (foco) {
      // Solo si la persona todavía no tocó otro campo (evita robarle el foco).
      setTimeout(function () {
        var activo = document.activeElement;
        var yaEnCampo = activo && activo !== sh && sh.contains(activo);
        if (foco.isConnected && !yaEnCampo) foco.focus();
      }, 60);
    }
  }
  function cerrarSheet(desdePop) {
    if (!sheetAbierto) return;
    sheetAbierto = false;
    var sh = $('#sheet');
    sh.hidden = true;
    sh.innerHTML = '';
    document.body.classList.remove('con-sheet');
    if (!desdePop && history.state && history.state.sheet) history.back();
  }
  function confirmar(titulo, msg, okTxt, cb, peligro) {
    S.cb = cb;
    abrirSheet(titulo,
      '<p>' + esc(msg) + '</p><div class="acciones">' +
      '<button class="btn ' + (peligro ? 'btn-pri' : 'btn-ok') + ' grande" data-a="confirmarOk">' + esc(okTxt) + '</button>' +
      '<button class="btn btn-ghost" data-a="cerrarSheet">Cancelar</button></div>');
  }

  /* ================================================================== dibujo (UI) */
  function render() {
    if (S.raf) return;
    S.raf = requestAnimationFrame(function () { S.raf = 0; pintar(); });
  }
  function pintar() {
    var app = $('#app');
    var y = window.scrollY;
    if (!S.perfil) app.innerHTML = vistaBienvenida();
    else if (S.error) app.innerHTML = vistaCargando(S.error, true);
    else if (!S.be || !S.loaded.items || !S.loaded.settings) app.innerHTML = vistaCargando('Abriendo la lista…', false);
    else app.innerHTML = cascaron();
    window.scrollTo(0, y);
  }

  function yaInstalada() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function instalarOculto() {
    return Date.now() - (Number(lsGet(LS.instalarOculto)) || 0) < 7 * 86400000;
  }
  // Botón directo de instalación (sin pasar por los tres puntitos del navegador).
  function bannerInstalar(grande) {
    if (yaInstalada() || esDemo()) return '';
    if (S.instalar) {
      if (!grande && instalarOculto()) return '';
      return '<div class="banner instalar"><b>Instalá PilaLog en tu teléfono</b>' +
        '<p>Queda como una app más en la pantalla de inicio y anda también sin señal.</p>' +
        '<button class="btn btn-ok grande" data-a="instalar">Instalar PilaLog</button>' +
        (grande ? '' : '<button class="btn btn-ghost btn-s" data-a="noInstalar">Ahora no</button>') + '</div>';
    }
    return grande ? '<button class="btn btn-ghost" style="margin-bottom:1rem" data-a="comoInstalar">¿Cómo la instalo en el teléfono?</button>' : '';
  }

  function vistaBienvenida() {
    var prueba = !window.PilaBackend.configurado();
    return '<div class="bienvenida">' + LOGO(96) +
      '<h1 class="marca">Pila<span>Log</span></h1>' +
      '<p class="lema">Del Pilagá a la estancia · logística de todos los meses</p>' +
      '<div class="guarda guarda-ancha"></div>' + bannerInstalar(true) +
      (prueba ? '<div class="banner modo"><b>Modo prueba.</b> Los datos quedan solo en este teléfono. Para compartir la lista con Papá, falta conectar Firebase (ver README).</div>' : '') +
      '<button class="btn btn-pri grande" data-a="soyJavier">Soy Javier · armar la lista de la estancia</button>' +
      '<p class="o">o entrá con el link de Javier</p>' +
      '<form data-form="unirse" autocomplete="off">' +
      '<label class="campo"><span>Link o código de la estancia</span>' +
      '<input type="text" name="codigo" placeholder="Pegá acá el link o el código" autocapitalize="off" spellcheck="false"></label>' +
      '<div class="acciones">' +
      '<button class="btn btn-oro grande" name="rol" value="papa">Entrar como Papá</button>' +
      '<button class="btn btn-ghost" name="rol" value="javier">Entrar como Javier (otro aparato)</button>' +
      '</div></form>' +
      '<hr class="sep-inv">' +
      '<p class="o" style="margin-top:0">¿Querés probar la app o te la están mostrando?</p>' +
      '<button class="btn btn-ghost grande" data-a="entrarInvitado">Entrar como invitado</button>' +
      '<p class="mini nota-inv">Es una demo con ejemplos: no ve ni modifica la lista de la estancia.</p></div>';
  }

  function vistaCargando(txt, conBoton) {
    return '<div class="cargando">' + LOGO(72) + '<h1 class="marca">Pila<span>Log</span></h1><p>' + esc(txt) + '</p>' +
      (conBoton ? '<button class="btn btn-pri" data-a="reintentar">Probar de nuevo</button>' +
        '<br><button class="btn btn-ghost" style="margin-top:.6rem" data-a="desvincular">Cambiar de código</button>' : '') +
      '</div>';
  }

  function estadoSync() {
    if (esDemo()) return { cls: 'prueba', txt: 'Modo demo' };
    if (S.be.mode === 'local') return { cls: 'prueba', txt: 'Modo prueba' };
    if (!S.online) return { cls: 'off', txt: 'Sin señal · se guarda igual' };
    if (S.meta.pending) return { cls: 'pend', txt: 'Guardando…' };
    if (S.meta.fromCache) return { cls: 'pend', txt: 'Conectando…' };
    return { cls: 'ok', txt: 'Al día' };
  }

  function cascaron() {
    var tabs = esJavier()
      ? [['lista', 'Lista'], ['costos', 'Costos'], ['viaje', 'Viaje'], ['ajustes', 'Ajustes']]
      : [['lista', 'Lista'], ['viaje', 'Viaje'], ['ajustes', 'Ajustes']];
    if (!tabs.some(function (t) { return t[0] === S.tab; })) S.tab = 'lista';
    var vista = { lista: vistaLista, costos: vistaCostos, viaje: vistaViaje, ajustes: vistaAjustes }[S.tab]();
    var sync = estadoSync();
    return '<header class="top">' + LOGO(44) +
      '<div><h1 class="marca">Pila<span>Log</span></h1><p class="lema">Logística de la estancia</p></div>' +
      '<div class="top-der"><span class="rol' + (esDemo() ? ' inv' : '') + '">' + rolNombre(rol()) + '</span>' +
      '<span class="sync ' + sync.cls + '"><i></i>' + sync.txt + '</span></div></header>' +
      '<div class="guarda"></div>' + chipViaje() +
      '<main class="vista">' + vista + '</main>' +
      (S.tab === 'lista' ? '<button class="fab" data-a="nuevo">＋ Agregar pedido</button>' : '') +
      '<nav class="nav" style="--n:' + tabs.length + '" aria-label="Secciones">' +
      tabs.map(function (t) {
        return '<button data-a="tab" data-v="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '>' + ICON[t[0]] + t[1] + '</button>';
      }).join('') + '</nav>';
  }

  function chipViaje() {
    var f = S.ajustes.fechaViaje;
    if (!f) {
      return '<button class="chip-viaje" data-a="fecha"><span><b>Próximo viaje:</b> sin fecha todavía<small>Tocá para elegirla</small></span></button>';
    }
    var d = diasHasta(f);
    var n = d >= 0 ? d : '·';
    return '<button class="chip-viaje" data-a="fecha"><span><b>Próximo viaje</b><small>' + esc(fechaLarga(f)) + ' · ' + esc(cuentaTxt(f)) + '</small></span>' +
      (d >= 0 ? '<span class="cuenta-n">' + n + '<small> día' + (d === 1 ? '' : 's') + '</small></span>' : '') + '</button>';
  }

  /* ------------------------------------------------------------------ lista */
  function ordenar(a, b) {
    return (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0) ||
      (b.arrastrado || 0) - (a.arrastrado || 0) ||
      (a.creado || 0) - (b.creado || 0);
  }

  function bannerViaje() {
    var d = viajeCerca();
    var f = S.ajustes.fechaViaje;
    if (d != null) {
      var pend = pendientesCount();
      return '<div class="banner"><b>¡Se acerca el viaje!</b> ' + esc(cuentaTxt(f)) + '. ' +
        (esJavier()
          ? (pend ? 'Quedan <b>' + pend + '</b> cosas por comprar.' : 'Todo comprado, ¡a cargar la camioneta!')
          : 'Si falta algo, agregalo hoy a la lista.') + '</div>';
    }
    if (f && diasHasta(f) < 0 && esJavier()) {
      return '<div class="banner"><b>El viaje del ' + esc(fechaCorta(f)) + ' ya pasó.</b> Cuando termines, cerralo para guardar el historial y arrancar el mes nuevo.' +
        '<br><button class="btn btn-oro btn-s" data-a="cerrarViaje">Cerrar viaje</button></div>';
    }
    return '';
  }

  function bannerDemo() {
    if (!esDemo()) return '';
    var como = esJavier() ? 'Javier' : 'Papá';
    return '<div class="banner modo"><b>Modo invitado.</b> Probá todo con libertad: es una demo y no toca la lista real. Estás viendo la app como ' + como + '.' +
      '<br><button class="btn btn-ghost btn-s" data-a="cambiarVista">' + textoCambiarVista() + '</button></div>';
  }
  function textoCambiarVista() { return esJavier() ? 'Ver como Papá' : 'Ver como Javier'; }

  function vistaLista() {
    var items = S.items.slice().sort(ordenar);
    var pend = items.filter(function (i) { return i.estado === 'pedido' || i.estado === 'noconseguido'; });
    var comp = items.filter(function (i) { return i.estado === 'comprado'; });
    var llev = items.filter(function (i) { return i.estado === 'llevado'; });
    var total = items.length;
    var html = bannerDemo() + bannerInstalar(false) + bannerViaje();
    if (S.be.mode === 'local' && esJavier() && !esDemo()) {
      html += '<div class="banner modo"><b>Modo prueba:</b> esta lista vive solo en este teléfono. Cuando conectes Firebase, Papá la verá en el suyo.</div>';
    }
    html += '<h2 class="t1">' + (esJavier() ? 'Lista del viaje' : 'Lo que hace falta en la estancia') + '</h2>';

    if (!total) {
      html += '<div class="vacio">' + LOGO(84) +
        '<p><b>Todo en orden por la estancia.</b><br>' + (esJavier() ? 'Todavía no hay nada pedido.' : 'Tocá “Agregar pedido” cuando te haga falta algo.') + '</p>' +
        (S.be.mode === 'local' ? '<button class="btn btn-ghost" data-a="ejemplos">Cargar ejemplos de prueba</button>' : '') + '</div>';
      return html;
    }

    html += '<div class="prog" role="img" aria-label="Avance de la lista"><i class="p-llev" style="width:' + (llev.length / total * 100) + '%"></i><i class="p-comp" style="width:' + (comp.length / total * 100) + '%"></i></div>' +
      '<p class="prog-txt"><span>Falta comprar: <b>' + pend.length + '</b></span><span>Comprado: <b>' + comp.length + '</b></span><span>Llevado: <b>' + llev.length + '</b></span></p>';

    html += '<div class="sep"><h2>Para comprar</h2><span>' + pend.length + '</span></div>';
    html += pend.length ? pend.map(tarjetaItem).join('') : '<p class="mini">Nada pendiente. ¡Muy bien!</p>';
    if (comp.length) {
      html += '<div class="sep"><h2>Comprado, listo para llevar</h2><span>' + comp.length + '</span></div>' + comp.map(tarjetaItem).join('');
    }
    if (llev.length) {
      html += '<details class="plegable"><summary>Ya está en la estancia (' + llev.length + ')</summary>' +
        llev.map(function (i) {
          return '<div class="fila-llev"><span>' + esc(i.nombre) + ' · <b>' + cantTxt(i.cant) + ' ' + esc(i.unidad) + '</b></span>' +
            (esJavier() ? '<button class="btn btn-ghost btn-s" data-a="aComprado" data-id="' + i.id + '">Deshacer</button>' : '') + '</div>';
        }).join('') + '</details>';
    }
    return html;
  }

  function porUnidad(it) { return it.unidad === 'u.' ? 'c/u' : 'por ' + it.unidad; }
  function textoPrecio(it, u) {
    if (u.total) return plata(u.monto) + ' en total (' + plata(u.unit) + ' ' + porUnidad(it) + ')';
    if (u.pack > 1) {
      return plata(u.monto) + ' el pack de ' + cantTxt(u.pack) + ' ' + it.unidad + ' (' + plata(u.unit) + ' ' + porUnidad(it) + ') · ' +
        u.packs + (u.packs === 1 ? ' pack' : ' packs') + (u.sobra > 0 ? ', sobran ' + cantTxt(u.sobra) + ' ' + it.unidad : '');
    }
    return plata(u.monto) + ' ' + porUnidad(it);
  }

  function tarjetaItem(it) {
    var cat = catDe(it.cat);
    var u = esJavier() ? precioUnit(it) : null;
    var acciones = '';
    if (esJavier()) {
      if (it.estado === 'comprado') {
        acciones = '<button class="btn btn-ok btn-s" data-a="llevado" data-id="' + it.id + '">Llevado</button>' +
          '<button class="btn btn-ghost btn-s" data-a="aPedido" data-id="' + it.id + '">Volver a pedido</button>';
      } else {
        acciones = '<button class="btn btn-oro btn-s" data-a="comprar" data-id="' + it.id + '">Comprado</button>' +
          '<button class="btn btn-ghost btn-s" data-a="cotizar" data-id="' + it.id + '">＋ Precio</button>' +
          (it.estado === 'noconseguido' ? '' : '<button class="btn btn-ghost btn-s" data-a="noConseguido" data-id="' + it.id + '">No lo conseguí</button>');
      }
    }
    return '<article class="item e-' + it.estado + '">' +
      '<button class="item-main" data-a="editar" data-id="' + it.id + '" aria-label="Editar ' + esc(it.nombre) + '">' +
      '<h3>' + esc(it.nombre) + (it.urgente ? '<span class="tag urg">Urgente</span>' : '') +
      (it.arrastrado ? '<span class="tag arr">Del mes pasado</span>' : '') + '</h3>' +
      '<p class="meta"><b>' + cantTxt(it.cant) + ' ' + esc(it.unidad) + '</b> · ' + cat.icono + ' ' + cat.nombre +
      ' <span class="tag s-' + it.estado + '">' + ESTADO[it.estado] + '</span></p>' +
      (it.nota ? '<p class="nota">' + esc(it.nota) + '</p>' : '') +
      (it.estado === 'noconseguido' && it.motivo ? '<p class="motivo">No se consiguió: ' + esc(it.motivo) + '</p>' : '') +
      (u ? '<p class="precio-linea">' + (u.elegido ? 'Precio: ' : 'Mejor precio: ') + textoPrecio(it, u) + ' · ' + esc(u.lugar) + '</p>' : '') +
      '</button>' +
      (acciones ? '<div class="item-pie">' + acciones + '</div>' : '') + '</article>';
  }

  /* ------------------------------------------------------------------ costos */
  function statsCostos() {
    var r = { estimado: 0, confirmado: 0, sinPrecio: 0, ahorro: 0 };
    S.items.forEach(function (it) {
      var u = precioUnit(it);
      if (!u) { r.sinPrecio++; return; }
      r.estimado += u.sub;
      if (u.elegido && (it.estado === 'comprado' || it.estado === 'llevado')) r.confirmado += u.sub;
      if (it.precios.length > 1) {
        var max = Math.max.apply(null, it.precios.map(function (p) { return costoDe(it, p).sub; }));
        r.ahorro += max - u.sub;
      }
    });
    return r;
  }

  function vistaCostos() {
    var st = statsCostos();
    var html = '<h2 class="t1">Costos del mes</h2>';
    if (!S.items.length) return html + '<div class="vacio"><p>Cuando haya pedidos en la lista, acá cargás los precios de cada lugar y comparás.</p></div>';

    html += '<div class="totales">' +
      '<div class="total"><span>Estimado</span><b>' + plata(st.estimado) + '</b></div>' +
      '<div class="total"><span>Ya comprado</span><b>' + plata(st.confirmado) + '</b></div>' +
      (st.ahorro > 0 ? '<div class="total ahorro"><span>Ahorro por comparar lugares</span><b>' + plata(st.ahorro) + '</b></div>' : '') +
      '</div>' +
      (st.sinPrecio ? '<p class="mini" style="margin-top:.5rem">' + st.sinPrecio + (st.sinPrecio === 1 ? ' pedido todavía no tiene' : ' pedidos todavía no tienen') + ' precio.</p>' : '');

    // Dónde comprar: agrupado por lugar (el elegido, o el más barato mientras no elijas)
    var grupos = {};
    S.items.filter(function (i) { return i.estado !== 'llevado'; }).forEach(function (it) {
      var u = precioUnit(it);
      var lugar = u ? u.lugar : 'Sin cotizar';
      (grupos[lugar] = grupos[lugar] || []).push({ it: it, u: u });
    });
    var nombres = Object.keys(grupos).sort(function (a, b) {
      if (a === 'Sin cotizar') return 1;
      if (b === 'Sin cotizar') return -1;
      return a.localeCompare(b, 'es');
    });
    html += '<div class="sep"><h2>Dónde comprar</h2><span>' + nombres.length + (nombres.length === 1 ? ' lugar' : ' lugares') + '</span></div>' +
      '<div class="tarjeta">' + nombres.map(function (n) {
        var suma = grupos[n].reduce(function (a, g) { return a + (g.u ? g.u.sub : 0); }, 0);
        return '<div class="lugar"><h3><span>' + esc(n) + '</span><span>' + (n === 'Sin cotizar' ? '' : plata(suma)) + '</span></h3><ul>' +
          grupos[n].map(function (g) {
            return '<li class="' + (g.it.estado === 'comprado' ? 'hecho' : '') + '"><span>' + esc(g.it.nombre) + ' · ' + cantTxt(g.it.cant) + ' ' + esc(g.it.unidad) +
              (g.u && g.u.packs ? ' · ' + g.u.packs + (g.u.packs === 1 ? ' pack' : ' packs') : '') + '</span>' +
              '<span>' + (g.u ? plata(g.u.sub) : '') + '</span></li>';
          }).join('') + '</ul></div>';
      }).join('') + '</div>';

    // Cotizaciones por pedido
    html += '<div class="sep"><h2>Cotizaciones</h2><span>tocá un precio para elegirlo</span></div>';
    html += S.items.slice().sort(function (a, b) {
      return (a.estado === 'llevado' ? 1 : 0) - (b.estado === 'llevado' ? 1 : 0) || ordenar(a, b);
    }).map(function (it) {
      var barata = masBarataId(it);
      return '<article class="item e-' + it.estado + '"><h3>' + esc(it.nombre) + '</h3>' +
        '<p class="meta"><b>' + cantTxt(it.cant) + ' ' + esc(it.unidad) + '</b> <span class="tag s-' + it.estado + '">' + ESTADO[it.estado] + '</span></p>' +
        '<div class="cot-lista">' + it.precios.map(function (p) {
          var c = costoDe(it, p);
          var detalle = c.total ? 'Total del ticket · ' + plata(c.unit) + ' ' + porUnidad(it)
            : c.pack > 1 ? 'Pack de ' + cantTxt(c.pack) + ' ' + it.unidad + ' · ' + plata(c.unit) + ' ' + porUnidad(it) + (c.sobra > 0 ? ' · sobran ' + cantTxt(c.sobra) + ' ' + it.unidad : '')
              : '';
          var der = c.total ? 'total'
            : c.pack > 1 ? c.packs + (c.packs === 1 ? ' pack' : ' packs') + ' = ' + plata(c.sub)
              : (it.cant !== 1 ? '× ' + cantTxt(it.cant) + ' = ' + plata(c.sub) : 'c/u');
          return '<div class="cot ' + (p.id === it.elegido ? 'elegida' : '') + '">' +
            '<button class="cot-pick" data-a="elegir" data-id="' + it.id + '" data-q="' + p.id + '" aria-pressed="' + (p.id === it.elegido) + '">' +
            '<span class="radio"></span><span class="cot-lugar">' + esc(p.lugar) + (p.id === barata ? ' <span class="tag barata">Más barato</span>' : '') +
            (detalle ? '<span class="cot-pack">' + esc(detalle) + '</span>' : '') + '</span>' +
            '<span class="cot-monto">' + plata(p.monto) + '<span class="cot-sub">' + esc(der) + '</span></span></button>' +
            '<button class="x" data-a="borrarCot" data-id="' + it.id + '" data-q="' + p.id + '" aria-label="Borrar precio de ' + esc(p.lugar) + '">✕</button></div>';
        }).join('') + '</div>' +
        '<button class="btn btn-ghost btn-s add-cot" data-a="cotizar" data-id="' + it.id + '">＋ Agregar precio</button></article>';
    }).join('');
    return html;
  }

  /* ------------------------------------------------------------------- viaje */
  function textoLista() {
    var f = S.ajustes.fechaViaje;
    var items = S.items.slice().sort(ordenar);
    var linea = function (i) {
      return '• ' + i.nombre + ' — ' + cantTxt(i.cant) + ' ' + i.unidad + (i.urgente ? ' (URGENTE)' : '') + (i.nota ? ' · ' + i.nota : '');
    };
    var pend = items.filter(function (i) { return i.estado === 'pedido' || i.estado === 'noconseguido'; });
    var comp = items.filter(function (i) { return i.estado === 'comprado'; });
    var t = '*PilaLog · Lista de la estancia*\n' + (f ? 'Viaje: ' + fechaLarga(f) + '\n' : '');
    t += '\n*Falta comprar (' + pend.length + ')*\n' + (pend.length ? pend.map(linea).join('\n') : '— nada —');
    if (comp.length) t += '\n\n*Ya comprado (' + comp.length + ')*\n' + comp.map(linea).join('\n');
    return t;
  }

  function verCostosHistorial() { return esJavier() || !!S.ajustes.verCostosPapa; }

  function vistaViaje() {
    var f = S.ajustes.fechaViaje;
    var otro = esJavier() ? 'a Papá' : 'a Javier';
    var html = '<h2 class="t1">Viaje a la estancia</h2>' +
      '<section class="tarjeta"><h2 class="t2">Próximo viaje</h2>' +
      (f ? '<p class="fecha-grande">' + esc(fechaLarga(f)) + '</p><p class="cuenta">' + esc(cuentaTxt(f)) + '</p>'
        : '<p class="vacio-s">Todavía no hay fecha. Elegila para que el aviso llegue a tiempo.</p>') +
      '<button class="btn btn-ghost" data-a="fecha">' + (f ? 'Cambiar fecha' : 'Elegir fecha') + '</button></section>' +
      '<section class="tarjeta"><h2 class="t2">Compartir la lista</h2>' +
      '<button class="btn btn-ok" data-a="wapp">Mandar por WhatsApp ' + otro + '</button>' +
      '<button class="btn btn-ghost" data-a="copiar">Copiar el texto</button>' +
      '<button class="btn btn-ghost" data-a="imprimir">Imprimir o guardar en PDF</button></section>';

    if (esJavier()) {
      var llev = S.items.filter(function (i) { return i.estado === 'llevado'; }).length;
      html += '<section class="tarjeta"><h2 class="t2">Cerrar el viaje</h2>' +
        '<p class="mini" style="margin-bottom:.6rem">Lo llevado pasa al historial. Lo que no llegó queda para el mes que viene, marcado como “del mes pasado”.</p>' +
        '<button class="btn btn-oro" data-a="cerrarViaje">Cerrar viaje (' + llev + ' llevado' + (llev === 1 ? '' : 's') + ')</button></section>';
    }

    html += '<div class="sep"><h2>Historial</h2><span>' + S.trips.length + (S.trips.length === 1 ? ' viaje' : ' viajes') + '</span></div>';
    if (!S.trips.length) {
      html += '<p class="mini">Cuando cierres un viaje, queda guardado acá con todo lo que se llevó.</p>';
    } else {
      var conCostos = verCostosHistorial();
      html += '<div class="tarjeta">' + S.trips.map(function (t) {
        return '<details class="hist"><summary><span>' + esc(fechaCorta(t.fecha)) + ' · ' + (t.items || []).length + ' pedidos</span>' +
          (conCostos ? '<span>' + plata(t.total) + '</span>' : '') + '</summary><ul>' +
          (t.items || []).map(function (i) {
            return '<li>' + esc(i.nombre) + ' · ' + cantTxt(i.cant) + ' ' + esc(i.unidad || '') +
              (conCostos && i.lugar ? ' · ' + esc(i.lugar) + (i.subtotal != null ? ' · ' + plata(i.subtotal) : '') : '') + '</li>';
          }).join('') + '</ul></details>';
      }).join('') + '</div>';
    }
    return html;
  }

  /* ----------------------------------------------------------------- ajustes */
  function vistaAjustes() {
    var escala = Number(lsGet(LS.escala)) || 1;
    var notif = 'Notification' in window ? Notification.permission : 'denied';
    var html = '<h2 class="t1">Ajustes</h2>';

    html += '<section class="tarjeta"><h2 class="t2">Pantalla</h2><div class="ajuste"><b>Tamaño de letra</b><div class="escalas">' +
      [[1, 'Normal'], [1.15, 'Grande'], [1.3, 'Enorme']].map(function (e) {
        return '<button class="btn" data-a="escala" data-v="' + e[0] + '" aria-pressed="' + (escala === e[0]) + '">' + e[1] + '</button>';
      }).join('') + '</div></div>' +
      (esDemo() ? '' : '<div class="ajuste"><b>Avisos en el teléfono</b><p class="mini">Te avisan cuando el otro cambia la lista y cuando se acerca el viaje (con la app abierta o en segundo plano, según el aparato).</p>' +
      (notif === 'granted' ? '<p class="mini"><b>Activados ✔</b></p>'
        : notif === 'denied' && 'Notification' in window ? '<p class="mini">Están bloqueados. Activalos desde los permisos del navegador.</p>'
          : !('Notification' in window) ? '<p class="mini">Este navegador no los permite.</p>'
            : '<button class="btn btn-ghost" data-a="notif">Activar avisos</button>') + '</div>') +
      (S.instalar ? '<div class="ajuste"><b>Instalar la app</b><p class="mini">Queda como un ícono más en la pantalla de inicio.</p><button class="btn btn-ok" data-a="instalar">Instalar PilaLog</button></div>'
        : '<div class="ajuste"><b>Instalar la app</b><p class="mini">Abrí el menú ⋮ de Chrome y elegí “Instalar aplicación” o “Agregar a la pantalla principal”.</p></div>') +
      '</section>';

    html += '<section class="tarjeta"><h2 class="t2">WhatsApp</h2>' +
      '<form data-form="tels" autocomplete="off"><p class="mini" style="margin-bottom:.6rem">Código de área + número, sin 0 ni 15 (ej: 3704 123456). Sirve para mandar la lista con un toque.</p>' +
      '<label class="campo"><span>WhatsApp de Javier</span><input type="tel" name="telJavier" inputmode="tel" value="' + esc(S.ajustes.telJavier || '') + '"></label>' +
      '<label class="campo"><span>WhatsApp de Papá</span><input type="tel" name="telPapa" inputmode="tel" value="' + esc(S.ajustes.telPapa || '') + '"></label>' +
      '<button class="btn btn-ghost">Guardar números</button></form></section>';

    if (esDemo()) {
      html += '<section class="tarjeta"><h2 class="t2">Modo invitado</h2>' +
        '<p class="mini" style="margin-bottom:.6rem">Estás en una demo con ejemplos. Lo que hagas acá no toca la lista real.</p>' +
        '<button class="btn btn-ok" data-a="cambiarVista">' + textoCambiarVista() + '</button>' +
        '<button class="btn btn-ghost" style="margin-top:.5rem" data-a="reiniciarDemo">Reiniciar la demo</button>' +
        '<button class="btn btn-peli" style="margin-top:.5rem" data-a="salirInvitado">Salir del modo invitado</button></section>';
    } else if (esJavier()) {
      var link = linkPara('papa');
      html += '<section class="tarjeta"><h2 class="t2">Papá y la estancia</h2>' +
        '<div class="ajuste"><b>Link para Papá</b><p class="mini">Mandáselo por WhatsApp. Lo abre en Chrome, toca “Instalar” y listo: ya ve la lista.</p>' +
        '<button class="btn btn-ok" data-a="linkPapa">Mandar el link por WhatsApp</button></div>' +
        '<div class="ajuste"><b>Aviso antes del viaje</b><select data-c="avisoDias">' +
        [1, 2, 3, 5, 7].map(function (n) { return '<option value="' + n + '"' + (aj('avisoDias', 3) === n ? ' selected' : '') + '>' + n + (n === 1 ? ' día antes' : ' días antes') + '</option>'; }).join('') + '</select></div>' +
        '<label class="switch" style="margin:.8rem 0 .2rem"><input type="checkbox" data-c="verCostos"' + (S.ajustes.verCostosPapa ? ' checked' : '') + '><span class="sw"></span><b>Que Papá vea los gastos en el historial</b></label>' +
        '<div class="ajuste"><b>Código de la estancia</b><div class="codigo">' + esc(S.perfil.codigo) + '</div>' +
        '<button class="btn btn-ghost btn-s" data-a="copiarCodigo">Copiar código</button>' +
        '<p class="mini" style="margin-top:.4rem">Guardalo: con el código recuperás la lista si cambiás de teléfono. Link de Papá: <span style="word-break:break-all">' + esc(link) + '</span></p></div>' +
        '</section>';

      html += '<section class="tarjeta"><h2 class="t2">Respaldo</h2>' +
        '<button class="btn btn-ghost" data-a="exportar">Descargar respaldo (.json)</button>' +
        '<label class="btn btn-ghost" style="margin-top:.5rem;width:100%">Restaurar un respaldo<input type="file" accept="application/json,.json" data-c="importar" hidden></label></section>' +
        '<section class="tarjeta"><h2 class="t2">Mostrar la app a otra persona</h2>' +
        '<p class="mini" style="margin-bottom:.6rem">El modo invitado es una demo con ejemplos: quien entra no ve ni cambia la lista de la estancia.</p>' +
        '<button class="btn btn-ok" data-a="entrarInvitado">Entrar en modo invitado</button>' +
        '<button class="btn btn-ghost" style="margin-top:.5rem" data-a="copiarLinkInvitado">Copiar link para invitados</button></section>';
    }

    if (esDemo()) return html + '<p class="mini" style="text-align:center">PilaLog 1.0 · hecho por RED para la estancia</p>';
    html += '<section class="tarjeta"><h2 class="t2">Este aparato</h2>' +
      '<p class="mini" style="margin-bottom:.6rem">' + (S.be.mode === 'local'
        ? 'Funcionando en modo prueba: los datos están solo en este teléfono.'
        : 'Conectado a la nube. Si se corta la señal, los cambios se guardan y se suben solos.') + '</p>' +
      '<button class="btn btn-peli" data-a="desvincular">Salir de esta estancia</button></section>' +
      '<p class="mini" style="text-align:center">PilaLog 1.0 · hecho por RED para la estancia</p>';
    return html;
  }

  function linkPara(r) {
    var base = location.origin + location.pathname;
    return base + '?c=' + S.perfil.codigo + '&r=' + r;
  }

  /* =========================================================== hojas (formularios) */
  function sheetItem(id) {
    var it = id ? S.items.find(function (x) { return x.id === id; }) : null;
    var v = it || { nombre: '', cant: 1, unidad: 'u.', cat: 'almacen', nota: '', urgente: false };
    var sug = it ? [] : sugerencias();
    abrirSheet(it ? 'Editar pedido' : 'Agregar pedido',
      '<form data-form="item" data-id="' + (it ? it.id : '') + '" autocomplete="off">' +
      (sug.length ? '<div class="sugs"><p class="mini">Pedidos de siempre (tocá uno):</p>' + sug.map(function (s) {
        return '<button type="button" class="chip" data-a="sug" data-n="' + esc(s.nombre) + '" data-u="' + esc(s.unidad) + '" data-cat="' + esc(s.cat) + '">' + esc(s.nombre) + '</button>';
      }).join('') + '</div>' : '') +
      '<label class="campo"><span>¿Qué hace falta?</span><div class="con-mic">' +
      '<input type="text" name="nombre" required maxlength="80" list="dl-nombres" value="' + esc(v.nombre) + '" placeholder="Ej: yerba, alambre, vacunas…"' + (it ? '' : ' autofocus') + '>' +
      '<button type="button" class="mic" data-a="dictar" aria-label="Dictar con la voz">🎤</button></div>' +
      '<datalist id="dl-nombres">' + nombresConocidos().map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></label>' +
      '<div class="fila2"><div class="campo"><span>Cantidad</span><div class="stepper">' +
      '<button type="button" data-a="paso" data-d="-1" aria-label="Menos">−</button>' +
      '<input type="text" name="cant" inputmode="decimal" value="' + cantTxt(v.cant) + '" aria-label="Cantidad">' +
      '<button type="button" data-a="paso" data-d="1" aria-label="Más">＋</button></div></div>' +
      '<label class="campo"><span>Unidad</span><select name="unidad">' + UNIDADES.map(function (u) {
        return '<option' + (u === v.unidad ? ' selected' : '') + '>' + esc(u) + '</option>';
      }).join('') + '</select></label></div>' +
      '<div class="campo"><span>Rubro</span><div class="cats">' + CATS.map(function (c) {
        return '<label><input type="radio" name="cat" value="' + c.id + '"' + (c.id === v.cat ? ' checked' : '') + '><span>' + c.icono + ' ' + c.nombre + '</span></label>';
      }).join('') + '</div></div>' +
      '<label class="campo"><span>Nota (opcional)</span><textarea name="nota" rows="2" maxlength="300" placeholder="Marca, medida, para qué es…">' + esc(v.nota) + '</textarea></label>' +
      '<label class="switch"><input type="checkbox" name="urgente"' + (v.urgente ? ' checked' : '') + '><span class="sw"></span><b>Es urgente</b></label>' +
      '<div class="acciones"><button class="btn btn-pri grande">' + (it ? 'Guardar cambios' : 'Agregar a la lista') + '</button>' +
      (it ? '<button type="button" class="btn btn-peli" data-a="borrar" data-id="' + it.id + '">Eliminar este pedido</button>' : '') +
      '<button type="button" class="btn btn-ghost" data-a="cerrarSheet">Cancelar</button></div></form>');
  }

  function camposPrecio(it, p, requerido) {
    var modo = p && p.total ? 'total' : p && p.pack > 1 ? 'pack' : 'unidad';
    var un = it.unidad === 'u.' ? 'unidad' : it.unidad;
    var chip = function (v, txt) {
      return '<label><input type="radio" name="modo" value="' + v + '" data-c="modoPrecio"' + (modo === v ? ' checked' : '') + '><span>' + txt + '</span></label>';
    };
    return '<div class="campo"><span>¿Cómo es el precio?</span><div class="cats">' +
      chip('unidad', 'Por cada ' + esc(un)) + chip('pack', 'De un pack o bolsa cerrada') + chip('total', 'El total del ticket') + '</div></div>' +
      '<label class="campo"><span data-r="titMonto">' + esc(tituloMonto(modo, un)) + '</span>' +
      '<input type="text" name="monto" inputmode="decimal"' + (requerido ? ' required' : '') + ' value="' + (p ? esc(String(p.monto).replace('.', ',')) : '') + '" placeholder="0"></label>' +
      '<label class="campo" data-r="campoPack"' + (modo === 'pack' ? '' : ' hidden') + '><span>¿Cuánto trae el pack? (en ' + esc(un) + ')</span>' +
      '<input type="text" name="pack" inputmode="decimal" value="' + (p && p.pack > 1 ? esc(cantTxt(p.pack)) : '') + '" placeholder="Ej: 10"></label>';
  }
  function tituloMonto(modo, un) {
    return modo === 'pack' ? 'Precio del pack ($)' : modo === 'total' ? 'Total pagado por este pedido ($)' : 'Precio por cada ' + un + ' ($)';
  }
  // Lee los campos de precio: { vacio } | { error } | { monto, pack?, total? }
  function leerPrecio(f) {
    var txt = f.elements.monto.value.trim();
    if (!txt) return { vacio: true };
    var monto = aNumero(txt);
    if (isNaN(monto) || monto < 0) return { error: 'Revisá el precio.' };
    var modo = (f.querySelector('input[name="modo"]:checked') || {}).value || 'unidad';
    var r = { monto: monto };
    if (modo === 'pack') {
      var pk = aNumero(f.elements.pack.value);
      if (isNaN(pk) || !(pk > 0)) return { error: 'Anotá cuánto trae el pack.' };
      if (pk > 1) r.pack = pk;
    } else if (modo === 'total') {
      r.total = true;
    }
    return r;
  }
  // Agrega el precio o, si el lugar ya existe, lo actualiza.
  function aplicarPrecio(precios, lugar, pr) {
    precios = precios.slice();
    var q = precios.find(function (p) { return p.lugar.toLowerCase() === lugar.toLowerCase(); });
    var nuevo = q ? Object.assign({}, q) : { id: uid(), lugar: lugar };
    delete nuevo.pack; delete nuevo.total;
    nuevo.monto = pr.monto;
    if (pr.pack > 1) nuevo.pack = pr.pack;
    if (pr.total) nuevo.total = true;
    if (q) precios = precios.map(function (p) { return p.id === q.id ? nuevo : p; });
    else precios.push(nuevo);
    return { precios: precios, q: nuevo };
  }

  function sheetComprar(id) {
    var it = S.items.find(function (x) { return x.id === id; });
    if (!it) return;
    var u = precioUnit(it);
    abrirSheet('Comprado: ' + it.nombre,
      '<form data-form="comprar" data-id="' + it.id + '" autocomplete="off">' +
      '<p class="mini">Anotá dónde lo compraste y cuánto salió, así queda para comparar.</p>' +
      '<label class="campo"><span>Lugar</span><input type="text" name="lugar" list="dl-lugares" maxlength="60" value="' + esc(u ? u.lugar : '') + '" placeholder="Ej: Supermercado Pilagá"' + (u ? '' : ' autofocus') + '>' +
      '<datalist id="dl-lugares">' + lugaresConocidos().map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></label>' +
      camposPrecio(it, u && u.p, false) +
      '<div class="acciones"><button class="btn btn-ok grande">Marcar como comprado</button>' +
      '<button type="button" class="btn btn-ghost" data-a="compradoSinPrecio" data-id="' + it.id + '">Comprado, sin anotar precio</button>' +
      '<button type="button" class="btn btn-ghost" data-a="cerrarSheet">Cancelar</button></div></form>');
  }

  function sheetCotizar(id) {
    var it = S.items.find(function (x) { return x.id === id; });
    if (!it) return;
    abrirSheet('Precio de ' + it.nombre,
      '<form data-form="cotizar" data-id="' + it.id + '" autocomplete="off">' +
      '<p class="mini">Cargá lo que vale en cada lugar para descartar opciones. Si repetís un lugar, se actualiza su precio.</p>' +
      '<label class="campo"><span>Lugar</span><input type="text" name="lugar" required list="dl-lugares" maxlength="60" placeholder="Ej: Mayorista del centro" autofocus>' +
      '<datalist id="dl-lugares">' + lugaresConocidos().map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></label>' +
      camposPrecio(it, null, true) +
      '<div class="acciones"><button class="btn btn-pri grande">Guardar precio</button>' +
      '<button type="button" class="btn btn-ghost" data-a="cerrarSheet">Cancelar</button></div></form>');
  }

  function sheetNoConseguido(id) {
    var it = S.items.find(function (x) { return x.id === id; });
    if (!it) return;
    abrirSheet('No se consiguió',
      '<form data-form="noConseguido" data-id="' + it.id + '" autocomplete="off">' +
      '<p>Papá va a ver que <b>' + esc(it.nombre) + '</b> no se pudo conseguir y queda para el próximo viaje.</p>' +
      '<label class="campo"><span>¿Qué pasó? (opcional)</span><input type="text" name="motivo" maxlength="120" placeholder="Ej: no había en el pueblo" autofocus></label>' +
      '<div class="acciones"><button class="btn btn-pri grande">Avisar que no se consiguió</button>' +
      '<button type="button" class="btn btn-ghost" data-a="cerrarSheet">Cancelar</button></div></form>');
  }

  function sheetFecha() {
    var f = S.ajustes.fechaViaje || '';
    abrirSheet('Fecha del próximo viaje',
      '<form data-form="fecha" autocomplete="off"><label class="campo"><span>¿Qué día se viaja?</span>' +
      '<input type="date" name="fecha" value="' + esc(f) + '" min="' + hoyISO() + '" required></label>' +
      '<div class="acciones"><button class="btn btn-pri grande">Guardar fecha</button>' +
      (f ? '<button type="button" class="btn btn-peli" data-a="quitarFecha">Quitar la fecha</button>' : '') +
      '<button type="button" class="btn btn-ghost" data-a="cerrarSheet">Cancelar</button></div></form>');
  }

  function sheetCerrarViaje() {
    var llev = S.items.filter(function (i) { return i.estado === 'llevado'; });
    var quedan = S.items.length - llev.length;
    var total = llev.reduce(function (a, i) { return a + (subtotal(i) || 0); }, 0);
    var base = S.ajustes.fechaViaje && diasHasta(S.ajustes.fechaViaje) >= -10 ? S.ajustes.fechaViaje : hoyISO();
    abrirSheet('Cerrar el viaje',
      '<form data-form="cerrarViaje" autocomplete="off">' +
      '<p>Se guardan en el historial <b>' + llev.length + '</b> pedido' + (llev.length === 1 ? '' : 's') + ' llevado' + (llev.length === 1 ? '' : 's') +
      (total ? ' (' + plata(total) + ')' : '') + '.</p>' +
      '<p>Quedan para el mes que viene: <b>' + quedan + '</b>.</p>' +
      '<label class="campo"><span>Fecha del próximo viaje</span><input type="date" name="fecha" value="' + sumarMes(base) + '" min="' + hoyISO() + '"></label>' +
      '<div class="acciones"><button class="btn btn-pri grande">Cerrar viaje</button>' +
      '<button type="button" class="btn btn-ghost" data-a="cerrarSheet">Todavía no</button></div></form>');
  }

  /* ================================================================ operaciones */
  function buscar(id) { return S.items.find(function (x) { return x.id === id; }); }
  function cambiar(id, parche) {
    var it = buscar(id);
    if (!it) return;
    var nuevo = Object.assign({}, it, parche, { actualizado: Date.now(), por: rol() });
    guardar(S.be.putItem(nuevo));
  }
  function ajustes(parche) { guardar(S.be.saveSettings(parche)); }

  function cerrarViaje(fechaNueva) {
    var llev = S.items.filter(function (i) { return i.estado === 'llevado'; });
    var quedan = S.items.filter(function (i) { return i.estado !== 'llevado'; });
    var total = 0;
    var snap = llev.map(function (i) {
      var u = precioUnit(i), sub = u ? u.sub : null;
      total += sub || 0;
      return { nombre: i.nombre, cant: i.cant, unidad: i.unidad, cat: i.cat, lugar: u ? u.lugar : '', monto: u ? u.monto : null, subtotal: sub };
    });
    var ahora = Date.now();
    var trip = {
      id: uid(), fecha: S.ajustes.fechaViaje || hoyISO(), cerradoEn: ahora, total: total,
      items: snap, pendientes: quedan.length
    };
    var updates = quedan.map(function (i) {
      return Object.assign({}, i, {
        arrastrado: (i.arrastrado || 0) + 1,
        estado: i.estado === 'noconseguido' ? 'pedido' : i.estado,
        actualizado: ahora, por: rol()
      });
    });
    guardar(S.be.closeTrip({ trip: trip, removeIds: llev.map(function (i) { return i.id; }), updates: updates, ajustes: { fechaViaje: fechaNueva || null } }));
    aviso('Viaje cerrado. ¡Buen mes!');
  }

  function urlWapp(tel, texto) {
    return 'https://wa.me/' + normTel(tel) + '?text=' + encodeURIComponent(texto);
  }
  function abrirWapp(tel, texto) {
    window.open(urlWapp(tel, texto), '_blank', 'noopener');
  }

  function copiarTexto(txt, okMsg) {
    var fin = function () { aviso(okMsg); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(fin, function () { copiarViejo(txt); fin(); });
    } else { copiarViejo(txt); fin(); }
  }
  function copiarViejo(txt) {
    var t = document.createElement('textarea');
    t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) { /* sin portapapeles */ }
    t.remove();
  }

  function imprimir() {
    var f = S.ajustes.fechaViaje;
    var items = S.items.filter(function (i) { return i.estado !== 'llevado'; }).sort(ordenar);
    var html = '<h1>Pila<span>Log</span> · Lista de la estancia</h1><p class="sub">' + (f ? 'Viaje: ' + esc(fechaLarga(f)) : 'Sin fecha de viaje') + ' · impreso el ' + esc(fechaCorta(hoyISO())) + '</p>';
    CATS.forEach(function (c) {
      var grupo = items.filter(function (i) { return i.cat === c.id; });
      if (!grupo.length) return;
      html += '<h2>' + c.icono + ' ' + c.nombre + '</h2><ul>' + grupo.map(function (i) {
        return '<li><div><b>' + esc(i.nombre) + '</b> — ' + cantTxt(i.cant) + ' ' + esc(i.unidad) + (i.urgente ? ' · URGENTE' : '') +
          (i.nota ? '<small>' + esc(i.nota) + '</small>' : '') + '</div></li>';
      }).join('') + '</ul>';
    });
    if (!items.length) html += '<p>La lista está vacía.</p>';
    $('#imprimir').innerHTML = html;
    window.print();
  }

  function exportar() {
    var dato = { app: 'PilaLog', version: 1, exportado: new Date().toISOString(), items: S.items, trips: S.trips, ajustes: S.ajustes };
    var blob = new Blob([JSON.stringify(dato, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pilalog-respaldo-' + hoyISO() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function importar(archivo) {
    var lector = new FileReader();
    lector.onload = function () {
      try {
        var d = JSON.parse(lector.result);
        if (d.app !== 'PilaLog' || !Array.isArray(d.items)) throw new Error('No parece un respaldo de PilaLog.');
        confirmar('Restaurar respaldo', 'Se van a agregar o actualizar ' + d.items.length + ' pedidos y ' + (d.trips || []).length + ' viajes del respaldo. Lo que ya tenés no se borra.', 'Restaurar', function () {
          d.items.forEach(function (i) { guardar(S.be.putItem(normItem(i))); });
          (d.trips || []).forEach(function (t) { guardar(S.be.putTrip(t)); });
          if (d.ajustes) guardar(S.be.saveSettings(d.ajustes));
          aviso('Respaldo restaurado');
        });
      } catch (e) { aviso('No se pudo leer el respaldo: ' + e.message); }
    };
    lector.readAsText(archivo);
  }

  function ejemplos() {
    var ahora = Date.now(), n = 0;
    var mk = function (nombre, cant, unidad, cat, extra) {
      n++;
      return Object.assign({ id: uid() + n, nombre: nombre, cant: cant, unidad: unidad, cat: cat, nota: '', urgente: false, estado: 'pedido', precios: [], elegido: null, arrastrado: 0, creado: ahora + n, actualizado: ahora + n, por: rol() }, extra || {});
    };
    var q = function (lugar, monto, pack) {
      var p = { id: uid() + lugar.length, lugar: lugar, monto: monto };
      if (pack > 1) p.pack = pack;
      return p;
    };
    var yerba = [q('Supermercado Pilagá', 4200), q('Mayorista del centro', 3650)];
    [
      mk('Yerba mate', 6, 'kg', 'almacen', { nota: 'La de siempre, paquetes de 1 kilo', urgente: true, precios: yerba, elegido: yerba[1].id }),
      mk('Alambre de púas', 2, 'rollo', 'ferreteria', { nota: 'Para el cerco del potrero norte' }),
      mk('Vacuna antiaftosa', 40, 'u.', 'veterinaria', { precios: [q('Veterinaria Rural', 1900)] }),
      mk('Filtro de aceite', 1, 'u.', 'repuestos', { estado: 'noconseguido', motivo: 'No había para la camioneta', arrastrado: 1 }),
      mk('Sal gruesa', 5, 'bolsa', 'almacen', { estado: 'comprado', precios: [q('Mayorista del centro', 1200)] }),
      mk('Harina 0000', 10, 'kg', 'almacen', { nota: 'Bolsa cerrada de 10 kg', precios: [q('Mayorista del centro', 10500, 10), q('Supermercado Pilagá', 1150)] })
    ].forEach(function (it) { guardar(S.be.putItem(it)); });
    if (!S.ajustes.fechaViaje) { var d = new Date(); d.setDate(d.getDate() + 9); ajustes({ fechaViaje: isoDe(d) }); }
  }

  /* ================================================================ modo invitado */
  function sembrarDemo() {
    if (!esDemo() || S.sembrando || !S.loaded.items || !S.loaded.settings) return;
    if (S.items.length || S.ajustes.demoSembrado) return;
    S.sembrando = true;
    ajustes({ demoSembrado: true });
    ejemplos();
  }

  function limpiarEstado() {
    S.tk++;
    S.desub.forEach(function (f) { try { f(); } catch (e) { /* ya cerrado */ } });
    S.desub = []; S.be = null; S.items = []; S.trips = []; S.ajustes = {}; S.sellos = {};
    S.error = ''; S.tab = 'lista'; S.cb = null; S.sembrando = false;
    S.loaded = { items: false, settings: false };
    S.meta = { pending: false, fromCache: false };
    cerrarSheet();
  }
  function entrarInvitado() {
    ssSet(SES.invitado, '1');
    if (!ssGet(SES.vista)) ssSet(SES.vista, 'javier');
    limpiarEstado();
    S.perfil = perfilDemo();
    conectar();
  }
  function salirInvitado() {
    ssDel(SES.invitado); ssDel(SES.vista);
    limpiarEstado();
    S.perfil = null;
    try {
      var p = JSON.parse(lsGet(LS.perfil) || 'null');
      if (p && codigoValido(p.codigo)) S.perfil = { codigo: p.codigo, rol: p.rol === 'javier' ? 'javier' : 'papa' };
    } catch (e) { /* perfil dañado: vuelve a la bienvenida */ }
    if (S.perfil) conectar(); else render();
  }

  function dictar(boton) {
    var campo = boton.parentElement.querySelector('input');
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { aviso('Este navegador no dicta. Usá el micrófono del teclado.'); return; }
    var rec = new SR();
    rec.lang = 'es-AR';
    rec.interimResults = false;
    rec.onresult = function (e) {
      var t = (e.results[0][0].transcript || '').trim();
      campo.value = t.charAt(0).toUpperCase() + t.slice(1);
    };
    rec.onend = function () { boton.classList.remove('on'); };
    rec.onerror = function () { boton.classList.remove('on'); aviso('No se escuchó bien, probá de nuevo.'); };
    boton.classList.add('on');
    try { rec.start(); } catch (e) { boton.classList.remove('on'); }
  }

  /* ============================================================ acciones (clicks) */
  var ACCIONES = {
    tab: function (id, el) { S.tab = el.dataset.v; render(); window.scrollTo(0, 0); },
    nuevo: function () { sheetItem(null); },
    editar: function (id) { sheetItem(id); },
    cerrarSheet: function () { cerrarSheet(); },
    confirmarOk: function () { var f = S.cb; S.cb = null; cerrarSheet(); if (f) f(); },
    sug: function (id, el) {
      var f = el.closest('form');
      f.elements.nombre.value = el.dataset.n;
      f.elements.unidad.value = el.dataset.u;
      var r = f.querySelector('input[name="cat"][value="' + el.dataset.cat + '"]');
      if (r) r.checked = true;
    },
    paso: function (id, el) {
      var inp = el.parentElement.querySelector('input');
      var v = aNumero(inp.value); if (isNaN(v)) v = 1;
      v = Math.max(0.5, Math.round((v + Number(el.dataset.d)) * 100) / 100);
      inp.value = cantTxt(v);
    },
    dictar: function (id, el) { dictar(el); },
    borrar: function (id) {
      var it = buscar(id);
      confirmar('Eliminar pedido', '¿Sacar “' + (it ? it.nombre : '') + '” de la lista?', 'Sí, eliminar', function () {
        guardar(S.be.removeItem(id)); aviso('Pedido eliminado');
      }, true);
    },
    comprar: function (id) { sheetComprar(id); },
    compradoSinPrecio: function (id) { cerrarSheet(); cambiar(id, { estado: 'comprado', motivo: '' }); aviso('Marcado como comprado'); },
    llevado: function (id) { cambiar(id, { estado: 'llevado' }); aviso('Llevado ✔'); },
    aPedido: function (id) { cambiar(id, { estado: 'pedido' }); },
    aComprado: function (id) { cambiar(id, { estado: 'comprado' }); },
    noConseguido: function (id) { sheetNoConseguido(id); },
    cotizar: function (id) { sheetCotizar(id); },
    elegir: function (id, el) {
      var it = buscar(id);
      if (!it) return;
      cambiar(id, { elegido: it.elegido === el.dataset.q ? null : el.dataset.q });
    },
    borrarCot: function (id, el) {
      var it = buscar(id);
      if (!it) return;
      var q = el.dataset.q;
      cambiar(id, { precios: it.precios.filter(function (p) { return p.id !== q; }), elegido: it.elegido === q ? null : it.elegido });
    },
    fecha: function () { sheetFecha(); },
    quitarFecha: function () { cerrarSheet(); ajustes({ fechaViaje: null }); },
    wapp: function () {
      abrirWapp(esJavier() ? S.ajustes.telPapa : S.ajustes.telJavier, textoLista());
    },
    copiar: function () { copiarTexto(textoLista(), 'Lista copiada'); },
    imprimir: function () { imprimir(); },
    cerrarViaje: function () { sheetCerrarViaje(); },
    escala: function (id, el) {
      lsSet(LS.escala, el.dataset.v);
      aplicarEscala();
      render();
    },
    notif: function () {
      if (!('Notification' in window)) return;
      Notification.requestPermission().then(function (p) {
        aviso(p === 'granted' ? 'Avisos activados' : 'No se activaron los avisos');
        if (p === 'granted') mostrarNotif('PilaLog', 'Listo: los avisos están activados.', 'prueba');
        render();
      });
    },
    instalar: function () {
      var ev = S.instalar;
      if (!ev) { ACCIONES.comoInstalar(); return; }
      ev.prompt();
      ev.userChoice.then(function (r) {
        S.instalar = null;
        if (r && r.outcome === 'accepted') aviso('Instalando PilaLog…');
        render();
      });
    },
    noInstalar: function () { lsSet(LS.instalarOculto, String(Date.now())); render(); },
    comoInstalar: function () {
      abrirSheet('Cómo instalar PilaLog',
        '<p><b>1.</b> Abrí esta página en <b>Chrome</b> (no en el navegador propio de Xiaomi).</p>' +
        '<p><b>2.</b> Tocá los tres puntitos ⋮ de arriba a la derecha.</p>' +
        '<p><b>3.</b> Elegí <b>“Instalar aplicación”</b> o <b>“Agregar a la pantalla principal”</b> y confirmá.</p>' +
        '<div class="acciones"><button class="btn btn-ghost" data-a="cerrarSheet">Entendido</button></div>');
    },
    copiarCodigo: function () { copiarTexto(S.perfil.codigo, 'Código copiado'); },
    linkPapa: function () {
      var txt = 'Papá, esta es la lista de la estancia (PilaLog). Abrí este link en Chrome, tocá los tres puntitos y elegí "Instalar aplicación":\n' + linkPara('papa');
      abrirWapp(S.ajustes.telPapa, txt);
    },
    exportar: function () { exportar(); },
    entrarInvitado: function () { entrarInvitado(); },
    salirInvitado: function () { salirInvitado(); },
    cambiarVista: function () {
      ssSet(SES.vista, esJavier() ? 'papa' : 'javier');
      S.tab = 'lista';
      render();
      window.scrollTo(0, 0);
    },
    reiniciarDemo: function () {
      confirmar('Reiniciar la demo', 'Se borran los cambios que hiciste en la demo y vuelven los ejemplos del principio. La lista real no se toca.', 'Reiniciar', function () {
        lsDel('pilalog:datos:' + DEMO_CODIGO);
        limpiarEstado();
        S.perfil = perfilDemo();
        conectar();
      }, true);
    },
    copiarLinkInvitado: function () { copiarTexto(location.origin + location.pathname + '?invitado=1', 'Link para invitados copiado'); },
    desvincular: function () {
      if (esDemo()) { salirInvitado(); return; }
      confirmar('Salir de esta estancia', 'Este aparato deja de mostrar la lista. La lista no se borra: con el link o el código volvés a entrar.', 'Salir', function () {
        S.desub.forEach(function (f) { try { f(); } catch (e) { /* ya cerrado */ } });
        S.desub = []; S.be = null; S.perfil = null; S.items = []; S.trips = []; S.ajustes = {}; S.error = '';
        S.loaded = { items: false, settings: false };
        lsDel(LS.perfil);
        render();
      }, true);
    },
    reintentar: function () { conectar(); },
    ejemplos: function () { ejemplos(); },
    soyJavier: function () {
      S.perfil = { codigo: nuevoCodigo(), rol: 'javier' };
      lsSet(LS.perfil, JSON.stringify(S.perfil));
      conectar();
    }
  };

  var FORMS = {
    unirse: function (f, ev) {
      var cod = extraerCodigo(f.elements.codigo.value);
      if (!codigoValido(cod)) { aviso('No encuentro el código. Pegá el link completo que te mandó Javier.'); return; }
      var r = ev && ev.submitter && ev.submitter.value === 'javier' ? 'javier' : 'papa';
      S.perfil = { codigo: cod, rol: r };
      lsSet(LS.perfil, JSON.stringify(S.perfil));
      conectar();
    },
    item: function (f) {
      var nombre = f.elements.nombre.value.trim();
      if (!nombre) return;
      var cant = aNumero(f.elements.cant.value);
      var datos = {
        nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
        cant: cant > 0 ? cant : 1,
        unidad: f.elements.unidad.value,
        cat: (f.querySelector('input[name="cat"]:checked') || {}).value || 'otros',
        nota: f.elements.nota.value.trim(),
        urgente: f.elements.urgente.checked
      };
      var id = f.dataset.id;
      cerrarSheet();
      if (id) { cambiar(id, datos); aviso('Cambios guardados'); }
      else {
        var ahora = Date.now();
        guardar(S.be.putItem(Object.assign({ id: uid(), estado: 'pedido', precios: [], elegido: null, arrastrado: 0, creado: ahora, actualizado: ahora, por: rol() }, datos)));
        aviso('Agregado: ' + datos.nombre);
      }
    },
    comprar: function (f) {
      var id = f.dataset.id, it = buscar(id);
      if (!it) return;
      var lugar = f.elements.lugar.value.trim();
      var pr = leerPrecio(f);
      if (pr.error) { aviso(pr.error); return; }
      if (pr.vacio) pr = null;
      else if (!lugar) { aviso('Anotá también el lugar, o borrá el precio.'); return; }
      var parche = { estado: 'comprado', motivo: '' };
      if (pr) {
        var r = aplicarPrecio(it.precios, lugar, pr);
        parche.precios = r.precios; parche.elegido = r.q.id;
      }
      cerrarSheet();
      cambiar(id, parche);
      aviso('Marcado como comprado');
    },
    cotizar: function (f) {
      var id = f.dataset.id, it = buscar(id);
      if (!it) return;
      var lugar = f.elements.lugar.value.trim();
      var pr = leerPrecio(f);
      if (pr.error || pr.vacio) { aviso(pr.error || 'Revisá el precio.'); return; }
      if (!lugar) { aviso('Falta el lugar.'); return; }
      var r = aplicarPrecio(it.precios, lugar, pr);
      cerrarSheet();
      cambiar(id, { precios: r.precios });
      aviso('Precio guardado');
    },
    noConseguido: function (f) {
      var motivo = f.elements.motivo.value.trim();
      var id = f.dataset.id;
      cerrarSheet();
      cambiar(id, { estado: 'noconseguido', motivo: motivo });
      aviso('Anotado: no se consiguió');
    },
    fecha: function (f) {
      var v = f.elements.fecha.value;
      if (!v) return;
      cerrarSheet();
      ajustes({ fechaViaje: v });
      lsDel(LS.aviso);
      aviso('Fecha guardada');
    },
    cerrarViaje: function (f) {
      var v = f.elements.fecha.value || null;
      cerrarSheet();
      cerrarViaje(v);
    },
    tels: function (f) {
      ajustes({ telJavier: f.elements.telJavier.value.trim(), telPapa: f.elements.telPapa.value.trim() });
      aviso('Números guardados');
    }
  };

  var CAMBIOS = {
    avisoDias: function (el) { ajustes({ avisoDias: Number(el.value) }); },
    verCostos: function (el) { ajustes({ verCostosPapa: el.checked }); },
    modoPrecio: function (el) {
      var f = el.closest('form');
      if (!f) return;
      var modo = (f.querySelector('input[name="modo"]:checked') || {}).value || 'unidad';
      var it = buscar(f.dataset.id);
      var un = it && it.unidad !== 'u.' ? it.unidad : 'unidad';
      f.querySelector('[data-r="titMonto"]').textContent = tituloMonto(modo, un);
      f.querySelector('[data-r="campoPack"]').hidden = modo !== 'pack';
    },
    importar: function (el) { if (el.files && el.files[0]) { importar(el.files[0]); el.value = ''; } }
  };

  /* ======================================================================= arranque */
  function aplicarEscala() {
    var e = Number(lsGet(LS.escala)) || 1;
    document.documentElement.style.fontSize = (e * 100) + '%';
  }

  function conectarEventos() {
    document.addEventListener('click', function (ev) {
      var el = ev.target.closest('[data-a]');
      if (!el) return;
      var fn = ACCIONES[el.dataset.a];
      if (fn) { ev.preventDefault(); fn(el.dataset.id, el, ev); }
    });
    document.addEventListener('submit', function (ev) {
      var f = ev.target.closest('form[data-form]');
      if (!f) return;
      ev.preventDefault();
      var fn = FORMS[f.dataset.form];
      if (fn) fn(f, ev);
    });
    document.addEventListener('change', function (ev) {
      var el = ev.target.closest('[data-c]');
      if (el && CAMBIOS[el.dataset.c]) CAMBIOS[el.dataset.c](el);
    });
    window.addEventListener('popstate', function () { if (sheetAbierto) cerrarSheet(true); });
    window.addEventListener('online', function () { S.online = true; render(); });
    window.addEventListener('offline', function () { S.online = false; render(); });
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); S.instalar = e; render(); });
    window.addEventListener('appinstalled', function () { S.instalar = null; aviso('¡PilaLog instalada!'); render(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && S.be) recordatorioDiario(); });
  }

  function arrancar() {
    aplicarEscala();
    conectarEventos();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(function () { /* sin sw: funciona igual, solo sin modo offline */ });
    }
    var url = new URLSearchParams(location.search);
    var c = (url.get('c') || '').toLowerCase();
    if (codigoValido(c)) {
      // Un link real tiene prioridad y borra la marca de invitado.
      ssDel(SES.invitado); ssDel(SES.vista);
      S.perfil = { codigo: c, rol: url.get('r') === 'javier' ? 'javier' : 'papa' };
      lsSet(LS.perfil, JSON.stringify(S.perfil));
      try { history.replaceState(null, '', location.pathname); } catch (e) { /* nada */ }
    } else if (url.get('invitado') === '1' || ssGet(SES.invitado) === '1') {
      ssSet(SES.invitado, '1');
      if (!ssGet(SES.vista)) ssSet(SES.vista, 'javier');
      S.perfil = perfilDemo();
      if (url.get('invitado') === '1') {
        try { history.replaceState(null, '', location.pathname); } catch (e) { /* nada */ }
      }
    } else {
      try {
        var p = JSON.parse(lsGet(LS.perfil) || 'null');
        if (p && codigoValido(p.codigo)) S.perfil = { codigo: p.codigo, rol: p.rol === 'javier' ? 'javier' : 'papa' };
      } catch (e2) { /* perfil dañado: vuelve a la bienvenida */ }
    }
    if (S.perfil) conectar(); else render();
  }

  window.PilaLogApp = { estado: S };   // para depurar desde la consola
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
