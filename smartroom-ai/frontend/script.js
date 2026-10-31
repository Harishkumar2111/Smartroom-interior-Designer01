// script.js - Smart Room AI Interior Designer Frontend Controller
const API_BASE = "http://127.0.0.1:8000/api";

// App State
const state = {
  currentTab: "tab-analyzer",
  currentImageId: null,
  currentImageUrl: null,
  analysisData: null,
  recommendationsData: null,
  furnitureCatalog: [],
  projects: [],
  selectedStyle: "Modern",
  budget: 150000
};

// DOM Elements
const toastContainer = document.getElementById("toastContainer");

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupUploadDropzone();
  setupAnalyzer();
  setupCalculator();
  setupRecommendations();
  setupFurnitureCatalog();
  setupDesignStudio();
  setupProjects();
});

// Toast notification helper
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icon = type === "success" ? "✓" : type === "error" ? "⚠️" : "ℹ️";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}



// 2. Navigation
function setupNavigation() {
  const navBtns = document.querySelectorAll(".nav-btn");
  const sidebar = document.getElementById("sidebar");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const mobileQuickSave = document.getElementById("mobileQuickSave");

  function openMobileSidebar() {
    sidebar?.classList.add("open");
    sidebarBackdrop?.classList.add("active");
  }

  function closeMobileSidebar() {
    sidebar?.classList.remove("open");
    sidebarBackdrop?.classList.remove("active");
  }

  mobileMenuBtn?.addEventListener("click", openMobileSidebar);
  sidebarBackdrop?.addEventListener("click", closeMobileSidebar);
  sidebarCloseBtn?.addEventListener("click", closeMobileSidebar);

  mobileQuickSave?.addEventListener("click", () => {
    document.getElementById("btnQuickSave")?.click();
  });

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      if (!targetTab) return; // e.g. external link to paint_studio.html

      navBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
      });
      const activePane = document.getElementById(targetTab);
      if (activePane) activePane.classList.add("active");
      state.currentTab = targetTab;

      // Close mobile drawer upon selection
      closeMobileSidebar();

      // Dynamic title
      const pageTitle = document.getElementById("pageTitle");
      const pageSubtitle = document.getElementById("pageSubtitle");
      if (targetTab === "tab-analyzer") {
        pageTitle.textContent = "🔍 AI Room Analyzer";
        pageSubtitle.textContent = "Upload your room photo to detect architectural flow, color palettes, and spatial placement.";
      } else if (targetTab === "tab-calculator") {
        pageTitle.textContent = "📐 Room Measurement Studio";
        pageSubtitle.textContent = "Calculate exact floor area, wall surface, volume, and paint requirements.";
      } else if (targetTab === "tab-recommendations") {
        pageTitle.textContent = "🎨 Style & Recommendations";
        pageSubtitle.textContent = "Personalized wall palettes, false ceilings, ambient lighting, and furniture plans.";
      } else if (targetTab === "tab-furniture") {
        pageTitle.textContent = "🛋️ Furniture Catalog Browser";
        pageSubtitle.textContent = "Curated designer pieces with estimated prices in INR and dimensions.";
      } else if (targetTab === "tab-design") {
        pageTitle.textContent = "✨ AI Design Generation Studio";
        pageSubtitle.textContent = "Generate conceptual architectural color redesigns and mood visualizations.";
      } else if (targetTab === "tab-projects") {
        pageTitle.textContent = "📁 Saved Projects Database";
        pageSubtitle.textContent = "Manage saved designs, load previous room spaces, or export full PDF reports.";
        loadProjectsFromDb();
      }
    });
  });
}

