import json
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List

import yaml
import feedparser
from dateutil import parser as date_parser


BASE_DIR = Path(__file__).parent.parent
APP_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"


def load_sources() -> List[Dict[str, Any]]:
    """app/sources.yml を読み込んで sources のリストを返す"""
    yaml_path = APP_DIR / "sources.yml"
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data["sources"]


def fetch_rss(source: Dict[str, Any], max_items: int = 10) -> List[Dict[str, Any]]:
    """
    RSS フィードから記事一覧を取得して、共通フォーマットの dict リストで返す。
    """
    url = source["url"]
    category = source.get("category", "")
    source_name = source.get("name", url)

    feed = feedparser.parse(url)

    articles: List[Dict[str, Any]] = []

    for entry in feed.entries[:max_items]:
        # タイトル
        title = entry.get("title", "").strip()

        # 記事URL
        link = entry.get("link", "").strip()

        # 公開日時（あればパースしてISO形式にする）
        published_raw = (
            entry.get("published")
            or entry.get("updated")
            or entry.get("created")
        )
        if published_raw:
            try:
                dt = date_parser.parse(published_raw)
                published_at = dt.isoformat()
            except Exception:
                published_at = None
        else:
            published_at = None

        # 概要（description/summary のどちらか）
        summary = (
            entry.get("summary")
            or entry.get("description")
            or ""
        ).strip()

        articles.append(
            {
                "source": source_name,
                "category": category,
                "title": title,
                "url": link,
                "published_at": published_at,
                "summary": summary,
            }
        )

    return articles


def build_latest_json(sources: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    全ソースから記事を取得して latest.json 用のデータ構造を作る。
    """
    all_articles: List[Dict[str, Any]] = []

    for src in sources:
        if src.get("type") == "rss":
            items = fetch_rss(src)
            all_articles.extend(items)
        else:
            # 今は rss 以外は未対応（将来拡張用のフック）
            continue

    # 公開日時が新しい順に並べ替え（None は最後に回す）
    all_articles.sort(
        key=lambda a: a["published_at"] or "",
        reverse=True,
    )

    latest = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "total": len(all_articles),
        "articles": all_articles,
    }
    return latest


def save_latest_json(data: Dict[str, Any]) -> Path:
    """
    data/latest.json に書き出す。
    """
    DATA_DIR.mkdir(exist_ok=True)
    out_path = DATA_DIR / "latest.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return out_path


def main() -> None:
    sources = load_sources()
    latest = build_latest_json(sources)
    out_path = save_latest_json(latest)

    print(f"Generated latest.json ({latest['total']} articles)")
    print(f" -> {out_path.relative_to(BASE_DIR)}")


if __name__ == "__main__":
    main()
