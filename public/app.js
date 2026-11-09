const $ = (s) => document.querySelector(s);
let config = null, selectedCoupon = null, selectedService = null;
const money = n => "৳" + Number(n || 0).toLocaleString("en-BD");
const phone = n => { let p=String(n||"").replace(/\D/g,""); if(p.startsWith("0"))p="88"+p; else if(!p.startsWith("880"))p="880"+p; return p; };
function themeInit(){const saved=localStorage.getItem("oqtra-theme");if(saved)document.documentElement.dataset.theme=saved;$("#themeToggle").textContent=document.documentElement.dataset.theme==="light"?"☾":"☼";}
$("#themeToggle").addEventListener("click",()=>{const next=document.documentElement.dataset.theme==="light"?"dark":"light";document.documentElement.dataset.theme=next;localStorage.setItem("oqtra-theme",next);$("#themeToggle").textContent=next==="light"?"☾":"☼";});
$("#menuToggle").addEventListener("click",()=>$("#navLinks")?.classList.toggle("open"));
async function init(){
 themeInit();$("#year").textContent=new Date().getFullYear();
 try{const r=await fetch("/.netlify/functions/public-config");if(!r.ok)throw Error();config=await r.json();renderConfig();}
 catch(e){$("#serviceGrid").innerHTML='<p class="loading">সার্ভিস লোড করা যায়নি। অনুগ্রহ করে পেজটি রিফ্রেশ করুন। / Could not load services.</p>';}
}
function renderConfig(){
 const s=config.settings;$("#brandName").textContent=s.brand;$("#footerBrand").textContent=s.brand;$("#footerName").textContent=s.brand;$("#announcement").textContent=s.announcement;
 $("#directWhatsApp").href=`https://wa.me/${phone(s.whatsapp)}`;
 const grid=$("#serviceGrid"), select=$("#serviceSelect");
 grid.innerHTML="";select.innerHTML='<option value="">Select a service</option>';
 config.services.forEach(x=>{
  const bn=serviceBangla[x.id]||{};
  const card=document.createElement("article");card.className="service-card";card.tabIndex=0;card.setAttribute("role","link");card.setAttribute("aria-label",`View details for ${x.name}`);
  card.innerHTML=`<div class="service-top"><span class="service-icon">${x.icon}</span><span class="service-category">${escapeHtml(x.category)}</span></div><h3>${escapeHtml(x.name)}</h3><p>${escapeHtml(x.description)}<br><span class="service-bangla" lang="bn">${escapeHtml(bn.short||"আপনার প্রয়োজন অনুযায়ী সৃজনশীল ও মানসম্মত সমাধান।")}</span></p><div class="service-bottom"><div><span class="price-label">${x.unit} · শুরু</span><span class="service-price">${money(x.price)} <small>BDT</small></span></div><button class="service-choose" type="button" data-details="${x.id}">বিস্তারিত দেখুন / Learn more ↗</button></div>`;
  grid.append(card);const opt=document.createElement("option");opt.value=x.id;opt.textContent=`${x.name} — ${money(x.price)}+`;select.append(opt);
  card.addEventListener("click",()=>showServiceDetails(x));
  card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();showServiceDetails(x);}});
 });
 const links=[["Email",s.gmail?`mailto:${s.gmail}`:""],["Facebook",s.facebook],["Instagram",s.instagram],["More",s.otherLink]].filter(x=>x[1]);
 $("#socialLinks").innerHTML=links.map(([n,u])=>`<a href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join("");
 renderProjects(config.projects || []);renderReviews(config.reviews || []);
 updatePrice();
}

const serviceBangla={
 presentation:{short:"অ্যাসাইনমেন্ট, সেমিনার ও ক্লাস প্রেজেন্টেশনের জন্য সুন্দর স্লাইড।",detail:"আপনার টপিক ও নির্দেশনা অনুযায়ী সাজানো, পড়তে সহজ এবং উপস্থাপনায় আত্মবিশ্বাস বাড়ায় এমন স্লাইড তৈরি করা হবে।",includes:["কনটেন্ট অনুযায়ী স্লাইড সাজানো","পরিষ্কার টাইপোগ্রাফি ও ভিজ্যুয়াল হায়ারার্কি","PowerPoint / PDF ফরম্যাটে ডেলিভারি"]},
 "ai-ad":{short:"আপনার পণ্য বা সার্ভিসের জন্য নজরকাড়া AI বিজ্ঞাপন।",detail:"সোশ্যাল মিডিয়া ও ডিজিটাল প্রচারের জন্য আকর্ষণীয় বিজ্ঞাপনের ধারণা, ভিজ্যুয়াল ও কপি তৈরি করা হবে।",includes:["বিজ্ঞাপনের কনসেপ্ট ও মেসেজিং","AI-সহায়তায় ভিজ্যুয়াল তৈরি","প্ল্যাটফর্ম অনুযায়ী কপি/ক্যাপশন"]},
 content:{short:"ব্র্যান্ড ও সোশ্যাল মিডিয়ার জন্য লক্ষ্যভিত্তিক কনটেন্ট।",detail:"আপনার অডিয়েন্স, ব্র্যান্ডের টোন এবং কনটেন্টের উদ্দেশ্য অনুযায়ী লেখা ও ক্রিয়েটিভ কনটেন্ট তৈরি করা হবে।",includes:["ক্যাপশন ও পোস্ট কপি","ব্র্যান্ড টোন অনুযায়ী লেখা","প্রয়োজন অনুযায়ী কনটেন্ট আইডিয়া"]},
 portfolio:{short:"নিজের কাজ ও দক্ষতা তুলে ধরার আধুনিক অনলাইন পোর্টফোলিও।",detail:"শিক্ষার্থী, ফ্রিল্যান্সার ও প্রফেশনালদের জন্য responsive personal portfolio, Netlify hosting-এ প্রকাশের ব্যবস্থা।",includes:["নিজের পরিচিতি ও দক্ষতার সেকশন","প্রজেক্ট/কাজের গ্যালারি ও যোগাযোগ লিংক","মোবাইল-ফ্রেন্ডলি ডিজাইন ও Netlify deployment"]},
 business:{short:"আপনার ব্যবসার জন্য বিশ্বাসযোগ্য ও প্রফেশনাল ওয়েব উপস্থিতি।",detail:"আপনার সার্ভিস, ব্যবসার তথ্য এবং যোগাযোগের মাধ্যম সুন্দরভাবে তুলে ধরার জন্য দ্রুত ও responsive business website।",includes:["সার্ভিস ও About সেকশন","যোগাযোগ ও সোশ্যাল লিংক","মোবাইল-ফ্রেন্ডলি লেআউট ও basic SEO"]},
 custom:{short:"আপনার নির্দিষ্ট আইডিয়া ও লক্ষ্য অনুযায়ী কাস্টম ওয়েবসাইট।",detail:"আপনার প্রয়োজন, ফিচার এবং ব্র্যান্ড পরিচয়ের ওপর ভিত্তি করে পরিকল্পিত ওয়েবসাইট। কাজ শুরুর আগে scope ও quotation নিশ্চিত করা হবে।",includes:["প্রয়োজন অনুযায়ী পেজ ও ফিচার","কাস্টম ডিজাইন ও responsive layout","প্রজেক্ট অনুযায়ী deployment ও handover"]}
};
function showServiceDetails(service){
 const d={...(serviceBangla[service.id]||{}),...service};const panel=$("#serviceDetail");
 panel.innerHTML=`<div class="detail-copy"><span class="eyebrow">${escapeHtml(service.category)} · ${escapeHtml(service.name)}</span><h2>${escapeHtml(service.name)}<br><span class="muted" lang="bn">${escapeHtml(d.short||service.description)}</span></h2><p>${escapeHtml(service.description)}</p><p lang="bn">${escapeHtml(d.detail||service.description)}</p><h3>What you can expect · যা যা পাবেন</h3><ul>${(d.includes||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul><div class="detail-price">Starting at <strong>${money(service.price)}</strong></div><button class="btn btn-primary" id="detailOrder">এই সার্ভিসটি অর্ডার করুন / Order this service ↗</button></div>`;
 panel.classList.remove("hidden");$("#service-details").scrollIntoView({behavior:"smooth",block:"start"});
 $("#detailOrder").addEventListener("click",()=>{$("#serviceSelect").value=service.id;$("#serviceSelect").dispatchEvent(new Event("change"));$("#order").scrollIntoView({behavior:"smooth"});});
}

function renderProjects(projects){
 const grid=$("#projectGrid"); if(!grid)return;
 if(!projects.length){grid.innerHTML='<div class="demo-empty">Demo Work শিগগিরই এখানে যুক্ত করা হবে। আমাদের কাজের নমুনা দেখুন।</div>';return;}
 grid.innerHTML=projects.map(d=>{const yt=toYouTubeEmbed(d.youtubeUrl);return `<article class="demo-card">${d.imageUrl?`<img class="demo-work-image" src="${safeHref(d.imageUrl)}" alt="${escapeHtml(d.title)} — OQTRA demo work screenshot" loading="lazy" decoding="async">`:""}${d.videoUrl?`<div class="demo-video-wrap"><video class="demo-short-video" controls playsinline preload="metadata" src="${safeHref(d.videoUrl)}"></video>${d.youtubeUrl?`<a class="youtube-full-cta" href="${safeHref(d.youtubeUrl)}" target="_blank" rel="noopener noreferrer"><span class="youtube-cta-icon">▶</span><span><strong>Watch full video at YouTube</strong><small>সম্পূর্ণ ভিডিওটি YouTube-এ দেখুন</small></span><span class="youtube-cta-arrow">↗</span></a>`:""}</div>`:yt?`<div class="demo-video-wrap"><iframe class="demo-youtube-embed" src="${yt}" title="${escapeHtml(d.title)} — YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`:""}<div class="demo-card-top"><span class="service-icon">↗</span><span class="demo-tag">${escapeHtml(d.category||"DEMO WORK")}</span></div><h3>${escapeHtml(d.title)}</h3>${d.description?`<p>${escapeHtml(d.description)}</p>`:""}${d.pdfUrl?`<div class="demo-actions"><a href="${safeHref(d.pdfUrl)}" target="_blank" rel="noopener">↗ View project PDF / PDF দেখুন</a></div>`:""}${d.projectUrl?`<div class="demo-actions"><a href="${safeHref(d.projectUrl)}" target="_blank" rel="noopener">↗ লাইভ প্রজেক্ট দেখুন / View project</a></div>`:""}</article>`}).join("");
}
function renderReviews(reviews){const grid=$("#reviewGrid");if(!grid)return;if(!reviews.length){grid.innerHTML='<div class="demo-empty">এখনো কোনো verified buyer review প্রকাশিত হয়নি।</div>';return;}grid.innerHTML=reviews.map(r=>`<article class="demo-card"><div class="demo-card-top"><span class="demo-tag">VERIFIED BUYER</span><span>${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</span></div><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.message)}</p><small>${escapeHtml(r.serviceId||"")} · Verified completed order</small></article>`).join("");}
$("#reviewForm")?.addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,btn=form.querySelector("button[type=submit]"),status=$("#reviewStatus");btn.disabled=true;status.textContent="Submitting review…";try{const payload=Object.fromEntries(new FormData(form).entries());const r=await fetch("/.netlify/functions/reviews",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw Error(d.error||"Could not submit review.");status.textContent=d.message;form.reset();}catch(err){status.textContent=err.message;}finally{btn.disabled=false;}});
function toYouTubeEmbed(value){try{const u=new URL(value);let id="";if(u.hostname.includes("youtu.be"))id=u.pathname.slice(1);else if(u.hostname.includes("youtube.com")){if(u.pathname.startsWith("/embed/"))id=u.pathname.split("/")[2];else id=u.searchParams.get("v")||"";}return /^[A-Za-z0-9_-]{6,20}$/.test(id)?`https://www.youtube-nocookie.com/embed/${id}`:"";}catch{return "";}}
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
