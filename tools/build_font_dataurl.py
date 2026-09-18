# -*- coding: utf-8 -*-
"""
字体 data URL 生成脚本
==========================================================================
用途
--------------------------------------------------------------------------
把字体子集转换为 base64 data URL，输出到 utils/font-source.js，
供 app.js 的 wx.loadFontFace 使用。

为什么用 data URL 而不是文件路径
--------------------------------------------------------------------------
小程序真机上 wx.loadFontFace 对「包内相对路径」的支持不稳定，
部分基础库/机型会加载失败并静默回退系统字体（表现为黑体）。
data URL 直接内联字体数据，无需网络请求与路径解析，兼容性最好。

代价：base64 比原文件大约 33%（236KB → ~315KB），仍在主包 2MB 内。

完整工作流（缺字或换字体时）
--------------------------------------------------------------------------
    # 1. 裁子集（如需加字，先改 subset_font.py 里的 SCENE_CHARS）
    python tools/subset_font.py

    # 2. 由子集体生成 data URL（本脚本）
    python tools/build_font_dataurl.py

    # 3. 生成完可删除子集文件（数据已内联），节省主包体积：
    #    del assets\\fonts\\*.woff2

⚠️ 注意：subset_font.py 会把子集写到 assets/fonts/，
   而子集文件本身不必打进小程序包（数据已内联到 font-source.js）。
   若不想它占体积，生成 data URL 后删除即可。

依赖
--------------------------------------------------------------------------
无（仅用 Python 标准库）
==========================================================================
"""
import base64
import os
import sys

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------
PROJECT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
)

# 输入：子集字体文件（woff2 优先，不存在则回退 ttf）
INPUT_CANDIDATES = [
    ("assets/fonts/SourceHanSerifCN-Regular.subset.woff2", "font/woff2"),
    ("assets/fonts/SourceHanSerifCN-Regular.subset.ttf", "font/ttf"),
]

# 输出：JS 模块
OUTPUT_JS = os.path.join(PROJECT_DIR, "utils", "font-source.js")


def main():
    src_path = None
    mime = None

    for rel, m in INPUT_CANDIDATES:
        p = os.path.join(PROJECT_DIR, rel)
        if os.path.exists(p):
            src_path = p
            mime = m
            break

    if not src_path:
        print("❌ 未找到字体子集文件，请先运行 tools/subset_font.py")
        for rel, _m in INPUT_CANDIDATES:
            print(f"   缺少：{rel}")
        sys.exit(1)

    raw = open(src_path, "rb").read()
    kb = len(raw) / 1024
    print(f"输入：{os.path.relpath(src_path, PROJECT_DIR)}  {kb:.1f} KB")

    b64 = base64.b64encode(raw).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"

    # 生成 JS 模块（单行 data URL，便于小程序打包器处理）
    js = (
        "/**\n"
        " * utils/font-source.js — 思源宋体子集的 base64 data URL\n"
        " * ----------------------------------------------------------------------\n"
        " * ⚠️ 本文件由 tools/build_font_dataurl.py 自动生成，请勿手动编辑。\n"
        " *\n"
        " * 来源：assets/fonts/SourceHanSerifCN-Regular.subset.woff2\n"
        f" * 体积：{len(raw)} 字节（{kb:.1f} KB）\n"
        " *\n"
        " * 重新生成步骤：\n"
        " *   1. python tools/subset_font.py          # 裁子集（缺字时改 SCENE_CHARS）\n"
        " *   2. python tools/build_font_dataurl.py   # 生成本 data URL\n"
        " * ----------------------------------------------------------------------\n"
        " */\n\n"
        f"module.exports = '{data_url}';\n"
    )

    os.makedirs(os.path.dirname(OUTPUT_JS), exist_ok=True)
    with open(OUTPUT_JS, "w", encoding="utf-8") as fh:
        fh.write(js)

    out_kb = os.path.getsize(OUTPUT_JS) / 1024
    print(f"输出：{os.path.relpath(OUTPUT_JS, PROJECT_DIR)}  {out_kb:.1f} KB")
    print(f"      （base64 膨胀率 {out_kb / kb * 100:.1f}%）")
    print()
    print("✅ 完成。app.js 会通过 require('./utils/font-source') 读取该 data URL。")


if __name__ == "__main__":
    main()
