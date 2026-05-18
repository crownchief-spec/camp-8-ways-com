#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup
from bs4.element import NavigableString, Tag

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://camp.8-ways.com"
HASHTAGS_TEXT = (
    "#Joyforest #TaoyuanTaiwan #ForestPhotography #PrivateForestVenue "
    "#GraduationPhotography #FamilyPhotography #PetPhotography "
    "#OutdoorPortraits #GlampingTaiwan #Yangmei"
)

PAGE_CONFIGS = [
    {
        "slug": "forest-graduation-photo",
        "source": ROOT / "pages" / "forest-graduation-photo.html",
        "dest": ROOT / "en" / "pages" / "forest-graduation-photo" / "index.html",
        "title": "Forest Graduation Photography｜Joyforest × Teacher Benson｜Taoyuan Taiwan",
    },
    {
        "slug": "family-photography-party",
        "source": ROOT / "pages" / "family-photography-party.html",
        "dest": ROOT / "en" / "pages" / "family-photography-party" / "index.html",
        "title": "Family Photography × Private Forest Venue｜Joyforest × Teacher Benson",
    },
    {
        "slug": "pet-photography-party",
        "source": ROOT / "pages" / "pet-photography-party.html",
        "dest": ROOT / "en" / "pages" / "pet-photography-party" / "index.html",
        "title": "Pet Photography × Private Forest Venue｜Joyforest × Teacher Benson",
    },
]

ATTRS_TO_TRANSLATE = [
    "alt",
    "title",
    "aria-label",
    "placeholder",
    "label",
    "data-caption",
    "data-img-alt",
]

META_NAME_KEYS = {
    "description",
    "keywords",
    "twitter:title",
    "twitter:description",
}

META_PROP_KEYS = {
    "og:title",
    "og:description",
}

INTERNAL_LINK_MAP = {
    "balloon-tent": "../balloon-tent/",
    "balloon-tent.html": "../balloon-tent/",
    "cloud-tent": "../cloud-tent/",
    "cloud-tent.html": "../cloud-tent/",
    "availability": "../availability/",
    "availability.html": "../availability/",
    "party-event-space": "../party-event-space/",
    "party-event-space.html": "../party-event-space/",
}

ZH_RE = re.compile(r"[\u3400-\u9fff]")


def contains_zh(text: str) -> bool:
    return bool(ZH_RE.search(text))


def normalize_inner_space(text: str) -> str:
    return re.sub(r"\s{2,}", " ", text).strip()


class Translator:
    def __init__(self) -> None:
        self.cache: dict[str, str] = {}
        self.core_cache: dict[str, str] = {}

    def translate_many(self, texts: list[str]) -> dict[str, str]:
        unique_inputs = []
        seen = set()
        for text in texts:
            if text in seen:
                continue
            seen.add(text)
            unique_inputs.append(text)

        pending: list[str] = []
        for text in unique_inputs:
            if text in self.cache:
                continue
            stripped = text.strip()
            if not stripped or not contains_zh(stripped):
                self.cache[text] = text
                continue
            pending.append(text)

        for original in pending:
            stripped = original.strip()
            if stripped in self.core_cache:
                result_core = self.core_cache[stripped]
            else:
                translated = self._remote_translate_one(stripped)
                result_core = normalize_inner_space(translated) if translated else stripped
                self.core_cache[stripped] = result_core
            prefix = original[: len(original) - len(original.lstrip())]
            suffix = original[len(original.rstrip()) :]
            self.cache[original] = f"{prefix}{result_core}{suffix}"

        return {text: self.cache.get(text, text) for text in texts}

    def _remote_translate_one(self, text: str) -> str:
        encoded = urllib.parse.quote(text, safe="")
        url = (
            "https://translate.googleapis.com/translate_a/single"
            f"?client=gtx&sl=zh-TW&tl=en&dt=t&q={encoded}"
        )
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; JoyforestPageGenerator/1.0)"},
        )

        for i in range(3):
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    payload = resp.read().decode("utf-8")
                data = json.loads(payload)
                if isinstance(data, list) and data and isinstance(data[0], list):
                    return "".join(part[0] for part in data[0] if part and part[0])
                return text
            except Exception:
                if i == 2:
                    return text
                time.sleep(0.6 * (i + 1))
        return text


