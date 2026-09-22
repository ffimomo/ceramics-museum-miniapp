# -*- coding: utf-8 -*-
"""
字体子集化脚本（项目内副本）
==========================================================================
用途
--------------------------------------------------------------------------
把思源宋体完整版（11MB+）裁剪为项目可用的子集（~235KB），
以通过微信小程序 2MB 主包体积限制。

使用时机
--------------------------------------------------------------------------
- 初始接入字体时
- **每次新增页面 / 改文案后**：本脚本会自动校验子集是否覆盖项目全部用字，
  缺字会直接报错并列出缺的字，把缺字补进 SCENE_CHARS 后重跑即可。

⚠️ 为什么必须在新增页面后重跑
    字体子集是「一次性裁剪」的，而页面文案是「持续新增」的。
    历史上因为先裁字体、后写登录页，导致 陆/住/还/欢/迎 等字缺失，
    真机上被系统用黑体兜底，表现为「宋体和黑体混用」。
    脚本末尾的覆盖率校验就是为了让这类问题在本地暴露，而不是等真机发现。

运行方式
--------------------------------------------------------------------------
    python tools/subset_font.py

依赖
--------------------------------------------------------------------------
    pip install fonttools brotli zopfli

输出
--------------------------------------------------------------------------
    assets/fonts/SourceHanSerifCN-Regular.subset.woff2

接入方式（app.js）
--------------------------------------------------------------------------
    wx.loadFontFace({
      family: 'CeramicsSerif',                       // 需与 app.wxss 链首一致
      source: 'url("/assets/fonts/...subset.woff2")',
      global: true,
    })
==========================================================================
"""
import json
import os
import re
import sys

from fontTools import subset

# ---------------------------------------------------------------------------
# 配置：按实际情况修改
# ---------------------------------------------------------------------------

# 源字体（思源宋体 CN 简体完整版 Regular）
SRC_FONT = (
    r"C:\Users\xingzi\Desktop\美工UI\字体"
    r"\思源宋体(Adobe完整版2.003)_猫啃网"
    r"\思源宋体(Adobe完整版2.003)"
    r"\14_SourceHanSerifCN\SubsetOTF\CN\SourceHanSerifCN-Regular.otf"
)

# 输出目录与文件名
PROJECT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
)
OUT_DIR = os.path.join(PROJECT_DIR, "assets", "fonts")
OUT_NAME = "SourceHanSerifCN-Regular.subset.woff2"

# 场景高频字：陶瓷博物馆业务 + 界面通用词
# ⚠️ 新增页面若出现缺字，把缺的字补进这里再重跑脚本
#    本脚本末尾会自动校验「项目用字覆盖率」，缺字会直接报错，不必等到真机上才发现。
SCENE_CHARS = (
    # --- 项目已确认文案 ---
    "陶瓷博物馆传承千年匠心遇见非遗之美走进感受文化温度向上滑动开启"
    "之旅登录登陆注册首页导览鉴赏文物详情预约个人团队志愿者成功我的"
    # --- 登录 / 注册 / 账号流程 ---
    "欢迎记住密码忘记还没有去其他方式手机号验证码获取协议隐私政策"
    "同意勾选星标圆圈正确错误提示请输入确认新密码重复找回重置"
    # --- 博物馆场景（器物/朝代/工艺/展厅） ---
    "古青铜玉器瓷釉彩绘纹饰瓶罐盘碗壶尊鼎炉窑烧制唐宋元明清汉代"
    "新石器商周春秋战国秦汉魏晋南北朝隋五代宋辽金西夏民国现代"
    "展览陈列藏品精品珍品修复保护研究学术讲座活动资讯公告参观"
    "开放时间门票免费收费讲解员图楼层展厅一号二三四号"
    "须知注意事项地址交通路线电话联系客服咨询在线留言反馈"
    "收藏分享点赞评论浏览历史记录通知消息设置账号退出"
    "姓名手机验证码获取密码忘记协议隐私政策同意"
    "取消确定提交保存编辑删除修改添加搜索筛选排序全部最新热门"
    # --- 界面通用词 ---
    "返回上一页下首页尾页加载完成暂无数据内容为空"
    "请输入关键字未找到结果网络异常请稍后重试重新"
    "期星日今日明日昨"
    "年月日时分秒上下午点开始结束持续时人数剩余可约已满"
    "温馨提示备注请注意务必提前准时入场谢绝携带宠物入内"
    "文明勿触摸展品使闪光灯保持安静爱护"
    # --- 首页卡片标题补字（2026-09-19） ---
    #    现象：真机上「博物馆介绍」「近期特展」呈现宋体/黑体混用。
    #    原因：以下字不在子集内，渲染时被系统用无衬线体（黑体）兜底。
    #    注：这些标题的 CSS 已正确声明 --font-serif，无需改样式；
    #        此处补字后重跑 subset_font.py + build_font_dataurl.py 即可。
    "介绍近特展"
    # --- 宣纸 / 陶瓷质感等视觉描述词（文案注释里常出现） ---
    "宣纸米黄色质感背景花瓶线稿独立素材睁眼闭眼明文密文状态"
    "独盖遮挡覆盖焦独占延伸绕维聚纤维短矩亮斑暗纹理轴折叠"
    "琐碎应弱化省份额提醒符锁镜陷隔驳柔软棕黄绿蓝紫灰白黑"
)

