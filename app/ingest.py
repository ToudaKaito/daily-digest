import json
import re
import html
import os
import time
import yaml
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

import feedparser
from dateutil import parser as date_parser
import google.generativeai as genai
from supabase import create_client, Client

# ----------------------------------------
# パス系の基本設定
# ----------------------------------------
BASE_DIR = Path(__file__).parent.parent
APP_DIR = Path(__file__).parent

load_dotenv(BASE_DIR / ".env")

# ----------------------------------------
# Supabase & AI 設定
# ----------------------------------------
def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
    return create_client(url, key)

def configure_genai():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not found. AI summary will be skipped.")
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-flash-latest")

# ----------------------------------------
# 設定読み込み (Supabase + YAML)
# ----------------------------------------
def load_config(supabase: Client) -> Dict[str, Any]:
    """
    設定を読み込む。
    - Sources: sources.yml から (今回は変更なし)
    - Keywords: Supabase の 'settings' テーブルから (key='default')
    """
    # 1. Sources (YAML)
    yaml_path = APP_DIR / "sources.yml"
    with open(yaml_path, "r", encoding="utf-8") as f:
        yaml_data = yaml.safe_load(f)
    sources = yaml_data.get("sources", [])

    # 2. Keywords (DB)
    # デフォルト値
    keywords = ["建築", "AI", "デザイン"] # Fallback

    try:
        resp = supabase.table("settings").select("value").eq("key", "default").execute()
        if resp.data and len(resp.data) > 0:
            settings_json = resp.data[0]["value"]
            # DBに keywords があれば使い、なければソースファイルのものを... は今回DB優先
            # 初期データには enabledSources 等しかないので、まだ keywords はないかも。
            # 運用で 'keywords' キーを settings.value に追加してもらう想定。
            if "keywords" in settings_json:
                keywords = settings_json["keywords"]
            else:
                # DBにまだなければYAMLのを使う手もあるが、
                # 今回はシンプルに YAML の keywords を初期値として使う
                keywords = yaml_data.get("keywords", [])
                print("  (Using keywords from YAML as DB has none)")
    except Exception as e:
        print(f"Warning: Failed to fetch settings from DB: {e}")
        keywords = yaml_data.get("keywords", [])

    return {
        "sources": sources,
        "keywords": keywords
    }

# ----------------------------------------
# ユーティリティ関数
# ----------------------------------------
def clean_summary(raw: str, max_len: int = 200) -> str:
    if not raw:
        return ""
    text = re.sub(r"<.*?>", "", raw)
    text = html.unescape(text)
    lower = text.lower()
    marker = "the post "
    if marker in lower:
        idx = lower.index(marker)
        text = text[:idx]
    text = " ".join(text.split()).strip()
    if len(text) > max_len:
        return text[:max_len].rstrip() + "…"
    return text

def is_interesting(article: Dict[str, Any], keywords: List[str]) -> bool:
    if not keywords:
        return True
    text_to_check = (article["title"] + " " + article["summary"]).lower()
    for kw in keywords:
        if kw.lower() in text_to_check:
            return True
    return False

def extract_image_url(entry: Any) -> str | None:
    if "media_content" in entry:
        for media in entry.media_content:
            if "image" in media.get("type", "") or "medium" in media.get("medium", ""):
                return media.get("url")
    if "media_thumbnail" in entry:
        thumbs = entry.media_thumbnail
        if thumbs:
            return thumbs[0].get("url")
    if "links" in entry:
        for link in entry.links:
            if link.get("rel") == "enclosure" and "image" in link.get("type", ""):
                return link.get("href")
    content = ""
    if "summary" in entry:
        content += entry.summary
    if "content" in entry:
        for c in entry.content:
            content += c.value
    if content:
        match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', content)
        if match:
            return match.group(1)
    return None

