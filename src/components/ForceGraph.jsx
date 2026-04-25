import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TYPES, FAMILIES } from '../utils/types';
import { fetchPhoto } from './Thumb';

function getName(item, lang) {
  return item.common ? item.common[lang] || item.common.fr || '' : '';
}

var TYPE_COLORS = {};
Object.keys(TYPES).forEach(function (k) {
  var tp = TYPES[k]; var fam = FAMILIES[tp.fam];
  TYPE_COLORS[k] = fam ? fam.color : '#888';
});

var ORDER_COLORS = {
  Lepidoptera: '#8b5cf6', Hymenoptera: '#f59e0b', Diptera: '#22c55e',
  Coleoptera: '#ea580c', Hemiptera: '#06b6d4', Thysanoptera: '#999',
  Trichoptera: '#14b8a6', Orthoptera: '#f43f5e', Neuroptera: '#34d399'
};
var GF_COLORS = { tree: '#10b981', shrub: '#22c55e', climber: '#14b8a6', herb: '#84cc16', grass: '#a3e635' };

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return { r: parseInt(hex.substring(0,2),16), g: parseInt(hex.substring(2,4),16), b: parseInt(hex.substring(4,6),16) };
}

export default function ForceGraph(props) {
  var species = props.species, partners = props.partners, ixs = props.ixs;
  var lang = props.lang, onNavigate = props.onNavigate, isPlant = props.isPlant;
  var onClose = props.onClose;
  var history = props.history || [];
  var allSpecies = props.allSpecies || [];

  var canvasRef = useRef(null);
  var animRef = useRef(null);
  var nodesRef = useRef([]);
  var linksRef = useRef([]);
  var hoverRef = useRef(null);
  var panRef = useRef({ x: 0, y: 0, scale: 1 });
  var dragRef = useRef(null);
  var lastMouseRef = useRef(null);
  var [tooltip, setTooltip] = useState(null);
  var imgCacheRef = useRef({});

  // Preload images for nodes
  useEffect(function() {
    var allSpecies = [species].concat(partners.slice(0, 150));
    allSpecies.forEach(function(sp) {
      if (imgCacheRef.current[sp.sci]) return;
      imgCacheRef.current[sp.sci] = 'loading';
      fetchPhoto(sp.sci, function(data) {
        if (data && data.photo) {
          var img = new Image();
          img.onload = function() { imgCacheRef.current[sp.sci] = img; };
          img.onerror = function() { imgCacheRef.current[sp.sci] = 'error'; };
          img.src = data.photo.sq || data.photo.md;
        } else {
          imgCacheRef.current[sp.sci] = 'none';
        }
      });
    });
  }, [species.id, partners]);
  var [showPanel, setShowPanel] = useState(window.innerWidth > 700);
  var isMobile = window.innerWidth <= 700;
  var [filters, setFilters] = useState({ entities: {}, types: {}, threatened: false });
  var [showLegend, setShowLegend] = useState(false);

  useEffect(function () {
    function onKey(e) { if (e.key === 'Escape' && onClose) onClose(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return function () { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

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
    tree: lang === 'fr' ? 'Arbres' : 'Trees', shrub: lang === 'fr' ? 'Arbustes' : 'Shrubs',
    climber: lang === 'fr' ? 'Grimpantes' : 'Climbers', herb: lang === 'fr' ? 'Herbacées' : 'Herbs',
    grass: lang === 'fr' ? 'Graminées' : 'Grasses',
  };

  var filterOptions = useMemo(function () {
    var entities = {}, types = {};
    partners.forEach(function (p) {
      if (isPlant) { var o = p.order || ''; if (o && ORDER_COLORS[o]) entities[o] = (entities[o] || 0) + 1; }
      else { var gf = p.growthForm || 'herb'; entities[gf] = (entities[gf] || 0) + 1; }
    });
    ixs.forEach(function (ix) { var tp = TYPES[ix.tp]; if (tp) types[ix.tp] = (types[ix.tp] || 0) + 1; });
    return { entities: entities, types: types };
  }, [partners, ixs, isPlant]);

  var hasAnyFilter = useMemo(function () {
    if (filters.threatened) return true;
    for (var k in filters.entities) { if (filters.entities[k]) return true; }
    for (var j in filters.types) { if (filters.types[j]) return true; }
    return false;
  }, [filters]);

  var graph = useMemo(function () {
    var nodes = [], links = [];
    var activeEntities = Object.keys(filters.entities).filter(function (k) { return filters.entities[k]; });
    var activeTypes = Object.keys(filters.types).filter(function (k) { return filters.types[k]; });
    var hasEF = activeEntities.length > 0, hasTF = activeTypes.length > 0;

    var filteredIxs = ixs.filter(function (ix) { return !hasTF || activeTypes.indexOf(ix.tp) !== -1; });
    var partnerObs = {};
    filteredIxs.forEach(function (ix) {
      var pid = isPlant ? ix.iI : ix.pI;
      if (!partnerObs[pid]) partnerObs[pid] = { types: {}, count: 0 };
      partnerObs[pid].types[ix.tp] = (partnerObs[pid].types[ix.tp] || 0) + 1;
      partnerObs[pid].count += 1;
    });

    var filteredPartners = partners.filter(function (p) {
      if (!partnerObs[p.id]) return false;
      if (hasEF) {
        var key = isPlant ? (p.order || '') : (p.growthForm || 'herb');
        if (activeEntities.indexOf(key) === -1) return false;
      }
      if (filters.threatened && !(p.threat === 'CR' || p.threat === 'EN' || p.threat === 'VU')) return false;
      return true;
    });

    nodes.push({
      id: species.id, sci: species.sci, label: getName(species, lang) || species.sci,
      isCenter: true, isPlant: isPlant, threat: species.threat, order: species.order || '',
      growthForm: species.growthForm || 'herb', x: 0, y: 0, vx: 0, vy: 0, r: 32
    });

    var sorted = filteredPartners.sort(function (a, b) {
      return (partnerObs[b.id] || { count: 0 }).count - (partnerObs[a.id] || { count: 0 }).count;
    }).slice(0, 80);

    var angle = -Math.PI / 2, step = sorted.length > 0 ? (Math.PI * 2) / sorted.length : 0;
    sorted.forEach(function (p) {
      var obs = partnerObs[p.id] || { types: {}, count: 1 };
      var maxCount = sorted[0] ? (partnerObs[sorted[0].id] || {count:1}).count : 1;
      var ratio = obs.count / maxCount;
      var r = Math.max(5, Math.min(16, 5 + ratio * 11));
      var dist = 180 + Math.random() * 60;
      var ec = isPlant ? (ORDER_COLORS[p.order || ''] || '#88888870') : (GF_COLORS[p.growthForm || 'herb'] || '#7da83270');
      nodes.push({
        id: p.id, sci: p.sci, label: getName(p, lang) || p.sci,
        isCenter: false, isPlant: !isPlant, threat: p.threat, order: p.order || '',
        growthForm: p.growthForm || 'herb',
        x: Math.cos(angle) * dist, y: Math.sin(angle) * dist,
        vx: 0, vy: 0, r: r, count: obs.count, entityColor: ec
      });
      angle += step;

      var typeKeys = Object.keys(obs.types);
      var nTypes = typeKeys.length;
      // Add typeColors to the node we just pushed
      nodes[nodes.length - 1].typeColors = typeKeys.map(function(tp) { return TYPE_COLORS[tp] || '#888'; });
      typeKeys.forEach(function (tp, ti) {
        var type = TYPES[tp]; if (!type) return;
        links.push({
          source: species.id, target: p.id,
          color: TYPE_COLORS[tp] || '#888',
          dash: type.dash, width: Math.min(type.w || 1.5, 3), tp: tp,
          curveIndex: ti, curveTotal: nTypes
        });
      });
    });

    return { nodes: nodes, links: links };
  }, [species.id, partners, ixs, isPlant, lang, filters]);

  useEffect(function () {
    var nodes = graph.nodes.map(function (n) { return Object.assign({}, n); });
    var links = graph.links;
    nodesRef.current = nodes;
    linksRef.current = links;

    var nodeMap = {};
    nodes.forEach(function (n) { nodeMap[n.id] = n; });

    function tick() {
      nodes.forEach(function (n) {
        if (n.isCenter) { n.x *= 0.92; n.y *= 0.92; return; }
        if (dragRef.current && dragRef.current.id === n.id) return;
        nodes.forEach(function (m) {
          if (n.id === m.id) return;
          var dx = n.x - m.x, dy = n.y - m.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 300) { var f = 1200 / (dist * dist); n.vx += (dx / dist) * f; n.vy += (dy / dist) * f; }
        });
        links.forEach(function (l) {
          if (l.target !== n.id && l.source !== n.id) return;
          var other = l.source === n.id ? nodeMap[l.target] : nodeMap[l.source];
          if (!other) return;
          var dx = other.x - n.x, dy = other.y - n.y;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var ideal = 160 + n.r + other.r;
          n.vx += (dx / dist) * (dist - ideal) * 0.006;
          n.vy += (dy / dist) * (dist - ideal) * 0.006;
        });
        n.vx -= n.x * 0.0006;
        n.vy -= n.y * 0.0006;
        n.vx *= 0.88; n.vy *= 0.88;
        n.x += n.vx; n.y += n.vy;
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

      // Background subtle gradient
      var bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
      bg.addColorStop(0, '#fafbfc');
      bg.addColorStop(1, '#f0f2f5');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(W / 2 + pan.x * dpr, H / 2 + pan.y * dpr);
      ctx.scale(pan.scale, pan.scale);
      var sc = dpr;

      // Draw links as bezier curves
      links.forEach(function (l) {
        var s = nodeMap[l.source], t = nodeMap[l.target];
        if (!s || !t) return;
        var isHl = hoverRef.current && (l.source === hoverRef.current || l.target === hoverRef.current);

        var dx = t.x - s.x, dy = t.y - s.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / len, ny = dx / len;

        // Curve offset: spread multi-links from same origin point
        var curveStrength = 0;
        if (l.curveTotal > 1) {
          curveStrength = (l.curveIndex - (l.curveTotal - 1) / 2) * 35;
        }
        var cpx = ((s.x + t.x) / 2 + nx * curveStrength) * sc;
        var cpy = ((s.y + t.y) / 2 + ny * curveStrength) * sc;

        ctx.beginPath();
        ctx.moveTo(s.x * sc, s.y * sc);
        ctx.quadraticCurveTo(cpx, cpy, t.x * sc, t.y * sc);

        var alpha = isHl ? 0.85 : 0.18;
        var rgb = hexToRgb(l.color);
        ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + alpha + ')';
        ctx.lineWidth = (isHl ? l.width * 1.8 : l.width * 0.7) * sc / pan.scale;
        if (l.dash && l.dash !== 'none') {
          ctx.setLineDash(l.dash.split(' ').map(function (v) { return Number(v) * sc / pan.scale; }));
        } else { ctx.setLineDash([]); }
        ctx.stroke();
        ctx.setLineDash([]);

        // Type label on hover
        if (isHl) {
          var tp = TYPES[l.tp];
          if (tp) {
            // Position label at curve midpoint
            var lx = (s.x * 0.25 + cpx / sc * 0.5 + t.x * 0.25) * sc;
            var ly = (s.y * 0.25 + cpy / sc * 0.5 + t.y * 0.25) * sc;
            var fs = Math.round(9 * sc / pan.scale);
            ctx.font = '500 ' + fs + 'px system-ui, -apple-system, sans-serif';
            var txt = tp[lang] || l.tp;
            var met = ctx.measureText(txt);
            // Pill background
            var px = 5 * sc / pan.scale, py = 3 * sc / pan.scale;
            var rr = (fs + py * 2) / 2;
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.beginPath();
            ctx.roundRect(lx - met.width / 2 - px, ly - fs / 2 - py, met.width + px * 2, fs + py * 2, rr);
            ctx.fill();
            ctx.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.3)';
            ctx.lineWidth = 1 * sc / pan.scale;
            ctx.stroke();
            ctx.fillStyle = l.color;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(txt, lx, ly);
          }
        }
      });

      // Draw nodes
      nodes.forEach(function (n) {
        var hover = hoverRef.current === n.id;
        var baseR = n.r * sc;
        var r = (hover && !n.isCenter) ? baseR * 2 : baseR;
        var x = n.x * sc, y = n.y * sc;

        // Glow for hovered
        if (hover && !n.isCenter) {
          ctx.beginPath();
          ctx.arc(x, y, r + 8 * sc, 0, Math.PI * 2);
          var glow = ctx.createRadialGradient(x, y, r, x, y, r + 8 * sc);
          glow.addColorStop(0, 'rgba(0,0,0,0.08)');
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Shadow for center
        if (n.isCenter) {
          ctx.shadowColor = 'rgba(0,0,0,0.2)';
          ctx.shadowBlur = 16 * sc;
          ctx.shadowOffsetY = 3 * sc;
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        var baseColor;
        if (n.isCenter) {
          baseColor = n.isPlant ? '#10b981' : '#f59e0b';
        } else if (n.threat === 'CR') { baseColor = '#ef4444'; }
        else if (n.threat === 'EN') { baseColor = '#f87171'; }
        else if (n.threat === 'VU') { baseColor = '#fb923c'; }
        else { baseColor = n.entityColor || '#88888860'; }

        // Gradient fill
        var grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
        var bc = hexToRgb(baseColor.replace(/[^0-9a-fA-F#]/g, '').substring(0, 7));
        if (n.isCenter || n.threat) {
          grad.addColorStop(0, 'rgba(' + Math.min(bc.r + 40, 255) + ',' + Math.min(bc.g + 40, 255) + ',' + Math.min(bc.b + 40, 255) + ',1)');
          grad.addColorStop(1, baseColor.substring(0, 7));
        } else {
          grad.addColorStop(0, 'rgba(' + bc.r + ',' + bc.g + ',' + bc.b + ',0.7)');
          grad.addColorStop(1, 'rgba(' + bc.r + ',' + bc.g + ',' + bc.b + ',0.45)');
        }
        var nodeImg = imgCacheRef.current[n.sci];
        if (nodeImg && nodeImg instanceof Image) {
          ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
          try { ctx.drawImage(nodeImg, x - r, y - r, r * 2, r * 2); } catch(e) { /* tainted */ }
          ctx.restore();
        } else {
          ctx.fillStyle = grad; ctx.fill();
        }
        ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        // Colored concentric borders
        if (n.isCenter) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.9)';
          ctx.lineWidth = 4 * sc / pan.scale;
          ctx.stroke();
        } else if (n.typeColors && n.typeColors.length > 0) {
          var bw = (hover ? 3.5 : 2.5) * sc / pan.scale;
          for (var ci = 0; ci < n.typeColors.length; ci++) {
            var boff = r + bw * 0.5 + ci * bw;
            ctx.beginPath(); ctx.arc(x, y, boff, 0, Math.PI * 2);
            var crgb2 = hexToRgb(n.typeColors[ci]);
            ctx.strokeStyle = 'rgba(' + crgb2.r + ',' + crgb2.g + ',' + crgb2.b + ',' + (hover ? 0.95 : 0.6) + ')';
            ctx.lineWidth = bw;
            ctx.stroke();
          }
        } else {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1.5 * sc / pan.scale;
          ctx.stroke();
        }
        // Label
        var showLabel = n.isCenter || hover || n.r >= 15;
        if (showLabel) {
          var fs2 = Math.round((n.isCenter ? 13 : 10) * sc / pan.scale);
          ctx.font = (n.isCenter ? '600 italic ' : 'italic ') + fs2 + 'px system-ui, -apple-system, sans-serif';
          var sci = n.sci;
          var txt2 = sci.length > 24 ? sci.split(' ')[0][0] + '. ' + (sci.split(' ')[1] || '') : sci;
          var met2 = ctx.measureText(txt2);
          var lx2 = x, ly2 = y + r + 6 * sc;
          // Pill label background
          var px2 = 6 * sc / pan.scale, py2 = 3 * sc / pan.scale;
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.beginPath();
          var rr2 = (fs2 + py2 * 2) / 2;
          ctx.roundRect(lx2 - met2.width / 2 - px2, ly2 - py2, met2.width + px2 * 2, fs2 + py2 * 2, rr2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.06)';
          ctx.lineWidth = 1 * sc / pan.scale;
          ctx.stroke();
          ctx.fillStyle = n.isCenter ? '#1a1a1a' : '#444';
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(txt2, lx2, ly2);

          // Common name below
          if (n.isCenter && n.label && n.label !== n.sci) {
            var fs3 = Math.round(10 * sc / pan.scale);
            ctx.font = '400 ' + fs3 + 'px system-ui';
            ctx.fillStyle = '#777';
            ctx.fillText(n.label, lx2, ly2 + fs2 + py2 * 2 + 2 * sc);
          }
        }
      });

      ctx.restore();
    }

    var running = true;
    function loop() { if (!running) return; tick(); draw(); animRef.current = requestAnimationFrame(loop); }
    loop();
    return function () { running = false; if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [graph]);

  useEffect(function () {
    var canvas = canvasRef.current; if (!canvas) return;
    function resize() {
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    }
    resize(); window.addEventListener('resize', resize);
    return function () { window.removeEventListener('resize', resize); };
  }, []);

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
      setTooltip({ x: e.clientX, y: e.clientY, sci: n.sci, label: n.label, threat: n.threat, count: n.count || 0, isPlant: n.isPlant, order: n.order, growthForm: n.growthForm });
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
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5 && !dragRef.current.isCenter) {
        onNavigate(dragRef.current.id);
      }
    }
    dragRef.current = null; lastMouseRef.current = null;
  }, [onNavigate]);
  var onWheel = useCallback(function (e) {
    e.preventDefault();
    panRef.current.scale = Math.max(0.3, Math.min(3, panRef.current.scale * (e.deltaY > 0 ? 0.92 : 1.08)));
  }, []);


  // Touch support for mobile
  var touchRef = useRef({ start: null, startDist: null, startScale: null });
  
  var onTouchStart = useCallback(function (e) {
    if (e.touches.length === 1) {
      var t = e.touches[0];
      var rect = canvasRef.current.getBoundingClientRect();
      var n = getNodeAt(t.clientX - rect.left, t.clientY - rect.top);
      if (n) { dragRef.current = n; }
      touchRef.current.start = { x: t.clientX, y: t.clientY, time: Date.now() };
    } else if (e.touches.length === 2) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current.startDist = Math.sqrt(dx * dx + dy * dy);
      touchRef.current.startScale = panRef.current.scale;
    }
  }, [getNodeAt]);

  var onTouchMove = useCallback(function (e) {
    e.preventDefault();
    if (e.touches.length === 1 && dragRef.current) {
      var t = e.touches[0];
      var prev = touchRef.current.start;
      if (prev) {
        dragRef.current.x += (t.clientX - prev.x) / panRef.current.scale;
        dragRef.current.y += (t.clientY - prev.y) / panRef.current.scale;
        dragRef.current.vx = 0; dragRef.current.vy = 0;
        touchRef.current.start = { x: t.clientX, y: t.clientY, time: touchRef.current.start.time };
      }
    } else if (e.touches.length === 2 && touchRef.current.startDist) {
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var ratio = dist / touchRef.current.startDist;
      panRef.current.scale = Math.max(0.2, Math.min(4, touchRef.current.startScale * ratio));
    }
  }, []);

  var onTouchEnd = useCallback(function (e) {
    if (dragRef.current && touchRef.current.start) {
      var elapsed = Date.now() - touchRef.current.start.time;
      if (elapsed < 300 && !dragRef.current.isCenter) {
        onNavigate(dragRef.current.id);
      }
    }
    dragRef.current = null;
    touchRef.current = { start: null, startDist: null, startScale: null };
    setTooltip(null);
  }, [onNavigate]);

  function closeOnMobile() { if (isMobile) setShowPanel(false); }
  function toggleFilter(cat, key) {
    setFilters(function (f) {
      var c = JSON.parse(JSON.stringify(f));
      if (cat === 'threatened') c.threatened = !c.threatened;
      else c[cat][key] = !c[cat][key];
      return c;
    });
    closeOnMobile();
  }
  function resetFilters() { setFilters({ entities: {}, types: {}, threatened: false }); }

  var tt = lang === 'fr'
    ? { sp: 'espèces', lk: 'liens', reset: 'Recentrer', legend: 'Légende', all: 'Réinitialiser',
        entityLabel: isPlant ? 'Ordres' : 'Formes', typeLabel: 'Interactions', threatened: 'Menacées',
        click: 'Cliquer pour explorer', size: 'Taille proportionnelle au nombre d\'interactions',
        nodes: 'Nœuds', linksL: 'Liens' }
    : { sp: 'species', lk: 'links', reset: 'Reset', legend: 'Legend', all: 'Reset filters',
        entityLabel: isPlant ? 'Orders' : 'Forms', typeLabel: 'Interactions', threatened: 'Threatened',
        click: 'Click to explore', size: 'Size proportional to interaction count',
        nodes: 'Nodes', linksL: 'Links', close: 'Close', panel: 'Filters' };
  var entityLabels = isPlant ? ORDER_LABELS : GF_LABELS;
  var cn = getName(species, lang);
  var entityColors = isPlant ? ORDER_COLORS : GF_COLORS;

                return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', background: '#f0f2f5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#fff', borderBottom: '1px solid #e0e0e0', flexShrink: 0, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden', flex: 1 }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: isPlant ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: isMobile ? 13 : 16, fontWeight: 600, fontStyle: 'italic', color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isMobile ? species.sci.split(' ')[0][0] + '. ' + (species.sci.split(' ')[1] || '') : species.sci}</span>
          {cn && !isMobile && <span style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>{cn}</span>}
          {history.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: isMobile ? 10 : 12, color: '#888', overflowX: 'auto', maxWidth: isMobile ? 180 : 400, flexShrink: 1 }}>
              {history.map(function (hid, idx) {
                var sp = allSpecies.find(function (s) { return s.id === hid; });
                if (!sp) return null;
                return (<span key={idx} onClick={function () { onNavigate(hid); }}
                  style={{ cursor: 'pointer', fontStyle: 'italic', color: '#888', borderBottom: '1px dashed #ccc' }}>
                  {sp.sci.split(' ')[0][0] + '. ' + (sp.sci.split(' ')[1] || '')}
                </span>);
              })}
              <span style={{ color: '#bbb', fontSize: 11 }}>›</span>
              <span style={{ fontStyle: 'italic', fontWeight: 600, color: '#555', whiteSpace: 'nowrap' }}>{species.sci.split(' ')[0][0] + '. ' + (species.sci.split(' ')[1] || '')}</span>
            </div>
          )}
          <span style={{ fontSize: isMobile ? 10 : 12, color: '#888', whiteSpace: 'nowrap' }}>{graph.nodes.length - 1} {tt.sp} · {graph.links.length} {tt.lk}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={function () { setShowPanel(function(s) { return !s; }); }}
            style={{ fontSize: 12, padding: '5px 12px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: 6, background: showPanel ? '#555' : '#fff', color: showPanel ? '#fff' : '#666' }}>
            ☰
          </button>
          <button onClick={function () { panRef.current = { x: 0, y: 0, scale: 1 }; }}
            style={{ fontSize: 12, padding: '5px 12px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: 6, background: '#fff', color: '#666' }}>
            {tt.reset}
          </button>
          <button onClick={onClose}
            style={{ fontSize: 16, padding: '4px 10px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: 6, background: '#fff', color: '#999', fontWeight: 700, lineHeight: 1 }}>
            ✕
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showPanel && (
          <div style={{ width: isMobile ? '85%' : 260, maxWidth: isMobile ? 300 : 260, flexShrink: 0, background: '#fff', borderRight: isMobile ? 'none' : '1px solid #e0e0e0', padding: 14, overflowY: 'auto', position: isMobile ? 'absolute' : 'relative', top: 0, left: 0, bottom: 0, zIndex: isMobile ? 10 : 1, boxShadow: isMobile ? '4px 0 12px rgba(0,0,0,0.1)' : 'none' }}>
            {isMobile && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #eee' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{tt.panel || 'Filtres'}</span>
              <button onClick={function () { setShowPanel(false); }} style={{ fontSize: 16, padding: '2px 8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: 4, background: '#fff', color: '#999', fontWeight: 700 }}>✕</button>
            </div>}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{tt.entityLabel}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Object.keys(filterOptions.entities).sort(function (a, b) { return filterOptions.entities[b] - filterOptions.entities[a]; }).map(function (k) {
                  var col = entityColors[k] || '#888'; var active = filters.entities[k]; var rgb = hexToRgb(col);
                  return (<button key={k} onClick={function () { toggleFilter('entities', k); }}
                    style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
                      border: active ? '1.5px solid ' + col : '1.5px solid #eee',
                      background: active ? 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.08)' : '#fafafa',
                      color: active ? col : '#666', fontWeight: active ? 600 : 400 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: col, opacity: active ? 1 : 0.35 }} />
                    <span style={{ flex: 1 }}>{entityLabels[k] || k}</span>
                    <span style={{ fontSize: 10, color: '#bbb' }}>{filterOptions.entities[k]}</span>
                  </button>);
                })}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{tt.typeLabel}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Object.keys(filterOptions.types).sort(function (a, b) { return filterOptions.types[b] - filterOptions.types[a]; }).map(function (tp) {
                  var type = TYPES[tp]; if (!type) return null;
                  var col = TYPE_COLORS[tp] || '#888'; var active = filters.types[tp]; var rgb = hexToRgb(col);
                  return (<button key={tp} onClick={function () { toggleFilter('types', tp); }}
                    style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
                      border: active ? '1.5px solid ' + col : '1.5px solid #eee',
                      background: active ? 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0.08)' : '#fafafa',
                      color: active ? col : '#666', fontWeight: active ? 600 : 400 }}>
                    <svg width="18" height="6" style={{ flexShrink: 0 }}><path d="M0 3 Q9 0 18 3" fill="none" stroke={col} strokeWidth={active ? 2 : 1.5} strokeOpacity={active ? 1 : 0.35} strokeDasharray={type.dash === 'none' ? '' : type.dash} /></svg>
                    <span style={{ flex: 1 }}>{type[lang]}</span>
                    <span style={{ fontSize: 10, color: '#bbb' }}>{filterOptions.types[tp]}</span>
                  </button>);
                })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 16 }}>
              <button onClick={function () { toggleFilter('threatened'); }}
                style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
                  border: filters.threatened ? '1.5px solid #cc3333' : '1.5px solid #eee',
                  background: filters.threatened ? '#cc333308' : '#fafafa',
                  color: filters.threatened ? '#ef4444' : '#666', fontWeight: filters.threatened ? 600 : 400 }}>
                <span>⚠</span><span style={{ flex: 1 }}>{tt.threatened}</span>
              </button>
              {hasAnyFilter && (
                <button onClick={resetFilters}
                  style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                    border: '1.5px solid #ddd', background: '#f5f5f5', color: '#888' }}>
                  ✕ {tt.all}
                </button>
              )}
            </div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
              <button onClick={function () { setShowLegend(function (s) { return !s; }); }}
                style={{ fontSize: 11, width: '100%', padding: 6, cursor: 'pointer', border: '1px solid #eee', borderRadius: 6, background: '#fafafa', color: '#888' }}>
                {tt.legend} {showLegend ? '▲' : '▼'}
              </button>
              {showLegend && (
                <div style={{ marginTop: 10, fontSize: 11 }}>
                  <div style={{ fontWeight: 600, color: '#555', marginBottom: 5 }}>{tt.nodes}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                    <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: isPlant ? '#10b981' : '#f59e0b', border: '2px solid #fff', boxShadow: '0 0 2px rgba(0,0,0,0.2)', marginRight: 6, verticalAlign: 'middle' }} />{lang === 'fr' ? 'Centre' : 'Center'}</span>
                    {Object.keys(filterOptions.entities).sort(function (a, b) { return filterOptions.entities[b] - filterOptions.entities[a]; }).slice(0, 6).map(function (k) {
                      return (<span key={k}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: (entityColors[k] || '#888') + '90', marginRight: 6, verticalAlign: 'middle' }} />{entityLabels[k] || k}</span>);
                    })}
                    <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: '#ef4444', marginRight: 6, verticalAlign: 'middle' }} />{lang === 'fr' ? 'Menacé' : 'Threatened'}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: '#555', marginBottom: 5 }}>{tt.linksL}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {Object.keys(filterOptions.types).sort(function (a, b) { return filterOptions.types[b] - filterOptions.types[a]; }).map(function (tp) {
                      var type = TYPES[tp]; if (!type) return null;
                      return (<span key={tp} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width="22" height="8"><path d="M0 4 Q11 0 22 4" fill="none" stroke={TYPE_COLORS[tp] || '#888'} strokeWidth={type.w || 1.5} strokeDasharray={type.dash === 'none' ? '' : type.dash} /></svg>
                        {type[lang]}
                      </span>);
                    })}
                  </div>
                  <div style={{ color: '#aaa', fontSize: 10, fontStyle: 'italic', marginTop: 8 }}>{tt.size}</div>
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ flex: 1, position: 'relative' }}>
          <canvas ref={canvasRef}
            onMouseMove={onMouseMove} onMouseDown={onMouseDown} onMouseUp={onMouseUp}
            onMouseLeave={function () { dragRef.current = null; setTooltip(null); hoverRef.current = null; }}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            onWheel={onWheel}
            style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
          />
          {tooltip && (
            <div style={{
              position: 'fixed', left: Math.min(tooltip.x + 60, window.innerWidth - 270), top: Math.max(tooltip.y - 40, 60),
              background: '#fff', border: '1px solid #e0e0e0',
              borderRadius: 10, padding: '10px 14px', pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: 250, zIndex: 1001
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, fontStyle: 'italic', color: '#222' }}>{tooltip.sci}</div>
              {tooltip.label && tooltip.label !== tooltip.sci && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{tooltip.label}</div>
              )}
              {tooltip.order && (<div style={{ fontSize: 10, color: ORDER_COLORS[tooltip.order] || '#888', fontWeight: 500, marginTop: 2 }}>{ORDER_LABELS[tooltip.order] || tooltip.order}</div>)}
              {tooltip.growthForm && !tooltip.order && (<div style={{ fontSize: 10, color: GF_COLORS[tooltip.growthForm] || '#888', fontWeight: 500, marginTop: 2 }}>{GF_LABELS[tooltip.growthForm] || tooltip.growthForm}</div>)}
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {tooltip.count} interactions
                {tooltip.threat && (<span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#cc333310', color: '#ef4444' }}>{tooltip.threat}</span>)}
              </div>
              <div style={{ fontSize: 10, color: tooltip.isPlant ? '#10b981' : '#f59e0b', marginTop: 5, fontWeight: 600 }}>{tt.click} →</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 16px', background: '#fff', borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#aaa' }}>
          {lang === 'fr' ? (isMobile ? 'Toucher : explorer · Pincer : zoom' : 'Molette : zoom · Clic : explorer · Glisser : déplacer · Échap : fermer') : (isMobile ? 'Tap: explore · Pinch: zoom' : 'Scroll: zoom · Click: explore · Drag: move · Esc: close')}
        </span>
      </div>
    </div>
  );
}
