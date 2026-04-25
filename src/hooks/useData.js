import { useState, useEffect, useMemo } from 'react';

var BASE = (typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/') + 'data/';

function expandPlant(p) {
  return {
    id: p.id, sci: p.sci, n_interactions: p.n || 0,
    family: p.f || '', order: p.o || '', genus: p.sci.split(' ')[0] || '',
    threat: p.t || '', growthForm: p.gf || 'herb', region: p.r || '', status: p.st || '', rhs: p.rhs || 0,
    common: { fr: p.cfr || '', en: p.cen || '' },
  };
}

function expandInsect(i) {
  return {
    id: i.id, sci: i.sci, n_interactions: i.n || 0,
    family: i.f || '', order: i.o || '', genus: i.sci.split(' ')[0] || '',
    threat: i.t || '',
    common: { fr: i.cfr || '', en: i.cen || '' },
  };
}

function expandIx(x) {
  return {
    pI: x.p, iI: x.i, tp: x.t,
    n: x.n || 1,
    src: x.s ? x.s.split(",") : ["legacy"],
  };
}

export function usePhytomiaData() {
  var _d = useState({ plants: [], insects: [], interactions: [], loading: true, error: null, lastUpdated: null });
  var data = _d[0], setData = _d[1];

  useEffect(function () {
    var cancelled = false;
    Promise.all([
      fetch(BASE + 'inat_cache.json').then(function(r){return r.ok?r.json():{}}).catch(function(){return {}}),
      fetch(BASE + 'plants.json').then(function (r) { return r.ok ? r.json() : []; }),
      fetch(BASE + 'insects.json').then(function (r) { return r.ok ? r.json() : []; }),
      fetch(BASE + 'interactions.json').then(function (r) { return r.ok ? r.json() : []; }),
      fetch(BASE + 'last_updated.txt').then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; }),
    ]).then(function (results) {
      var inatCache = results.shift();
      if (cancelled) return;
      var plants = results[0].map(expandPlant);
      var insects = results[1].map(expandInsect);
      var interactions = results[2].map(expandIx);
      setData({ inatCache: inatCache, plants: plants, insects: insects, interactions: interactions,
        loading: false, error: null, lastUpdated: results[3] ? results[3].trim() : null });
    }).catch(function (err) {
      if (cancelled) return;
      setData(function (prev) { return Object.assign({}, prev, { loading: false, error: err.message }); });
    });
    return function () { cancelled = true; };
  }, []);

  var indexed = useMemo(function () {
    if (data.loading || !data.plants.length) return data;
    var plantMap = {};
    data.plants.forEach(function (p) { plantMap[p.id] = p; });
    var insectMap = {};
    data.insects.forEach(function (i) { insectMap[i.id] = i; });
    var ixByPlant = {};
    var ixByInsect = {};
    data.interactions.forEach(function (ix) {
      if (!ixByPlant[ix.pI]) ixByPlant[ix.pI] = [];
      ixByPlant[ix.pI].push(ix);
      if (!ixByInsect[ix.iI]) ixByInsect[ix.iI] = [];
      ixByInsect[ix.iI].push(ix);
    });
    return Object.assign({}, data, {
      plantMap: plantMap, insectMap: insectMap,
      ixByPlant: ixByPlant, ixByInsect: ixByInsect,
    });
  }, [data]);

  return indexed;
}

var imgCache = {};

export function useSpeciesImage(sciName) {
  var _s = useState(imgCache[sciName] || null), img = _s[0], setImg = _s[1];
  useEffect(function () {
    if (!sciName) return;
    if (imgCache[sciName] !== undefined) { setImg(imgCache[sciName]); return; }
    var cancelled = false;
    var slug = sciName.replace(/ /g, "_").replace(/\u00d7_?/g, "");
    fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(slug))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (cancelled) return;
        if (d && d.thumbnail && d.thumbnail.source) {
          var res = { url: d.thumbnail.source.replace(/\/\d+px-/, "/240px-") };
          imgCache[sciName] = res; setImg(res);
        } else {
          return fetch("https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=" + encodeURIComponent(sciName) + "&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=240&format=json&origin=*")
            .then(function (r2) { return r2.json(); })
            .then(function (cd) {
              if (cancelled) return;
              var pages = cd && cd.query && cd.query.pages;
              if (pages) {
                var pg = Object.values(pages)[0];
                var info = pg && pg.imageinfo && pg.imageinfo[0];
                if (info && info.thumburl) { imgCache[sciName] = { url: info.thumburl }; setImg(imgCache[sciName]); }
                else { imgCache[sciName] = false; setImg(false); }
              } else { imgCache[sciName] = false; setImg(false); }
            });
        }
      })
      .catch(function () { if (!cancelled) { imgCache[sciName] = false; setImg(false); } });
    return function () { cancelled = true; };
  }, [sciName]);
  return img;
}