def collect_translatables(soup: BeautifulSoup) -> tuple[list[tuple[NavigableString, str]], list[tuple[Tag, str, str]]]:
    text_nodes: list[tuple[NavigableString, str]] = []
    attr_nodes: list[tuple[Tag, str, str]] = []

    for node in soup.find_all(string=True):
        if not isinstance(node, NavigableString):
            continue
        parent = node.parent
        if not parent or parent.name in {"script", "style"}:
            continue
        raw = str(node)
        if contains_zh(raw):
            text_nodes.append((node, raw))

    for tag in soup.find_all(True):
        for attr in ATTRS_TO_TRANSLATE:
            val = tag.get(attr)
            if isinstance(val, str) and contains_zh(val):
                attr_nodes.append((tag, attr, val))

    for meta in soup.find_all("meta"):
        content = meta.get("content")
        name = meta.get("name")
        prop = meta.get("property")
        if not isinstance(content, str):
            continue
        if (name in META_NAME_KEYS or prop in META_PROP_KEYS) and contains_zh(content):
            attr_nodes.append((meta, "content", content))

    return text_nodes, attr_nodes


def apply_translations(
    text_nodes: list[tuple[NavigableString, str]],
    attr_nodes: list[tuple[Tag, str, str]],
    translated: dict[str, str],
) -> None:
    for node, raw in text_nodes:
        node.replace_with(translated.get(raw, raw))

    for tag, attr, raw in attr_nodes:
        tag[attr] = translated.get(raw, raw).strip()


def update_asset_paths(soup: BeautifulSoup) -> None:
    for tag in soup.find_all(True):
        for attr in ("href", "src", "poster", "data-full", "srcset"):
            val = tag.get(attr)
            if not isinstance(val, str):
                continue
            updated = re.sub(r"(?:(?:\.\./)+|/)assets/", "../../../assets/", val)
            tag[attr] = updated


def update_internal_links(soup: BeautifulSoup) -> None:
    for a in soup.find_all("a"):
        href = a.get("href")
        if not isinstance(href, str):
            continue
        clean = href.split("#")[0].split("?")[0]
        clean = clean.rstrip("/")
        for old, new in INTERNAL_LINK_MAP.items():
            if clean.endswith(old):
                suffix = href[len(clean) :]
                a["href"] = new + suffix


def _collect_json_strings(data: object, out: list[str]) -> None:
    if isinstance(data, dict):
        for v in data.values():
            _collect_json_strings(v, out)
    elif isinstance(data, list):
        for item in data:
            _collect_json_strings(item, out)
    elif isinstance(data, str) and contains_zh(data):
        out.append(data)


def _apply_json_translations(data: object, translated: dict[str, str]) -> object:
    if isinstance(data, dict):
        return {k: _apply_json_translations(v, translated) for k, v in data.items()}
    if isinstance(data, list):
        return [_apply_json_translations(item, translated) for item in data]
    if isinstance(data, str) and data in translated:
        return translated[data].strip()
    return data


def translate_json_ld(soup: BeautifulSoup, tr: Translator) -> None:
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        content = script.string
        if not isinstance(content, str) or not contains_zh(content):
            continue
        try:
            data = json.loads(content)
        except Exception:
            continue
        raw_strings: list[str] = []
        _collect_json_strings(data, raw_strings)
        if not raw_strings:
            continue
        translated = tr.translate_many(raw_strings)
        new_data = _apply_json_translations(data, translated)
        script.string = json.dumps(new_data, ensure_ascii=False, indent=2)


