#!/usr/bin/env python3
"""Read-only release guard for published article and workbook status."""
from pathlib import Path
from html.parser import HTMLParser
import json, re, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':
   v=dict(attrs).get('href','')
   if v.startswith('articles/'):self.links.append(v.split('#')[0])
p=Links();p.feed((ROOT/'blog.html').read_text());blog=set(p.links)
tree=ET.parse(ROOT/'sitemap.xml');ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
site={e.text.removeprefix('https://accounting-capsule.github.io/') for e in tree.findall('.//s:loc',ns) if e.text and '/articles/' in e.text}
status=json.loads((ROOT/'assets/download-status.json').read_text())
assert blog==site,'Blog/sitemap article targets disagree'
assert len(blog)==status['published_articles'],'Published article count disagrees'
assert all((ROOT/x).is_file() for x in blog),'Missing article file'
assert status['available_workbooks']==109 and status['available_files']==218 and status['status']=='available','Workbook status disagrees with the reviewed library'
ALLOWED_XLSX={'assets/studies/coffee-vending-financial-model-2026-11-26.xlsx','assets/studies/laundry-delivery-financial-model-2026-11-28.xlsx','assets/studies/mobile-accessories-financial-model-2026-11-28.xlsx'}  # Omar 27 Nov 2026: keep as is
LIB={str(x.relative_to(ROOT)) for x in (ROOT/'downloads').glob('*.xlsx')}
fam={n.removesuffix('-accounting-blank.xlsx').removesuffix('-accounting.xlsx') for n in (x.split('/')[-1] for x in LIB)}
assert len(LIB)==218 and len(fam)==109 and all(f'downloads/{f}-accounting.xlsx' in LIB and f'downloads/{f}-accounting-blank.xlsx' in LIB for f in fam),'Library must be 109 pairs'
assert all((ROOT/'programs'/f'{f}.html').is_file() for f in fam),'Program page missing for a workbook family'
assert {str(x.relative_to(ROOT)) for x in ROOT.rglob('*.xlsx') if not str(x.relative_to(ROOT)).startswith('downloads/')}<=ALLOWED_XLSX,'Unexpected workbook outside the library'
print(f'PASS: {len(blog)} articles; 109 workbook pairs live; dates: {status.get("review_dates",{})}')
