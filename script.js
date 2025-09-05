document.addEventListener('DOMContentLoaded', () => {
    const searchTypeRadios = document.querySelectorAll('input[name="searchType"]');
    const singlePartForm = document.getElementById('singlePartForm');
    const multiPartForm = document.getElementById('multiPartForm');
    const searchButton = document.getElementById('searchButton');
    const searchMultiButton = document.getElementById('searchMultiButton');
    const partNumberInput = document.getElementById('partNumberInput');
    const csvFileInput = document.getElementById('csvFileInput');

    // Attach change listener to radio buttons
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

    // Attach click and keypress listeners for single-part search
    searchButton.addEventListener('click', searchSinglePart);
    partNumberInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchSinglePart();
        }
    });

    // Attach click listener for multi-part search to trigger the file dialog
    searchMultiButton.addEventListener('click', () => {
        csvFileInput.click();
    });

    // Listen for a file selection on the file input
    csvFileInput.addEventListener('change', searchMultipleParts);
});

async function searchSinglePart() {
    const partNumberInput = document.getElementById('partNumberInput');
    const partNumber = partNumberInput.value.trim();

    if (!partNumber) {
        alert('Please enter a part number.');
        return;
    }

    const singlePartWebhookUrl = 'https://transformco.app.n8n.cloud/webhook/2a1d2507-373b-43a7-9ec9-3965b56dbcc3';
    
    toggleLoading(true);

    try {
        const response = await fetch(singlePartWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ partNumber: partNumber })
        });
        const resultData = await response.json();
        console.log("RAW DATA (SINGLE) FROM N8N:", resultData);
        displayResults([resultData]);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('resultsContainer').innerHTML = `<p style="color: red;">An error occurred processing the part number.</p>`;
    } finally {
        toggleLoading(false);
    }
}

async function searchMultipleParts() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a CSV file to upload.');
        return;
    }

    const multiPartWebhookUrl = 'https://n8n.srv971243.hstgr.cloud/webhook/edf5458c-e6c7-48f9-bfde-6318e2e64da9';

    if (!multiPartWebhookUrl) {
        alert('Multi-part webhook URL is not configured.');
        return;
    }

    toggleLoading(true);

    try {
        const response = await fetch(multiPartWebhookUrl, {
            method: 'POST',
            body: file,
            headers: {
              'Content-Type': 'text/csv'
            }
        });
        const resultData = await response.json();
        console.log("RAW DATA (MULTI) FROM N8N:", resultData);
        displayResults(resultData);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('resultsContainer').innerHTML = `<p style="color: red;">An error occurred processing the CSV file. Please check the file format.</p>`;
    } finally {
        toggleLoading(false);
    }
}

function toggleLoading(isLoading) {
    const loader = document.getElementById('loader');
    const searchButton = document.getElementById('searchButton');
    const searchMultiButton = document.getElementById('searchMultiButton');
    const resultsContainer = document.getElementById('resultsContainer');
    const partNumberInput = document.getElementById('partNumberInput');
    const csvFileInput = document.getElementById('csvFileInput');


    if (isLoading) {
        loader.classList.remove('hidden');
        resultsContainer.innerHTML = '';
        searchButton.disabled = true;
        searchMultiButton.disabled = true;
        partNumberInput.disabled = true;
        csvFileInput.disabled = true;
    } else {
        loader.classList.add('hidden');
        searchButton.disabled = false;
        searchMultiButton.disabled = false;
        partNumberInput.disabled = false;
        csvFileInput.disabled = false;
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    const summaryContainer = document.getElementById('summaryContainer');
    resultsContainer.innerHTML = '';
    summaryContainer.innerHTML = '';

    if (!data || data.length === 0) {
        resultsContainer.innerHTML = '<p>No results found for the uploaded parts.</p>';
        return;
    }

    data.forEach(partData => {
        const partNumber = partData.partNumber;
        const recommendation = partData.recommendation || 'No recommendation provided.';
        const results = partData.results || [];

        const summaryParagraph = document.createElement('p');
        summaryParagraph.className = 'recommendation-summary';
        summaryParagraph.innerHTML = `<strong>Recommendation for ${partNumber}:</strong> ${recommendation}`;
        summaryContainer.appendChild(summaryParagraph);

        const table = document.createElement('table');
        table.className = 'results-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Vendor</th>
                    <th>Price</th>
                    <th>Availability</th>
                </tr>
            </thead>
        `;
        const tbody = document.createElement('tbody');

        const formatVendorCell = (result) => {
            const title = result.site || 'Unknown Site';
            const price = result.price || 'N/A';
            const availability = result.availability || 'Not Specified';
            const url = result.url || '#';
            
            const stockColor = (typeof availability === 'string' && availability.toUpperCase().includes('IN STOCK')) ? 'green' : 'red';
            
            return `
                <div class="vendor-details">
                    <strong><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></strong>
                    <div><strong>Price:</strong> ${price}</div>
                    <div><strong>Stock:</strong> <span style="color: ${stockColor};">${availability}</span></div>
                </div>
            `;
        };

        if (results.length > 0) {
            results.forEach(result => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatVendorCell(result)}</td>
                    <td>${result.price || 'N/A'}</td>
                    <td>${result.availability || 'N/A'}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="3">No results found.</td>
            `;
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        resultsContainer.appendChild(table);
    });
}
