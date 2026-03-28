import { useState, useEffect } from 'react';

const BASE = import.meta.env.BASE_URL + 'data/';

/**
 * Hook pour charger les données Phytomia depuis les JSON statiques.
 * Les JSON sont générés par le pipeline Python et déployés dans public/data/.
 * 
 * Retourne { plants, insects, interactions, loading, error, lastUpdated }
 */
export function usePhytomiaData() {
  const [data, setData] = useState({
    plants: [],
    insects: [],
    interactions: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  useEffect(function () {
    var cancelled = false;

    Promise.all([
      fetch(BASE + 'plants.json').then(function (r) { return r.ok ? r.json() : []; }),
      fetch(BASE + 'insects.json').then(function (r) { return r.ok ? r.json() : []; }),
      fetch(BASE + 'interactions.json').then(function (r) { return r.ok ? r.json() : []; }),
      fetch(BASE + 'last_updated.txt').then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; }),
    ])
      .then(function (results) {
        if (cancelled) return;
        setData({
          plants: results[0],
          insects: results[1],
          interactions: results[2],
          loading: false,
          error: null,
          lastUpdated: results[3] ? results[3].trim() : null,
        });
      })
      .catch(function (err) {
        if (cancelled) return;
        console.error('Phytomia data load error:', err);
        setData(function (prev) {
          return Object.assign({}, prev, { loading: false, error: err.message });
        });
      });

    return function () { cancelled = true; };
  }, []);

  return data;
}

/**
 * Hook pour charger les images d'espèces depuis Wikipedia/Wikimedia Commons.
 * Cache en mémoire pour éviter les requêtes multiples.
 */
var imgCache = {};

export function useSpeciesImage(sciName) {
  var _s = useState(imgCache[sciName] || null), img = _s[0], setImg = _s[1];

  useEffect(function () {
    if (!sciName) return;
    if (imgCache[sciName] !== undefined) { setImg(imgCache[sciName]); return; }

    var cancelled = false;
    var slug = sciName.replace(/ /g, '_').replace(/×_?/g, '');

    fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(slug))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (cancelled) return;
        if (d && d.thumbnail && d.thumbnail.source) {
          var res = { url: d.thumbnail.source.replace(/\/\d+px-/, '/240px-') };
          imgCache[sciName] = res;
          setImg(res);
        } else {
          return fetch('https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=' + encodeURIComponent(sciName) + '&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=240&format=json&origin=*')
            .then(function (r2) { return r2.json(); })
            .then(function (cd) {
              if (cancelled) return;
              var pages = cd && cd.query && cd.query.pages;
              if (pages) {
                var pg = Object.values(pages)[0];
                var info = pg && pg.imageinfo && pg.imageinfo[0];
                if (info && info.thumburl) {
                  imgCache[sciName] = { url: info.thumburl };
                  setImg(imgCache[sciName]);
                } else { imgCache[sciName] = false; setImg(false); }
              } else { imgCache[sciName] = false; setImg(false); }
            });
        }
      })
      .catch(function () {
        if (!cancelled) { imgCache[sciName] = false; setImg(false); }
      });

    return function () { cancelled = true; };
  }, [sciName]);

  return img;
}
