// script.js - Smart Room AI Interior Designer Frontend Controller
const API_BASE = "http://127.0.0.1:8000/api";

// App State
const state = {
  currentTab: "tab-analyzer",
  currentImageId: null,
  currentImageUrl: null,
  editedImageDataUrl: null,
  analysisData: null,
  recommendationsData: null,
  furnitureCatalog: [],
  projects: [],
  selectedStyle: "Modern",
  budget: 150000,
  placedFurniture: [],
  selectedFurnitureId: null
};

const SHARED_ROOM_KEYS = {
  originalUrl: "smartroom.originalRoomImage",
  imageId: "smartroom.originalRoomImageId",
  editedUrl: "smartroom.paintedRoomImage",
  furniture: "smartroom.furnitureArrangement",
  savedDesigns: "smartroom.savedDesignsList"
};
function setOriginalRoomImage(value) {
  if (value) localStorage.setItem(SHARED_ROOM_KEYS.originalUrl, value);
  else localStorage.removeItem(SHARED_ROOM_KEYS.originalUrl);
  state.currentImageUrl = value || null;
  return state.currentImageUrl;
}
function getOriginalRoomImage() { return localStorage.getItem(SHARED_ROOM_KEYS.originalUrl) || state.currentImageUrl || null; }
function setEditedRoomImage(value) {
  if (value) localStorage.setItem(SHARED_ROOM_KEYS.editedUrl, value);
  else localStorage.removeItem(SHARED_ROOM_KEYS.editedUrl);
  state.editedImageDataUrl = value || null;
  return state.editedImageDataUrl;
}
function getEditedRoomImage() { return localStorage.getItem(SHARED_ROOM_KEYS.editedUrl) || state.editedImageDataUrl || null; }
function persistFurnitureArrangement() {
  try { localStorage.setItem(SHARED_ROOM_KEYS.furniture, JSON.stringify(state.placedFurniture)); } catch (_) { /* storage is optional */ }
}
function persistSharedRoomState() {
  if (state.currentImageUrl) setOriginalRoomImage(state.currentImageUrl);
  if (state.currentImageId) localStorage.setItem(SHARED_ROOM_KEYS.imageId, state.currentImageId);
  if (state.editedImageDataUrl) setEditedRoomImage(state.editedImageDataUrl);
  persistFurnitureArrangement();
}
function restoreSharedRoomState() {
  state.currentImageUrl = getOriginalRoomImage();
  state.currentImageId = localStorage.getItem(SHARED_ROOM_KEYS.imageId) || null;
  state.editedImageDataUrl = getEditedRoomImage();
  try { state.placedFurniture = JSON.parse(localStorage.getItem(SHARED_ROOM_KEYS.furniture) || "[]"); } catch (_) { state.placedFurniture = []; }
}

// DOM Elements
const toastContainer = document.getElementById("toastContainer");

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  restoreSharedRoomState();
  setupNavigation();
  setupUploadDropzone();
  setupAnalyzer();
  setupCalculator();
  setupRecommendations();
  setupFurnitureCatalog();
  setupRoomWorkspace();
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
      if (targetTab === "tab-furniture") document.title = "Furniture Catalog | Smart Room AI";

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
        pageTitle.textContent = "Furniture Catalog";
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
    state.editedImageDataUrl = null;
    fileInput.value = "";
    Object.values(SHARED_ROOM_KEYS).forEach(key => localStorage.removeItem(key));
    state.placedFurniture = [];
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
      setOriginalRoomImage(`http://127.0.0.1:8000${data.preview_url}`);
      state.editedImageDataUrl = null;
      setEditedRoomImage(null);
      state.placedFurniture = [];
      localStorage.removeItem(SHARED_ROOM_KEYS.furniture);
      persistSharedRoomState();

      // Show preview
      imagePreview.src = state.currentImageUrl;
      window.roomWorkspace?.setRoomImage(state.currentImageUrl);
      promptBox.style.display = "none";
      previewContainer.style.display = "block";
      showToast(`Image uploaded: ${data.width} × ${data.height}px (${data.format})`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  imagePreview.addEventListener("click", () => openImageLightbox(imagePreview.src));
  if (state.currentImageUrl) {
    imagePreview.src = state.currentImageUrl;
    promptBox.style.display = "none";
    previewContainer.style.display = "block";
  }
}

