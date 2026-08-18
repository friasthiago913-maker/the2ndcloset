// Reemplazá por tu número real (código país + número, sin +, sin espacios)
const WHATSAPP_NUMBER = "5491135079214";
const INSTAGRAM_URL = "https://www.instagram.com/the2ndcloset___/";

// Catálogo de respaldo: se usa si todavía no conectaste Supabase (ver config.js)
// o si por algún motivo no se puede leer la base de datos.
const SEED_PRODUCTS = [
  { id: "seed-1", name: "Gorra Realtree Whiskey Jam", category: "gorras", price: 35000, condition: "10/10", details: "Regulable con broche.", images: ["assets/products/gorra-whiskey-jam.jpg"], sold: false },
  { id: "seed-2", name: "Jean Baggy Zoo York", category: "pantalones", price: 70000, condition: "10/10", details: "104 cm de largo · 45 cm de cintura.", images: ["assets/products/jean-zoo-york.jpg"], sold: false },
  { id: "seed-3", name: "Buzo Bali", category: "buzos", price: 15000, condition: "9/10", details: "68 cm de largo · 62 cm de ancho.\nLe faltan 2 botones.", images: ["assets/products/buzo-bali.jpg"], sold: false },
  { id: "seed-4", name: "Campera Broncos", category: "camperas", price: 55000, condition: "10/10", details: "72 cm de largo · 61 cm de ancho.", images: ["assets/products/campera-broncos.jpg"], sold: true },
  { id: "seed-5", name: "Pantalón Eddie Bauer", category: "pantalones", price: 40000, condition: "10/10", details: "108 cm de largo · 49 cm de cintura.", images: ["assets/products/pantalon-eddie-bauer.jpg"], sold: false },
  { id: "seed-6", name: "Gorra Realtree Mossy Oak", category: "gorras", price: 35000, condition: "10/10", details: "Regulable con abrojo velcro.", images: ["assets/products/gorra-mossy-oak.jpg"], sold: false },
  { id: "seed-7", name: "Buzo Altamont Apparel", category: "buzos", price: 20000, condition: "7/10", details: "71 cm de largo · 54 cm de ancho.\nDetalles en las últimas fotos.", images: ["assets/products/buzo-altamont.jpg"], sold: false },
  { id: "seed-8", name: "Pantalón Recto Longboard", category: "pantalones", price: 30000, condition: "10/10", details: "108 cm de largo · 39 cm de cintura.", images: ["assets/products/pantalon-longboard.jpg"], sold: false },
  { id: "seed-9", name: "Buzo John L Cook", category: "buzos", price: 20000, condition: "8/10", details: "76 cm de largo · 54 cm de ancho.\nDetalle en tercer foto.", images: ["assets/products/buzo-john-l-cook.jpg"], sold: false },
  { id: "seed-10", name: "Chomba de Golf NikeFIT", category: "remeras", price: 30000, condition: "10/10", details: "69 cm de largo · 53 cm de ancho.", images: ["assets/products/chomba-nikefit.jpg"], sold: false }
];

const supabaseReady = typeof SUPABASE_URL !== "undefined" && SUPABASE_URL && typeof SUPABASE_ANON_KEY !== "undefined" && SUPABASE_ANON_KEY;
const db = supabaseReady && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const fmt = n => "$" + Number(n).toLocaleString("es-AR");
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

let PRODUCTS = [];
let activeFilter = "all";
let cart = JSON.parse(localStorage.getItem("t2c_cart") || "[]");

async function loadProducts(){
  if(!db){
    PRODUCTS = SEED_PRODUCTS;
    return;
  }
  const { data, error } = await db.from("products").select("*").order("sort_order", { ascending: true });
  if(error || !data || data.length === 0){
    PRODUCTS = SEED_PRODUCTS;
    return;
  }
  PRODUCTS = data.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    condition: p.condition,
    details: p.details,
    images: p.images && p.images.length ? p.images : ["assets/mascot.jpg"],
    sold: p.sold
  }));
}

function findProduct(id){
  return PRODUCTS.find(x => String(x.id) === String(id));
}

