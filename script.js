// Starfield
(function(){
  const c = document.getElementById('stars'); const ctx = c.getContext('2d');
  let w,h,stars=[];
  function resize(){ w=window.innerWidth; h=window.innerHeight; c.width=w; c.height=h; stars = Array.from({length:200}, () => ({x:Math.random()*w, y:Math.random()*h, r:Math.random()*1.5, v: .2 + Math.random()*0.6})); }
  function tick(){ ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(255,255,255,.8)'; stars.forEach(s=>{ ctx.globalAlpha=0.5+Math.random()*0.5; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); s.y+=s.v; if(s.y>h){s.y=0; s.x=Math.random()*w;} }); requestAnimationFrame(tick); }
  window.addEventListener('resize', resize); resize(); tick();
})();

const uploadForm = document.getElementById("uploadForm");
const fileInput  = document.getElementById("fileInput");
const loadingEl  = document.getElementById("loading");
const resultsEl  = document.getElementById("results");

// Change this to your n8n webhook URL
const WEBHOOK_URL = "https://n8n.srv971243.hstgr.cloud/webhook/edf5458c-e6c7-48f9-bfde-6318e2e64da9";

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!fileInput.files.length) { alert("Please select a CSV file."); return; }

  const formData = new FormData();
  formData.append("file0", fileInput.files[0]); // matches your Extract-from-File binary property

  loadingEl.classList.remove("hidden");
  try {
    const res = await fetch(WEBHOOK_URL, { method: "POST", body: formData });
    const text = await res.text();               // robust against empty body
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    if (!text) { resultsEl.innerHTML = "<div class='part'>No data returned.</div>"; return; }

    const data = JSON.parse(text);
    renderResults(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Check console for details.");
  } finally {
    loadingEl.classList.add("hidden");
  }
});

function inStockColor(av){
  const s = String(av||"").trim();
  const ok = /in[\s-]?stock/i.test(s) || /^instock$/i.test(s) || /available/i.test(s);
  return ok ? "good" : "bad";
}

function fmtPrice(v){
  if (typeof v === "number") return `$${v.toFixed(2)}`;
  if (!v) return "N/A";
  const n = Number(String(v).replace(/[^\d.]/g,""));
  return isNaN(n) ? String(v) : `$${n.toFixed(2)}`;
}

function renderResults(parts){
  resultsEl.innerHTML = "";
  if (!parts.length){ resultsEl.innerHTML = "<div class='part'>No results.</div>"; return; }

  parts.forEach(p => {
    const part = document.createElement("div");
    part.className = "part";

    const h2 = document.createElement("h2");
    h2.textContent = p.partNumber || p.part_number || "Unknown Part";
    part.appendChild(h2);

    if (p.recommendation){
      const reco = document.createElement("p");
      reco.className = "reco";
      reco.textContent = `Recommendation: ${p.recommendation}`;
      part.appendChild(reco);
    }

    const tbl = document.createElement("table");
    tbl.className = "table";
    tbl.innerHTML = `
      <thead><tr><th>Website</th><th>Price</th><th>Availability</th></tr></thead>
      <tbody></tbody>
    `;
    const tb = tbl.querySelector("tbody");

    (p.results||[]).forEach(r => {
      const tr = document.createElement("tr");

      const tdSite = document.createElement("td");
      if (r.url){
        tdSite.innerHTML = `<a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.site||"Link"}</a>`;
      } else {
        tdSite.textContent = r.site || "—";
      }

      const tdPrice = document.createElement("td");
      tdPrice.textContent = fmtPrice(r.price);

      const tdAv = document.createElement("td");
      tdAv.className = `badge ${inStockColor(r.availability)}`;
      tdAv.textContent = r.availability || "Unknown";

      tr.append(tdSite, tdPrice, tdAv);
      tb.appendChild(tr);
    });

    part.appendChild(tbl);
    resultsEl.appendChild(part);
  });
}
