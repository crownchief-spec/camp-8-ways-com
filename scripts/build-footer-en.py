#!/usr/bin/env python3
"""Build components/footer-en.html from spec."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "components" / "footer-en.html"

WA = "https://wa.me/886911252302?text=Hello%2C%20I%20would%20like%20to%20ask%20about%20Joyforest.%20My%20dates%3A%20"
LINE = "https://line.me/ti/p/F2MWlK47xD"
B = "{{base}}"

DIV = "motion"
DIV = "div"


def tag(name, inner="", cls=None, close=True):
    cls_attr = f' class="{cls}"' if cls else ""
    if close:
        return f"<{name}{cls_attr}>{inner}</{name}>"
    return f"<{name}{cls_attr}>{inner}"


def li_link(href, text):
    return f'          <li><a href="{href}">{text}</a></li>\n'


seo_text = (
    "Joyforest is a private forest glamping stay and outdoor event venue in Yangmei, Taoyuan, Taiwan, near Taipei. "
    "Guests can choose Balloon Tent or Cloud Tent for a private dome tent accommodation experience with lawns, "
    "outdoor kitchens, BBQ, night lights, projector, bathtub, and self check-in. Joyforest is also suitable for "
    "birthdays, baby milestone parties, proposals, pet gatherings, family photography, graduation photos, pet photography, "
    "BBQ gatherings, karaoke, outdoor movies, and private outdoor events in northern Taiwan."
)

tags = [
    "#Joyforest", "#TaiwanGlamping", "#TaoyuanGlamping", "#YangmeiGlamping", "#TaipeiGlamping",
    "#PrivateGlampingTaiwan", "#ForestGlamping", "#DomeTentStay", "#PrivateCampsiteTaiwan",
    "#OutdoorStayTaiwan", "#BBQVenueTaiwan", "#PrivateEventVenueTaiwan", "#FamilyGlamping",
    "#PetFriendlyVenue", "#CampingNearTaipei", "#TaiwanOutdoorAccommodation", "#TaoyuanPartyVenue",
    "#TaiwanFamilyPhotography", "#TaiwanPetPhotography", "#GraduationPhotographyTaiwan",
]
tag_html = "\n        ".join(f"<span>{t}</span>" for t in tags)

col1 = (
    li_link(f"{B}en/", "Home")
    + li_link(f"{B}en/pages/balloon-tent/", "Balloon Tent")
    + li_link(f"{B}en/pages/cloud-tent/", "Cloud Tent")
    + li_link(f"{B}en/pages/availability/", "Check Availability")
    + li_link(f"{B}en/pages/party-event-space/", "Private Forest Party Venue")
)

col2 = (
    li_link(f"{B}en/pages/party-event-space/", "Baby Milestone Party")
    + li_link(f"{B}en/pages/party-event-space/", "Birthday Party")
    + li_link(f"{B}en/pages/party-event-space/", "Proposal / Anniversary")
    + li_link(f"{B}en/pages/party-event-space/", "Pet Gathering")
    + li_link(f"{B}en/pages/party-event-space/", "Photo Shoot Location")
    + li_link(f"{B}en/pages/party-event-space/", "Picnic & Outdoor Gathering")
)

col3 = (
    li_link(f"{B}en/pages/forest-graduation-photo/", "Forest Graduation Photography")
    + li_link(f"{B}en/pages/family-photography-party/", "Family Photography × Private Forest Venue")
    + li_link(f"{B}en/pages/pet-photography-party/", "Pet Photography × Forest Venue")
)

col4 = (
    li_link(f"{B}en/seo/", "Taiwan Camping and Glamping Travel Guide")
    + li_link(f"{B}en/seo/taoyuan-camping/", "Taoyuan Camping Guide")
    + li_link(f"{B}en/seo/yangmei-camping/", "Yangmei Camping and Outdoor Activities")
    + li_link(f"{B}en/seo/glamping-guide/", "Glamping in Taiwan Guide")
    + li_link(f"{B}en/seo/family-camping/", "Family Camping Guide")
    + li_link(f"{B}en/seo/pet-friendly-camping/", "Pet-Friendly Camping Guide")
    + li_link(f"{B}en/seo/beginner-camping/", "Beginner Camping Guide")
    + li_link(f"{B}en/seo/camping-gear/", "Camping Gear Checklist")
)

html = f"""<footer class="site-footer">
  <section class="section home-reviews-section">
    <div class="container">
      <div class="footer-reviews-head">
        <h2>Guest Reviews</h2>
        <p>Real feedback from guests enjoying quiet time in the forest.</p>
      </div>
      <div class="footer-reviews-grid"></motion>
      <p class="text-center mt-lg">
        <a href="{B}reviews/" class="btn btn-outline-dark">More guest reviews</a>
      </p>
    </div>
  </section>

  <section class="footer-seo-share" aria-label="Camping and glamping guides">
    <div class="container footer-seo-share__inner">
      <h2 class="footer-seo-share__title">Travel &amp; Camping Guide</h2>
      <p class="footer-seo-share__hub-wrap">
        <a href="{B}en/seo/" class="footer-seo-share__hub">Taiwan Camping and Glamping Travel Guide｜Full Index</a>
      </p>
      <ul class="footer-seo-share__list" id="footer-seo-random-links" aria-label="Featured articles"></ul>
    </div>
  </section>

  <div class="footer-main">
    <div class="container footer-grid footer-grid--en">
      <div class="footer-col">
        <h2 class="footer-heading">Stay at Joyforest</h2>
        <ul class="footer-link-list">
{col1}        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-heading">Private Events</h2>
        <ul class="footer-link-list">
{col2}        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-heading">Photography Collaboration</h2>
        <ul class="footer-link-list">
{col3}        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-heading">Travel &amp; Camping Guide</h2>
        <ul class="footer-link-list">
{col4}        </ul>
      </div>
      <motion></motion>
    </div>
  </div>

  <section class="footer-keyword-tags" aria-label="SEO keywords">
    <div class="container content-block">
      <p class="footer-seo-text">{seo_text}</p>
      <div class="hashtags footer-hashtags">
        {tag_html}
      </div>
    </div>
  </section>

  <section class="footer-collab-zone" aria-label="Photography collaborations">
    <div class="container">
      <div class="footer-collab-cards footer-collab-cards--three">
        <article class="footer-grad-card footer-grad-card--bottom footer-grad-card--compact">
          <img src="{B}assets/images/forest-graduation/forest-graduation-kids-camping-hero.jpg" alt="Young boy smiling and giving a high five in a camping-style forest graduation photo scene at Joyforest Taoyuan Taiwan" width="1600" height="1067" loading="lazy" decoding="async" class="footer-grad-card__img">
          <div class="footer-grad-card__body">
            <p class="footer-grad-card__kicker">Brand Collaboration｜Limited Collaboration</p>
            <h3 class="footer-grad-card__title">Forest Graduation Photography</h3>
            <p class="footer-grad-card__text">Joyforest × Teacher Benson Photography Team — forest graduation portraits with optional dining or overnight stay.</p>
            <a href="{B}en/pages/forest-graduation-photo/" class="btn btn-outline-dark btn-sm">View Collaboration Package</a>
          </div>
        </article>
        <article class="footer-grad-card footer-grad-card--bottom footer-grad-card--compact">
          <img src="{B}assets/images/family-photography-party/parent-child-photography-joyforest-family-running-grass-dome-w900.webp" alt="Family of three running on the lawn at Joyforest Taoyuan private forest photography venue" width="900" height="675" loading="lazy" decoding="async" class="footer-grad-card__img">
          <div class="footer-grad-card__body">
            <p class="footer-grad-card__kicker">Brand Collaboration｜Limited Collaboration</p>
            <h3 class="footer-grad-card__title">Family Photography × Private Forest Venue</h3>
            <p class="footer-grad-card__text">About 200 ping of forest and dome tent scenes with Teacher Benson family photography. BBQ, karaoke, or glamping add-ons available.</p>
            <a href="{B}en/pages/family-photography-party/" class="btn btn-outline-dark btn-sm">View Collaboration Package</a>
          </div>
        </article>
        <article class="footer-grad-card footer-grad-card--bottom footer-grad-card--compact">
          <img src="{B}assets/images/pet-photography-party/pet-photography-outdoor-four-dogs-grass-blanket-joyforest-w900.webp" alt="Pet photography outdoor lawn scene at Joyforest private glamping venue in Taoyuan Taiwan" width="900" height="675" loading="lazy" decoding="async" class="footer-grad-card__img">
          <div class="footer-grad-card__body">
            <p class="footer-grad-card__kicker">Brand Collaboration｜Limited Collaboration</p>
            <h3 class="footer-grad-card__title">Pet Photography × Private Forest Venue</h3>
            <p class="footer-grad-card__text">200 ping lawn and tent scenes with Teacher Benson pet photography. Stay for a gathering, BBQ, or overnight glamping after the shoot.</p>
            <a href="{B}en/pages/pet-photography-party/" class="btn btn-outline-dark btn-sm">View Collaboration Package</a>
          </div>
        </article>
      </div>
    </div>
  </section>

  <div class="footer-bottom container">
    <p class="footer-lang-link">
      <a href="#" data-lang-switch="to-zh" hreflang="zh-Hant" lang="zh-Hant">中文</a>
      <span aria-hidden="true"> · </span>
      <a href="{B}en/" hreflang="en" lang="en">English</a>
    </p>
    <p>© Joyforest. Private forest glamping stay and outdoor event venue in Taoyuan, Taiwan.</p>
  </div>
