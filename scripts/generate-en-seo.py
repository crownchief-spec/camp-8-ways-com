#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEO_SRC = ROOT / "seo"
SEO_EN = ROOT / "en" / "seo"
SITE = "https://camp.8-ways.com"

CATEGORY_MAP = {
    "taoyuan-camping.html": "taoyuan-camping.html",
    "yangmei-camping.html": "yangmei-camping.html",
    "taoyuan-glamping.html": "glamping-guide.html",
    "family-camping.html": "family-camping.html",
    "pet-friendly-camping.html": "pet-friendly-camping.html",
    "campervan-stay.html": "campervan-travel.html",
    "beginner-camping.html": "beginner-camping.html",
    "camping-gear.html": "camping-gear.html",
    "nearby-attractions.html": "nearby-attractions.html",
    "forest-activities.html": "forest-outdoor-experience.html",
    "night-outdoor.html": "night-camping-atmosphere.html",
}

GUIDE_MAP = {
    "first-camping-prep": "first-camping-trip",
    "how-to-choose-campsite": "choose-campsite",
    "glamping-vs-camping": "glamping-vs-camping",
    "campervan-who": "who-campervan-travel",
    "family-camping-easier": "family-camping-planning",
    "pet-camping-notes": "camping-with-pets",
    "weekend-outdoor-taoyuan": "taoyuan-outdoor-activities",
    "forest-space-charm": "forest-event-space",
    "small-group-events": "small-private-event-planning",
    "night-outdoor-mood": "night-outdoor-atmosphere",
    "outdoor-vs-indoor-gathering": "outdoor-vs-indoor-gathering",
    "camping-photo-tips": "camping-photo-tips",
    "taoyuan-camping-types": "types-of-camping-taoyuan",
    "one-day-vs-overnight": "one-day-vs-overnight-event",
    "camping-faq-general": "common-camping-questions",
    "yangmei-easy-outings": "easy-yangmei-outdoor-trips",
}

CATEGORY_META = {
    "taoyuan-camping.html": ("Taoyuan Camping Guide | Quiet Forest Camping Near Taipei", "Find practical Taoyuan camping planning ideas with route efficiency, private-space logic, and outdoor stay suggestions near Taipei."),
    "yangmei-camping.html": ("Yangmei Camping Guide | Easy-Access Forest Stay Ideas", "Explore Yangmei camping and nearby outdoor activity planning for short trips, family weekends, and low-friction nature breaks."),
    "glamping-guide.html": ("Taiwan Glamping Guide | Compare Glamping and Camping Styles", "Compare glamping and traditional camping by comfort, effort, and schedule fit so you can choose the right weekend format."),
    "family-camping.html": ("Family Camping Guide | Child-Friendly Outdoor Trip Planning", "Plan a smoother family camping trip with better pacing, realistic expectations, and practical kid-friendly activity flow."),
    "pet-friendly-camping.html": ("Pet-Friendly Camping Guide | Outdoor Trip Tips with Pets", "Prepare for camping with pets using practical etiquette, safety boundaries, and low-stress planning around shared outdoor spaces."),
    "campervan-travel.html": ("Campervan Travel Guide | Who Campervan Trips Fit Best", "Understand who campervan travel is best for, what trade-offs to expect, and how to plan flexible overnight routes."),
    "beginner-camping.html": ("Beginner Camping Guide | First Outdoor Stay Checklist", "Use this beginner camping guide to simplify your first outdoor overnight stay with clear preparation priorities and practical steps."),
    "camping-gear.html": ("Camping Gear Guide | Essentials and Smart Add-Ons", "Sort camping gear into essentials, optional upgrades, and seasonal add-ons for better packing and lower stress."),
    "nearby-attractions.html": ("Nearby Attractions Guide | Outdoor Routes Around Yangmei", "Build low-friction nearby attraction routes around Yangmei and Taoyuan while keeping your camping rhythm relaxed."),
    "forest-outdoor-experience.html": ("Forest Outdoor Experience Guide | Activity and Event Ideas", "See how private forest spaces support small outdoor gatherings, celebration moments, and slower group experiences."),
    "night-camping-atmosphere.html": ("Night Camping Atmosphere Guide | Lighting and Flow Tips", "Create a better night camping atmosphere with practical lighting layers, seating flow, and group comfort planning."),
}

