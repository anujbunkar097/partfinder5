document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = document.getElementById('fileInput').files[0];
  if (!file) return alert('Please select a CSV file.');

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('https://n8n.srv971243.hstgr.cloud/webhook/edf5458c-e6c7-48f9-bfde-6318e2e64da9', {
    method: 'POST',
    body: formData
  });

  let data;
  try {
    data = await res.json();
  } catch {
    return alert('Invalid response from server');
  }

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  data.forEach(item => {
    const partDiv = document.createElement('div');
    partDiv.classList.add('part');

    partDiv.innerHTML = `
      <h2>${item.partNumber}</h2>
      <p><strong>Recommendation:</strong> ${item.recommendation || 'N/A'}</p>
      <table class="results-table">
        <thead>
          <tr><th>Site</th><th>Price</th><th>Availability</th></tr>
        </thead>
        <tbody>
          ${item.results.map(r => `
            <tr>
              <td><a href="${r.url}" target="_blank">${r.site}</a></td>
              <td>$${r.price}</td>
              <td>${r.availability}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    resultsDiv.appendChild(partDiv);
  });
});
