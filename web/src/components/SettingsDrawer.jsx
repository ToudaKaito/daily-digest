import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseButton,
  Button,
  Stack,
  FormControl,
  FormLabel,
  Select,
  RadioGroup,
  Radio,
  CheckboxGroup,
  Checkbox,
  Text,
} from "@chakra-ui/react";

/**
 * 設定画面（右から出てくるドロワー）
 *
 * props:
 *  - isOpen: 開いているかどうか（useDisclosure から渡す）
 *  - onClose: 閉じる関数
 *  - settings: 現在の設定値（useSettings から渡す）
 *  - updateSettings: 設定更新用の関数
 *  - sourceNames: ソース名の配列（["新建ハウジング", "ArchDaily", ...]）
 */
export function SettingsDrawer({
  isOpen,
  onClose,
  settings,
  updateSettings,
  sourceNames,
}) {
  // ソース ON/OFF チェックボックスの現在値（true のものだけ抽出）
  const enabledSourceList = sourceNames.filter(
    (name) => settings.enabledSources?.[name] ?? true
  );

  // ソースのON/OFFを更新
  const handleSourcesChange = (values) => {
    const map = {};
    sourceNames.forEach((name) => {
      map[name] = values.includes(name);
    });
    updateSettings({ enabledSources: map });
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>表示設定</DrawerHeader>

        <DrawerBody>
          <Stack spacing={6}>
            {/* 表示件数 */}
            <FormControl>
              <FormLabel fontSize="sm">表示件数</FormLabel>
              <Select
                size="sm"
                value={settings.maxArticles}
                onChange={(e) =>
                  updateSettings({ maxArticles: Number(e.target.value) })
                }
              >
                <option value={10}>10件</option>
                <option value={30}>30件</option>
                <option value={50}>50件</option>
              </Select>
            </FormControl>

            {/* 期間フィルタ */}
            <FormControl>
              <FormLabel fontSize="sm">対象期間</FormLabel>
              <RadioGroup
                value={settings.period}
                onChange={(value) => updateSettings({ period: value })}
              >
                <Stack direction="column" spacing={1} fontSize="sm">
                  <Radio value="today">今日</Radio>
                  <Radio value="3days">過去3日</Radio>
                  <Radio value="week">過去1週間</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            {/* 要約の長さ */}
            <FormControl>
              <FormLabel fontSize="sm">要約の長さ</FormLabel>
              <RadioGroup
                value={String(settings.summaryLength)}
                onChange={(value) =>
                  updateSettings({ summaryLength: Number(value) })
                }
              >
                <Stack direction="column" spacing={1} fontSize="sm">
                  <Radio value="80">短い（〜80文字）</Radio>
                  <Radio value="200">標準（〜200文字）</Radio>
                  <Radio value="400">長め（〜400文字）</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            {/* ソース ON/OFF */}
            <FormControl>
              <FormLabel fontSize="sm">表示するソース</FormLabel>
              {sourceNames.length === 0 ? (
                <Text fontSize="xs" color="gray.500">
                  記事が読み込まれると選択できるようになります。
                </Text>
              ) : (
                <CheckboxGroup
                  value={enabledSourceList}
                  onChange={handleSourcesChange}
                >
                  <Stack spacing={1} fontSize="sm">
                    {sourceNames.map((name) => (
                      <Checkbox key={name} value={name}>
                        {name}
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              )}
            </FormControl>

            {/* 言語フィルタ（今は見た目だけ・ロジックはあとで拡張でもOK） */}
            {/* 必要になったタイミングで実際のフィルタロジックを追加する */}
            {/* 
            <FormControl>
              <FormLabel fontSize="sm">言語</FormLabel>
              <RadioGroup
                value={settings.language}
                onChange={(value) => updateSettings({ language: value })}
              >
                <Stack direction="column" spacing={1} fontSize="sm">
                  <Radio value="ja">日本語のみ</Radio>
                  <Radio value="all">日本語＋英語</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
            */}
          </Stack>
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" size="sm" mr={2} onClick={onClose}>
            閉じる
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
