(() => {
"use strict";

const STORAGE = {
  products: "rp_products_v6",
  customers: "rp_customers_v6",
  pending: "rp_pending_v6",
  sales: "rp_sales_v6",
  shipments: "rp_shipments_v6"
};

const defaultProducts = [
 {id:1,name:"Nasi Goreng Spesial",cat:"Makanan",price:25000,discount:10,unit:"piring",emoji:"🍛",stock:50},
 {id:2,name:"Es Teh Manis",cat:"Minuman",price:5000,discount:20,unit:"gelas",emoji:"🥤",stock:100},
 {id:3,name:"Kopi Latte",cat:"Minuman",price:18000,discount:15,unit:"cangkir",emoji:"☕",stock:40},
 {id:4,name:"Indomie Goreng",cat:"Makanan",price:4000,discount:0,unit:"bungkus",emoji:"🍜",stock:80},
 {id:5,name:"Aqua 600ml",cat:"Minuman",price:4000,discount:0,unit:"botol",emoji:"💧",stock:120},
 {id:6,name:"Wafer Tango",cat:"Snack",price:3000,discount:0,unit:"bungkus",emoji:"🍫",stock:70},
 {id:7,name:"Lays Classic",cat:"Snack",price:6000,discount:0,unit:"bungkus",emoji:"🥔",stock:60},
 {id:8,name:"Fanta Strawberry",cat:"Minuman",price:6000,discount:0,unit:"botol",emoji:"🥤",stock:55},
 {id:9,name:"Snack Kentang",cat:"Snack",price:6000,discount:0,unit:"piring",emoji:"🍘",stock:35}
];

const defaultCustomers = [
 {id:1,name:"Pelanggan Umum",phone:"-",address:"-"},
 {id:2,name:"Budi",phone:"08123456789",address:"Jakarta"}
];

let products = load(STORAGE.products, defaultProducts);
let customers = load(STORAGE.customers, defaultCustomers);
let cart = [];
let activeCat = "Semua";
let payment = "Tunai";
let currentPage = "penjualan";
let searchTerm = "";

function load(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(fallback));
  } catch(e){ return JSON.parse(JSON.stringify(fallback)); }
}
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function $(id){ return document.getElementById(id); }
function rupiah(n){ return "Rp " + Math.round(Number(n)||0).toLocaleString("id-ID"); }
function finalPrice(p){ return p.price * (1 - p.discount/100); }
function esc(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function toast(msg){
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>t.classList.remove("show"), 1700);
}

function setPage(page){
  currentPage = page;
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  $("pageTitle").textContent = pageTitle(page);
  $("globalSearchWrap").style.display = page === "penjualan" ? "flex" : "none";
  renderPage();
  $("sidebar").classList.remove("open");
  history.replaceState(null, "", "#" + page);
}
function pageTitle(page){
  return ({dashboard:"Dashboard",penjualan:"Penjualan",produk:"Produk",pelanggan:"Pelanggan",
           ekspedisi:"Ekspedisi",resest:"Resest",diskon:"Diskon"})[page] || "Penjualan";
}

function renderPage(){
  if(currentPage === "penjualan") renderSales();
  if(currentPage === "dashboard") renderDashboard();
  if(currentPage === "produk") renderProductsPage();
  if(currentPage === "pelanggan") renderCustomersPage();
  if(currentPage === "ekspedisi") renderShipmentsPage();
  if(currentPage === "resest") renderPendingPage();
  if(currentPage === "diskon") renderDiscountPage();
}

