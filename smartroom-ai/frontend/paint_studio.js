// paint_studio.js - Full Interactive Wall & Ceiling Painter Engine
const API_BASE = "http://127.0.0.1:8000/api";
const SHARED_ROOM_KEYS = { originalUrl: "smartroom.originalRoomImage", editedUrl: "smartroom.paintedRoomImage" };
function setOriginalRoomImage(value) { if (value) localStorage.setItem(SHARED_ROOM_KEYS.originalUrl, value); else localStorage.removeItem(SHARED_ROOM_KEYS.originalUrl); return value || null; }
function getOriginalRoomImage() { return localStorage.getItem(SHARED_ROOM_KEYS.originalUrl) || null; }
function setEditedRoomImage(value) { if (value) localStorage.setItem(SHARED_ROOM_KEYS.editedUrl, value); else localStorage.removeItem(SHARED_ROOM_KEYS.editedUrl); window.dispatchEvent(new CustomEvent("smartroom:painted-room", { detail: { dataUrl: value || null } })); return value || null; }
function getEditedRoomImage() { return localStorage.getItem(SHARED_ROOM_KEYS.editedUrl) || null; }

// 36 Curated Designer Swatches for Walls, Accents, and Ceilings
const DESIGNER_PALETTES = [
  // Neutrals & Modern Tones
  { name: "Alabaster White", hex: "#F4F1EA", cat: "neutral" },
  { name: "Soft Sage White", hex: "#E8ECE9", cat: "neutral" },
  { name: "Chalk Greige", hex: "#D8D2C9", cat: "neutral" },
  { name: "Warm Cashmere", hex: "#E3DAC9", cat: "neutral" },
  { name: "Urban Fog", hex: "#CBCDC8", cat: "neutral" },
  { name: "Mineral Taupe", hex: "#B8ADA2", cat: "neutral" },

  // Earth, Clay & Terracotta
  { name: "Terracotta Sunset", hex: "#C97B63", cat: "earth" },
  { name: "Tuscan Ochre", hex: "#E0A96D", cat: "earth" },
  { name: "Burnt Sienna", hex: "#A85D44", cat: "earth" },
  { name: "Clay Pottery", hex: "#B37055", cat: "earth" },
  { name: "Desert Sand", hex: "#D9C9B4", cat: "earth" },
  { name: "Warm Honey Teak", hex: "#C68B59", cat: "earth" },

  // Nordic, Sage & Forest
  { name: "Scandinavian Mist", hex: "#D4DDD6", cat: "nordic" },
  { name: "Eucalyptus Pale", hex: "#B7C4B7", cat: "nordic" },
  { name: "Moody Spruce", hex: "#354F52", cat: "nordic" },
  { name: "Nordic Pine", hex: "#283D3B", cat: "nordic" },
  { name: "Slate Forest", hex: "#4A5859", cat: "nordic" },
  { name: "Olive Shadow", hex: "#556B2F", cat: "nordic" },

  // Luxury, Moody & Deep Accents
  { name: "Deep Nordic Blue", hex: "#2F3E46", cat: "luxury" },
  { name: "Midnight Navy", hex: "#1C2541", cat: "luxury" },
  { name: "Royal Charcoal", hex: "#2B2D42", cat: "luxury" },
  { name: "Smoky Plum", hex: "#4A3B4E", cat: "luxury" },
  { name: "Espresso Bronze", hex: "#3A2E2B", cat: "luxury" },
  { name: "Anthracite Matte", hex: "#1F2421", cat: "luxury" },

  // Dedicated Ceiling Whites & Light Reflectors
  { name: "Pure Ceiling White", hex: "#FFFFFF", cat: "ceiling" },
  { name: "Warm Chiffon Ceiling", hex: "#FFFDF9", cat: "ceiling" },
  { name: "Cool Frost Ceiling", hex: "#F0F4F8", cat: "ceiling" },
  { name: "Pale Pearl Ceiling", hex: "#EAE6E1", cat: "ceiling" },
  { name: "Soft Sky Tint", hex: "#E1EAF2", cat: "ceiling" },
  { name: "Ivory Diffuser", hex: "#FDFBF7", cat: "ceiling" },

  // Modern Accent Pops
  { name: "Mustard Gold", hex: "#DAA520", cat: "earth" },
  { name: "Blush Mauve", hex: "#CBB3BF", cat: "neutral" },
  { name: "Teal Lagoon", hex: "#1D6A73", cat: "luxury" },
  { name: "Vintage Rose", hex: "#B97375", cat: "earth" },
  { name: "Storm Blue", hex: "#466365", cat: "nordic" },
  { name: "Parchment Tan", hex: "#E6D7C3", cat: "neutral" }
];

