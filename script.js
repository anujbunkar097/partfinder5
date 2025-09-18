document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) {
    alert("Please select a CSV file first.");
    return;
  }

  const loadingEl = document.getElementById("loading");
  loadingEl.classList.remove("hidden");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  try {
    const res = await fetch("https://n8n.srv971243.hstgr.cloud/webhook/c7d52aac-374d-4c64-9ad6-ee7432d000ba", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    
    // Extract parts from OpenAI response structure
    let parts = [];
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.message && item.message.content) {
          // This is OpenAI response structure
          const content = item.message.content;
          parts.push({
            partNumber: content.partNumber,
            recommendation: content.recommendation,
            bestOption: content.bestOption,
            results: content.results || []
          });
        } else if (item.partNumber) {
          // Direct part structure
          parts.push(item);
        }
      }
    }
    
    renderResults(parts);
  } catch (err) {
    console.error(err);
    alert("Something went wrong. See console for details.");
  } finally {
    loadingEl.classList.add("hidden");
  }
});

function renderResults(parts) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (!parts || !parts.length) {
    resultsDiv.textContent = "No results found.";
    return;
  }

  parts.forEach((part) => {
    const partDiv = document.createElement("div");
    partDiv.style.marginBottom = "40px";

    // Part Number Title
    const title = document.createElement("h2");
    title.textContent = part.partNumber;
    title.style.cssText = "color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px; margin-bottom: 15px;";
    partDiv.appendChild(title);

    // Recommendation Section
    if (part.recommendation) {
      const rec = document.createElement("div");
      rec.className = "recommendation";
      rec.style.cssText = "background: #f0f7ff; padding: 12px; border-left: 4px solid #0066cc; margin-bottom: 15px; border-radius: 4px;";
      
      // Parse recommendation for any embedded links or make site names clickable
      let recText = part.recommendation;
      
      // If recommendation mentions specific sites, try to link them
      if (part.results && part.results.length > 0) {
        part.results.forEach(result => {
          if (result.site && result.url && recText.includes(result.site)) {
            const linkHTML = `<a href="${result.url}" target="_blank" style="color: #0066cc; font-weight: bold;">${result.site}</a>`;
            recText = recText.replace(new RegExp(result.site, 'g'), linkHTML);
          }
        });
      }
      
      rec.innerHTML = `<strong>📌 Recommendation:</strong> ${recText}`;
      partDiv.appendChild(rec);
    }
    
    // Best Option Highlight (if available)
    if (part.bestOption && part.bestOption.url) {
      const bestDiv = document.createElement("div");
      bestDiv.style.cssText = "background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 15px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
      
      const priceFormatted = typeof part.bestOption.price === 'number' 
        ? `$${part.bestOption.price.toFixed(2)}` 
        : part.bestOption.price;
      
      bestDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <strong style="color: #2e7d32; font-size: 16px;">🏆 Best Option</strong>
            <div style="margin-top: 5px;">
              <a href="${part.bestOption.url}" target="_blank" style="color: #1976d2; font-weight: bold; text-decoration: none; font-size: 18px;">
                ${part.bestOption.site}
              </a>
              <span style="color: #2e7d32; font-weight: bold; margin-left: 10px; font-size: 18px;">
                ${priceFormatted}
              </span>
            </div>
          </div>
          <a href="${part.bestOption.url}" target="_blank" style="background: #2e7d32; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
            Order Now →
          </a>
        </div>
      `;
      partDiv.appendChild(bestDiv);
    }

    // Results Table
    const table = document.createElement("table");
    table.style.cssText = "width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);";
    table.innerHTML = `
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 12px; text-align: left; font-weight: 600;">Website</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">Price</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">Availability</th>
          <th style="padding: 12px; text-align: left; font-weight: 600;">Action</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    // Sort results by price (lowest first)
    const sortedResults = (part.results || []).sort((a, b) => {
      const priceA = extractNumericPrice(a.price);
      const priceB = extractNumericPrice(b.price);
      return priceA - priceB;
    });

    sortedResults.forEach((result, index) => {
      const row = document.createElement("tr");
      row.style.cssText = index % 2 === 0 ? "background: #fff;" : "background: #fafafa;";

      // Website column with hyperlink
      const siteCell = document.createElement("td");
      siteCell.style.padding = "10px 12px";
      
      // Generate URL if missing
      let url = result.url;
      if (!url || url === '#') {
        // Create search URL based on site name
        const siteName = (result.site || '').toLowerCase();
        const partNumber = part.partNumber;
        
        if (siteName.includes('amazon')) {
          url = `https://www.amazon.com/s?k=${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('ebay')) {
          url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('walmart')) {
          url = `https://www.walmart.com/search?q=${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('reliable')) {
          url = `https://www.reliableparts.com/search?q=${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('parts dr')) {
          url = `https://partsdr.com/search?q=${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('appliance') && siteName.includes('parts')) {
          url = `https://www.appliancepartscompany.com/search?q=${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('tribles')) {
          url = `https://www.tribles.com/search?q=${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('coast')) {
          url = `https://www.coastparts.com/parts/${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('dey')) {
          url = `https://www.deyparts.com/product/${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('vv')) {
          url = `https://www.vvapplianceparts.com/parts/${encodeURIComponent(partNumber)}`;
        } else if (siteName.includes('ereplacement')) {
          url = `https://www.ereplacementparts.com/search_result.php?q=${encodeURIComponent(partNumber)}`;
        } else {
          // Generic Google search for the site and part
          url = `https://www.google.com/search?q=${encodeURIComponent(result.site + ' ' + partNumber)}`;
        }
      }
      
      siteCell.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #0066cc; text-decoration: none; font-weight: 500;">
          ${result.site || 'Unknown'}
        </a>
      `;
      row.appendChild(siteCell);

      // Price column
      const priceCell = document.createElement("td");
      priceCell.style.cssText = "padding: 10px 12px; font-weight: 600;";
      let price = result.price;
      if (typeof price === "number") {
        price = `$${price.toFixed(2)}`;
      } else if (typeof price === "string" && !price.startsWith("$")) {
        price = `$${price}`;
      }
      priceCell.textContent = price || "N/A";
      row.appendChild(priceCell);

      // Availability column with color coding
      const availCell = document.createElement("td");
      availCell.style.padding = "10px 12px";
      const availStr = String(result.availability || "").trim();
      const isInStock =
        /in[\s-]?stock/i.test(availStr) ||
        /^instock$/i.test(availStr) ||
        /available/i.test(availStr);
      
      availCell.style.color = isInStock ? "#2e7d32" : "#d32f2f";
      availCell.style.fontWeight = "600";
      availCell.textContent = result.availability || "Unknown";
      row.appendChild(availCell);

      // Action column
      const actionCell = document.createElement("td");
      actionCell.style.padding = "10px 12px";
      actionCell.innerHTML = `
        <a href="${url}" target="_blank" style="background: #0066cc; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 14px; display: inline-block;">
          View →
        </a>
      `;
      row.appendChild(actionCell);

      tbody.appendChild(row);
    });

    partDiv.appendChild(table);
    resultsDiv.appendChild(partDiv);
  });
}

// Helper function to extract numeric price for sorting
function extractNumericPrice(price) {
  if (typeof price === 'number') return price;
  if (!price) return 999999; // Put items without price at the end
  const cleaned = String(price).replace(/[^0-9.]/g, '');
  const numeric = parseFloat(cleaned);
  return isNaN(numeric) ? 999999 : numeric;
}
