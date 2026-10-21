export const campervanPersonas = [
  {
    id: "C01",
    name: "第一次租車的新手",
    questions: [
      { text: "你好，請問你們是露營車出租嗎？", expect: /自排自走式大型露營車/ },
      { text: "是自駕還是有司機接送？", expect: /自駕露營車出租/ },
      { text: "一般小客車駕照可以開嗎？", expect: /一般小客車駕照/ },
      { text: "第一次開會不會很難？", expect: /車高約 3 公尺/ },
      { text: "車子尺寸大概多大？", expect: /車長約 5 公尺/ },
      { text: "可以開進地下停車場嗎？", expect: /避開地下停車場/ },
      { text: "合法可以坐幾個人？", expect: /合法乘坐 6 人/ },
      { text: "那可以睡幾個人？", expect: /5 位成人|4 位成人加 2 位兒童/ },
      { text: "夏天有冷氣、冬天有暖氣嗎？", expect: /冷暖氣/ },
      { text: "官網完整介紹在哪裡看？", expect: /價格與車款|使用教學/ }
    ]
  },
  {
    id: "C02",
    name: "四大兩小親子家庭",
    questions: [
      { text: "我們四位大人兩位小孩，睡得下嗎？", expect: /4 位成人加 2 位兒童|4 大 2 小/ },
      { text: "兩張床分別多大？", expect: /200 × 200|180 × 150/ },
      { text: "行駛中小孩可以坐後面的餐桌區嗎？", expect: /停車後使用|繫安全帶/ },
      { text: "車上真的可以洗澡、有廁所嗎？", expect: /簡易衛浴/ },
      { text: "熱水跟 110 公升的水大概可以洗幾次？", expect: /4～8 次/ },
      { text: "馬桶要怎麼處理？", expect: /分解劑/ },
      { text: "水用完可以去哪裡補水？", expect: /可補水|露營區/ },
      { text: "有冷凍冷藏冰箱和卡式爐嗎？", expect: /70L|卡式爐/ },
      { text: "車上有微波爐或可以帶電鍋嗎？", expect: /沒有微波爐|不建議.*電鍋/ },
      { text: "你們會提供兒童安全座椅嗎？", expect: /兒童乘車安全|安全座椅/, pause: true, reason: "child_seat_request" }
    ]
  },
  {
    id: "C03",
    name: "先查日期與價格的客人",
    questions: [
      { text: "想租露營車，11/5 到 11/7 有空嗎？", expect: /目前即時日曆顯示尚有檔期/ },
      { text: "這樣符合三天兩夜的最低租期嗎？", expect: /3 天 2 夜／48 小時/ },
      { text: "平日三天兩夜多少錢？", expect: /11,800/ },
      { text: "那週五到週日的價格呢？", expect: /13,800/ },
      { text: "跨年連假的價格呢？", expect: /17,800/ },
      { text: "如果多租一天怎麼算？", expect: /2,800|4,800/ },
      { text: "超時一小時的費用是多少？", expect: /每小時 NT\$300/ },
      { text: "押金五千元是拿來做什麼？", expect: /不是事故責任上限/ },
      { text: "日曆有空就算正式保留露營車了嗎？", expect: /訂金後.*正式保留|確認訂金後/ },
      { text: "好的，那我要預訂這台露營車。", expect: /小編.*老闆.*確認/, pause: true, reason: "booking_confirmation" }
    ]
  },
  {
    id: "C04",
    name: "關心電力與冷氣的客人",
    questions: [
      { text: "露營車的生活用電要怎麼充？", expect: /露營區接外電|發電機/ },
      { text: "開車時引擎會幫生活電池充電嗎？", expect: /引擎本身不會/ },
      { text: "住露營區接電時會不會跳電？", expect: /降低充電速度|避免跳電/ },
      { text: "電量面板的 13.4V 大概是多少？", expect: /約 80%/ },
      { text: "冷氣只用電池可以開多久？", expect: /8～10 小時/ },
      { text: "車上有發電機嗎？", expect: /隨車發電機/ },
      { text: "露營車和發電機分別加什麼油？", expect: /柴油.*95 無鉛汽油/ },
      { text: "可以自己帶氣炸鍋或電磁爐嗎？", expect: /不建議.*氣炸鍋|高耗電/ },
      { text: "冬天晚上可以開暖氣嗎？", expect: /冷暖氣/ },
      { text: "電量快不夠時應該怎麼辦？", expect: /邊用邊補|外電|發電機/ }
    ]
  },
  {
    id: "C05",
    name: "關心水、料理與還車的客人",
    questions: [
      { text: "110 公升清水夠一家人洗澡嗎？", expect: /4～8 次/ },
      { text: "玩水後可以在車外沖腳嗎？", expect: /外部沖洗蓮蓬頭/ },
      { text: "車上的淋浴有熱水嗎？", expect: /冷熱水/ },
      { text: "馬桶可以丟一般濕紙巾嗎？", expect: /不要投入無法分解/ },
      { text: "簡易廚房可以煮哪些東西？", expect: /早餐|熱湯|咖啡|露營料理/ },
      { text: "冰箱有冷凍嗎，容量多大？", expect: /70L 冷藏冷凍/ },
      { text: "有提供棉被枕頭和牙刷毛巾嗎？", expect: /實際.*依當次租借方案/ },
      { text: "還車前是加柴油並補滿油嗎？", expect: /柴油/ },
      { text: "還車前要整理哪些東西？", expect: /個人物品|整理垃圾/ },
      { text: "我想延後兩小時還車，可以嗎？", expect: /小編.*老闆.*確認/, pause: true, reason: "special_request" }
    ]
  },
  {
    id: "C06",
    name: "第一次規劃車宿路線的客人",
    questions: [
      { text: "露營車旅行一定要住露營區嗎？", expect: /不一定|至少一半/ },
      { text: "為什麼第一晚建議住正規露營區？", expect: /補水|接電|洗澡|熟悉設備/ },
      { text: "一般停車場可以直接車宿嗎？", expect: /明確允許過夜/ },
      { text: "海邊停車場都可以過夜嗎？", expect: /不能把所有海邊/ },
      { text: "飯店停車場可以停露營車過夜嗎？", expect: /必須先取得飯店同意/ },
      { text: "在一般停車場可以把車邊帳和桌椅打開嗎？", expect: /一般停車場.*留在車內/ },
      { text: "你們可以幫我規劃三天兩夜行程嗎？", expect: /每天安排 1～2 個主要停留點/ },
      { text: "可以幫忙找接受露營車的營區嗎？", expect: /5 × 2 × 3 公尺/ },
      { text: "外國朋友看不懂中文地名怎麼導航？", expect: /Google Maps|Apple Maps/ },
      { text: "如果想跑阿里山或山路，行程怎麼排比較安全？", expect: /每天只排 1～2 個主要停留點|官方道路與天候/ }
    ]
  },
  {
    id: "C07",
    name: "帶寵物且在意規則的客人",
    questions: [
      { text: "露營車可以帶狗狗嗎？", expect: /中小型犬/ },
      { text: "寵物清潔費是多少？", expect: /NT\$800/ },
      { text: "寵物清潔費包含什麼？", expect: /NT\$800|基本美容/ },
      { text: "如果是貓咪也可以嗎？", expect: /中小型犬.*確認|其他細節.*確認/ },
      { text: "車內可以抽菸嗎？", expect: /全車禁菸/ },
      { text: "下雨天車內還能正常使用嗎？", expect: /車內可正常使用/ },
      { text: "投影機跟燈串淋到雨可以嗎？", expect: /避免淋雨/ },
      { text: "風很大時可以打開車邊帳嗎？", expect: /強風.*不要展開/ },
      { text: "如果把投影設備弄壞或弄丟怎麼辦？", expect: /實際修復或更換成本/ },
      { text: "你們真的很貴，可以再算便宜一點嗎？", expect: /小編.*老闆.*確認|預算考量/, pause: true, reason: "special_request" }
    ]
  },
  {
    id: "C08",
    name: "外國旅客與異地交還車詢問",
    questions: [
      { text: "台北可以到府交車嗎？", expect: /台北到府|台北.*約定地點/ },
      { text: "桃園可以送車嗎？", expect: /桃園/ },
      { text: "新竹也能安排交車嗎？", expect: /新竹/ },
      { text: "可以直接在桃園機場交車嗎？", expect: /航廈|停車區/ },
      { text: "旅程結束可以在飯店還車嗎？", expect: /飯店地點|還車時間/ },
      { text: "外國旅客要帶國際駕照和護照嗎？", expect: /有效護照.*國際駕照.*本國駕照/ },
      { text: "可以用英文詢問和接受英文教學嗎？", expect: /英文|English|WhatsApp/ },
      { text: "租車有里程限制嗎？", expect: /不限里程/ },
      { text: "交車城市和還車城市需要分開寫嗎？", expect: /都要分開寫清楚/ },
      { text: "台北交車、台南異地還車可以嗎？", expect: /小編.*老闆.*確認/, pause: true, reason: "special_request" }
    ]
  },
  {
    id: "C09",
    name: "想要影音與車邊氣氛的客人",
    questions: [
      { text: "有網美露營套組嗎？", expect: /網美露營套組/ },
      { text: "影音娛樂套組有哪些東西？", expect: /投影|Switch|卡拉 OK/ },
      { text: "iPhone 可以無線投影嗎？", expect: /Eshare|AirPlay/ },
      { text: "Netflix 投影只有聲音沒有畫面怎麼辦？", expect: /版權保護限制|HDMI/ },
      { text: "有 Nintendo Switch 可以玩嗎？", expect: /Switch/ },
      { text: "戶外桌椅和燈串可以在路邊使用嗎？", expect: /營區|明確允許/ },
      { text: "兩個套組加購多少錢？", expect: /NT\$3,800/ },
      { text: "留五星 Google 評論可以免費換套組嗎？", expect: /不以評論或指定星等交換/ },
      { text: "投影機和 Switch 每次都保證有嗎？", expect: /依庫存|逐項確認/ },
      { text: "可以幫我做生日客製佈置嗎？", expect: /小編.*老闆.*確認/, pause: true, reason: "special_request" }
    ]
  },
  {
    id: "C10",
    name: "接近預訂並詢問保障的客人",
    questions: [
      { text: "租之前可以先到現場看車嗎？", expect: /目前不提供現場看車/ },
      { text: "如果要預約，需要先提供哪些資料？", expect: /姓名|手機|租借日期/ },
      { text: "露營車 11/20 到 11/22 有空嗎？", expect: /可候補狀態/ },
      { text: "可候補代表什麼？", expect: /尚未完成正式保留/ },
      { text: "露營車有保險嗎？", expect: /2,000 萬/ },
      { text: "如果發生事故怎麼辦？", expect: /立即報警|通知揪好森/ },
      { text: "輕微樹枝刮痕也會收費嗎？", expect: /正常使用|不會隨意收費/ },
      { text: "押金五千是不是代表最多只賠五千？", expect: /不是事故責任上限/ },
      { text: "如果取消或改期，要怎麼處理？", expect: /小編.*老闆.*確認|核對/, pause: true, reason: "booking_policy" },
      { text: "我已經付訂金了。", expect: /圖片內容與相關資料|老闆.*確認/, pause: true, reason: "payment_confirmation", resumeBefore: true }
    ]
  }
];

export const totalQuestionCount = campervanPersonas.reduce(
  (total, persona) => total + persona.questions.length,
  0
);
