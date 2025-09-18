#!/usr/bin/env python3
import json
import os
import re
import sys
from datetime import datetime

import requests
import yaml

ROOT = os.path.dirname(os.path.dirname(__file__))
AUTHORS_FILE = os.path.join(ROOT, '_data', 'authors.yml')
OUTPUT_FILE = os.path.join(ROOT, '_data', 'publications.json')

CR_API = 'https://api.crossref.org/works'
ORCID_WORKS = 'https://pub.orcid.org/v3.0/{orcid}/works'

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'ODyn-StAndrews.github.io/1.0 (+https://github.com/ODyn-StAndrews)'
})

def slugify(s: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def get_json(url, **kwargs):
    r = SESSION.get(url, timeout=30, **kwargs)
    r.raise_for_status()
    return r.json()

def extract_pub_from_crossref(item):
    title = ' '.join(item.get('title') or [])
    authors = []
    for a in item.get('author', []) or []:
        name = ' '.join(filter(None, [a.get('given'), a.get('family')]))
        if not name:
            name = a.get('name') or ''
        if name:
            authors.append(name)
    container = ' '.join(item.get('container-title') or [])
    issued = item.get('issued', {}).get('date-parts', [[None]])[0]
    year = issued[0] if issued else None
    doi = item.get('DOI')
    url = item.get('URL')
    return {
        'title': title.strip(),
        'authors': ', '.join(authors),
        'venue': container.strip(),
        'year': year,
        'doi': doi,
        'url': url,
    }

def fetch_by_orcid(orcid):
    pubs = []
    data = get_json(ORCID_WORKS.format(orcid=orcid), headers={'Accept': 'application/json'})
    groups = data.get('group', [])
    dois = set()
    for g in groups:
        s = (g.get('work-summary') or [None])[0] or {}
        exts = s.get('external-ids', {}).get('external-id', [])
        for e in exts:
            if e.get('external-id-type', '').lower() == 'doi':
                doi = e.get('external-id-value')
                if doi:
                    dois.add(doi.lower())
    for doi in dois:
        try:
            cr = get_json(f'{CR_API}/{requests.utils.quote(doi)}')
            item = cr.get('message', {})
            pubs.append(extract_pub_from_crossref(item))
        except Exception as e:
            print(f'WARN: crossref fetch failed for DOI {doi}: {e}', file=sys.stderr)
    return pubs

def fetch_by_crossref_query(name, extra_query=None, rows=50):
    params = {
        'query.author': name,
        'rows': rows,
        'sort': 'issued',
        'order': 'desc',
    }
    if extra_query:
        params['query'] = extra_query
    data = get_json(CR_API, params=params)
    items = data.get('message', {}).get('items', [])
    return [extract_pub_from_crossref(it) for it in items]

def main():
    with open(AUTHORS_FILE, 'r') as f:
        authors = yaml.safe_load(f) or []

    all_pubs = {}
    for a in authors:
        name = a.get('name')
        orcid = a.get('orcid')
        extra = a.get('crossref_query')
        pubs = []
        if orcid:
            try:
                pubs = fetch_by_orcid(orcid)
            except Exception as e:
                print(f'WARN: ORCID fetch failed for {name} ({orcid}): {e}', file=sys.stderr)
        if not pubs:
            try:
                pubs = fetch_by_crossref_query(name, extra)
            except Exception as e:
                print(f'WARN: Crossref query failed for {name}: {e}', file=sys.stderr)
        for p in pubs:
            key = (p.get('doi') or p.get('title')).lower()
            if key not in all_pubs:
                all_pubs[key] = p

    # Sort by year desc then title
    deduped = list(all_pubs.values())
    deduped.sort(key=lambda x: (x.get('year') or 0, x.get('title') or ''), reverse=True)

    out = {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'count': len(deduped),
        'items': deduped,
    }
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(out, f, indent=2)
    print(f'Wrote {len(deduped)} publications to {OUTPUT_FILE}')

if __name__ == '__main__':
    main()

