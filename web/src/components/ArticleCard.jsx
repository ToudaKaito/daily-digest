import {
    Box,
    Heading,
    Text,
    Stack,
    Card,
    CardHeader,
    CardBody,
    Link,
    Badge,
    HStack,
    Spacer,
} from "@chakra-ui/react";

export const ArticleCard = ({ article, summaryLength = 200 }) => {
    const getSummary = (summary) => {
        if (!summary) return "";
        if (summary.length <= summaryLength) return summary;
        return summary.slice(0, summaryLength).trimEnd() + "…";
    };

    return (
        <Card variant="outline" bg="white" overflow="hidden">
            <Stack direction={{ base: "column", md: "row" }} spacing={0}>
                {/* 画像エリア (あれば表示) */}
                {article.image_url && (
                    <Box
                        width={{ base: "100%", md: "200px" }}
                        minW={{ md: "200px" }}
                        height={{ base: "200px", md: "100%" }}
                        flexShrink={0}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                            src={article.image_url}
                            alt={article.title}
                        />
                    </Box>
                )}

                <Box flex="1">
                    {/* ヘッダー部分：媒体名 + 日付 */}
                    <CardHeader pb={2}>
                        <HStack spacing={2} align="center">
                            <Badge colorScheme="blue" variant="subtle">
                                {article.source || "Source"}
                            </Badge>
                            <Spacer />
                            <Text fontSize="xs" color="gray.500">
                                {article.published_at || "日時不明"}
                            </Text>
                        </HStack>
                    </CardHeader>

                    {/* 本文部分：タイトル + 要約 */}
                    <CardBody pt={0}>
                        <Heading size="sm" mb={2}>
                            <Link
                                href={article.url}
                                isExternal
                                color="blue.700"
                                _hover={{ textDecoration: "underline" }}
                            >
                                {article.title}
                            </Link>
                        </Heading>

                        {article.summary && (
                            <Text fontSize="sm" color="gray.700" lineHeight="1.6">
                                {getSummary(article.summary)}
                            </Text>
                        )}
                    </CardBody>
                </Box>
            </Stack>
        </Card>
    );
};