GUIDE_META = {
    "first-camping-trip": ("First Camping Trip Checklist | Beginner Preparation Guide", "A practical first camping trip checklist for clothing, sleep setup, meals, lighting, and simple planning confidence."),
    "choose-campsite": ("How to Choose a Campsite | Practical Decision Framework", "Choose a campsite with clear criteria on privacy, group fit, daily rhythm, and comfort expectations."),
    "glamping-vs-camping": ("Glamping vs Camping | Which Style Fits You Better", "Compare glamping and camping by effort, comfort, budget rhythm, and travel goals."),
    "who-campervan-travel": ("Who Campervan Travel Fits | Freedom, Cost, and Rhythm", "Understand who campervan travel suits, what preparation it needs, and how to avoid common first-trip mistakes."),
    "family-camping-planning": ("Family Camping Planning | Easier Outdoor Trips with Kids", "Plan a more relaxed family camping experience with practical rhythm, communication, and role-sharing tips."),
    "camping-with-pets": ("Camping with Pets | Safety, Etiquette, and Packing Notes", "Use practical camping-with-pets preparation tips for leash etiquette, hygiene, and shared-space comfort."),
    "taoyuan-outdoor-activities": ("Taoyuan Outdoor Activities | Weekend Nature Route Ideas", "Build realistic Taoyuan weekend outdoor routes with balanced movement, rest, and nature time."),
    "forest-event-space": ("Forest Event Space Guide | Why Outdoor Venues Feel Better", "Learn why forest event spaces work well for private gatherings, milestone moments, and slower group flow."),
    "small-private-event-planning": ("Small Private Event Planning | Outdoor Flow and Setup", "Plan small private outdoor events with better movement flow, schedule design, and guest comfort."),
    "night-outdoor-atmosphere": ("Night Outdoor Atmosphere | Lighting and Social Rhythm", "Design a stronger night outdoor atmosphere with practical light layers, seating layout, and sound etiquette."),
    "outdoor-vs-indoor-gathering": ("Outdoor vs Indoor Gathering | Venue Trade-Off Guide", "Compare outdoor and indoor gathering choices with weather risk, logistics, and group experience quality."),
    "camping-photo-tips": ("Camping Photo Tips | Better Outdoor Photos Naturally", "Use camping photo tips for natural-looking images with better light timing, framing, and candid movement."),
    "types-of-camping-taoyuan": ("Types of Camping in Taoyuan | Format Comparison Guide", "Understand key camping styles in Taoyuan and choose by group type, schedule, and budget comfort."),
    "one-day-vs-overnight-event": ("One-Day vs Overnight Event | How to Decide", "Compare one-day and overnight event formats by preparation load, atmosphere depth, and timing flexibility."),
    "common-camping-questions": ("Common Camping Questions | Practical Starter Answers", "Review common camping questions on weather, etiquette, and trip planning before your final booking step."),
    "easy-yangmei-outdoor-trips": ("Easy Yangmei Outdoor Trips | Low-Stress Nature Ideas", "Discover easy Yangmei outdoor trip ideas with low transport friction and comfortable pacing."),
}

INDEX_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#ffffff">
  <title>Taiwan Camping and Glamping Travel Guide｜Taoyuan, Yangmei, Outdoor Stay Near Taipei</title>
  <meta name="description" content="A full Taiwan camping and glamping guide hub focused on Taoyuan and Yangmei, with practical planning frameworks, category navigation, in-depth articles, and market comparison notes near Taipei.">
  <link rel="canonical" href="https://camp.8-ways.com/en/seo/">
  <link rel="alternate" hreflang="zh-Hant" href="https://camp.8-ways.com/seo/">
  <link rel="alternate" hreflang="en" href="https://camp.8-ways.com/en/seo/">
  <link rel="alternate" hreflang="x-default" href="https://camp.8-ways.com/seo/">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://camp.8-ways.com/en/seo/">
  <meta property="og:title" content="Taiwan Camping and Glamping Travel Guide｜Taoyuan, Yangmei, Outdoor Stay Near Taipei">
  <meta property="og:description" content="A full Taiwan camping and glamping guide hub focused on Taoyuan and Yangmei, with practical planning frameworks, category navigation, and in-depth outdoor reads.">
  <meta property="og:image" content="https://commons.wikimedia.org/wiki/Special:FilePath/Beach_Layout_-_panoramio.jpg?page=seo-index">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Taiwan Camping and Glamping Travel Guide｜Taoyuan, Yangmei, Outdoor Stay Near Taipei">
  <meta name="twitter:description" content="A full Taiwan camping and glamping guide hub focused on Taoyuan and Yangmei, with practical planning frameworks, category navigation, and in-depth outdoor reads.">
  <meta name="twitter:image" content="https://commons.wikimedia.org/wiki/Special:FilePath/Beach_Layout_-_panoramio.jpg?page=seo-index">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../assets/css/main.css">
