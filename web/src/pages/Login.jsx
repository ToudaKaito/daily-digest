import { useState } from 'react';
import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Text,
    VStack,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const { signInWithEmail } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email) {
            setMessage({ type: 'error', text: 'メールアドレスを入力してください' });
            return;
        }

        // 許可リストチェック
        const allowedEmailsStr = import.meta.env.VITE_ALLOWED_EMAILS || '';
        const allowedEmails = allowedEmailsStr.split(',').map(e => e.trim());

        if (!allowedEmails.includes(email)) {
            setMessage({
                type: 'error',
                text: 'このメールアドレスは登録されていません。アクセス権限がありません。'
            });
            return;
        }

        setLoading(true);
        setMessage(null);

        const { error } = await signInWithEmail(email);

        if (error) {
            setMessage({ type: 'error', text: `エラー: ${error.message}` });
        } else {
            setMessage({
                type: 'success',
                text: `${email} にログインリンクを送信しました。メールを確認してください。`,
            });
        }

        setLoading(false);
    };

    return (
        <Container maxW="md" py={20}>
            <VStack spacing={8} align="stretch">
                <Box textAlign="center">
                    <Heading size="lg" mb={2}>
                        建築 Daily Digest
                    </Heading>
                    <Text color="gray.600">ログインしてニュースを閲覧</Text>
                </Box>

                <Box
                    as="form"
                    onSubmit={handleLogin}
                    bg="white"
                    p={8}
                    borderRadius="lg"
                    boxShadow="md"
                >
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel>メールアドレス</FormLabel>
                            <Input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </FormControl>

                        <Button
                            type="submit"
                            colorScheme="blue"
                            width="full"
                            isLoading={loading}
                            loadingText="送信中..."
                        >
                            ログインリンクを送信
                        </Button>
                    </VStack>
                </Box>

                {message && (
                    <Alert
                        status={message.type === 'error' ? 'error' : 'success'}
                        borderRadius="md"
                    >
                        <AlertIcon />
                        <Box>
                            <AlertTitle>
                                {message.type === 'error' ? 'エラー' : '送信完了'}
                            </AlertTitle>
                            <AlertDescription>{message.text}</AlertDescription>
                        </Box>
                    </Alert>
                )}

                <Text fontSize="sm" color="gray.500" textAlign="center">
                    ※ ログインリンクの有効期限は1時間です
                </Text>
            </VStack>
        </Container>
    );
}