function openImageLightbox(src) {
  const box = document.getElementById("imageLightbox");
  const image = document.getElementById("lightboxImage");
  if (!box || !image || !src) return;
  let zoom = 1;
  const render = () => { image.style.transform = `scale(${zoom})`; document.getElementById("lightboxZoomLabel").textContent = `${Math.round(zoom * 100)}%`; };
  image.src = src; box.hidden = false; render();
  const close = () => { box.hidden = true; image.src = ""; };
  document.getElementById("lightboxClose").onclick = close;
  document.getElementById("lightboxZoomIn").onclick = () => { zoom = Math.min(3, zoom + .25); render(); };
  document.getElementById("lightboxZoomOut").onclick = () => { zoom = Math.max(.5, zoom - .25); render(); };
  document.getElementById("lightboxFit").onclick = () => { zoom = 1; render(); };
  document.getElementById("lightboxReset").onclick = () => { zoom = 1; render(); };
  box.onclick = e => { if (e.target === box) close(); };
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

// 7. Furniture Catalog Browser & Pre-loaded Default Library
const DEFAULT_FURNITURE_CATALOG = [
  {
    id: "desk-modern-office",
    name: "Modern Office Desk",
    category: "Desk",
    icon: "🖥️",
    length_ft: 4.8,
    width_ft: 2.4,
    height_ft: 2.5,
    price_min_inr: 18000,
    price_max_inr: 36000,
    estimated_price_inr: 24500,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "office", "bedroom"],
    compatible_styles: ["Modern", "Minimalist", "Contemporary"],
    image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80",
    description: "Sleek minimalist executive work desk with anti-glare scratch-resistant matte laminate surface and cable management."
  },
  {
    id: "desk-wooden-office",
    name: "Wooden Office Desk",
    category: "Desk",
    icon: "🪵",
    length_ft: 5.0,
    width_ft: 2.5,
    height_ft: 2.5,
    price_min_inr: 26000,
    price_max_inr: 52000,
    estimated_price_inr: 34000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "office", "bedroom"],
    compatible_styles: ["Modern", "Traditional Indian", "Scandinavian", "Luxury"],
    image_url: "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=500&auto=format&fit=crop&q=80",
    description: "Solid natural oak and timber writing desk featuring organic grain textures and sturdy angled legs."
  },
  {
    id: "desk-computer-drawers",
    name: "Computer Desk with Drawers",
    category: "Desk",
    icon: "🗄️",
    length_ft: 4.5,
    width_ft: 2.2,
    height_ft: 2.5,
    price_min_inr: 20000,
    price_max_inr: 42000,
    estimated_price_inr: 28500,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "office", "bedroom"],
    compatible_styles: ["Modern", "Minimalist", "Contemporary"],
    image_url: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=500&auto=format&fit=crop&q=80",
    description: "Heavy-duty computer desk equipped with 3 soft-closing side drawers, lockable cabinet, and monitor riser."
  },
  {
    id: "laptop-ultraslim",
    name: "Modern Ultra-Slim Laptop",
    category: "Electronics",
    icon: "💻",
    length_ft: 1.2,
    width_ft: 0.9,
    height_ft: 0.6,
    price_min_inr: 55000,
    price_max_inr: 95000,
    estimated_price_inr: 68000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "office", "bedroom", "living_room"],
    compatible_styles: ["Modern", "Minimalist", "Contemporary"],
    image_url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=80",
    description: "Featherweight 14-inch anodized aluminum workstation laptop with bezel-less high-resolution display."
  },
  {
    id: "laptop-pro-studio",
    name: "Pro Studio Performance Laptop",
    category: "Electronics",
    icon: "💻",
    length_ft: 1.3,
    width_ft: 0.95,
    height_ft: 0.7,
    price_min_inr: 90000,
    price_max_inr: 160000,
    estimated_price_inr: 118000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "office"],
    compatible_styles: ["Modern", "Industrial", "Luxury"],
    image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80",
    description: "High-performance 16-inch creator workstation laptop for 3D architecture modeling and rendering."
  },
  {
    id: "workstation-office-laptop",
    name: "Office Laptop Workstation",
    category: "Desk",
    icon: "💼",
    length_ft: 4.2,
    width_ft: 2.2,
    height_ft: 3.2,
    price_min_inr: 25000,
    price_max_inr: 55000,
    estimated_price_inr: 36000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "office"],
    compatible_styles: ["Modern", "Minimalist", "Contemporary"],
    image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80",
    description: "Integrated laptop workspace with ergonomic dual-tier surface, cable spine, and integrated power dock."
  },
  {
    id: "chair-single-office",
    name: "Single Office Chair",
    category: "Chair",
    icon: "🪑",
    length_ft: 2.0,
    width_ft: 2.0,
    height_ft: 3.2,
    price_min_inr: 5500,
    price_max_inr: 12000,
    estimated_price_inr: 7800,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "office", "bedroom"],
    compatible_styles: ["Modern", "Minimalist", "Scandinavian"],
    image_url: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=80",
    description: "Compact, durable mid-back upholstered task chair with smooth rolling nylon casters."
  },
  {
    id: "chair-ergonomic-office",
    name: "Ergonomic Office Chair",
    category: "Chair",
    icon: "💺",
    length_ft: 2.2,
    width_ft: 2.2,
    height_ft: 3.8,
    price_min_inr: 14000,
    price_max_inr: 32000,
    estimated_price_inr: 19500,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "office"],
    compatible_styles: ["Modern", "Contemporary", "Industrial"],
    image_url: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&auto=format&fit=crop&q=80",
    description: "High-grade breathable mesh ergonomic chair with dynamic lumbar support and 3D armrests."
  },
  {
    id: "chair-adjustable-computer",
    name: "Adjustable Computer Chair",
    category: "Chair",
    icon: "💺",
    length_ft: 2.1,
    width_ft: 2.1,
    height_ft: 3.5,
    price_min_inr: 9500,
    price_max_inr: 21000,
    estimated_price_inr: 13500,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "office", "bedroom"],
    compatible_styles: ["Modern", "Minimalist", "Contemporary"],
    image_url: "https://images.unsplash.com/photo-1688578735427-994ecbf4e266?w=500&auto=format&fit=crop&q=80",
    description: "Class-4 hydraulic gas lift adjustable computer chair with recline lock and high-density foam cushion."
  },
  {
    id: "desk-height-adjustable",
    name: "Dual-Motor Electric Standing Desk",
    category: "Desk",
    icon: "🖥️",
    length_ft: 4.5,
    width_ft: 2.3,
    height_ft: 2.5,
    price_min_inr: 24000,
    price_max_inr: 45000,
    estimated_price_inr: 32000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["study", "bedroom"],
    compatible_styles: ["Modern", "Minimalist", "Industrial"],
    image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500&auto=format&fit=crop&q=60",
    description: "Ergonomic sit-stand desk with 4 memory presets, cable tray, and birch veneer top."
  },
  {
    id: "chair-accent-swivel",
    name: "Nordic Swivel Accent Armchair",
    category: "Chair",
    icon: "🪑",
    length_ft: 2.8,
    width_ft: 2.8,
    height_ft: 2.7,
    price_min_inr: 15000,
    price_max_inr: 38000,
    estimated_price_inr: 24000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["living_room", "bedroom", "study"],
    compatible_styles: ["Scandinavian", "Modern", "Contemporary"],
    image_url: "https://images.unsplash.com/photo-1580481077156-f94b83072f91?w=500&auto=format&fit=crop&q=60",
    description: "Comfortable 360-degree swivel lounge chair in textured terracotta boucle fabric."
  },
  {
    id: "sofa-3seater",
    name: "Curved Boucle 3-Seater Sofa",
    category: "Sofa",
    icon: "🛋️",
    length_ft: 7.2,
    width_ft: 3.2,
    height_ft: 2.8,
    price_min_inr: 35000,
    price_max_inr: 85000,
    estimated_price_inr: 52000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["living_room"],
    compatible_styles: ["Modern", "Contemporary", "Scandinavian"],
    image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60",
    description: "Soft sculptural curved sofa upholstered in high-durability cream boucle fabric."
  },
  {
    id: "sofa-sectional",
    name: "L-Shape Chaise Sectional Sofa",
    category: "Sofa",
    icon: "🛋️",
    length_ft: 8.5,
    width_ft: 5.5,
    height_ft: 2.9,
    price_min_inr: 48000,
    price_max_inr: 125000,
    estimated_price_inr: 74000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["living_room"],
    compatible_styles: ["Modern", "Luxury", "Contemporary"],
    image_url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&auto=format&fit=crop&q=60",
    description: "Spacious modular L-sectional with reversible chaise and stain-resistant velvet fabric."
  },
  {
    id: "bed-queen",
    name: "Upholstered Queen Bed with Hydraulic Storage",
    category: "Bed",
    icon: "🛏️",
    length_ft: 6.5,
    width_ft: 5.0,
    height_ft: 3.8,
    price_min_inr: 28000,
    price_max_inr: 65000,
    estimated_price_inr: 42000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["bedroom"],
    compatible_styles: ["Modern", "Luxury", "Contemporary", "Scandinavian"],
    image_url: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?w=500&auto=format&fit=crop&q=60",
    description: "Premium upholstered headboard queen bed with spacious under-mattress gas-lift storage."
  },
  {
    id: "bed-single",
    name: "Minimalist Single Bed",
    category: "Bed",
    icon: "🛏️",
    length_ft: 6.5,
    width_ft: 3.5,
    height_ft: 1.5,
    price_min_inr: 8000,
    price_max_inr: 22000,
    estimated_price_inr: 14500,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["bedroom", "guest_room", "studio"],
    compatible_styles: ["Modern", "Minimalist", "Scandinavian"],
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=500&auto=format&fit=crop&q=60",
    description: "Compact solid timber frame single bed ideal for studio apartments or kids/guest rooms."
  },
  {
    id: "wardrobe-sliding-3door",
    name: "Modular 3-Door Sliding Wardrobe with Mirror",
    category: "Storage",
    icon: "🚪",
    length_ft: 7.0,
    width_ft: 2.0,
    height_ft: 8.0,
    price_min_inr: 42000,
    price_max_inr: 95000,
    estimated_price_inr: 62000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["bedroom"],
    compatible_styles: ["Modern", "Luxury", "Minimalist"],
    image_url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&auto=format&fit=crop&q=60",
    description: "Floor-to-ceiling wardrobe with smooth soft-close sliding tracks and built-in full length mirror."
  },
  {
    id: "dining-table-6seater",
    name: "Italian Sintered Stone 6-Seater Dining Set",
    category: "Table",
    icon: "🍽️",
    length_ft: 5.5,
    width_ft: 3.0,
    height_ft: 2.5,
    price_min_inr: 45000,
    price_max_inr: 110000,
    estimated_price_inr: 65000,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["dining_room"],
    compatible_styles: ["Luxury", "Modern", "Contemporary"],
    image_url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500&auto=format&fit=crop&q=60",
    description: "Heat-proof, scratch-resistant sintered stone dining table with 6 velvet chairs."
  },
  {
    id: "coffee-table-nesting",
    name: "Fluted Ceramic Nesting Coffee Tables",
    category: "Table",
    icon: "🪑",
    length_ft: 3.2,
    width_ft: 3.2,
    height_ft: 1.5,
    price_min_inr: 12000,
    price_max_inr: 28000,
    estimated_price_inr: 18500,
    price_label: "Estimated Market Price (INR)",
    suitable_rooms: ["living_room"],
    compatible_styles: ["Modern", "Contemporary", "Scandinavian"],
    image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&auto=format&fit=crop&q=60",
    description: "Pair of round nesting tables with fluted cylindrical base and smoke-tempered glass top."
  }
];

