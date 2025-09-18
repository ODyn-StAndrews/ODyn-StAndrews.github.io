#!/usr/bin/env python3
import os
import re
import sys
import time
import mimetypes
from urllib.parse import urlparse

import requests
import yaml
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(__file__))
DATA_PATH = os.path.join(ROOT, '_data', 'members.yml')
IMG_DIR = os.path.join(ROOT, 'assets', 'img', 'people')

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'ODyn-StAndrews-SiteBot/1.0 (+https://github.com/ODyn-StAndrews)'
})

def extract_text(soup):
    # Prefer a visible profile/overview section; fallback to meta description
    candidates = []
    # Pure portal often has .rendering_research_overview or .textblock
    for sel in [
        '.rendering_research_overview',
        '.research-overview',
        '.profile',
        '.textblock',
        'section#profile',
    ]:
        el = soup.select_one(sel)
        if el and el.get_text(strip=True):
            candidates.append(el.get_text(" ", strip=True))
    if candidates:
        return max(candidates, key=len)
    meta = soup.find('meta', attrs={'name': 'description'})
    if meta and meta.get('content'):
        return meta['content'].strip()
    # fallback: first paragraph on page
    p = soup.find('p')
    return p.get_text(" ", strip=True) if p else None

def extract_links(soup):
    website = None
    orcid = None
    scholar = None
    # external links block
    for a in soup.find_all('a', href=True):
        href = a['href']
        if 'orcid.org' in href:
            m = re.search(r'(\d{4}-\d{4}-\d{4}-\d{3}[\dX])', href)
            if m:
                orcid = m.group(1)
        elif 'scholar.google.' in href:
            scholar = href
        # capture a personal website if labelled, else keep first external link under a reasonable domain
    # Many Pure pages provide canonical person URL as current page; treat that as website if not set
    # We'll set website to the page URL upstream when calling
    return orcid, scholar

def extract_image_url(soup):
    # Try OpenGraph image
    og = soup.find('meta', property='og:image')
    if og and og.get('content'):
        return og['content']
    # Try portrait-like images
    img = soup.select_one('img.portrait, img.profile, img[src*="/image/"]')
    if img and img.get('src'):
        return img['src']
    return None

def download_image(url, dest_basename):
    os.makedirs(IMG_DIR, exist_ok=True)
    r = SESSION.get(url, timeout=30)
    r.raise_for_status()
    ctype = r.headers.get('Content-Type', '')
    ext = None
    if 'image/' in ctype:
        ext = '.' + ctype.split('/')[1].split(';')[0]
    if not ext:
        path = urlparse(url).path
        ext = os.path.splitext(path)[1] or '.jpg'
    dest = os.path.join(IMG_DIR, dest_basename + ext)
    with open(dest, 'wb') as f:
        f.write(r.content)
    rel = os.path.relpath(dest, ROOT)
    return rel

def update_members(members):
    changed = False
    for m in members.get('current', []):
        page = m.get('website')
        if not page or 'research-portal.st-andrews.ac.uk' not in page:
            continue
        try:
            resp = SESSION.get(page, timeout=30)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, 'html.parser')
            # We no longer store bios in members.yml; remove if present
            if 'bio' in m:
                del m['bio']
                changed = True
            # Links
            orcid, scholar = extract_links(soup)
            if orcid and not m.get('orcid'):
                m['orcid'] = orcid
                changed = True
            if scholar and not m.get('scholar'):
                m['scholar'] = scholar
                changed = True
            # Image
            img_url = extract_image_url(soup)
            if img_url and ('placeholder' in (m.get('image') or '') or not m.get('image') or m['image'].startswith('http')):
                try:
                    rel_path = download_image(img_url, m['slug'])
                    m['image'] = '/' + rel_path.replace('\\', '/')
                    changed = True
                except Exception as ie:
                    print(f"WARN: image download failed for {m['name']}: {ie}")
            time.sleep(0.5)  # be gentle
        except Exception as e:
            print(f"WARN: fetch failed for {m.get('name')} ({page}): {e}", file=sys.stderr)
    return changed

def main():
    with open(DATA_PATH, 'r') as f:
        members = yaml.safe_load(f)
    # Ensure known websites are set for those provided via CLI? Here we assume YAML already has website URLs.
    changed = update_members(members)
    if changed:
        with open(DATA_PATH, 'w') as f:
            yaml.dump(members, f, sort_keys=False, allow_unicode=True)
        print('Updated members.yml')
    else:
        print('No changes')

if __name__ == '__main__':
    main()