</head>
<body class="site-wrap" data-base="../../" data-locale="en">
  <div id="site-header"></div>
  <main class="main">
    <section class="hero hero-with-img guide-hub-hero">
      <img class="hero-bg" src="https://commons.wikimedia.org/wiki/Special:FilePath/Beach_Layout_-_panoramio.jpg" alt="Forest and camping atmosphere overview image" width="1600" height="900" loading="eager" decoding="async">
      <div class="container">
        <p class="portal-eyebrow" style="color: rgba(255,255,255,0.88);">Taoyuan｜Yangmei｜Northern Taiwan｜Private Glamping｜Outdoor Stay Near Taipei</p>
        <h1>Taiwan Camping and Glamping Travel Guide</h1>
        <p class="hero-sub">This guide hub is designed to help you make better decisions faster: compare travel rhythm, group type, and stay format first, then move into the right topic and detailed article.</p>
        <div class="hero-actions">
          <a href="../index.html" class="btn btn-outline">Back to Home</a>
          <a href="../pages/availability.html" class="btn btn-outline">Check Dates and Prices</a>
        </div>
      </div>
    </section>

    <nav class="breadcrumb-nav container" aria-label="Breadcrumb">
      <ol itemscope itemtype="https://schema.org/BreadcrumbList">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a itemprop="item" href="../index.html"><span itemprop="name">Home</span></a>
          <meta itemprop="position" content="1">
        </li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span itemprop="name">Camping Travel Guide</span>
          <meta itemprop="position" content="2">
        </li>
      </ol>
    </nav>

    <section class="section">
      <div class="container content-block">
        <h2 class="section-title">What This Guide Improves</h2>
        <p>This version is not a keyword collection page. It starts with a planning framework, then leads you to category-level choices, deep guides, and final booking decisions.</p>
        <p>Use this sequence for better outcomes: define your group and travel style, compare stay formats, then choose room type and schedule.</p>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <h2 class="section-title">How We Organize Camping Knowledge</h2>
        <div class="card-grid card-grid-3">
          <article class="card"><div class="card-body"><h3>1) Official Travel Context</h3><p>We start with transport logic and destination context to prevent route mistakes and timeline overload.</p></div></article>
          <article class="card"><div class="card-body"><h3>2) Outdoor Ethics and Risk Basics</h3><p>We include practical low-impact and safety principles for cleaner, safer, and more respectful outdoor travel.</p></div></article>
          <article class="card"><div class="card-body"><h3>3) Actionable Planning Layers</h3><p>We convert broad advice into usable planning steps for beginners, families, pets, and campervan travelers.</p></div></article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2 class="section-title">Topic Categories</h2>
        <div class="portal-topic-grid">
          <a class="portal-topic-card" href="taoyuan-camping.html"><div class="portal-topic-card__body"><h3>Taoyuan Camping Guide</h3><p>Forest stay rhythm, route efficiency, and practical planning.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="yangmei-camping.html"><div class="portal-topic-card__body"><h3>Yangmei Camping and Outdoor Activities</h3><p>Short-trip logic and nearby outdoor route ideas.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="glamping-guide.html"><div class="portal-topic-card__body"><h3>Glamping Guide</h3><p>Compare glamping and camping by comfort and effort.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="family-camping.html"><div class="portal-topic-card__body"><h3>Family Camping Guide</h3><p>Smoother pacing, safer flow, and practical family planning.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="pet-friendly-camping.html"><div class="portal-topic-card__body"><h3>Pet-Friendly Camping</h3><p>Etiquette, safety, and outdoor planning with pets.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="campervan-travel.html"><div class="portal-topic-card__body"><h3>Campervan Travel Guide</h3><p>Mobile travel style, route flexibility, and trade-offs.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="beginner-camping.html"><div class="portal-topic-card__body"><h3>Beginner Camping Guide</h3><p>Start with low-friction preparation and realistic expectations.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="camping-gear.html"><div class="portal-topic-card__body"><h3>Camping Gear Guide</h3><p>Essential-first packing logic and practical gear layers.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="nearby-attractions.html"><div class="portal-topic-card__body"><h3>Nearby Attractions and Routes</h3><p>Route combinations around Yangmei and Taoyuan.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="forest-outdoor-experience.html"><div class="portal-topic-card__body"><h3>Forest Outdoor Experience</h3><p>Event and gathering ideas in private forest settings.</p><span class="portal-topic-card__tag">Read -></span></div></a>
          <a class="portal-topic-card" href="night-camping-atmosphere.html"><div class="portal-topic-card__body"><h3>Night Camping Atmosphere</h3><p>Lighting, sound, and seating flow for better nights.</p><span class="portal-topic-card__tag">Read -></span></div></a>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <h2 class="section-title">In-Depth Guides</h2>
        <div class="card-grid card-grid-2 guide-card-grid">
          <a href="first-camping-trip.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>First Camping Trip Checklist</h3></div></a>
          <a href="choose-campsite.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>How to Choose a Campsite</h3></div></a>
          <a href="glamping-vs-camping.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Glamping vs Camping</h3></div></a>
          <a href="who-campervan-travel.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Who Campervan Travel Fits</h3></div></a>
          <a href="family-camping-planning.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Family Camping Planning</h3></div></a>
          <a href="camping-with-pets.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Camping with Pets</h3></div></a>
          <a href="taoyuan-outdoor-activities.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Taoyuan Outdoor Activities</h3></div></a>
          <a href="forest-event-space.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Forest Event Space Charm</h3></div></a>
          <a href="small-private-event-planning.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Small Private Event Planning</h3></div></a>
          <a href="night-outdoor-atmosphere.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Night Outdoor Atmosphere</h3></div></a>
          <a href="outdoor-vs-indoor-gathering.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Outdoor vs Indoor Gathering</h3></div></a>
          <a href="camping-photo-tips.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Camping Photo Tips</h3></div></a>
          <a href="types-of-camping-taoyuan.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Types of Camping in Taoyuan</h3></div></a>
          <a href="one-day-vs-overnight-event.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>One-Day vs Overnight Event</h3></div></a>
          <a href="common-camping-questions.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Common Camping Questions</h3></div></a>
          <a href="easy-yangmei-outdoor-trips.html" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>Easy Yangmei Outdoor Trips</h3></div></a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container content-block">
        <h2>Market Comparison and Public Plan Insights</h2>
        <p>When comparing glamping options, separate accommodation comfort from experience design. Similar-looking plans can differ significantly in privacy, meal flow, night atmosphere, and service response speed.</p>
        <h3>Review These Four Points First</h3>
        <ul>
          <li>Balance between stay comfort and activity design</li>
          <li>Transparent weekday/weekend and peak-date pricing logic</li>
          <li>Clear meal, add-on guest, and upgrade policies</li>
          <li>Support for private events like birthdays and celebrations</li>
        </ul>
        <div style="overflow-x:auto;">
          <table class="market-table" style="width:100%; border-collapse:collapse; min-width:780px; background:#fff; border:1px solid rgba(45,74,62,.16);">
            <thead>
              <tr>
                <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(45,74,62,.16);">Brand/Venue</th>
                <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(45,74,62,.16);">Common Public Price Range for Two Guests</th>
                <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(45,74,62,.16);">Key Features</th>
                <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(45,74,62,.16);">Best For</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Joyforest (Yangmei, Taoyuan)</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Quoted by room type and date</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Low-density private setup, dual dome tents, forest lawn, and flexible event flow</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Small groups that value privacy and custom planning</td>
              </tr>
              <tr>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Bon Chill (Taoyuan)</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">From around NT$7,600 (public plans)</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Integrated meals and hotel-like service flow</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Travelers who want a low-prep stay</td>
              </tr>
              <tr>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Love Xiweng (Hsinchu)</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Around NT$5,600-8,400 (plan-based)</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Mountain views and quiet-paced activity mix</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Guests who care about scenery and rest quality</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="cta-block">
      <div class="container">
        <h2>Ready to plan your stay?</h2>
        <p>Choose your room style first, then confirm route, FAQ, and available dates for the final booking decision.</p>
        <div class="actions">
          <a href="../pages/balloon-tent.html" class="btn btn-outline">Balloon Tent</a>
          <a href="../pages/cloud-tent.html" class="btn btn-outline">Cloud Tent</a>
          <a href="../pages/party-event-space.html" class="btn btn-outline">Private Event Space</a>
          <a href="../pages/availability.html" class="btn btn-outline">Check Dates and Prices</a>
        </div>
      </div>
    </section>
  </main>
  <div id="site-footer"></div>
  <script src="../../assets/js/lang-switch.js"></script>
  <script src="../../assets/js/main.js"></script>
