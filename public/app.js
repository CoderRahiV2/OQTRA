const $ = (s) => document.querySelector(s);
let config = null, selectedCoupon = null, selectedService = null;
const money = n => "৳" + Number(n || 0).toLocaleString("en-BD");
const phone = n => { let p=String(n||"").replace(/\D/g,""); if(p.startsWith("0"))p="88"+p; else if(!p.startsWith("880"))p="880"+p; return p; };
function themeInit(){const saved=localStorage.getItem("nova-theme");if(saved)document.documentElement.dataset.theme=saved;$("#themeToggle").textContent=document.documentElement.dataset.theme==="light"?"☾":"☼";}
$("#themeToggle").addEventListener("click",()=>{const next=document.documentElement.dataset.theme==="light"?"dark":"light";document.documentElement.dataset.theme=next;localStorage.setItem("nova-theme",next);$("#themeToggle").textContent=next==="light"?"☾":"☼";});
$("#menuToggle").addEventListener("click",()=>$("#navLinks")?.classList.toggle("open"));
async function init(){
 themeInit();$("#year").textContent=new Date().getFullYear();
 try{const r=await fetch("/.netlify/functions/public-config");if(!r.ok)throw Error();config=await r.json();renderConfig();}
 catch(e){$("#serviceGrid").innerHTML='<p class="loading">Could not load services. Please refresh the page.</p>';}
}
function renderConfig(){
 const s=config.settings;$("#brandName").textContent=s.brand;$("#footerBrand").textContent=s.brand;$("#footerName").textContent=s.brand;$("#announcement").textContent=s.announcement;
 $("#directWhatsApp").href=`https://wa.me/${phone(s.whatsapp)}`;
 const grid=$("#serviceGrid"), select=$("#serviceSelect");
 grid.innerHTML="";select.innerHTML='<option value="">Select a service</option>';
 config.services.forEach(x=>{
  const card=document.createElement("article");card.className="service-card";
  card.innerHTML=`<div class="service-top"><span class="service-icon">${x.icon}</span><span class="service-category">${x.category}</span></div><h3>${x.name}</h3><p>${x.description}</p><div class="service-bottom"><div><span class="price-label">${x.unit}</span><span class="service-price">${money(x.price)} <small>BDT</small></span></div><button class="service-choose" data-service="${x.id}">Choose service ↗</button></div>`;
  grid.append(card);const opt=document.createElement("option");opt.value=x.id;opt.textContent=`${x.name} — ${money(x.price)}+`;select.append(opt);
 });
 document.querySelectorAll("[data-service]").forEach(b=>b.addEventListener("click",()=>{select.value=b.dataset.service;select.dispatchEvent(new Event("change"));$("#order").scrollIntoView({behavior:"smooth"});}));
 const links=[["Email",s.gmail?`mailto:${s.gmail}`:""],["Facebook",s.facebook],["Instagram",s.instagram],["More",s.otherLink]].filter(x=>x[1]);
 $("#socialLinks").innerHTML=links.map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join("");
 renderDemos(config.demos || []);
 updatePrice();
}
function renderDemos(demos){
 const grid=$("#demoGrid");
 if(!grid) return;
 if(!demos.length){grid.innerHTML='<div class="demo-empty">Project examples will appear here soon. Check back to explore our videos, live project links and PDF case studies.</div>';return;}
 grid.innerHTML=demos.map(d=>`<article class="demo-card"><div class="demo-card-top"><span class="service-icon">↗</span><span class="demo-tag">${escapeHtml(d.category || "PROJECT")}</span></div><h3>${escapeHtml(d.title)}</h3><p>${escapeHtml(d.description)}</p><div class="demo-actions">${d.videoUrl?`<a href="${safeHref(d.videoUrl)}" target="_blank" rel="noopener">▶ Watch video</a>`:""}<a href="${safeHref(d.projectUrl)}" target="_blank" rel="noopener">↗ View project</a><a href="${safeHref(d.pdfUrl)}" target="_blank" rel="noopener">↓ View PDF</a></div></article>`).join("");
}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function safeHref(value){try{const u=new URL(value,location.origin);return ["http:","https:"].includes(u.protocol)?u.href:"#";}catch{return "#";}}

