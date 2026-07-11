#!/usr/bin/env python3
"""Generate public/og.png (1200x630) — the social share card.
Re-run after the final company name is chosen: python3 scripts/generate-og.py "New Name"
Fonts: uses ./scripts/fonts if present, else downloads from the google/fonts repo.
"""
import math, os, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont

NAME = sys.argv[1] if len(sys.argv) > 1 else "N.K. GEDI & CO."
W, Hh = 1200, 630
INK, SEA, TIDE = (6,42,46), (11,74,84), (22,179,166)
SAFF, PAPER = (242,168,59), (251,252,251)

here = os.path.dirname(os.path.abspath(__file__))
fdir = os.path.join(here, "fonts"); os.makedirs(fdir, exist_ok=True)
SRC = "https://raw.githubusercontent.com/google/fonts/main/ofl"
def font_file(name, url):
    p = os.path.join(fdir, name)
    if not os.path.exists(p):
        for cand in ["/home/claude/deck/fonts/"+name]:
            if os.path.exists(cand):
                import shutil; shutil.copy(cand, p); break
        else:
            urllib.request.urlretrieve(url, p)
    return p

disp_path = font_file("BricolageVar.ttf", f"{SRC}/bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf")
mono_path = font_file("IBMPlexMono-SemiBold.ttf", f"{SRC}/ibmplexmono/IBMPlexMono-SemiBold.ttf")
sans_path = font_file("PlexSansVar.ttf", f"{SRC}/ibmplexsans/IBMPlexSans%5Bwdth%2Cwght%5D.ttf")

def load(path, size, wght=None):
    f = ImageFont.truetype(path, size)
    if wght is not None:
        try: f.set_variation_by_axes([wght])
        except Exception: pass
    return f

img = Image.new("RGB", (W, Hh), SEA)
d = ImageDraw.Draw(img)
# vertical gradient sea -> ink
for y in range(Hh):
    t = y / Hh
    d.line([(0,y),(W,y)], fill=tuple(int(SEA[i]+(INK[i]-SEA[i])*t) for i in range(3)))

# route arcs from a hub
hub = (760, 400)
targets = [(1120, 120), (1170, 300), (1100, 545), (620, 90)]
for tx, ty in targets:
    pts = []
    mx, my = (hub[0]+tx)/2, min(hub[1], ty) - abs(tx-hub[0])*0.28
    for s in range(41):
        u = s/40
        x = (1-u)**2*hub[0] + 2*(1-u)*u*mx + u**2*tx
        y = (1-u)**2*hub[1] + 2*(1-u)*u*my + u**2*ty
        pts.append((x,y))
    d.line(pts, fill=SAFF, width=3)
    d.ellipse([tx-6, ty-6, tx+6, ty+6], fill=SAFF)
d.ellipse([hub[0]-14, hub[1]-14, hub[0]+14, hub[1]+14], outline=SAFF, width=3)
d.ellipse([hub[0]-5, hub[1]-5, hub[0]+5, hub[1]+5], fill=PAPER)

# logo ring
lx, ly, r = 84, 92, 26
d.ellipse([lx-r, ly-r, lx+r, ly+r], outline=PAPER, width=4)
d.arc([lx-r, ly-r, lx+r, ly+r], start=-90, end=90, fill=SAFF, width=4)
d.ellipse([lx-6, ly-6, lx+6, ly+6], fill=SAFF)

kick = load(mono_path, 26)
d.text((132, 66), "FREIGHT FORWARDER MARKETPLACE", font=kick, fill=SAFF)
sub = load(mono_path, 20)
d.text((132, 102), NAME.upper() + "  ·  AFRICA-FIRST, WORLDWIDE", font=sub, fill=(251,252,251,180))

disp = load(disp_path, 92, wght=800)
d.text((76, 210), "Rooted in Africa.", font=disp, fill=PAPER)
d.text((76, 316), "Moving cargo", font=disp, fill=PAPER)
d.text((76, 422), "worldwide.", font=disp, fill=SAFF)

body = load(sans_path, 30, wght=500)
d.text((78, 548), "Post a shipment once — vetted forwarders compete.", font=body, fill=(233,240,238))

out = os.path.join(here, "..", "public", "og.png")
img.save(out, "PNG", optimize=True)
print("wrote", os.path.abspath(out), img.size)
