import { useState, useMemo } from 'react';
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
  var _v = useState('ranking'), viewMode = _v[0], setViewMode = _v[1];
  var _s = useState(null), selectedId = _s[0], setSelectedId = _s[1];
  var _h = useState([]), history = _h[0], setHistory = _h[1];
  var _g = useState([]), garden = _g[0], setGarden = _g[1];

  var selected = useMemo(function () {
    if (!selectedId) return null;
    return data.plants.find(function (p) { return p.id === selectedId; }) ||
           data.insects.find(function (i) { return i.id === selectedId; });
  }, [selectedId, data.plants, data.insects]);

  var isPlant = useMemo(function () {
    if (!selectedId) return null;
    return !!data.plants.find(function (p) { return p.id === selectedId; });
  }, [selectedId, data.plants]);

  function go(id) { if (selectedId) { setHistory(function(h) { return h.concat([selectedId]); }); } setSelectedId(id); }
  function back() {
    if (history.length > 0) {
      var prev = history[history.length - 1];
      setHistory(function(h) { return h.slice(0, -1); });
      setSelectedId(prev);
    } else {
      setSelectedId(null);
    }
  }

  if (data.loading) {
    return (
      <div className="app" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          <span style={{ color: '#2d7d46' }}>Phyto</span>
          <span style={{ color: '#b8860b' }}>mia</span>
        </h1>
        <p style={{ color: '#888', marginTop: 12 }}>Chargement des données…</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="app" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          <span style={{ color: '#2d7d46' }}>Phyto</span>
          <span style={{ color: '#b8860b' }}>mia</span>
        </h1>
        <p style={{ color: '#c0392b', marginTop: 12 }}>Erreur : {data.error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header lang={lang} setLang={setLang} onLogoClick={back} />

      <SearchBar
        plants={data.plants}
        insects={data.insects}
        interactions={data.interactions}
        lang={lang}
        onSelect={go}
      />

      <div style={{ display: selectedId ? "none" : "block" }}>
        <div>
          <Tabs viewMode={viewMode} setViewMode={setViewMode} gardenCount={garden.length} lang={lang} />

          {viewMode === 'ranking' && (
            <Ranking
              plants={data.plants}
              insects={data.insects}
              interactions={data.interactions}
              lang={lang}
              onSelect={go}
            />
          )}

          {viewMode === 'garden' && (
            <Garden
              plants={data.plants}
              insects={data.insects}
              interactions={data.interactions}
              garden={garden}
              setGarden={setGarden}
              lang={lang}
              onSelect={go}
            />
          )}

          <Footer lang={lang} lastUpdated={data.lastUpdated} />
        </div>
      </div>

      {selected && (<div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", fontSize: 12, color: "var(--text2)", flexWrap: "wrap", position: "sticky", top: 0, background: "var(--bg)", zIndex: 10, borderBottom: "1px solid var(--border)" }}>
            <span onClick={function() { setHistory([]); setSelectedId(null); }} style={{ cursor: "pointer", color: "var(--text3)" }}>{lang === "fr" ? "Accueil" : "Home"}</span>
            {history.map(function(hid, idx) {
              var sp = data.plants.find(function(p){return p.id===hid;}) || data.insects.find(function(i){return i.id===hid;});
              if (!sp) return null;
              return (<span key={idx}><span style={{ margin: "0 4px", color: "var(--text3)" }}> › </span><span onClick={function() { setHistory(function(h){return h.slice(0,idx);}); setSelectedId(hid); }} style={{ cursor: "pointer", fontStyle: "italic" }}>{sp.sci}</span></span>);
            })}
            <span style={{ margin: "0 4px", color: "var(--text3)" }}> › </span>
            <span style={{ fontWeight: 500, fontStyle: "italic", color: "var(--text)" }}>{selected.sci}</span>
          </div>
        <SpeciesDetail
          species={selected}
          isPlant={isPlant}
          plants={data.plants}
          insects={data.insects}
          interactions={data.interactions}
          plantMap={data.plantMap}
          insectMap={data.insectMap}
          ixByPlant={data.ixByPlant}
          ixByInsect={data.ixByInsect}
          lang={lang}
          onSelect={go}
          onBack={back}
        />
      </div>)}
    </div>
  );
}