// 3. Upload & Dropzone
function setupUploadDropzone() {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("roomPhotoInput");
  const promptBox = document.getElementById("dropzonePrompt");
  const previewContainer = document.getElementById("previewContainer");
  const imagePreview = document.getElementById("imagePreview");
  const btnClear = document.getElementById("btnClearImage");

  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--primary)";
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "var(--sky-blue-border)";
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--sky-blue-border)";
    if (e.dataTransfer.files.length) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      handleImageUpload(fileInput.files[0]);
    }
  });

  btnClear.addEventListener("click", (e) => {
    e.stopPropagation();
    state.currentImageId = null;
    state.currentImageUrl = null;
    fileInput.value = "";
    promptBox.style.display = "block";
    previewContainer.style.display = "none";
    showToast("Image cleared", "info");
  });

  async function handleImageUpload(file) {
    const formData = new FormData();
    formData.append("file", file);

    showToast("Uploading and validating room photo...", "info");
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed");
      }

      const data = await res.json();
      state.currentImageId = data.image_id;
      state.currentImageUrl = `http://127.0.0.1:8000${data.preview_url}`;

      // Show preview
      imagePreview.src = state.currentImageUrl;
      promptBox.style.display = "none";
      previewContainer.style.display = "block";
      showToast(`Image uploaded: ${data.width} × ${data.height}px (${data.format})`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }
}

