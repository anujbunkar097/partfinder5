document.addEventListener('DOMContentLoaded', () => {
    // --- NEW: Event listeners for switching search modes ---
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
            // Clear results when switching modes
            document.getElementById('resultsContainer').innerHTML = '';
            document.getElementById('summaryContainer').innerHTML = '';
        });
    });

    // --- Event listener for the original search button ---
    document.getElementById('searchButton').addEventListener('click', searchSinglePart);
    document.getElementById('partNumberInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchSinglePart();
        }
    });

    // --- NEW: Event listener for the new multi-part search button ---
    document.getElementById('searchMultiButton').addEventListener('click', searchMultipleParts);
});


// --- This function is the original searchParts, renamed for clarity ---
async function searchSinglePart() {
    const partNumber = document.getElementById('partNumberInput').value;
    if (!partNumber) {
        alert('Please enter a part number.');
        return;
    }
    
    // This is your original webhook URL for single part searches
    const webhookUrl = 'https://transformco.app.n8n.cloud/webhook/2a1d2507-373b-43a7-9ec9-3965b56dbcc3';
    const payload = { partNumber: partNumber };

    // Show loader and disable button
    toggleLoading(true);

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const responseData = await response.json();
        console.log("RAW DATA (SINGLE) FROM N8N:", responseData);
        // The data is an array with one item, so we must extract that first item.
        const resultData = responseData[0];
        displayResults(resultData);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('resultsContainer').innerHTML = `<p style="color: red;">An error occurred during the search.</p>`;
    } finally {
        toggleLoading(false);
    }
}

// --- NEW: This function handles the CSV upload ---
async function searchMultipleParts() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a CSV file to upload.');
        return;
    }

    // IMPORTANT: This should be your n8n PRODUCTION URL for the multi-part workflow
    const multiPartWebhookUrl = 'https://transformco.app.n8n.cloud/webhook/edf5458c-e6c7-48f9-bfde-6318e2e64da9';
    
    // The problematic 'if' check has been removed.

    const formData = new FormData();
    // The key 'file' must match what you set in the n8n webhook's 'Binary Property' field
    formData.append('file', file);

    toggleLoading(true);

    try {
        const response = await fetch(multiPartWebhookUrl, {
            method: 'POST',
            body: formData // No 'Content-Type' header needed, the browser sets it for FormData
        });
        const resultData = await response.json();
        console.log("RAW DATA (MULTI) FROM N8N:", resultData);
        
        // The response from the aggregator code node is an array with one item
        // that contains the final summary and results list.
        displayResults(resultData[0].json);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('resultsContainer').innerHTML = `<p style="color: red;">An error occurred processing the CSV file.</p>`;
    } finally {
        toggleLoading(false);
    }
}


// --- NEW: Helper function to manage UI state ---
function toggleLoading(isLoading) {
    const loader = document.getElementById('loader');
    const searchButton = document.getElementById('searchButton');
    const searchMultiButton = document.getElementById('searchMultiButton');
    const resultsContainer = document.getElementById('resultsContainer');
    const summaryContainer = document.getElementById('summaryContainer');

    if (isLoading) {
        loader.classList.remove('hidden');
        resultsContainer.innerHTML = '';
        summaryContainer.innerHTML = '';
        searchButton.disabled = true;
        searchMultiButton.disabled = true;
    } else {
        loader.classList.add('hidden');
        searchButton.disabled = false;
        searchMultiButton.disabled = false;
    }
}

// This function can now be used for both single and multi-part results
function displayResults(data) {
    const resultsContainer = document.getElementById('resultsContainer');
    const summaryContainer = document.getElementById('summaryContainer');
    
    // Clear previous results
    resultsContainer.innerHTML = '';
    summaryContainer.innerHTML = '';

    if (!data) {
        resultsContainer.innerHTML = '<p>No data object was found in the response.</p>';
        return;
    }
    
    // Display the main summary
    if (data.summary) {
        // Replace newlines in the summary with <br> tags for HTML display
        const formattedSummary = data.summary.replace(/\\n/g, '<br>');
        summaryContainer.innerHTML = `<p><strong>AI Analysis:</strong><br>${formattedSummary}</p>`;
    }

    const results = data.results;

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<p>No detailed results found.</p>';
        return;
    }

    // Loop through and display each result card
    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'result-card';

        if (result.isBest) {
            card.classList.add('best-bet');
        }
        
        // --- NEW: Handle part numbers in multi-result display ---
        const partNumberInfo = result.partNumber ? `<p><strong>Part Number:</strong> ${result.partNumber}</p>` : '';

        const title = result.site || 'Unknown Site';
        const price = result.price || 'Not available';
        const availability = result.availability || 'Not specified';
        const url = result.url || '#';
        const deliveryTime = result.deliveryTime || 'Not available';
        const bestBetBadge = result.isBest ? '🏆 Best Option' : '';

        card.innerHTML = `
            <h3><a href="${url}" target="_blank">${title}</a> <span style="color: #28a745; font-weight: bold;">${bestBetBadge}</span></h3>
            ${partNumberInfo}
            <p><strong>Price:</strong> ${price}</p>
            <p><strong>Availability:</strong> <span style="color: ${availability && availability.toUpperCase().includes('IN STOCK') ? 'green' : 'red'};">${availability}</span></p>
            <p><strong>Delivery:</strong> 🚚 ${deliveryTime}</p>
        `;
        resultsContainer.appendChild(card);
    });
}
