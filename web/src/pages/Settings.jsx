import { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Input,
    Button,
    IconButton,
    List,
    ListItem,
    useToast,
    Spinner,
    Center,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Settings() {
    const [keywords, setKeywords] = useState([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    // キーワードを読み込む
    useEffect(() => {
        async function loadKeywords() {
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('value')
                    .eq('key', 'default')
                    .single();

                if (error) throw error;

                setKeywords(data?.value?.keywords || []);
            } catch (e) {
                console.error('キーワード読み込みエラー:', e);
                toast({
                    title: 'エラー',
                    description: 'キーワードの読み込みに失敗しました',
                    status: 'error',
                    duration: 3000,
                });
            } finally {
                setLoading(false);
            }
        }

        loadKeywords();
    }, [toast]);

    // キーワードを追加
    const handleAddKeyword = () => {
        if (!newKeyword.trim()) return;

        if (keywords.includes(newKeyword.trim())) {
            toast({
                title: '重複',
                description: 'このキーワードは既に登録されています',
                status: 'warning',
                duration: 2000,
            });
            return;
        }

        setKeywords([...keywords, newKeyword.trim()]);
        setNewKeyword('');
    };

    // キーワードを削除
    const handleDeleteKeyword = (keyword) => {
        setKeywords(keywords.filter((k) => k !== keyword));
    };

    // Supabaseに保存
    const handleSave = async () => {
        setSaving(true);

        try {
            const { error } = await supabase
                .from('settings')
                .update({
                    value: { keywords },
                    updated_at: new Date().toISOString(),
                })
                .eq('key', 'default');

            if (error) throw error;

            toast({
                title: '保存完了',
                description: 'キーワードを保存しました',
                status: 'success',
                duration: 2000,
            });

            navigate('/');
        } catch (e) {
            console.error('保存エラー:', e);
            toast({
                title: 'エラー',
                description: 'キーワードの保存に失敗しました',
                status: 'error',
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    return (
        <Box bg="gray.50" minH="100vh" py={6}>
            <Container maxW="3xl">
                <VStack spacing={6} align="stretch">
                    <Box>
                        <Heading size="lg" mb={2}>
                            設定
                        </Heading>
                        <Text color="gray.600">
                            記事収集に使用するキーワードを管理します
                        </Text>
                    </Box>

                    <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
                        <Heading size="md" mb={4}>
                            キーワード管理
                        </Heading>

                        {/* キーワード一覧 */}
                        <List spacing={2} mb={4}>
                            {keywords.map((keyword, index) => (
                                <ListItem
                                    key={index}
                                    p={3}
                                    bg="gray.50"
                                    borderRadius="md"
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <Text>{keyword}</Text>
                                    <IconButton
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => handleDeleteKeyword(keyword)}
                                        aria-label="削除"
                                    />
                                </ListItem>
                            ))}

                            {keywords.length === 0 && (
                                <Text color="gray.500" fontSize="sm">
                                    キーワードが登録されていません
                                </Text>
                            )}
                        </List>

                        {/* 新規追加 */}
                        <HStack>
                            <Input
                                placeholder="新しいキーワード"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                            />
                            <IconButton
                                icon={<AddIcon />}
                                colorScheme="blue"
                                onClick={handleAddKeyword}
                                aria-label="追加"
                            />
                        </HStack>
                    </Box>

                    {/* 保存・キャンセル */}
                    <HStack justify="flex-end">
                        <Button variant="outline" onClick={() => navigate('/')}>
                            キャンセル
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleSave}
                            isLoading={saving}
                            loadingText="保存中..."
                        >
                            保存
                        </Button>
                    </HStack>
                </VStack>
            </Container>
        </Box>
    );
}
