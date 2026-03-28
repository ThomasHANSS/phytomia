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

  function go(id) { setSelectedId(id); }
  function back() { setSelectedId(null); }

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

      {!selectedId && (
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
      )}

      {selected && (
        <SpeciesDetail
          species={selected}
          isPlant={isPlant}
          plants={data.plants}
          insects={data.insects}
          interactions={data.interactions}
          lang={lang}
          onSelect={go}
          onBack={back}
        />
      )}
    </div>
  );
}