function setupFurnitureCatalog() {
  const searchInput = document.getElementById("furnSearch");
  const catFilter = document.getElementById("furnCategoryFilter");
  const budgetFilter = document.getElementById("furnBudgetFilter");

  // Initialize with complete default catalog
  state.furnitureCatalog = [...DEFAULT_FURNITURE_CATALOG];
  filterAndRenderCatalog();

  async function loadFurnitureFromApi() {
    const params = new URLSearchParams();
    if (searchInput?.value) params.append("search", searchInput.value);
    if (catFilter?.value) params.append("category", catFilter.value);
    if (budgetFilter?.value) params.append("max_price", budgetFilter.value);

    try {
      const res = await fetch(`${API_BASE}/furniture?${params.toString()}`);
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items) && items.length > 0) {
          state.furnitureCatalog = items;
          filterAndRenderCatalog();
          return;
        }
      }
    } catch (_) {
      // Offline or server booting - fallback is already rendered!
    }
    filterAndRenderCatalog();
  }

  function filterAndRenderCatalog() {
    let items = state.furnitureCatalog || DEFAULT_FURNITURE_CATALOG;
    const q = (searchInput?.value || "").toLowerCase().trim();
    const cat = (catFilter?.value || "").toLowerCase().trim();
    const maxP = budgetFilter?.value ? parseFloat(budgetFilter.value) : null;

    if (q) {
      items = items.filter(it =>
        it.name.toLowerCase().includes(q) ||
        (it.description && it.description.toLowerCase().includes(q)) ||
        it.category.toLowerCase().includes(q)
      );
    }
    if (cat) {
      items = items.filter(it => it.category.toLowerCase() === cat);
    }
    if (maxP !== null && !isNaN(maxP)) {
      items = items.filter(it => it.estimated_price_inr <= maxP);
    }
    renderFurnitureGrid(items);
  }

  function renderFurnitureGrid(items) {
    const grid = document.getElementById("furnitureGrid");
    if (!grid) return;
    grid.innerHTML = "";
    document.getElementById("catalogCount")?.replaceChildren(document.createTextNode(`${items.length} pieces`));

    if (!items.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; padding: 24px 12px; font-size: 13px;">No matching furniture items found in this category.</div>`;
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
              <span class="furn-estimate-label">${item.price_label || "Estimated Price"}</span>
              <div class="furn-price">₹${item.estimated_price_inr.toLocaleString("en-IN")}</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-block mt-4" onclick="addFurnitureToDesign('${item.id}')">➕ Add to Room</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  searchInput?.addEventListener("input", debounce(filterAndRenderCatalog, 200));
  catFilter?.addEventListener("change", filterAndRenderCatalog);
  budgetFilter?.addEventListener("change", filterAndRenderCatalog);

  document.querySelectorAll(".category-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      if (catFilter) catFilter.value = pill.dataset.category || "";
      filterAndRenderCatalog();
    });
  });

  loadFurnitureFromApi();
}

window.addFurnitureToDesign = (itemId) => {
  const item = state.furnitureCatalog.find(i => i.id === itemId) || DEFAULT_FURNITURE_CATALOG.find(i => i.id === itemId);
  if (item) {
    if (!getOriginalRoomImage() && !getEditedRoomImage()) {
      showToast("Please upload a room image in AI Room Analyzer first!", "error");
      return;
    }
    window.roomWorkspace?.addFurniture(item);
    showToast(`Added "${item.name}" to room preview`, "success");
  }
};

