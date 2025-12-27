/* ==========================================================
   SCRIPTS — URBAN STREET AAA (FINAL LIMPIO)
========================================================== */

console.log("✅ scripts.js cargado");

/* ==========================================================
   ESTADO GLOBAL
========================================================== */
let stockData = [];
let filteredData = [];
let genderFilter = "";
let ITEMS_PER_PAGE = 16;
let currentPage = 1;
let searchQuery = "";

/* ==========================================================
   HELPERS — NORMALIZACIÓN
========================================================== */

// ---- TALLES: "S, M, L, XL, XXL" → ["S","M","L","XL","XXL"]
function normalizeSizes(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(s => String(s).trim()).filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }

  return [];
}

// ---- IMÁGENES: array / json / string
function normalizeImages(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) return raw.filter(Boolean);

  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];

    // JSON string
    if (
      (t.startsWith("[") && t.endsWith("]")) ||
      (t.startsWith("{") && t.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        if (typeof parsed === "object") return Object.values(parsed).filter(Boolean);
      } catch {
        return [t];
      }
    }

    return [t];
  }

  if (typeof raw === "object") {
    return Object.values(raw).filter(Boolean);
  }

  return [];
}

// ---- RUTA FINAL DE IMAGEN
function toUploadUrl(img) {
  if (!img) return "/static/assets/backgrounds/fondomarket.jpg";

  const s = String(img);

  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("/static/")
  ) {
    return s;
  }

  return `/static/uploads/${s}`;
}

/* ==========================================================
   HELPERS — FORMATO DE PRECIO
========================================================== */
function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "0";

  const num = Number(value);
  if (isNaN(num)) return value;

  return num.toLocaleString("es-AR");
}

/* ==========================================================
   PARSE ITEM (DB → FRONT)
========================================================== */
function parseItem(item) {
  return {
    ...item,
    sizes: normalizeSizes(item.sizes),
    images: normalizeImages(item.images).map(toUploadUrl)
  };
}

/* ==========================================================
   CARGAR STOCK
========================================================== */
async function loadStock() {
  try {
    const res = await fetch("/api/stock");
    const data = await res.json();

    stockData = (data.items || []).map(parseItem);
    currentPage = 1;

    applyFilters(); // 👈 clave
  } catch (err) {
    console.error("❌ Error cargando stock:", err);
  }
}


/* ==========================================================
   FILTROS (género + buscador)
========================================================== */
function applyFilters() {
  let data = [...stockData];

  // 🔹 FILTRO POR GÉNERO
  if (genderFilter) {
    data = data.filter(item =>
      (item.gender || "").toLowerCase() === genderFilter
    );
  }

  // 🔹 FILTRO POR BUSCADOR (TÍTULO)
  if (searchQuery) {
    data = data.filter(item =>
      (item.title || "").toLowerCase().includes(searchQuery)
    );
  }

  filteredData = data;
  currentPage = 1;
  renderPage();
}

/* ==========================================================
   BADGES — TRADUCCIÓN GLOBAL
========================================================== */
const BADGE_LABELS = {
  new: "Nuevo",
  sale: "Oferta",
  liquidacion: "Liquidación",
  promo: "Promoción",
  top: "Más vendido"
};
/* ==========================================================
   BADGES — MAPA ID → SLUG (FIX)
========================================================== */
const BADGE_KEYS = {
  1: "new",
  2: "sale",      // ← LIQUIDACIÓN → ROJO
  3: "promo",
  4: "top"
};