function renderSales(){
  $("appContent").innerHTML = `
  <div class="products-panel">
    <div class="categories">
      ${["Semua","Makanan","Minuman","Snack","Kebutuhan","Lainnya"].map(c=>`
        <button class="category ${activeCat===c?"active":""}" data-cat="${c}">${c==="Semua"?"▦":c==="Makanan"?"♜":c==="Minuman"?"▣":c==="Snack"?"◉":c==="Kebutuhan"?"□":"•••"} &nbsp;${c==="Semua"?"Semua Produk":c}</button>`).join("")}
      <button class="filter" id="filterBtn">☷ &nbsp;Filter</button>
    </div>
    <div class="tip">ⓘ &nbsp; Tip: Satuan produk mengikuti satuan yang sudah ditentukan pada daftar produk.</div>
    <div class="product-grid" id="productGrid"></div>
  </div>

  <aside class="cart">
    <div class="cart-head">
      <h2>Keranjang Penjualan <span id="cartCount">0</span></h2>
      <button id="clearCart">♜ &nbsp;Hapus Semua</button>
    </div>
    <div class="cart-items" id="cartItems"></div>
    <div class="summary">
      <div><span>Subtotal</span><strong id="subtotal">Rp 0</strong></div>
      <div class="discount-row"><span>Diskon</span><strong id="discount">- Rp 0</strong></div>
      <div><span>Pajak (10%)</span><strong id="tax">Rp 0</strong></div>
      <hr><div class="total"><span>Total</span><strong id="total">Rp 0</strong></div>
    </div>
    <div class="payments">
      ${["Tunai","QRIS","Kartu","Lainnya"].map(p=>`<button class="pay ${payment===p?"active":""}" data-pay="${p}">${p==="Tunai"?"▣":p==="QRIS"?"▦":p==="Kartu"?"▤":"•••"}<small>${p}</small></button>`).join("")}
    </div>
    <button class="checkout" id="payBtn">Bayar (F2)</button>
    <button class="pending" id="pendingBtn">♧ &nbsp; Simpan / Pending (F3)</button>
  </aside>`;
  renderProductGrid();
  renderCart();
  bindSalesEvents();
}

function renderProductGrid(){
  const q = searchTerm.toLowerCase().trim();
  const list = products.filter(p =>
    (activeCat==="Semua" || p.cat===activeCat) &&
    (!q || p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q) || String(p.id)===q)
  );
  $("productGrid").innerHTML = list.map(p=>`
    <article class="product" data-add-card="${p.id}">
      <div class="product-img">${p.emoji}</div>
      <div class="product-info">
        <div class="product-name">${esc(p.name)}</div>
        <div class="product-bottom"><span class="price">${rupiah(p.price)}</span><button class="add" data-add="${p.id}" aria-label="Tambah ${esc(p.name)}">+</button></div>
      </div>
    </article>`).join("") || `<div class="empty-state">Produk tidak ditemukan.</div>`;
}

function bindSalesEvents(){
  $("search").oninput = e => { searchTerm = e.target.value; renderProductGrid(); };
  document.querySelectorAll(".category").forEach(b => b.onclick = () => {
    activeCat = b.dataset.cat; renderSales();
  });
  document.querySelectorAll("[data-add]").forEach(b => b.onclick = e => { e.stopPropagation(); add(Number(b.dataset.add)); });
  document.querySelectorAll("[data-add-card]").forEach(c => c.onclick = () => add(Number(c.dataset.addCard)));
  $("clearCart").onclick = () => { cart=[]; renderCart(); toast("Keranjang dikosongkan"); };
  document.querySelectorAll(".pay").forEach(b => b.onclick = () => {
    payment=b.dataset.pay; document.querySelectorAll(".pay").forEach(x=>x.classList.remove("active")); b.classList.add("active");
  });
  $("payBtn").onclick = checkout;
  $("pendingBtn").onclick = savePending;
}

function add(id){
  const p=products.find(x=>x.id===id); if(!p)return;
  const item=cart.find(x=>x.id===id);
  if(item) item.qty++; else cart.push({id,qty:1});
  toast(p.name+" ditambahkan ke keranjang");
  renderCart();
}
function change(id,delta){
  const item=cart.find(x=>x.id===id); if(!item)return;
  item.qty += delta;
  if(item.qty<=0) cart=cart.filter(x=>x.id!==id);
  renderCart();
}
function remove(id){ cart=cart.filter(x=>x.id!==id); renderCart(); }

