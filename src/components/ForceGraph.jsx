import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TYPES, FAMILIES } from '../utils/types';

function getName(item, lang) {
  return item.common ? item.common[lang] || item.common.fr || '' : '';
}

var TYPE_COLORS = {};
Object.keys(TYPES).forEach(function (k) {
  var tp = TYPES[k]; var fam = FAMILIES[tp.fam];
  TYPE_COLORS[k] = fam ? fam.color : '#888';
});

var ORDER_COLORS = {
  Lepidoptera: '#8b5cf6', Hymenoptera: '#b8860b', Diptera: '#6b8e23',
  Coleoptera: '#a0522d', Hemiptera: '#2874a6', Thysanoptera: '#888',
  Trichoptera: '#5f9ea0', Orthoptera: '#c0392b', Neuroptera: '#27ae60'
};

var GF_COLORS = { tree: '#2d7d46', shrub: '#4a8c3f', climber: '#3a7d44', herb: '#6b8e23', grass: '#8fae5e' };

export default function ForceGraph(props) {
  var species = props.species, partners = props.partners, ixs = props.ixs;
  var lang = props.lang, onNavigate = props.onNavigate, isPlant = props.isPlant;

  var canvasRef = useRef(null);
  var animRef = useRef(null);
  var nodesRef = useRef([]);
  var linksRef = useRef([]);
  var hoverRef = useRef(null);
  var panRef = useRef({ x: 0, y: 0, scale: 1 });
  var dragRef = useRef(null);
  var lastMouseRef = useRef(null);
  var [tooltip, setTooltip] = useState(null);
  var [filters, setFilters] = useState({ entities: {}, types: {}, threatened: false });
  var [showLegend, setShowLegend] = useState(false);

  var ORDER_LABELS = {
    Lepidoptera: lang === 'fr' ? 'Lépidoptères' : 'Lepidoptera',
    Hymenoptera: lang === 'fr' ? 'Hyménoptères' : 'Hymenoptera',
    Diptera: lang === 'fr' ? 'Diptères' : 'Diptera',
    Coleoptera: lang === 'fr' ? 'Coléoptères' : 'Coleoptera',
    Hemiptera: lang === 'fr' ? 'Hémiptères' : 'Hemiptera',
    Thysanoptera: lang === 'fr' ? 'Thysanoptères' : 'Thysanoptera',
    Trichoptera: lang === 'fr' ? 'Trichoptères' : 'Trichoptera',
    Orthoptera: lang === 'fr' ? 'Orthoptères' : 'Orthoptera',
    Neuroptera: lang === 'fr' ? 'Névroptères' : 'Neuroptera',
  };
  var GF_LABELS = {
    tree: lang === 'fr' ? 'Arbres' : 'Trees',
    shrub: lang === 'fr' ? 'Arbustes' : 'Shrubs',
    climber: lang === 'fr' ? 'Grimpantes' : 'Climbers',
    herb: lang === 'fr' ? 'Herbacées' : 'Herbs',
    grass: lang === 'fr' ? 'Graminées' : 'Grasses',
  };

  // Available entity + type filters
  var filterOptions = useMemo(function () {
    var entities = {};
    var types = {};
    partners.forEach(function (p) {
      if (isPlant) {
        var o = p.order || '';
        if (o && ORDER_COLORS[o]) entities[o] = (entities[o] || 0) + 1;
      } else {
        var gf = p.growthForm || 'herb';
        entities[gf] = (entities[gf] || 0) + 1;
      }
    });
    ixs.forEach(function (ix) {
      var tp = TYPES[ix.tp];
      if (tp) types[ix.tp] = (types[ix.tp] || 0) + 1;
    });
    return { entities: entities, types: types };
  }, [partners, ixs, isPlant]);

  var hasAnyFilter = useMemo(function () {
    if (filters.threatened) return true;
    var ek = Object.keys(filters.entities);
    for (var i = 0; i < ek.length; i++) { if (filters.entities[ek[i]]) return true; }
    var tk = Object.keys(filters.types);
    for (var j = 0; j < tk.length; j++) { if (filters.types[tk[j]]) return true; }
    return false;
  }, [filters]);

  // Build graph
  var graph = useMemo(function () {
    var nodes = [];
    var links = [];
    var activeEntities = Object.keys(filters.entities).filter(function (k) { return filters.entities[k]; });
    var activeTypes = Object.keys(filters.types).filter(function (k) { return filters.types[k]; });
    var hasEntityFilter = activeEntities.length > 0;
    var hasTypeFilter = activeTypes.length > 0;

    var filteredIxs = ixs.filter(function (ix) {
      if (hasTypeFilter && activeTypes.indexOf(ix.tp) === -1) return false;
      return true;
    });

    var partnerObs = {};
    filteredIxs.forEach(function (ix) {
      var pid = isPlant ? ix.iI : ix.pI;
      if (!partnerObs[pid]) partnerObs[pid] = { types: {}, count: 0 };
      partnerObs[pid].types[ix.tp] = (partnerObs[pid].types[ix.tp] || 0) + 1;
      partnerObs[pid].count += 1;
    });

    var filteredPartners = partners.filter(function (p) {
      if (!partnerObs[p.id]) return false;
      if (hasEntityFilter) {
        if (isPlant) {
          if (activeEntities.indexOf(p.order || '') === -1) return false;
        } else {
          if (activeEntities.indexOf(p.growthForm || 'herb') === -1) return false;
        }
      }
      if (filters.threatened && !(p.threat === 'CR' || p.threat === 'EN' || p.threat === 'VU')) return false;
      return true;
    });

    // Center
    nodes.push({
      id: species.id, sci: species.sci, label: getName(species, lang) || species.sci,
      isCenter: true, isPlant: isPlant, threat: species.threat, order: species.order || '',
      growthForm: species.growthForm || 'herb',
      x: 0, y: 0, vx: 0, vy: 0, r: 30
    });

    var sorted = filteredPartners.sort(function (a, b) {
      return (partnerObs[b.id] || { count: 0 }).count - (partnerObs[a.id] || { count: 0 }).count;
    }).slice(0, 80);

    var angle = 0, step = sorted.length > 0 ? (Math.PI * 2) / sorted.length : 0;
    sorted.forEach(function (p) {
      var obs = partnerObs[p.id] || { types: {}, count: 1 };
      var r = Math.max(8, Math.min(22, 6 + Math.sqrt(obs.count) * 3));
      var dist = 160 + Math.random() * 100;
      var entityColor = isPlant
        ? (ORDER_COLORS[p.order || ''] || '#88888870')
        : (GF_COLORS[p.growthForm || 'herb'] || '#6b8e2370');
      nodes.push({
        id: p.id, sci: p.sci, label: getName(p, lang) || p.sci,
        isCenter: false, isPlant: !isPlant, threat: p.threat, order: p.order || '',
        growthForm: p.growthForm || 'herb',
        x: Math.cos(angle) * dist, y: Math.sin(angle) * dist,
        vx: 0, vy: 0, r: r, count: obs.count, entityColor: entityColor
      });
      angle += step;

      // Create separate links per type (not overlapping)
      var typeKeys = Object.keys(obs.types);
      var nTypes = typeKeys.length;
      typeKeys.forEach(function (tp, ti) {
        var type = TYPES[tp]; if (!type) return;
        links.push({
          source: species.id, target: p.id,
          color: TYPE_COLORS[tp] || '#888',
          dash: type.dash, width: Math.min(type.w || 1.5, 3), tp: tp,
          offset: nTypes > 1 ? (ti - (nTypes - 1) / 2) * 8 : 0
        });
      });
    });

    return { nodes: nodes, links: links };
  }, [species.id, partners, ixs, isPlant, lang, filters]);

  // Simulation
  useEffect(function () {
    var nodes = graph.nodes.map(function (n) { return Object.assign({}, n); });
    var links = graph.links;
    nodesRef.current = nodes;
    linksRef.current = links;

    var nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });

    function tick() {
      nodes.forEach(function (n) {
        if (n.isCenter) { n.x *= 0.95; n.y *= 0.95; return; }
        if (dragRef.current && dragRef.current.id === n.id) return;
        nodes.forEach(function (m) {
          if (n.id === m.id) return;
          var dx = n.x - m.x, dy = n.y - m.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 250) {
            var force = 900 / (dist * dist);
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        });
        links.forEach(function (l) {
          if (l.target !== n.id && l.source !== n.id) return;
          var other = l.source === n.id ? nodeMap[l.target] : nodeMap[l.source];
          if (!other) return;
          var dx = other.x - n.x, dy = other.y - n.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var ideal = 130 + n.r + other.r;
          n.vx += (dx / dist) * (dist - ideal) * 0.007;
          n.vy += (dy / dist) * (dist - ideal) * 0.007;
        });
        n.vx -= n.x * 0.0008;
        n.vy -= n.y * 0.0008;
        n.vx *= 0.87;
        n.vy *= 0.87;
        n.x += n.vx;
        n.y += n.vy;
      });
    }

    function draw() {
      var canvas = canvasRef.current;
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;
      var W = canvas.width, H = canvas.height;
      var pan = panRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2 + pan.x * dpr, H / 2 + pan.y * dpr);
      ctx.scale(pan.scale, pan.scale);
      var sc = dpr;

      // Links with offset for multi-type
      links.forEach(function (l) {
        var s = nodeMap[l.source], t = nodeMap[l.target];
        if (!s || !t) return;
        var isHl = hoverRef.current && (l.source === hoverRef.current || l.target === hoverRef.current);
        var dx = t.x - s.x, dy = t.y - s.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / len, ny = dx / len;
        var off = (l.offset || 0) * sc;
        ctx.beginPath();
        ctx.moveTo((s.x + nx * off) * sc, (s.y + ny * off) * sc);
        ctx.lineTo((t.x + nx * off) * sc, (t.y + ny * off) * sc);
        ctx.strokeStyle = isHl ? l.color : l.color + '35';
        ctx.lineWidth = (isHl ? l.width + 1.5 : l.width * 0.8) * sc / pan.scale;
        if (l.dash && l.dash !== 'none') {
          ctx.setLineDash(l.dash.split(' ').map(function (v) { return Number(v) * sc; }));
        } else { ctx.setLineDash([]); }
        ctx.stroke();
        ctx.setLineDash([]);

        // Type label on highlighted links
        if (isHl && l.offset !== undefined) {
          var mx = ((s.x + t.x) / 2 + nx * off) * sc;
          var my = ((s.y + t.y) / 2 + ny * off) * sc;
          var tp = TYPES[l.tp];
          if (tp) {
            var fs = Math.round(8 * sc / pan.scale);
            ctx.font = fs + 'px system-ui';
            var txt = tp[lang] || l.tp;
            var met = ctx.measureText(txt);
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillRect(mx - met.width / 2 - 2 * sc, my - fs / 2 - 1 * sc, met.width + 4 * sc, fs + 2 * sc);
            ctx.fillStyle = l.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(txt, mx, my);
          }
        }
      });

      // Nodes
      nodes.forEach(function (n) {
        var hover = hoverRef.current === n.id;
        var r = n.r * sc;
        if (n.isCenter) {
          ctx.shadowColor = 'rgba(0,0,0,0.15)';
          ctx.shadowBlur = 12 * sc;
        }
        ctx.beginPath();
        ctx.arc(n.x * sc, n.y * sc, r + (hover ? 4 * sc : 0), 0, Math.PI * 2);
        if (n.isCenter) {
          ctx.fillStyle = n.isPlant ? '#2d7d46' : '#b8860b';
        } else if (n.threat === 'CR') {
          ctx.fillStyle = '#cc3333';
        } else if (n.threat === 'EN') {
          ctx.fillStyle = '#e74c3c';
        } else if (n.threat === 'VU') {
          ctx.fillStyle = '#e67e22';
        } else {
          ctx.fillStyle = n.entityColor || '#88888860';
        }
        ctx.fill();
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
        if (n.isCenter) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * sc / pan.scale; ctx.stroke();
        } else if (hover) {
          ctx.strokeStyle = '#333'; ctx.lineWidth = 2 * sc / pan.scale; ctx.stroke();
        }

        // Label
        if (n.isCenter || hover || n.r >= 14) {
          var fs2 = Math.round((n.isCenter ? 12 : 10) * sc / pan.scale);
          ctx.font = (n.isCenter ? 'bold italic ' : 'italic ') + fs2 + 'px system-ui';
          var txt2 = n.sci.length > 22 ? n.sci.split(' ')[0][0] + '. ' + (n.sci.split(' ')[1] || '') : n.sci;
          var met2 = ctx.measureText(txt2);
          ctx.fillStyle = 'rgba(255,255,255,0.88)';
          ctx.fillRect(n.x * sc - met2.width / 2 - 3 * sc, (n.y + n.r + 3) * sc, met2.width + 6 * sc, fs2 + 4 * sc);
          ctx.fillStyle = '#333';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(txt2, n.x * sc, (n.y + n.r + 4) * sc);
        }
      });

      ctx.restore();
    }

    var running = true;
    function loop() { if (!running) return; tick(); draw(); animRef.current = requestAnimationFrame(loop); }
    loop();
    return function () { running = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [graph]);

  // Resize
  useEffect(function () {
    var canvas = canvasRef.current; if (!canvas) return;
    function resize() {
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr; canvas.height = 650 * dpr;
      canvas.style.width = rect.width + 'px'; canvas.style.height = '650px';
    }
    resize(); window.addEventListener('resize', resize);
    return function () { window.removeEventListener('resize', resize); };
  }, []);

  // Hit test
  var getNodeAt = useCallback(function (cx, cy) {
    var canvas = canvasRef.current; if (!canvas) return null;
    var dpr = window.devicePixelRatio || 1;
    var pan = panRef.current;
    var x = (cx * dpr - canvas.width / 2 - pan.x * dpr) / pan.scale / dpr;
    var y = (cy * dpr - canvas.height / 2 - pan.y * dpr) / pan.scale / dpr;
    var found = null;
    nodesRef.current.forEach(function (n) {
      var dx = n.x - x, dy = n.y - y;
      if (dx * dx + dy * dy < (n.r + 6) * (n.r + 6)) found = n;
    });
    return found;
  }, []);

  var onMouseMove = useCallback(function (e) {
    var rect = canvasRef.current.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (dragRef.current) {
      dragRef.current.x += e.movementX / panRef.current.scale;
      dragRef.current.y += e.movementY / panRef.current.scale;
      dragRef.current.vx = 0; dragRef.current.vy = 0;
      return;
    }
    var n = getNodeAt(mx, my);
    hoverRef.current = n ? n.id : null;
    canvasRef.current.style.cursor = n && !n.isCenter ? 'pointer' : (n ? 'grab' : 'default');
    if (n && !n.isCenter) {
      setTooltip({ x: mx, y: my, sci: n.sci, label: n.label, threat: n.threat, count: n.count || 0, isPlant: n.isPlant, order: n.order, growthForm: n.growthForm });
    } else { setTooltip(null); }
  }, [getNodeAt]);

  var onMouseDown = useCallback(function (e) {
    var rect = canvasRef.current.getBoundingClientRect();
    var n = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (n) { dragRef.current = n; lastMouseRef.current = { x: e.clientX, y: e.clientY }; }
  }, [getNodeAt]);

  var onMouseUp = useCallback(function (e) {
    if (dragRef.current && lastMouseRef.current) {
      var dx = e.clientX - lastMouseRef.current.x, dy = e.clientY - lastMouseRef.current.y;
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4 && !dragRef.current.isCenter) {
        onNavigate(dragRef.current.id);
      }
    }
    dragRef.current = null; lastMouseRef.current = null;
  }, [onNavigate]);

  var onWheel = useCallback(function (e) {
    e.preventDefault();
    panRef.current.scale = Math.max(0.3, Math.min(3, panRef.current.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
  }, []);

  function toggleFilter(category, key) {
    setFilters(function (f) {
      var copy = JSON.parse(JSON.stringify(f));
      if (category === 'threatened') { copy.threatened = !copy.threatened; }
      else { copy[category][key] = !copy[category][key]; }
      return copy;
    });
  }

  function resetFilters() {
    setFilters({ entities: {}, types: {}, threatened: false });
  }

  var tt = lang === 'fr'
    ? { sp: 'espèces', lk: 'liens', reset: 'Recentrer', legend: 'Légende', all: 'Tous',
        entityLabel: isPlant ? 'Ordres d\'insectes' : 'Types de végétaux',
        typeLabel: 'Types d\'interaction', threatened: 'Menacées', click: 'Cliquer pour explorer',
        size: 'Taille proportionnelle au nombre d\'interactions', nodes: 'Nœuds', linksL: 'Liens' }
    : { sp: 'species', lk: 'links', reset: 'Reset', legend: 'Legend', all: 'All',
        entityLabel: isPlant ? 'Insect orders' : 'Plant types',
        typeLabel: 'Interaction types', threatened: 'Threatened', click: 'Click to explore',
        size: 'Size proportional to interaction count', nodes: 'Nodes', linksL: 'Links' };

  var entityLabels = isPlant ? ORDER_LABELS : GF_LABELS;
  var entityColors = isPlant ? ORDER_COLORS : GF_COLORS;

  return (
    <div>
      {/* Entity filters */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', minWidth: 'fit-content' }}>{tt.entityLabel} :</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Object.keys(filterOptions.entities).sort(function (a, b) { return filterOptions.entities[b] - filterOptions.entities[a]; }).map(function (k) {
              var col = entityColors[k] || '#888';
              var active = filters.entities[k];
              return (<button key={k} onClick={function () { toggleFilter('entities', k); }}
                style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid ' + col + (active ? '' : '40'),
                  background: active ? col + '20' : 'transparent',
                  color: active ? col : 'var(--text3)', fontWeight: active ? 600 : 400 }}>
                {entityLabels[k] || k} <span style={{ opacity: 0.5 }}>{filterOptions.entities[k]}</span>
              </button>);
            })}
          </div>
        </div>

        {/* Type filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', minWidth: 'fit-content' }}>{tt.typeLabel} :</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Object.keys(filterOptions.types).sort(function (a, b) { return filterOptions.types[b] - filterOptions.types[a]; }).map(function (tp) {
              var type = TYPES[tp]; if (!type) return null;
              var col = TYPE_COLORS[tp] || '#888';
              var active = filters.types[tp];
              return (<button key={tp} onClick={function () { toggleFilter('types', tp); }}
                style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid ' + col + (active ? '' : '40'),
                  background: active ? col + '20' : 'transparent',
                  color: active ? col : 'var(--text3)', fontWeight: active ? 600 : 400 }}>
                <svg width="14" height="6" style={{ verticalAlign: 'middle', marginRight: 3 }}><line x1="0" y1="3" x2="14" y2="3" stroke={col} strokeWidth={type.w || 1.5} strokeDasharray={type.dash === 'none' ? '' : type.dash} /></svg>
                {type[lang]} <span style={{ opacity: 0.5 }}>{filterOptions.types[tp]}</span>
              </button>);
            })}
          </div>
        </div>

        {/* Threatened + reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={function () { toggleFilter('threatened'); }}
            style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
              border: '1px solid ' + (filters.threatened ? '#cc3333' : '#cc333340'),
              background: filters.threatened ? '#cc333320' : 'transparent',
              color: filters.threatened ? '#cc3333' : 'var(--text3)', fontWeight: filters.threatened ? 600 : 400 }}>
            {tt.threatened}
          </button>
          {hasAnyFilter && (
            <button onClick={resetFilters}
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                border: '1px solid var(--border)', background: '#55555510', color: 'var(--text2)', fontWeight: 500 }}>
              ✕ {tt.all}
            </button>
          )}
        </div>
      </div>

      {/* Stats + controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
          {graph.nodes.length - 1} {tt.sp} · {graph.links.length} {tt.lk}
          {graph.nodes.length >= 81 ? ' (top 80)' : ''}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={function () { setShowLegend(function (s) { return !s; }); }}
            style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, background: showLegend ? 'var(--text3)' : 'var(--bg)', color: showLegend ? '#fff' : 'var(--text2)' }}>
            {tt.legend}
          </button>
          <button onClick={function () { panRef.current = { x: 0, y: 0, scale: 1 }; }}
            style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--text2)' }}>
            {tt.reset}
          </button>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div style={{ display: 'flex', gap: 20, padding: '10px 14px', marginBottom: 8, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 11, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 5, color: 'var(--text)' }}>{tt.nodes}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 6, background: isPlant ? '#2d7d46' : '#b8860b', border: '2px solid #fff', marginRight: 5, verticalAlign: 'middle' }} />{species.sci}</span>
              {Object.keys(filterOptions.entities).sort(function (a, b) { return filterOptions.entities[b] - filterOptions.entities[a]; }).map(function (k) {
                var col = entityColors[k] || '#888';
                return (<span key={k}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: col + '90', marginRight: 5, verticalAlign: 'middle' }} />{entityLabels[k] || k}</span>);
              })}
              <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: '#cc3333', marginRight: 5, verticalAlign: 'middle' }} />{lang === 'fr' ? 'En danger critique / En danger' : 'CR / EN'}</span>
              <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 5, background: '#e67e22', marginRight: 5, verticalAlign: 'middle' }} />{lang === 'fr' ? 'Vulnérable' : 'Vulnerable'}</span>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 5, color: 'var(--text)' }}>{tt.linksL}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.keys(filterOptions.types).sort(function (a, b) { return filterOptions.types[b] - filterOptions.types[a]; }).map(function (tp) {
                var type = TYPES[tp]; if (!type) return null;
                var col = TYPE_COLORS[tp] || '#888';
                return (<span key={tp} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke={col} strokeWidth={type.w || 1.5} strokeDasharray={type.dash === 'none' ? '' : type.dash} /></svg>
                  {type[lang]}
                </span>);
              })}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 5, color: 'var(--text)' }}>{lang === 'fr' ? 'Taille' : 'Size'}</div>
            <div style={{ color: 'var(--text2)' }}>{tt.size}</div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef}
          onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp}
          onMouseLeave={function () { dragRef.current = null; setTooltip(null); hoverRef.current = null; }}
          onWheel={onWheel}
          style={{ width: '100%', height: 650, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', touchAction: 'none' }}
        />
        {tooltip && (
          <div style={{
            position: 'absolute', left: Math.min(tooltip.x + 12, 260), top: Math.max(tooltip.y - 70, 10),
            background: '#ffffffee', border: '1px solid var(--border)',
            borderRadius: 8, padding: '8px 12px', pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: 240, zIndex: 5
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontStyle: 'italic', color: 'var(--text)' }}>{tooltip.sci}</div>
            {tooltip.label && tooltip.label !== tooltip.sci && (
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{tooltip.label}</div>
            )}
            {tooltip.order && (<div style={{ fontSize: 10, color: ORDER_COLORS[tooltip.order] || '#888' }}>{ORDER_LABELS[tooltip.order] || tooltip.order}</div>)}
            {tooltip.growthForm && !tooltip.order && (<div style={{ fontSize: 10, color: GF_COLORS[tooltip.growthForm] || '#888' }}>{GF_LABELS[tooltip.growthForm] || tooltip.growthForm}</div>)}
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
              {tooltip.count} interactions
              {tooltip.threat && (<span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: '#cc333318', color: '#cc3333' }}>{tooltip.threat}</span>)}
            </div>
            <div style={{ fontSize: 10, color: tooltip.isPlant ? '#2d7d46' : '#b8860b', marginTop: 4, fontWeight: 500 }}>{tt.click} →</div>
          </div>
        )}
      </div>
    </div>
  );
}