/* ==========================================================
   RENDER CARDS (PUBLIC + ADMIN)
========================================================== */
function renderPage() {
  const grid = document.getElementById("cardsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const isAdmin = window.IS_ADMIN_PANEL === true;

  filteredData.slice(start, end).forEach(item => {
    const img = item.images?.[0] || "/static/assets/backgrounds/fondomarket.jpg";
    const sizesText = item.sizes?.length
      ? item.sizes.join(" · ")
      : "Sin talles";

    const adminActions = isAdmin
      ? `
        <div class="card-admin-actions">
          <button
            class="admin-action-btn edit"
            onclick="event.stopPropagation(); editItem(${item.id})">
            ✏ Editar
          </button>

          <button
            class="admin-action-btn delete"
            onclick="event.stopPropagation(); deleteItem(${item.id})">
            🗑 Eliminar
          </button>
        </div>
      `
      : "";

    /* ===== BADGES (FIX DEFINITIVO CON TILDES) ===== */
    const badgesHtml = (item.badges || [])
  .map(badge => {

    // 1️⃣ Si viene como número (ID)
    if (typeof badge === "number") {
      const key = BADGE_KEYS[badge];
      if (!key) return "";
      return `
        <span class="card-badge card-badge-${key}">
          ${BADGE_LABELS[key]}
        </span>
      `;
    }

    // 2️⃣ Si viene como string
    const key = String(badge)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return `
      <span class="card-badge card-badge-${key}">
        ${BADGE_LABELS[key] || badge}
      </span>
    `;
  })
  .join("");



        

    grid.innerHTML += `
      <article class="card urban-card ${isAdmin ? 'admin-card-item' : ''}" data-id="${item.id}">
        <div class="card-img-wrapper">
          ${badgesHtml}
          <img src="${img}" alt="${item.title || ""}">
        </div>

        <div class="card-body">
          <div class="card-category">${item.category || ""}</div>
          <h3 class="card-title">${item.title || ""}</h3>
          <div class="card-price">$${formatPrice(item.price)} ARS</div>
          <div class="card-sizes">${sizesText}</div>
        </div>

        ${adminActions}
      </article>
    `;
  });

  /* 🔗 CLICK A ITEM DETAIL */
  document.querySelectorAll(".urban-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.id;
      if (id) {
        window.location.href = `/stock/${id}`;
      }
    });
  });

  const max = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const pageInfo = document.getElementById("pageInfo");
  if (pageInfo) pageInfo.innerText = `Página ${currentPage} / ${max}`;
}

/* ==========================================================
   ITEM DETAIL — RENDER BADGES (ES)
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("productBadges");
  if (!container) return;

  let badges = [];
  try {
    badges = JSON.parse(container.dataset.badges || "[]");
  } catch {
    return;
  }

  container.innerHTML = badges
    .map(badge => `
      <span class="card-badge card-badge-${badge}">
        ${BADGE_LABELS[badge] || badge}
      </span>
    `)
    .join("");
});


/* ==========================================================
   PAGINACIÓN
========================================================== */
function changePage(delta) {
  const max = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  currentPage += delta;
  if (currentPage < 1) currentPage = 1;
  if (currentPage > max) currentPage = max;
  renderPage();
}

/* ==========================================================
   NAVEGAR A DETALLE
========================================================== */
function goToDetail(id) {
  window.location.href = `/stock/${id}`;
}

/* ==========================================================
   ADMIN — PUBLICAR PRODUCTO
========================================================== */
async function addStock() {
  try {
    const fd = new FormData();

    fd.append("title", document.getElementById("new_title")?.value || "");
    fd.append("price", document.getElementById("new_price")?.value || "");

    // 🔥 NUEVO
    fd.append("gender", document.getElementById("new_gender")?.value || "");
    fd.append("category_id", document.getElementById("new_category")?.value || "");

    fd.append("stock", document.getElementById("new_stock")?.value || "");
    fd.append("sizes", document.getElementById("new_sizes")?.value || "");
    fd.append("color", document.getElementById("new_color")?.value || "");
    fd.append("description", document.getElementById("new_description")?.value || "");
	fd.append("badges", JSON.stringify(selectedBadges));

    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById("image" + i);
      if (input && input.files.length > 0) {
        fd.append("image" + i, input.files[0]);
      }
    }

    const res = await fetch("/api/stock", {
      method: "POST",
      body: fd
    });

    const data = await res.json();
    if (!data.success) throw data;

    alert("✅ Producto publicado");
    await loadStock();
  } catch (err) {
    console.error("❌ Error publicando:", err);
    alert("❌ Error al publicar (ver consola)");
  }
}


