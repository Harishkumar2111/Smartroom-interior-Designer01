// paint_studio.js - Full Interactive Wall & Ceiling Painter Engine
const API_BASE = "http://127.0.0.1:8000/api";

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
  currentTool: "brush", // brush, polygon, tint, eraser
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

  if (state.currentTool === "brush" || state.currentTool === "eraser") {
    startBrushStroke(pos.x, pos.y);
  } else if (state.currentTool === "polygon") {
    addPolygonPoint(pos.x, pos.y);
  }
}

function onPointerMove(e) {
  if (!isDrawing) return;
  const pos = getCanvasCoordinates(e.clientX, e.clientY);
  continueBrushStroke(pos.x, pos.y);
}

function onPointerUp() {
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
    showToast("Undo applied", "info");
  } else {
    showToast("At beginning of history", "info");
  }
}

function redo() {
  if (state.historyStep < state.history.length - 1) {
    state.historyStep++;
    pCtx.putImageData(state.history[state.historyStep], 0, 0);
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
      redrawBaseImage();
      cancelPolygon();
      saveHistoryState();
      showToast("Canvas restored to original room photo", "info");
    }
  });

  document.getElementById("btnDownloadArt").addEventListener("click", () => {
    if (!paintCanvas || !state.baseImage) {
      showToast("Please upload and paint a room photo first!", "error");
      return;
    }

    // Create export canvas with metadata footer
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = paintCanvas.width;
    exportCanvas.height = paintCanvas.height + 40;
    const eCtx = exportCanvas.getContext("2d");

    // Copy painting
    eCtx.drawImage(paintCanvas, 0, 0);

    // Architectural Footer
    eCtx.fillStyle = "#0f131a";
    eCtx.fillRect(0, paintCanvas.height, exportCanvas.width, 40);
    eCtx.fillStyle = "#ffffff";
    eCtx.font = "bold 14px 'Inter', sans-serif";
    eCtx.fillText(`SmartRoom AI Paint Studio — Target: ${state.targetSurface.toUpperCase()} | Color: ${state.currentColor}`, 20, paintCanvas.height + 25);

    const link = document.createElement("a");
    link.download = `SmartRoom_Paint_${state.targetSurface}_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
    showToast("Design exported & downloaded successfully!", "success");
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