// Application State
const state = {
  currentTool: "brush", // brush, polygon, select, bucket, tint, eraser
  targetSurface: "wall", // wall, accent, ceiling, trim
  currentColor: "#E8ECE9",
  brushSize: 35,
  opacity: 0.40,
  blendMode: "source-over",
  baseImage: null,
  polygonPoints: [],
  history: [],
  historyStep: -1,
  maxHistory: 20
  , selection: null,
  selecting: false,
  selectionStart: null,
  selectionMode: "draw",
  showOriginal: false
};

// DOM Elements
const paintCanvas = document.getElementById("paintCanvas");
const overlayCanvas = document.getElementById("overlayCanvas");
const pCtx = paintCanvas ? paintCanvas.getContext("2d") : null;
const oCtx = overlayCanvas ? overlayCanvas.getContext("2d") : null;

let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Initialize when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  setupSurfaceSegments();
  setupTools();
  setupPalettes();
  setupSliders();
  setupUploadAndDropzone();
  setupCanvasEvents();
  setupHeaderActions();
  setupShortcuts();
  setupSelectionTools();
  // Continue from the latest painted version when one exists, while keeping
  // the original room image separately available for reset/before-after.
  const sharedImage = getEditedRoomImage() || getOriginalRoomImage();
  if (sharedImage) loadImageFromUrl(sharedImage);
});

// Toast Helper
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// 1. Target Surface Segmented Control
function setupSurfaceSegments() {
  const buttons = document.querySelectorAll("#targetSurfaceGroup .segment-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.targetSurface = btn.getAttribute("data-target");

      // Update right sidebar summary
      const names = {
        wall: "Walls (General)",
        accent: "Accent Focal Wall",
        ceiling: "Ceiling & Cove",
        trim: "Trim & Moulding"
      };
      document.getElementById("sumActiveSurface").textContent = names[state.targetSurface] || "Walls";

      // Helpful presets when selecting ceiling
      if (state.targetSurface === "ceiling") {
        filterPaletteCategory("ceiling");
        selectColor("#FFFDF9");
      }
    });
  });
}

// 2. Tools Selection
function setupTools() {
  const toolBtns = document.querySelectorAll(".tool-btn");
  const polygonTip = document.getElementById("polygonTip");
  const btnFinish = document.getElementById("btnFinishPolygon");
  const btnCancel = document.getElementById("btnCancelPolygon");
  const brushSizeRow = document.getElementById("brushSizeRow");

  toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      toolBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.currentTool = btn.getAttribute("data-tool");

      // Reset any active polygon points
      cancelPolygon();

      // Show / hide polygon toolbar controls
      const isPolygon = state.currentTool === "polygon";
      polygonTip.style.display = isPolygon ? "inline" : "none";
      btnFinish.style.display = isPolygon ? "inline-flex" : "none";
      btnCancel.style.display = isPolygon ? "inline-flex" : "none";

      // Hide brush size for global tint tool
      brushSizeRow.style.display = state.currentTool === "tint" ? "none" : "flex";

      const toolNames = {
        brush: "Freehand Brush",
        polygon: "Polygon Wall Zone",
        select: "Square / Rectangle Selection",
        bucket: "Paint Bucket",
        tint: "Global Room Tint",
        eraser: "Paint Eraser"
      };
      document.getElementById("sumToolName").textContent = toolNames[state.currentTool] || state.currentTool;

      if (state.currentTool === "tint" && state.baseImage) {
        applyGlobalTint();
      }
    });
  });

  btnFinish.addEventListener("click", finishPolygonFill);
  btnCancel.addEventListener("click", cancelPolygon);
}

