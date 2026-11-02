/*
 * Lottie (Elementor Pro's Lottie widget): plays a Lottie animation (Bodymovin's JSON) with
 * the theme's own small player, drawn on a canvas, as the widget's settings say:
 *
 *   trigger        arriving_to_viewport (plays while the widget is within the viewport's
 *                  band, viewport.sizes start..end %), on_click (plays, then follows the
 *                  link after link_timeout ms), on_hover (on_hover_out: default, reverse or
 *                  pause; hover_area: the animation, its column or its section),
 *                  bind_to_scroll (the frame follows the scroll through the viewport or the
 *                  page), none (plays at once)
 *   playback       loop (number_of_times), play_speed, start_point..end_point %,
 *                  reverse_animation, lazyload (the file is fetched when the widget is near)
 *
 * What the player draws: shape layers (groups, rectangles, ellipses, paths, stars and
 * polygons; fills, strokes with caps, joins and dashes, linear and radial gradients; trim
 * paths on strokes; repeaters), solid, image and null layers, precompositions (with time
 * remapping), parenting, layer transforms (anchor, position, scale, rotation, skew,
 * opacity), keyframes with their easing, holds and position paths, masks (add, subtract,
 * intersect) and track mattes (alpha, inverted alpha; luma read as alpha). Not drawn: text
 * layers, expressions, effects, blend modes, 3D, merge paths, offset paths, round corners.
 *
 * The page runs it on every Lottie widget; the editor runs it on the one it shows
 * (window.harlowWidgets.lottie), and stops it when it goes.
 */