# 中英文标点 + 全角符号
PUNCTUATION = (
    "　、。〃々〈〉《》「」『』【】〔〕〖〗！＂＃＄％＆＇（）＊＋，－．／"
    "０１２３４５６７８９：；＜＝＞？＠［＼］＾＿｀｛｜｝～"
    "·—…‘’“”※←→↑↓√×÷±°℃¥€£§¶†‡•‰′″"
)


def strip_non_visible(content, filename):
    """
    剥离「不会渲染成字形」的内容，只保留真正会显示给用户的文字。

    为什么要剥离
    ------------------------------------------------------------------
    字体子集只服务于「屏幕上会画出来的字」。注释、类名、变量名、
    色值、路径这些内容永远不会被渲染，把它们算进子集纯粹浪费主包体积。
    早期版本直接扫描整份源码，导致往注释里写中文就会让子集膨胀。

    ⚠️ 注意：剥离后仍会保留 SCENE_CHARS 里的业务高频字，
       所以即使某段文案被误判剥离，也有兜底。
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".wxml":
        # WXML：去掉 <!-- --> 注释，再去掉所有标签与属性，只留标签之间的文本
        content = re.sub(r"<!--.*?-->", "", content, flags=re.S)
        content = re.sub(r"<[^>]*>", "", content)

    elif ext == ".wxss":
        # WXSS：只保留声明块里的内容值，去掉选择器、属性名、注释
        content = re.sub(r"/\*.*?\*/", "", content, flags=re.S)
        kept = []
        for block in re.findall(r"\{([^}]*)\}", content):
            for decl in block.split(";"):
                # 只取属性的「值」部分（冒号之后），丢弃属性名
                if ":" in decl:
                    kept.append(decl.split(":", 1)[1])
        content = " ".join(kept)

    elif ext == ".js":
        # JS：去掉块注释与行注释，再去掉字符串字面量外的标识符
        content = re.sub(r"/\*.*?\*/", "", content, flags=re.S)
        content = re.sub(r"//[^\n]*", "", content)
        # 只保留字符串字面量里的内容（UI 文案都在字符串里）
        lits = re.findall(r"'([^']*)'|\"([^\"]*)\"|`([^`]*)`", content)
        content = " ".join(a or b or c for a, b, c in lits)

    elif ext == ".json":
        # JSON：只保留字符串值（页面标题等），去掉键名
        try:
            data = json.loads(content)
        except Exception:
            return ""
        vals = []

        def walk(o):
            if isinstance(o, dict):
                for k, v in o.items():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
            elif isinstance(o, str):
                vals.append(o)

        walk(data)
        content = " ".join(vals)

    return content


def scan_project_chars(root, visible_only=True):
    """
    扫描项目源码中「会渲染成字形」的汉字。

    visible_only=True 时剥离注释与代码标识符，只统计可见文案用字（推荐）。
    """
    chars = set()
    for dirpath, _dirnames, filenames in os.walk(root):
        if "node_modules" in dirpath or ".git" in dirpath:
            continue
        for fn in filenames:
            if not fn.endswith((".wxml", ".wxss", ".js", ".json", ".md", ".html")):
                continue
            if fn == "font-source.js":  # 字体数据本身，跳过
                continue
            try:
                with open(os.path.join(dirpath, fn), encoding="utf-8") as fh:
                    content = fh.read()
            except Exception:
                continue

            if visible_only and fn.endswith((".wxml", ".wxss", ".js", ".json")):
                content = strip_non_visible(content, fn)

            for ch in content:
                if "\u4e00" <= ch <= "\u9fff":
                    chars.add(ch)
    return chars


def build_charset():
    chars = set()

    proj = scan_project_chars(PROJECT_DIR)
    chars |= proj
    print(f"[1/3] 项目源码用字：{len(proj)} 个")

    scene = set(SCENE_CHARS)
    chars |= scene
    print(f"[2/3] 场景高频字：{len(scene)} 个")

    extra = set(chr(i) for i in range(0x20, 0x7F)) | set(PUNCTUATION)
    chars |= extra
    print(f"[3/3] ASCII + 标点：{len(extra)} 个")

    print(f"      合计：{len(chars)} 个字符")
    return chars


def verify_coverage(out_path):
    """
    裁剪后的闭环校验：用生成的子集反查项目源码用字，缺字则报错。

    ⚠️ 这一步是本脚本最重要的部分。历史上因为「先裁字体、后写页面」，
       登录页的 陆/住/还/欢/迎 等字全部缺失，真机上被系统用黑体兜底，
       表现为「宋体和黑体混用」。加入本校验后，同类问题会在本地暴露。
    """
    from fontTools.ttLib import TTFont

    print()
    print("=" * 66)
    print("覆盖率校验：检查子集是否覆盖项目当前全部用字")
    print("=" * 66)

    font = TTFont(out_path)
    cmap = font.getBestCmap()

    # 只校验「会渲染成字形」的用字；注释里的中文不参与校验，
    # 否则往注释里写中文就会误报缺字（也白白膨胀子集）。
    proj_chars = scan_project_chars(PROJECT_DIR, visible_only=True)
    missing = sorted(c for c in proj_chars if ord(c) not in cmap)

    print(f"  子集字符数            : {len(cmap)}")
    print(f"  项目可见文案用字数    : {len(proj_chars)}")
    print(f"  缺失字符数            : {len(missing)}")

    if missing:
        print()
        print(f"  ❌ 缺失 {len(missing)} 个字符：{''.join(missing)}")
        print()
        print("  这些字会出现在界面上但字体里没有，真机上会显示为豆腐块，")
        print("  或被系统用黑体兜底（表现为「宋体黑体混用」）。")
        print("  请把它们补进脚本顶部的 SCENE_CHARS，然后重新运行本脚本。")
        return False

    print("  ✅ 界面可见文案全部覆盖，无豆腐块风险")
    return True


def main():
    if not os.path.exists(SRC_FONT):
        print(f"❌ 源字体不存在：\n   {SRC_FONT}")
        print("   请修改脚本顶部的 SRC_FONT 配置")
        sys.exit(1)

    os.makedirs(OUT_DIR, exist_ok=True)
    out_path = os.path.join(OUT_DIR, OUT_NAME)

    src_mb = os.path.getsize(SRC_FONT) / 1024 / 1024
    print(f"源字体：{os.path.basename(SRC_FONT)}  {src_mb:.1f} MB\n")

    charset = build_charset()
    text = "".join(sorted(charset))
    print()

    # --- 基本参数 ---
    options = subset.Options()
    options.flavor = "woff2"            # 小程序支持 woff2，压缩率最高
    options.desubroutinize = True       # 去子程序化，进一步减小体积
    options.layout_features = ["*"]     # 保留全部 OpenType 特性（连字等）
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.recalc_bounds = True
    options.recalc_timestamp = False
    options.drop_tables += [
        "EBDT", "EBLC", "SVG ", "COLR", "CPAL",  # 位图 / 彩色字体表
        "MATH", "BASE", "JSTF",                   # 数学 / 基线 / 断行
    ]

    font = subset.load_font(SRC_FONT, options)
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    subset.save_font(font, out_path, options)
    font.close()

    out_kb = os.path.getsize(out_path) / 1024
    pct = out_kb / 1024 / src_mb * 100
    print(f"✅ 完成：{out_path}")
    print(f"   体积：{out_kb:.1f} KB  （原始 {src_mb:.1f} MB → 压缩至 {pct:.2f}%）")
    print(f"   字符：{len(charset)} 个")

    # --- 闭环校验 ---
    ok = verify_coverage(out_path)

    print()
    print("=" * 66)
    print("下一步")
    print("=" * 66)
    print("   1. python tools/build_font_dataurl.py   # 生成 data URL")
    print("   2. 删除 assets/fonts/*.woff2（数据已内联，省主包体积）")

    if not ok:
        print()
        print("⚠️ 存在缺字，请先按上述提示补字后重跑，再执行下一步。")
        sys.exit(1)


if __name__ == "__main__":
    main()
