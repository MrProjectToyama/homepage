# Markdownベース記事管理システム

## 概要

Markdownファイルで記事を管理し、自動的にブログテンプレートに反映されるシステムです。

## ファイル構成

```
blog/
  ├── sample-article.md      # サンプル記事（Markdown形式）
  ├── template.html          # 記事テンプレート
  └── [その他の記事].md

src/
  ├── markdown-loader.js     # 記事読み込みシステム
  └── blog.html              # ブログ一覧ページ
```

## 記事の書き方

`blog/` ディレクトリに `*.md` ファイルを作成します。

### フォーマット

```markdown
---
date: 2026-04-24
tag: その他
title: 記事のタイトル
image: ../src/img/image.png
---

# ここからが本文です

Markdownで自由に執筆できます。

## 見出し

段落、**強調**、*斜体*など、すべてのMarkdown記法が使えます。

- リスト
- 項目
- に対応

```コード例```
```

### メタデータ（フロントマター）

YAMLフロントマターで以下を指定できます：

| キー | 必須 | 説明 |
|------|------|------|
| date | ✓ | 投稿日（YYYY-MM-DD形式） |
| tag | ✓ | タグ（活動 / イベント / お知らせ / その他） |
| title | ✓ | 記事のタイトル |
| image | - | 記事の画像パス |
| summary | - | 記事概要（指定なしで最初の段落から自動抽出） |

## 使用方法

### 1. HTMLに必要なスクリプトを追加

`template.html` または記事表示ページ：

```html
<!-- marked.jsの読み込み（Markdownパース用） -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<!-- 記事読み込みシステム -->
<script src="../src/markdown-loader.js"></script>
```

### 2. 単一記事を表示する場合

```html
<script>
  const loader = new MarkdownArticleLoader();
  
  // ページ読み込み時に実行
  document.addEventListener('DOMContentLoaded', () => {
    const article = document.querySelector('.article-panel');
    loader.applyArticleToTemplate(article, '../blog/記事名.md');
  });
</script>
```

### 3. ブログ一覧を生成する場合

```javascript
const loader = new MarkdownArticleLoader();

// 複数の記事を読み込む
loader.loadBlogPosts([
  '../blog/sample-article.md',
  '../blog/article2.md'
]).then(posts => {
  // posts配列を使ってブログ一覧を生成
  console.log(posts);
});
```

## 既存システムとの互換性

- 現在の `blog-data.js` と並行して使用可能
- 既存のHTML / CSSは変更なしで利用可能
- 段階的に移行できます

## 利点

✅ **Markdownで执筆** - HTMLコーディング不要  
✅ **メタデータ管理** - フロントマターで統一  
✅ **自動フォーマット** - 日付やタグを自動変換  
✅ **キャッシング** - 再読み込みで高速化  
✅ **拡張性** - JavaScriptで自由にカスタマイズ可能

## 次のステップ

1. `blog/` ディレクトリに記事を追加
2. `blog.html` で `markdown-loader.js` を使用して一覧を動的生成
3. 記事ページで記事を自動表示するスクリプトを追加