// 3. Palettes & Color Picker
function setupPalettes() {
  const swatchesContainer = document.getElementById("swatchesGrid");
  const tabs = document.querySelectorAll("#paletteTabs .pal-tab");
  const nativePicker = document.getElementById("nativeColorPicker");
  const hexInput = document.getElementById("hexColorInput");

  // Tab Filtering
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const cat = tab.getAttribute("data-cat");
      renderSwatches(cat);
    });
  });

  function renderSwatches(filterCat = "all") {
    swatchesContainer.innerHTML = "";
    const filtered = filterCat === "all" ? DESIGNER_PALETTES : DESIGNER_PALETTES.filter(p => p.cat === filterCat);

    filtered.forEach(item => {
      const btn = document.createElement("button");
      btn.className = `swatch-btn ${item.hex.toLowerCase() === state.currentColor.toLowerCase() ? "active" : ""}`;
      btn.style.backgroundColor = item.hex;
      btn.title = `${item.name} (${item.hex})`;
      btn.addEventListener("click", () => {
        selectColor(item.hex);
      });
      swatchesContainer.appendChild(btn);
    });
  }

  // Native & Hex pickers
  nativePicker.addEventListener("input", (e) => {
    selectColor(e.target.value);
  });

  hexInput.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      selectColor(val);
    }
  });

  renderSwatches("all");
}

function filterPaletteCategory(cat) {
  const tabs = document.querySelectorAll("#paletteTabs .pal-tab");
  tabs.forEach(tab => {
    if (tab.getAttribute("data-cat") === cat) {
      tab.click();
    }
  });
}

function selectColor(hex) {
  state.currentColor = hex;
  document.getElementById("nativeColorPicker").value = hex;
  document.getElementById("hexColorInput").value = hex;
  document.getElementById("currentColorDisplay").textContent = hex;
  document.getElementById("sumColorDot").style.backgroundColor = hex;
  document.getElementById("sumColorHex").textContent = hex;

  // Update active state in swatch grid
  document.querySelectorAll(".swatch-btn").forEach(btn => {
    const bg = btn.style.backgroundColor;
    // Simple hex match
    btn.classList.toggle("active", btn.title.toLowerCase().includes(hex.toLowerCase()));
  });

  // If in Global Tint mode, apply immediately
  if (state.currentTool === "tint" && state.baseImage) {
    applyGlobalTint();
  }
}

// 4. Sliders and Blend Modes
function setupSliders() {
  const brushSlider = document.getElementById("brushSizeSlider");
  const opacitySlider = document.getElementById("paintOpacitySlider");
  const blendSelect = document.getElementById("blendModeSelect");

  brushSlider.addEventListener("input", () => {
    state.brushSize = parseInt(brushSlider.value, 10);
    document.getElementById("brushSizeLabel").textContent = `${state.brushSize}px`;
  });

  opacitySlider.addEventListener("input", () => {
    state.opacity = parseInt(opacitySlider.value, 10) / 100;
    document.getElementById("paintOpacityLabel").textContent = `${opacitySlider.value}%`;
    document.getElementById("sumOpacity").textContent = `${opacitySlider.value}%`;

    if (state.currentTool === "tint" && state.baseImage) {
      applyGlobalTint();
    }
  });

  blendSelect.addEventListener("change", () => {
    state.blendMode = blendSelect.value;
  });
}

