(function(){
  const body = document.body;
  const base = body.dataset.base || "./";
  const LINE_URL = "https://line.me/ti/p/F2MWlK47xD";
  const WA_URL = "https://wa.me/886911252302?text=" + encodeURIComponent("你好，我想查詢揪好森露營住宿，請問以下日期是否可預約：");

  async function loadComponent(targetId, path){
    const el = document.getElementById(targetId);
    if(!el) return;
    const res = await fetch(path);
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

  function initFloatingContact(){
    if(document.querySelector(".site-fab")) return;
    const wrap = document.createElement("div");
    wrap.className = "site-fab";
    wrap.setAttribute("aria-label", "快速聯絡");
    wrap.innerHTML =
      '<a class="site-fab__link site-fab__wa" href="' + WA_URL + '" target="_blank" rel="noopener">WhatsApp</a>' +
      '<a class="site-fab__link site-fab__line" href="' + LINE_URL + '" target="_blank" rel="noopener">LINE</a>';
    document.body.appendChild(wrap);
  }

  function initFooterReviews(){
    const reviewsGrid = document.querySelector(".footer-reviews-grid");
    if(!reviewsGrid) return;

    const reviewPool = [
      { quote: "一區一組的包場感受非常明顯，從傍晚到深夜都能自在聊天，不用擔心被陌生人打擾。", author: "柔柔", source: "Google 評價" },
      { quote: "草地空間比想像中更大也很乾淨，孩子可以放心跑跳，大人也能在旁邊輕鬆休息與拍照。", author: "Jason", source: "Facebook 留言" },
      { quote: "帳篷內外整理得很舒服，床鋪好睡、動線清楚，隔天醒來還是會想再多待一下。", author: "Nina", source: "Google 評價" },
      { quote: "從市區開車過來很順也不會太遠，採買補給方便，卻又能立刻切換到安靜的森林節奏。", author: "Vicky", source: "Google 評價" },
      { quote: "和朋友一起來聚會很剛好，白天草地活動、晚上聊天吃東西，整體氣氛輕鬆又自在。", author: "Tina", source: "IG 私訊回饋" },
      { quote: "環境安靜而且有隱私，拍照角度很多元，白天和夜晚都能拍出不同感覺的森林氛圍。", author: "Claire", source: "Google 評價" },
      { quote: "設備準備得很完整，第一次來露營也不會手忙腳亂，整體體驗對新手非常友善。", author: "阿哲", source: "Facebook 留言" },
      { quote: "最喜歡的是不需要和陌生人共用場地，整段住宿都能和家人慢慢相處、節奏很舒服。", author: "Mina", source: "Google 評價" }
    ];

    const picked = reviewPool
      .map(item => ({ ...item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 3)
      .map(({ quote, author, source }) => ({ quote, author, source }));

    reviewsGrid.innerHTML = picked
      .map(item => `
        <article class="footer-review-card">
          <div class="footer-review-rating">★★★★★</div>
          <p class="footer-review-quote">${item.quote}</p>
          <div class="footer-review-meta">
            <span class="footer-review-author">${item.author}</span>
            <span class="footer-review-source">${item.source}</span>
          </div>
        </article>
      `)
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
      initFloatingContact();
    }catch(err){
      console.warn(err);
    }
  });
})();
