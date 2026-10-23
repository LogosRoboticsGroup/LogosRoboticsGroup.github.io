'use strict';

// The initial real-robot results remain readable if scripting or the data request fails.
(() => {
  const root = document.querySelector('#results-explorer');
  const controls = root.querySelector('.results-controls');
  const metricSelect = root.querySelector('#result-metric');
  const status = root.querySelector('#results-status');
  const groups = [...root.querySelectorAll('[data-result-family]')];
  let datasets;
  let active = 'real';

  const format = (value, metric) => `${value.toFixed(metric.digits)}${metric.unit === '%' ? '%' : ` ${metric.unit}`}`;

  function successInsight(rows, metric) {
    const ours = rows.find(row => row.ours);
    const candidates = rows.filter(row => !row.ours);
    const baseline = active === 'ablations' ? candidates.at(-1)
      : candidates.reduce((best, row) => row.values[metric.key] > best.values[metric.key] ? row : best);
    const delta = ours.values[metric.key] - baseline.values[metric.key];
    if (delta === 0) return `FDM matches ${baseline.name} at ${format(ours.values[metric.key], metric)}.`;
    const points = Number(Math.abs(delta).toFixed(2));
    return `FDM is ${points} percentage points ${delta > 0 ? 'above' : 'below'} ${baseline.name}.`;
  }

  function renderRows(group, rows, metric) {
    const container = group.querySelector('.result-bars');
    rows.forEach((row, index) => {
      let element = container.children[index];
      if (!element) {
        element = document.createElement('div');
        element.className = 'result-row';
        element.innerHTML = '<div class="result-row-heading"><span class="result-name"></span><span class="result-value"></span></div>'
          + '<p class="result-detail"></p><div class="result-track" aria-hidden="true"><span class="result-bar"></span></div>';
        container.append(element);
      }
      element.hidden = false;
      element.classList.toggle('result-ours', row.ours);
      element.querySelector('.result-name').textContent = row.name;
      element.querySelector('.result-value').textContent = format(row.values[metric.key], metric);
      element.querySelector('.result-detail').textContent = row.detail;
      element.querySelector('.result-bar').style.setProperty('--bar-scale', row.values[metric.key] / metric.max);
    });
    [...container.children].slice(rows.length).forEach(element => { element.hidden = true; });
  }

  function renderTable(dataset) {
    const metrics = dataset.tableMetrics || dataset.metrics;
    const table = document.createElement('table');
    table.createCaption().textContent = `${dataset.label} · ${dataset.source} · all reported values`;
    const header = table.createTHead().insertRow();
    ['Backbone', 'Method', 'Setup', ...metrics.map(metric => `${metric.label} (${metric.unit})`)].forEach(label => {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = label;
      header.append(cell);
    });
    const body = table.createTBody();
    dataset.rows.forEach(row => {
      const tr = body.insertRow();
      if (row.ours) tr.className = 'result-table-ours';
      tr.insertCell().textContent = row.family.toUpperCase();
      const name = document.createElement('th');
      name.scope = 'row';
      name.textContent = row.name;
      tr.append(name);
      tr.insertCell().textContent = row.detail;
      metrics.forEach(metric => {
        const value = row.values[metric.key];
        tr.insertCell().textContent = value === null ? '—' : value.toFixed(metric.digits);
      });
    });
    root.querySelector('#result-table').replaceChildren(table);
  }

  function renderResults() {
    const dataset = datasets[active];
    const metric = dataset.metrics.find(item => item.key === metricSelect.value);
    root.dataset.dataset = active;
    root.querySelector('#results-view-title').textContent = dataset.title;
    root.querySelector('#results-measure').textContent = `${metric.label} · ${metric.unit} · ${metric.higher ? 'higher' : 'lower'} is better`;
    root.querySelector('#results-protocol').textContent = dataset.note;
    const source = root.querySelector('#results-source');
    source.href = dataset.href;
    source.textContent = `${dataset.source} in the paper`;
    const summaries = [];
    groups.forEach(group => {
      const family = group.dataset.resultFamily;
      const rows = dataset.rows.filter(row => row.family === family);
      renderRows(group, rows, metric);
      group.querySelector('.result-axis').replaceChildren(...[0, metric.max / 2, metric.max].map(value => {
        const tick = document.createElement('span');
        tick.textContent = String(value);
        return tick;
      }));
      const insight = dataset.insights ? dataset.insights[metric.key][family] : successInsight(rows, metric);
      group.querySelector('.result-insight').textContent = insight;
      summaries.push(`${family.toUpperCase()}: ${insight}`);
    });
    status.textContent = `${dataset.label}, ${metric.label}. ${summaries.join(' ')}`;
  }

  function selectDataset(key) {
    active = key;
    const dataset = datasets[key];
    root.querySelectorAll('[data-results-view]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.resultsView === key));
    });
    metricSelect.replaceChildren(...dataset.metrics.map(metric => new Option(metric.label, metric.key)));
    metricSelect.value = dataset.defaultMetric;
    renderResults();
    renderTable(dataset);
  }

  fetch('assets/results.json').then(response => {
    if (!response.ok) throw new Error('Results unavailable');
    return response.json();
  }).then(data => {
    datasets = data.datasets;
    root.querySelectorAll('[data-results-view]').forEach(button => {
      button.addEventListener('click', () => selectDataset(button.dataset.resultsView));
    });
    metricSelect.addEventListener('change', renderResults);
    selectDataset('real');
    controls.hidden = false;
  }).catch(() => {
    status.classList.remove('visually-hidden');
    status.textContent = 'Interactive comparisons could not load. The real-robot results remain below; reload to try again or open the paper.';
  });
})();