</body>
</html>
"""


def extract_meta(source: str, key: str, fallback: str) -> str:
    match = re.search(rf'<meta property="{re.escape(key)}" content="([^"]+)"', source)
    return match.group(1) if match else fallback


def extract_hero(source: str) -> str:
    match = re.search(r'<img class="hero-bg" src="([^"]+)"', source)
    return match.group(1) if match else "https://commons.wikimedia.org/wiki/Special:FilePath/Recreational%20camping.jpg"


def render_page(
    *,
    title: str,
    description: str,
    hero_image: str,
    og_image: str,
    h1: str,
    subtitle: str,
    zh_url: str,
    en_url: str,
    category_links: list[tuple[str, str]],
    guide_links: list[tuple[str, str]],
) -> str:
    category_cards = "\n".join(
        f'          <a href="{href}" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>{label}</h3></div></a>'
        for href, label in category_links
    )
    guide_cards = "\n".join(
        f'          <a href="{href}" class="card" style="text-decoration:none;color:inherit;"><div class="card-body"><h3>{label}</h3></div></a>'
        for href, label in guide_links
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#ffffff">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{en_url}">
  <link rel="alternate" hreflang="zh-Hant" href="{zh_url}">
  <link rel="alternate" hreflang="en" href="{en_url}">
  <link rel="alternate" hreflang="x-default" href="{zh_url}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{en_url}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="{og_image}">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="{og_image}">
  <link rel="stylesheet" href="../../assets/css/main.css">
</head>
<body class="site-wrap" data-base="../../" data-locale="en">
  <div id="site-header"></div>
  <main class="main">
    <section class="hero hero-with-img">
      <img class="hero-bg" src="{hero_image}" alt="Forest camping visual" width="1600" height="900" loading="eager" decoding="async">
      <div class="container">
        <h1>{h1}</h1>
        <p class="hero-sub">{subtitle}</p>
      </div>
    </section>
    <nav class="breadcrumb-nav container" aria-label="Breadcrumb">
      <ol itemscope itemtype="https://schema.org/BreadcrumbList">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a itemprop="item" href="../index.html"><span itemprop="name">Home</span></a><meta itemprop="position" content="1"></li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a itemprop="item" href="index.html"><span itemprop="name">Camping Guide Hub</span></a><meta itemprop="position" content="2"></li>
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><span itemprop="name">{h1}</span><meta itemprop="position" content="3"></li>
      </ol>
    </nav>
    <section class="section">
      <div class="container content-block">
        <p>{description}</p>
        <p>This page is part of our English SEO guide collection and keeps the same planning direction as the Chinese source page, with updated links for the English site tree.</p>
        <p>Use this page as a decision layer before booking: identify your trip format, compare stay conditions, and then move to room and availability pages.</p>
      </div>
    </section>
    <section class="section section-alt">
      <div class="container content-block">
        <h2>Market Comparison and Public Plan Insights</h2>
        <p>For better decisions, compare total experience quality rather than only base price: route efficiency, privacy level, schedule fit, and support clarity usually matter more.</p>
        <h3>Review These Four Points First</h3>
        <ul>
          <li>Is the accommodation comfort level aligned with your group style?</li>
          <li>Are weekday, weekend, and peak-date pricing rules clearly explained?</li>
          <li>Are add-on guest and meal policies transparent before booking?</li>
          <li>Does the venue support private events and custom flow needs?</li>
        </ul>
        <div style="overflow-x:auto;">
          <table class="market-table" style="width:100%; border-collapse:collapse; min-width:780px; background:#fff; border:1px solid rgba(45,74,62,.16);">
            <thead>
              <tr>
                <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(45,74,62,.16);">Brand/Venue</th>
                <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(45,74,62,.16);">Common Public Price Range for Two Guests</th>
                <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(45,74,62,.16);">Key Features</th>
                <th style="text-align:left; padding:10px; border-bottom:1px solid rgba(45,74,62,.16);">Best For</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Joyforest (Yangmei, Taoyuan)</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Quoted by room type and date</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Low-density private setup, dual dome tents, forest lawn, and flexible event flow</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Small groups that value privacy and custom planning</td>
              </tr>
              <tr>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Regional Glamping Brand A</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">From around NT$5,000 to NT$8,500</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Structured package flow and integrated meal options</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Guests who want lower preparation effort</td>
              </tr>
              <tr>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Regional Glamping Brand B</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">From around NT$6,000 to NT$9,800</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Nature-forward atmosphere and event-oriented space planning</td>
                <td style="padding:10px; border-top:1px solid rgba(45,74,62,.12);">Travelers prioritizing atmosphere and social moments</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="section-title">Related Categories</h2>
        <div class="card-grid card-grid-2">
{category_cards}
        </div>
      </div>
    </section>
    <section class="section section-alt">
      <div class="container">
        <h2 class="section-title">Related Guides</h2>
        <div class="card-grid card-grid-2">
{guide_cards}
        </div>
      </div>
    </section>
    <section class="cta-block">
      <div class="container">
        <h2>Plan your next step</h2>
        <p>After reading this guide, move to room details and date availability for practical booking decisions.</p>
        <div class="actions">
          <a href="../pages/balloon-tent.html" class="btn btn-outline">Balloon Tent</a>
          <a href="../pages/cloud-tent.html" class="btn btn-outline">Cloud Tent</a>
          <a href="../pages/party-event-space.html" class="btn btn-outline">Private Event Space</a>
          <a href="../pages/availability.html" class="btn btn-outline">Check Dates and Prices</a>
        </div>
      </div>
    </section>
  </main>
  <div id="site-footer"></div>
  <script src="../../assets/js/lang-switch.js"></script>
  <script src="../../assets/js/main.js"></script>
</body>
</html>
"""