def set_head_meta(soup: BeautifulSoup, slug: str, title: str) -> None:
    html_tag = soup.find("html")
    if isinstance(html_tag, Tag):
        html_tag["lang"] = "en"

    body = soup.find("body")
    if isinstance(body, Tag):
        body["data-base"] = "../../../"
        body["data-locale"] = "en"

    for meta in soup.find_all("meta"):
        name = meta.get("name")
        prop = meta.get("property")
        content = meta.get("content")
        if not isinstance(content, str):
            continue
        if prop == "og:locale":
            meta["content"] = "en_US"

    title_tag = soup.find("title")
    if isinstance(title_tag, Tag):
        title_tag.string = title

    desc_tag = soup.find("meta", attrs={"name": "description"})
    og_desc_tag = soup.find("meta", attrs={"property": "og:description"})
    tw_desc_tag = soup.find("meta", attrs={"name": "twitter:description"})
    desc_value = ""
    if isinstance(desc_tag, Tag) and isinstance(desc_tag.get("content"), str):
        desc_value = desc_tag["content"]
    if not desc_value and isinstance(og_desc_tag, Tag) and isinstance(og_desc_tag.get("content"), str):
        desc_value = og_desc_tag["content"]

    if isinstance(desc_tag, Tag) and desc_value:
        desc_tag["content"] = desc_value
    if isinstance(og_desc_tag, Tag) and desc_value:
        og_desc_tag["content"] = desc_value
    if isinstance(tw_desc_tag, Tag) and desc_value:
        tw_desc_tag["content"] = desc_value

    og_title_tag = soup.find("meta", attrs={"property": "og:title"})
    tw_title_tag = soup.find("meta", attrs={"name": "twitter:title"})
    if isinstance(og_title_tag, Tag):
        og_title_tag["content"] = title
    if isinstance(tw_title_tag, Tag):
        tw_title_tag["content"] = title

    canonical_url = f"{SITE}/en/pages/{slug}/"
    zh_url = f"{SITE}/pages/{slug}/"

    canonical = soup.find("link", attrs={"rel": "canonical"})
    if isinstance(canonical, Tag):
        canonical["href"] = canonical_url
    else:
        head = soup.find("head")
        if isinstance(head, Tag):
            new_tag = soup.new_tag("link", rel="canonical", href=canonical_url)
            head.append(new_tag)

    # Reset hreflang links.
    for link in soup.find_all("link", attrs={"rel": "alternate"}):
        if link.get("hreflang"):
            link.decompose()

    head = soup.find("head")
    if isinstance(head, Tag):
        head.append(soup.new_tag("link", rel="alternate", hreflang="zh-Hant", href=zh_url))
        head.append(soup.new_tag("link", rel="alternate", hreflang="en", href=canonical_url))
        head.append(soup.new_tag("link", rel="alternate", hreflang="x-default", href=zh_url))

    og_url = soup.find("meta", attrs={"property": "og:url"})
    if isinstance(og_url, Tag):
        og_url["content"] = canonical_url

    css_link = None
    for link in soup.find_all("link", attrs={"rel": "stylesheet"}):
        href = link.get("href")
        if isinstance(href, str) and "main.css" in href:
            css_link = link
            break
    if isinstance(css_link, Tag):
        css_link["href"] = "../../../assets/css/main.css"
    else:
        head = soup.find("head")
        if isinstance(head, Tag):
            head.append(soup.new_tag("link", rel="stylesheet", href="../../../assets/css/main.css"))


def ensure_bottom_hashtags(soup: BeautifulSoup) -> None:
    main = soup.find("main")
    if not isinstance(main, Tag):
        return
    text = main.get_text(" ", strip=True)
    if "#Joyforest" in text:
        return

    section = soup.new_tag("section", attrs={"class": "section section-alt"})
    container = soup.new_tag("div", attrs={"class": "container content-block text-center"})
    p = soup.new_tag("p", attrs={"class": "price-table-caption", "style": "margin:0;line-height:1.8;"})
    p.string = HASHTAGS_TEXT
    container.append(p)
    section.append(container)
    main.append(section)


