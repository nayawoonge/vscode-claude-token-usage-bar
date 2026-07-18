# Icon

`icon.png` (128×128) is the extension icon shown on the Marketplace and in the
Extensions panel. It is referenced from `package.json` (`"icon": "images/icon.png"`).

To regenerate it, run:

```bash
python3 scripts/make_icon.py
```

(requires Python with Pillow: `pip install pillow`)
