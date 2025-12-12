import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ArticleCard } from "../components/ArticleCard";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [generatedAt, setGeneratedAt] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchArticles() {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .order("published_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        setArticles(data || []);

        if (data && data.length > 0) {
          setGeneratedAt(data[0].created_at || "");
        }
      } catch (e) {
        console.error("Supabase読み込みエラー:", e);
      }
    }

    fetchArticles();
  }, []);

  return (
    <Box bg="gray.50" minH="100vh" py={6}>
      <Container maxW="5xl">
        <Box
          mb={6}
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={4}
        >
          <Box>
            <Heading size="lg" mb={1}>
              建築 Daily Digest
            </Heading>
            <Text fontSize="sm" color="gray.600">
              建築・都市計画・デザイン系メディアから新着記事を自動収集し、
              建築家が朝にざっと目を通せるように要約付きで一覧表示するツールです。
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              最終更新: {generatedAt || "取得中…"}
            </Text>
          </Box>

          <Box>
            <Button size="sm" colorScheme="blue" onClick={() => navigate("/settings")}>
              設定
            </Button>
          </Box>
        </Box>

        <Stack spacing={4}>
          {articles.map((a, i) => (
            <ArticleCard
              key={i}
              article={a}
              summaryLength={200}
            />
          ))}

          {articles.length === 0 && (
            <Text fontSize="sm" color="gray.500">
              現在表示できる建築ニュースがありません。時間をおいて再度お試しください。
            </Text>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
