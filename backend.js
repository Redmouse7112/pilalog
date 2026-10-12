/* PilaLog · capa de datos
 *
 * Dos motores con exactamente la misma interfaz:
 *   - "local":    guarda en este teléfono (modo prueba, no se comparte)
 *   - "firebase": Firestore compartido entre Papá y Javier, con caché sin
 *                 conexión (si se corta la señal, guarda y sincroniza después)
 *
 * Interfaz:
 *   subscribe(tipo, cb) -> desuscribir()   tipo: 'items' | 'trips' | 'settings'
 *                                          cb(datos, meta)  meta: {pending, fromCache}
 *                                          Si falla: cb(null, {error})
 *   putItem(item) / removeItem(id) / putTrip(trip) / saveSettings(parche)
 *   closeTrip({trip, removeIds, updates, ajustes})   // todo junto, atómico
 */
(function () {
  'use strict';

  var FB_VERSION = '10.14.1';
  var CDN = 'https://www.gstatic.com/firebasejs/' + FB_VERSION;

  function configurado(cfg) {
    return !!(cfg && cfg.apiKey && cfg.projectId && !/PEGAR/i.test(cfg.apiKey + cfg.projectId));
  }

  function limpiar(obj) {
    // Firestore no acepta "undefined"; esto lo saca y deja datos planos.
    return JSON.parse(JSON.stringify(obj));
  }

  /* ---------------------------------------------------------------- local */
  function crearLocal(codigo) {
    var KEY = 'pilalog:datos:' + codigo;
    var META = { pending: false, fromCache: false };
    var subs = { items: new Set(), trips: new Set(), settings: new Set() };
    var db = leer();

    function leer() {
      try {
        var d = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (d) return { items: d.items || {}, trips: d.trips || {}, settings: d.settings || {} };
      } catch (e) { /* datos dañados: se empieza de cero */ }
      return { items: {}, trips: {}, settings: {} };
    }
    function guardar() {
      try { localStorage.setItem(KEY, JSON.stringify(db)); }
      catch (e) { throw new Error('No hay espacio para guardar en este teléfono.'); }
    }
    function vista(tipo) {
      if (tipo === 'settings') return Object.assign({}, db.settings);
      return Object.keys(db[tipo]).map(function (k) { return Object.assign({}, db[tipo][k]); });
    }
    function avisar(tipo) {
      subs[tipo].forEach(function (cb) { cb(vista(tipo), META); });
    }

    window.addEventListener('storage', function (e) {
      if (e.key !== KEY) return;
      db = leer();
      ['items', 'trips', 'settings'].forEach(avisar);
    });

    return {
      mode: 'local',
      code: codigo,
      subscribe: function (tipo, cb) {
        subs[tipo].add(cb);
        setTimeout(function () { cb(vista(tipo), META); }, 0);
        return function () { subs[tipo].delete(cb); };
      },
      putItem: function (it) { db.items[it.id] = limpiar(it); guardar(); avisar('items'); return Promise.resolve(); },
      removeItem: function (id) { delete db.items[id]; guardar(); avisar('items'); return Promise.resolve(); },
      putTrip: function (t) { db.trips[t.id] = limpiar(t); guardar(); avisar('trips'); return Promise.resolve(); },
      saveSettings: function (patch) { Object.assign(db.settings, limpiar(patch)); guardar(); avisar('settings'); return Promise.resolve(); },
      closeTrip: function (op) {
        db.trips[op.trip.id] = limpiar(op.trip);
        op.removeIds.forEach(function (id) { delete db.items[id]; });
        op.updates.forEach(function (it) { db.items[it.id] = limpiar(it); });
        Object.assign(db.settings, limpiar(op.ajustes || {}));
        guardar();
        ['items', 'trips', 'settings'].forEach(avisar);
        return Promise.resolve();
      }
    };
  }

  /* ------------------------------------------------------------- firebase */
  async function crearFirebase(cfg, codigo) {
    var mods = await Promise.all([
      import(CDN + '/firebase-app.js'),
      import(CDN + '/firebase-firestore.js')
    ]);
    var appM = mods[0];
    var fs = mods[1];
    var app = appM.initializeApp(cfg);
    var db;
    try {
      // Caché persistente: funciona sin señal y se sincroniza al volver.
      db = fs.initializeFirestore(app, {
        localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
      });
    } catch (e) {
      db = fs.getFirestore(app);
    }

    var base = ['familias', codigo];
    var colecciones = { items: 'items', trips: 'viajes' };
    var refAjustes = fs.doc.apply(null, [db].concat(base, ['config', 'ajustes']));
    function col(tipo) { return fs.collection.apply(null, [db].concat(base, [colecciones[tipo]])); }
    function docRef(tipo, id) { return fs.doc.apply(null, [db].concat(base, [colecciones[tipo], id])); }
    function metaDe(snap) {
      return { pending: snap.metadata.hasPendingWrites, fromCache: snap.metadata.fromCache };
    }

    return {
      mode: 'firebase',
      code: codigo,
      subscribe: function (tipo, cb) {
        var opts = { includeMetadataChanges: true };
        var onError = function (error) { cb(null, { error: error }); };
        if (tipo === 'settings') {
          return fs.onSnapshot(refAjustes, opts, function (snap) {
            cb(snap.exists() ? snap.data() : {}, metaDe(snap));
          }, onError);
        }
        return fs.onSnapshot(col(tipo), opts, function (snap) {
          cb(snap.docs.map(function (d) { return Object.assign({}, d.data(), { id: d.id }); }), metaDe(snap));
        }, onError);
      },
      // Ojo: estas promesas no se resuelven hasta que el servidor confirma.
      // Sin señal quedan pendientes y la app NO las espera (se guardan igual).
      putItem: function (it) { return fs.setDoc(docRef('items', it.id), limpiar(it)); },
      removeItem: function (id) { return fs.deleteDoc(docRef('items', id)); },
      putTrip: function (t) { return fs.setDoc(docRef('trips', t.id), limpiar(t)); },
      saveSettings: function (patch) { return fs.setDoc(refAjustes, limpiar(patch), { merge: true }); },
      closeTrip: function (op) {
        var b = fs.writeBatch(db);
        b.set(docRef('trips', op.trip.id), limpiar(op.trip));
        op.removeIds.forEach(function (id) { b.delete(docRef('items', id)); });
        op.updates.forEach(function (it) { b.set(docRef('items', it.id), limpiar(it)); });
        b.set(refAjustes, limpiar(op.ajustes || {}), { merge: true });
        return b.commit();
      }
    };
  }

  /* ------------------------------------------------------------------ API */
  window.PilaBackend = {
    configurado: function () { return configurado(window.PILALOG_FIREBASE); },
    crear: function (codigo, opciones) {
      // Modo invitado: siempre motor local, sin cargar nunca Firebase.
      if (opciones && opciones.local) return Promise.resolve(crearLocal(codigo));
      if (configurado(window.PILALOG_FIREBASE)) return crearFirebase(window.PILALOG_FIREBASE, codigo);
      return Promise.resolve(crearLocal(codigo));
    }
  };
})();