// 5. Upload & Dropzone Handling
function setupUploadAndDropzone() {
  // The dashboard is the single source of uploads. This studio only consumes the shared image.
  return;
  /*
  const dropzone = document.getElementById("emptyDropzone");
  const fileInput = document.getElementById("roomImageInput");
  const btnUpload = document.getElementById("btnUploadImage");
  const sampleBtns = document.querySelectorAll(".sample-btn");

  btnUpload.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("click", (e) => {
    if (e.target.classList.contains("sample-btn")) return;
    fileInput.click();
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.borderColor = "var(--primary)";
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.style.borderColor = "rgba(255, 255, 255, 0.15)";
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      handleFile(fileInput.files[0]);
    }
  });

  sampleBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = btn.getAttribute("data-url");
      loadImageFromUrl(url);
    });
  });

  function handleFile(file) {
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image (JPEG, PNG, or WebP)!", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      loadImageFromUrl(e.target.result);
      showToast("Room photo loaded into painter studio!", "success");
    };
    reader.readAsDataURL(file);
  }
  */
}

function loadImageFromUrl(url) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    state.baseImage = img;
    initCanvasDimensions(img.naturalWidth, img.naturalHeight);
    redrawBaseImage();
    saveHistoryState();

    document.getElementById("emptyDropzone").style.display = "none";
    document.getElementById("canvasStage").style.display = "flex";
  };
  img.onerror = () => {
    showToast("Failed to load sample image. Please upload a local room photo.", "error");
  };
  img.src = url;
}

function initCanvasDimensions(w, h) {
  // Constrain max canvas dimensions for fast responsive painting
  const maxW = 1600;
  const maxH = 1200;
  let scale = 1;
  if (w > maxW || h > maxH) {
    scale = Math.min(maxW / w, maxH / h);
  }

  const canvasW = Math.round(w * scale);
  const canvasH = Math.round(h * scale);

  paintCanvas.width = canvasW;
  paintCanvas.height = canvasH;
  overlayCanvas.width = canvasW;
  overlayCanvas.height = canvasH;
}

function redrawBaseImage() {
  if (!pCtx || !state.baseImage) return;
  pCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
  pCtx.drawImage(state.baseImage, 0, 0, paintCanvas.width, paintCanvas.height);
}

// 6. Interactive Painting Events
function setupCanvasEvents() {
  paintCanvas.addEventListener("mousedown", onPointerDown);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);

  // Touch Support
  paintCanvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const pos = getCanvasCoordinates(touch.clientX, touch.clientY);
      startBrushStroke(pos.x, pos.y);
    }
  });

  paintCanvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDrawing) {
      const touch = e.touches[0];
      const pos = getCanvasCoordinates(touch.clientX, touch.clientY);
      continueBrushStroke(pos.x, pos.y);
    }
  });

  paintCanvas.addEventListener("touchend", () => {
    endBrushStroke();
  });
}

