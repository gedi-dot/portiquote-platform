#!/usr/bin/env python3
"""Generate public/email-logo.png — the two-tone wordmark for email headers.

Email clients strip webfonts, so the header logo has to be a picture. This
draws it at 4x the display size for retina, on transparency, so it sits on the
sea band (#0B4A54) without a seam.

"GasDi" in paper, "Caravan" in saffron — on the dark band ink would vanish,
which is the same flip the Wordmark component makes with onDark.

Re-run after a name change:  python3 scripts/generate-email-logo.py "New Name"
Then update the width/height on the <img> in lib/email.ts to the printed
display size, or the logo will stretch.
"""
import os, sys, urllib.request
from PIL import Image, ImageDraw, ImageFont

NAME = sys.argv[1] if len(sys.argv) > 1 else "GasDi Caravan"
first, _, second = NAME.partition(" ")

SAFF, PAPER = (242, 168, 59), (251, 252, 251)
SIZE = 96          # 4x the ~24px the wordmark reads at in the header
PAD = 10

here = os.path.dirname(os.path.abspath(__file__))
fdir = os.path.join(here, "fonts"); os.makedirs(fdir, exist_ok=True)
SRC = "https://raw.githubusercontent.com/google/fonts/main/ofl"
p = os.path.join(fdir, "BricolageVar.ttf")
if not os.path.exists(p):
    urllib.request.urlretrieve(
        f"{SRC}/bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf", p)

font = ImageFont.truetype(p, SIZE)
try:
    # Axis order in this font is opsz, wght, wdth — NOT the order in its
    # filename. Passing them in filename order silently yields a thin,
    # condensed wordmark, because each value is clamped into the wrong axis.
    font.set_variation_by_axes([SIZE, 800, 100])
except Exception:
    pass

probe = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
w1 = probe.textlength(first, font=font)
w2 = probe.textlength(" " + second, font=font)
box = probe.textbbox((0, 0), NAME, font=font)

W = int(w1 + w2) + PAD * 2
H = int(box[3] - box[1]) + PAD * 2
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
y = PAD - box[1]
d.text((PAD, y), first, font=font, fill=PAPER)
d.text((PAD + w1, y), " " + second, font=font, fill=SAFF)

out = os.path.join(here, "..", "public", "email-logo.png")
img.save(out, "PNG", optimize=True)
print(f"wrote {os.path.abspath(out)} {img.size}")
print(f"set the <img> in lib/email.ts to width={W // 4} height={H // 4}")
