# -*- coding: utf-8 -*-
"""临时校验：解析 splash.wxss 中的箭头 SVG，验证对称性。"""
import re
from urllib.parse import unquote

PATH = r"C:\Users\xingzi\Desktop\前端\陶瓷博物馆\pages\splash\splash.wxss"
src = open(PATH, encoding="utf-8").read()

m = re.search(r'background-image:\s*url\("data:image/svg\+xml,(.*?)"\);', src, re.S)
if not m:
    print("未匹配到 SVG data URL")
    raise SystemExit(1)

svg = unquote(m.group(1))
print("=== 解码后的 SVG ===")
print(svg)
print()

d = re.search(r"d='([^']+)'", svg).group(1)
nums = [float(n) for n in re.findall(r"-?\d+\.?\d*", d)]
x1, y1, x2, y2, x3, y3 = nums

print(f"左端({x1},{y1})   顶点({x2},{y2})   右端({x3},{y3})")
print(f"对称轴 x = {x2}")
print(f"左端到轴距 = {x2 - x1:.4f}   右端到轴距 = {x3 - x2:.4f}")
print(f"严格镜像: {abs((x2 - x1) - (x3 - x2)) < 1e-9}")
print(
    f"左线段长 = {((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5:.4f}"
    f"   右线段长 = {((x3 - x2) ** 2 + (y3 - y2) ** 2) ** 0.5:.4f}"
)
print()

for attr in ["stroke-linecap='round'", "stroke-linejoin='round'", "stroke-width='1.5'"]:
    print(f"  {attr} => {'OK' if attr in svg else '缺失!'}")

print()
print("=== 校验关键 CSS ===")
for k in [
    "background-size: 100% 100%",
    "background-repeat: no-repeat",
    "transform: translateY(0)",
]:
    print(f"  {k} => {'OK' if k in src else '缺失!'}")
print(f"  残留 rotate(-45deg) => {'仍存在!' if 'rotate(-45deg)' in src else 'OK 已清除'}")
