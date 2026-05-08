/**
 * Markdownベースの記事管理システム
 * フロントマター（YAML形式）でメタデータを管理し、
 * Markdownコンテンツを自動的にテンプレートに変換します
 */

// marked.jsのCDNを読み込む必要があります
// <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

class MarkdownArticleLoader {
  constructor() {
    this.articles = [];
    this.articleCache = {};
  }

  /**
   * Markdownファイルを読み込んでパースします
   * @param {string} filePath - ファイルパス（相対パス）
   * @returns {Promise<Object>} - パース済み記事オブジェクト
   */
  async loadArticle(filePath) {
    // キャッシュを確認
    if (this.articleCache[filePath]) {
      return this.articleCache[filePath];
    }

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        console.error(`Failed to load: ${filePath}`, response.status);
        return null;
      }

      const content = await response.text();
      const article = this.parseMarkdown(content, filePath);
      
      // キャッシュに保存
      this.articleCache[filePath] = article;
      return article;
    } catch (error) {
      console.error(`Error loading article: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Markdownをパースしてメタデータとコンテンツを分離します
   * @param {string} content - Markdownコンテンツ全体
   * @param {string} filePath - ファイルパス（サマリー用）
   * @returns {Object} - メタデータとHTMLコンテンツ
   */
  parseMarkdown(content, filePath) {
    // フロントマターの抽出（---で囲まれた部分）
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    let metadata = {};
    let markdown = content;

    if (match) {
      // フロントマターをパース
      metadata = this.parseFrontmatter(match[1]);
      markdown = match[2];
    }

    // MarkdownをサニタイズされたHTMLに変換
    const html = marked.parse(markdown);

    // 最初の段落をサマリーとして抽出（指定がない場合）
    if (!metadata.summary) {
      const firstParagraphMatch = html.match(/<p>(.*?)<\/p>/);
      if (firstParagraphMatch) {
        // HTMLタグを削除してテキストのみ抽出
        metadata.summary = firstParagraphMatch[1]
          .replace(/<[^>]*>/g, '')
          .substring(0, 150);
        if (metadata.summary.length === 150) {
          metadata.summary += '...';
        }
      }
    }

    // URLを自動生成（指定がない場合）
    if (!metadata.url) {
      metadata.url = filePath;
    }

    return {
      metadata,
      html
    };
  }

  /**
   * YAMLフロントマターをパースします
   * @param {string} frontmatterText - フロントマターのテキスト
   * @returns {Object} - パース済みメタデータ
   */
  parseFrontmatter(frontmatterText) {
    const metadata = {};
    const lines = frontmatterText.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // 値から引用符を削除
      const cleanValue = value.replace(/^['"]|['"]$/g, '');
      metadata[key] = cleanValue;
    }

    return metadata;
  }

  /**
   * 複数のMarkdownファイルを読み込んでブログデータを生成します
   * @param {string[]} filePaths - ファイルパス配列
   * @returns {Promise<Array>} - ブログポストの配列
   */
  async loadBlogPosts(filePaths) {
    const posts = [];

    for (const filePath of filePaths) {
      const article = await this.loadArticle(filePath);
      if (article) {
        posts.push({
          ...article.metadata,
          summary: article.metadata.summary || ''
        });
      }
    }

    // 日付でソート（新しい順）
    posts.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    this.articles = posts;
    return posts;
  }

  /**
   * テンプレートにMarkdown記事を適用します
   * @param {HTMLElement} templateElement - テンプレート要素
   * @param {string} filePath - 記事のファイルパス
   */
  async applyArticleToTemplate(templateElement, filePath) {
    const article = await this.loadArticle(filePath);
    if (!article) {
      console.error('Failed to load article');
      return;
    }

    const { metadata, html } = article;

    // テンプレートの各部分を更新
    document.title = `${metadata.title} | Toyama Univ. MR Project`;
    
    // meta descriptionを更新
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', metadata.summary);
    }

    // 日付を更新
    const dateElement = templateElement.querySelector('.article-meta span:first-child');
    if (dateElement && metadata.date) {
      dateElement.textContent = this.formatDate(metadata.date);
    }

    // タグを更新
    const tagElement = templateElement.querySelector('.article-meta span:last-child');
    if (tagElement && metadata.tag) {
      tagElement.textContent = metadata.tag;
    }

    // タイトルを更新
    const titleElement = templateElement.querySelector('.article-panel h2');
    if (titleElement && metadata.title) {
      titleElement.textContent = metadata.title;
    }

    // 画像を更新
    const imageElement = templateElement.querySelector('.article-image');
    if (imageElement && metadata.image) {
      imageElement.src = metadata.image;
      imageElement.alt = metadata.title;
    }

    // コンテンツを更新
    const contentElement = templateElement.querySelector('.article-panel p:not(.crumb):not(.article-meta)');
    if (contentElement) {
      contentElement.innerHTML = html;
    }
  }

  /**
   * 日付をフォーマットします（YYYY.MM.DD形式）
   * @param {string} dateStr - 日付文字列（YYYY-MM-DD）
   * @returns {string} - フォーマット済み日付
   */
  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }
}

// グローバルに公開
window.MarkdownArticleLoader = MarkdownArticleLoader;
