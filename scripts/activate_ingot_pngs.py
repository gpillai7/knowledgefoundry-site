#!/usr/bin/env python3
"""Point Ingot catalogue entries at verified lossless PNG masters, where supplied.

Run from the repository root. Existing WebP full artwork and thumbnails
are deliberately retained; converting a lossy WebP to PNG adds no detail.
"""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / "ingots" / "catalogue.json"
FULL = ROOT / "images" / "thoughttiles" / "full"
PNG_MAGIC = bytes.fromhex("89504e470d0a1a0a")


def main() -> int:
    raw = CATALOGUE.read_text(encoding="utf-8")
    data = json.loads(raw)
    changed = []
    missing = []
    invalid = []
    for item in data["items"]:
        png = FULL / f'{item["id"]}.png'
        if not png.exists():
            missing.append(item["id"])
            continue
        with png.open("rb") as fh:
            if fh.read(8) != PNG_MAGIC:
                invalid.append(item["id"])
                continue
        target = f'../images/thoughttiles/full/{item["id"]}.png'
        if item.get("image") != target:
            item["image"] = target
            changed.append(item["id"])
    if invalid:
        print("Invalid PNG files, not used:", ", ".join(invalid), file=sys.stderr)
        return 1
    if changed:
        CATALOGUE.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Updated:", ", ".join(changed) if changed else "none")
    print(f"Original PNG masters available: {len(data['items']) - len(missing)} / {len(data['items'])}")
    print(f"Awaiting original PNG masters: {len(missing)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