function renderCart(){
  $("cartCount").textContent=cart.reduce((a,x)=>a+x.qty,0);
  $("cartItems").innerHTML = cart.length ? cart.map(item=>{
    const p=products.find(x=>x.id===item.id), price=finalPrice(p), line=price*item.qty;
    return `<div class="cart-item">
      <div class="cart-main">
        <div class="cart-img">${p.emoji}</div>
        <div><div class="cart-name">${esc(p.name)}</div>
        <div class="unit">${item.qty} × ${esc(p.unit)}</div>
        <div class="old-price">${rupiah(p.price)}</div>
        ${p.discount?`<div class="discount">${p.discount}% OFF</div>`:""}</div>
        <button class="trash" data-del="${p.id}" aria-label="Hapus">♜</button>
      </div>
      <div class="cart-bottom">
        <div class="qty"><button data-minus="${p.id}">−</button><span>${item.qty}</span><button data-plus="${p.id}">+</button></div>
        <strong class="line-price">${rupiah(line)}</strong>
      </div>
    </div>`;
  }).join("") : `<div class="empty-cart">Keranjang masih kosong<br><small>Klik produk untuk menambahkan pesanan.</small></div>`;

  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>remove(Number(b.dataset.del)));
  document.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>change(Number(b.dataset.minus),-1));
  document.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>change(Number(b.dataset.plus),1));
  updateSummary();
}
function updateSummary(){
  let subtotal=0, discount=0;
  cart.forEach(i=>{const p=products.find(x=>x.id===i.id); subtotal+=p.price*i.qty; discount+=(p.price-finalPrice(p))*i.qty;});
  const tax=(subtotal-discount)*.10, total=subtotal-discount+tax;
  $("subtotal").textContent=rupiah(subtotal);
  $("discount").textContent="- "+rupiah(discount);
  $("tax").textContent=rupiah(tax);
  $("total").textContent=rupiah(total);
}

function checkout(){
  if(!cart.length){toast("Keranjang masih kosong");return;}
  const total=getTotals().total;
  const sale={id:Date.now(),date:new Date().toISOString(),items:JSON.parse(JSON.stringify(cart)),payment,total};
  const sales=load(STORAGE.sales,[]); sales.unshift(sale); save(STORAGE.sales,sales);
  cart=[]; renderCart(); toast("Pembayaran "+payment+" berhasil • "+rupiah(total));
}
function savePending(){
  if(!cart.length){toast("Tidak ada pesanan untuk disimpan");return;}
  const pending=load(STORAGE.pending,[]);
  pending.unshift({id:Date.now(),date:new Date().toISOString(),items:JSON.parse(JSON.stringify(cart)),payment});
  save(STORAGE.pending,pending); cart=[]; renderCart(); toast("Pesanan disimpan sebagai pending");
}
function getTotals(){
  let subtotal=0,discount=0;
  cart.forEach(i=>{const p=products.find(x=>x.id===i.id);subtotal+=p.price*i.qty;discount+=(p.price-finalPrice(p))*i.qty;});
  const tax=(subtotal-discount)*.10; return {subtotal,discount,tax,total:subtotal-discount+tax};
}

function renderDashboard(){
  const sales=load(STORAGE.sales,[]), pending=load(STORAGE.pending,[]);
  const omzet=sales.reduce((a,s)=>a+s.total,0);
  $("appContent").innerHTML=`<div class="page-card wide">
    <div class="hero"><div><span class="eyebrow">RINGKASAN TOKO</span><h2>Kelola toko Anda lebih mudah</h2><p>Penjualan, produk, pelanggan, ekspedisi, pending dan diskon berada dalam satu aplikasi.</p><button class="primary" data-goto="penjualan">Buka Penjualan →</button></div><div class="hero-stat"><strong>${rupiah(omzet)}</strong><span>Total omzet tersimpan</span></div></div>
    <div class="stat-grid">
      <div class="stat"><span>Produk</span><strong>${products.length}</strong></div>
      <div class="stat"><span>Transaksi</span><strong>${sales.length}</strong></div>
      <div class="stat"><span>Pending</span><strong>${pending.length}</strong></div>
      <div class="stat"><span>Pelanggan</span><strong>${customers.length}</strong></div>
    </div>
    <div class="table-card"><h3>Transaksi Terakhir</h3>${sales.length?sales.slice(0,8).map(s=>`<div class="row"><span>${new Date(s.date).toLocaleString("id-ID")}</span><b>${s.payment}</b><strong>${rupiah(s.total)}</strong></div>`).join(""):`<div class="empty-state">Belum ada transaksi.</div>`}</div>
  </div>`;
  bindGoto();
}

