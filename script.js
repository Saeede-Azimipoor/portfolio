(function () {
  var dialogs = document.querySelectorAll('dialog');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnimate = !reduceMotion && typeof window.gsap !== 'undefined';

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    if (!canAnimate) return;
    gsap.fromTo(dialog,
      { autoAlpha: 0, y: 18, scale: .94 },
      { autoAlpha: 1, y: 0, scale: 1, duration: .34, ease: 'back.out(1.45)', overwrite: true }
    );
  }

  function closeDialog(dialog) {
    if (!dialog || !dialog.open) return;
    if (!canAnimate) {
      dialog.close();
      return;
    }
    gsap.to(dialog, {
      autoAlpha: 0,
      y: 12,
      scale: .97,
      duration: .2,
      ease: 'power2.in',
      overwrite: true,
      onComplete: function () {
        dialog.close();
        gsap.set(dialog, { clearProps: 'opacity,visibility,transform' });
      }
    });
  }

  // --- cat meow: a happy little bounce ---
  function meow(target) {
    if (!canAnimate || !target) return;
    gsap.timeline({ overwrite: true })
      .to(target, { y: -14, scale: 1.05, transformOrigin: '50% 100%', duration: 0.16, ease: 'power2.out' })
      .to(target, { y: 0, scale: 1, duration: 0.35, ease: 'bounce.out' });
  }

  // --- "I love cats" label above the girl's head ---
  var loveTip = document.getElementById('girlLoveTip');
  function placeLoveTip() {
    var head = document.getElementById('head');
    if (!stage || !loveTip || !head) return;
    var stageRect = stage.getBoundingClientRect();
    var r = head.getBoundingClientRect();
    loveTip.textContent = 'I love cats';
    loveTip.style.left = (r.left + r.width / 2 - stageRect.left) + 'px';
    loveTip.style.top = (r.top - stageRect.top - 6) + 'px';
    loveTip.classList.add('show');
  }
  function hideLoveTip() {
    if (loveTip) loveTip.classList.remove('show');
  }
  // --- steam rising from the mug ---
  function addSteam() {
    if (!canAnimate) return;
    var svg = stage.querySelector('svg');
    var mug = document.getElementById('mug');
    if (!svg || !mug) return;
    var box = mug.getBBox();
    if (!box.width) return;
    var w = box.width;
    var topY = box.y + box.height * 0.05;
    var sw = w * 0.09;        // stroke width, scales with the mug
    var rise = box.height * 0.7;
    var amp = w * 0.16;       // sideways sway
    var u = w * 0.16;         // wave unit
    var NS = 'http://www.w3.org/2000/svg';
    for (var i = 0; i < 3; i++) {
      var x = box.x + w / 2 + (i - 1) * w * 0.24;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d',
        'M' + x.toFixed(1) + ',' + topY.toFixed(1) +
        'c' + (-u).toFixed(1) + ',' + (-u * 1.2).toFixed(1) +
        ' ' + u.toFixed(1) + ',' + (-u * 2.2).toFixed(1) +
        ' 0,' + (-u * 3.2).toFixed(1) +
        'c' + (-u).toFixed(1) + ',' + (-u * 1.2).toFixed(1) +
        ' ' + u.toFixed(1) + ',' + (-u * 2.2).toFixed(1) +
        ' 0,' + (-u * 3.2).toFixed(1));
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', '#dbe2e9');
      p.setAttribute('stroke-width', sw.toFixed(1));
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('opacity', '0');
      p.setAttribute('pointer-events', 'none');
      svg.appendChild(p);
      gsap.timeline({ repeat: -1, delay: i * 0.9 })
        .fromTo(p, { opacity: 0, y: 12 }, { opacity: 0.6, y: -rise * 0.3, duration: 1.1, ease: 'sine.out' }, 0)
        .to(p, { y: -rise, opacity: 0, duration: 1.7, ease: 'sine.in' }, 1.1)
        .to(p, { x: amp, duration: 0.95, ease: 'sine.inOut' }, 0)
        .to(p, { x: -amp, duration: 0.95, ease: 'sine.inOut' }, 0.95)
        .to(p, { x: 0, duration: 0.9, ease: 'sine.inOut' }, 1.9);
    }
  }
  // --- gentle breathing sway for the plant leaves (pot stays still) ---
  function swayPlant() {
    if (!canAnimate) return;
    var leaves = document.getElementById('plant-leaves');
    if (!leaves || !leaves.children.length) return;
    Array.prototype.forEach.call(leaves.children, function (leaf, i) {
      gsap.fromTo(leaf, { rotation: -1.8 }, {
        rotation: 1.8,
        transformOrigin: '50% 100%',
        duration: 2.8 + (i % 3) * 0.45,
        delay: (i % 3) * 0.35,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    });
  }
  fetch('clock.svg')
    .then(function (res) { return res.text(); })
    .then(function (svgText) {
      document.getElementById('clockStage').innerHTML = svgText;
      startClock();
      initClockGreeting();
    })
    .catch(function (err) { console.log('clock failed', err); });

  // --- working wall clock (visitor's own system time) ---
  function startClock() {
    var clock = document.getElementById('clock');
    var hour = document.getElementById('clock-hour');
    var minute = document.getElementById('clock-minute');
    var second = document.getElementById('clock-second');
    if (!clock || (!hour && !minute && !second)) return;
    var box = clock.getBBox();
    var origin = (box.x + box.width / 2) + ' ' + (box.y + box.height / 2);

    // keep any rotate() Illustrator left on a hand as its base angle
    function baseAngle(el) {
      if (!el || !el.transform) return 0;
      var t = el.transform.baseVal.consolidate();
      if (!t) return 0;
      return Math.atan2(t.matrix.b, t.matrix.a) * 180 / Math.PI;
    }
    var hourBase = baseAngle(hour);
    var minuteBase = baseAngle(minute);
    var secondBase = baseAngle(second);

    function tick() {
      var now = new Date(); // visitor's own system time
      var s = now.getSeconds() + now.getMilliseconds() / 1000;
      var m = now.getMinutes() + s / 60;
      var h = (now.getHours() % 12) + m / 60;
      if (second) gsap.set(second, { rotation: secondBase + s * 6, svgOrigin: origin });
      if (minute) gsap.set(minute, { rotation: minuteBase + m * 6, svgOrigin: origin });
      if (hour) gsap.set(hour, { rotation: hourBase + h * 30, svgOrigin: origin });
    }
    tick();
    if (!canAnimate) return;
    gsap.ticker.add(tick);
  }

  // --- time-based greeting above the clock ---
  function clockGreeting() {
    var h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 22) return 'Good evening';
    return 'Good night';
  }
  function initClockGreeting() {
    var stage = document.getElementById('clockStage');
    if (!stage) return;
    stage.insertAdjacentHTML('beforeend', '<span class="hint" id="clockGreeting"></span>');
    stage.setAttribute('tabindex', '0');
    var tip = document.getElementById('clockGreeting');
    function refresh() { tip.textContent = clockGreeting(); }
    refresh();
    stage.addEventListener('mouseenter', refresh);
    stage.addEventListener('touchstart', refresh, { passive: true });
    setInterval(refresh, 60000);
  }


  function wiggle(target) {
    if (!canAnimate) return;
    gsap.killTweensOf(target);
    gsap.fromTo(target,
      { rotation: -1.6, transformOrigin: '50% 75%' },
      {
        keyframes: [
          { rotation: 2.2, duration: .1 },
          { rotation: -1.2, duration: .1 },
          { rotation: 0, duration: .14 }
        ], ease: 'none', overwrite: true
      }
    );
  }

  document.querySelectorAll('[data-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var dialog = document.getElementById(trigger.getAttribute('data-modal'));
      wiggle(trigger);
      openDialog(dialog);
    });
  });

  dialogs.forEach(function (dialog) {
    dialog.querySelector('.close').addEventListener('click', function () { closeDialog(dialog); });
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeDialog(dialog);
    });
    dialog.addEventListener('click', function (event) {
      var rect = dialog.getBoundingClientRect();
      var inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) closeDialog(dialog);
    });
  });

  var stage = document.querySelector('.character-stage');
  var tip = document.getElementById('svgTip');

  function placeTip(target, text) {
    if (!stage || !tip) return;
    var stageRect = stage.getBoundingClientRect();
    var r = target.getBoundingClientRect();
    tip.textContent = text;
    tip.style.left = (r.left + r.width / 2 - stageRect.left) + 'px';
    tip.style.top = (r.top - stageRect.top - 6) + 'px';
    tip.classList.add('show');
  }
  function hideTip() { if (tip) tip.classList.remove('show'); }

  function tipTarget(layer) {
    return (layer.tipAnchor && document.getElementById(layer.tipAnchor)) || layer.el;
  }

  function wireSvgLayers() {





    var svgLayers = [
      {
        el: document.getElementById('github-frame'), tip: 'GitHub', label: "Open Saeede's GitHub profile",
        run: function () { window.open('https://github.com/Saeede-Azimipoor', '_blank', 'noopener'); }
      },
      {
        el: document.getElementById('linkedin-frame'), tip: 'LinkedIn', label: "Open Saeede's LinkedIn profile",
        run: function () { window.open('https://www.linkedin.com/in/saeede-azimi/', '_blank', 'noopener'); }
      },

      {
        el: document.getElementById('Laptop'), tip: 'Resume', label: 'Open resume',
        run: function () { openDialog(document.getElementById('resume')); }
      },
      {
        el: document.getElementById('task-frame'), tip: 'View Projects', label: 'View projects',
        run: function () { openDialog(document.getElementById('work')); }
      },
      {
        el: document.getElementById('girl'), tip: 'HELLO!', label: 'Meet Saeede',
        tipAnchor: 'head',
        skipWhen: '#Laptop',
        noWiggle: true,
        run: function () { openDialog(document.getElementById('about')); }
      },
      {
        el: document.getElementById('cat'), tip: 'purrr', label: 'Pet the cat',
        onEnter: function (el) { meow(el); placeTip(el, 'purrr'); placeLoveTip(); },
        onLeave: function () { hideLoveTip(); },
        run: function () { meow(document.getElementById('cat')); }
      }
    ];

    svgLayers.forEach(function (layer) {
      var el = layer.el;
      if (!el) return;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', layer.label);
      el.addEventListener('pointerenter', function () {
        if (layer.skipWhen && document.querySelector(layer.skipWhen + ':hover')) return;
        if (layer.onEnter) { layer.onEnter(el); return; }
        if (!layer.noWiggle) wiggle(el);
        placeTip(tipTarget(layer), layer.tip);
      });
      el.addEventListener('pointerleave', function () {
        if (layer.onLeave) layer.onLeave(el);
        hideTip();
      });
      el.addEventListener('pointerdown', function () {
        if (layer.skipWhen && document.querySelector(layer.skipWhen + ':hover')) return;
        if (layer.onEnter) return;
        if (!layer.noWiggle) wiggle(el);
      });
      el.addEventListener('focus', function () { placeTip(tipTarget(layer), layer.tip); });
      el.addEventListener('blur', hideTip);
      el.addEventListener('click', function (event) {
        event.stopPropagation();
        layer.run();
      });
      el.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          layer.run();
        }
      });
    });
  }

  if (canAnimate) {
    document.querySelectorAll('.dust').forEach(function (dot, index) {
      gsap.to(dot, {
        x: index % 2 ? -8 : 9,
        y: index % 3 ? -16 : -11,
        scale: 1.25 + index * .05,
        opacity: .25,
        duration: 4.6 + index * .55,
        delay: index * -.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    });
    gsap.to('.laptop-glow', { opacity: .44, scale: 1.12, duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }

  fetch('scene.svg')
    .then(function (response) {
      if (!response.ok) throw new Error('scene.svg could not be loaded');
      return response.text();
    })
    .then(function (svgText) {
      stage.insertAdjacentHTML('afterbegin', svgText.replace(/<\?xml[^?]*\?>\s*/, ''));
      stage.querySelector('svg').classList.add('mascot-character');
      wireSvgLayers();
      addSteam();
      swayPlant();

      if (canAnimate) {
        gsap.timeline({ defaults: { ease: 'power3.out' } })
          .from('.mascot-character', { autoAlpha: 0, duration: .62 });
      }
    })
    .catch(function () {
      if (tip) {
        tip.textContent = 'Could not load scene.svg';
        tip.classList.add('show');
      }
    });
}());
