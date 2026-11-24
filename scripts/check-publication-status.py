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
assert status['available_workbooks']==0 and status['status']=='withdrawn_for_review','Workbook release requires separate review'
assert not list(ROOT.rglob('*.xlsx')),'Unexpected workbook restored'
print(f'PASS: {len(blog)} articles; workbook downloads remain paused; dates: {status.get("review_dates",{})}')
