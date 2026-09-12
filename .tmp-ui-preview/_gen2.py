import pathlib

HEAD = """<!doctype html>
<html lang="zh-CN"{dark}>
<head>
<meta charset="utf-8" />
<title>{title}</title>
<link rel="stylesheet" href=".preview/preview.css" />
<style>
  body {{ padding: 14px; font-size: 13px; }}
  .stage {{ max-width: 1020px; margin: 0 auto; }}
  .window {{ border: 0; box-shadow: none; background: transparent; }}
  .titlebar, .tabstrip {{ display: none; }}
  .overlay.standalone {{ position: relative; background: color-mix(in srgb, var(--primary) 42%, transparent); border-radius: 10px; padding: 14px; }}
  .dialog {{ padding: 14px; gap: 10px; }}

  /* 两列布局：字段名 + 字段值，去掉类型/长度/NULL 元信息 */
  .field2-head, .field2-row {{ display: grid; grid-template-columns: 280px minmax(0, 1fr); }}
  .field2-head {{ background: var(--muted); border-bottom: 1px solid var(--border); font-size: 12.5px; font-weight: 600; }}
  .field2-head > div {{ padding: 8px 14px; }}
  .field2-body {{ max-height: none; }}
  .field2-row {{ border-bottom: 1px solid var(--border); }}
  .field2-row:last-child {{ border-bottom: 0; }}
  .field2-row > div {{ padding: 8px 14px; }}
  .field2-row .fname {{ font-weight: 600; word-break: break-word; }}
  .field2-row .comment {{ margin-top: 2px; font-size: 11px; color: var(--muted-foreground); white-space: pre-wrap; word-break: break-word; }}
  .field2-row .value-box {{ max-height: 120px; overflow: auto; }}
</style>
</head>
<body>
"""

TAIL = """    <div class="dialog-footer">
      <div style="display:flex;gap:8px">
        <span class="btn">&#10697; 复制整行（JSON 对象）</span>
        <span class="btn">&#10697; 复制行（TSV）</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>
"""

TITLEBAR = """  <div class="stage-title">{tag} {caption}</div>
  <div class="overlay standalone">
    <div class="dialog">
      <div class="dialog-toolbar">
        <span class="title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>第 22763 行详情</span>
        <span class="close">&#10005;</span>
      </div>
      <div class="meta-row"><span>19 列</span><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input placeholder="搜索字段名或值…" /></div></div>
"""

FIELDS = [
    ("seq", "22763", None),
    ("ctime", "2022-05-25 16:02:42.566667", None),
    ("mtime", "2022-05-25 16:02:42.566667", None),
    ("rmtime", "NULL", None),
    ("isvalid", "1", None),
    ("remark", "NULL", None),
    ("account_yy_jgb103", "zgxww002", "账号，关联 216 表 userid_yy_jgb216"),
    ("time_yy_jgb103", "2021-02", "时间，月份"),
]

def rows():
    out = []
    for name, value, comment in FIELDS:
        c = f'<div class="comment">{comment}</div>' if comment else ""
        null = " null" if value == "NULL" else ""
        out.append(f"""        <div class="field2-row">
          <div class="fname">{name}{c}</div>
          <div><div class="value-box{null}">{value}</div></div>
        </div>""")
    return "\n".join(out)

def page(dark: bool) -> str:
    tag = '<span class="tag new">方案 v2</span>'
    caption = "行详情对话框 · 两列（字段名 / 字段值）"
    html = HEAD.format(title="new-dialog-2col-dark" if dark else "new-dialog-2col", dark=' class="dark"' if dark else "")
    html += TITLEBAR.format(tag=tag, caption=caption)
    html += """      <div class="list-scroll">
        <div class="field2-head"><div>字段名</div><div>字段值</div></div>
        <div class="field2-body">
""" + rows() + "\n        </div>\n      </div>\n" + TAIL
    return html

pathlib.Path("d-new-dialog-2col.html").write_text(page(False))
pathlib.Path("d-new-dialog-2col-dark.html").write_text(page(True))
print("written")