def generate_summary_with_ai(model, title: str, original_text: str) -> str:
    if not model:
        return original_text
    prompt = f"""
    あなたは建築業界のプロフェッショナル向けニュースキュレーターです。
    以下の記事の要点を、忙しい専門家が30秒で理解できるように、
    **日本語で** 150文字程度で要約してください。
    専門用語はなるべくカタカナではなく適切な日本語訳を使ってください。

    タイトル: {title}
    本文: {original_text}
    """
    max_retries = 3
    for i in range(max_retries):
        try:
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            if "429" in str(e) or "Resource has been exhausted" in str(e):
                wait_time = (i + 1) * 10
                print(f"  [AI Limit] Rate limit hit. Waiting {wait_time}s...")
                time.sleep(wait_time)
                continue
            print(f"  [AI Error] Failed to summarize '{title}': {e}")
            return original_text
    return original_text

# ----------------------------------------
# 記事収集 & 保存プロセス
# ----------------------------------------
def fetch_and_ingest(sources: List[Dict[str, Any]], keywords: List[str], supabase: Client):
    model = configure_genai()
    
    print(f"Filtering with keywords: {keywords}")
    print(f"AI Summarization: {'ENABLED' if model else 'DISABLED'}")

    total_added = 0

    for src in sources:
        if src.get("type") != "rss":
            continue

        url = src["url"]
        source_name = src.get("name", url)
        print(f"Fetching {source_name}...")

        try:
            feed = feedparser.parse(url)
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            continue

        # 新着順に見ていく (最大10件)
        for entry in feed.entries[:10]:
            link = entry.get("link", "").strip()
            if not link:
                continue
                
            # 重複チェック: 既にDBにあるか？ (URLでチェック)
            # 毎回SELECTするのは非効率だが、今回は件数が少ないのでOK
            # Upsertを使うので、実はSELECTしなくても「上書き」か「無視」の設定でいける
            
            title = entry.get("title", "").strip()
            
            # 画像抽出
            image_url = extract_image_url(entry)

            # 公開日
            published_raw = entry.get("published") or entry.get("updated") or entry.get("created")
            published_at = None
            if published_raw:
                try:
                    dt = date_parser.parse(published_raw)
                    published_at = dt.isoformat()
                except:
                    pass
            
            # 要約 (Clean)
            summary_raw = entry.get("summary") or entry.get("description") or ""
            summary = clean_summary(summary_raw)

            # 一時的な辞書作成
            article_candidate = {
                "source": source_name,
                "title": title,
                "url": link,
                "image_url": image_url,
                "published_at": published_at,
                "summary": summary
            }

            # 1. キーワードフィルタ
            if not is_interesting(article_candidate, keywords):
                continue

            # 2. AI要約 (データベースにまだ無い場合のみ実行したいが...
            # Upsertだと「更新」もされるので、毎回AIが走るとコストが無駄。
            # URLで存在確認をして、存在しなければAI要約→Insert、とするのが良い。
            
            try:
                # 存在確認
                existing = supabase.table("articles").select("id").eq("url", link).execute()
                if existing.data and len(existing.data) > 0:
                    # 既に登録済みなのでスキップ (更新もしない)
                    # print(f"  Skipping existing: {title[:20]}...")
                    continue
            except Exception as e:
                print(f"  DB Check Error: {e}")
                continue

            # 新規記事だ！AI要約実行
            if model:
                print(f"  Summarizing: {title[:30]}...")
                ai_summary = generate_summary_with_ai(model, title, summary)
                article_candidate["summary"] = ai_summary
                time.sleep(4.0) # Rate Limit

            # DB保存
            try:
                supabase.table("articles").insert(article_candidate).execute()
                print(f"  Saved: {title[:30]}")
                total_added += 1
            except Exception as e:
                print(f"  DB Insert Error: {e}")

    print(f"Done. Total new articles added: {total_added}")

# ----------------------------------------
# メイン
# ----------------------------------------
def main():
    try:
        supabase = get_supabase_client()
        conf = load_config(supabase)
        
        sources = conf["sources"]
        keywords = conf["keywords"]
        
        fetch_and_ingest(sources, keywords, supabase)
        
    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == "__main__":
    main()
