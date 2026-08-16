(function(){
"use strict";

var products=[
 {id:1,name:"Nasi Goreng Spesial",cat:"Makanan",price:25000,discount:10,unit:"piring",emoji:"🍛"},
 {id:2,name:"Es Teh Manis",cat:"Minuman",price:5000,discount:20,unit:"gelas",emoji:"🥤"},
 {id:3,name:"Kopi Latte",cat:"Minuman",price:18000,discount:15,unit:"cangkir",emoji:"☕"},
 {id:4,name:"Indomie Goreng",cat:"Makanan",price:4000,discount:0,unit:"bungkus",emoji:"🍜"},
 {id:5,name:"Aqua 600ml",cat:"Minuman",price:4000,discount:0,unit:"botol",emoji:"💧"},
 {id:6,name:"Wafer Tango",cat:"Snack",price:3000,discount:0,unit:"bungkus",emoji:"🍫"},
 {id:7,name:"Lays Classic",cat:"Snack",price:6000,discount:0,unit:"bungkus",emoji:"🥔"},
 {id:8,name:"Fanta Strawberry",cat:"Minuman",price:6000,discount:0,unit:"botol",emoji:"🥤"},
 {id:9,name:"Snack Kentang",cat:"Snack",price:6000,discount:0,unit:"piring",emoji:"🍘"}
];
var cart=[],activeCat="Semua",payment="Tunai";

function $(id){return document.getElementById(id)}
function rupiah(n){return "Rp "+Math.round(n).toLocaleString("id-ID")}
function finalPrice(p){return p.price*(1-p.discount/100)}

function renderProducts(){
 var q=($("search").value||"").toLowerCase();
 var list=products.filter(function(p){
   return (activeCat==="Semua"||p.cat===activeCat)&&
     (!q||p.name.toLowerCase().indexOf(q)>-1||p.cat.toLowerCase().indexOf(q)>-1);
 });
 $("productGrid").innerHTML=list.map(function(p){
   return '<article class="product"><div class="product-img">'+p.emoji+'</div><div class="product-info"><div class="product-name">'+p.name+'</div><div class="product-bottom"><span class="price">'+rupiah(p.price)+'</span><button class="add" data-add="'+p.id+'">+</button></div></div></article>';
 }).join("")||'<div style="grid-column:1/-1;padding:40px;text-align:center;color:#777">Produk tidak ditemukan.</div>';
 document.querySelectorAll("[data-add]").forEach(function(b){b.onclick=function(){add(+b.dataset.add)}});
}

function add(id){
 var p=products.find(function(x){return x.id===id});
 var item=cart.find(function(x){return x.id===id});
 if(item)item.qty++;
 else cart.push({id:id,qty:1});
 toast(p.name+" ditambahkan");
 renderCart();
}

function renderCart(){
 $("cartCount").textContent=cart.reduce(function(a,x){return a+x.qty},0);
 if(!cart.length){
   $("cartItems").innerHTML='<div style="padding:45px 10px;text-align:center;color:#7b829c">Keranjang masih kosong<br><small>Pilih produk untuk menambahkan pesanan.</small></div>';
 }else{
   $("cartItems").innerHTML=cart.map(function(item){
     var p=products.find(function(x){return x.id===item.id});
     var price=finalPrice(p), line=price*item.qty;
     return '<div class="cart-item">'+
       '<div class="cart-main"><div class="cart-img">'+p.emoji+'</div>'+
       '<div><div class="cart-name">'+p.name+'</div><div class="unit">'+item.qty+' × '+p.unit+'</div>'+
       '<div class="old-price">'+rupiah(p.price)+'</div>'+
       (p.discount?'<div class="discount">'+p.discount+'% OFF</div>':'')+
       '</div><button class="trash" data-del="'+p.id+'">♜</button></div>'+
       '<div class="cart-bottom"><div class="qty"><button data-minus="'+p.id+'">−</button><span>'+item.qty+'</span><button data-plus="'+p.id+'">+</button></div><strong class="line-price">'+rupiah(line)+'</strong></div></div>';
   }).join("");
   document.querySelectorAll("[data-del]").forEach(function(b){b.onclick=function(){remove(+b.dataset.del)}});
   document.querySelectorAll("[data-minus]").forEach(function(b){b.onclick=function(){change(+b.dataset.minus,-1)}});
   document.querySelectorAll("[data-plus]").forEach(function(b){b.onclick=function(){change(+b.dataset.plus,1)}});
 }
 updateSummary();
}

function change(id,delta){
 var item=cart.find(function(x){return x.id===id}); if(!item)return;
 item.qty+=delta; if(item.qty<=0)cart=cart.filter(function(x){return x.id!==id});
 renderCart();
}
function remove(id){cart=cart.filter(function(x){return x.id!==id});renderCart()}
function updateSummary(){
 var subtotal=0,discount=0;
 cart.forEach(function(item){var p=products.find(function(x){return x.id===item.id});subtotal+=p.price*item.qty;discount+=(p.price-finalPrice(p))*item.qty});
 var tax=(subtotal-discount)*.10,total=subtotal-discount+tax;
 $("subtotal").textContent=rupiah(subtotal);$("discount").textContent="- "+rupiah(discount);$("tax").textContent=rupiah(tax);$("total").textContent=rupiah(total);
}
function toast(msg){var t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(function(){t.classList.remove("show")},1600)}

document.addEventListener("DOMContentLoaded",function(){
 renderProducts();renderCart();
 $("search").addEventListener("input",renderProducts);
 document.querySelectorAll(".category").forEach(function(b){b.onclick=function(){activeCat=b.dataset.cat;document.querySelectorAll(".category").forEach(function(x){x.classList.remove("active")});b.classList.add("active");renderProducts()}});
 $("clearCart").onclick=function(){cart=[];renderCart();toast("Keranjang dikosongkan")};
 $("hamburger").onclick=function(){$("sidebar").classList.toggle("open")};
 $("hideSidebar").onclick=function(){$("sidebar").classList.remove("open")};
 $("fullscreen").onclick=function(){if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(function(){})};
 document.querySelectorAll(".pay").forEach(function(b){b.onclick=function(){payment=b.dataset.pay;document.querySelectorAll(".pay").forEach(function(x){x.classList.remove("active")});b.classList.add("active")}});
 $("payBtn").onclick=function(){toast(cart.length?"Pembayaran "+payment+" dipilih":"Keranjang masih kosong")};
 $("pendingBtn").onclick=function(){toast(cart.length?"Pesanan disimpan sebagai pending":"Tidak ada pesanan untuk disimpan")};
 document.addEventListener("keydown",function(e){
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("search").focus()}
   if(e.key==="F2"){e.preventDefault();$("payBtn").click()}
   if(e.key==="F3"){e.preventDefault();$("pendingBtn").click()}
 });
});
})();