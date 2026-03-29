import { useState, useEffect, useMemo } from 'react';

var BASE = (typeof import.meta !== 'undefined' ? import.meta.env.BASE_URL : '/') + 'data/';

export function usePhytomiaData() {
  var _d = useState({ plants: [], insects: [], interactions: [], loading: true, error: null, lastUpdated: null });
  var data = _d[0], setData = _d[1];

  useEffect(function () {
    var cancelled = false;
    Promise.all([
      fetch(BASE + 'plants.json').then(function (r) { return r.ok ? r.json() : []; }),
      fetch(BASE + 'insects.json').then(function (r) { return r.ok ? r.json() : []; }),
      fetch(BASE + 'interactions.json').then(function (r) { return r.ok ? r.json() : []; }),
      fetch(BASE + 'last_updated.txt').then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; }),
    ]).then(function (results) {
      if (cancelled) return;
      setData({ plants: results[0], insects: results[1], interactions: results[2],
        loading: false, error: null, lastUpdated: results[3] ? results[3].trim() : null });
    }).catch(function (err) {
      if (cancelled) return;
      setData(function (prev) { return Object.assign({}, prev, { loading: false, error: err.message }); });
    });
    return function () { cancelled = true; };
  }, []);

  // Pre-build indexes for fast lookups
  var indexed = useMemo(function () {
    if (data.loading || !data.plants.length) return data;

    // Map id -> species
    var plantMap = {};
    data.plants.forEach(function (p) { plantMap[p.id] = p; });
    var insectMap = {};
    data.insects.forEach(function (i) { insectMap[i.id] = i; });

    // Map speciesId -> [interactions]
    var ixByPlant = {};
    var ixByInsect = {};
    data.interactions.forEach(function (ix) {
      if (!ixByPlant[ix.pI]) ixByPlant[ix.pI] = [];
      ixByPlant[ix.pI].push(ix);
      if (!ixByInsect[ix.iI]) ixByInsect[ix.iI] = [];
      ixByInsect[ix.iI].push(ix);
    });

    return Object.assign({}, data, {
      plantMap: plantMap,
      insectMap: insectMap,
      ixByPlant: ixByPlant,
      ixByInsect: ixByInsect,
    });
  }, [data]);

  return indexed;
}