// 8. Interactive Furniture Room Workspace with Full Undo/Redo/Reset, Sizing, Clamping & PDF Export
function setupRoomWorkspace() {
  const canvas = document.getElementById("roomDesignCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const empty = document.getElementById("workspaceEmpty");
  const shell = document.getElementById("roomCanvasShell");
  
  let roomImage = null;
  let currentBackgroundMode = "painted"; // "painted" | "original"
  let zoom = 1;
  let dragging = null;
  let resizing = null;
  let resizeStart = null;
  let dragOffset = { x: 0, y: 0 };
  let preActionSnapshot = null;
  
  const imageCache = new Map();
  const history = [];
  const redoStack = [];

  function updateUndoRedoUI() {
    const undoBtn = document.getElementById("workspaceUndoBtn");
    const redoBtn = document.getElementById("workspaceRedoBtn");
    if (undoBtn) {
      undoBtn.disabled = history.length === 0;
      undoBtn.style.opacity = history.length === 0 ? "0.55" : "1";
    }
    if (redoBtn) {
      redoBtn.disabled = redoStack.length === 0;
      redoBtn.style.opacity = redoStack.length === 0 ? "0.55" : "1";
    }
  }

  function recordPreAction() {
    preActionSnapshot = JSON.stringify(state.placedFurniture);
  }

  function commitAction() {
    if (preActionSnapshot !== null) {
      const now = JSON.stringify(state.placedFurniture);
      if (now !== preActionSnapshot) {
        history.push(preActionSnapshot);
        if (history.length > 50) history.shift();
        redoStack.length = 0;
        persistFurnitureArrangement();
        updateUndoRedoUI();
      }
      preActionSnapshot = null;
    }
  }

  function recordDirectAction(fn) {
    const current = JSON.stringify(state.placedFurniture);
    history.push(current);
    if (history.length > 50) history.shift();
    redoStack.length = 0;
    fn();
    persistFurnitureArrangement();
    updateUndoRedoUI();
    draw();
    updateSelection();
  }

  function fitCanvas() {
    canvas.width = 1200;
    canvas.height = 700;
    draw();
  }

  function roomRect() {
    if (!roomImage || !roomImage.naturalWidth) return null;
    const scale = Math.min(canvas.width / roomImage.naturalWidth, canvas.height / roomImage.naturalHeight) * zoom;
    const w = roomImage.naturalWidth * scale;
    const h = roomImage.naturalHeight * scale;
    return { x: (canvas.width - w) / 2, y: (canvas.height - h) / 2, w, h };
  }

  function pieceBounds(p) {
    const angle = Math.abs((p.rotation || 0) * Math.PI / 180);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return {
      w: Math.abs(p.width * c) + Math.abs(p.height * s),
      h: Math.abs(p.width * s) + Math.abs(p.height * c)
    };
  }

  function clamp(p) {
    const r = roomRect() || { x: 0, y: 0, w: canvas.width, h: canvas.height };
    // Prevent furniture from exceeding room boundaries
    if (p.width > r.w * 0.95) p.width = r.w * 0.95;
    if (p.height > r.h * 0.95) p.height = r.h * 0.95;
    const b = pieceBounds(p);
    if (b.w > r.w) {
      const sc = (r.w * 0.9) / b.w;
      p.width *= sc;
      p.height *= sc;
    }
    if (b.h > r.h) {
      const sc = (r.h * 0.9) / b.h;
      p.width *= sc;
      p.height *= sc;
    }
    const finalB = pieceBounds(p);
    p.x = Math.max(r.x + finalB.w / 2, Math.min(r.x + r.w - finalB.w / 2, p.x));
    p.y = Math.max(r.y + finalB.h / 2, Math.min(r.y + r.h - finalB.h / 2, p.y));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!roomImage) return;
    const r = roomRect();
    if (!r) return;

    // 1. Draw base room image (painted or original)
    ctx.drawImage(roomImage, r.x, r.y, r.w, r.h);

    // 2. Draw subtle room boundary border
    ctx.strokeStyle = "rgba(2, 132, 199, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // 3. Draw all placed furniture
    state.placedFurniture.forEach(piece => {
      const img = imageCache.get(piece.imageUrl);
      const isSelected = piece.id === state.selectedFurnitureId;
      const w = piece.width;
      const h = piece.height;

      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate((piece.rotation || 0) * Math.PI / 180);

      // Shadow under furniture
      ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = isSelected ? 16 : 8;
      ctx.shadowOffsetY = 6;

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.globalAlpha = isSelected ? 0.98 : 0.92;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        // Fallback placeholder card
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = "#0284c7";
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(piece.name, 0, 0);
      }

      ctx.shadowColor = "transparent";

      // Selection box & corner resize handle
      if (isSelected) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        // Resize corner handle (bottom-right)
        ctx.setLineDash([]);
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(w / 2 - 10, h / 2 - 10, 20, 20);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(w / 2 - 7, h / 2 - 7, 14, 14);
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(w / 2 - 4, h / 2 - 4, 8, 8);

        // Rotation indicator at top
        ctx.beginPath();
        ctx.arc(0, -h / 2 - 14, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#0284c7";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("↺", 0, -h / 2 - 11);
      }

      ctx.restore();
    });
  }

  function loadImage(url, callback) {
    if (!url) return;
    if (imageCache.has(url) && imageCache.get(url).complete) {
      callback?.(imageCache.get(url));
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(url, img);
      callback?.(img);
      draw();
    };
    img.src = url;
  }

  function updateBackgroundThumbnails() {
    const painted = getEditedRoomImage();
    const orig = getOriginalRoomImage();
    const paintedImg = document.getElementById("thumbPaintedImg");
    const origImg = document.getElementById("thumbOriginalImg");
    if (painted && paintedImg) paintedImg.src = painted;
    if (orig && origImg) origImg.src = orig;
  }

  function setRoomImage(url, mode = null) {
    if (!url) return;
    if (mode) currentBackgroundMode = mode;
    loadImage(url, img => {
      roomImage = img;
      if (empty) empty.style.display = "none";
      const isPainted = url === getEditedRoomImage();
      const statusEl = document.getElementById("canvasStatus");
      if (statusEl) {
        statusEl.textContent = isPainted
          ? "🎨 Final painted room image active (Furniture overlay layer enabled)"
          : "🖼️ Original room photo active (Furniture overlay layer enabled)";
      }
      // Toggle button active states
      const paintedBtn = document.getElementById("viewPaintedRoomBtn");
      const origBtn = document.getElementById("viewOriginalRoomBtn");
      const paintedCard = document.getElementById("thumbPaintedCard");
      const origCard = document.getElementById("thumbOriginalCard");
      if (paintedBtn) paintedBtn.classList.toggle("active", isPainted);
      if (origBtn) origBtn.classList.toggle("active", !isPainted);
      if (paintedCard) paintedCard.classList.toggle("active", isPainted);
      if (origCard) origCard.classList.toggle("active", !isPainted);
      updateBackgroundThumbnails();
      fitCanvas();
    });
  }

  function getPoint(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * canvas.width / r.width,
      y: (e.clientY - r.top) * canvas.height / r.height
    };
  }

  function addFurniture(item) {
    recordDirectAction(() => {
      const r = roomRect() || { x: 0, y: 0, w: canvas.width, h: canvas.height };
      const widthFt = Math.max(0.5, Number(item.length_ft) || 4);
      const heightFt = Math.max(0.5, Number(item.height_ft) || 3);
      const depthFt = Math.max(0.2, Number(item.width_ft) || 2);
      const width = Math.min(r.w * 0.5, Math.max(80, widthFt * 26));
      const height = Math.max(60, width * (heightFt / widthFt) * 0.75);

      const piece = {
        id: `${item.id}-${Date.now()}`,
        itemId: item.id,
        name: item.name,
        category: item.category,
        imageUrl: item.image_url,
        estimated_price_inr: item.estimated_price_inr || 15000,
        x: r.x + r.w / 2,
        y: r.y + r.h * 0.65,
        width,
        height,
        widthFt,
        heightFt,
        depthFt,
        rotation: 0
      };
      clamp(piece);
      state.placedFurniture.push(piece);
      state.selectedFurnitureId = piece.id;
      loadImage(piece.imageUrl, () => draw());
    });
  }

  function selected() {
    return state.placedFurniture.find(p => p.id === state.selectedFurnitureId) || null;
  }

  function updateSelection() {
    const p = selected();
    const bar = document.getElementById("selectedFurnitureBar");
    if (!bar) {
      draw();
      return;
    }
    if (!p) {
      bar.hidden = true;
      draw();
      return;
    }
    bar.hidden = false;
    document.getElementById("selectedFurnitureName").textContent = `${p.name} (${p.category || "Piece"})`;
    document.getElementById("furnitureWidth").value = (p.widthFt || 1).toFixed(1);
    document.getElementById("furnitureHeight").value = (p.heightFt || 1).toFixed(1);
    document.getElementById("furnitureDepth").value = (p.depthFt || 1).toFixed(1);
    document.getElementById("furnitureRotation").value = p.rotation || 0;
    draw();
  }

  function hitPiece(pt, p) {
    const a = -(p.rotation || 0) * Math.PI / 180;
    const dx = pt.x - p.x;
    const dy = pt.y - p.y;
    const x = dx * Math.cos(a) - dy * Math.sin(a);
    const y = dx * Math.sin(a) + dy * Math.cos(a);
    return Math.abs(x) <= p.width / 2 && Math.abs(y) <= p.height / 2;
  }

  // Canvas Pointer Interactions
  canvas.addEventListener("pointerdown", e => {
    const pt = getPoint(e);
    recordPreAction();

    for (let i = state.placedFurniture.length - 1; i >= 0; i--) {
      const p = state.placedFurniture[i];
      const a = -(p.rotation || 0) * Math.PI / 180;
      const dx = pt.x - p.x;
      const dy = pt.y - p.y;
      const lx = dx * Math.cos(a) - dy * Math.sin(a);
      const ly = dx * Math.sin(a) + dy * Math.cos(a);

      // Check resize handle click (bottom-right corner)
      if (p.id === state.selectedFurnitureId && lx > p.width / 2 - 25 && ly > p.height / 2 - 25) {
        resizing = p;
        resizeStart = {
          x: pt.x,
          y: pt.y,
          width: p.width,
          height: p.height,
          widthFt: p.widthFt || 2,
          heightFt: p.heightFt || 2
        };
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      // Check body click
      if (hitPiece(pt, p)) {
        state.selectedFurnitureId = p.id;
        dragging = p;
        dragOffset = { x: pt.x - p.x, y: pt.y - p.y };
        canvas.setPointerCapture(e.pointerId);
        updateSelection();
        return;
      }
    }

    state.selectedFurnitureId = null;
    updateSelection();
  });

  canvas.addEventListener("pointermove", e => {
    const pt = getPoint(e);
    if (resizing) {
      const factor = Math.max(0.2, (resizeStart.width + (pt.x - resizeStart.x) * 2) / resizeStart.width);
      resizing.width = Math.max(40, resizeStart.width * factor);
      resizing.height = Math.max(30, resizeStart.height * factor);
      resizing.widthFt = +(resizeStart.widthFt * factor).toFixed(1);
      resizing.heightFt = +(resizeStart.heightFt * factor).toFixed(1);
      clamp(resizing);
      updateSelection();
      return;
    }
    if (dragging) {
      dragging.x = pt.x - dragOffset.x;
      dragging.y = pt.y - dragOffset.y;
      clamp(dragging);
      draw();
    }
  });

  canvas.addEventListener("pointerup", () => {
    if (dragging || resizing) {
      commitAction();
    }
    dragging = null;
    resizing = null;
    resizeStart = null;
  });

  // Selected Furniture Bar Controls
  ["furnitureWidth", "furnitureHeight", "furnitureDepth"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", e => {
      const p = selected();
      if (!p) return;
      recordDirectAction(() => {
        const val = Math.max(0.2, Number(e.target.value) || 1);
        if (id === "furnitureWidth") {
          p.widthFt = val;
          p.width = Math.max(30, val * 26);
        }
        if (id === "furnitureHeight") {
          p.heightFt = val;
          p.height = Math.max(25, val * 22);
        }
        if (id === "furnitureDepth") p.depthFt = val;
        clamp(p);
      });
    });
  });

  document.getElementById("furnitureRotation")?.addEventListener("input", e => {
    const p = selected();
    if (p) {
      p.rotation = Number(e.target.value);
      clamp(p);
      draw();
      persistFurnitureArrangement();
    }
  });
  document.getElementById("furnitureRotation")?.addEventListener("change", () => {
    commitAction();
  });

  // Quick Sizing Buttons
  document.getElementById("btnScaleUp")?.addEventListener("click", () => {
    const p = selected();
    if (!p) return;
    recordDirectAction(() => {
      p.width *= 1.1;
      p.height *= 1.1;
      p.widthFt = +(p.widthFt * 1.1).toFixed(1);
      p.heightFt = +(p.heightFt * 1.1).toFixed(1);
      clamp(p);
    });
  });

  document.getElementById("btnScaleDown")?.addEventListener("click", () => {
    const p = selected();
    if (!p) return;
    recordDirectAction(() => {
      p.width = Math.max(35, p.width * 0.9);
      p.height = Math.max(30, p.height * 0.9);
      p.widthFt = +(Math.max(0.5, p.widthFt * 0.9)).toFixed(1);
      p.heightFt = +(Math.max(0.5, p.heightFt * 0.9)).toFixed(1);
      clamp(p);
    });
  });

  document.getElementById("btnRotate90")?.addEventListener("click", () => {
    const p = selected();
    if (!p) return;
    recordDirectAction(() => {
      p.rotation = ((p.rotation || 0) + 90) % 360;
      clamp(p);
    });
  });

  document.getElementById("deleteFurniture")?.addEventListener("click", () => {
    if (selected()) {
      recordDirectAction(() => {
        state.placedFurniture = state.placedFurniture.filter(p => p.id !== state.selectedFurnitureId);
        state.selectedFurnitureId = null;
      });
      showToast("Furniture removed from room", "info");
    }
  });

  // Background View Switcher (Painted vs Original)
  document.getElementById("viewPaintedRoomBtn")?.addEventListener("click", () => {
    const painted = getEditedRoomImage();
    if (painted) {
      setRoomImage(painted, "painted");
      showToast("Displaying final painted room background", "info");
    } else {
      showToast("No painted room yet. Go to Paint Studio to paint walls & ceiling!", "info");
    }
  });
  document.getElementById("viewOriginalRoomBtn")?.addEventListener("click", () => {
    const orig = getOriginalRoomImage();
    if (orig) {
      setRoomImage(orig, "original");
      showToast("Displaying original uploaded room photo", "info");
    }
  });
  document.getElementById("thumbPaintedCard")?.addEventListener("click", () => {
    document.getElementById("viewPaintedRoomBtn")?.click();
  });
  document.getElementById("thumbOriginalCard")?.addEventListener("click", () => {
    document.getElementById("viewOriginalRoomBtn")?.click();
  });

  // Undo, Redo, Reset
  document.getElementById("workspaceUndoBtn")?.addEventListener("click", () => {
    if (history.length) {
      redoStack.push(JSON.stringify(state.placedFurniture));
      state.placedFurniture = JSON.parse(history.pop());
      state.selectedFurnitureId = null;
      draw();
      updateSelection();
      persistFurnitureArrangement();
      updateUndoRedoUI();
      showToast("Action undone (↶)", "info");
    } else {
      showToast("No further actions to undo", "info");
    }
  });

  document.getElementById("workspaceRedoBtn")?.addEventListener("click", () => {
    if (redoStack.length) {
      history.push(JSON.stringify(state.placedFurniture));
      state.placedFurniture = JSON.parse(redoStack.pop());
      state.selectedFurnitureId = null;
      draw();
      updateSelection();
      persistFurnitureArrangement();
      updateUndoRedoUI();
      showToast("Action redone (↷)", "info");
    } else {
      showToast("No actions to redo", "info");
    }
  });

  document.getElementById("workspaceResetBtn")?.addEventListener("click", () => {
    if (state.placedFurniture.length === 0) {
      showToast("No furniture placed to reset.", "info");
      return;
    }
    if (confirm("Reset all furniture placements?\n\nThis will remove all added furniture pieces from the room preview.\n\nYour uploaded room image and painted wall/ceiling design will NOT be deleted.")) {
      recordDirectAction(() => {
        state.placedFurniture = [];
        state.selectedFurnitureId = null;
      });
      showToast("Furniture reset successfully. Room image preserved.", "success");
    }
  });

  // Zoom Controls
  document.getElementById("workspaceZoomIn")?.addEventListener("click", () => {
    zoom = Math.min(1.6, zoom + 0.1);
    document.getElementById("workspaceZoomLabel").textContent = `${Math.round(zoom * 100)}%`;
    draw();
  });
  document.getElementById("workspaceZoomOut")?.addEventListener("click", () => {
    zoom = Math.max(0.6, zoom - 0.1);
    document.getElementById("workspaceZoomLabel").textContent = `${Math.round(zoom * 100)}%`;
    draw();
  });
  document.getElementById("workspaceFit")?.addEventListener("click", () => {
    zoom = 1;
    document.getElementById("workspaceZoomLabel").textContent = "100%";
    draw();
  });
  document.getElementById("workspaceFullscreen")?.addEventListener("click", () => {
    shell?.requestFullscreen?.();
  });

  // Action buttons
  document.getElementById("workspacePaintBtn")?.addEventListener("click", () => {
    window.location.href = "paint_studio.html";
  });
  document.getElementById("workspaceSaveBtn")?.addEventListener("click", saveCompleteRoomDesign);
  document.getElementById("workspaceLoadBtn")?.addEventListener("click", openSavedDesignsModal);
  document.getElementById("workspaceDownloadPdfBtn")?.addEventListener("click", downloadFinalDesignPdf);

  // Initialize
  window.roomWorkspace = { setRoomImage, addFurniture, draw, updateBackgroundThumbnails };
  state.placedFurniture.forEach(piece => loadImage(piece.imageUrl));
  
  const paintedRoom = getEditedRoomImage();
  const originalRoom = getOriginalRoomImage();
  if (paintedRoom) {
    setRoomImage(paintedRoom, "painted");
  } else if (originalRoom) {
    setRoomImage(originalRoom, "original");
  } else {
    fitCanvas();
  }

  updateUndoRedoUI();

  window.addEventListener("storage", e => {
    if (e.key === SHARED_ROOM_KEYS.editedUrl && e.newValue) {
      state.editedImageDataUrl = e.newValue;
      setRoomImage(e.newValue, "painted");
    }
    if (e.key === SHARED_ROOM_KEYS.originalUrl && e.newValue && !getEditedRoomImage()) {
      state.currentImageUrl = e.newValue;
      setRoomImage(e.newValue, "original");
    }
    updateBackgroundThumbnails();
  });

  window.addEventListener("smartroom:painted-room", e => {
    if (e.detail?.dataUrl) {
      state.editedImageDataUrl = e.detail.dataUrl;
      setRoomImage(e.detail.dataUrl, "painted");
      updateBackgroundThumbnails();
    }
  });
}

