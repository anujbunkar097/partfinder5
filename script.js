const WEBHOOK_URL = "https://n8n.srv971243.hstgr.cloud/webhook/edf5458c-e6c7-48f9-bfde-6318e2e64da9";

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = document.getElementById('fileInput').files[0];
  if (!file) return alert('Please select a CSV file.');

  const formData = new FormData();
  formData.append('file0', file);

  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('results').innerHTML = "";

  try {
    const res = await fetch(WEBHOOK_URL, { method: "POST", body: formData });
    const text = await res.text();
    if (!res.ok || !text) throw new Error("No data");
    const data = JSON.parse(text);

    renderResults(Array.isArray(data) ? data.map(i => i.json || i) : []);
  } catch (err) {
    console.error(err);
    alert("Error fetching results");
  } finally {
    document.getElementById('loading').classList.add('hidden');
  }
});

function renderResults(parts) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = "";

  if (!parts.length) {
    resultsDiv.innerHTML = "<p>No results found.</p>";
    return;
  }

  parts.forEach(item => {
    const partDiv = document.createElement('div');
    partDiv.classList.add('part');

    const h2 = document.createElement('h2');
    h2.textContent = item.partNumber || item.part_number || "Unknown Part";
    partDiv.appendChild(h2);

    if (item.recommendation) {
      const rec = document.createElement('p');
      rec.innerHTML = `<strong>Recommendation:</strong> ${item.recommendation}`;
      partDiv.appendChild(rec);
    }

    const table = document.createElement('table');
    table.className = 'results-table';
    table.innerHTML = `
      <thead><tr><th>Site</th><th>Price</th><th>Availability</th></tr></thead>
      <tbody></tbody>`;
    const tbody = table.querySelector('tbody');

    const results = Array.isArray(item.results) ? item.results : [];
    results.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><a href="${r.url || '#'}" target="_blank">${r.site || '—'}</a></td>
        <td>${r.price ? `$${Number(r.price).toFixed(2)}` : 'N/A'}</td>
        <td>${r.availability || 'Unknown'}</td>`;
      tbody.appendChild(tr);
    });

    partDiv.appendChild(table);
    resultsDiv.appendChild(partDiv);
  });
}
