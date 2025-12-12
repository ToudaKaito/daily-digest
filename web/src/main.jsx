import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App.jsx";

// ルート要素を取得して React アプリをマウントする
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Chakra UI のテーマコンテキストでアプリ全体を包む */}
    <ChakraProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ChakraProvider>
  </React.StrictMode>
);
