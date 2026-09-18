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
- **后续新增页面出现「豆腐块」（子集缺字）时**，把新字加进 SCENE_CHARS 后重跑

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
import os
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
SCENE_CHARS = (
    # --- 项目已确认文案 ---
    "陶瓷博物馆传承千年匠心遇见非遗之美走进感受文化温度向上滑动开启"
    "之旅登录注册首页导览鉴赏文物详情预约个人团队志愿者成功我的"
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
)

# 中英文标点 + 全角符号
PUNCTUATION = (
    "　、。〃々〈〉《》「」『』【】〔〕〖〗！＂＃＄％＆＇（）＊＋，－．／"
    "０１２３４５６７８９：；＜＝＞？＠［＼］＾＿｀｛｜｝～"
    "·—…‘’“”※←→↑↓√×÷±°℃¥€£§¶†‡•‰′″"
)


def scan_project_chars(root):
    """扫描项目源码（wxml/js/wxss/json/md）中出现的所有汉字。"""
    chars = set()
    for dirpath, _dirnames, filenames in os.walk(root):
        if "node_modules" in dirpath or ".git" in dirpath:
            continue
        for fn in filenames:
            if fn.endswith((".wxml", ".js", ".json", ".wxss", ".md", ".html")):
                try:
                    with open(os.path.join(dirpath, fn), encoding="utf-8") as fh:
                        content = fh.read()
                except Exception:
                    continue
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
    print()
    print("👉 若后续页面出现方框/豆腐块，说明子集缺字：")
    print("   把缺的字补进脚本的 SCENE_CHARS，重新运行本脚本即可。")


if __name__ == "__main__":
    main()