/* ==========================================================
   ADMIN — ELIMINAR / EDITAR
========================================================== */
async function deleteItem(id) {
  if (!confirm("¿Eliminar este producto?")) return;

  try {
    const res = await fetch(`/api/stock/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!data.success) throw data;

    await loadStock();
  } catch (err) {
    console.error("❌ Error eliminando:", err);
    alert("❌ Error al eliminar");
  }
}

function editItem(id) {
  alert("✏ Editar producto ID " + id + " (próximo paso)");
}

/* ==========================================================
   ADMIN – CATEGORÍAS POR GÉNERO (FIX FINAL)
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const genderSelect = document.getElementById("new_gender");
  const categorySelect = document.getElementById("new_category");

  if (!genderSelect || !categorySelect) return;
  if (!window.CATEGORIES) return;

  genderSelect.addEventListener("change", () => {
    const gender = genderSelect.value;

    categorySelect.innerHTML = `<option value="">Categoría</option>`;
    categorySelect.disabled = true;

    if (!gender) return;

    window.CATEGORIES
      .filter(c => c[3] === gender)   // 👈 parent_name
      .forEach(c => {
        const opt = document.createElement("option");
        opt.value = c[0];             // 👈 id
        opt.textContent = c[1];       // 👈 name
        categorySelect.appendChild(opt);
      });

    categorySelect.disabled = false;
  });
});

/* =========================
   ADMIN — CATEGORÍAS + BADGES (NUEVO)
========================= */
let selectedBadges = [];

/* CATEGORÍAS */
async function loadCategories() {
  const select = document.getElementById("new_category");
  if (!select) return;

  const res = await fetch("/api/categories");
  const categories = await res.json();

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  });
}

/* BADGES */
async function loadBadges() {
  const container = document.getElementById("badgesContainer");
  if (!container) return;

  const res = await fetch("/api/badges");
  const badges = await res.json();

  badges.forEach(b => {
    const pill = document.createElement("div");
    pill.className = "badge-pill";
    pill.textContent = b.name;

    pill.onclick = () => {
      pill.classList.toggle("active");

      if (selectedBadges.includes(b.id)) {
        selectedBadges = selectedBadges.filter(id => id !== b.id);
      } else {
        selectedBadges.push(b.id);
      }
    };

    container.appendChild(pill);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.IS_ADMIN_PANEL) {
    loadCategories();
    loadBadges();
  }
});

/* ==========================================================
   ITEM DETAIL — GALERÍA
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const thumbs = document.querySelectorAll(".product-thumbs img");
  const mainImg = document.querySelector(".product-main-image img");

  if (!thumbs.length || !mainImg) return;

  thumbs.forEach(thumb => {
    thumb.addEventListener("click", () => {
      const src = thumb.dataset.img || thumb.src;
      mainImg.src = src;

      thumbs.forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });
});

/* ==========================================================
   INIT
========================================================== */
document.addEventListener("DOMContentLoaded", () => {

  // 🔄 Cargar stock inicial
  if (document.getElementById("cardsGrid")) {
    loadStock();
  }
});

/* ==========================================================
   FILTRO POR GÉNERO (CATÁLOGO)
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".gender-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".gender-btn")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      genderFilter = btn.dataset.gender || "";
      currentPage = 1;

      applyFilters();
    });
  });
});

/* ==========================================================
   EXPORTS (HTML onclick)
========================================================== */
window.addStock = addStock;
window.deleteItem = deleteItem;
window.editItem = editItem;
window.changePage = changePage;
window.goToDetail = goToDetail;

/* ==========================================================
   EDITAR PRODUCTO — ADMIN
========================================================== */

function editItem(id) {
  const item = stockData.find(p => p.id === id);
  if (!item) return alert("Producto no encontrado");

  document.getElementById("edit_id").value = item.id;
  document.getElementById("edit_title").value = item.title || "";
  document.getElementById("edit_price").value = item.price || "";
  document.getElementById("edit_stock").value = item.stock || "";
  document.getElementById("edit_sizes").value = (item.sizes || []).join(",");
  document.getElementById("edit_color").value = item.color || "";
  document.getElementById("edit_description").value = item.description || "";

  document.getElementById("editModal").classList.remove("hidden");
}

function closeEdit() {
  document.getElementById("editModal").classList.add("hidden");
}

async function saveEdit() {
  const id = document.getElementById("edit_id").value;

  const payload = {
    title: document.getElementById("edit_title").value,
    price: document.getElementById("edit_price").value,
    stock: document.getElementById("edit_stock").value,
    sizes: document.getElementById("edit_sizes").value,
    color: document.getElementById("edit_color").value,
    description: document.getElementById("edit_description").value
  };

  try {
    const res = await fetch(`/api/stock/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      alert("Error al guardar");
      return;
    }

    closeEdit();
    await loadStock();
    alert("✅ Producto actualizado");

  } catch (e) {
    console.error(e);
    alert("Error de red");
  }
}