function renderProductsPage(){
  $("appContent").innerHTML=`<div class="page-card wide">
    <div class="page-head"><div><h2>Produk</h2><p>Kelola nama, harga, stok, kategori dan satuan.</p></div><button class="primary" id="addProduct">+ Tambah Produk</button></div>
    <div class="table-card"><div class="data-table head"><span>Produk</span><span>Kategori</span><span>Satuan</span><span>Harga</span><span>Stok</span><span>Aksi</span></div>
    ${products.map(p=>`<div class="data-table"><span><b>${esc(p.emoji)} ${esc(p.name)}</b></span><span>${esc(p.cat)}</span><span>${esc(p.unit)}</span><span>${rupiah(p.price)}</span><span>${p.stock}</span><span><button class="small-btn" data-edit-product="${p.id}">Edit</button> <button class="small-btn danger" data-delete-product="${p.id}">Hapus</button></span></div>`).join("")}</div>
  </div>`;
  $("addProduct").onclick=()=>productForm();
  document.querySelectorAll("[data-edit-product]").forEach(b=>b.onclick=()=>productForm(Number(b.dataset.editProduct)));
  document.querySelectorAll("[data-delete-product]").forEach(b=>b.onclick=()=>{products=products.filter(p=>p.id!==Number(b.dataset.deleteProduct));save(STORAGE.products,products);renderProductsPage();toast("Produk dihapus")});
}
function productForm(id){
  const p=id?products.find(x=>x.id===id):{name:"",cat:"Makanan",unit:"pcs",price:0,discount:0,stock:0,emoji:"📦"};
  const name=prompt("Nama produk:",p.name); if(name===null)return;
  const price=Number(prompt("Harga:",p.price)); if(!Number.isFinite(price))return;
  const unit=prompt("Satuan (contoh: botol, karton, renteng):",p.unit)||p.unit;
  const stock=Number(prompt("Stok:",p.stock)); if(!Number.isFinite(stock))return;
  if(id){Object.assign(p,{name,price,unit,stock});} else products.push({...p,id:Date.now()});
  save(STORAGE.products,products);renderProductsPage();toast("Produk tersimpan");
}

function renderCustomersPage(){
  $("appContent").innerHTML=`<div class="page-card wide"><div class="page-head"><div><h2>Pelanggan</h2><p>Data pelanggan untuk transaksi dan pengiriman.</p></div><button class="primary" id="addCustomer">+ Tambah Pelanggan</button></div>
  <div class="table-card"><div class="data-table head"><span>Nama</span><span>Telepon</span><span>Alamat</span><span>Aksi</span></div>
  ${customers.map(c=>`<div class="data-table customer-row"><span><b>${esc(c.name)}</b></span><span>${esc(c.phone)}</span><span>${esc(c.address)}</span><span><button class="small-btn" data-edit-customer="${c.id}">Edit</button> <button class="small-btn danger" data-delete-customer="${c.id}">Hapus</button></span></div>`).join("")}</div></div>`;
  $("addCustomer").onclick=()=>customerForm();
  document.querySelectorAll("[data-edit-customer]").forEach(b=>b.onclick=()=>customerForm(Number(b.dataset.editCustomer)));
  document.querySelectorAll("[data-delete-customer]").forEach(b=>b.onclick=()=>{customers=customers.filter(c=>c.id!==Number(b.dataset.deleteCustomer));save(STORAGE.customers,customers);renderCustomersPage();});
}
function customerForm(id){
  const c=id?customers.find(x=>x.id===id):{name:"",phone:"",address:""};
  const name=prompt("Nama pelanggan:",c.name);if(name===null)return;
  const phone=prompt("Nomor telepon:",c.phone)||"";
  const address=prompt("Alamat:",c.address)||"";
  if(id)Object.assign(c,{name,phone,address});else customers.push({...c,id:Date.now()});
  save(STORAGE.customers,customers);renderCustomersPage();toast("Pelanggan tersimpan");
}