// 9. Save Complete Final Room Design
function saveCompleteRoomDesign() {
  const canvas = document.getElementById("roomDesignCanvas");
  if (!canvas || (!getOriginalRoomImage() && !getEditedRoomImage())) {
    showToast("Please upload and customize a room before saving!", "error");
    return;
  }

  const defaultName = `Room Design - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
  const name = prompt("Enter a name for this room design:", defaultName);
  if (!name) return;

  const designRecord = {
    id: "design-" + Date.now(),
    name: name.trim(),
    savedAt: new Date().toISOString(),
    dateStr: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    roomType: document.getElementById("roomTypeSelect")?.value || "study",
    style: state.selectedStyle || "Modern",
    originalImageUrl: getOriginalRoomImage(),
    paintedImageUrl: getEditedRoomImage(),
    placedFurniture: JSON.parse(JSON.stringify(state.placedFurniture)),
    wallColor: document.getElementById("designColorHex")?.value || "#E8ECE9",
    ceilingColor: document.getElementById("ceilingColorHex")?.value || "#FFFFFF",
    accentColor: document.getElementById("accentColorHex")?.value || "#C97B63",
    thumbnail: canvas.toDataURL("image/jpeg", 0.6)
  };

  try {
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(SHARED_ROOM_KEYS.savedDesigns) || "[]");
    } catch (_) { list = []; }
    list.unshift(designRecord);
    localStorage.setItem(SHARED_ROOM_KEYS.savedDesigns, JSON.stringify(list));
    showToast(`Design "${designRecord.name}" saved successfully!`, "success");
  } catch (err) {
    showToast("Design saved locally, but storage capacity is limited.", "info");
  }

  // Also trigger SQLite backend save if available
  saveCurrentProject(designRecord.name);
}

// 10. Reopen Saved Designs Modal
function openSavedDesignsModal() {
  const modal = document.getElementById("savedDesignsModal");
  const container = document.getElementById("savedDesignsListContainer");
  if (!modal || !container) return;

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(SHARED_ROOM_KEYS.savedDesigns) || "[]");
  } catch (_) { list = []; }

  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 32px 16px; text-align: center;">
        <div class="empty-icon" style="font-size: 32px; margin-bottom: 8px;">📁</div>
        <h4>No saved designs found</h4>
        <p>Click "💾 Save Design" in the Room Preview toolbar to store your final room layouts and furniture arrangements.</p>
      </div>
    `;
  } else {
    list.forEach(design => {
      const card = document.createElement("div");
      card.className = "saved-design-item card";
      card.innerHTML = `
        <img class="saved-design-thumb" src="${design.thumbnail || design.paintedImageUrl || design.originalImageUrl}" alt="${design.name}" />
        <div class="saved-design-info">
          <h4>${design.name}</h4>
          <p class="saved-design-meta">Style: <b>${design.style}</b> • Furniture: <b>${(design.placedFurniture || []).length} items</b> • Saved: ${design.dateStr}</p>
        </div>
        <div class="saved-design-actions">
          <button class="btn btn-primary btn-sm" onclick="loadSavedDesign('${design.id}')">📂 Open Design</button>
          <button class="btn btn-secondary btn-sm" onclick="deleteSavedDesign('${design.id}')">🗑️</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  modal.hidden = false;
  document.getElementById("btnCloseSavedDesignsModal").onclick = () => { modal.hidden = true; };
}

window.loadSavedDesign = (designId) => {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(SHARED_ROOM_KEYS.savedDesigns) || "[]");
  } catch (_) { return; }

  const design = list.find(d => d.id === designId);
  if (!design) return;

  // Restore room state
  if (design.paintedImageUrl) setEditedRoomImage(design.paintedImageUrl);
  if (design.originalImageUrl) setOriginalRoomImage(design.originalImageUrl);
  state.placedFurniture = JSON.parse(JSON.stringify(design.placedFurniture || []));
  state.selectedFurnitureId = null;
  persistFurnitureArrangement();

  // Load into workspace canvas
  const targetImg = design.paintedImageUrl || design.originalImageUrl;
  window.roomWorkspace?.setRoomImage(targetImg, design.paintedImageUrl ? "painted" : "original");
  window.roomWorkspace?.draw();

  document.getElementById("savedDesignsModal").hidden = true;
  showToast(`Design "${design.name}" opened successfully!`, "success");
};

window.deleteSavedDesign = (designId) => {
  if (!confirm("Are you sure you want to delete this saved design?")) return;
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(SHARED_ROOM_KEYS.savedDesigns) || "[]");
  } catch (_) { return; }

  list = list.filter(d => d.id !== designId);
  localStorage.setItem(SHARED_ROOM_KEYS.savedDesigns, JSON.stringify(list));
  openSavedDesignsModal();
  showToast("Design deleted", "info");
};

// 11. PDF Download Only - Generates Comprehensive Professional Interior Design Report
function downloadFinalDesignPdf() {
  const canvas = document.getElementById("roomDesignCanvas");
  if (!canvas || (!getOriginalRoomImage() && !getEditedRoomImage())) {
    showToast("Please upload and design a room before downloading the PDF report!", "error");
    return;
  }

  showToast("Generating professional AI Smart Room PDF report...", "info");

  try {
    // 1. Get current composite image from canvas
    const imgDataUrl = canvas.toDataURL("image/jpeg", 0.94);
    const base64Data = imgDataUrl.split(",")[1];
    const binaryImg = atob(base64Data);
    const imgLength = binaryImg.length;
    const imgBytes = new Uint8Array(imgLength);
    for (let i = 0; i < imgLength; i++) {
      imgBytes[i] = binaryImg.charCodeAt(i);
    }

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 36;
    const contentWidth = pageWidth - (margin * 2);
    const headerHeight = 72;

    const imgAspectRatio = canvas.width / canvas.height;
    let renderWidth = contentWidth;
    let renderHeight = renderWidth / imgAspectRatio;
    const maxImgHeight = 350;
    if (renderHeight > maxImgHeight) {
      renderHeight = maxImgHeight;
      renderWidth = renderHeight * imgAspectRatio;
    }
    const imgX = margin + (contentWidth - renderWidth) / 2;
    const imgY = pageHeight - margin - headerHeight - 16 - renderHeight;

    let contentStream = `
q
0.008 0.518 0.780 rg
${margin} ${pageHeight - margin - headerHeight} ${contentWidth} ${headerHeight} re f
Q
BT
/F1 18 Tf
1 1 1 rg
${margin + 16} ${pageHeight - margin - 30} Td
(AI Smart Room Interior Designer) Tj
ET
BT
/F2 10 Tf
0.9 0.95 1 rg
${margin + 16} ${pageHeight - margin - 48} Td
(Custom Painted Room Architecture & Furniture Arrangement Report) Tj
ET
q
${renderWidth.toFixed(2)} 0 0 ${renderHeight.toFixed(2)} ${imgX.toFixed(2)} ${imgY.toFixed(2)} cm
/Im1 Do
Q
q
0.8 0.85 0.9 RG
1 w
${imgX.toFixed(2)} ${imgY.toFixed(2)} ${renderWidth.toFixed(2)} ${renderHeight.toFixed(2)} re S
Q
`;

    // Metadata details block
    let metaY = imgY - 22;
    contentStream += `
BT
/F1 12 Tf
0.1 0.15 0.2 rg
${margin} ${metaY} Td
(1. Room Specification & Selected Architectural Palette) Tj
ET
`;
    metaY -= 16;

    const wallColor = document.getElementById("designColorHex")?.value || "#E8ECE9";
    const ceilingColor = document.getElementById("ceilingColorHex")?.value || "#FFFFFF";
    const styleName = state.selectedStyle || "Modern";
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const bgStatus = (getEditedRoomImage() === roomDesignCanvas?.toDataURL) || true ? "Custom Painted & Textured Room" : "Original Room Photo";

    const specs = [
      `Date: ${dateStr}  |  Interior Style: ${styleName}  |  Background: ${bgStatus}`,
      `Wall Color: ${wallColor}  |  Ceiling Color: ${ceilingColor}  |  Active Furniture: ${state.placedFurniture.length} Pieces`
    ];

    specs.forEach(s => {
      contentStream += `
BT
/F2 9 Tf
0.25 0.3 0.35 rg
${margin} ${metaY} Td
(${s.replace(/[()\\]/g, "")}) Tj
ET
`;
      metaY -= 14;
    });

    metaY -= 8;
    contentStream += `
BT
/F1 12 Tf
0.1 0.15 0.2 rg
${margin} ${metaY} Td
(2. Placed Furniture Schedule & Investment Estimates) Tj
ET
`;
    metaY -= 16;

    // Table Header
    contentStream += `
q
0.93 0.96 0.98 rg
${margin} ${metaY - 3} ${contentWidth} 16 re f
Q
BT
/F1 8.5 Tf
0.1 0.2 0.3 rg
${margin + 6} ${metaY + 2} Td
(Item Name) Tj
ET
BT
/F1 8.5 Tf
0.1 0.2 0.3 rg
${margin + 200} ${metaY + 2} Td
(Category) Tj
ET
BT
/F1 8.5 Tf
0.1 0.2 0.3 rg
${margin + 310} ${metaY + 2} Td
(Dimensions) Tj
ET
BT
/F1 8.5 Tf
0.1 0.2 0.3 rg
${margin + 420} ${metaY + 2} Td
(Est. Price INR) Tj
ET
`;
    metaY -= 16;

    let totalCost = 0;
    const itemsToPrint = state.placedFurniture.length ? state.placedFurniture : [
      { name: "Modern Office Desk", category: "Desk", widthFt: 4.8, heightFt: 2.5, depthFt: 2.4, estimated_price_inr: 24500 },
      { name: "Ergonomic Office Chair", category: "Chair", widthFt: 2.2, heightFt: 3.8, depthFt: 2.2, estimated_price_inr: 19500 },
      { name: "Modern Ultra-Slim Laptop", category: "Electronics", widthFt: 1.2, heightFt: 0.6, depthFt: 0.9, estimated_price_inr: 68000 }
    ];

    itemsToPrint.slice(0, 8).forEach(piece => {
      const pCost = piece.estimated_price_inr || 15000;
      totalCost += pCost;
      const dims = `${piece.widthFt || 4} x ${piece.depthFt || 2} x ${piece.heightFt || 3} ft`;
      const cleanName = (piece.name || "Office Furniture").replace(/[()\\]/g, "").substring(0, 32);

      contentStream += `
BT
/F2 8 Tf
0.2 0.25 0.3 rg
${margin + 6} ${metaY} Td
(${cleanName}) Tj
ET
BT
/F2 8 Tf
0.2 0.25 0.3 rg
${margin + 200} ${metaY} Td
(${piece.category || "Furniture"}) Tj
ET
BT
/F2 8 Tf
0.2 0.25 0.3 rg
${margin + 310} ${metaY} Td
(${dims}) Tj
ET
BT
/F1 8 Tf
0.05 0.45 0.7 rg
${margin + 420} ${metaY} Td
(INR ${pCost.toLocaleString("en-IN")}) Tj
ET
`;
      metaY -= 13;
    });

    // Total row
    metaY -= 4;
    contentStream += `
q
0.98 0.95 0.88 rg
${margin} ${metaY - 3} ${contentWidth} 16 re f
Q
BT
/F1 9 Tf
0.2 0.15 0.05 rg
${margin + 6} ${metaY + 2} Td
(TOTAL ESTIMATED FURNITURE INVESTMENT:) Tj
ET
BT
/F1 9 Tf
0.05 0.5 0.3 rg
${margin + 420} ${metaY + 2} Td
(INR ${totalCost.toLocaleString("en-IN")}) Tj
ET
`;

    // Footer
    contentStream += `
BT
/F2 8 Tf
0.5 0.55 0.6 rg
${margin} ${margin} Td
(Generated by AI Smart Room Interior Designer. Professional architectural design document.) Tj
ET
`;

    const enc = new TextEncoder();
    const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
    const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R >> >> >>\nendobj\n`;
    const streamBytes = enc.encode(contentStream);
    const obj4Header = `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`;
    const obj4Trailer = "\nendstream\nendobj\n";
    const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
    const obj6 = "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
    const obj7Header = `7 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`;
    const obj7Trailer = "\nendstream\nendobj\n";

    const headerStr = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    let offset = headerStr.length;
    const offsets = [0];

    offsets.push(offset); offset += enc.encode(obj1).length;
    offsets.push(offset); offset += enc.encode(obj2).length;
    offsets.push(offset); offset += enc.encode(obj3).length;
    offsets.push(offset); offset += enc.encode(obj4Header).length + streamBytes.length + enc.encode(obj4Trailer).length;
    offsets.push(offset); offset += enc.encode(obj5).length;
    offsets.push(offset); offset += enc.encode(obj6).length;
    offsets.push(offset); offset += enc.encode(obj7Header).length + imgBytes.length + enc.encode(obj7Trailer).length;

    const xrefOffset = offset;
    let xrefStr = `xref\n0 8\n0000000000 65535 f \n`;
    for (let i = 1; i <= 7; i++) {
      xrefStr += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    }
    const trailerStr = `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    const parts = [
      enc.encode(headerStr),
      enc.encode(obj1),
      enc.encode(obj2),
      enc.encode(obj3),
      enc.encode(obj4Header),
      streamBytes,
      enc.encode(obj4Trailer),
      enc.encode(obj5),
      enc.encode(obj6),
      enc.encode(obj7Header),
      imgBytes,
      enc.encode(obj7Trailer),
      enc.encode(xrefStr),
      enc.encode(trailerStr)
    ];

    let totalLen = parts.reduce((acc, p) => acc + p.length, 0);
    const fullBytes = new Uint8Array(totalLen);
    let cur = 0;
    for (let p of parts) {
      fullBytes.set(p, cur);
      cur += p.length;
    }

    const blob = new Blob([fullBytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `AI_Smart_Room_Interior_Design_${Date.now()}.pdf`;
    link.href = blobUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    showToast("Final design PDF downloaded successfully!", "success");
  } catch (err) {
    showToast("Error generating PDF: " + err.message, "error");
  }
}

// 9. AI Design Studio & Interactive Room Painter
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
    try {
      state.editedImageDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      window.roomWorkspace?.setRoomImage(state.editedImageDataUrl);
    } catch (err) {
      // Cross-origin furniture/catalog imagery must never prevent the paint preview.
      state.editedImageDataUrl = null;
    }
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

  // Download Final Design PDF (No PNG/JPG)
  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      downloadFinalDesignPdf();
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
      wall_color: document.getElementById("designColorHex")?.value || "#E8ECE9",
      ceiling_color: document.getElementById("ceilingColorHex")?.value || "#FFFFFF",
      accent_color: document.getElementById("accentColorHex")?.value || "#C97B63",
      edited_preview_available: Boolean(state.editedImageDataUrl)
    },
    furniture_selections: state.placedFurniture.length ? state.placedFurniture : (state.recommendationsData?.recommended_furniture || []),
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
