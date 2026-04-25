import { Lightbox, seedPhotoCache } from './components/Thumb';
import { useState, useMemo, useEffect, useRef } from 'react';
import { usePhytomiaData } from './hooks/useData';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Tabs from './components/Tabs';
import Ranking from './components/Ranking';
import Garden from './components/Garden';
import SpeciesDetail from './components/SpeciesDetail';
import Footer from './components/Footer';
import { TYPES, FAMILIES } from './utils/types';

export default function App() {
  var data = usePhytomiaData();
  var _l = useState('fr'), lang = _l[0], setLang = _l[1];
  var _v = useState('ranking'), viewMode = _v[0], _setViewMode = _v[1];
  function setViewMode(m) {
    _setViewMode(m);
    if (m === 'garden') { writeHash('garden'); }
    else if (!selectedId) { writeHash('home'); }
  }
  var _eu = useState(true), euOnly = _eu[0], setEuOnly = _eu[1];
  var _s = useState(null), selectedId = _s[0], setSelectedId = _s[1];
  var _sv = useState('fiche'), speciesView = _sv[0], setSpeciesView = _sv[1];
  var _h = useState([]), history = _h[0], setHistory = _h[1];
  var _g = useState([]), garden = _g[0], setGarden = _g[1];

  // === Hash routing ===
  function readHash() {
    var raw = decodeURIComponent(window.location.hash.slice(1));
    if (!raw) return null;
    if (raw === 'mon_jardin') return { page: 'garden' };
    var parts = raw.split('/');
    return { page: 'species', sci: parts[0].replace(/_/g, ' '), view: parts[1] || 'fiche' };
  }

  function writeHash(page, sci, view) {
    var url;
    if (page === 'garden') { url = '#mon_jardin'; }
    else if (page === 'species' && sci) {
      var h = sci.replace(/ /g, '_');
      url = '#' + ((view && view !== 'fiche') ? h + '/' + view : h);
    }
    else { url = window.location.pathname; }
    window.history.pushState(null, '', url);
  }

  // Read hash once data is loaded
  var _hashDone = useRef(false);
  useEffect(function() {
    if (_hashDone.current || !data.plants.length) return;
    _hashDone.current = true;
    var h = readHash();
    if (!h) return;
    if (h.page === 'garden') { _setViewMode('garden'); return; }
    var sp = data.plants.find(function(p){ return p.sci === h.sci; })
          || data.insects.find(function(i){ return i.sci === h.sci; });
    if (!sp) return;
    // Set species first, then view after component mounts
    setSpeciesView(h.view || 'fiche');
    setSelectedId(sp.id);
    // Force view after mount
    setTimeout(function() { setSpeciesView(h.view || 'fiche'); }, 50);
    setTimeout(function() { setSpeciesView(h.view || 'fiche'); }, 300);
  }, [data.plants.length]);

  // Browser back/forward navigation
  useEffect(function() {
    function onPop() {
      var h = readHash();
      if (!h || !data || !data.plants.length) {
        setSelectedId(null); _setViewMode('ranking'); return;
      }
      if (h.page === 'garden') { setSelectedId(null); _setViewMode('garden'); return; }
      if (h.page === 'species') {
        var sp = data.plants.find(function(p){return p.sci===h.sci;}) || data.insects.find(function(i){return i.sci===h.sci;});
        if (sp) { setSelectedId(sp.id); setSpeciesView(h.view || 'fiche'); }
      }
    }
    window.addEventListener('popstate', onPop);
    return function() { window.removeEventListener('popstate', onPop); };
  }, [data.plants.length]);

  // Browser back/forward navigation
  useEffect(function() {
    function onPop() {
      var h = readHash();
      if (!h || !data || !data.plants.length) {
        setSelectedId(null); _setViewMode('ranking'); return;
      }
      if (h.page === 'garden') { setSelectedId(null); _setViewMode('garden'); return; }
      if (h.page === 'species') {
        var sp = data.plants.find(function(p){return p.sci===h.sci;}) || data.insects.find(function(i){return i.sci===h.sci;});
        if (sp) { setSelectedId(sp.id); setSpeciesView(h.view || 'fiche'); }
      }
    }
    window.addEventListener('popstate', onPop);
    return function() { window.removeEventListener('popstate', onPop); };
  }, [data.plants.length]);



  // Seed photo cache from pre-built data
  useEffect(function() {
    if (data && data.inatCache) seedPhotoCache(data.inatCache);
  }, [data]);

  // Hash routing - only on initial load
  useEffect(function() {
    var h = decodeURIComponent(window.location.hash.slice(1)).replace(/_/g, ' ');
    if (!h || !data || !data.plants) return;
    if (h === 'mon jardin' || h === 'my garden' || h === 'garden') {
      setViewMode('garden');
    } else {
      var sp = data.plants.find(function(p){return p.sci===h;}) || data.insects.find(function(i){return i.sci===h;});
      if (sp) { setSelectedId(sp.id); if (h.view === 'reseau') setSpeciesView('reseau'); else setSpeciesView('fiche'); }
    }
  }, [!!data]);

  var selected = useMemo(function () {
    if (!selectedId) return null;
    return data.plants.find(function (p) { return p.id === selectedId; }) ||
           data.insects.find(function (i) { return i.id === selectedId; });
  }, [selectedId, data.plants, data.insects]);

  var isPlant = useMemo(function () {
    if (!selectedId) return null;
    return !!data.plants.find(function (p) { return p.id === selectedId; });
  }, [selectedId, data.plants]);

  function go(id) {
    if (selectedId) { setHistory(function(h) { return h.concat([selectedId]); }); }
    setSelectedId(id);
    setSpeciesView('fiche');
    if (id && data) {
      var sp = data.plants.find(function(p){return p.id===id;}) || data.insects.find(function(i){return i.id===id;});
      if (sp) { writeHash('species', sp.sci); }
    } else { writeHash('home'); }
  }
  function back() {
    if (history.length > 0) {
      var prev = history[history.length - 1];
      setHistory(function(h) { return h.slice(0, -1); });
      setSelectedId(prev);
      if (prev && data) {
        var sp = data.plants.find(function(p){return p.id===prev;}) || data.insects.find(function(i){return i.id===prev;});
        if (sp) { writeHash('species', sp.sci); }
      }
    } else {
      setSelectedId(null);
    }
  }

  // Pre-compute EU-only version once at load
  var euData = useMemo(function () {
    if (data.loading || !data.plants.length) return null;
    var fp = data.plants.filter(function (p) { return !p.region || p.region !== 'extra-EU'; });
    var fpIds = {};
    fp.forEach(function (p) { fpIds[p.id] = true; });
    var fi = data.interactions.filter(function (x) { return fpIds[x.pI]; });
    var plantMap = {};
    fp.forEach(function (p) { plantMap[p.id] = p; });
    var insectMap = {};
    data.insects.forEach(function (i) { insectMap[i.id] = i; });
    var ixByPlant = {};
    var ixByInsect = {};
    fi.forEach(function (ix) {
      if (!ixByPlant[ix.pI]) ixByPlant[ix.pI] = [];
      ixByPlant[ix.pI].push(ix);
      if (!ixByInsect[ix.iI]) ixByInsect[ix.iI] = [];
      ixByInsect[ix.iI].push(ix);
    });
    return Object.assign({}, data, { plants: fp, interactions: fi, plantMap: plantMap, insectMap: insectMap, ixByPlant: ixByPlant, ixByInsect: ixByInsect });
  }, [data]);

  // Toggle just picks pre-computed version — instant
  var fData = euOnly && euData ? euData : data;

  if (data.loading) {
    return (
      <div className="app" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          <span style={{ color: '#10b981' }}>Phyto</span>
          <span style={{ color: '#f59e0b' }}>mia</span>
        </h1>
        <p style={{ color: '#888', marginTop: 12 }}>Chargement des données…</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="app" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          <span style={{ color: '#10b981' }}>Phyto</span>
          <span style={{ color: '#f59e0b' }}>mia</span>
        </h1>
        <p style={{ color: '#f43f5e', marginTop: 12 }}>Erreur : {data.error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header lang={lang} setLang={setLang} onLogoClick={function() { setHistory([]); setSelectedId(null); _setViewMode("ranking"); writeHash("home"); }} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <div className="view-toggle">
          <button className={euOnly ? "active" : ""} onClick={function () { setEuOnly(true); }}>Europe</button>
          <button className={!euOnly ? "active" : ""} onClick={function () { setEuOnly(false); }}>{lang === "fr" ? "Monde" : "World"}</button>
        </div>
      </div>
      {viewMode !== 'garden' && <SearchBar
        plants={fData.plants}
        insects={fData.insects}
        interactions={fData.interactions}
        lang={lang}
        onSelect={go} speciesView={speciesView} onViewChange={function(v) { setSpeciesView(v); var sp = data.plants.find(function(p){return p.id===selectedId;}) || data.insects.find(function(i){return i.id===selectedId;}); if (sp) writeHash('species', sp.sci, v); }}
      />}

      <div style={{ display: selectedId ? "none" : "block" }}>
        <div>
          <Tabs viewMode={viewMode} setViewMode={setViewMode} gardenCount={garden.length} lang={lang} />

          {viewMode === 'ranking' && (
            <Ranking key={euOnly ? 'eu' : 'world'}
              plants={fData.plants}
              insects={fData.insects}
              interactions={fData.interactions}
              ixByPlant={fData.ixByPlant}
              ixByInsect={fData.ixByInsect}
              lang={lang}
              onSelect={go} speciesView={speciesView} onViewChange={function(v) { setSpeciesView(v); var sp = data.plants.find(function(p){return p.id===selectedId;}) || data.insects.find(function(i){return i.id===selectedId;}); if (sp) writeHash('species', sp.sci, v); }}
            />
          )}

          {viewMode === 'garden' && (
            <Garden
              plants={fData.plants}
              insects={fData.insects}
              interactions={fData.interactions}
              garden={garden}
              setGarden={setGarden}
              lang={lang}
              onSelect={go} speciesView={speciesView} onViewChange={function(v) { setSpeciesView(v); var sp = data.plants.find(function(p){return p.id===selectedId;}) || data.insects.find(function(i){return i.id===selectedId;}); if (sp) writeHash('species', sp.sci, v); }}
            />
          )}

          <Footer lang={lang} lastUpdated={fData.lastUpdated} />
        </div>
      </div>

      {selected && (<div>
          <div style={{ position: "sticky", top: 0, background: "var(--bg)", zIndex: 10, borderBottom: "1px solid var(--border)", padding: "6px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <button onClick={back} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: "#555", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                {history.length > 0 ? (function() { var prev = data.plants.find(function(p){return p.id===history[history.length-1];}) || data.insects.find(function(i){return i.id===history[history.length-1];}); return prev ? prev.sci : (lang === "fr" ? "Retour" : "Back"); })() : (lang === "fr" ? (viewMode === "garden" ? "Mon jardin" : "Accueil") : (viewMode === "garden" ? "My garden" : "Home"))}
              </button>
              <button onClick={function() { setHistory([]); setSelectedId(null); _setViewMode("ranking"); writeHash("home"); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", fontSize: 11, color: "var(--text3)", background: "none", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                {viewMode === "garden" ? (lang === "fr" ? "Mon jardin" : "My garden") : (lang === "fr" ? "Accueil" : "Home")}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text3)", flexWrap: "wrap" }}>
              <span onClick={function() { setHistory([]); setSelectedId(null); _setViewMode("ranking"); writeHash("home"); }} style={{ cursor: "pointer" }}>{viewMode === "garden" ? (lang === "fr" ? "Mon jardin" : "My garden") : (lang === "fr" ? "Accueil" : "Home")}</span>
              {history.map(function(hid, idx) {
                var sp = data.plants.find(function(p){return p.id===hid;}) || data.insects.find(function(i){return i.id===hid;});
                if (!sp) return null;
                var cn = sp.common ? sp.common[lang] || "" : "";
                return (<span key={idx}><span style={{ margin: "0 2px" }}> › </span><span onClick={function() { setHistory(function(h){return h.slice(0,idx);}); setSelectedId(hid); }} style={{ cursor: "pointer" }}><em>{sp.sci}</em>{cn ? " (" + cn + ")" : ""}</span></span>);
              })}
              <span style={{ margin: "0 2px" }}> › </span>
              <span style={{ color: "var(--text)", fontWeight: 500 }}><em>{selected.sci}</em>{(function(){ var cn = selected.common ? selected.common[lang] || "" : ""; return cn ? " (" + cn + ")" : ""; })()}</span>
            </div>
          </div>
        <SpeciesDetail
          history={history}
          species={selected}
          isPlant={isPlant}
          plants={fData.plants}
          insects={fData.insects}
          interactions={fData.interactions}
          plantMap={fData.plantMap}
          insectMap={fData.insectMap}
          ixByPlant={fData.ixByPlant}
          ixByInsect={fData.ixByInsect}
          lang={lang}
          onSelect={go} speciesView={speciesView} onViewChange={function(v) { setSpeciesView(v); var sp = data.plants.find(function(p){return p.id===selectedId;}) || data.insects.find(function(i){return i.id===selectedId;}); if (sp) writeHash('species', sp.sci, v); }}
          onBack={back}
        />
      </div>)}
      <Lightbox />
    </div>
  );
}
