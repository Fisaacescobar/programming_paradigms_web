'use strict';

/*
  Mini sitio JS/HTML — paradigmas de programacion
  - Imperativo vs Funcional (map/filter/reduce)
  - OOP basica con clases Dataset y Analyzer
  - Async/await (carga falsa) y eventos
  - Canvas 2D para grafico simple
*/

// -------------------------- util --------------------------

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
function rndBetween(lo, hi) { return lo + Math.random() * (hi - lo); }

// Box-Muller normal(0,1)
function randn() {
  const u = 1 - Math.random();
  const v = 1 - Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function formatMoney(x) { return '$' + x.toFixed(2); }
function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

// -------------------------- OOP ---------------------------

class Dataset {
  constructor() {
    this.items = [];
    this.nextId = 1;
  }

  // genera n productos sinteticos
  generate(n) {
    const cats = ['hogar', 'deporte', 'libros', 'electronica', 'mercado'];
    const out = [];
    for (let i = 0; i < n; i++) {
      const c = cats[Math.floor(Math.random() * cats.length)];
      // precio: base por categoria + ruido log-normal-ish
      const base = { hogar: 30, deporte: 45, libros: 15, electronica: 120, mercado: 10 }[c];
      const price = clamp(base + Math.exp(randn() * 0.6 + 2) / 10 - 5, 1, 999); // simple, no perfecto
      const rating = clamp(3.2 + randn() * 0.8, 1, 5);
      out.push({ id: this.nextId++, categoria: c, precio: price, rating: rating });
    }
    this.items.push(...out);
    return out;
  }

  add(items) {
    for (const it of items) {
      it.id = this.nextId++;
      this.items.push(it);
    }
  }

  clear() {
    this.items = [];
    this.nextId = 1;
  }

  head(n = 10) {
    return this.items.slice(0, n);
  }

  size() { return this.items.length; }
}

class Analyzer {
  constructor(dataset) {
    this.ds = dataset;
  }

  // imperativo: for, acumuladores, ifs
  imperative() {
    const n = this.ds.size();
    let sumPrice = 0, sumRating = 0;
    let minP = Infinity, maxP = -Infinity;
    const byCat = {}; // cat -> {count, sumPrice}

    for (let i = 0; i < n; i++) {
      const it = this.ds.items[i];
      sumPrice += it.precio;
      sumRating += it.rating;
      if (it.precio < minP) minP = it.precio;
      if (it.precio > maxP) maxP = it.precio;
      if (!byCat[it.categoria]) byCat[it.categoria] = { count: 0, sumPrice: 0 };
      byCat[it.categoria].count += 1;
      byCat[it.categoria].sumPrice += it.precio;
    }
    const avgPrice = n ? sumPrice / n : 0;
    const avgRating = n ? sumRating / n : 0;

    const avgPriceByCat = {};
    for (const k in byCat) {
      avgPriceByCat[k] = byCat[k].sumPrice / byCat[k].count;
    }

    return {
      n, avgPrice, avgRating, minPrice: minP, maxPrice: maxP, avgPriceByCat
    };
  }

  // funcional: map/filter/reduce y object utils
  functional() {
    const arr = this.ds.items;
    const n = arr.length;
    const sumPrice = arr.reduce((acc, it) => acc + it.precio, 0);
    const sumRating = arr.reduce((acc, it) => acc + it.rating, 0);
    const avgPrice = n ? sumPrice / n : 0;
    const avgRating = n ? sumRating / n : 0;
    const minPrice = arr.reduce((m, it) => Math.min(m, it.precio), Infinity);
    const maxPrice = arr.reduce((m, it) => Math.max(m, it.precio), -Infinity);

    // agrupacion por categoria con reduce
    const groups = arr.reduce((acc, it) => {
      (acc[it.categoria] ||= []).push(it.precio);
      return acc;
    }, {});

    const avgPriceByCat = Object.fromEntries(
      Object.entries(groups).map(([k, vals]) => [k, mean(vals)])
    );

    return { n, avgPrice, avgRating, minPrice, maxPrice, avgPriceByCat };
  }
}

// ------------------------ render UI -----------------------

function renderTable(ds) {
  const tb = $('#table tbody');
  tb.innerHTML = '';
  ds.head(10).forEach((it, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${it.categoria}</td><td>${formatMoney(it.precio)}</td><td>${it.rating.toFixed(2)}</td>`;
    tb.appendChild(tr);
  });
}

function renderSummary(el, stats, label) {
  if (!stats || stats.n === 0) {
    el.textContent = 'Sin datos.';
    return;
  }
  const byCat = Object.entries(stats.avgPriceByCat)
    .map(([k, v]) => `${k}: ${formatMoney(v)}`)
    .join('  |  ');

  el.innerHTML = [
    `<div><strong>${label}</strong> (n=${stats.n})</div>`,
    `<div>avg precio: ${formatMoney(stats.avgPrice)} | avg rating: ${stats.avgRating.toFixed(2)}</div>`,
    `<div>min: ${formatMoney(stats.minPrice)} | max: ${formatMoney(stats.maxPrice)}</div>`,
    `<div>avg precio por categoria: ${byCat}</div>`
  ].join('');
}

function drawBarChart(canvas, labels, values) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // axes
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 10);
  ctx.lineTo(40, H - 20);
  ctx.lineTo(W - 10, H - 20);
  ctx.stroke();

  const maxV = Math.max(1, ...values);
  const barW = Math.max(10, Math.floor((W - 70) / values.length) - 10);

  // bars
  labels.forEach((lab, i) => {
    const x = 50 + i * (barW + 10);
    const h = Math.round((H - 40) * (values[i] / maxV));
    const y = (H - 20) - h;
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(x, y, barW, h);

    // label
    ctx.fillStyle = '#9aa4b2';
    ctx.textAlign = 'center';
    ctx.font = '12px system-ui';
    ctx.fillText(lab, x + barW / 2, H - 6);
  });

  // ticks
  ctx.fillStyle = '#9aa4b2';
  ctx.textAlign = 'right';
  ctx.font = '11px system-ui';
  ctx.fillText(maxV.toFixed(0), 35, 12);
  ctx.fillText('0', 35, H - 22);
}

function renderChart(stats) {
  const canvas = $('#chart');
  if (!stats || stats.n === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const entries = Object.entries(stats.avgPriceByCat);
  const labels = entries.map(([k]) => k);
  const values = entries.map(([, v]) => v);
  drawBarChart(canvas, labels, values);
}

function setStatus(msg) {
  $('#status').textContent = msg;
}

// ------------------------ main logic ----------------------

const ds = new Dataset();
const analyzer = new Analyzer(ds);

function handleGenerate() {
  const size = parseInt($('#size').value, 10);
  ds.clear();
  ds.generate(size);
  renderTable(ds);
  $('#out-imperative').textContent = 'Listo. Presiona "Analizar".';
  $('#out-functional').textContent = 'Listo. Presiona "Analizar".';
  renderChart(null);
  setStatus(`Generados ${size} registros.`);
}

function handleAnalyze() {
  if (ds.size() === 0) {
    setStatus('Primero genera datos.');
    return;
  }
  const imp = analyzer.imperative();
  const fun = analyzer.functional();
  renderSummary($('#out-imperative'), imp, 'Imperativo');
  renderSummary($('#out-functional'), fun, 'Funcional');
  renderChart(fun); // usamos los promedios por categoria
  setStatus('Analisis OK.');
}

async function fakeFetchItems(n = 50) {
  // simulate API: wait then generate n items
  return new Promise(resolve => {
    setTimeout(() => {
      const before = ds.size();
      ds.generate(n);
      const after = ds.size();
      resolve({ added: n, before, after });
    }, 600);
  });
}

async function handleAsync() {
  if (ds.size() === 0) {
    setStatus('Primero genera datos.');
    return;
  }
  setStatus('Cargando asincronicamente...');
  const info = await fakeFetchItems(50);
  renderTable(ds);
  // re-analiza para actualizar paneles y grafico
  const fun = analyzer.functional();
  renderSummary($('#out-functional'), fun, 'Funcional');
  renderChart(fun);
  setStatus(`OK: agregados ${info.added} registros (total ${info.after}).`);
}

function handleClear() {
  ds.clear();
  renderTable(ds);
  renderChart(null);
  $('#out-imperative').textContent = 'Sin datos.';
  $('#out-functional').textContent = 'Sin datos.';
  setStatus('Limpio.');
}

// init
window.addEventListener('DOMContentLoaded', () => {
  $('#btn-generate').addEventListener('click', handleGenerate);
  $('#btn-analyze').addEventListener('click', handleAnalyze);
  $('#btn-async').addEventListener('click', handleAsync);
  $('#btn-clear').addEventListener('click', handleClear);
  setStatus('Listo.');
});