def ensure_required_internal_links(soup: BeautifulSoup) -> None:
    main = soup.find("main")
    if not isinstance(main, Tag):
        return

    required = [
        ("../balloon-tent/", "Balloon Tent"),
        ("../cloud-tent/", "Cloud Tent"),
        ("../availability/", "Availability"),
        ("../party-event-space/", "Party Event Space"),
    ]
    existing = set()
    for a in soup.find_all("a"):
        href = a.get("href")
        if isinstance(href, str):
            existing.add(href.split("#")[0].split("?")[0])

    missing = [(href, label) for href, label in required if href not in existing]
    if not missing:
        return

    section = soup.new_tag("section", attrs={"class": "section"})
    container = soup.new_tag("div", attrs={"class": "container content-block text-center"})
    h2 = soup.new_tag("h2", attrs={"class": "section-title"})
    h2.string = "Explore More Joyforest Pages"
    container.append(h2)

    ul = soup.new_tag("ul", attrs={"class": "pet-internal-links"})
    for href, label in missing:
        li = soup.new_tag("li")
        a = soup.new_tag("a", attrs={"href": href, "class": "btn btn-outline-dark"})
        a.string = f"View {label}"
        li.append(a)
        ul.append(li)
    container.append(ul)
    section.append(container)
    main.append(section)


def strip_cjk_residue(soup: BeautifulSoup) -> None:
    for node in soup.find_all(string=True):
        if not isinstance(node, NavigableString):
            continue
        parent = node.parent
        if not parent or parent.name in {"script", "style"}:
            continue
        raw = str(node)
        cleaned = ZH_RE.sub("", raw)
        if cleaned != raw:
            node.replace_with(cleaned)

    for tag in soup.find_all(True):
        for attr, val in list(tag.attrs.items()):
            if isinstance(val, str):
                cleaned = ZH_RE.sub("", val)
                if cleaned != val:
                    tag[attr] = cleaned


def ensure_footer_scripts(soup: BeautifulSoup) -> None:
    body = soup.find("body")
    if not isinstance(body, Tag):
        return

    for script in body.find_all("script", src=True):
        src = str(script.get("src"))
        if src.endswith("assets/js/lang-switch.js") or src.endswith("assets/js/main.js"):
            script.decompose()
        else:
            script["src"] = (
                src.replace("../../assets/", "../../../assets/")
                .replace("../assets/", "../../../assets/")
            )

    body.append(soup.new_tag("script", src="../../../assets/js/lang-switch.js"))
    body.append(soup.new_tag("script", src="../../../assets/js/main.js"))


def generate_page(config: dict[str, str], tr: Translator) -> None:
    source = Path(config["source"])
    dest = Path(config["dest"])
    slug = config["slug"]
    title = config["title"]

    html = source.read_text(encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")

    text_nodes, attr_nodes = collect_translatables(soup)
    all_texts = [raw for _, raw in text_nodes] + [raw for _, _, raw in attr_nodes]
    translated_map = tr.translate_many(all_texts)
    apply_translations(text_nodes, attr_nodes, translated_map)
    translate_json_ld(soup, tr)
    update_asset_paths(soup)
    update_internal_links(soup)
    set_head_meta(soup, slug, title)
    ensure_required_internal_links(soup)
    ensure_bottom_hashtags(soup)
    strip_cjk_residue(soup)
    ensure_footer_scripts(soup)

    dest.parent.mkdir(parents=True, exist_ok=True)
    output = str(soup)
    output = output.replace("\r\n", "\n")
    dest.write_text(output, encoding="utf-8")


def main() -> None:
    tr = Translator()
    for cfg in PAGE_CONFIGS:
        generate_page(cfg, tr)
        print(f"Generated: {cfg['dest'].relative_to(ROOT)}")


if __name__ == "__main__":
    main()