function saveCart(){
  localStorage.setItem("t2c_cart", JSON.stringify(cart));
  renderCartCount();
}

function renderGrid(){
  const grid = $("#grid");
  const items = PRODUCTS.filter(p => activeFilter === "all" || p.category === activeFilter);
  if(items.length === 0){
    grid.innerHTML = `<p class="grid__empty">Todavía no hay prendas en esta categoría.</p>`;
    return;
  }
  grid.innerHTML = items.map((p, i) => `
    <div class="card card--${i % 4} reveal" data-id="${p.id}">
      <div class="card__img-wrap" data-open="${p.id}">
        <img src="${p.images[0]}" alt="${p.name}" loading="lazy">
        ${p.sold ? '<span class="card__badge card__badge--sold">Vendido</span>' : `<span class="card__badge">${p.condition}</span>`}
      </div>
      <div class="card__body">
        <span class="card__cat">${p.category}</span>
        <span class="card__name" data-open="${p.id}">${p.name}</span>
        <div class="card__row">
          <span class="card__price">${fmt(p.price)}</span>
          <button class="card__add" data-add="${p.id}" ${p.sold ? "disabled" : ""}>${p.sold ? "Vendido" : "Agregar"}</button>
        </div>
      </div>
    </div>
  `).join("");
  observeReveals();
}

function openModal(id){
  const p = findProduct(id);
  if(!p) return;
  const gallery = p.images.length > 1 ? `
    <div class="modal__thumbs">
      ${p.images.map((src, i) => `<button class="modal__thumb ${i === 0 ? "active" : ""}" data-thumb="${src}"><img src="${src}" alt=""></button>`).join("")}
    </div>` : "";
  $("#modalBody").innerHTML = `
    <div class="modal__img">
      <img id="modalMainImg" src="${p.images[0]}" alt="${p.name}">
      ${gallery}
    </div>
    <div class="modal__info">
      <span class="modal__cat">${p.category}</span>
      <h3 class="modal__name">${p.name}</h3>
      <span class="modal__condition">Estado ${p.condition}</span>
      <p class="modal__meta">${p.details || ""}</p>
      <span class="modal__price">${fmt(p.price)}</span>
      <div class="modal__actions">
        <button class="btn btn--primary btn--block" data-add="${p.id}" ${p.sold ? "disabled" : ""}>${p.sold ? "Vendido" : "Agregar al pedido"}</button>
        <a class="btn btn--outline btn--block" target="_blank" rel="noopener" href="${waLink(`Hola! Me interesa "${p.name}" (${fmt(p.price)}). ¿Sigue disponible?`)}">Consultar por WhatsApp</a>
      </div>
    </div>
  `;
  $("#productModal").classList.add("open");
}

function closeModal(){ $("#productModal").classList.remove("open"); }

function addToCart(id){
  const p = findProduct(id);
  if(!p || p.sold) return;
  if(cart.some(c => String(c.id) === String(id))) return;
  cart.push({id: p.id});
  saveCart();
  renderCart();
  openCart();
}

function removeFromCart(id){
  cart = cart.filter(c => String(c.id) !== String(id));
  saveCart();
  renderCart();
}

function renderCartCount(){
  $("#cartCount").textContent = cart.length;
}

function renderCart(){
  const wrap = $("#cartItems");
  if(cart.length === 0){
    wrap.innerHTML = `
      <div class="drawer__empty">
        <img src="assets/mascot.jpg" alt="Mascota the 2nd closet">
        <p class="drawer__empty-bubble">Todavía no agregaste nada... ¡dale una vuelta al catálogo!</p>
      </div>`;
    $("#cartTotal").textContent = fmt(0);
    return;
  }
  const items = cart.map(c => findProduct(c.id)).filter(Boolean);
  wrap.innerHTML = items.map(p => `
    <div class="cart-item">
      <img src="${p.images[0]}" alt="${p.name}">
      <div class="cart-item__info">
        <span class="cart-item__name">${p.name}</span>
        <span class="cart-item__price">${fmt(p.price)}</span>
        <button class="cart-item__remove" data-remove="${p.id}">Quitar</button>
      </div>
    </div>
  `).join("");
  const total = items.reduce((sum, p) => sum + p.price, 0);
  $("#cartTotal").textContent = fmt(total);
}

