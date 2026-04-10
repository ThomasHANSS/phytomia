import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TYPES, FAMILIES } from '../utils/types';

function getName(item, lang) {
  return item.common ? item.common[lang] || item.common.fr || '' : '';
}

export default function ForceGraph(props) {
  var species = props.species, partners = props.partners, ixs = props.ixs;
  var lang = props.lang, onNavigate = props.onNavigate;
  var isPlant = props.isPlant;

  var canvasRef = useRef(null);
  var animRef = useRef(null);
  var nodesRef = useRef([]);
  var linksRef = useRef([]);
  var hoverRef = useRef(null);
  var panRef = useRef({ x: 0, y: 0, scale: 1 });
  var dragRef = useRef(null);
  var [tooltip, setTooltip] = useState(null);

  // Build nodes and links
  var graph = useMemo(function () {
    var nodes = [];
    var links = [];

    // Center node
    var centerNode = {
      id: species.id, sci: species.sci, label: getName(species, lang) || species.sci,
      isCenter: true, isPlant: isPlant, threat: species.threat,
      x: 0, y: 0, vx: 0, vy: 0, r: 26
    };
    nodes.push(centerNode);

    // Partner observations
    var partnerObs = {};
    ixs.forEach(function (ix) {
      var pid = isPlant ? ix.iI : ix.pI;
      if (!partnerObs[pid]) partnerObs[pid] = { types: new Set(), count: 0 };
      partnerObs[pid].types.add(ix.tp);
      partnerObs[pid].count += 1;
    });

    // Sort and limit
    var sorted = partners.slice().sort(function (a, b) {
      return (partnerObs[b.id] || { count: 0 }).count - (partnerObs[a.id] || { count: 0 }).count;
    }).slice(0, 60);

    var angle = 0;
    var step = (Math.PI * 2) / sorted.length;
    sorted.forEach(function (p) {
      var obs = partnerObs[p.id] || { types: new Set(), count: 1 };
      var r = Math.max(7, Math.min(18, 5 + Math.sqrt(obs.count) * 2.5));
      var dist = 120 + Math.random() * 80;
      nodes.push({
        id: p.id, sci: p.sci, label: getName(p, lang) || p.sci,
        isCenter: false, isPlant: !isPlant, threat: p.threat,
        x: Math.cos(angle) * dist, y: Math.sin(angle) * dist,
        vx: 0, vy: 0, r: r, count: obs.count
      });
      angle += step;

      obs.types.forEach(function (tp) {
        var type = TYPES[tp]; if (!type) return;
        var fam = FAMILIES[type.fam];
        links.push({
          source: species.id, target: p.id,
          color: fam ? fam.color : '#888',
          dash: type.dash, width: Math.min(type.w || 1.5, 3)
        });
      });
    });

    return { nodes: nodes, links: links };
  }, [species.id, partners, ixs, isPlant, lang]);

  // Force simulation + draw
  useEffect(function () {
    var nodes = graph.nodes.map(function (n) { return Object.assign({}, n); });
    var links = graph.links;
    nodesRef.current = nodes;
    linksRef.current = links;
    panRef.current = { x: 0, y: 0, scale: 1 };

    var nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });

    function tick() {
      nodes.forEach(function (n) {
        if (n.isCenter) { n.x *= 0.95; n.y *= 0.95; return; }
        if (dragRef.current && dragRef.current.id === n.id) return;
        // Repulsion
        nodes.forEach(function (m) {
          if (n.id === m.id) return;
          var dx = n.x - m.x, dy = n.y - m.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 200) {
            var force = 600 / (dist * dist);
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        });
        // Link attraction to center
        links.forEach(function (l) {
          if (l.target !== n.id && l.source !== n.id) return;
          var other = l.source === n.id ? nodeMap[l.target] : nodeMap[l.source];
          if (!other) return;
          var dx = other.x - n.x, dy = other.y - n.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var ideal = 100 + n.r + other.r;
          n.vx += (dx / dist) * (dist - ideal) * 0.008;
          n.vy += (dy / dist) * (dist - ideal) * 0.008;
        });
        // Center gravity
        n.vx -= n.x * 0.001;
        n.vy -= n.y * 0.001;
        // Damping
        n.vx *= 0.88;
        n.vy *= 0.88;
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

      // Links
      links.forEach(function (l) {
        var s = nodeMap[l.source], t = nodeMap[l.target];
        if (!s || !t) return;
        ctx.beginPath();
        ctx.moveTo(s.x * dpr, s.y * dpr);
        ctx.lineTo(t.x * dpr, t.y * dpr);
        ctx.strokeStyle = l.color + '50';
        ctx.lineWidth = l.width * dpr / pan.scale;
        if (l.dash && l.dash !== 'none') {
          ctx.setLineDash(l.dash.split(' ').map(function (v) { return Number(v) * dpr; }));
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Highlight links for hovered node
      if (hoverRef.current) {
        links.forEach(function (l) {
          if (l.source !== hoverRef.current && l.target !== hoverRef.current) return;
          var s = nodeMap[l.source], t = nodeMap[l.target];
          if (!s || !t) return;
          ctx.beginPath();
          ctx.moveTo(s.x * dpr, s.y * dpr);
          ctx.lineTo(t.x * dpr, t.y * dpr);
          ctx.strokeStyle = l.color;
          ctx.lineWidth = (l.width + 1) * dpr / pan.scale;
          ctx.stroke();
        });
      }

      // Nodes
      nodes.forEach(function (n) {
        var hover = hoverRef.current === n.id;
        var r = n.r * dpr;
        ctx.beginPath();
        ctx.arc(n.x * dpr, n.y * dpr, r + (hover ? 3 * dpr : 0), 0, Math.PI * 2);

        if (n.isCenter) {
          ctx.fillStyle = n.isPlant ? '#2d7d46' : '#b8860b';
        } else if (n.threat === 'CR' || n.threat === 'EN') {
          ctx.fillStyle = '#cc3333';
        } else if (n.threat === 'VU') {
          ctx.fillStyle = '#e67e22';
        } else {
          ctx.fillStyle = n.isPlant ? '#2d7d4670' : '#b8860b70';
        }
        ctx.fill();

        // Border
        if (n.isCenter || hover) {
          ctx.strokeStyle = n.isCenter ? '#ffffff' : '#333333';
          ctx.lineWidth = 2 * dpr / pan.scale;
          ctx.stroke();
        }

        // Label
        if (n.isCenter || hover || n.r >= 14) {
          var fs = Math.round((n.isCenter ? 11 : 9) * dpr / pan.scale);
          ctx.font = (n.isCenter ? 'bold ' : '') + fs + 'px system-ui, sans-serif';
          ctx.fillStyle = 'var(--text)' === 'var(--text)' ? '#333' : '#333';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          var txt = n.sci.length > 22 ? n.sci.split(' ')[0].charAt(0) + '. ' + (n.sci.split(' ')[1] || '') : n.sci;
          ctx.fillText(txt, n.x * dpr, (n.y + n.r + 4) * dpr);
        }
      });

      ctx.restore();
    }

    var running = true;
    function loop() {
      if (!running) return;
      tick();
      draw();
      animRef.current = requestAnimationFrame(loop);
    }
    loop();
    return function () { running = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [graph]);

  // Resize
  useEffect(function () {
    var canvas = canvasRef.current;
    if (!canvas) return;
    function resize() {
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = 500 * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = '500px';
    }
    resize();
    window.addEventListener('resize', resize);
    return function () { window.removeEventListener('resize', resize); };
  }, []);

  // Hit test
  var getNodeAt = useCallback(function (cx, cy) {
    var canvas = canvasRef.current;
    if (!canvas) return null;
    var dpr = window.devicePixelRatio || 1;
    var pan = panRef.current;
    var x = (cx * dpr - canvas.width / 2 - pan.x * dpr) / pan.scale / dpr;
    var y = (cy * dpr - canvas.height / 2 - pan.y * dpr) / pan.scale / dpr;
    var found = null;
    nodesRef.current.forEach(function (n) {
      var dx = n.x - x, dy = n.y - y;
      if (dx * dx + dy * dy < (n.r + 5) * (n.r + 5)) found = n;
    });
    return found;
  }, []);

  var onMouseMove = useCallback(function (e) {
    var rect = canvasRef.current.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;

    // Drag
    if (dragRef.current) {
      var dpr = window.devicePixelRatio || 1;
      var pan = panRef.current;
      dragRef.current.x += (e.movementX / pan.scale);
      dragRef.current.y += (e.movementY / pan.scale);
      dragRef.current.vx = 0;
      dragRef.current.vy = 0;
      return;
    }

    var n = getNodeAt(mx, my);
    hoverRef.current = n ? n.id : null;
    canvasRef.current.style.cursor = n ? 'pointer' : 'default';
    if (n && !n.isCenter) {
      setTooltip({
        x: mx, y: my, sci: n.sci, label: n.label, threat: n.threat,
        count: n.count || 0, isPlant: n.isPlant
      });
    } else {
      setTooltip(null);
    }
  }, [getNodeAt]);

  var onMouseDown = useCallback(function (e) {
    var rect = canvasRef.current.getBoundingClientRect();
    var n = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (n && !n.isCenter) {
      dragRef.current = n;
    }
  }, [getNodeAt]);

  var onMouseUp = useCallback(function () {
    dragRef.current = null;
  }, []);

  var onClick = useCallback(function (e) {
    if (dragRef.current) return;
    var rect = canvasRef.current.getBoundingClientRect();
    var n = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (n && !n.isCenter) {
      onNavigate(n.id);
    }
  }, [getNodeAt, onNavigate]);

  var onWheel = useCallback(function (e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    panRef.current.scale = Math.max(0.3, Math.min(3, panRef.current.scale * delta));
  }, []);

  var tt = lang === 'fr'
    ? { sp: 'espèces', lk: 'liens', reset: 'Recentrer', click: 'Cliquer pour explorer' }
    : { sp: 'species', lk: 'links', reset: 'Reset', click: 'Click to explore' };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
          {graph.nodes.length} {tt.sp} · {graph.links.length} {tt.lk}
          {graph.nodes.length >= 61 ? ' (top 60)' : ''}
        </span>
        <button onClick={function () { panRef.current = { x: 0, y: 0, scale: 1 }; }}
          style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--text2)' }}>
          {tt.reset}
        </button>
      </div>
      <canvas ref={canvasRef}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onClick}
        onWheel={onWheel}
        style={{ width: '100%', height: 500, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', touchAction: 'none' }}
      />
      {tooltip && (
        <div style={{
          position: 'absolute', left: Math.min(tooltip.x + 10, 250), top: tooltip.y - 10,
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '6px 10px', pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 220, zIndex: 5
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, fontStyle: 'italic' }}>{tooltip.sci}</div>
          {tooltip.label && tooltip.label !== tooltip.sci && (
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{tooltip.label}</div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
            {tooltip.count} interactions
          </div>
          <div style={{ fontSize: 10, color: tooltip.isPlant ? '#2d7d46' : '#b8860b', marginTop: 2 }}>{tt.click}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: 'var(--text3)', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: isPlant ? '#2d7d46' : '#b8860b', marginRight: 3 }} />{species.sci}</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: isPlant ? '#b8860b70' : '#2d7d4670', marginRight: 3 }} />{lang === 'fr' ? (isPlant ? 'Insectes' : 'Plantes') : (isPlant ? 'Insects' : 'Plants')}</span>
        <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: '#cc3333', marginRight: 3 }} />{lang === 'fr' ? 'Menacé' : 'Threatened'}</span>
      </div>
    </div>
  );
}