function getCanvasCoordinates(clientX, clientY) {
  const rect = paintCanvas.getBoundingClientRect();
  const scaleX = paintCanvas.width / rect.width;
  const scaleY = paintCanvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function onPointerDown(e) {
  if (!state.baseImage) return;
  const pos = getCanvasCoordinates(e.clientX, e.clientY);

  if (state.currentTool === "select") {
    state.selecting = true;
    if (state.selection && Math.abs(pos.x - (state.selection.x + state.selection.w)) < 18 && Math.abs(pos.y - (state.selection.y + state.selection.h)) < 18) {
      state.selectionMode = "resize";
      state.selectionStart = pos;
    } else if (state.selection && pos.x >= state.selection.x && pos.x <= state.selection.x + state.selection.w && pos.y >= state.selection.y && pos.y <= state.selection.y + state.selection.h) {
      state.selectionMode = "move";
      state.selectionStart = { x: pos.x - state.selection.x, y: pos.y - state.selection.y };
    } else {
      state.selectionMode = "draw";
      state.selectionStart = pos;
      state.selection = { x: pos.x, y: pos.y, w: 0, h: 0 };
    }
    redrawOverlay();
  } else if (state.currentTool === "bucket") {
    applySelectedPaint();
  } else if (state.currentTool === "brush" || state.currentTool === "eraser") {
    startBrushStroke(pos.x, pos.y);
  } else if (state.currentTool === "polygon") {
    addPolygonPoint(pos.x, pos.y);
  }
}

function onPointerMove(e) {
  if (state.selecting) {
    const pos = getCanvasCoordinates(e.clientX, e.clientY);
    updateSelection(pos.x, pos.y);
    return;
  }
  if (!isDrawing) return;
  const pos = getCanvasCoordinates(e.clientX, e.clientY);
  continueBrushStroke(pos.x, pos.y);
}

function onPointerUp() {
  if (state.selecting) { state.selecting = false; return; }
  if (isDrawing) {
    endBrushStroke();
  }
}

// --- Brush Engine ---
function startBrushStroke(x, y) {
  isDrawing = true;
  lastX = x;
  lastY = y;

  pCtx.save();
  if (state.selection) {
    pCtx.beginPath();
    pCtx.rect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
    pCtx.clip();
  }
  pCtx.lineCap = "round";
  pCtx.lineJoin = "round";
  pCtx.lineWidth = state.brushSize;

  if (state.currentTool === "eraser") {
    // Eraser restores original base image pixels
    pCtx.globalCompositeOperation = "destination-out";
  } else {
    pCtx.globalCompositeOperation = state.blendMode;
    pCtx.strokeStyle = hexToRgba(state.currentColor, state.opacity);
  }

  pCtx.beginPath();
  pCtx.moveTo(x, y);
}

function continueBrushStroke(x, y) {
  if (!isDrawing) return;

  pCtx.lineTo(x, y);
  pCtx.stroke();
  pCtx.beginPath();
  pCtx.moveTo(x, y);

  lastX = x;
  lastY = y;
}

function endBrushStroke() {
  if (!isDrawing) return;
  isDrawing = false;
  pCtx.closePath();
  pCtx.restore();

  saveHistoryState();
  publishPaintedImage();
}

// --- Polygon Wall Zone Engine ---
function addPolygonPoint(x, y) {
  state.polygonPoints.push({ x, y });
  redrawOverlay();

  // If clicked close to the first point (and at least 3 points), auto-finish
  if (state.polygonPoints.length >= 3) {
    const first = state.polygonPoints[0];
    const dist = Math.hypot(first.x - x, first.y - y);
    if (dist < 20) {
      finishPolygonFill();
    }
  }
}

function redrawOverlay() {
  if (!oCtx) return;
  oCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (state.selection && state.selection.w > 2 && state.selection.h > 2) {
    oCtx.save();
    oCtx.fillStyle = "rgba(76,168,216,.16)";
    oCtx.strokeStyle = "#2489bc";
    oCtx.lineWidth = 2;
    oCtx.setLineDash([7, 5]);
    oCtx.fillRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
    oCtx.strokeRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
    oCtx.setLineDash([]);
    oCtx.fillStyle = "#ffffff";
    oCtx.fillRect(state.selection.x + state.selection.w - 7, state.selection.y + state.selection.h - 7, 14, 14);
    oCtx.strokeStyle = "#2489bc";
    oCtx.strokeRect(state.selection.x + state.selection.w - 7, state.selection.y + state.selection.h - 7, 14, 14);
    oCtx.restore();
  }

  if (state.polygonPoints.length === 0) return;

  oCtx.save();
  oCtx.lineWidth = 2;
  oCtx.strokeStyle = "#6366f1";
  oCtx.fillStyle = hexToRgba(state.currentColor, 0.25);

  oCtx.beginPath();
  state.polygonPoints.forEach((pt, idx) => {
    if (idx === 0) oCtx.moveTo(pt.x, pt.y);
    else oCtx.lineTo(pt.x, pt.y);
  });
  oCtx.stroke();
  oCtx.fill();

  // Draw node handles
  state.polygonPoints.forEach(pt => {
    oCtx.fillStyle = "#ffffff";
    oCtx.beginPath();
    oCtx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    oCtx.fill();
    oCtx.strokeStyle = "#4f46e5";
    oCtx.stroke();
  });

  oCtx.restore();
}

function updateSelection(x, y) {
  if (!state.selectionStart) return;
  if (state.selectionMode === "move" && state.selection) {
    state.selection.x = Math.max(0, Math.min(paintCanvas.width - state.selection.w, x - state.selectionStart.x));
    state.selection.y = Math.max(0, Math.min(paintCanvas.height - state.selection.h, y - state.selectionStart.y));
    redrawOverlay();
    return;
  }
  if (state.selectionMode === "resize" && state.selection) {
    state.selection.w = Math.max(8, Math.min(paintCanvas.width - state.selection.x, x - state.selection.x));
    state.selection.h = Math.max(8, Math.min(paintCanvas.height - state.selection.y, y - state.selection.y));
    if (document.getElementById("selectionShape")?.value === "square") state.selection.h = state.selection.w = Math.min(state.selection.w, state.selection.h);
    redrawOverlay();
    return;
  }
  let w = x - state.selectionStart.x;
  let h = y - state.selectionStart.y;
  if (document.getElementById("selectionShape")?.value === "square") {
    const side = Math.max(Math.abs(w), Math.abs(h));
    w = (w < 0 ? -1 : 1) * side;
    h = (h < 0 ? -1 : 1) * side;
  }
  state.selection = { x: w < 0 ? state.selectionStart.x + w : state.selectionStart.x, y: h < 0 ? state.selectionStart.y + h : state.selectionStart.y, w: Math.abs(w), h: Math.abs(h) };
  redrawOverlay();
}

function clearSelection() {
  state.selection = null;
  state.selectionStart = null;
  redrawOverlay();
}

function applySelectedPaint() {
  if (!state.baseImage || !state.selection || state.selection.w < 3 || state.selection.h < 3) {
    showToast("Draw a square or rectangle on the room first", "error");
    return;
  }
  pCtx.save();
  pCtx.globalCompositeOperation = state.blendMode;
  pCtx.fillStyle = hexToRgba(state.currentColor, state.opacity);
  pCtx.fillRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
  if (state.targetSurface === "ceiling") applyCeilingDesign(state.selection);
  pCtx.restore();
  saveHistoryState();
  publishPaintedImage();
  showToast(`${state.targetSurface === "ceiling" ? "Ceiling" : "Wall"} paint applied to selected area`, "success");
}

function applyCeilingDesign(rect) {
  const design = document.getElementById("ceilingDesignSelect")?.value || "plain";
  if (design === "plain") return;
  pCtx.save();
  pCtx.globalAlpha = Math.min(0.45, state.opacity + 0.1);
  pCtx.strokeStyle = design === "wooden" ? "#9b6a42" : design === "led" ? "#f5c451" : "#ffffff";
  pCtx.lineWidth = design === "border" ? 12 : 3;
  if (design === "modern-false" || design === "border" || design === "led") pCtx.strokeRect(rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16);
  if (design === "wooden" || design === "decorative") {
    for (let x = rect.x; x < rect.x + rect.w; x += 28) { pCtx.beginPath(); pCtx.moveTo(x, rect.y); pCtx.lineTo(x, rect.y + rect.h); pCtx.stroke(); }
  }
  pCtx.restore();
}

function finishPolygonFill() {
  if (state.polygonPoints.length < 3) {
    showToast("Click at least 3 points on the wall to form a zone!", "error");
    return;
  }

  pCtx.save();
  pCtx.globalCompositeOperation = state.blendMode;
  pCtx.fillStyle = hexToRgba(state.currentColor, state.opacity);

  pCtx.beginPath();
  state.polygonPoints.forEach((pt, idx) => {
    if (idx === 0) pCtx.moveTo(pt.x, pt.y);
    else pCtx.lineTo(pt.x, pt.y);
  });
  pCtx.closePath();
  pCtx.fill();
  pCtx.restore();

  cancelPolygon();
  saveHistoryState();
  publishPaintedImage();
  showToast("Wall zone colored successfully!", "success");
}

function cancelPolygon() {
  state.polygonPoints = [];
  if (oCtx) oCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

// --- Global Tint Engine ---
function applyGlobalTint() {
  if (!state.baseImage) return;

  // Restore previous undo state before applying fresh tint
  if (state.historyStep >= 0 && state.history[state.historyStep]) {
    pCtx.putImageData(state.history[state.historyStep], 0, 0);
  } else {
    redrawBaseImage();
  }

  pCtx.save();
  pCtx.globalCompositeOperation = state.blendMode;
  pCtx.fillStyle = hexToRgba(state.currentColor, state.opacity);
  pCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
  pCtx.restore();
  publishPaintedImage();
}

// 7. Undo / Redo & History Stack
function saveHistoryState() {
  if (!pCtx) return;
  // Truncate any forward redo states
  state.history = state.history.slice(0, state.historyStep + 1);
  const imgData = pCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
  state.history.push(imgData);

  if (state.history.length > state.maxHistory) {
    state.history.shift();
  } else {
    state.historyStep++;
  }
}

function undo() {
  if (state.historyStep > 0) {
    state.historyStep--;
    pCtx.putImageData(state.history[state.historyStep], 0, 0);
    publishPaintedImage();
    showToast("Undo applied", "info");
  } else {
    showToast("At beginning of history", "info");
  }
}

function redo() {
  if (state.historyStep < state.history.length - 1) {
    state.historyStep++;
    pCtx.putImageData(state.history[state.historyStep], 0, 0);
    publishPaintedImage();
    showToast("Redo applied", "info");
  }
}

// 8. Header Actions: Reset & Download
function setupHeaderActions() {
  document.getElementById("btnUndo").addEventListener("click", undo);
  document.getElementById("btnRedo").addEventListener("click", redo);

  document.getElementById("btnClearCanvas").addEventListener("click", () => {
    if (!state.baseImage) return;
    if (confirm("Reset all applied paint layers and restore original room photo?")) {
      const original = getOriginalRoomImage();
      if (original) {
        loadImageFromUrl(original);
        setEditedRoomImage(original);
      } else {
        redrawBaseImage();
        publishPaintedImage();
      }
      cancelPolygon();
      showToast("Canvas restored to original room photo", "info");
    }
  });

  // Only PDF Download - generates professional PDF report
  document.getElementById("btnDownloadArt")?.addEventListener("click", () => {
    if (!paintCanvas || !state.baseImage) {
      showToast("Please upload and paint a room photo first!", "error");
      return;
    }
    publishPaintedImage();
    showToast("Generating AI Smart Room PDF report...", "info");
    try {
      downloadCanvasAsPdf(paintCanvas, "AI Smart Room Interior Designer", [
        { label: "Design Section", value: "Paint & Ceiling Studio" },
        { label: "Target Surface", value: state.targetSurface.toUpperCase() },
        { label: "Selected Wall Color", value: state.currentColor },
        { label: "Ceiling Treatment", value: document.getElementById("ceilingDesignSelect")?.value || "Modern Finished Ceiling" },
        { label: "Date Generated", value: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
        { label: "Status", value: "Custom Painted Room Layer Ready for Furniture Catalog" }
      ]);
      showToast("Design PDF downloaded successfully!", "success");
    } catch (err) {
      showToast("Error generating PDF: " + err.message, "error");
    }
  });

  // Transfer to Furniture Catalog button
  document.getElementById("btnGoToFurniture")?.addEventListener("click", () => {
    publishPaintedImage();
  });
}

function publishPaintedImage() {
  if (!paintCanvas || !state.baseImage || !paintCanvas.width) return;
  try {
    const dataUrl = paintCanvas.toDataURL("image/jpeg", 0.90);
    setEditedRoomImage(dataUrl);
    localStorage.setItem("smartroom.paintedRoomUpdatedAt", String(Date.now()));
  } catch (err) {
    showToast("Painted preview is ready, but browser storage is full.", "error");
  }
}

function setupSelectionTools() {
  document.getElementById("btnApplyPaint")?.addEventListener("click", applySelectedPaint);
  document.getElementById("btnClearSelection")?.addEventListener("click", clearSelection);
  document.getElementById("btnSavePainted")?.addEventListener("click", () => {
    if (!state.baseImage) { showToast("Upload a room image first", "error"); return; }
    publishPaintedImage();
    showToast("Painted room saved and transferred to Furniture Catalog!", "success");
  });
  document.getElementById("btnBeforeAfter")?.addEventListener("click", () => {
    if (!state.baseImage) return;
    if (!state.showOriginal) {
      state.previewSnapshot = pCtx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
      redrawBaseImage();
      state.showOriginal = true;
    } else {
      pCtx.putImageData(state.previewSnapshot, 0, 0);
      state.showOriginal = false;
    }
    document.getElementById("btnBeforeAfter").classList.toggle("active", state.showOriginal);
  });
}

// Keyboard shortcuts
function setupShortcuts() {
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    } else if (e.key === "b" || e.key === "B") {
      document.getElementById("toolBrush").click();
    } else if (e.key === "p" || e.key === "P") {
      document.getElementById("toolPolygon").click();
    } else if (e.key === "e" || e.key === "E") {
      document.getElementById("toolEraser").click();
    }
  });
}

