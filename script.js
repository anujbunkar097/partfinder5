document.addEventListener('DOMContentLoaded', () => {
    const searchTypeRadios = document.querySelectorAll('input[name="searchType"]');
    const singlePartForm = document.getElementById('singlePartForm');
    const multiPartForm = document.getElementById('multiPartForm');

    searchTypeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            if (event.target.value === 'single') {
                singlePartForm.classList.remove('hidden');
                multiPartForm.classList.add('hidden');
            } else {
                singlePartForm.classList.add('hidden');
                multiPartForm.classList.remove('hidden');
            }
            document.getElementById('resultsContainer').innerHTML = '';
            document.getElementById('summaryContainer').innerHTML = '';
        });
    });

    document.getElementById('searchButton').addEventListener('click', searchSinglePart);
    document.getElementById('partNumberInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchSinglePart();
        }
    });

    document.getElementById('searchMultiButton').addEventListener('click', searchMultipleParts);
});

// Note: Update this URL if you have a separate single-part webhook
async function searchSinglePart() {
    alert("Single part search is not yet configured with the new batch workflow.");
    // Implementation for single part search would go here if needed.
}

async function searchMultipleParts() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a CSV file to upload.');
        return;
    }

    // THIS IS YOUR PRODUCTION N8N WEBHOOK URL FOR THE MULTI-PART WORKFLOW
    const multiPartWebhookUrl = 'https://transformco.app.n8n.cloud/webhook/edf5458c-e6c7-48f9-bfde-6318e2e64da9';

    const formData = new FormData();
    formData.append('file', file); // 'file' must match binary property in Webhook node

    toggleLoading(true);

    try {
        const response = await fetch(multiPartWebhookUrl, {
            method: 'POST',
            body: formData
        });
        const resultData = await response.json();
        console.log("RAW DATA (MULTI) FROM N8N:", resultData);
        displayResults(resultData);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('resultsContainer').innerHTML = `<p style="color: red;">An error occurred processing the CSV file.</p>`;
    } finally {
        toggleLoading(false);
    }
}

function toggleLoading(isLoading) {
    const loader = document.getElementById('loader');
    const searchButton = document.getElementById('searchButton');
    const searchMultiButton = document.getElementById('searchMultiButton');
    const resultsContainer = document.getElementById('resultsContainer');

    if (isLoading) {
        loader.classList.remove('hidden');
        resultsContainer.innerHTML = '';
        searchButton.disabled = true;
        searchMultiButton.disabled = true;
    } else {
        loader.classList.add('hidden');
        searchButton.disabled = false;
        searchMultiButton.disabled = false;
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';

    if (!data || data.length === 0) {
        resultsContainer.innerHTML = '<p>No results found for the uploaded parts.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'results-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Part Number</th>
                <th>Vendor Option</th>
                <th>AI Recommendation</th>
            </tr>
        </thead>
    `;
    const tbody = document.createElement('tbody');

    const formatVendorCell = (result) => {
        const title = result.site || 'Unknown Site';
        const price = result.price || 'N/A';
        const availability = result.availability || 'Not Specified';
        const url = result.url || '#';
        const stockColor = availability && availability.toUpperCase().includes('IN STOCK') ? 'green' : 'red';

        return `
            <div class="vendor-details">
                <strong><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></strong>
                <div><strong>Price:</strong> ${price}</div>
                <div><strong>Stock:</strong> <span style="color: ${stockColor};">${availability}</span></div>
            </div>
        `;
    };

    data.forEach(partData => {
        const partNumber = partData.partNumber;
        const recommendation = partData.recommendation || 'No recommendation provided.';
        const results = partData.results || [];
        const rowspan = results.length > 0 ? results.length : 1;

        if (results.length > 0) {
            results.forEach((result, index) => {
                const tr = document.createElement('tr');
                if (index === 0) {
                    tr.innerHTML = `
                        <td class="part-number-cell" rowspan="${rowspan}">${partNumber}</td>
                        <td>${formatVendorCell(result)}</td>
                        <td class="recommendation-cell" rowspan="${rowspan}">${recommendation}</td>
                    `;
                } else {
                    tr.innerHTML = `<td>${formatVendorCell(result)}</td>`;
                }
                tbody.appendChild(tr);
            });
        } else {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="part-number-cell">${partNumber}</td>
                <td>No results found.</td>
                <td class="recommendation-cell">${recommendation}</td>
            `;
            tbody.appendChild(tr);
        }
    });

    table.appendChild(tbody);
    resultsContainer.appendChild(table);
}