</footer>
"""

html = html.replace("</motion>", "</motion>").replace("<motion>", "<motion>")
html = html.replace("</motion>", "</div>").replace("<motion></motion>", "")
html = html.replace('class="footer-reviews-grid"></motion>', 'class="footer-reviews-grid">')
html = html.replace('      <motion></motion>\n', f'''      <div class="footer-col">
        <h2 class="footer-heading">Contact</h2>
        <ul class="footer-contact-list">
          <li><a href="{WA}" target="_blank" rel="noopener">WhatsApp: +886 911 252 302</a></li>
          <li><a href="{LINE}" target="_blank" rel="noopener">LINE Official Account</a></li>
        </ul>
        <p class="footer-brand-text">Joyforest｜Private forest glamping stay in Yangmei, Taoyuan, Taiwan<br>Near Taipei｜Private dome tent stay｜Outdoor kitchen｜BBQ｜Private event venue</p>
        <div class="footer-mini-cta">
          <div class="footer-mini-cta-stack">
            <a class="btn btn-wa-solid btn-sm" href="{WA}" target="_blank" rel="noopener">Contact on WhatsApp</a>
            <a class="btn btn-line-header btn-sm" href="{LINE}" target="_blank" rel="noopener">Contact on LINE</a>
          </div>
          <a class="btn btn-outline-dark btn-sm" href="{B}en/pages/availability/">Check Dates &amp; Prices</a>
        </motion>
      </motion>
''')

# final fix any remaining motion tags
html = html.replace("<motion>", "<div>").replace("</motion>", "</div>")

OUT.write_text(html, encoding="utf-8")
print(f"Wrote {OUT} ({len(html)} bytes)")
