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

function wireSvgLayers() {
  var boardGroups = document.querySelectorAll('#board > g');
  var svgLayers = [
    {
      el: document.getElementById('Laptop'), tip: 'View Projects', label: 'View projects',
      run: function () { openDialog(document.getElementById('work')); }
    },
    {
      el: boardGroups[2], tip: 'Resume', label: 'Open resume',
      run: function () { openDialog(document.getElementById('resume')); }
    },
    {
      el: boardGroups[0], tip: 'GitHub', label: "Open Saeede's GitHub profile",
      run: function () { window.open('https://github.com/Saeede-Azimipoor', '_blank', 'noopener'); }
    },
    {
      el: document.getElementById('girl'), tip: 'HELLO!', label: 'Meet Saeede',
      skipWhen: '#Laptop',
      noWiggle: true,
      run: function () { openDialog(document.getElementById('about')); }
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
      if (!layer.noWiggle) wiggle(el);
      placeTip(el, layer.tip);
    });
    el.addEventListener('pointerleave', hideTip);
    el.addEventListener('pointerdown', function () {
      if (layer.skipWhen && document.querySelector(layer.skipWhen + ':hover')) return;
      if (!layer.noWiggle) wiggle(el);
    });
    el.addEventListener('focus', function () { placeTip(el, layer.tip); });
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