def main() -> None:
    SEO_EN.mkdir(parents=True, exist_ok=True)
    (SEO_EN / "index.html").write_text(INDEX_HTML, encoding="utf-8")

    category_cards = [
        ("taoyuan-camping.html", "Taoyuan Camping Guide"),
        ("yangmei-camping.html", "Yangmei Camping and Outdoor Activities"),
        ("glamping-guide.html", "Glamping Guide"),
        ("family-camping.html", "Family Camping Guide"),
        ("pet-friendly-camping.html", "Pet-Friendly Camping"),
        ("campervan-travel.html", "Campervan Travel Guide"),
    ]
    guide_cards = [
        ("first-camping-trip.html", "First Camping Trip Checklist"),
        ("choose-campsite.html", "How to Choose a Campsite"),
        ("glamping-vs-camping.html", "Glamping vs Camping"),
        ("who-campervan-travel.html", "Who Campervan Travel Fits"),
        ("family-camping-planning.html", "Family Camping Planning"),
        ("camping-with-pets.html", "Camping with Pets"),
    ]

    for zh_name, en_name in CATEGORY_MAP.items():
        src_text = (SEO_SRC / zh_name).read_text(encoding="utf-8")
        title, desc = CATEGORY_META[en_name]
        html = render_page(
            title=title,
            description=desc,
            hero_image=extract_hero(src_text),
            og_image=extract_meta(src_text, "og:image", extract_hero(src_text)),
            h1=title.split("|")[0].strip(),
            subtitle="A practical English guide adapted from the Chinese source page, with updated links and decision-focused reading flow.",
            zh_url=f"{SITE}/seo/{zh_name}",
            en_url=f"{SITE}/en/seo/{en_name}",
            category_links=category_cards,
            guide_links=guide_cards,
        )
        (SEO_EN / en_name).write_text(html, encoding="utf-8")

    for zh_stem, en_stem in GUIDE_MAP.items():
        src_text = (SEO_SRC / "guide" / f"{zh_stem}.html").read_text(encoding="utf-8")
        title, desc = GUIDE_META[en_stem]
        html = render_page(
            title=title,
            description=desc,
            hero_image=extract_hero(src_text),
            og_image=extract_meta(src_text, "og:image", extract_hero(src_text)),
            h1=title.split("|")[0].strip(),
            subtitle="This guide keeps the original topic intent and provides a cleaner English path for planning, comparison, and booking decisions.",
            zh_url=f"{SITE}/seo/guide/{zh_stem}.html",
            en_url=f"{SITE}/en/seo/{en_stem}.html",
            category_links=category_cards,
            guide_links=guide_cards,
        )
        (SEO_EN / f"{en_stem}.html").write_text(html, encoding="utf-8")

    print("Generated English SEO pages in en/seo/:")
    created = ["index.html"] + sorted(CATEGORY_MAP.values()) + sorted([f"{s}.html" for s in GUIDE_MAP.values()])
    for name in created:
        print(f"- en/seo/{name}")


if __name__ == "__main__":
    main()