$("#serviceSelect").addEventListener("change",()=>{selectedService=$("#serviceSelect").value;selectedCoupon=null;$("#couponMessage").textContent="Have a discount code? Add it here.";updatePrice();});
function currentService(){return config?.services.find(x=>x.id===$("#serviceSelect").value);}
function updatePrice(calc){const s=currentService();const subtotal=s?.price||0;const discount=calc?.discount||0;const total=calc?.total??subtotal;$("#subtotal").textContent=s?money(subtotal):"৳—";$("#discount").textContent="−"+money(discount);$("#discountRow").classList.toggle("hidden",!discount);$("#total").textContent=s?money(total):"৳—";const advance=calc?.waiveAdvance?0:Math.ceil(total*((config?.settings?.advancePercent??10)/100));$("#advance").textContent=s?(calc?.waiveAdvance?"৳0 — waived":money(advance)):"৳—";}
$("#applyCoupon").addEventListener("click",async()=>{const code=$("#couponInput").value.trim(),serviceId=$("#serviceSelect").value;const msg=$("#couponMessage");if(!serviceId){msg.textContent="Choose a service first.";return;}if(!code){selectedCoupon=null;msg.textContent="Enter a coupon code.";updatePrice();return;}const btn=$("#applyCoupon");btn.disabled=true;msg.textContent="Checking code…";try{const r=await fetch("/.netlify/functions/validate-coupon",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,serviceId})});const d=await r.json();if(!d.valid)throw Error(d.message);selectedCoupon={code:d.code,...d};msg.textContent=d.message+(d.waiveAdvance?" Advance payment waived!":"");updatePrice(d);}catch(e){selectedCoupon=null;msg.textContent=e.message||"Could not validate coupon.";updatePrice();}finally{btn.disabled=false;}});
$("#orderForm").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,fd=new FormData(form),payload=Object.fromEntries(fd.entries());payload.coupon=selectedCoupon?.code||"";const btn=$("#submitBtn"),status=$("#formStatus");btn.disabled=true;btn.textContent="Preparing your request…";status.textContent="";
 try{const r=await fetch("/.netlify/functions/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw Error(d.error||"Could not submit request.");const o=d.order;const msg=`Hello ${d.settings.brand}! I'd like to discuss a project.%0A%0A*Order ID:* ${encodeURIComponent(o.id)}%0A*Name:* ${encodeURIComponent(o.name)}%0A*WhatsApp:* ${encodeURIComponent(o.contact)}%0A*Service:* ${encodeURIComponent(currentService()?.name||o.serviceId)}%0A*Starting price:* ${encodeURIComponent(money(o.subtotal))}%0A*Discount:* ${encodeURIComponent(money(o.discount))}%0A*Estimated total:* ${encodeURIComponent(money(o.total))}%0A*Advance:* ${encodeURIComponent(o.advanceWaived?"Waived":money(o.advance))}%0A*Coupon:* ${encodeURIComponent(o.coupon||"None")}%0A*Details:* ${encodeURIComponent(o.details||"Not provided")}`;
 status.textContent="Request saved! Opening WhatsApp…";window.open(`https://wa.me/${phone(d.settings.whatsapp)}?text=${msg}`,"_blank","noopener");
 form.reset();selectedCoupon=null;selectedService=null;$("#couponMessage").textContent="Have a discount code? Add it here.";updatePrice();
 }catch(err){status.textContent=err.message;status.classList.add("toast-error");}finally{btn.disabled=false;btn.innerHTML='Continue to WhatsApp <span>↗</span>';}
});
init();
