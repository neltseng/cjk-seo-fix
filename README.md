# CJK SEO Fix

修正 Yoast SEO 和 Rank Math 的中文字數計算。

## 問題

Yoast SEO 和 Rank Math 用空格分詞計算字數。中文沒有空格，3,000 字的文章被算成 0–19 個 word，導致內容長度、關鍵字密度、可讀性分數、SEO 總分全部失準。

## 安裝後修正的項目

- **內容長度** — 用字元數取代空格分詞
- **關鍵字密度** — 正確的分母
- **關鍵字偵測** — 標題、描述、首段、子標題中的關鍵字子字串匹配
- **句子和段落長度** — 用字元計算
- **可讀性分數** — 真實分數，消除假陽性
- **SEO 總分** — 基於正確的指標
- **Schema.org wordCount** — 結構化資料中的正確字數
- **不適用中文的評估** — Flesch 可讀性、被動語態、轉換詞自動停用

Gutenberg 和傳統編輯器都支援。

## 修正前後對比

### Yoast SEO

| 指標 | 修正前 | 修正後 |
|---|---|---|
| 文字長度 | 14 words — 判定過短 | **767 字元** — 良好 |
| 關鍵字密度 | found 0 times | **偵測到** |
| SEO 分數 | 37 | **66** |
| 可讀性 | 90（假陽性） | **60**（真實） |

### Rank Math

| 指標 | 修正前 | 修正後 |
|---|---|---|
| 字數 | 19 words | **808 字元** |
| 關鍵字密度 | 94.74% | **2.23%** |
| SEO 分數 | 61/100 | **58/100** |

## 安裝

1. 從 [Releases](https://github.com/neltseng/cjk-seo-fix/releases) 下載 zip 或 clone
2. 整個資料夾放到 `wp-content/plugins/cjk-seo-fix/`
3. 在 WordPress 後台啟用

自動偵測 Yoast 和 Rank Math，兩個都裝就兩個都修。支援 WPML 和 Polylang。

## 相容性

| | 已測試版本 |
|---|---|
| Yoast SEO | 23.0 – 27.3 |
| Rank Math | 1.0.230 – 1.0.267 |
| WordPress | 6.0+ |
| PHP | 7.4+ |

超出測試範圍時，該 SEO 外掛的修正會自動停用並顯示後台通知。

## 授權

GPL-2.0-or-later