// Utility: Hex to RGBA string
function hexToRgba(hex, alpha = 1) {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map(x => x + x).join("");
  }
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Pure Client-side PDF Generation (No external dependencies, 100% reliable)
function downloadCanvasAsPdf(canvas, title, metadata = []) {
  const imgDataUrl = canvas.toDataURL("image/jpeg", 0.92);
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
  const headerHeight = 70;

  const imgAspectRatio = canvas.width / canvas.height;
  let renderWidth = contentWidth;
  let renderHeight = renderWidth / imgAspectRatio;
  const maxImgHeight = 440;
  if (renderHeight > maxImgHeight) {
    renderHeight = maxImgHeight;
    renderWidth = renderHeight * imgAspectRatio;
  }
  const imgX = margin + (contentWidth - renderWidth) / 2;
  const imgY = pageHeight - margin - headerHeight - 15 - renderHeight;

  let contentStream = `
q
0.008 0.518 0.780 rg
${margin} ${pageHeight - margin - headerHeight} ${contentWidth} ${headerHeight} re f
Q
BT
/F1 18 Tf
1 1 1 rg
${margin + 16} ${pageHeight - margin - 30} Td
(${title.replace(/[()\\]/g, "")}) Tj
ET
BT
/F2 10 Tf
0.9 0.95 1 rg
${margin + 16} ${pageHeight - margin - 48} Td
(Smart Architectural Interior Design & Spatial Visualization) Tj
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

  let metaY = imgY - 24;
  contentStream += `
BT
/F1 12 Tf
0.1 0.15 0.2 rg
${margin} ${metaY} Td
(Design & Finish Specifications) Tj
ET
`;
  metaY -= 18;

  metadata.forEach(m => {
    const line = `${m.label}: ${m.value}`.replace(/[()\\]/g, "");
    contentStream += `
BT
/F2 9.5 Tf
0.25 0.3 0.35 rg
${margin} ${metaY} Td
(${line}) Tj
ET
`;
    metaY -= 15;
  });

  contentStream += `
BT
/F2 8 Tf
0.5 0.5 0.5 rg
${margin} ${margin} Td
(Generated by AI Smart Room Interior Designer - Confidential Architectural Report) Tj
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
  link.download = `AI_Smart_Room_Paint_Design_${Date.now()}.pdf`;
  link.href = blobUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