function renderShipmentsPage(){
  let shipments=load(STORAGE.shipments,[]);
  $("appContent").innerHTML=`<div class="page-card wide"><div class="page-head"><div><h2>Ekspedisi</h2><p>Kelola pengiriman pesanan.</p></div><button class="primary" id="addShipment">+ Tambah Pengiriman</button></div>
  <div class="table-card"><div class="data-table head"><span>Pelanggan</span><span>Kurir</span><span>Nomor Resi</span><span>Status</span><span>Aksi</span></div>
  ${shipments.map(s=>`<div class="data-table"><span>${esc(s.customer)}</span><span>${esc(s.courier)}</span><span>${esc(s.resi)}</span><span><span class="status">${esc(s.status)}</span></span><span><button class="small-btn" data-next-ship="${s.id}">Status berikutnya</button></span></div>`).join("")||`<div class="empty-state">Belum ada pengiriman.</div>`}</div></div>`;
  $("addShipment").onclick=()=>{const customer=prompt("Pelanggan:","Pelanggan Umum");if(customer===null)return;const courier=prompt("Kurir:","Kurir Toko")||"Kurir Toko";const resi=prompt("Nomor resi:","-")||"-";shipments.unshift({id:Date.now(),customer,courier,resi,status:"Diproses"});save(STORAGE.shipments,shipments);renderShipmentsPage();};
  document.querySelectorAll("[data-next-ship]").forEach(b=>b.onclick=()=>{const s=shipments.find(x=>x.id===Number(b.dataset.nextShip));s.status=s.status==="Diproses"?"Dikirim":s.status==="Dikirim"?"Selesai":"Selesai";save(STORAGE.shipments,shipments);renderShipmentsPage();});
}

function renderPendingPage(){
  const pending=load(STORAGE.pending,[]);
  $("appContent").innerHTML=`<div class="page-card wide"><div class="page-head"><div><h2>Resest</h2><p>Kelola pesanan yang disimpan / pending.</p></div></div>
  <div class="table-card">${pending.map(p=>`<div class="pending-row"><div><b>${new Date(p.date).toLocaleString("id-ID")}</b><small>${p.items.reduce((a,i)=>a+i.qty,0)} item • ${p.payment}</small></div><button class="small-btn" data-restore="${p.id}">Kembalikan</button><button class="small-btn danger" data-delete-pending="${p.id}">Hapus</button></div>`).join("")||`<div class="empty-state">Tidak ada pesanan pending.</div>`}</div></div>`;
  document.querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>{const all=load(STORAGE.pending,[]),p=all.find(x=>x.id===Number(b.dataset.restore));if(p){cart=JSON.parse(JSON.stringify(p.items));save(STORAGE.pending,all.filter(x=>x.id!==p.id));setPage("penjualan");toast("Pesanan dikembalikan ke keranjang")}});
  document.querySelectorAll("[data-delete-pending]").forEach(b=>b.onclick=()=>{const all=load(STORAGE.pending,[]);save(STORAGE.pending,all.filter(x=>x.id!==Number(b.dataset.deletePending)));renderPendingPage();});
}

function renderDiscountPage(){
  $("appContent").innerHTML=`<div class="page-card wide"><div class="page-head"><div><h2>Diskon</h2><p>Atur diskon tiap produk. Harga setelah diskon langsung mengikuti keranjang.</p></div></div>
  <div class="table-card"><div class="data-table head"><span>Produk</span><span>Harga awal</span><span>Diskon</span><span>Harga setelah diskon</span><span>Aksi</span></div>
  ${products.map(p=>`<div class="data-table"><span><b>${esc(p.name)}</b></span><span>${rupiah(p.price)}</span><span>${p.discount}%</span><span>${rupiah(finalPrice(p))}</span><span><button class="small-btn" data-discount="${p.id}">Ubah</button></span></div>`).join("")}</div></div>`;
  document.querySelectorAll("[data-discount]").forEach(b=>b.onclick=()=>{const p=products.find(x=>x.id===Number(b.dataset.discount));const d=Number(prompt("Diskon %:",p.discount));if(Number.isFinite(d)&&d>=0&&d<=100){p.discount=d;save(STORAGE.products,products);renderDiscountPage();toast("Diskon diperbarui")}});
}

function bindGoto(){document.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>setPage(b.dataset.goto));}

document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>setPage(b.dataset.page));
  $("hamburger").onclick=()=> $("sidebar").classList.toggle("open");
  $("hideSidebar").onclick=()=> $("sidebar").classList.remove("open");
  $("fullscreen").onclick=()=>document.documentElement.requestFullscreen?.().catch(()=>{});
  $("search").oninput=e=>{searchTerm=e.target.value;if(currentPage==="penjualan")renderSales();};
  document.addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("search").focus();}
    if(e.key==="F2"){e.preventDefault();if(currentPage==="penjualan")checkout();}
    if(e.key==="F3"){e.preventDefault();if(currentPage==="penjualan")savePending();}
  });
  const hash=location.hash.replace("#","");
  setPage(["dashboard","penjualan","produk","pelanggan","ekspedisi","resest","diskon"].includes(hash)?hash:"penjualan");
});
})();