function openCart(){ renderCart(); $("#cartDrawer").classList.add("open"); }
function closeCart(){ $("#cartDrawer").classList.remove("open"); }

function waLink(text){
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function checkoutWhatsapp(){
  const items = cart.map(c => findProduct(c.id)).filter(Boolean);
  if(items.length === 0) return;
  const total = items.reduce((sum, p) => sum + p.price, 0);
  const lines = items.map(p => `• ${p.name} — ${fmt(p.price)}`).join("\n");
  const msg = `Hola! Quiero hacer un pedido de the 2nd closet:\n\n${lines}\n\nTotal: ${fmt(total)}`;
  window.open(waLink(msg), "_blank");
}

async function checkoutMercadoPago(){
  const items = cart.map(c => findProduct(c.id)).filter(Boolean);
  if(items.length === 0) return;
  const btn = $("#mpBtn");
  const originalText = btn.textContent;
  btn.textContent = "Generando pago...";
  btn.disabled = true;
  try{
    const resp = await fetch("/api/create-preference", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ items: items.map(p => ({ name: p.name, price: p.price })) })
    });
    const data = await resp.json();
    if(!resp.ok || !data.init_point) throw new Error(data.error || "No se pudo generar el pago");
    window.location.href = data.init_point;
  }catch(err){
    alert("No pudimos iniciar el pago con Mercado Pago (" + err.message + "). Podés coordinar por WhatsApp mientras tanto.");
  }finally{
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function setFilter(filter){
  activeFilter = filter;
  $$(".chip").forEach(c => c.classList.toggle("active", c.dataset.filter === filter));
  $$(".nav__link").forEach(a => a.classList.toggle("active", a.dataset.filter === filter));
  renderGrid();
}

document.addEventListener("click", e => {
  const thumb = e.target.closest("[data-thumb]");
  if(thumb){
    $("#modalMainImg").src = thumb.dataset.thumb;
    $$(".modal__thumb").forEach(t => t.classList.toggle("active", t === thumb));
    return;
  }

  const openId = e.target.closest("[data-open]")?.dataset.open;
  if(openId){ openModal(openId); return; }

  const addId = e.target.closest("[data-add]")?.dataset.add;
  if(addId){ addToCart(addId); return; }

  const removeId = e.target.closest("[data-remove]")?.dataset.remove;
  if(removeId){ removeFromCart(removeId); return; }

  if(e.target.closest("[data-close]")){ closeModal(); return; }
  if(e.target.closest("[data-close-cart]")){ closeCart(); return; }

  const filterEl = e.target.closest("[data-filter]");
  if(filterEl){
    e.preventDefault();
    setFilter(filterEl.dataset.filter);
    $("#nav").classList.remove("open");
    return;
  }

  if(e.target.closest("#cartBtn")){ openCart(); return; }
  if(e.target.closest("#mpBtn")){ checkoutMercadoPago(); return; }
  if(e.target.closest("#waCheckoutBtn")){ checkoutWhatsapp(); return; }
  if(e.target.closest("#burger")){ $("#nav").classList.toggle("open"); return; }
});

document.addEventListener("keydown", e => {
  if(e.key === "Escape"){ closeModal(); closeCart(); }
});

$("#waFloat").href = waLink("Hola! Vi el catálogo de the 2nd closet y quería consultar.");
$("#footerWhatsapp").href = waLink("Hola! Vi el catálogo de the 2nd closet y quería consultar.");
$("#year").textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    }
  });
}, {threshold: 0.15});

function observeReveals(){
  $$(".reveal:not(.in-view)").forEach(el => revealObserver.observe(el));
}

window.addEventListener("scroll", () => {
  $("#topbar").classList.toggle("scrolled", window.scrollY > 10);
});

(async function init(){
  await loadProducts();
  renderGrid();
  renderCartCount();
  observeReveals();
})();
