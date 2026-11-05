/* Easy TAP: interacción de la página */
(function () {
  'use strict';

  var WHATSAPP = '528719676251'; // Número que recibe los formularios

  document.documentElement.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  $('#year').textContent = new Date().getFullYear();

  /* Encabezado y menú */
  var header = $('.site-header');
  var nav = $('#nav');
  var toggle = $('.nav-toggle');
  function onScroll() { header.classList.toggle('is-stuck', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setNav(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    $('use', toggle).setAttribute('href', open ? '#i-close' : '#i-bars');
    if (open) header.classList.add('is-stuck'); else onScroll();
  }
  toggle.addEventListener('click', function () { setNav(!nav.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });

  /* Aparición al hacer scroll */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(function (el) { revealIO.observe(el); });

  /* Logos en movimiento: se duplican para que el ciclo no tenga cortes */
  if (!reduced) {
    $$('[data-marquee] .marquee__track').forEach(function (track) {
      $$('li', track).forEach(function (li) {
        var c = li.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        $('img', c).alt = '';
        track.appendChild(c);
      });
    });
  }

  /* Campo de señal del hero: cada toque manda una onda, como el NFC */
  (function field() {
    var canvas = $('#field');
    var hero = $('#hero');
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, gap = 30, dots = [], waves = [], visible = true, raf = 0, lastAuto = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var SPEED = 0.42, BAND = 90, LIFE = 3200;

    function size() {
      var r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      gap = w < 700 ? 26 : 32;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (var y = gap / 2; y < h; y += gap) for (var x = gap / 2; x < w; x += gap) dots.push(x, y);
      if (reduced) draw(0);
    }

    function origin() {
      var s = $('#demo').getBoundingClientRect(), r = hero.getBoundingClientRect();
      return { x: s.left - r.left + s.width * .5, y: s.top - r.top + s.height * .5 };
    }

    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      waves = waves.filter(function (a) { return now - a.t < LIFE; });
      for (var i = 0; i < dots.length; i += 2) {
        var x = dots[i], y = dots[i + 1], glow = 0;
        for (var k = 0; k < waves.length; k++) {
          var a = waves[k], age = now - a.t;
          var d = Math.hypot(x - a.x, y - a.y) - age * SPEED;
          if (d > -BAND && d < BAND) glow += Math.exp(-(d * d) / (BAND * BAND / 3)) * (1 - age / LIFE);
        }
        glow = Math.min(glow, 1);
        ctx.fillStyle = glow > .02 ? 'rgba(87,242,133,' + (0.1 + glow * .85) + ')' : 'rgba(226,244,232,.1)';
        var s = 1.3 + glow * 1.7;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
    }

    function loop(now) {
      if (!visible || document.hidden) { raf = 0; return; }
      if (now - lastAuto > 3400) { lastAuto = now; var o = origin(); o.t = now; waves.push(o); }
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && !reduced) raf = requestAnimationFrame(loop); }

    size();
    var resizeT;
    window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(size, 150); });
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }).observe(hero);
    document.addEventListener('visibilitychange', start);
    if (!reduced) {
      hero.addEventListener('pointerdown', function (e) {
        var r = hero.getBoundingClientRect();
        waves.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
      });
    }
    start();
  })();

  /* Video del hero: se reproduce en silencio solo cuando está en pantalla */
  (function video() {
    var v = $('#heroVideo');
    var btn = $('#soundBtn');
    var saveData = navigator.connection && navigator.connection.saveData;
    var withSound = false;

    if (!reduced && !saveData) {
      new IntersectionObserver(function (e) {
        if (withSound) { if (!e[0].isIntersecting) v.pause(); return; }
        if (e[0].isIntersecting) { var p = v.play(); if (p) p.catch(function () {}); } else { v.pause(); }
      }, { threshold: .25 }).observe(v);
    }

    btn.addEventListener('click', function () {
      withSound = true;
      v.currentTime = 0;
      v.muted = false;
      v.controls = true;
      btn.hidden = true;
      v.play();
      v.focus();
    });
  })();

  /* Simulación de la IA */
  (function sim() {
    var root = $('#iaSim');
    var body = $('#chatBody');
    var status = $('#chatStatus');
    var call = $('#callCard');
    var ticket = $('#ticket');
    var nodes = $$('#iaFlow li');
    var timers = [];

    function node(n) { nodes.forEach(function (li, i) { li.classList.toggle('is-on', i <= n); }); }
    function say(cls, text, label) {
      var m = document.createElement('div');
      m.className = 'msg ' + cls;
      if (label) { var s = document.createElement('small'); s.textContent = label; m.appendChild(s); }
      m.appendChild(document.createTextNode(text));
      body.appendChild(m);
      return m;
    }
    function typing() {
      var m = document.createElement('div');
      m.className = 'msg msg--bot msg--typing';
      m.innerHTML = '<i></i><i></i><i></i>';
      body.appendChild(m);
      return m;
    }
    var q1 = '¿Qué se te antoja hoy?';
    var a1 = 'Una gringa y un refresco';
    var q2 = '¡Claro! ¿Gringa normal o ranchera? ¿De qué carne la quieres? ¿Y de qué refresco?';
    var a2 = 'Gringa ranchera sin queso, de arrachera, y Coca Cola Zero';
    var sent = 'Pedido enviado al POS';

    function reset() {
      timers.forEach(clearTimeout); timers = [];
      body.innerHTML = '';
      call.classList.remove('is-on');
      ticket.classList.remove('is-on');
      node(-1);
      status.textContent = 'en línea';
    }
    function finalState() {
      say('msg--bot', q1, 'Asistente IA');
      say('msg--user', a1);
      say('msg--bot', q2, 'Asistente IA');
      say('msg--user', a2);
      say('msg--sent', sent);
      ticket.classList.add('is-on');
      node(3);
    }
    function play() {
      reset();
      if (reduced) { finalState(); return; }
      var tp;
      var script = [
        [300, function () { node(0); call.classList.add('is-on'); status.textContent = 'atendida por IA'; }],
        [900, function () { tp = typing(); }],
        [1000, function () { tp.remove(); node(1); say('msg--bot', q1, 'Asistente IA'); }],
        [1300, function () { say('msg--user', a1); }],
        [700, function () { tp = typing(); }],
        [1300, function () { tp.remove(); say('msg--bot', q2, 'Asistente IA'); }],
        [1900, function () { say('msg--user', a2); }],
        [900, function () { call.classList.remove('is-on'); node(2); say('msg--sent', sent); }],
        [900, function () { node(3); ticket.classList.add('is-on'); }]
      ];
      var t = 0;
      script.forEach(function (s) { t += s[0]; timers.push(setTimeout(s[1], t)); });
    }

    var started = false;
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting && !started) { started = true; play(); }
    }, { threshold: .25 }).observe(root);
    $('#simReplay').addEventListener('click', play);
  })();

  /* Diálogos: visor de imágenes y aviso de privacidad */
  (function dialogs() {
    var box = $('#lightbox'), img = $('#lightboxImg'), cap = $('#lightboxCap'), priv = $('#privacy');
    $$('[data-lightbox]').forEach(function (b) {
      b.addEventListener('click', function () {
        img.src = b.getAttribute('data-lightbox');
        img.alt = $('img', b).alt;
        cap.textContent = b.getAttribute('data-caption');
        box.showModal();
      });
    });
    $$('[data-open-privacy]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); priv.showModal(); });
    });
    [box, priv].forEach(function (d) {
      d.addEventListener('click', function (e) {
        if (e.target === d || e.target.closest('[data-close]')) d.close();
      });
    });
  })();

  /* Formulario de diagnóstico que termina en WhatsApp */
  (function wizard() {
    var form = $('#diagForm');
    var steps = $$('.step', form);
    var bars = $$('.progress li', form);
    var prev = $('#prev'), next = $('#next'), send = $('#send');
    var statusEl = $('#stepStatus');
    var done = $('#done'), nav = $('#wizNav'), again = $('#waAgain');
    var previewEl = $('#preview');
    var current = 0;

    function val(name) {
      var el = form.elements[name];
      return el && typeof el.value === 'string' ? el.value.trim() : '';
    }
    function checked(name) {
      return $$('input[name="' + name + '"]:checked', form).map(function (i) { return i.value; });
    }
    function digits() {
      var d = val('tel').replace(/\D/g, '');
      if (d.length === 12 && d.indexOf('52') === 0) d = d.slice(2);
      if (d.length === 13 && d.indexOf('521') === 0) d = d.slice(3);
      return d;
    }

    function setErr(id, msg) {
      var e = $('#e-' + id);
      if (!e) return;
      e.textContent = msg || '';
      var field = e.closest('.field');
      if (field) field.classList.toggle('is-invalid', !!msg);
      var input = form.elements[id];
      if (input && input.setAttribute) {
        if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'e-' + id); }
        else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
      }
    }

    function validate(step) {
      var firstBad = null;
      function check(id, ok, msg, focusEl) {
        setErr(id, ok ? '' : msg);
        if (!ok && !firstBad) firstBad = focusEl;
      }
      if (step === 0) {
        check('negocio', !!val('negocio'), 'Escribe el nombre de tu negocio.', form.elements.negocio);
        check('giro', checked('giro').length > 0, 'Elige el giro de tu negocio.', $('input[name="giro"]', form));
      }
      if (step === 1) {
        check('retos', checked('retos').length > 0, 'Elige al menos una opción.', $('input[name="retos"]', form));
      }
      if (step === 2) {
        check('nombre', !!val('nombre'), 'Escribe tu nombre.', form.elements.nombre);
        check('tel', digits().length === 10, 'Escribe un número de 10 dígitos.', form.elements.tel);
        check('aviso', form.elements.aviso.checked, 'Necesitamos que aceptes el aviso de privacidad.', form.elements.aviso);
      }
      if (firstBad) firstBad.focus();
      return !firstBad;
    }

    function message() {
      var giro = checked('giro')[0] || '';
      if (giro === 'Otro' && val('giroOtro')) giro = val('giroOtro');
      var lines = [
        'Hola Easy TAP, llené el formulario de su página:',
        '',
        '*Negocio:* ' + val('negocio'),
        '*Giro:* ' + giro,
        '*Ciudad:* ' + val('ciudad'),
        '*Sucursales:* ' + val('sucursales'),
        '',
        '*Retos tecnológicos:*'
      ];
      checked('retos').forEach(function (r) { lines.push('• ' + r); });
      if (val('detalle')) lines.push('', '*Detalle:* ' + val('detalle'));
      lines.push(
        '',
        '*Administra con:* ' + val('usa'),
        '*Le interesa:* ' + val('busca'),
        '*Para cuándo:* ' + val('cuando'),
        '',
        '*Contacto:* ' + val('nombre') + ', ' + digits()
      );
      return lines.join('\n');
    }
    function waUrl() { return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(message()); }

    function show(n, focus) {
      current = n;
      steps.forEach(function (s, i) { s.hidden = i !== n; s.classList.toggle('is-on', i === n); });
      bars.forEach(function (b, i) { b.classList.toggle('is-on', i <= n); });
      prev.hidden = n === 0;
      next.hidden = n === steps.length - 1;
      send.hidden = n !== steps.length - 1;
      statusEl.textContent = 'Paso ' + (n + 1) + ' de ' + steps.length;
      if (n === steps.length - 1) previewEl.textContent = message();
      if (focus) {
        var legend = $('legend', steps[n]);
        legend.focus({ preventScroll: true });
        var top = form.closest('.wizard').getBoundingClientRect().top;
        if (top < 70) window.scrollBy({ top: top - 90, behavior: reduced ? 'auto' : 'smooth' });
      }
    }

    next.addEventListener('click', function () { if (validate(current)) show(current + 1, true); });
    prev.addEventListener('click', function () { show(current - 1, true); });

    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio') {
        e.preventDefault();
        if (current < steps.length - 1) next.click(); else send.click();
      }
    });

    form.addEventListener('change', function (e) {
      if (e.target.name === 'giro') {
        var extra = $('#f-giro-otro');
        extra.hidden = e.target.value !== 'Otro';
        if (!extra.hidden) extra.focus();
        setErr('giro', '');
      }
      if (e.target.name === 'retos') setErr('retos', '');
      if (e.target.name === 'aviso') setErr('aviso', '');
    });
    form.addEventListener('input', function (e) {
      if (e.target.name === 'negocio' || e.target.name === 'nombre' || e.target.name === 'tel') setErr(e.target.name, '');
      if (current === steps.length - 1) previewEl.textContent = message();
    });
    form.addEventListener('change', function () {
      if (current === steps.length - 1) previewEl.textContent = message();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (current !== steps.length - 1) { next.click(); return; }
      if (!validate(current)) return;
      var url = waUrl();
      again.href = url;
      window.open(url, '_blank', 'noopener');
      steps.forEach(function (s) { s.hidden = true; });
      $('.progress', form).hidden = true;
      nav.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      statusEl.textContent = 'Formulario listo. Presiona enviar en WhatsApp.';
    });

    $('#restart').addEventListener('click', function () {
      form.reset();
      $('#f-giro-otro').hidden = true;
      done.hidden = true;
      nav.hidden = false;
      $('.progress', form).hidden = false;
      show(0, true);
    });

    /* Los botones de paquete dejan seleccionada su opción */
    $$('[data-package]').forEach(function (a) {
      a.addEventListener('click', function () {
        form.elements.busca.value = a.getAttribute('data-package');
      });
    });

    show(0, false);
  })();

  /* El botón flotante solo aparece fuera del hero y del formulario */
  (function floatCta() {
    var cta = $('#floatCta');
    var hero = $('#hero');
    var form = $('#diagnostico');
    var seen = { hero: true, diagnostico: false };
    function update() { cta.classList.toggle('is-hidden', seen.hero || seen.diagnostico); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      update();
    }, { threshold: .15 });
    io.observe(hero);
    io.observe(form);
    update();
  })();
})();