// 4. Room Analyzer
function setupAnalyzer() {
  const btnAnalyze = document.getElementById("btnAnalyzeRoom");
  const spinner = document.getElementById("analyzeSpinner");

  btnAnalyze.addEventListener("click", async () => {
    const roomType = document.getElementById("roomTypeSelect").value;
    const style = document.getElementById("roomStyleSelect").value;
    const length = parseFloat(document.getElementById("analyzerLength").value) || 14;
    const width = parseFloat(document.getElementById("analyzerWidth").value) || 12;
    const budget = parseFloat(document.getElementById("analyzerBudget").value) || 150000;
    const notes = document.getElementById("analyzerNotes").value;

    btnAnalyze.disabled = true;
    spinner.style.display = "inline-block";
    showToast("Analyzing room space and architecture...", "info");

    try {
      const payload = {
        image_id: state.currentImageId,
        image_url: state.currentImageUrl,
        room_type: roomType,
        length: length,
        width: width,
        height: 9.0,
        unit: "feet",
        preferred_style: style,
        budget: budget,
        user_notes: notes
      };

      const res = await fetch(`${API_BASE}/analyze-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Analysis request failed");
      }

      const result = await res.json();
      state.analysisData = result;
      renderAnalysisOutput(result);
      showToast("Room analysis complete!", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btnAnalyze.disabled = false;
      spinner.style.display = "none";
    }
  });

  function renderAnalysisOutput(data) {
    document.getElementById("analyzerEmptyState").style.display = "none";
    const output = document.getElementById("analyzerOutput");
    output.style.display = "block";

    document.getElementById("badgeRoomType").textContent = data.room_type.toUpperCase();
    document.getElementById("badgeStyle").textContent = state.selectedStyle;
    document.getElementById("badgeProvider").textContent = data.ai_provider_used;

    document.getElementById("critiqueOverview").textContent = data.observations.overview || "Spatial critique prepared.";
    document.getElementById("critiqueLimitations").textContent = `ℹ️ Note: ${data.measurement_limitations}`;

    // Color Palette
    const paletteGrid = document.getElementById("paletteGrid");
    paletteGrid.innerHTML = "";
    (data.suggested_wall_colors || []).forEach(color => {
      const card = document.createElement("div");
      card.className = "palette-card";
      card.innerHTML = `
        <div class="swatch" style="background-color: ${color.hex}"></div>
        <div class="swatch-role">${color.role}</div>
        <div class="swatch-name" title="${color.name}">${color.name}</div>
        <div class="swatch-hex">${color.hex}</div>
      `;
      paletteGrid.appendChild(card);
    });

    // Lighting Plan
    const lightingList = document.getElementById("lightingPlanList");
    lightingList.innerHTML = "";
    (data.ceiling_and_lighting || []).forEach(l => {
      const item = document.createElement("div");
      item.className = "plan-item";
      item.innerHTML = `
        <div class="plan-item-left">
          <h5>${l.layer}: ${l.fixture}</h5>
          <p>${l.advice}</p>
        </div>
      `;
      lightingList.appendChild(item);
    });

    // Furniture Plan
    const furnList = document.getElementById("furniturePlanList");
    furnList.innerHTML = "";
    (data.furniture_arrangement || []).forEach(f => {
      const item = document.createElement("div");
      item.className = "plan-item";
      item.innerHTML = `
        <div class="plan-item-left">
          <h5>${f.name} (${f.dimensions})</h5>
          <p>${f.placement} • ${f.material}</p>
        </div>
        <div class="plan-item-right">${f.est_price}</div>
      `;
      furnList.appendChild(item);
    });
  }
}

// 5. Room Measurement Calculator
function setupCalculator() {
  const btnCalc = document.getElementById("btnCalculateMetrics");
  btnCalc.addEventListener("click", async () => {
    const l = parseFloat(document.getElementById("calcLength").value) || 15;
    const w = parseFloat(document.getElementById("calcWidth").value) || 12;
    const h = parseFloat(document.getElementById("calcHeight").value) || 10;
    const unit = document.getElementById("calcUnit").value;
    const doorsCount = parseInt(document.getElementById("calcDoorCount").value) || 0;
    const winCount = parseInt(document.getElementById("calcWindowCount").value) || 0;

    const doors = Array(doorsCount).fill({ width: 3.0, height: 7.0 });
    const windows = Array(winCount).fill({ width: 4.0, height: 4.0 });

    try {
      const res = await fetch(`${API_BASE}/measure-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          length: l,
          width: w,
          height: h,
          unit: unit,
          doors: doors,
          windows: windows
        })
      });

      if (!res.ok) throw new Error("Calculation error");
      const data = await res.json();

      document.getElementById("metricFloorArea").textContent = `${data.floor_area.toLocaleString()} sq ${unit}`;
      document.getElementById("metricNetWall").textContent = `${data.net_wall_area.toLocaleString()} sq ${unit}`;
      document.getElementById("metricVolume").textContent = `${data.room_volume.toLocaleString()} cu ${unit}`;
      document.getElementById("metricPaint").textContent = `${data.paint_liters_estimated} Liters`;
      document.getElementById("metricUsableSpace").textContent = `${data.usable_floor_space.toLocaleString()} sq ${unit}`;
      document.getElementById("metricWalkingSpace").textContent = `${data.walking_space.toLocaleString()} sq ${unit}`;
      document.getElementById("metricSourceLabel").textContent = `Dimension Source: ${data.dimension_source.replace("_", " ").toUpperCase()}`;
      showToast("Measurements calculated successfully!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

// 6. Style & Recommendations Studio
function setupRecommendations() {
  const pills = document.querySelectorAll(".style-pill");
  const budgetSlider = document.getElementById("recommendationBudgetSlider");
  const budgetLabel = document.getElementById("budgetValLabel");

  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.selectedStyle = pill.getAttribute("data-style");
      fetchRecommendations();
    });
  });

  budgetSlider.addEventListener("input", () => {
    state.budget = parseFloat(budgetSlider.value);
    budgetLabel.textContent = `₹${state.budget.toLocaleString("en-IN")}`;
  });

  budgetSlider.addEventListener("change", () => {
    fetchRecommendations();
  });

  // Initial load
  fetchRecommendations();

  async function fetchRecommendations() {
    try {
      const res = await fetch(`${API_BASE}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_type: "bedroom",
          preferred_style: state.selectedStyle,
          budget: state.budget
        })
      });

      if (!res.ok) throw new Error("Failed to load recommendations");
      const data = await res.json();
      state.recommendationsData = data;
      renderRecommendations(data);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderRecommendations(data) {
    const finishes = document.getElementById("recFinishesContent");
    const furn = document.getElementById("recFurnitureContent");

    finishes.innerHTML = `
      <div class="critique-box">
        <h4>${data.style} False Ceiling Specification</h4>
        <p><b>Type:</b> ${data.false_ceilings.type}</p>
        <p><b>Cove Lighting:</b> ${data.false_ceilings.cove_light_color}</p>
        <p><b>Estimated Ceiling Rate:</b> ₹${data.false_ceilings.cost_inr_sqft}/sq ft</p>
      </div>

      <h4>Flooring, Curtains &amp; Rugs</h4>
      <ul style="padding-left: 20px; font-size: 13.5px; color: var(--text-body); line-height: 1.6; margin-bottom: 16px;">
        <li><b>Flooring:</b> ${data.flooring_curtains_rugs.flooring}</li>
        <li><b>Area Rug:</b> ${data.flooring_curtains_rugs.rug}</li>
        <li><b>Curtains:</b> ${data.flooring_curtains_rugs.curtains}</li>
      </ul>

      <h4>Wallpaper &amp; Accent Paneling</h4>
      <div class="plan-list">
        ${(data.wallpaper_and_accents || []).map(w => `
          <div class="plan-item">
            <div class="plan-item-left">
              <h5>${w.type}</h5>
              <p>${w.wall} • ${w.finish}</p>
            </div>
            <div class="plan-item-right">₹${w.est_cost_inr.toLocaleString("en-IN")}</div>
          </div>
        `).join("")}
      </div>
    `;

    furn.innerHTML = `
      <div class="critique-box" style="border-left-color: var(--accent);">
        <h4>INR Budget Distribution (Total: ₹${data.budget_allocation.total_budget_inr.toLocaleString("en-IN")})</h4>
        <p>🛋️ Furniture: <b>₹${data.budget_allocation.furniture_inr.toLocaleString("en-IN")}</b></p>
        <p>💡 False Ceiling &amp; Lights: <b>₹${data.budget_allocation.false_ceiling_and_lighting_inr.toLocaleString("en-IN")}</b></p>
        <p>🎨 Paint &amp; Walls: <b>₹${data.budget_allocation.paint_and_wall_accents_inr.toLocaleString("en-IN")}</b></p>
      </div>

      <h4>Recommended Furniture List</h4>
      <div class="plan-list">
        ${(data.recommended_furniture || []).map(f => `
          <div class="plan-item">
            <div class="plan-item-left">
              <h5>${f.name}</h5>
              <p>${f.placement} • ${f.dimensions}</p>
            </div>
            <div class="plan-item-right">₹${f.estimated_price_inr.toLocaleString("en-IN")}</div>
          </div>
        `).join("")}
      </div>
    `;
  }
}

// 7. Furniture Catalog Browser
function setupFurnitureCatalog() {
  const searchInput = document.getElementById("furnSearch");
  const catFilter = document.getElementById("furnCategoryFilter");
  const budgetFilter = document.getElementById("furnBudgetFilter");

  async function loadFurniture() {
    const params = new URLSearchParams();
    if (searchInput.value) params.append("search", searchInput.value);
    if (catFilter.value) params.append("category", catFilter.value);
    if (budgetFilter.value) params.append("max_price", budgetFilter.value);

    try {
      const res = await fetch(`${API_BASE}/furniture?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load catalog");
      const items = await res.json();
      state.furnitureCatalog = items;
      renderFurnitureGrid(items);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderFurnitureGrid(items) {
    const grid = document.getElementById("furnitureGrid");
    grid.innerHTML = "";

    if (!items.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No matching furniture items found.</div>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "furn-card";
      card.innerHTML = `
        <img class="furn-img" src="${item.image_url}" alt="${item.name}" loading="lazy" />
        <div class="furn-body">
          <span class="furn-cat">${item.icon || "🛋️"} ${item.category}</span>
          <h4 class="furn-title">${item.name}</h4>
          <p class="furn-dims">📐 ${item.length_ft} × ${item.width_ft} × ${item.height_ft} ft</p>
          <div class="furn-footer">
            <div>
              <span class="furn-estimate-label">${item.price_label}</span>
              <div class="furn-price">₹${item.estimated_price_inr.toLocaleString("en-IN")}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-block mt-4" onclick="addFurnitureToDesign('${item.id}')">➕ Add to Design</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  searchInput.addEventListener("input", debounce(loadFurniture, 300));
  catFilter.addEventListener("change", loadFurniture);
  budgetFilter.addEventListener("change", loadFurniture);

  loadFurniture();
}

window.addFurnitureToDesign = (itemId) => {
  const item = state.furnitureCatalog.find(i => i.id === itemId);
  if (item) {
    showToast(`Added "${item.name}" to room configuration`, "success");
  }
};

// 8. AI Design Studio & Interactive Room Painter
function setupDesignStudio() {
  const styleSelect = document.getElementById("designStyleSelect");
  const wallPicker = document.getElementById("designColorPicker");
  const wallHex = document.getElementById("designColorHex");
  const wallName = document.getElementById("wallColorName");

  const ceilingPicker = document.getElementById("ceilingColorPicker");
  const ceilingHex = document.getElementById("ceilingColorHex");
  const ceilingName = document.getElementById("ceilingColorName");

  const accentPicker = document.getElementById("accentColorPicker");
  const accentHex = document.getElementById("accentColorHex");
  const accentName = document.getElementById("accentColorName");

  const opacitySlider = document.getElementById("paintOpacitySlider");
  const opacityLabel = document.getElementById("paintOpacityVal");
  const btnGen = document.getElementById("btnGenerateDesign");
  const btnReset = document.getElementById("btnResetDesign");
  const btnDownload = document.getElementById("btnDownloadEdited");
  const spinner = document.getElementById("genSpinner");
  const canvas = document.getElementById("studioPaintCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const previewEmpty = document.getElementById("genPreviewEmpty");
  const previewBox = document.getElementById("genPreviewBox");

  let baseImage = null;

  // Style Preset Palettes
  const STYLE_PALETTES = {
    Modern: { wall: "#E8ECE9", wallName: "Soft Sage White", ceiling: "#FFFFFF", ceilingName: "Pure Ceiling White", accent: "#2F3E46", accentName: "Deep Nordic Blue" },
    Scandinavian: { wall: "#D4DDD6", wallName: "Scandinavian Mist", ceiling: "#FFFDF9", ceilingName: "Warm Chiffon", accent: "#4A5859", accentName: "Slate Forest" },
    Minimalist: { wall: "#F4F1EA", wallName: "Alabaster White", ceiling: "#FFFFFF", ceilingName: "Pure White", accent: "#2B2D42", accentName: "Royal Charcoal" },
    Luxury: { wall: "#2F3E46", wallName: "Midnight Navy", ceiling: "#EAE6E1", ceilingName: "Pale Pearl", accent: "#DAA520", accentName: "Mustard Gold" },
    "Traditional Indian": { wall: "#D9C9B4", wallName: "Desert Sand", ceiling: "#FFFDF9", ceilingName: "Warm Ivory", accent: "#C97B63", accentName: "Terracotta Sunset" },
    Contemporary: { wall: "#C2B69D", wallName: "Warm Greige", ceiling: "#F0F4F8", ceilingName: "Cool Frost", accent: "#1F2421", accentName: "Anthracite" },
    Industrial: { wall: "#CBCDC8", wallName: "Urban Fog", ceiling: "#F0F4F8", ceilingName: "Cement Light", accent: "#A85D44", accentName: "Burnt Sienna" },
    Bohemian: { wall: "#E0A96D", wallName: "Tuscan Ochre", ceiling: "#FFFDF9", ceilingName: "Warm Chiffon", accent: "#556B2F", accentName: "Olive Shadow" }
  };

  // Change style preset
  if (styleSelect) {
    styleSelect.addEventListener("change", () => {
      const pal = STYLE_PALETTES[styleSelect.value] || STYLE_PALETTES.Modern;
      wallPicker.value = pal.wall;
      wallHex.value = pal.wall;
      if (wallName) wallName.textContent = pal.wallName;

      ceilingPicker.value = pal.ceiling;
      ceilingHex.value = pal.ceiling;
      if (ceilingName) ceilingName.textContent = pal.ceilingName;

      accentPicker.value = pal.accent;
      accentHex.value = pal.accent;
      if (accentName) accentName.textContent = pal.accentName;

      renderCanvas();
    });
  }

  // Two-way sync for color inputs
  function setupColorPair(picker, hexInput, nameEl, defaultName) {
    if (!picker || !hexInput) return;
    picker.addEventListener("input", () => {
      hexInput.value = picker.value;
      if (nameEl) nameEl.textContent = `Custom (${picker.value})`;
      renderCanvas();
    });
    hexInput.addEventListener("input", () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
        picker.value = hexInput.value;
        if (nameEl) nameEl.textContent = `Custom (${hexInput.value})`;
        renderCanvas();
      }
    });
  }

  setupColorPair(wallPicker, wallHex, wallName, "Soft Sage White");
  setupColorPair(ceilingPicker, ceilingHex, ceilingName, "Pure Ceiling White");
  setupColorPair(accentPicker, accentHex, accentName, "Terracotta Sunset");

  // Render on canvas with live color overlay
  function renderCanvas() {
    if (!ctx || !baseImage) return;

    canvas.width = baseImage.naturalWidth || 800;
    canvas.height = baseImage.naturalHeight || 600;

    // 1. Draw base room photo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

    const opacity = (parseInt(opacitySlider.value, 10) || 35) / 100;
    const wallCol = wallHex.value || "#E8ECE9";
    const ceilingCol = ceilingHex.value || "#FFFFFF";
    const accentCol = accentHex.value || "#C97B63";

    // 2. Wall tint
    ctx.save();
    ctx.fillStyle = wallCol;
    ctx.globalAlpha = opacity;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // 3. Ceiling highlight (top 26% of room)
    ctx.save();
    const ceilingH = Math.round(canvas.height * 0.26);
    const grad = ctx.createLinearGradient(0, 0, 0, ceilingH);
    grad.addColorStop(0, ceilingCol);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.globalAlpha = opacity * 0.9;
    ctx.fillRect(0, 0, canvas.width, ceilingH);
    ctx.restore();

    // 4. Accent tone vignette (subtle right vertical strip)
    ctx.save();
    const accentW = Math.round(canvas.width * 0.28);
    const accentGrad = ctx.createLinearGradient(canvas.width - accentW, 0, canvas.width, 0);
    accentGrad.addColorStop(0, "transparent");
    accentGrad.addColorStop(1, accentCol);
    ctx.fillStyle = accentGrad;
    ctx.globalAlpha = opacity * 0.55;
    ctx.fillRect(canvas.width - accentW, 0, accentW, canvas.height);
    ctx.restore();

    // 5. Architectural branding banner
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    const bannerH = 36;
    ctx.fillRect(0, canvas.height - bannerH, canvas.width, bannerH);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText(`SmartRoom AI — Wall: ${wallCol} | Ceiling: ${ceilingCol} | Accent: ${accentCol} (${Math.round(opacity * 100)}% tint)`, 16, canvas.height - 13);

    previewEmpty.style.display = "none";
    previewBox.style.display = "block";
  }

  // Update image when uploaded in tab 1
  function loadRoomIntoCanvas() {
    if (state.currentImageUrl) {
      baseImage = new Image();
      baseImage.crossOrigin = "anonymous";
      baseImage.onload = () => {
        renderCanvas();
      };
      baseImage.src = state.currentImageUrl;
    }
  }

  opacitySlider.addEventListener("input", () => {
    opacityLabel.textContent = `${opacitySlider.value}%`;
    renderCanvas();
  });

  // Reset colors to default
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      wallPicker.value = "#E8ECE9";
      wallHex.value = "#E8ECE9";
      if (wallName) wallName.textContent = "Soft Sage White";

      ceilingPicker.value = "#FFFFFF";
      ceilingHex.value = "#FFFFFF";
      if (ceilingName) ceilingName.textContent = "Pure Ceiling White";

      accentPicker.value = "#C97B63";
      accentHex.value = "#C97B63";
      if (accentName) accentName.textContent = "Terracotta Sunset";

      opacitySlider.value = 35;
      opacityLabel.textContent = "35%";

      renderCanvas();
      showToast("Colors reset to default palette", "info");
    });
  }

  // Observe navigation to tab-design to auto-load uploaded photo
  const navDesign = document.getElementById("navDesign");
  if (navDesign) {
    navDesign.addEventListener("click", () => {
      if (state.currentImageUrl && !baseImage) {
        loadRoomIntoCanvas();
      }
    });
  }

  // Download colorized canvas
  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      if (!canvas || !baseImage) {
        showToast("Please upload a room image first in Tab 1!", "error");
        return;
      }
      const link = document.createElement("a");
      link.download = `SmartRoom_Design_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("Colorized room design downloaded successfully!", "success");
    });
  }

  // Generate architectural backend overlay via FastAPI
  btnGen.addEventListener("click", async () => {
    if (!state.currentImageId && !state.currentImageUrl) {
      showToast("Please upload a room image in Tab 1 first!", "error");
      return;
    }

    btnGen.disabled = true;
    spinner.style.display = "inline-block";
    showToast("Rendering architectural color overlay...", "info");

    try {
      const payload = {
        image_id: state.currentImageId,
        image_url: state.currentImageUrl,
        style: styleSelect ? styleSelect.value : state.selectedStyle,
        wall_color: wallHex.value,
        ceiling_color: ceilingHex.value,
        accent_color: accentHex.value,
        ceiling_preferences: document.getElementById("designCeilingPref").value,
        prompt_instructions: document.getElementById("designInstructions").value
      };

      const res = await fetch(`${API_BASE}/generate-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Design generation failed");
      }
      const data = await res.json();

      document.getElementById("genPreviewEmpty").style.display = "none";
      const previewBox = document.getElementById("genPreviewBox");
      previewBox.style.display = "block";

      if (data.generated_image_url) {
        const genImg = new Image();
        genImg.crossOrigin = "anonymous";
        genImg.onload = () => {
          baseImage = genImg;
          renderCanvas();
        };
        genImg.src = `http://127.0.0.1:8000${data.generated_image_url}`;
      }

      document.getElementById("genStatusBadge").textContent = data.ai_generated ? "AI Diffusion Generated" : "Architectural Color Overlay";
      document.getElementById("genMessage").textContent = data.message;
      showToast("Design preview generated & synced!", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btnGen.disabled = false;
      spinner.style.display = "none";
    }
  });
}

// 9. Saved Projects Management & PDF Download
function setupProjects() {
  document.getElementById("btnQuickSave")?.addEventListener("click", saveCurrentProject);
  document.getElementById("btnCreateNewProjectModal")?.addEventListener("click", saveCurrentProject);
}

async function saveCurrentProject() {
  const name = prompt("Enter Project Name:", `Room Project - ${new Date().toLocaleDateString()}`);
  if (!name) return;

  const payload = {
    name: name,
    room_type: document.getElementById("roomTypeSelect")?.value || "bedroom",
    dimensions: {
      length: parseFloat(document.getElementById("analyzerLength")?.value || 14),
      width: parseFloat(document.getElementById("analyzerWidth")?.value || 12),
      height: 9.0,
      unit: "feet"
    },
    image_id: state.currentImageId,
    image_url: state.currentImageUrl,
    selected_style: state.selectedStyle,
    selected_colors: {
      wall_color: document.getElementById("designColorHex")?.value || "#E8ECE9"
    },
    furniture_selections: state.recommendationsData?.recommended_furniture || [],
    recommendations: state.recommendationsData || {},
    budget_data: { total: state.budget }
  };

  try {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Failed to save project");
    const saved = await res.json();
    showToast(`Project "${saved.name}" saved to database!`, "success");
    loadProjectsFromDb();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function loadProjectsFromDb() {
  const grid = document.getElementById("projectListGrid");
  grid.innerHTML = "<p>Loading saved projects...</p>";

  try {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error("Failed to retrieve projects");
    const projects = await res.json();
    state.projects = projects;

    if (!projects.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">No saved projects yet. Click "Save Project" to persist your first room!</div>`;
      return;
    }

    grid.innerHTML = "";
    projects.forEach(p => {
      const card = document.createElement("div");
      card.className = "project-card";
      const createdDate = p.created_at ? new Date(p.created_at).toLocaleDateString() : "Recent";
      card.innerHTML = `
        <div>
          <h4>${p.name}</h4>
          <p class="project-meta">Room: <b>${p.room_type}</b> • Style: <b>${p.selected_style}</b> • Saved: ${createdDate}</p>
          <div class="result-badge-row">
            <span class="badge">Budget: ₹${(p.budget_data?.total || 150000).toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div class="project-actions">
          <button class="btn btn-primary" onclick="downloadPdfReport(${p.id})">📄 Download PDF Report</button>
          <button class="btn btn-secondary" onclick="deleteProjectFromDb(${p.id})">🗑️ Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
  }
}

window.downloadPdfReport = (projectId) => {
  showToast("Generating PDF report with ReportLab...", "info");
  window.open(`${API_BASE}/projects/${projectId}/report`, "_blank");
};

window.deleteProjectFromDb = async (projectId) => {
  if (!confirm("Are you sure you want to delete this project?")) return;
  try {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    showToast("Project deleted", "success");
    loadProjectsFromDb();
  } catch (err) {
    showToast(err.message, "error");
  }
};

// Utility: debounce
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