/* ==========================================================
   ITEM DETAIL — MOBILE IMAGE SWITCH
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const mainImg = document.getElementById("mainImage");
  if (!mainImg) return;

  document.querySelectorAll(".mobile-image-dots .dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const src = dot.dataset.img;
      if (!src) return;

      mainImg.src = src;

      document.querySelectorAll(".mobile-image-dots .dot")
        .forEach(d => d.classList.remove("active"));

      dot.classList.add("active");
    });
  });
});

/* ==========================================================
   ITEM DETAIL — MOBILE IMAGE DOTS
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const mainImg = document.getElementById("mainImage");
  if (!mainImg) return;

  const dots = document.querySelectorAll(".mobile-image-dots .dot");
  if (!dots.length) return;

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      const src = dot.dataset.img;
      if (!src) return;

      mainImg.src = src;

      dots.forEach(d => d.classList.remove("active"));
      dot.classList.add("active");
    });
  });
});

/* ==========================================================
   BUSCADOR — FIX FINAL (ENTER + MOBILE)
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("filter_title");
  const suggestions = document.getElementById("searchSuggestions");
  const container = document.querySelector(".street-search-container");

  if (!input || !suggestions || !container) return;

  // 🔍 BÚSQUEDA EN VIVO
  input.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    currentPage = 1;
    applyFilters();

    if (searchQuery.length > 0) {
      suggestions.classList.add("hidden");
      container.classList.remove("search-active");
    }
  });

  // ⌨️ ENTER / IR (mobile y desktop)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      suggestions.classList.add("hidden");
      container.classList.remove("search-active");
      input.blur(); // cierra teclado mobile
    }
  });

  // 🖱 Click en sugerencia
  suggestions.querySelectorAll("li").forEach(item => {
    item.addEventListener("click", () => {
      input.value = item.dataset.value;
      searchQuery = item.dataset.value.toLowerCase().trim();
      applyFilters();

      suggestions.classList.add("hidden");
      container.classList.remove("search-active");
      input.blur();
    });
  });
});

/* ==========================================================
   ITEM DETAIL — TECH PRO INTERACTIONS
========================================================== */
document.addEventListener("DOMContentLoaded", () => {

  // 🔒 Solo para Tech Pro
  const techDetail = document.querySelector(".tech-detail");
  if (!techDetail) return;

  const mainImg = document.getElementById("mainImage");
  if (!mainImg) return;

  let zoomed = false;

  // 🔍 Zoom tipo Apple (tap / click)
  mainImg.addEventListener("click", () => {
    zoomed = !zoomed;

    if (zoomed) {
      mainImg.style.transform = "scale(1.35)";
      mainImg.style.cursor = "zoom-out";
    } else {
      mainImg.style.transform = "scale(1)";
      mainImg.style.cursor = "zoom-in";
    }
  });

});

/* ==========================================================
   ITEM DETAIL — TECH PRO SWIPE (NO DOTS)
========================================================== */
document.addEventListener("DOMContentLoaded", () => {

  const techDetail = document.querySelector(".tech-detail");
  if (!techDetail) return;

  const mainImg = techDetail.querySelector("#mainImage");
  const thumbs = techDetail.querySelectorAll(".product-thumbs img");

  if (!mainImg || thumbs.length <= 1) return;

  const images = Array.from(thumbs).map(img => img.src);

  let currentIndex = images.indexOf(mainImg.src);
  if (currentIndex < 0) currentIndex = 0;

  let startX = 0;

  function updateImage(index) {
    mainImg.style.opacity = "0";

    setTimeout(() => {
      mainImg.src = images[index];
      mainImg.style.opacity = "1";
    }, 160);
  }

  // Swipe mobile
  mainImg.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  });

  mainImg.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) < 40) return;

    if (diff > 0 && currentIndex < images.length - 1) {
      currentIndex++;
    } else if (diff < 0 && currentIndex > 0) {
      currentIndex--;
    }

    updateImage(currentIndex);
  });

});

