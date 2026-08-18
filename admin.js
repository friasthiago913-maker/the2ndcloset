const supabaseReady = typeof SUPABASE_URL !== "undefined" && SUPABASE_URL && typeof SUPABASE_ANON_KEY !== "undefined" && SUPABASE_ANON_KEY;

const $ = sel => document.querySelector(sel);

if(!supabaseReady){
  $("#notConfigured").style.display = "block";
} else {
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let products = [];
  let editingId = null;
  let pendingFiles = [];
  let existingImages = [];

  const fmt = n => "$" + Number(n).toLocaleString("es-AR");

  async function refreshSession(){
    const { data } = await db.auth.getSession();
    if(data.session){
      showDashboard();
      loadProducts();
    } else {
      showLogin();
    }
  }

  function showLogin(){
    $("#loginView").style.display = "block";
    $("#dashboard").style.display = "none";
    $("#logoutBtn").style.display = "none";
  }

  function showDashboard(){
    $("#loginView").style.display = "none";
    $("#dashboard").style.display = "block";
    $("#logoutBtn").style.display = "inline-block";
  }

  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    $("#loginError").textContent = "";
    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;
    const { error } = await db.auth.signInWithPassword({ email, password });
    if(error){
      $("#loginError").textContent = "No pudimos ingresar: " + error.message;
      return;
    }
    showDashboard();
    loadProducts();
  });

  $("#logoutBtn").addEventListener("click", async () => {
    await db.auth.signOut();
    showLogin();
  });

  async function loadProducts(){
    const { data, error } = await db.from("products").select("*").order("sort_order", { ascending: true });
    if(error){
      alert("Error cargando el catálogo: " + error.message);
      return;
    }
    products = data || [];
    renderList();
  }

  function renderList(){
    $("#productCount").textContent = products.length;
    if(products.length === 0){
      $("#productList").innerHTML = `<p class="admin-empty">Todavía no cargaste ninguna prenda.</p>`;
      return;
    }
    $("#productList").innerHTML = products.map(p => `
      <div class="admin-item ${p.sold ? "admin-item--sold" : ""}">
        <img src="${(p.images && p.images[0]) || "assets/mascot.jpg"}" alt="">
        <div class="admin-item__info">
          <div class="admin-item__name">${p.name}</div>
          <div class="admin-item__meta">${p.category} · ${fmt(p.price)} · estado ${p.condition}${p.sold ? " · VENDIDO" : ""}</div>
        </div>
        <div class="admin-item__actions">
          <button type="button" data-toggle-sold="${p.id}">${p.sold ? "Marcar disponible" : "Marcar vendido"}</button>
          <button type="button" data-edit="${p.id}">Editar</button>
          <button type="button" class="danger" data-delete="${p.id}">Borrar</button>
        </div>
      </div>
    `).join("");
  }

  $("#productList").addEventListener("click", async e => {
    const editId = e.target.closest("[data-edit]")?.dataset.edit;
    const deleteId = e.target.closest("[data-delete]")?.dataset.delete;
    const toggleId = e.target.closest("[data-toggle-sold]")?.dataset.toggleSold;

    if(editId){ startEdit(editId); return; }

    if(deleteId){
      if(!confirm("¿Borrar esta prenda del catálogo?")) return;
      const { error } = await db.from("products").delete().eq("id", deleteId);
      if(error){ alert("Error al borrar: " + error.message); return; }
      loadProducts();
      return;
    }

    if(toggleId){
      const p = products.find(x => x.id === toggleId);
      const { error } = await db.from("products").update({ sold: !p.sold }).eq("id", toggleId);
      if(error){ alert("Error al actualizar: " + error.message); return; }
      loadProducts();
      return;
    }
  });

  function startEdit(id){
    const p = products.find(x => x.id === id);
    if(!p) return;
    editingId = id;
    existingImages = p.images || [];
    pendingFiles = [];
    $("#formTitle").textContent = "Editar prenda";
    $("#productId").value = p.id;
    $("#fName").value = p.name;
    $("#fCategory").value = p.category;
    $("#fPrice").value = p.price;
    $("#fCondition").value = p.condition;
    $("#fSold").checked = p.sold;
    $("#fDetails").value = p.details || "";
    $("#cancelEditBtn").style.display = "inline-block";
    $("#saveBtn").textContent = "Guardar cambios";
    renderPreview();
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function resetForm(){
    editingId = null;
    pendingFiles = [];
    existingImages = [];
    $("#productForm").reset();
    $("#productId").value = "";
    $("#formTitle").textContent = "Agregar prenda";
    $("#cancelEditBtn").style.display = "none";
    $("#saveBtn").textContent = "Guardar prenda";
    $("#formError").textContent = "";
    renderPreview();
  }

  $("#cancelEditBtn").addEventListener("click", resetForm);

  $("#fImages").addEventListener("change", e => {
    pendingFiles = Array.from(e.target.files);
    renderPreview();
  });

  function renderPreview(){
    const urls = existingImages.map(src => ({src, isFile:false}));
    const fileUrls = pendingFiles.map(f => ({src: URL.createObjectURL(f), isFile:true}));
    $("#fImagePreview").innerHTML = [...urls, ...fileUrls].map(u => `<img src="${u.src}" alt="">`).join("");
  }

  async function uploadImages(files){
    const urls = [];
    for(const file of files){
      const path = `products/${crypto.randomUUID()}-${file.name}`;
      const { error } = await db.storage.from("product-images").upload(path, file);
      if(error) throw error;
      const { data } = db.storage.from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  $("#productForm").addEventListener("submit", async e => {
    e.preventDefault();
    $("#formError").textContent = "";
    $("#saveBtn").disabled = true;
    $("#saveBtn").textContent = "Guardando...";
    try{
      let images = existingImages;
      if(pendingFiles.length > 0){
        const uploaded = await uploadImages(pendingFiles);
        images = editingId ? [...existingImages, ...uploaded] : uploaded;
      }
      const payload = {
        name: $("#fName").value.trim(),
        category: $("#fCategory").value,
        price: Number($("#fPrice").value),
        condition: $("#fCondition").value,
        details: $("#fDetails").value.trim(),
        sold: $("#fSold").checked,
        images
      };
      if(editingId){
        const { error } = await db.from("products").update(payload).eq("id", editingId);
        if(error) throw error;
      } else {
        payload.sort_order = products.length + 1;
        const { error } = await db.from("products").insert(payload);
        if(error) throw error;
      }
      resetForm();
      loadProducts();
    }catch(err){
      $("#formError").textContent = "Error: " + err.message;
    }finally{
      $("#saveBtn").disabled = false;
      $("#saveBtn").textContent = editingId ? "Guardar cambios" : "Guardar prenda";
    }
  });

  refreshSession();
}
