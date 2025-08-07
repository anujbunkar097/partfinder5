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
        });
    });

    document.getElementById('searchButton').addEventListener('click', searchSinglePart);
    document.getElementById('partNumberInput').addEventListener('keypress', (e) => e.key === 'Enter' && searchSinglePart());
    document.getElementById('searchMultiButton').addEventListener('click', searchMultipleParts);
});

async function searchSinglePart() {
    alert("Single part search is not implemented in this version. Please use the multi-part CSV upload.");
}

async function searchMultipleParts() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a CSV file to upload.');
        return;
    }

    // Make sure this is your PRODUCTION webhook URL from n8n
    const multiPartWebhookUrl = 'https://transformco.app.n8n.cloud/webhook/edf5458c-e6c7-48f9-bfde-6318e2e64da9';
    const formData = new FormData();
    formData.append('file', file);

    toggleLoading(true);

    try {
        const response = await fetch(multiPartWebhookUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const resultData = await response.json();
        console.log("RAW DATA (MULTI) FROM N8N:", resultData);
        displayResultsAsTable(resultData);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('resultsContainer').innerHTML = `<p style="color: red;">An error occurred processing the file. Check the browser console and n8n for execution errors.</p>`;
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

function displayResultsAsTable(data) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = ''; // Clear previous results

    if (!data || data.length === 0) {
        container.innerHTML = '<p>No results found.</p>';
        return;
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Part Number</th>
                <th>Best Recommendation</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.forEach(item => {
        const row = tbody.insertRow();
        const partNumberCell = row.insertCell();
        const recommendationCell = row.insertCell();
        
        partNumberCell.textContent = item.partNumber || 'N/A';
        recommendationCell.classList.add('recommendation-cell');

        if (item.recommendation) {
            const rec = item.recommendation;
            const availabilityClass = rec.availability && rec.availability.toLowerCase().includes('in stock') 
                ? 'availability-in-stock' 
                : 'availability-other';

            recommendationCell.innerHTML = `
                <p><a href="${rec.url}" target="_blank">${rec.site || 'Unknown'}</a></p>
                <p><strong>Price:</strong> ${rec.price || 'N/A'}</p>
                <p><strong>Delivery:</strong> ${rec.deliveryTime || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="${availabilityClass}">${rec.availability || 'N/A'}</span></p>
            `;
        } else {
            recommendationCell.innerHTML = '<p>No recommendation could be determined for this part.</p>';
        }
    });

    container.appendChild(table);
}
