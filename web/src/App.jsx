import { useEffect, useState } from "react";

function App() {
  const [articles, setArticles] = useState([]);
  const [generatedAt, setGeneratedAt] = useState("");

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;
    fetch(`${baseUrl}latest.json`)
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.articles || []);
        setGeneratedAt(data.generated_at || "");
      })
      .catch((e) => console.error("JSON読み込みエラー:", e));
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Daily Digest</h1>
      <p>生成日時: {generatedAt}</p>

      {articles.map((a, i) => (
        <div
          key={i}
          style={{
            background: "white",
            padding: "15px",
            marginBottom: "12px",
            borderRadius: "6px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "12px", color: "#666" }}>
            {a.source} / {a.category}
          </div>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            <a href={a.url} target="_blank" rel="noopener noreferrer">
              {a.title}
            </a>
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            {a.published_at || "日時不明"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
