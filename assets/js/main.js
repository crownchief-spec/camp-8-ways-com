(function(){
  const body = document.body;
  const base = body.dataset.base || "./";

  async function loadComponent(targetId, path){
    const el = document.getElementById(targetId);
    if(!el) return;
    const res = await fetch(path, {cache:"no-store"});
    if(!res.ok) throw new Error("Failed to load " + path);
    let html = await res.text();
    html = html.replaceAll("{{base}}", base);
    el.innerHTML = html;
  }

  function wireNav(){
    const toggle = document.querySelector("[data-nav-toggle]");
    const menu = document.querySelector("[data-nav-menu]");
    if(toggle && menu){
      toggle.addEventListener("click", ()=>{
        const open = menu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      });
      document.addEventListener("click", (e)=>{
        if(!toggle.contains(e.target) && !menu.contains(e.target)){
          menu.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        }
      });
      menu.addEventListener("click", (e)=>{
        if(e.target.closest("a")){
          menu.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        }
      });
    }

    document.querySelectorAll(".dropdown > button").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const parent = btn.closest(".dropdown");
        const isOpen = parent.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(isOpen));
      });
    });

    document.addEventListener("click", (e)=>{
      const dd = e.target.closest(".dropdown");
      document.querySelectorAll(".dropdown").forEach(d=>{
        if(d !== dd) d.classList.remove("open");
      });
    });
  }

  function heroVideoFallback(){
    const v = document.querySelector(".hero video");
    if(!v) return;
    v.addEventListener("error", ()=>{ v.style.display="none"; });
    const saveData = navigator.connection && navigator.connection.saveData;
    if(saveData){
      try{ v.pause(); v.removeAttribute("autoplay"); }catch(_){}
    }
  }

  function initSmoothScroll(){
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      const href = a.getAttribute("href");
      if(href === "#") return;
      const target = document.querySelector(href);
      if(target){
        a.addEventListener("click", function(e){
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          const menu = document.querySelector("[data-nav-menu]");
          if(menu) menu.classList.remove("open");
          document.body.style.overflow = "";
        });
      }
    });
  }

  function initFooterReviews(){
    const bubblesWrap = document.querySelector(".footer-review-bubbles");
    if(!bubblesWrap) return;

    const reviewPool = [
      "一區一組不被打擾，整晚聊天超放鬆。",
      "草地很大又乾淨，孩子活動空間很夠。",
      "帳篷舒適好睡，早上醒來心情超好。",
      "離市區不遠，開車抵達真的很方便。",
      "朋友聚會很剛好，氣氛輕鬆又自在。",
      "環境安靜有隱私，拍照每個角度都美。",
      "設備整理得很完整，新手也能輕鬆玩。",
      "包場感受很明顯，不會和陌生人擠在一起。"
    ];

    const picked = reviewPool
      .map(text => ({ text, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 3)
      .map(item => item.text);

    bubblesWrap.innerHTML = picked
      .map(text => `<div class="review-bubble">${text}</div>`)
      .join("");
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    try{
      await loadComponent("site-header", base + "components/header.html");
      await loadComponent("site-footer", base + "components/footer.html");
      wireNav();
      heroVideoFallback();
      initSmoothScroll();
      initFooterReviews();
    }catch(err){
      console.warn(err);
    }
  });
})();
