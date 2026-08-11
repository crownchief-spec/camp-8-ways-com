(function(){
  const body = document.body;
  const base = body.dataset.base || "./";

  function ensureLangSwitch(){
    if(window.JoyforestLangSwitch){
      return Promise.resolve();
    }
    return new Promise(function(resolve, reject){
      const existing = document.querySelector('script[data-lang-switch-loader="1"]');
      if(existing){
        existing.addEventListener("load", function(){ resolve(); }, { once: true });
        existing.addEventListener("error", function(){ reject(new Error("lang-switch.js failed")); }, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = base + "assets/js/lang-switch.js";
      script.dataset.langSwitchLoader = "1";
      script.onload = function(){ resolve(); };
      script.onerror = function(){ reject(new Error("lang-switch.js failed")); };
      document.head.appendChild(script);
    });
  }

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

  function initFooterReviews(){
    const reviewsGrid = document.querySelector(".footer-reviews-grid");
    if(!reviewsGrid) return;

    const isEn = (document.body.dataset.locale || "zh") === "en";
    const reviewPool = isEn ? [
      { quote: "The private stay feeling is very clear — from evening to late night we could chat freely without worrying about strangers.", author: "Yoyo", source: "Google Review" },
      { quote: "The lawn was bigger and cleaner than expected. Kids could run around while adults relaxed and took photos.", author: "Jason", source: "Facebook" },
      { quote: "The tent was comfortable, the bed slept well, and the layout was clear. We wanted to stay longer the next morning.", author: "Nina", source: "Google Review" },
      { quote: "Easy drive from the city, convenient shopping, yet instantly quiet forest pace.", author: "Vicky", source: "Google Review" },
      { quote: "Perfect for friends — lawn time by day, food and conversation at night. Relaxed and easy.", author: "Tina", source: "Message" },
      { quote: "Quiet and private with many photo angles — different forest moods day and night.", author: "Claire", source: "Google Review" },
      { quote: "Well prepared for first-time glamping guests. Very friendly experience.", author: "Alex", source: "Facebook" },
      { quote: "Best part: no sharing with strangers. Our family could slow down together.", author: "Mina", source: "Google Review" }
    ] : [
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

  function initFooterSeoRandomLinks(){
    const ul = document.getElementById("footer-seo-random-links");
    if(!ul) return;
    const isEn = (document.body.dataset.locale || "zh") === "en";
    const pool = isEn ? [
      { path: "en/seo/beginner-camping/", title: "Beginner Camping Guide｜First Outdoor Stay Tips" },
      { path: "en/seo/glamping-guide/", title: "Glamping in Taiwan Guide｜Comfort vs Camping" },
      { path: "en/seo/glamping-vs-camping/", title: "Glamping vs Traditional Camping" },
      { path: "en/seo/camping-gear/", title: "Camping Gear Checklist" },
      { path: "en/seo/family-camping/", title: "Family Camping Guide" },
      { path: "en/seo/choose-campsite/", title: "How to Choose the Right Campsite" },
      { path: "en/seo/yangmei-camping/", title: "Yangmei Camping and Outdoor Activities" },
      { path: "en/seo/night-camping-atmosphere/", title: "Night Camping and Outdoor Atmosphere" },
      { path: "en/seo/first-camping-trip/", title: "What to Prepare for Your First Camping Trip" },
      { path: "en/seo/pet-friendly-camping/", title: "Pet-Friendly Camping Guide" },
      { path: "en/seo/taoyuan-outdoor-activities/", title: "Weekend Outdoor Ideas from Taoyuan" },
      { path: "en/seo/nearby-attractions/", title: "Nearby Attractions and Trip Ideas" },
      { path: "en/seo/campervan-travel/", title: "Campervan Travel and Stay Guide" },
      { path: "en/seo/camping-photo-tips/", title: "How to Take Better Camping Photos" },
      { path: "en/seo/forest-outdoor-experience/", title: "Forest Activities and Outdoor Experiences" },
      { path: "en/seo/taoyuan-camping/", title: "Taoyuan Camping Guide" },
      { path: "en/seo/types-of-camping-taoyuan/", title: "Types of Camping in Taoyuan" },
      { path: "en/seo/one-day-vs-overnight-event/", title: "One-Day Event vs Two-Day Overnight Stay" },
      { path: "en/seo/family-camping-planning/", title: "How to Plan an Easier Family Camping Trip" },
      { path: "en/seo/forest-event-space/", title: "Why Forest-Style Event Spaces Are Attractive" }
    ] : [
      { path: "seo/beginner-camping.html", title: "露營新手入門｜第一次出發的心理與實務準備" },
      { path: "seo/taoyuan-glamping.html", title: "桃園豪華露營推薦｜更接近自然、更舒服" },
      { path: "seo/guide/glamping-vs-camping.html", title: "豪華露營與一般露營差在哪？" },
      { path: "seo/camping-gear.html", title: "露營裝備整理｜必帶、選配與季節" },
      { path: "seo/family-camping.html", title: "親子露營指南｜行程節奏、安全與睡眠" },
      { path: "seo/guide/how-to-choose-campsite.html", title: "怎麼挑選適合自己的露營區？" },
      { path: "seo/yangmei-camping.html", title: "楊梅露營區推薦｜交通方便、像包下森林" },
      { path: "seo/forest-camping.html", title: "桃園森林露營體驗｜樹林與草地之間" },
      { path: "seo/night-outdoor.html", title: "夜間露營與戶外氛圍｜燈光與聊天節奏" },
      { path: "seo/guide/first-camping-prep.html", title: "第一次露營要準備什麼？清單與心態" },
      { path: "seo/dome-glamping.html", title: "圓頂帳篷露營介紹｜更舒適的森林住宿" },
      { path: "seo/pet-friendly-camping.html", title: "寵物友善露營整理｜出發前該想好的事" },
      { path: "seo/guide/weekend-outdoor-taoyuan.html", title: "桃園出發的週末戶外靈感" },
      { path: "seo/nearby-attractions.html", title: "周邊景點與行程靈感｜桃園楊梅出發" },
      { path: "seo/campervan-stay.html", title: "桃園露營車住宿｜更自由的旅居方式" },
      { path: "seo/guide/camping-photo-tips.html", title: "露營拍照怎麼拍更好看？" },
      { path: "seo/forest-activities.html", title: "森林系活動與戶外體驗｜慢下來的感官" },
      { path: "seo/taoyuan-camping.html", title: "桃園露營區推薦｜安靜又有空間感" },
      { path: "seo/guide/taoyuan-camping-types.html", title: "桃園露營有哪些類型？山線、海岸與豪華露營" },
      { path: "seo/guide/one-day-vs-overnight.html", title: "一日戶外活動與兩天一夜差在哪？" },
      { path: "seo/guide/family-camping-easier.html", title: "親子露營怎麼安排更輕鬆？" },
      { path: "seo/guide/forest-space-charm.html", title: "森林系活動空間有什麼魅力？" }
    ];

    const count = 3 + Math.floor(Math.random() * 2);
    const picked = pool
      .map(function(item){ return { item: item, sort: Math.random() }; })
      .sort(function(a, b){ return a.sort - b.sort; })
      .slice(0, count)
      .map(function(x){ return x.item; });

    ul.innerHTML = picked.map(function(item){
      return "<li><a href=\"" + base + item.path + "\">" + item.title + "</a></li>";
    }).join("");
  }

  function initFacilityFilters(){
    const buttons = Array.from(document.querySelectorAll("[data-facility-filter]"));
    const cards = Array.from(document.querySelectorAll(".facility-equipment-card[data-locations]"));
    const result = document.querySelector(".facility-filter-result");
    if(!buttons.length || !cards.length) return;

    const labels = {
      all: "全部設備",
      balloon: "熱氣球房設備",
      cloud: "雲朵房設備",
      indoor: "帳篷內設備",
      lawn: "專屬草地設備"
    };

    function matches(locations, filter){
      if(filter === "all") return true;
      return locations.some(function(location){
        if(filter === "balloon") return location.startsWith("balloon-");
        if(filter === "cloud") return location.startsWith("cloud-");
        if(filter === "indoor") return location.endsWith("-indoor");
        if(filter === "lawn") return location.endsWith("-lawn");
        return false;
      });
    }

    buttons.forEach(function(button){
      button.addEventListener("click", function(){
        const filter = button.dataset.facilityFilter || "all";
        let visibleCount = 0;

        buttons.forEach(function(item){
          const active = item === button;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        cards.forEach(function(card){
          const locations = (card.dataset.locations || "").split(/\s+/).filter(Boolean);
          const visible = matches(locations, filter);
          card.hidden = !visible;
          if(visible) visibleCount += 1;
        });

        if(result){
          result.textContent = "目前顯示" + labels[filter] + "，共 " + visibleCount + " 項";
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async ()=>{
    try{
      await ensureLangSwitch();
      const locale = body.dataset.locale || "zh";
      const headerFile = locale === "en" ? "components/header-en.html" : "components/header.html";
      await loadComponent("site-header", base + headerFile);
      const footerFile = locale === "en" ? "components/footer-en.html" : "components/footer.html";
      await loadComponent("site-footer", base + footerFile);
      wireNav();
      if(window.JoyforestLangSwitch && window.JoyforestLangSwitch.initLangSwitchLinks){
        window.JoyforestLangSwitch.initLangSwitchLinks();
      }
      heroVideoFallback();
      initSmoothScroll();
      initFacilityFilters();
      initFooterReviews();
      initFooterSeoRandomLinks();
    }catch(err){
      console.warn(err);
    }
  });
})();
