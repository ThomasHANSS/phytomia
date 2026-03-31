import { useState, useMemo } from 'react';
import Thumb from './Thumb';
import ThreatBadge from './ThreatBadge';
import { TYPES, FAMILIES } from '../utils/types';

function getName(item, lang) { return item.common ? item.common[lang] || item.sci : item.sci; }
function obsCount(ix) { return ix.src.reduce(function (s, sr) { return s + (sr.n || 1); }, 0); }

function OverviewPanel(props) {
  var groups = props.groups, lang = props.lang, onSelect = props.onSelect, onSelSpecies = props.onSelSpecies, isP = props.isP;
  var total = groups.reduce(function (s, g) { return s + g.count; }, 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {groups.map(function (g) {
        var fam = FAMILIES[g.key]; var col = fam ? fam.color : "#888";
        var pct = Math.round(g.count / total * 100);
        return (
          <div key={g.key} onClick={function () { onSelect(g.key); }}
            style={{ border: "1px solid " + col + "30", borderLeft: "4px solid " + col, borderRadius: 10,
              padding: "10px 14px", cursor: "pointer", background: "var(--bg)" }}
            onMouseEnter={function (e) { e.currentTarget.style.boxShadow = "0 2px 12px " + col + "18"; }}
            onMouseLeave={function (e) { e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: col, minWidth: 36 }}>{g.count}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: col }}>{fam ? fam[lang] : g.key}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>
                    {g.types.map(function (t) { return TYPES[t] ? TYPES[t][lang] : ""; }).filter(Boolean).join(" \u00b7 ")}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 11, color: col, fontWeight: 500 }}>
                {lang === "fr" ? "Explorer \u203a" : "Explore \u203a"}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: col + "15", marginBottom: 8 }}>
              <div style={{ height: 4, borderRadius: 2, background: col, width: pct + "%", minWidth: 4 }} />
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              {g.top5.map(function (sp) {
                return (
                  <div key={sp.id} onClick={function (e) { e.stopPropagation(); onSelSpecies(sp.id); }}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px 3px 3px",
                      border: "1px solid var(--border)", borderRadius: 20, background: "var(--bg2)",
                      cursor: "pointer", flexShrink: 0 }}
                    onMouseEnter={function (e) { e.currentTarget.style.background = col + "10"; }}
                    onMouseLeave={function (e) { e.currentTarget.style.background = "var(--bg2)"; }}>
                    <Thumb name={sp.sci} sz={22} item={sp} isPlant={!isP} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 500, fontStyle: "italic", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{sp.sci}</div>
                      <div style={{ fontSize: 8, color: "var(--text3)", whiteSpace: "nowrap" }}>{sp.obs} obs</div>
                    </div>
                    {sp.threat && <ThreatBadge cat={sp.threat} lang={lang} size="sm" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FamilyDetail(props) {
  var familyKey = props.familyKey, speciesList = props.speciesList, ixs = props.ixs;
  var lang = props.lang, onSel = props.onSel, onBack = props.onBack, isP = props.isP;
  var _showAll = useState(false), showAll = _showAll[0], setShowAll = _showAll[1];
  var fam = FAMILIES[familyKey]; var col = fam ? fam.color : "#888";

  var byOrder = useMemo(function () {
    var map = {};
    speciesList.forEach(function (sp) {
      var ord = sp.order || sp.family || (lang === "fr" ? "Autre" : "Other");
      if (!map[ord]) map[ord] = [];
      map[ord].push(sp);
    });
    return Object.keys(map).sort(function (a, b) {
      var obsA = map[a].reduce(function (s, sp) { return s + sp.obs; }, 0);
      var obsB = map[b].reduce(function (s, sp) { return s + sp.obs; }, 0);
      return obsB - obsA;
    }).map(function (ord) { return { order: ord, species: map[ord] }; });
  }, [speciesList, lang]);

  var subTypes = useMemo(function () {
    var s = new Set();
    ixs.forEach(function (ix) { var tp = TYPES[ix.tp]; if (tp && tp.fam === familyKey) s.add(ix.tp); });
    return Array.from(s);
  }, [ixs, familyKey]);

  var topCount = 10;
  var topSpecies = speciesList.slice(0, topCount);
  var maxObs = topSpecies[0] ? topSpecies[0].obs : 1;
  var rest = speciesList.slice(topCount);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={onBack}
          style={{ padding: "6px 14px", fontSize: 12, border: "1px solid var(--border)", borderRadius: 8,
            background: "var(--bg2)", cursor: "pointer", color: "var(--text2)" }}>
          {lang === "fr" ? "\u2190 Vue d'ensemble" : "\u2190 Overview"}
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: col }}>{fam ? fam[lang] : familyKey}</span>
          <span style={{ fontSize: 12, color: "var(--text2)", marginLeft: 8 }}>
            {speciesList.length} {lang === "fr" ? "esp\u00e8ces" : "species"}
          </span>
          {subTypes.length > 1 && (
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
              {subTypes.map(function (t) { return TYPES[t] ? TYPES[t][lang] : ""; }).filter(Boolean).join(" \u00b7 ")}
            </div>
          )}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>
          Top {Math.min(topCount, speciesList.length)}
        </div>
        {topSpecies.map(function (sp, i) {
          var barW = Math.max(8, (sp.obs / maxObs) * 100);
          return (
            <div key={sp.id} onClick={function () { onSel(sp.id); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", borderRadius: 6 }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg2)"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 10, color: "var(--text3)", minWidth: 16, textAlign: "right" }}>{i + 1}</span>
              <Thumb name={sp.sci} sz={28} item={sp} isPlant={!isP} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, fontStyle: "italic", color: "var(--text)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sp.sci}</span>
                  <span style={{ fontSize: 10, color: "var(--text2)", whiteSpace: "nowrap" }}>{getName(sp, lang)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <div style={{ height: 6, borderRadius: 3, background: col + "20", flex: 1, maxWidth: 160 }}>
                    <div style={{ height: 6, borderRadius: 3, background: col, width: barW + "%" }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "var(--text2)", minWidth: 36 }}>{sp.obs} obs</span>
                </div>
              </div>
              {sp.threat && <ThreatBadge cat={sp.threat} lang={lang} size="sm" />}
              <span style={{ fontSize: 9, color: "var(--text3)", minWidth: 60, textAlign: "right" }}>
                {sp.order || sp.family || ""}
              </span>
            </div>
          );
        })}
      </div>
      {rest.length > 0 && (
        <div>
          <button onClick={function () { setShowAll(!showAll); }}
            style={{ width: "100%", padding: "10px", fontSize: 12, fontWeight: 500,
              border: "1px solid " + col + "30", borderRadius: 8, background: col + "06",
              cursor: "pointer", color: col, textAlign: "center" }}>
            {showAll
              ? "\u25b2 " + (lang === "fr" ? "Masquer les " : "Hide ") + rest.length + (lang === "fr" ? " autres" : " others")
              : "\u25bc " + rest.length + (lang === "fr" ? " autres esp\u00e8ces par ordre taxonomique" : " more species by taxonomic order")}
          </button>
          {showAll && (
            <div style={{ marginTop: 8 }}>
              {byOrder.map(function (group) {
                var remaining = group.species.filter(function (sp) {
                  return !topSpecies.some(function (t) { return t.id === sp.id; });
                });
                if (remaining.length === 0) return null;
                return (
                  <div key={group.order} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: col, padding: "4px 0",
                      borderBottom: "1px solid " + col + "20", marginBottom: 4 }}>
                      {group.order} <span style={{ fontWeight: 400, color: "var(--text3)" }}>({remaining.length})</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 4 }}>
                      {remaining.map(function (sp) {
                        return (
                          <div key={sp.id} onClick={function () { onSel(sp.id); }}
                            title={sp.sci + " \u2014 " + getName(sp, lang) + " (" + sp.obs + " obs)"}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 6px",
                              cursor: "pointer", borderRadius: 6 }}
                            onMouseEnter={function (e) { e.currentTarget.style.background = "var(--bg2)"; }}
                            onMouseLeave={function (e) { e.currentTarget.style.background = "transparent"; }}>
                            <Thumb name={sp.sci} sz={20} item={sp} isPlant={!isP} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontStyle: "italic", color: "var(--text)",
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sp.sci}</div>
                            </div>
                            <span style={{ fontSize: 8, color: "var(--text3)" }}>{sp.obs}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetworkGraph(props) {
  var center = props.center, partners = props.partners, ixs = props.ixs;
  var lang = props.lang, onSel = props.onSel, plants = props.plants;
  var isP = !!plants.find(function (p) { return p.id === center.id; });
  var _f = useState(null), selectedFamily = _f[0], setSelectedFamily = _f[1];
  useMemo(function () { setSelectedFamily(null); }, [center.id]);

  var groups = useMemo(function () {
    var map = {};
    ixs.forEach(function (ix) {
      var tp = TYPES[ix.tp]; if (!tp) return;
      var fam = tp.fam;
      if (!map[fam]) map[fam] = { key: fam, count: 0, pids: new Set(), totalObs: 0, types: new Set(), partners: {} };
      map[fam].pids.add(isP ? ix.iI : ix.pI);
      map[fam].totalObs += obsCount(ix);
      map[fam].types.add(ix.tp);
      var pid = isP ? ix.iI : ix.pI;
      map[fam].partners[pid] = (map[fam].partners[pid] || 0) + obsCount(ix);
    });
    return Object.values(map).map(function (g) {
      g.count = g.pids.size;
      g.types = Array.from(g.types);
      var sorted = Object.keys(g.partners).sort(function (a, b) { return g.partners[b] - g.partners[a]; });
      g.top5 = sorted.slice(0, 5).map(function (pid) {
        var p = partners.find(function (pp) { return pp.id === pid; });
        return p ? Object.assign({}, p, { obs: g.partners[pid] }) : null;
      }).filter(Boolean);
      return g;
    }).sort(function (a, b) { return b.count - a.count; });
  }, [ixs, partners, isP]);

  var familySpecies = useMemo(function () {
    if (!selectedFamily) return [];
    var famIxs = ixs.filter(function (ix) { var tp = TYPES[ix.tp]; return tp && tp.fam === selectedFamily; });
    var obsMap = {};
    famIxs.forEach(function (ix) { var pid = isP ? ix.iI : ix.pI; obsMap[pid] = (obsMap[pid] || 0) + obsCount(ix); });
    return Object.keys(obsMap).map(function (pid) {
      var p = partners.find(function (pp) { return pp.id === pid; });
      return p ? Object.assign({}, p, { obs: obsMap[pid] }) : null;
    }).filter(Boolean).sort(function (a, b) { return b.obs - a.obs; });
  }, [selectedFamily, ixs, partners, isP]);

  if (partners.length === 0) return null;

  if (selectedFamily) {
    return (<FamilyDetail familyKey={selectedFamily} speciesList={familySpecies}
      ixs={ixs} lang={lang} onSel={onSel} isP={isP}
      onBack={function () { setSelectedFamily(null); }} />);
  }

  return (
    <div>
      <OverviewPanel groups={groups} lang={lang}
        onSelect={setSelectedFamily} onSelSpecies={onSel} isP={isP} />
      <p style={{ fontSize: 9, color: "var(--text3)", textAlign: "center", marginTop: 8 }}>
        {lang === "fr" ? "Cliquez une cat\u00e9gorie pour explorer \u00b7 Cliquez une esp\u00e8ce pour voir sa fiche" : "Click a category to explore \u00b7 Click a species for details"}
      </p>
    </div>
  );
}