(() => {
  // ---- Values: keyframes and their easing ----------------------------------------------

  // A cubic bezier easing (x1, y1, x2, y2) at progress x: its y.
  const bezier = (x1, y1, x2, y2, x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
      const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
      if (Math.abs(cx) < 1e-5) break;
      if (Math.abs(d) < 1e-6) break;
      t -= cx / d;
    }
    t = Math.min(1, Math.max(0, t));
    return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  };
  const at = (v, k) => (Array.isArray(v) ? (v[k] !== undefined ? v[k] : v[0]) : v);
  const isKeyframes = (k) => Array.isArray(k) && k.length > 0 && typeof k[0] === 'object' && k[0] !== null && 't' in k[0];

  // A point along a position's path (from s, by its tangents, to e), at a fraction of the
  // path's length.
  const spatial = (s, e, to, ti, p) => {
    const c1 = [s[0] + to[0], s[1] + to[1]];
    const c2 = [e[0] + ti[0], e[1] + ti[1]];
    const pointAt = (t) => [0, 1].map((d) => (1 - t) ** 3 * s[d] + 3 * (1 - t) ** 2 * t * c1[d] + 3 * (1 - t) * t * t * c2[d] + t ** 3 * e[d]);
    const steps = 24;
    const lengths = [0];
    let last = pointAt(0);
    for (let i = 1; i <= steps; i += 1) {
      const pt = pointAt(i / steps);
      lengths.push(lengths[i - 1] + Math.hypot(pt[0] - last[0], pt[1] - last[1]));
      last = pt;
    }
    const want = p * lengths[steps];
    let i = 1;
    while (i < steps && lengths[i] < want) i += 1;
    const span = lengths[i] - lengths[i - 1] || 1;
    const t = (i - 1 + (want - lengths[i - 1]) / span) / steps;
    const pt = pointAt(t);
    return s.length > 2 ? [pt[0], pt[1], s[2] + (e[2] - s[2]) * p] : pt;
  };

  const mixShape = (a, b, p) => {
    if (!a || !b || !a.v || !b.v || a.v.length !== b.v.length) return a;
    const mix = (x, y) => x.map((pt, j) => [pt[0] + (y[j][0] - pt[0]) * p, pt[1] + (y[j][1] - pt[1]) * p]);
    return { c: a.c, v: mix(a.v, b.v), i: mix(a.i, b.i), o: mix(a.o, b.o) };
  };

  // An animated property's value at a frame: a number, a list of numbers or a shape.
  function value(prop, frame) {
    if (!prop || prop.k === undefined) return undefined;
    const k = prop.k;
    if (!isKeyframes(k)) return k;
    if (frame <= k[0].t || k.length === 1) return k[0].s !== undefined ? k[0].s : k[0].e;
    let j = 0;
    while (j < k.length - 1 && frame >= k[j + 1].t) j += 1;
    const k0 = k[j];
    const k1 = k[j + 1];
    if (!k1) return k0.s !== undefined ? k0.s : (k[j - 1] && k[j - 1].e);
    const s = k0.s;
    const e = k0.e !== undefined ? k0.e : k1.s;
    if (k0.h === 1 || s === undefined || e === undefined) return s;
    const p = (frame - k0.t) / (k1.t - k0.t || 1);
    const o = k0.o || { x: 0, y: 0 };
    const i = k0.i || { x: 1, y: 1 };
    if (Array.isArray(s) && typeof s[0] === 'object') {
      return [mixShape(s[0], e[0], bezier(at(o.x, 0), at(o.y, 0), at(i.x, 0), at(i.y, 0), p))];
    }
    if (Array.isArray(s)) {
      if (k0.to && k0.ti && s.length >= 2 && (k0.to.some((x) => x) || k0.ti.some((x) => x))) {
        return spatial(s, e, k0.to, k0.ti, bezier(at(o.x, 0), at(o.y, 0), at(i.x, 0), at(i.y, 0), p));
      }
      return s.map((v, d) => v + (e[d] - v) * bezier(at(o.x, d), at(o.y, d), at(i.x, d), at(i.y, d), p));
    }
    return s + (e - s) * bezier(at(o.x, 0), at(o.y, 0), at(i.x, 0), at(i.y, 0), p);
  }
  const num = (prop, frame, fallback) => {
    const v = value(prop, frame);
    if (v === undefined) return fallback;
    return Array.isArray(v) ? v[0] : v;
  };
  const vec = (prop, frame, fallback) => {
    const v = value(prop, frame);
    if (v === undefined) return fallback;
    return Array.isArray(v) ? v : [v, v];
  };

  // ---- Matrices: [a, b, c, d, e, f], as the canvas's transform ------------------------

  const multiply = (m, n) => [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
  ];
  const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const IDENTITY = [1, 0, 0, 1, 0, 0];

  // A transform (a layer's ks, a group's tr) as a matrix: position, rotation, skew, scale,
  // around the anchor.
  function transform(t, frame) {
    if (!t) return IDENTITY;
    const a = vec(t.a, frame, [0, 0]);
    let p;
    if (t.p && t.p.s) p = [num(t.p.x, frame, 0), num(t.p.y, frame, 0)];
    else p = vec(t.p, frame, [0, 0]);
    const s = vec(t.s, frame, [100, 100]);
    const r = (num(t.r || t.rz, frame, 0) * Math.PI) / 180;
    const sk = (num(t.sk, frame, 0) * Math.PI) / 180;
    const sa = (num(t.sa, frame, 0) * Math.PI) / 180;
    let m = [1, 0, 0, 1, p[0], p[1]];
    m = multiply(m, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]);
    if (sk) {
      const rot = (ang) => [Math.cos(ang), Math.sin(ang), -Math.sin(ang), Math.cos(ang), 0, 0];
      m = multiply(m, rot(sa));
      m = multiply(m, [1, 0, Math.tan(-sk), 1, 0, 0]);
      m = multiply(m, rot(-sa));
    }
    m = multiply(m, [s[0] / 100, 0, 0, s[1] / 100, 0, 0]);
    return multiply(m, [1, 0, 0, 1, -a[0], -a[1]]);
  }

  // ---- Geometry: paths as cubic segments, in the layer's space -------------------------

  const KAPPA = 0.5519150244935105;

  // A shape's outline: { pts: [[x, y]...] with control points, closed }, as segments.
  const fromVertices = (shape, m) => {
    if (!shape || !shape.v || !shape.v.length) return null;
    const { v, i: ins, o: outs } = shape;
    const segs = [];
    const count = shape.c ? v.length : v.length - 1;
    for (let j = 0; j < count; j += 1) {
      const n = (j + 1) % v.length;
      segs.push([
        ...apply(m, v[j][0], v[j][1]),
        ...apply(m, v[j][0] + outs[j][0], v[j][1] + outs[j][1]),
        ...apply(m, v[n][0] + ins[n][0], v[n][1] + ins[n][1]),
        ...apply(m, v[n][0], v[n][1]),
      ]);
    }
    if (!segs.length) segs.push([...apply(m, v[0][0], v[0][1]), ...apply(m, v[0][0], v[0][1]), ...apply(m, v[0][0], v[0][1]), ...apply(m, v[0][0], v[0][1])]);
    return { segs, closed: Boolean(shape.c) };
  };
  const line = (a, b) => ({ v: [a, b], i: [[0, 0], [0, 0]], o: [[0, 0], [0, 0]] });

  function rectangle(item, frame) {
    const [cx, cy] = vec(item.p, frame, [0, 0]);
    const [w, h] = vec(item.s, frame, [0, 0]);
    const r = Math.min(num(item.r, frame, 0), w / 2, h / 2);
    const x0 = cx - w / 2;
    const y0 = cy - h / 2;
    const x1 = cx + w / 2;
    const y1 = cy + h / 2;
    if (!r) {
      return { c: true, v: [[x1, y0], [x1, y1], [x0, y1], [x0, y0]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]] };
    }
    const k = r * (1 - KAPPA);
    return {
      c: true,
      v: [[x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r], [x0 + r, y0], [x1 - r, y0]],
      i: [[0, -(r - k)], [0, 0], [r - k, 0], [0, 0], [0, r - k], [0, 0], [-(r - k), 0], [0, 0]],
      o: [[0, 0], [0, r - k], [0, 0], [-(r - k), 0], [0, 0], [0, -(r - k)], [0, 0], [r - k, 0]],
    };
  }

  function ellipse(item, frame) {
    const [cx, cy] = vec(item.p, frame, [0, 0]);
    const [w, h] = vec(item.s, frame, [0, 0]);
    const rx = w / 2;
    const ry = h / 2;
    const kx = rx * KAPPA;
    const ky = ry * KAPPA;
    return {
      c: true,
      v: [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]],
      i: [[-kx, 0], [0, -ky], [kx, 0], [0, ky]],
      o: [[kx, 0], [0, ky], [-kx, 0], [0, -ky]],
    };
  }

  function star(item, frame) {
    const [cx, cy] = vec(item.p, frame, [0, 0]);
    const points = Math.max(3, Math.round(num(item.pt, frame, 5)));
    const outer = num(item.or, frame, 0);
    const inner = num(item.ir, frame, 0);
    const rot = (num(item.r, frame, 0) * Math.PI) / 180 - Math.PI / 2;
    const v = [];
    const count = item.sy === 2 ? points : points * 2;
    for (let j = 0; j < count; j += 1) {
      const radius = item.sy === 2 || j % 2 === 0 ? outer : inner;
      const angle = rot + (j * 2 * Math.PI) / count;
      v.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
    return { c: true, v, i: v.map(() => [0, 0]), o: v.map(() => [0, 0]) };
  }

  const pathString = (paths) => paths.map(({ segs, closed }) => {
    let d = `M${segs[0][0]} ${segs[0][1]}`;
    segs.forEach((s) => { d += `C${s[2]} ${s[3]} ${s[4]} ${s[5]} ${s[6]} ${s[7]}`; });
    return closed ? `${d}Z` : d;
  }).join('');

  const pathLength = ({ segs }) => segs.reduce((sum, s) => {
    let len = 0;
    let px = s[0];
    let py = s[1];
    for (let i = 1; i <= 12; i += 1) {
      const t = i / 12;
      const u = 1 - t;
      const x = u ** 3 * s[0] + 3 * u * u * t * s[2] + 3 * u * t * t * s[4] + t ** 3 * s[6];
      const y = u ** 3 * s[1] + 3 * u * u * t * s[3] + 3 * u * t * t * s[5] + t ** 3 * s[7];
      len += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
    return sum + len;
  }, 0);

  // ---- Shape layers: what a group's items draw, bottom first ------------------------

  /*
   * The entries of a group, in order: paths (in the layer's space), styles (fill, stroke,
   * gradient, with the group's matrix and opacity) and subgroups. A style draws every path
   * before it in its group and its subgroups; later items lie under earlier ones.
   */
  function groupEntries(items, frame, m, alpha) {
    let entries = [];
    (items || []).forEach((item, index) => {
      if (!item || item.hd) return;
      switch (item.ty) {
        case 'gr': {
          const tr = (item.it || []).find((x) => x.ty === 'tr');
          const gm = multiply(m, transform(tr, frame));
          const ga = alpha * (tr ? num(tr.o, frame, 100) / 100 : 1);
          const sub = groupEntries((item.it || []).filter((x) => x.ty !== 'tr'), frame, gm, ga);
          entries.push({ kind: 'group', entries: sub });
          break;
        }
        case 'sh': {
          const shape = value(item.ks, frame);
          const path = fromVertices(Array.isArray(shape) ? shape[0] : shape, m);
          if (path) entries.push({ kind: 'path', path });
          break;
        }
        case 'rc':
          entries.push({ kind: 'path', path: fromVertices(rectangle(item, frame), m) });
          break;
        case 'el':
          entries.push({ kind: 'path', path: fromVertices(ellipse(item, frame), m) });
          break;
        case 'sr':
          entries.push({ kind: 'path', path: fromVertices(star(item, frame), m) });
          break;
        case 'fl':
        case 'st':
        case 'gf':
        case 'gs':
          entries.push({ kind: 'style', item, m, alpha });
          break;
        case 'tm': {
          const trim = {
            s: num(item.s, frame, 0),
            e: num(item.e, frame, 100),
            o: num(item.o, frame, 0),
          };
          const mark = (list) => list.forEach((en) => {
            if (en.kind === 'path') en.path.trim = trim;
            else if (en.kind === 'group') mark(en.entries);
          });
          mark(entries);
          break;
        }
        case 'rp': {
          // A repeater: the items before it, copied, each copy moved a step further.
          const copies = Math.max(0, Math.round(num(item.c, frame, 1)));
          const offset = num(item.o, frame, 0);
          const tr = item.tr || {};
          const so = num(tr.so, frame, 100) / 100;
          const eo = num(tr.eo, frame, 100) / 100;
          const before = items.slice(0, index);
          const copied = [];
          for (let c = 0; c < copies; c += 1) {
            const n = c + offset;
            const a = vec(tr.a, frame, [0, 0]);
            const p = vec(tr.p, frame, [0, 0]);
            const s = vec(tr.s, frame, [100, 100]);
            const r = (num(tr.r, frame, 0) * n * Math.PI) / 180;
            let cm = [1, 0, 0, 1, p[0] * n + a[0], p[1] * n + a[1]];
            cm = multiply(cm, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]);
            cm = multiply(cm, [(s[0] / 100) ** n, 0, 0, (s[1] / 100) ** n, 0, 0]);
            cm = multiply(cm, [1, 0, 0, 1, -a[0], -a[1]]);
            const ca = alpha * (copies > 1 ? so + ((eo - so) * c) / (copies - 1) : so);
            copied.push({ kind: 'group', entries: groupEntries(before, frame, multiply(m, cm), ca) });
          }
          entries = item.m === 2 ? copied : copied.reverse();
          break;
        }
        default:
          break;
      }
    });
    return entries;
  }

  // Every path of entries (and their subgroups), in order.
  const pathsOf = (entries) => entries.flatMap((en) => {
    if (en.kind === 'path') return [en.path];
    if (en.kind === 'group') return pathsOf(en.entries);
    return [];
  });

  // The draw list of entries, bottom first: [{ style, m, alpha, paths }].
  function drawList(entries) {
    const list = [];
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const en = entries[i];
      if (en.kind === 'style') list.push({ ...en, paths: pathsOf(entries.slice(0, i)) });
      else if (en.kind === 'group') list.push(...drawList(en.entries));
    }
    return list;
  }

  const rgba = (c, alpha) => {
    const v = c || [0, 0, 0, 1];
    const k = v[0] > 1 || v[1] > 1 || v[2] > 1 ? 1 : 255;
    return `rgba(${Math.round(v[0] * k)},${Math.round(v[1] * k)},${Math.round(v[2] * k)},${(v[3] === undefined ? 1 : v[3]) * alpha})`;
  };

  function gradient(ctx, style, frame, alpha) {
    const s = apply(style.m, ...vec(style.item.s, frame, [0, 0]));
    const e = apply(style.m, ...vec(style.item.e, frame, [0, 0]));
    const g = style.item.t === 2
      ? ctx.createRadialGradient(s[0], s[1], 0, s[0], s[1], Math.hypot(e[0] - s[0], e[1] - s[1]) || 1)
      : ctx.createLinearGradient(s[0], s[1], e[0], e[1]);
    const count = style.item.g ? style.item.g.p : 0;
    const values = (style.item.g && value(style.item.g.k, frame)) || [];
    const opacityAt = (offset) => {
      const stops = values.slice(count * 4);
      if (stops.length < 4) return 1;
      for (let i = 0; i < stops.length - 2; i += 2) {
        if (offset <= stops[i + 2]) {
          const span = stops[i + 2] - stops[i] || 1;
          return stops[i + 1] + ((stops[i + 3] - stops[i + 1]) * (offset - stops[i])) / span;
        }
      }
      return stops[stops.length - 1];
    };
    for (let i = 0; i < count; i += 1) {
      const offset = Math.min(1, Math.max(0, values[i * 4]));
      g.addColorStop(offset, rgba([values[i * 4 + 1], values[i * 4 + 2], values[i * 4 + 3], opacityAt(offset)], alpha));
    }
    return g;
  }

  function drawShapes(ctx, shapes, frame) {
    drawList(groupEntries(shapes, frame, IDENTITY, 1)).forEach((style) => {
      const { item } = style;
      const paths = style.paths.filter(Boolean);
      if (!paths.length) return;
      const alpha = style.alpha * num(item.o, frame, 100) / 100;
      if (alpha <= 0) return;
      if (item.ty === 'fl' || item.ty === 'gf') {
        ctx.fillStyle = item.ty === 'fl' ? rgba(value(item.c, frame), alpha) : gradient(ctx, style, frame, alpha);
        ctx.fill(new Path2D(pathString(paths)), item.r === 2 ? 'evenodd' : 'nonzero');
        return;
      }
      const m = style.m;
      const scale = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
      ctx.lineWidth = num(item.w, frame, 1) * scale;
      if (ctx.lineWidth <= 0) return;
      ctx.lineCap = ['butt', 'butt', 'round', 'square'][item.lc || 1] || 'butt';
      ctx.lineJoin = ['miter', 'miter', 'round', 'bevel'][item.lj || 1] || 'miter';
      ctx.miterLimit = item.ml || 4;
      ctx.strokeStyle = item.ty === 'st' ? rgba(value(item.c, frame), alpha) : gradient(ctx, style, frame, alpha);
      const dashes = (item.d || []).filter((d) => d.n !== 'o').map((d) => num(d.v, frame, 0) * scale);
      const dashOffset = (item.d || []).filter((d) => d.n === 'o').map((d) => num(d.v, frame, 0) * scale)[0] || 0;
      paths.forEach((path) => {
        if (path.trim) {
          // Trim paths: the part from start to end (moved by the offset) of the path.
          const len = pathLength(path);
          let a = Math.min(path.trim.s, path.trim.e) / 100;
          let b = Math.max(path.trim.s, path.trim.e) / 100;
          const shift = (path.trim.o % 360) / 360;
          a += shift;
          b += shift;
          const visible = (b - a) * len;
          if (visible <= 0.01) return;
          ctx.setLineDash(visible >= len ? [] : [visible, Math.max(0.0001, len - visible)]);
          ctx.lineDashOffset = -(((a % 1) + 1) % 1) * len;
        } else {
          ctx.setLineDash(dashes.length ? dashes : []);
          ctx.lineDashOffset = -dashOffset;
        }
        ctx.stroke(new Path2D(pathString([path])));
      });
      ctx.setLineDash([]);
    });
  }

  // ---- Layers and compositions --------------------------------------------------------

  // A layer's matrix with its parents', at a frame of its composition.
  function layerMatrix(layer, byIndex, frame, depth = 0) {
    let m = transform(layer.ks, frame - (layer.st || 0));
    const parent = layer.parent !== undefined ? byIndex.get(layer.parent) : null;
    if (parent && depth < 20) m = multiply(layerMatrix(parent, byIndex, frame, depth + 1), m);
    return m;
  }

  function maskClip(ctx, layer, frame) {
    const masks = (layer.masksProperties || []).filter((mk) => mk.mode && mk.mode !== 'n');
    if (!masks.length) return;
    const big = 'M-100000 -100000H100000V100000H-100000Z';
    const shapeOf = (mk) => {
      const shape = value(mk.pt, frame);
      const path = fromVertices(Array.isArray(shape) ? shape[0] : shape, IDENTITY);
      return path ? pathString([path]) : '';
    };
    const adds = masks.filter((mk) => mk.mode === 'a' && !mk.inv).map(shapeOf).join('');
    if (adds) ctx.clip(new Path2D(adds), 'nonzero');
    masks.forEach((mk) => {
      const d = shapeOf(mk);
      if (!d) return;
      if (mk.mode === 's' || (mk.mode === 'a' && mk.inv)) ctx.clip(new Path2D(big + d), 'evenodd');
      else if (mk.mode === 'i') ctx.clip(new Path2D(d), 'nonzero');
    });
  }

  /*
   * A composition at a frame, on ctx under the matrix base: its layers from the last (at
   * the bottom) to the first; a matte layer is drawn with the layer under it.
   */
  function drawComp(anim, layers, frame, ctx, base, scratch) {
    const byIndex = new Map(layers.map((l) => [l.ind, l]));
    for (let n = layers.length - 1; n >= 0; n -= 1) {
      const layer = layers[n];
      if (layer.td || layer.hd) continue;
      if (frame < layer.ip || frame >= layer.op) continue;
      const matte = layer.tt && n > 0 && layers[n - 1].td ? layers[n - 1] : null;
      if (matte && scratch) {
        // The layer and its matte apart, then the layer kept where the matte is (or not).
        const { canvas } = ctx;
        const own = scratch.get(canvas.width, canvas.height, 0);
        const mask = scratch.get(canvas.width, canvas.height, 1);
        own.ctx.setTransform(1, 0, 0, 1, 0, 0);
        own.ctx.clearRect(0, 0, canvas.width, canvas.height);
        mask.ctx.setTransform(1, 0, 0, 1, 0, 0);
        mask.ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawLayer(anim, layer, layers, byIndex, frame, own.ctx, base, null);
        if (frame >= matte.ip && frame < matte.op) drawLayer(anim, matte, layers, byIndex, frame, mask.ctx, base, null);
        own.ctx.setTransform(1, 0, 0, 1, 0, 0);
        own.ctx.globalAlpha = 1;
        own.ctx.globalCompositeOperation = layer.tt === 2 || layer.tt === 4 ? 'destination-out' : 'destination-in';
        own.ctx.drawImage(mask.canvas, 0, 0);
        own.ctx.globalCompositeOperation = 'source-over';
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(own.canvas, 0, 0);
        ctx.restore();
      } else {
        drawLayer(anim, layer, layers, byIndex, frame, ctx, base, scratch);
      }
    }
  }

  function drawLayer(anim, layer, layers, byIndex, frame, ctx, base, scratch) {
    const local = frame - (layer.st || 0);
    const m = multiply(base, layerMatrix(layer, byIndex, frame));
    const opacity = num(layer.ks && layer.ks.o, local, 100) / 100;
    if (opacity <= 0) return;
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.setTransform(...m);
    maskClip(ctx, layer, local);
    switch (layer.ty) {
      case 0: {
        const asset = anim.assets.get(layer.refId);
        if (asset && asset.layers) {
          ctx.beginPath();
          ctx.rect(0, 0, layer.w || anim.w, layer.h || anim.h);
          ctx.clip();
          const inner = layer.tm ? num(layer.tm, local, 0) * anim.fr : local / (layer.sr || 1);
          drawComp(anim, asset.layers, inner, ctx, m, scratch);
        }
        break;
      }
      case 1:
        ctx.fillStyle = layer.sc || '#000';
        ctx.fillRect(0, 0, layer.sw || 0, layer.sh || 0);
        break;
      case 2: {
        const asset = anim.assets.get(layer.refId);
        if (asset && asset.image && asset.image.complete && asset.image.naturalWidth) ctx.drawImage(asset.image, 0, 0, asset.w, asset.h);
        break;
      }
      case 4:
        drawShapes(ctx, layer.shapes || [], local);
        break;
      default:
        break;
    }
    ctx.restore();
  }

  // Offscreen canvases for mattes, made once and kept.
  const scratchPool = () => {
    const pool = [];
    return {
      get(w, h, i) {
        if (!pool[i]) {
          const canvas = document.createElement('canvas');
          pool[i] = { canvas, ctx: canvas.getContext('2d') };
        }
        if (pool[i].canvas.width !== w || pool[i].canvas.height !== h) {
          pool[i].canvas.width = w;
          pool[i].canvas.height = h;
        }
        return pool[i];
      },
    };
  };

  // An animation read from its JSON, its pictures loading (from the JSON's own address).
  function load(data, url) {
    const anim = {
      w: data.w || 100,
      h: data.h || 100,
      fr: data.fr || 30,
      ip: data.ip || 0,
      op: data.op || 0,
      layers: data.layers || [],
      assets: new Map(),
    };
    (data.assets || []).forEach((asset) => {
      const a = { ...asset };
      if (asset.p && !asset.layers) {
        a.image = new Image();
        a.image.crossOrigin = 'anonymous';
        a.image.src = asset.e === 1 || /^data:/.test(asset.p) ? asset.p : new URL((asset.u || '') + asset.p, url || document.baseURI).toString();
      }
      anim.assets.set(asset.id, a);
    });
    return anim;
  }

  // ---- The widget ---------------------------------------------------------------------

  const size = (v, fallback) => {
    const n = Number(v && typeof v === 'object' ? v.size : v);
    return Number.isFinite(n) && v !== '' && v !== null && v !== undefined ? n : fallback;
  };

  function init(widget) {
    let s;
    try { s = JSON.parse(widget.dataset.settings || '{}'); } catch (e) { s = {}; }
    const holder = widget.querySelector('.e-lottie__animation');
    if (!holder) return undefined;
    const url = s.source === 'external_url'
      ? (s.source_external_url && s.source_external_url.url) || ''
      : (s.source_json && s.source_json.url) || '';
    if (!url) return undefined;

    let anim = null;
    let canvas = null;
    let ctx = null;
    let frame = 0;
    let from = 0;
    let to = 0;
    let dir = s.reverse_animation === 'yes' ? -1 : 1;
    let playing = false;
    let raf = 0;
    let last = 0;
    let plays = 0;
    let stopped = false;
    const off = [];
    const on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      off.push(() => target.removeEventListener(type, fn, opts));
    };
    const speed = size(s.play_speed, 1) || 1;
    const loop = s.loop === 'yes';
    const times = Math.max(0, Math.round(size(s.number_of_times, 0)));
    const scratch = scratchPool();

    const fit = () => {
      if (!anim || !canvas) return;
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, holder.clientWidth || anim.w);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(((width * anim.h) / anim.w) * ratio);
      draw();
    };
    function draw() {
      if (!anim || !ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const k = canvas.width / anim.w;
      drawComp(anim, anim.layers, frame, ctx, [k, 0, 0, k, 0, 0], scratch);
    }

    const tick = (now) => {
      raf = 0;
      if (!playing) return;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      frame += dt * anim.fr * speed * dir;
      const end = dir > 0 ? frame >= to : frame <= from;
      if (end) {
        plays += 1;
        const again = loop && (!times || plays < times);
        if (again) {
          frame = dir > 0 ? from + (frame - to) : to - (from - frame);
        } else {
          frame = dir > 0 ? to : from;
          playing = false;
        }
      }
      draw();
      if (playing) raf = requestAnimationFrame(tick);
    };
    const play = () => {
      if (!anim || playing || stopped) return;
      playing = true;
      last = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      playing = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const restart = () => {
      plays = 0;
      dir = s.reverse_animation === 'yes' ? -1 : 1;
      frame = dir > 0 ? from : to;
      pause();
      play();
    };

    // The triggers.
    const trigger = s.trigger || 'arriving_to_viewport';
    const band = () => {
      const sizes = (s.viewport && s.viewport.sizes) || {};
      return [size(sizes.start, 0), size(sizes.end, 100)];
    };
    const inBand = () => {
      const rect = holder.getBoundingClientRect();
      const vh = window.innerHeight;
      const [start, end] = band();
      return rect.top < vh * (1 - start / 100) && rect.bottom > vh * (1 - end / 100);
    };
    const startTriggers = () => {
      if (trigger === 'none') {
        play();
      } else if (trigger === 'arriving_to_viewport') {
        const check = () => (inBand() ? play() : pause());
        on(window, 'scroll', check, { passive: true });
        on(window, 'resize', check);
        check();
      } else if (trigger === 'on_click') {
        on(widget, 'click', (e) => {
          const link = e.target.closest('a.e-lottie__container__link');
          if (link && !widget.harlowEditor) {
            e.preventDefault();
            setTimeout(() => {
              if (link.target === '_blank') window.open(link.href, '_blank');
              else window.location.href = link.href;
            }, size(s.link_timeout, 0));
          }
          restart();
        });
      } else if (trigger === 'on_hover') {
        const areas = {
          column: widget.closest('.e-con, .elementor-column'),
          section: widget.closest('.e-con.e-parent, .elementor-section, .elementor-top-section'),
        };
        const area = areas[s.hover_area] || holder;
        on(area, 'mouseenter', () => {
          dir = s.reverse_animation === 'yes' ? -1 : 1;
          if (!playing && (dir > 0 ? frame >= to : frame <= from)) frame = dir > 0 ? from : to;
          plays = 0;
          play();
        });
        on(area, 'mouseleave', () => {
          if (s.on_hover_out === 'pause') pause();
          if (s.on_hover_out === 'reverse') {
            dir = -dir;
            plays = 0;
            pause();
            play();
          }
        });
      } else if (trigger === 'bind_to_scroll') {
        const follow = () => {
          let progress;
          if (s.effects_relative_to === 'page') {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress = max > 0 ? window.scrollY / max : 0;
          } else {
            const rect = holder.getBoundingClientRect();
            const vh = window.innerHeight;
            const [start, end] = band();
            const zoneBottom = vh * (1 - start / 100);
            const zoneTop = vh * (1 - end / 100);
            progress = (zoneBottom - rect.top) / ((zoneBottom - zoneTop) + rect.height || 1);
          }
          progress = Math.min(1, Math.max(0, progress));
          if (s.reverse_animation === 'yes') progress = 1 - progress;
          frame = from + (to - from) * progress;
          draw();
        };
        on(window, 'scroll', follow, { passive: true });
        on(window, 'resize', follow);
        follow();
      }
    };

    const begin = (data) => {
      if (stopped) return;
      anim = load(data, url);
      const total = anim.op - anim.ip;
      from = anim.ip + (total * Math.min(100, Math.max(0, size(s.start_point, 0)))) / 100;
      to = anim.ip + (total * Math.min(100, Math.max(0, size(s.end_point, 100)))) / 100 - 0.001;
      if (to < from) [from, to] = [to, from];
      frame = dir > 0 ? from : to;
      canvas = document.createElement('canvas');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', widget.querySelector('.e-lottie__caption') ? widget.querySelector('.e-lottie__caption').textContent : '');
      holder.innerHTML = '';
      holder.appendChild(canvas);
      ctx = canvas.getContext('2d');
      fit();
      on(window, 'resize', fit);
      // A picture of the animation is drawn again once it has loaded.
      anim.assets.forEach((a) => {
        if (a.image) a.image.addEventListener('load', draw);
      });
      startTriggers();
    };
    const fetchIt = () => fetch(url).then((r) => r.json()).then(begin).catch(() => {});

    let observer = null;
    if (s.lazyload === 'yes' && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        observer.disconnect();
        fetchIt();
      }, { rootMargin: '200px' });
      observer.observe(holder);
    } else {
      fetchIt();
    }

    return () => {
      stopped = true;
      pause();
      if (observer) observer.disconnect();
      off.forEach((f) => f());
      holder.innerHTML = '';
    };
  }

  window.harlowLottie = { load, drawComp, value };
  window.harlowWidgets = window.harlowWidgets || {};
  window.harlowWidgets.lottie = (widget, options = {}) => {
    widget.harlowEditor = Boolean(options.editor);
    return init(widget);
  };
  if (!window.harlowWidgetsManual) {
    document.querySelectorAll('.elementor-widget-lottie').forEach((el) => init(el));
  }
})();
