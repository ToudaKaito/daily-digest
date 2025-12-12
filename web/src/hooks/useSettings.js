import { useState, useEffect } from "react";

// localStorage のキー
const STORAGE_KEY = "digestSettings";

// デフォルト設定
const defaultSettings = {
  maxArticles: 30,
  period: "3days",        // today / 3days / week
  summaryLength: 200,     // 80 / 200 / 400
  language: "ja",         // ja / all
  enabledSources: {},     // ソース名ごとの ON/OFF
};

export function useSettings(sourceNames = []) {
  const [settings, setSettings] = useState(defaultSettings);

  // 初回ロード時に localStorage から取り出す
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // ソースON/OFFの初期化（sources.yml側の変化に対応）
      const sourceMap = {};
      sourceNames.forEach(name => {
        sourceMap[name] = parsed.enabledSources?.[name] ?? true;
      });

      setSettings({
        ...defaultSettings,
        ...parsed,
        enabledSources: sourceMap,
      });
    } else {
      // 初期ソースON/OFF（全てON）
      const sourceMap = {};
      sourceNames.forEach(name => (sourceMap[name] = true));
      setSettings({
        ...defaultSettings,
        enabledSources: sourceMap,
      });
    }
  }, [sourceNames]);

  // 設定更新と保存
  const updateSettings = (updates) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  return { settings, updateSettings };
}
