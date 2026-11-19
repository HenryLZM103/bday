/* ============================================================
 *  app.js —— 逻辑，不需要改
 * ============================================================ */
(function () {
  'use strict';

  var C = window.CONTENT;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  document.title = C.name + ' 的 ' + C.year;

  // 「第 N 天」：从 startDate 算到今天，每天打开都不一样
  function daysSince(d) {
    if (!d) return null;
    var start = new Date(d + 'T00:00:00');
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((today - start) / 86400000) + 1;
  }
  var DAYS = daysSince(C.startDate);
  function fillDays(s) {
    return DAYS ? String(s).replace(/\{days\}/g, DAYS) : String(s).replace(/\{days\}/g, '');
  }

  // 水豚：有噜妹就显示一对
  (function () {
    var CH = C.characters || {};
    var lulu = $('#capy-lulu'), mei = $('#capy-mei'), heart = $('#capy-heart'), label = $('#capy-label');
    if (!CH.lulu && !CH.mei) {
      var box = $('.capy'); if (box) box.remove();
      if (label) label.remove();
      return;
    }
    if (CH.lulu && lulu) { lulu.src = CH.lulu; lulu.hidden = false; }
    if (CH.mei && mei) {
      mei.src = CH.mei;
      mei.hidden = false;
      heart.hidden = false;
      label.hidden = false;
      label.textContent = '噜噜 & 噜妹';
    }
  })();

  var params = new URLSearchParams(location.search);
  var NOANIM = params.get('noanim') === '1';
  if (NOANIM) document.documentElement.classList.add('noanim');
  if (params.get('theme') === 'night') document.body.classList.add('theme-night');
  var stage = $('#stage');
  var screens = [];
  var current = 0;

  /* ---------------- 填充静态文案 ---------------- */

  function setText(sel, text) {
    var el = $(sel);
    if (el) el.textContent = text || '';
  }

  // 封面
  setText('#cover-kicker', C.cover.kicker);
  setText('#cover-year', C.year);
  setText('#cover-name', C.name);
  setText('#cover-title-suffix', ' ' + C.cover.title);
  setText('#cover-sub', C.cover.sub);
  setText('#cover-hint', C.cover.hint);

  // 数据
  setText('#stats-kicker', C.stats.kicker);
  setText('#stats-title', C.stats.title);
  $('#stats-list').innerHTML = C.stats.items.map(function (it, i) {
    return '<li class="stat rv" style="--d:' + (0.12 + i * 0.09) + 's">' +
      '<span class="stat__num" data-count="' + it.value + '">0</span>' +
      '<span class="stat__unit">' + it.unit + '</span>' +
      '<span class="stat__label">' + it.label + '</span>' +
      '</li>';
  }).join('');

  // 最幸福的瞬间
  setText('#hap-kicker', C.happiest.kicker);
  setText('#hap-tag', C.happiest.tag);
  setText('#hap-quote', C.happiest.quote);
  setText('#hap-note', C.happiest.note);
  var hapImg = $('#hap-img');
  hapImg.src = C.happiest.img;

  // 告白页
  var futureScreen = $('.screen.future');
  var VER = params.get('v') === '8' ? 8 : 16;
  var LETTERS = VER === 8 ? (C.letters8 || []) : (C.letters16 || []);

  LETTERS.forEach(function (l, i) {
    var sec = document.createElement('section');
    sec.className = 'screen letter';
    if (l.big) sec.className += ' letter--big';
    if (l.lead) sec.className += ' letter--lead';
    if (l.imgs && l.imgs.length) sec.className += ' letter--photo';
    if (l.body.length > 1) sec.className += ' letter--p2';
    sec.dataset.kind = 'letter';

    var no = String(i + 1).padStart(2, '0');
    var body = l.body.map(function (p) { return '<p>' + fillDays(p) + '</p>'; }).join('');

    var media = '';
    if (l.imgs && l.imgs.length === 1) {
      media = '<figure class="shot' + (l.wide ? ' shot--wide' : '') + '">' +
                '<img src="' + l.imgs[0] + '" alt="" loading="lazy">' +
              '</figure>';
    } else if (l.imgs && l.imgs.length > 1) {
      media = '<div class="shot-row' + (l.strip ? ' shot-row--strip' : '') + '">' +
                l.imgs.map(function (u) {
                  return '<img src="' + u + '" alt="" loading="lazy">';
                }).join('') +
              '</div>';
    }

    sec.innerHTML =
      '<span class="letter__no">' + no + '</span>' +
      '<div class="wrap">' +
        '<div class="letter__body rv" style="--d:.15s">' + body + '</div>' +
        (media ? '<div class="rv" style="--d:.32s">' + media + '</div>' : '') +
      '</div>';
    stage.insertBefore(sec, futureScreen);
  });

  // 展望
  setText('#fut-kicker', C.future.kicker);
  setText('#fut-title', C.future.title);
  $('#fut-list').innerHTML =
    C.future.items.map(function (t, i) {
      return '<li class="rv" style="--d:' + (0.1 + i * 0.07) + 's">' + t + '</li>';
    }).join('') +
    '<li class="is-done rv" style="--d:' + (0.1 + C.future.items.length * 0.07) + 's">' +
      C.future.done + '</li>';

  // 结尾
  setText('#end-text', C.ending.text);
  setText('#end-sub', C.ending.sub);

  if (C.simple) {
    ['stats', 'happiest', 'future'].forEach(function (k) {
      var el = document.querySelector('.screen[data-kind="' + k + '"]');
      if (el) el.remove();
    });
  }

  /* ---------------- 进度点 ---------------- */

  screens = Array.prototype.slice.call(stage.querySelectorAll('.screen'));
  var dots = $('#dots');
  dots.innerHTML = screens.map(function () { return '<i></i>'; }).join('');
  var dotEls = Array.prototype.slice.call(dots.children);

  function setActive(i) {
    if (i === current && dots.classList.contains('show')) return;
    current = i;
    dotEls.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    dots.classList.add('show');
  }

  /* ---------------- 入场动画 ---------------- */

  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        countUp(e.target);
        revealIO.unobserve(e.target);
      }
    });
  }, { root: stage, threshold: 0.32 });

  screens.forEach(function (s) { revealIO.observe(s); });

  var activeIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && e.intersectionRatio > 0.55) {
        setActive(screens.indexOf(e.target));
      }
    });
  }, { root: stage, threshold: [0.55, 0.9] });

  screens.forEach(function (s) { activeIO.observe(s); });

  /* ---------------- 数字滚动 ---------------- */

  function countUp(sec) {
    var nodes = sec.querySelectorAll('[data-count]');
    if (!nodes.length) return;
    if (NOANIM) {
      nodes.forEach(function (el) { el.textContent = Number(el.dataset.count).toLocaleString('en-US'); });
      return;
    }
    nodes.forEach(function (el) {
      var target = parseFloat(el.dataset.count) || 0;
      var dur = 1100;
      var t0 = performance.now();
      function tick(now) {
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString('en-US');
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------------- 开场 ---------------- */

  var intro = $('#intro');
  var bar = $('#intro-bar');
  var pct = $('#intro-pct');
  var introText = $('#intro-text');

  var jumpTo = parseInt(params.get('s'), 10);

  function finishIntro() {
    intro.classList.add('hide');
    dots.classList.add('show');
    var first = jumpTo > 0 && jumpTo < screens.length ? jumpTo : 0;
    if (first > 0) {
      stage.scrollTop = screens[first].offsetTop;
    }
    setTimeout(function () { screens[first].classList.add('in'); countUp(screens[first]); }, 120);
    setTimeout(function () { intro.remove(); }, 1100);
  }

  var enter = $('#intro-enter');

  enter.addEventListener('click', function () {
    playBgm();
    finishIntro();
  }, { once: true });

  if (params.get('fast') === '1') {
    intro.remove();
    finishIntro();
  } else if (NOANIM) {
    screens.forEach(function (s) { s.classList.add('in'); });
    dots.classList.add('show');
    intro.remove();
    buildPoster();
  } else {
    var p = 0;
    var timer = setInterval(function () {
      p = Math.min(100, p + Math.random() * 17 + 6);
      bar.style.width = p + '%';
      pct.textContent = Math.floor(p) + '%';
      if (p >= 100) {
        clearInterval(timer);
        introText.textContent = C.load.done;
        intro.classList.add('done');
        enter.hidden = false;
        requestAnimationFrame(function () { enter.classList.add('show'); });
      }
    }, 120);
  }

  /* ---------------- 音乐 ---------------- */

  var audio = $('#audio');
  var sound = $('#sound');

  function playBgm() {
    if (!audio.getAttribute('src')) return;
    audio.play().then(function () {
      sound.dataset.playing = 'true';
    }).catch(function () {
      sound.dataset.playing = 'false';
    });
  }
  if (C.song && C.song.src && params.get('noaudio') !== '1') {
    audio.src = C.song.src;
    sound.hidden = false;
    sound.dataset.playing = 'false';
    sound.addEventListener('click', function () {
      if (audio.paused) {
        audio.play().then(function () { sound.dataset.playing = 'true'; }).catch(function () {
          sound.dataset.playing = 'false';
        });
      } else {
        audio.pause();
        sound.dataset.playing = 'false';
      }
    });
  }

  /* ---------------- 海报 ---------------- */

  var posterDone = false;

  async function buildPoster() {
    if (posterDone) return;
    posterDone = true;
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    } catch (e) { /* ignore */ }

    var W = 1080, H = 1620;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var g = cv.getContext('2d');

    var cs = getComputedStyle(document.body);
    var V = function (k) { return cs.getPropertyValue(k).trim(); };

    // 奶油底
    var bg = g.createLinearGradient(0, 0, W * 0.35, H);
    bg.addColorStop(0, V('--poster-1'));
    bg.addColorStop(0.55, V('--poster-2'));
    bg.addColorStop(1, V('--poster-1'));
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    // 光晕
    var glow = g.createRadialGradient(W / 2, H * 0.10, 10, W / 2, H * 0.10, W * 0.85);
    glow.addColorStop(0, 'rgba(255,170,110,.30)');
    glow.addColorStop(0.55, 'rgba(255,150,120,.10)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);

    // 内框
    g.strokeStyle = V('--poster-line');
    g.lineWidth = 2;
    g.strokeRect(44, 44, W - 88, H - 88);

    var serif = '"Songti SC","STSong","Noto Serif SC",serif';
    g.textAlign = 'center';

    g.fillStyle = V('--amber');
    g.font = '500 28px -apple-system,"PingFang SC",sans-serif';
    g.fillText(spaced(C.year + ' · 仅你可见'), W / 2, 168);

    g.fillStyle = V('--poster-ink');
    g.font = '700 112px ' + serif;
    g.fillText(C.name, W / 2, 344);

    g.fillStyle = V('--poster-sub');
    g.font = '400 30px -apple-system,"PingFang SC",sans-serif';
    g.fillText(spaced(C.date.replace(/-/g, '.')), W / 2, 414);

    g.strokeStyle = V('--poster-line');
    g.beginPath();
    g.moveTo(W / 2 - 48, 470);
    g.lineTo(W / 2 + 48, 470);
    g.stroke();

    g.fillStyle = V('--poster-ink');
    g.font = '600 56px ' + serif;
    var lines = wrap(g, C.poster.line, W - 240);
    var y = 580;
    lines.forEach(function (ln) { g.fillText(ln, W / 2, y); y += 92; });

    // 照片窗口
    if (C.poster.img) {
      try {
        var im = await loadImage(C.poster.img);
        var px = 84, py = Math.max(y + 40, 720), pw = W - 168, ph = H - 260 - py;
        if (ph > 380) {
          roundRect(g, px, py, pw, ph, 28);
          g.save();
          g.clip();
          drawCover(g, im, px, py, pw, ph);
          g.restore();
          g.strokeStyle = 'rgba(255,255,255,.9)';
          g.lineWidth = 8;
          roundRect(g, px, py, pw, ph, 28);
          g.stroke();
        }
      } catch (e) { /* ignore */ }
    }

    g.fillStyle = V('--amber');
    g.font = '400 30px ' + serif;
    g.fillText(C.poster.sign, W / 2, H - 178);

    g.fillStyle = V('--poster-sub');
    g.font = '400 22px -apple-system,"PingFang SC",sans-serif';
    g.fillText(spaced('HAPPY BIRTHDAY'), W / 2, H - 104);

    $('#poster-img').src = cv.toDataURL('image/png');
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function loadImage(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = rej;
      im.src = src;
    });
  }

  function drawCover(g, im, x, y, W, H) {
    var s = Math.max(W / im.width, H / im.height);
    var w = im.width * s, h = im.height * s;
    g.drawImage(im, x + (W - w) / 2, y + (H - h) / 2, w, h);
  }

  function spaced(s) { return String(s).split('').join(' '); }

  function wrap(g, text, maxW) {
    var out = [], line = '';
    for (var i = 0; i < text.length; i++) {
      var test = line + text[i];
      if (g.measureText(test).width > maxW && line) { out.push(line); line = text[i]; }
      else line = test;
    }
    if (line) out.push(line);
    return out;
  }

  var posterIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { buildPoster(); posterIO.disconnect(); }
    });
  }, { root: stage, threshold: 0.4 });

  posterIO.observe($('.screen.poster'));

  /* ---------------- 键盘（桌面调试） ---------------- */

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      if (current < screens.length - 1) stage.scrollTo({ top: screens[current + 1].offsetTop, behavior: 'smooth' });
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      if (current > 0) stage.scrollTo({ top: screens[current - 1].offsetTop, behavior: 'smooth' });
    }
  });
})();
