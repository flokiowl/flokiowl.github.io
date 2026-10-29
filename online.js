/*!
 * UA Online — плагін онлайн-перегляду для Lampa
 * Джерела: UAKino, UAFlix, Eneyida (плеєри Ashdi, ZetVideo)
 * https://flokiowl.github.io/online.js
 */
(function () {
  'use strict';

  if (window.uaonline_ready) return;
  window.uaonline_ready = true;

  var VERSION = '1.1.0';
  var PLAYER_HOSTS = /(ashdi|zetvideo|hdvbua|tortuga|makhno)/i;
  var ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

  /* ============================== Журнал ============================== */

  var LOG = [];
  function log(msg) {
    LOG.push(new Date().toLocaleTimeString() + '  ' + msg);
    if (LOG.length > 150) LOG.shift();
    try { console.log('[UA Online] ' + msg); } catch (e) {}
  }

  /* ============================ Налаштування ========================== */

  var DEFAULTS = {
    uaonline_proxy: '',
    uaonline_hls: false,
    uaonline_uakino: 'https://uakino.best',
    uaonline_uaflix: 'https://uafix.net',
    uaonline_eneyida: 'https://eneyida.tv',
    uaonline_kinostrain: 'https://api.kinostrain.com'
  };

  function cfg(key) {
    var v = Lampa.Storage.get(key, DEFAULTS[key]);
    return (v === undefined || v === null || v === '') ? DEFAULTS[key] : v;
  }

  function siteRoot(key) {
    return String(cfg(key)).trim().replace(/\/+$/, '');
  }

  function addSettings() {
    if (!Lampa.SettingsApi) return;
    Lampa.SettingsApi.addComponent({ component: 'uaonline', name: 'UA Online', icon: ICON });

    var params = [
      ['uaonline_proxy', 'input', 'CORS-проксі', 'Адреса твого Cloudflare Worker, напр. https://ua-proxy.ІМʼЯ.workers.dev'],
      ['uaonline_hls', 'trigger', 'Відео через проксі', 'Вмикай, лише якщо список серій є, а відео не запускається'],
      ['uaonline_uakino', 'input', 'Домен UAKino', 'Зміни, якщо сайт переїхав'],
      ['uaonline_uaflix', 'input', 'Домен UAFlix', 'Зміни, якщо сайт переїхав'],
      ['uaonline_eneyida', 'input', 'Домен Eneyida', 'Зміни, якщо сайт переїхав'],
      ['uaonline_kinostrain', 'input', 'API KinoStrain', 'Зміни, якщо сайт переїхав']
    ];

    params.forEach(function (p) {
      var param = { name: p[0], type: p[1], 'default': DEFAULTS[p[0]] };
      if (p[1] === 'input') param.values = '';
      Lampa.SettingsApi.addParam({
        component: 'uaonline',
        param: param,
        field: { name: p[2], description: p[3] }
      });
    });
  }

  /* ============================== Мережа ============================== */

  function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) { return ''; }
  }

  function absUrl(href, base) {
    try { return new URL(href, base).href; } catch (e) { return href; }
  }

  function proxify(url, opts) {
    var p = String(cfg('uaonline_proxy') || '').trim().replace(/\/+$/, '');
    if (!p) return url;
    var q = p + '/?url=' + encodeURIComponent(url);
    if (opts && opts.referer) q += '&referer=' + encodeURIComponent(opts.referer);
    if (opts && opts.xhr) q += '&xhr=1';
    if (opts && opts.hls) q += '&hls=1';
    return q;
  }

  function request(url, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (ctrl) ctrl.abort();
        reject(new Error('таймаут ' + hostOf(url)));
      }, opts.timeout || 15000);

      fetch(proxify(url, opts), {
        method: opts.post ? 'POST' : 'GET',
        body: opts.post || undefined,
        headers: opts.post ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        if (!r.ok) {
          var hint = r.status === 403 ? ' (сайт блокує проксі або змінив домен)' : r.status === 404 ? ' (сторінку не знайдено — можливо, сайт переїхав)' : '';
          throw new Error('HTTP ' + r.status + ' від ' + hostOf(url) + hint);
        }
        return r.text();
      }).then(function (t) {
        clearTimeout(timer);
        resolve(t);
      }).catch(function (e) {
        clearTimeout(timer);
        var msg = e && e.message ? e.message : String(e);
        if (/failed to fetch|load failed|network/i.test(msg) && !cfg('uaonline_proxy')) {
          msg = 'немає доступу до ' + hostOf(url) + ' (не налаштовано CORS-проксі)';
        }
        reject(new Error(msg));
      });
    });
  }

  /* ============================= Утиліти ============================= */

  function parseHTML(html) {
    return new DOMParser().parseFromString(html, 'text/html');
  }

  function all(root, sel) {
    return Array.prototype.slice.call(root.querySelectorAll(sel));
  }

  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (x) {
      var k = String(x);
      if (x === null || x === undefined || x === '' || seen[k]) return;
      seen[k] = 1;
      out.push(x);
    });
    return out;
  }

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-z0-9\u0400-\u04ff]+/g, ' ')
      .trim();
  }

  function short(s, n) {
    s = String(s || '');
    n = n || 60;
    return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
  }

  function clean(s) {
    return String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  function num(s, re) {
    var m = String(s || '').match(re);
    if (!m) return null;
    for (var i = 1; i < m.length; i++) if (m[i]) return parseInt(m[i], 10);
    return null;
  }

  var RE_SEASON = /(?:сезон|season)\s*(\d+)|(\d+)\s*(?:-?й\s*)?(?:сезон|season)/i;
  var RE_EPISODE = /(?:серія|серия|епізод|эпизод|episode|ep\.?)\s*(\d+)|(\d+)\s*(?:-?а\s*)?(?:серія|серия|епізод|эпизод|episode)/i;

  /* ============================ Playerjs ============================= */

  // Дістає параметр file з плеєра Playerjs (Ashdi, ZetVideo тощо)
  function parsePlayerjs(html) {
    var m = html.match(/file\s*:\s*'(\[[\s\S]*?\])'\s*[,}\n]/);
    if (m) {
      try { return JSON.parse(m[1]); } catch (e) {
        try { return JSON.parse(m[1].replace(/\\'/g, "'")); } catch (e2) {}
      }
    }
    m = html.match(/file\s*:\s*"(\[[\s\S]*?\])"\s*[,}\n]/);
    if (m) {
      try { return JSON.parse(m[1].replace(/\\"/g, '"')); } catch (e) {}
    }
    m = html.match(/file\s*:\s*['"]([^'"]+)['"]/);
    if (m) return m[1];
    return null;
  }

  // Назва вузла може бути сезоном, серією або озвучкою — визначаємо за текстом
  function classify(title, ctx) {
    var t = clean(title);
    if (!t) return;
    var s = num(t, RE_SEASON);
    var e = num(t, RE_EPISODE);
    // "Сезон 1 (Дубляж)" — у назві сезону може ховатися озвучка
    var rest = t.replace(RE_SEASON, ' ').replace(RE_EPISODE, ' ')
      .replace(/[()\[\]|:,–—-]/g, ' ').replace(/\s+/g, ' ').trim();
    if ((s !== null || e !== null) && rest.length > 2 && !/^\d+$/.test(rest)) ctx.voice = rest;
    if (e !== null) {
      ctx.episode = e;
      if (s !== null) ctx.season = s;
    } else if (s !== null) {
      ctx.season = s;
    } else {
      ctx.voice = t;
    }
  }

  function flatten(nodes, ctx, out, referer) {
    nodes.forEach(function (n) {
      if (!n) return;
      var c = { voice: ctx.voice, season: ctx.season, episode: ctx.episode };
      classify(n.title || n.comment, c);
      if (n.folder && n.folder.length) {
        flatten(n.folder, c, out, referer);
      } else if (n.file) {
        out.push({
          voice: c.voice || 'Оригінал',
          season: c.season === undefined ? null : c.season,
          episode: c.episode === undefined ? null : c.episode,
          title: clean(n.title),
          file: n.file,
          referer: referer
        });
      }
    });
  }

  // "[1080p]url,[720p]url" → { url: найкраща, quality: {...} }
  function parseFile(file) {
    file = String(file || '').trim();
    var q = {}, first = null;
    function fix(u) {
      u = u.split(' or ')[0].trim();
      return u.indexOf('//') === 0 ? 'https:' + u : u;
    }
    if (/^\[/.test(file) || /,\[/.test(file)) {
      file.split(/,(?=\[)/).forEach(function (part) {
        var m = part.match(/^\[([^\]]*)\](.+)$/);
        if (!m) return;
        var u = fix(m[2]);
        q[m[1] || 'auto'] = u;
        if (!first) first = u;
      });
    } else {
      first = fix(file);
    }
    var keys = Object.keys(q).sort(function (a, b) { return (parseInt(b, 10) || 0) - (parseInt(a, 10) || 0); });
    return { url: keys.length ? q[keys[0]] : first, quality: keys.length > 1 ? q : null };
  }

  function resolveItem(item) {
    if (item.file) return Promise.resolve(parseFile(item.file));
    if (item.page && !item.player) {
      return request(item.page, { referer: item.referer }).then(function (html) {
        var players = findPlayers(html, item.page);
        if (!players.length) throw new Error('на сторінці серії не знайдено плеєра');
        item.player = players[0];
        item.referer = item.page;
        return resolveItem(item);
      });
    }
    return request(item.player, { referer: item.referer }).then(function (html) {
      var p = parsePlayerjs(html);
      if (!p) throw new Error('у плеєрі ' + hostOf(item.player) + ' не знайдено відео');
      var src;
      if (typeof p === 'string') src = parseFile(p);
      else {
        var flat = [];
        flatten(p, {}, flat, item.player);
        if (!flat.length) throw new Error('порожній плейлист ' + hostOf(item.player));
        src = parseFile(flat[0].file);
      }
      src.subtitles = parseSubtitles(html);
      return src;
    });
  }

  // subtitle:"[Українські]https://.../x.vtt,[English]https://..."
  function parseSubtitles(html) {
    var m = html.match(/subtitle\s*:\s*["']([^"']+)["']/);
    if (!m) return [];
    var out = [];
    m[1].split(/,(?=\[)/).forEach(function (part) {
      var mm = part.match(/^\[([^\]]*)\](.+)$/);
      if (mm) out.push({ label: mm[1] || 'Субтитри', url: mm[2].trim() });
      else if (/^https?:/.test(part)) out.push({ label: 'Субтитри', url: part.trim() });
    });
    return out;
  }

  function streamUrl(url, item) {
    var useHls = String(cfg('uaonline_hls')) === 'true';
    if (useHls && cfg('uaonline_proxy')) return proxify(url, { referer: item.player || item.referer, hls: true });
    return url;
  }

  /* ========================= DLE-сайти (спільне) ========================= */

  // Пошук на сайтах на рушії DataLife Engine (uakino, uaflix, eneyida)
  var DLE_LINK = /\/\d+-[^\/?#]+\.html(?:[?#]|$)/;

  function parseSearch(html, root, linkRe) {
    var doc = parseHTML(html);
    var rootHost = hostOf(root).replace(/^www\./, '');
    var byUrl = {}, out = [];

    all(doc, 'a[href]').forEach(function (a) {
      var href = absUrl(a.getAttribute('href'), root);
      if (!(linkRe || DLE_LINK).test(href)) return;
      if (hostOf(href).replace(/^www\./, '') !== rootHost) return;

      var img = a.querySelector('img');
      var attr = clean(a.getAttribute('title')).replace(/^(смотреть|дивитись|дивитися)\s+/i, '').replace(/\s+онлайн$/i, '');
      var text = clean(a.textContent);
      var alt = img ? clean(img.getAttribute('alt')) : '';
      // Текст посилання іноді містить опис фільму — беремо коротшу назву
      var title = attr || alt || text;
      if (title.length > 120) title = short(title, 120);

      if (byUrl[href]) {
        if (!byUrl[href].title && title) byUrl[href].title = title;
        if (attr) byUrl[href].card += ' ' + attr;
        return;
      }

      // Картка результату: шукаємо в ній рік і другу назву (часто оригінальну)
      var year = null, card = attr, box = a;
      for (var i = 0; i < 4 && box.parentElement; i++) {
        box = box.parentElement;
        var text = clean(box.textContent);
        if (text.length > 800) break;
        card = text + (attr ? ' ' + attr : '');
        var y = text.match(/\b(19[2-9]\d|20[0-4]\d)\b/);
        if (y) { year = parseInt(y[1], 10); break; }
      }

      byUrl[href] = { url: href, title: title, year: year, card: card };
      out.push(byUrl[href]);
    });

    return out.filter(function (r) { return r.title; });
  }

  function dleSearch(root, query, linkRe) {
    var form = 'do=search&subaction=search&story=' + encodeURIComponent(query);
    return request(root + '/index.php?' + form, { referer: root + '/' }).then(function (html) {
      var res = parseSearch(html, root, linkRe);
      if (res.length) return res;
      // Деякі сайти віддають результати лише на POST-запит
      return request(root + '/index.php?do=search', { referer: root + '/', post: form }).then(function (html2) {
        return parseSearch(html2, root, linkRe);
      });
    });
  }

  var NOT_PLAYER = /(youtube|youtu\.be|google|facebook|twitter|telegram|t\.me|vk\.com|instagram|tiktok|disqus|yandex|doubleclick|ads?\.)/i;

  function findPlayers(html, pageUrl) {
    var doc = parseHTML(html), found = [], seen = {}, frames = [];
    function add(u, any) {
      if (!u || /^(about:|javascript:|data:)/i.test(u)) return;
      u = absUrl(u, pageUrl);
      var h = hostOf(u);
      if (!h || seen[u]) return;
      if (!PLAYER_HOSTS.test(h) && !(any && !NOT_PLAYER.test(h))) return;
      seen[u] = 1;
      found.push(u);
    }
    all(doc, 'iframe, [data-src], [data-iframe], [data-player]').forEach(function (f) {
      ['src', 'data-src', 'data-iframe', 'data-player'].forEach(function (attr) {
        var v = f.getAttribute(attr);
        if (!v || !/^(https?:)?\/\//.test(v)) return;
        if (f.tagName === 'IFRAME') frames.push(hostOf(absUrl(v, pageUrl)));
        // будь-який iframe, крім соцмереж і реклами, вважаємо можливим плеєром
        add(v, f.tagName === 'IFRAME' || /\/(vod|serial|embed|player)\//i.test(v));
      });
    });
    var re = /(?:https?:)?\/\/[^"'\s<>]*?(?:ashdi|zetvideo|hdvbua|tortuga)[^"'\s<>]*?\/(?:vod|serial)\/[^"'\s<>]+/gi, m;
    while ((m = re.exec(html))) add(m[0]);
    log('iframe на сторінці: ' + (uniq(frames).join(', ') || 'немає'));
    return found;
  }

  // Серіал розбитий на окремі сторінки серій (/season-1/episode-2/ тощо)
  function findEpisodeLinks(html, pageUrl) {
    var doc = parseHTML(html), out = [], seen = {};
    var host = hostOf(pageUrl);
    all(doc, 'a[href]').forEach(function (a) {
      var href = absUrl(a.getAttribute('href'), pageUrl);
      if (hostOf(href) !== host || seen[href]) return;
      var path = decodeURIComponent(href.replace(/^https?:\/\/[^\/]+/, ''));
      var ep = num(path, /(?:episode|seriya|seria|серія)[-_\/]?(\d+)/i);
      if (ep === null) return;
      seen[href] = 1;
      var season = num(path, /(?:season|sezon|сезон)[-_\/]?(\d+)/i);
      out.push({ voice: 'Озвучка', season: season === null ? 1 : season, episode: ep, title: clean(a.textContent), page: href, referer: pageUrl });
    });
    return out;
  }

  function expandPlayers(players, pageUrl) {
    return Promise.all(players.map(function (p, i) {
      if (/\/serial\//i.test(p)) {
        return request(p, { referer: pageUrl }).then(function (html) {
          var tree = parsePlayerjs(html), out = [];
          if (Array.isArray(tree)) flatten(tree, {}, out, p);
          else if (tree) out.push({ voice: 'Плеєр ' + (i + 1), season: null, episode: null, title: '', file: tree, referer: p });
          return out;
        }).catch(function (e) {
          log('плеєр ' + hostOf(p) + ': ' + e.message);
          return [];
        });
      }
      var label = hostOf(p).split('.')[0];
      if (players.length > 1) label += ' #' + (i + 1);
      return Promise.resolve([{ voice: label, season: null, episode: null, title: '', player: p, referer: pageUrl }]);
    })).then(function (arr) {
      return [].concat.apply([], arr);
    });
  }

  // Плейлист UAKino (озвучки/серії підвантажуються окремим запитом)
  function uakinoPlaylist(root, id, referer) {
    var url = root + '/engine/ajax/playlists.php?news_id=' + id + '&xfield=playlist&time=' + Date.now();
    return request(url, { referer: referer, xhr: true }).then(function (txt) {
      var json;
      try { json = JSON.parse(txt); } catch (e) { return []; }
      if (!json || !json.success || !json.response) return [];

      var doc = parseHTML(json.response);
      var names = {};
      all(doc, '.playlists-lists li[data-id]').forEach(function (li) {
        names[li.getAttribute('data-id')] = clean(li.textContent);
      });

      var items = [];
      all(doc, 'li[data-file]').forEach(function (li) {
        var file = li.getAttribute('data-file');
        if (!file) return;
        file = absUrl(file, referer);

        var parts = (li.getAttribute('data-id') || '').split('_'), ctx = [];
        for (var i = 1; i <= parts.length; i++) {
          var k = parts.slice(0, i).join('_');
          if (names[k]) ctx.push(names[k]);
        }

        var text = clean(li.textContent);
        var season = num(ctx.join(' ') + ' ' + text, RE_SEASON);
        var episode = num(text, RE_EPISODE);
        var voice = li.getAttribute('data-voice') ||
          ctx.filter(function (c) { return num(c, RE_SEASON) === null; }).join(' ') ||
          (episode === null ? text : '') || 'Озвучка';

        items.push({ voice: clean(voice), season: season, episode: episode, title: text, player: file, referer: referer });
      });
      return items;
    });
  }

  function dleLoad(root, pageUrl, b) {
    return request(pageUrl, { referer: root + '/' }).then(function (html) {
      var chain = Promise.resolve([]);
      if (b.ajaxPlaylist) {
        var id = (pageUrl.match(/\/(\d+)-[^\/]*\.html/) || [])[1];
        if (id) {
          chain = uakinoPlaylist(root, id, pageUrl).catch(function (e) {
            log(b.title + ': плейлист — ' + e.message);
            return [];
          });
        }
      }
      return chain.then(function (items) {
        if (items.length) {
          log(b.title + ': з плейлиста ' + items.length + ' відео');
          return items;
        }
        var players = findPlayers(html, pageUrl);
        log(b.title + ': плеєрів на сторінці ' + players.length);
        if (!players.length) {
          var eps = findEpisodeLinks(html, pageUrl);
          if (eps.length) log(b.title + ': посилань на серії ' + eps.length);
          return eps;
        }
        return expandPlayers(players, pageUrl);
      });
    });
  }

  /* ============================== KinoStrain ============================== */
  // Відкритий JSON API. Посилання на плеєр Ashdi лежать у seasons[].playerData.
  // Інші плеєри (tortuga тощо) пропускаємо: там посилання зашифровані.

  var KS_REF = 'https://kinostrain.com/';

  function ksJson(url) {
    return request(url, { referer: KS_REF }).then(function (txt) {
      try { return JSON.parse(txt); } catch (e) { throw new Error('KinoStrain повернув не JSON'); }
    });
  }

  function ksSearch(root, q) {
    return ksJson(root + '/api/search?q=' + encodeURIComponent(q) + '&limit=20').then(function (json) {
      return (json && json.data || []).map(function (x) {
        return {
          url: x.slug,
          slug: x.slug,
          title: x.name + (x.originalName && x.originalName !== x.name ? ' / ' + x.originalName : ''),
          titles: [x.name, x.originalName],
          year: x.yearStart || null,
          serial: x.type === 'serial',
          firstSeason: x.firstReadySeason && x.firstReadySeason.number || 1
        };
      });
    });
  }

  function ksContent(root, slug, season) {
    return ksJson(root + '/api/content/' + encodeURIComponent(slug) + '?season=' + season).then(function (json) {
      return json && json.data || {};
    });
  }

  function ksCollect(season, isMovie, items) {
    var pd = season && season.playerData;
    if (!pd || typeof pd !== 'object') return;
    function add(list, ep) {
      (list || []).forEach(function (v) {
        if (!v || !v.link) return;
        items.push({
          voice: v.name || 'Ashdi',
          season: isMovie ? null : season.number,
          episode: isMovie ? null : ep,
          title: v.name || '',
          player: v.link,
          referer: KS_REF
        });
      });
    }
    if (Array.isArray(pd.ashdi)) { add(pd.ashdi, null); return; }
    Object.keys(pd).forEach(function (k) {
      if (pd[k] && pd[k].ashdi) add(pd[k].ashdi, parseInt(k, 10));
    });
  }

  function ksLoad(root, r) {
    return ksContent(root, r.slug, r.firstSeason || 1).then(function (data) {
      var isMovie = data.type === 'movie';
      var seasons = data.seasons || [];
      return Promise.all(seasons.map(function (s) {
        if (s.playerData) return s;
        return ksContent(root, r.slug, s.number).then(function (d) {
          return (d.seasons || []).filter(function (x) { return x.number === s.number; })[0] || s;
        }).catch(function (e) {
          log('KinoStrain: сезон ' + s.number + ' — ' + e.message);
          return s;
        });
      })).then(function (full) {
        var items = [];
        full.forEach(function (s) { ksCollect(s, isMovie, items); });
        // фільм з одним вузлом виглядає як «серія 1» — прибираємо номери
        if (isMovie) items.forEach(function (i) { i.season = null; i.episode = null; });
        // однакові озвучки фільму з різних вузлів залишаємо один раз
        var seen = {};
        return items.filter(function (i) {
          var k = [i.voice, i.season, i.episode].join('|');
          if (seen[k]) return false;
          seen[k] = 1;
          return true;
        });
      });
    });
  }

  /* ============================ Балансери ============================ */
  // Щоб додати новий сайт на DLE — допиши ще один рядок сюди і в DEFAULTS.

  var BALANCERS = [
    {
      name: 'kinostrain', title: 'KinoStrain', key: 'uaonline_kinostrain',
      search: function (q) { return ksSearch(siteRoot('uaonline_kinostrain'), q); },
      load: function (r) { return ksLoad(siteRoot('uaonline_kinostrain'), r); }
    },
    {
      name: 'uaflix', title: 'UAFlix', key: 'uaonline_uaflix',
      // uafix.net: адреси вигляду /films/nazva/ та /serials/nazva/
      linkRe: /\/(?:films|serials|cartoons|anime|dorama)\/[^\/?#]+\/?(?:[?#]|$)/
    },
    { name: 'eneyida', title: 'Eneyida', key: 'uaonline_eneyida' },
    { name: 'uakino', title: 'UAKino', key: 'uaonline_uakino', ajaxPlaylist: true }
  ];

  BALANCERS.forEach(function (b) {
    if (!b.search) b.search = function (q) { return dleSearch(siteRoot(b.key), q, b.linkRe); };
    if (!b.load) b.load = function (r) { return dleLoad(siteRoot(b.key), r.url, b); };
  });

  /* ============================ Пошук фільму ============================ */

  function movieYear(m) {
    return parseInt(String(m.release_date || m.first_air_date || '').slice(0, 4), 10) || null;
  }

  function isTvCard(m) {
    return !!(m.first_air_date || m.number_of_seasons || (m.name && !m.title));
  }

  function pickMatches(results, movie) {
    var titles = uniq([movie.uk_title, movie.title, movie.name, movie.original_title, movie.original_name].map(norm));
    var year = movieYear(movie);
    var tv = isTvCard(movie);

    return results.map(function (r) {
      var names = (r.titles && r.titles.length ? r.titles : [r.title]).map(norm);
      var card = ' ' + norm(r.card) + ' ', s = 0, cardOnly = false;
      titles.forEach(function (x) {
        if (!x) return;
        names.forEach(function (t) {
          if (!t) return;
          if (t === x) s = Math.max(s, 4);
          else if (t.indexOf(x + ' ') === 0 || t.indexOf(' ' + x) >= 0 || t.indexOf(x) === 0) s = Math.max(s, 3);
          else if (x.length > 5 && t.indexOf(x) >= 0) s = Math.max(s, 2);
        });
        if (!s && x.length > 3 && card.indexOf(' ' + x + ' ') >= 0) { s = 2; cardOnly = true; }
      });
      if (!s) return { r: r, s: 0 };
      var yearOk = year && r.year ? Math.abs(r.year - year) <= 1 : null;
      if (yearOk === true) s += 2;
      if (yearOk === false) s -= 3;
      // збіг лише в описі картки — приймаємо тільки з тим самим роком
      if (cardOnly && yearOk !== true) s = 0;
      if (typeof r.serial === 'boolean' && r.serial !== tv) s -= 2;
      return { r: r, s: s };
    }).filter(function (x) { return x.s >= 2; })
      .sort(function (a, b) { return b.s - a.s; })
      .map(function (x) { return x.r; });
  }

  // Українська назва з TMDB (якщо Lampa показує назви іншою мовою)
  function loadUkTitle(movie) {
    if (movie.uk_title !== undefined || !movie.id) return Promise.resolve();
    var type = movie.name && !movie.title ? 'tv' : 'movie';
    var path = type + '/' + movie.id + '?language=uk-UA';
    var url;
    try {
      var key = Lampa.TMDB.key();
      url = Lampa.TMDB.api(path + '&api_key=' + key);
    } catch (e) {
      movie.uk_title = '';
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      var done = false;
      setTimeout(function () { if (!done) { movie.uk_title = ''; resolve(); } }, 6000);
      fetch(url).then(function (r) { return r.json(); }).then(function (j) {
        done = true;
        movie.uk_title = (j && (j.title || j.name)) || '';
        log('назва українською: ' + (movie.uk_title || '—'));
        resolve();
      }).catch(function (e) {
        done = true;
        movie.uk_title = '';
        log('TMDB: ' + e.message);
        resolve();
      });
    });
  }

  function findOn(b, movie) {
    var queries = uniq([movie.uk_title, movie.original_title || movie.original_name, movie.title || movie.name]);
    var i = 0;
    function next() {
      if (i >= queries.length) return Promise.resolve([]);
      var q = queries[i++];
      log(b.title + ': пошук «' + q + '»');
      return b.search(q).then(function (res) {
        var m = pickMatches(res, movie);
        log(b.title + ': результатів ' + res.length + ', збігів ' + m.length);
        return m.length ? m : next();
      });
    }
    return next();
  }

  /* ============================== Інтерфейс ============================== */

  function addStyles() {
    if (document.getElementById('uaonline-css')) return;
    var css =
      '.uaonline{padding:0 1.5em 3em}' +
      '.uaonline__head{display:flex;flex-wrap:wrap;margin:1em 0 1.2em}' +
      '.uaonline__btn{padding:.55em 1em;border-radius:.4em;background:rgba(255,255,255,.08);font-size:1.1em;margin:0 .6em .6em 0}' +
      '.uaonline__btn span{opacity:.55;margin-right:.4em}' +
      '.uaonline__btn.focus,.uaonline__item.focus{background:#fff;color:#000}' +
      '.uaonline__btn.focus span{opacity:.7}' +
      '.uaonline__item{display:flex;align-items:center;justify-content:space-between;padding:1em 1.2em;margin-bottom:.6em;border-radius:.5em;background:rgba(255,255,255,.05)}' +
      '.uaonline__title{font-size:1.3em}' +
      '.uaonline__info{font-size:1em;opacity:.6;margin-left:1em;white-space:nowrap}' +
      '.uaonline__item.focus .uaonline__info{opacity:.75}' +
      '.uaonline__seen{opacity:.5}' +
      '.uaonline__empty{padding:1.5em 0;font-size:1.2em;opacity:.75;line-height:1.5}';
    $('<style id="uaonline-css"></style>').text(css).appendTo('head');
  }

  function component(object) {
    var self = this;
    var movie = object.movie || {};
    var scroll = new Lampa.Scroll({ mask: true, over: true });
    var html = $('<div class="uaonline"></div>');
    var head = $('<div class="uaonline__head"></div>');
    var list = $('<div class="uaonline__list"></div>');
    var started = false;
    var focusTarget = null;

    var state = {
      balancer: null,
      results: [],
      result: null,
      items: [],
      voice: null,
      season: null,
      error: ''
    };

    /* ---------- дані ---------- */

    function isSerial() {
      return state.items.some(function (i) { return i.episode !== null || i.season !== null; });
    }

    function voices() {
      return uniq(state.items.map(function (i) { return i.voice; }));
    }

    function seasons() {
      return uniq(state.items.filter(function (i) { return i.voice === state.voice; })
        .map(function (i) { return i.season; }))
        .sort(function (a, b) { return a - b; });
    }

    function shownItems() {
      if (!isSerial()) return state.items;
      return state.items.filter(function (i) {
        return i.voice === state.voice && (state.season === null || i.season === state.season);
      }).sort(function (a, b) { return (a.episode || 0) - (b.episode || 0); });
    }

    function itemTitle(it) {
      if (isSerial()) return it.episode !== null ? 'Серія ' + it.episode : (it.title || 'Відео');
      return it.voice || it.title || 'Відео';
    }

    function timeline(it) {
      try {
        var key = [it.season, it.season > 10 ? ':' : '', it.episode, movie.original_title || movie.original_name || movie.title].join('');
        return Lampa.Timeline.view(Lampa.Utils.hash(isSerial() ? key : (movie.original_title || movie.title)));
      } catch (e) { return null; }
    }

    function loader(v) {
      try { self.activity.loader(v); } catch (e) {}
    }

    /* ---------- завантаження ---------- */

    function loadResult(r) {
      var b = state.balancer;
      state.result = r;
      state.items = [];
      return b.load(r).then(function (items) {
        state.items = items;
        log(b.title + ': всього відео ' + items.length);
        if (!items.length) {
          state.error = b.title + ': на сторінці «' + short(r.title, 50) + '» не знайдено плеєра';
          return false;
        }
        var vs = voices(), saved = Lampa.Storage.get('uaonline_voice', '');
        state.voice = vs.indexOf(saved) >= 0 ? saved : vs[0];
        var ss = seasons();
        state.season = ss.length ? ss[0] : null;
        state.error = '';
        Lampa.Storage.set('uaonline_balancer', b.name);
        return true;
      });
    }

    function trySource(b) {
      state.balancer = b;
      state.results = [];
      state.result = null;
      state.items = [];
      state.error = '';
      return findOn(b, movie).then(function (res) {
        state.results = res;
        if (!res.length) {
          state.error = b.title + ': нічого не знайдено';
          return false;
        }
        return loadResult(res[0]);
      }).catch(function (e) {
        log(b.title + ': помилка — ' + e.message);
        state.error = b.title + ': ' + e.message;
        return false;
      });
    }

    function autoSearch() {
      var last = Lampa.Storage.get('uaonline_balancer', BALANCERS[0].name);
      var order = BALANCERS.slice().sort(function (a, b) {
        return (b.name === last) - (a.name === last);
      });
      var k = 0, firstError = '';

      function next() {
        if (k >= order.length) {
          state.balancer = order[0];
          state.error = firstError || 'Нічого не знайдено в жодному джерелі';
          return Promise.resolve();
        }
        return trySource(order[k++]).then(function (ok) {
          if (!ok) {
            if (!firstError) firstError = state.error;
            return next();
          }
        });
      }

      loader(true);
      return loadUkTitle(movie).then(next).then(function () {
        loader(false);
        draw();
      });
    }

    /* ---------- вибір через меню ---------- */

    function select(title, items, onSelect) {
      Lampa.Select.show({
        title: title,
        items: items,
        onSelect: function (a) {
          Lampa.Controller.toggle('content');
          onSelect(a);
        },
        onBack: function () {
          Lampa.Controller.toggle('content');
        }
      });
    }

    function chooseBalancer() {
      select('Джерело', BALANCERS.map(function (b) {
        return { title: b.title, selected: state.balancer === b, b: b };
      }), function (a) {
        loader(true);
        trySource(a.b).then(function () {
          loader(false);
          draw();
        });
      });
    }

    function chooseResult() {
      select('Що саме відкрити', state.results.map(function (r) {
        return { title: short(r.title, 80) + (r.year ? ' (' + r.year + ')' : ''), selected: r === state.result, r: r };
      }), function (a) {
        loader(true);
        loadResult(a.r).catch(function (e) {
          state.error = e.message;
        }).then(function () {
          loader(false);
          draw();
        });
      });
    }

    function chooseVoice() {
      select('Озвучка', voices().map(function (v) {
        return { title: v, selected: v === state.voice, v: v };
      }), function (a) {
        state.voice = a.v;
        Lampa.Storage.set('uaonline_voice', a.v);
        var ss = seasons();
        if (ss.indexOf(state.season) < 0) state.season = ss.length ? ss[0] : null;
        draw();
      });
    }

    function chooseSeason() {
      select('Сезон', seasons().map(function (s) {
        return { title: 'Сезон ' + s, selected: s === state.season, s: s };
      }), function (a) {
        state.season = a.s;
        draw();
      });
    }

    function showLog() {
      var items = LOG.slice().reverse().map(function (l) { return { title: l }; });
      if (!items.length) items = [{ title: 'Журнал порожній' }];
      select('Журнал UA Online ' + VERSION, items, function () {});
    }

    /* ---------- відтворення ---------- */

    function play(it, shown) {
      loader(true);
      resolveItem(it).then(function (src) {
        log('відтворення: ' + hostOf(src.url));
        var element = {
          title: (movie.title || movie.name || '') + ' — ' + itemTitle(it),
          url: streamUrl(src.url, it),
          timeline: timeline(it)
        };
        if (src.quality) element.quality = src.quality;
        if (src.subtitles && src.subtitles.length) element.subtitles = src.subtitles;

        if (!isSerial()) {
          Lampa.Player.play(element);
          Lampa.Player.playlist([element]);
          return;
        }

        // Плейлист серій: посилання на інші серії дістаються, коли до них дійде черга
        var playlist = shown.map(function (x) {
          if (x === it) return element;
          var el = { title: (movie.title || movie.name || '') + ' — ' + itemTitle(x), timeline: timeline(x) };
          el.url = function (call) {
            resolveItem(x).then(function (s) {
              el.url = streamUrl(s.url, x);
              if (s.quality) el.quality = s.quality;
              if (s.subtitles && s.subtitles.length) el.subtitles = s.subtitles;
              call();
            }).catch(function (e) {
              log('серія ' + itemTitle(x) + ': ' + e.message);
              el.url = '';
              call();
            });
          };
          return el;
        });
        element.playlist = playlist;
        Lampa.Player.play(element);
        Lampa.Player.playlist(playlist);
      }).catch(function (e) {
        log('помилка відтворення: ' + e.message);
        Lampa.Noty.show('Не вдалося запустити: ' + e.message);
      }).then(function () {
        loader(false);
      });
    }

    /* ---------- малювання ---------- */

    function bind(el, onEnter) {
      el.on('hover:focus', function () {
        focusTarget = el[0];
        scroll.update(el, true);
      });
      el.on('hover:enter', onEnter);
      return el;
    }

    function button(label, value, onEnter) {
      var el = $('<div class="uaonline__btn selector"><span></span><b></b></div>');
      el.find('span').text(label);
      el.find('b').text(value || '');
      head.append(bind(el, onEnter));
    }

    function draw() {
      head.empty();
      list.empty();

      var b = state.balancer || BALANCERS[0];
      button('Джерело', b.title, chooseBalancer);
      if (state.results.length > 1 && state.result) button('Знайдено', short(state.result.title, 50), chooseResult);
      if (isSerial() && voices().length > 1) button('Озвучка', state.voice, chooseVoice);
      if (isSerial() && seasons().length > 1) button('Сезон', state.season, chooseSeason);
      button('Журнал', '', showLog);

      var shown = shownItems();

      if (!shown.length) {
        var msg = $('<div class="uaonline__empty"></div>');
        msg.text((state.error || 'Нічого не знайдено') + '. Обери інше джерело або відкрий журнал.');
        list.append(msg);
      }

      shown.forEach(function (it) {
        var el = $('<div class="uaonline__item selector"><div class="uaonline__title"></div><div class="uaonline__info"></div></div>');
        el.find('.uaonline__title').text(itemTitle(it));

        var info = isSerial() ? (it.season !== null ? 'S' + it.season : '') : hostOf(it.player || it.referer || '');
        var tl = timeline(it);
        if (tl && tl.percent) {
          info = (info ? info + '  ' : '') + tl.percent + '%';
          if (tl.percent > 90) el.addClass('uaonline__seen');
        }
        el.find('.uaonline__info').text(info);

        list.append(bind(el, function () { play(it, shown); }));
      });

      focusTarget = list.find('.selector')[0] || head.find('.selector')[0] || null;
      if (started) {
        Lampa.Controller.collectionSet(scroll.render());
        Lampa.Controller.collectionFocus(focusTarget, scroll.render());
      }
    }

    /* ---------- життєвий цикл компонента ---------- */

    this.create = function () {
      addStyles();
      scroll.append(head);
      scroll.append(list);
      html.append(scroll.render());

      autoSearch().then(function () {
        try { self.activity.toggle(); } catch (e) {}
      });
      return this.render();
    };

    this.start = function () {
      started = true;
      Lampa.Controller.add('content', {
        toggle: function () {
          Lampa.Controller.collectionSet(scroll.render());
          Lampa.Controller.collectionFocus(focusTarget || false, scroll.render());
        },
        up: function () {
          if (Navigator.canmove('up')) Navigator.move('up');
          else Lampa.Controller.toggle('head');
        },
        down: function () {
          Navigator.move('down');
        },
        left: function () {
          if (Navigator.canmove('left')) Navigator.move('left');
          else Lampa.Controller.toggle('menu');
        },
        right: function () {
          Navigator.move('right');
        },
        back: function () {
          Lampa.Activity.backward();
        }
      });
      Lampa.Controller.toggle('content');
    };

    this.render = function () { return html; };
    this.pause = function () {};
    this.stop = function () {};
    this.destroy = function () {
      scroll.destroy();
      html.remove();
    };
  }

  /* ========================== Запуск плагіна ========================== */

  function addButton(e) {
    var render = e.object.activity.render();
    if (render.find('.view--uaonline').length) return;

    var btn = $('<div class="full-start__button selector view--uaonline">' + ICON + '<span>UA Онлайн</span></div>');
    btn.on('hover:enter', function () {
      var m = e.data.movie;
      Lampa.Activity.push({
        url: '',
        title: 'UA Онлайн',
        component: 'uaonline',
        movie: m,
        page: 1
      });
    });

    var torrent = render.find('.view--torrent');
    if (torrent.length) torrent.after(btn);
    else render.find('.full-start-new__buttons, .full-start__buttons').first().append(btn);
  }

  function start() {
    Lampa.Component.add('uaonline', component);
    addSettings();

    try {
      Lampa.Manifest.plugins = {
        type: 'video',
        version: VERSION,
        name: 'UA Online',
        description: 'Онлайн-перегляд з українських джерел',
        component: 'uaonline'
      };
    } catch (e) {}

    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') addButton(e);
    });

    log('плагін ' + VERSION + ' завантажено');
  }

  if (window.appready) start();
  else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') start();
    });
  }
})();