/* ==========================================================
   TECH DETAIL — WHATSAPP STICKY (MOBILE)
========================================================== */
document.addEventListener("DOMContentLoaded", () => {

  // 🔒 Solo item_detail tech
  const techDetail = document.querySelector(
    ".product-page.app-container.tech-detail"
  );
  if (!techDetail) return;

  // Solo mobile
  if (window.innerWidth > 768) return;

  const cta = techDetail.querySelector(".product-cta-aaa");
  if (!cta) return;

  // Evitar duplicados
  if (document.querySelector(".whatsapp-sticky")) return;

  // Clonamos CTA
  const sticky = cta.cloneNode(true);

  sticky.classList.remove("product-cta-aaa");
  sticky.classList.add("whatsapp-sticky");

  // Insertamos sticky
  document.body.appendChild(sticky);
});

/* ==========================================================
   TECH — OCULTAR "SIN TALLES" (ROBUST)
========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  if (
    document.querySelector(".tech-detail") ||
    document.querySelector(".tech-catalog")
  ) {
    document.querySelectorAll(".card-sizes").forEach(el => {
      el.remove();
    });
  }
});

/* =========================================================
   MINI CART — CORE
========================================================= */


(() => {

  /* =====================
     ELEMENTS
  ===================== */
  const miniCart = document.getElementById("miniCart");
  const miniCartOverlay = document.getElementById("miniCartOverlay");
  const miniCartItems = document.getElementById("miniCartItems");
  const miniCartTotal = document.getElementById("miniCartTotal");
  const closeBtn = document.getElementById("closeMiniCart");
  const checkoutBtn = document.getElementById("checkoutWhatsapp");

  if (!miniCart) return;

  /* =====================
     STATE
  ===================== */
  let cart = JSON.parse(localStorage.getItem("urban_cart")) || [];

  /* =====================
     HELPERS
  ===================== */
  function openCart() {
    miniCart.classList.add("active");
    miniCartOverlay.classList.add("active");
  }

  function closeCart() {
    miniCart.classList.remove("active");
    miniCartOverlay.classList.remove("active");
  }

  function saveCart() {
    localStorage.setItem("urban_cart", JSON.stringify(cart));
  }

  function formatPrice(n) {
    return "$" + n.toLocaleString("es-AR");
  }

  /* =====================
     RENDER
  ===================== */
  function renderCart() {
    miniCartItems.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
      total += item.price * item.qty;

      miniCartItems.insertAdjacentHTML("beforeend", `
        <div class="mini-cart-item">
          <img src="${item.image}" alt="${item.title}">
          <div class="mini-cart-item-info">
            <strong>${item.title}</strong>
            <span>Talle ${item.size} · ${formatPrice(item.price)}</span>
          </div>
          <button
            class="mini-cart-item-remove"
            data-index="${index}"
            aria-label="Eliminar"
          >×</button>
        </div>
      `);
    });

    miniCartTotal.textContent = formatPrice(total);

    /* WhatsApp text */
    if (cart.length) {
      const text = cart.map(i =>
        `• ${i.title} (Talle ${i.size}) x${i.qty} – ${formatPrice(i.price)}`
      ).join("%0A");

      checkoutBtn.href =
        `https://wa.me/5492616582829?text=` +
        `Hola! Quiero hacer este pedido:%0A%0A` +
        text +
        `%0A%0ATotal: ${formatPrice(total)}`;
    } else {
      checkoutBtn.href = "#";
    }
  }

  /* =====================
     ACTIONS
  ===================== */
  function addToCart(product) {
    const existing = cart.find(
      i => i.id === product.id && i.size === product.size
    );

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    saveCart();
    renderCart();
    openCart();
  }

  function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
  }

  /* =====================
     EVENTS
  ===================== */
  closeBtn?.addEventListener("click", closeCart);
  miniCartOverlay?.addEventListener("click", closeCart);

  miniCartItems.addEventListener("click", (e) => {
    if (e.target.classList.contains("mini-cart-item-remove")) {
      removeItem(Number(e.target.dataset.index));
    }
  });

  /* =====================
     PUBLIC API
  ===================== */
  window.UrbanCart = {
    add: addToCart,
    open: openCart,
    close: closeCart,
    render: renderCart
  };

  /* Init */
  renderCart();

})();
