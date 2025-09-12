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
    renderResults(data);
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

    const title = document.createElement("h2");
    title.textContent = part.partNumber;
    partDiv.appendChild(title);

    if (part.recommendation) {
      const rec = document.createElement("div");
      rec.className = "recommendation";
      rec.textContent = `Recommendation: ${part.recommendation}`;
      partDiv.appendChild(rec);
    }

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Website</th>
          <th>Price</th>
          <th>Availability</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    (part.results || []).forEach((result) => {
      const row = document.createElement("tr");

      // Site with hyperlink
      const siteCell = document.createElement("td");
      if (result.url) {
        siteCell.innerHTML = `<a href="${result.url}" target="_blank" rel="noopener noreferrer">${result.site}</a>`;
      } else {
        siteCell.textContent = result.site;
      }
      row.appendChild(siteCell);

      // Price
      const priceCell = document.createElement("td");
      let price = result.price;
      if (typeof price === "number") {
        price = `$${price.toFixed(2)}`;
      }
      priceCell.textContent = price || "N/A";
      row.appendChild(priceCell);

      // Availability (green/red)
      const availCell = document.createElement("td");
      const availStr = String(result.availability || "").trim();
      const isInStock =
        /in[\s-]?stock/i.test(availStr) ||
        /^instock$/i.test(availStr) ||
        /available/i.test(availStr);
      availCell.style.color = isInStock ? "green" : "red";
      availCell.textContent = result.availability || "Unknown";
      row.appendChild(availCell);

      tbody.appendChild(row);
    });

    partDiv.appendChild(table);
    resultsDiv.appendChild(partDiv);
  });
}
