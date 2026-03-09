#!/bin/bash
# Resize images (max 1600px) and rename to SEO English. Run from project root.
set -e
IMGDIR="images"
MAXSIZE=1600

resize_one() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  w=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth:/{print $2}')
  [[ -n "$w" ]] && [[ "$w" -gt "$MAXSIZE" ]] && sips -Z "$MAXSIZE" "$f"
  return 0
}

rename_one() {
  local dir="$1" old="$2" new="$3"
  if [[ -f "$IMGDIR/$dir/$old" ]]; then
    resize_one "$IMGDIR/$dir/$old"
    if [[ "$old" != "$new" ]]; then
      mv "$IMGDIR/$dir/$old" "$IMGDIR/$dir/$new"
    fi
  fi
}

# Hero
rename_one "hero" "2025-12-15-15-15-29-DSC_1533.jpg" "taoyuan-glamping-forest-dome-hero.jpg"
rename_one "hero" "2025-11-24-13-58-05-DSC_2798.jpg" "taoyuan-forest-camping-scene.jpg"
rename_one "hero" "33059712-2035-46BC-992F-AC4486D2CFB4.png" "taoyuan-glamping-private-campsite-forest.png"
rename_one "hero" "CC0AB8BD-09DB-4974-857E-EFA3085F710B.png" "yangmei-glamping-dome-tent.png"
rename_one "hero" "IMG_5849.jpeg" "yangmei-forest-camping-view.jpg"
rename_one "hero" "揪好森logo.png" "joyforest-logo.png"
rename_one "hero" "攝影棚 揪好森joyforest1.jpg" "taoyuan-glamping-lazy-camping.jpg"

# Balloon-tent
rename_one "balloon-tent" "IMG_7898.jpeg" "balloon-tent-dome-interior.jpg"
rename_one "balloon-tent" "IMG_7147.jpg" "balloon-tent-exclusive-grass-space.jpg"
rename_one "balloon-tent" "IMG_7151.jpg" "balloon-tent-outdoor-seating.jpg"
rename_one "balloon-tent" "IMG_7899.jpeg" "balloon-tent-night-lights.jpg"
rename_one "balloon-tent" "IMG_7655.JPG" "balloon-tent-kitchen-common-area.jpg"
rename_one "balloon-tent" "2025-12-15-16-29-19-DSC_2259.jpg" "balloon-tent-glamping-yangmei.jpg"
rename_one "balloon-tent" "攝影棚 揪好森joyforest9.jpg" "balloon-tent-dome-tent-forest.jpg"
rename_one "balloon-tent" "IMG_7659.JPG" "balloon-tent-private-campsite.jpg"
rename_one "balloon-tent" "10562C49-76A0-4433-B6CD-34C1F1637E0D.png" "balloon-tent-forest-camping.png"
rename_one "balloon-tent" "攝影棚 揪好森joyforest2.jpg" "balloon-tent-grass-living-space.jpg"
rename_one "balloon-tent" "攝影棚 揪好森joyforest3.jpg" "balloon-tent-lazy-glamping.jpg"
rename_one "balloon-tent" "IMG_7901.jpeg" "balloon-tent-glamping-space.jpg"

# Cloud-tent
rename_one "cloud-tent" "IMG_7650.JPG" "cloud-tent-dome-interior.jpg"
rename_one "cloud-tent" "2025-12-15-15-15-29-DSC_1533.jpg" "cloud-tent-forest-bathroom-view.jpg"

# Placeholders (index + general)
rename_one "placeholders" "揪好森DM1.jpg" "taoyuan-glamping-exclusive-grass-100ping.jpg"
rename_one "placeholders" "揪好森DM2.jpg" "taoyuan-dome-tent-forest-glamping.jpg"
rename_one "placeholders" "揪好森DM3.jpg" "yangmei-camping-convenient-location.jpg"
rename_one "placeholders" "揪好森DM4.jpg" "taoyuan-private-campsite-glamping.jpg"
rename_one "placeholders" "揪好森DM5.jpg" "forest-camping-dome-tent.jpg"
rename_one "placeholders" "揪好森DM6.jpg" "yangmei-forest-lazy-camping.jpg"
rename_one "placeholders" "揪好森DM7.jpg" "taoyuan-glamping-booking-campsite.jpg"
rename_one "placeholders" "IMG_7653.JPG" "taoyuan-glamping-campsite-view.jpg"
rename_one "placeholders" "IMG_7655.JPG" "dome-tent-glamping-space.jpg"
rename_one "placeholders" "IMG_7658.JPG" "forest-camping-private-area.jpg"

# Guide
rename_one "guide" "揪好森 周邊與交通示意圖.jpg" "taoyuan-yangmei-location-traffic-map.jpg"

echo "Done: resize + SEO rename."
