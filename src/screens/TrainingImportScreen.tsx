import type { Color } from 'chess.js';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  createImportedTrainingRecord,
  type ImportedTrainingRecord,
  type ImportTrainingCategory,
} from '../game/importedTraining';
import { saveImportedTraining } from '../game/importedTrainingStorage';

type TrainingImportScreenProps = {
  onBack: () => void;
  onImported: (record: ImportedTrainingRecord) => void;
};

const CATEGORIES: {
  description: string;
  label: string;
  value: ImportTrainingCategory;
}[] = [
  {
    description: '按棋谱练习前 6 个完整回合，然后继续与 AI 自由对弈。',
    label: '开局',
    value: 'openings',
  },
  {
    description: '你和 AI 严格按照导入棋谱复现整盘经典对局。',
    label: '经典名局',
    value: 'classics',
  },
  {
    description: '使用棋谱末端的可继续局面，直接进入真人对 AI 残局。',
    label: '残局',
    value: 'endgames',
  },
];

export function TrainingImportScreen({
  onBack,
  onImported,
}: TrainingImportScreenProps) {
  const [category, setCategory] =
    useState<ImportTrainingCategory>('openings');
  const [humanColor, setHumanColor] = useState<Color>('w');
  const [title, setTitle] = useState('');
  const [pgn, setPgn] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const categoryDescription =
    CATEGORIES.find((item) => item.value === category)?.description ?? '';

  const importTraining = async () => {
    if (saving) {
      return;
    }

    setError('');
    setSaving(true);

    try {
      const record = createImportedTrainingRecord({
        category,
        humanColor,
        pgn,
        title,
      });

      await saveImportedTraining(record);
      onImported(record);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : '导入训练棋局失败',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.outlineButton}>
            <Text style={styles.outlineButtonText}>返回教学</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>PART 8 · 本地训练</Text>
            <Text style={styles.title}>导入训练棋局</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>训练名称</Text>
          <TextInput
            accessibilityLabel="训练名称"
            maxLength={60}
            onChangeText={setTitle}
            placeholder="例如：我的西西里开局"
            placeholderTextColor="#697169"
            style={styles.titleInput}
            value={title}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>PGN 类型</Text>
          <View style={styles.optionRow}>
            {CATEGORIES.map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item.value}
                onPress={() => setCategory(item.value)}
                style={[
                  styles.optionButton,
                  category === item.value && styles.activeOption,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    category === item.value && styles.activeOptionText,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.description}>{categoryDescription}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>训练哪一方</Text>
          <View style={styles.optionRow}>
            {(['w', 'b'] as Color[]).map((color) => (
              <Pressable
                accessibilityRole="button"
                disabled={category === 'endgames'}
                key={color}
                onPress={() => setHumanColor(color)}
                style={[
                  styles.optionButton,
                  humanColor === color &&
                    category !== 'endgames' &&
                    styles.activeOption,
                  category === 'endgames' && styles.disabledOption,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    humanColor === color &&
                      category !== 'endgames' &&
                      styles.activeOptionText,
                  ]}
                >
                  {color === 'w' ? '训练白方' : '训练黑方'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.description}>
            {category === 'endgames'
              ? '残局自动训练导入局面中轮到走棋的一方。'
              : '训练黑方时，AI 会先按棋谱走出白方第一步。'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>PGN 棋谱</Text>
          <TextInput
            accessibilityLabel="训练 PGN 内容"
            autoCapitalize="none"
            multiline
            onChangeText={setPgn}
            placeholder={'[Event "训练棋局"]\n\n1. e4 e5 2. Nf3 Nc6'}
            placeholderTextColor="#697169"
            style={styles.pgnInput}
            textAlignVertical="top"
            value={pgn}
          />
          <Text style={styles.description}>
            开局和经典名局必须从标准初始局面开始。残局可以使用带 FEN
            头的 PGN，也可以用完整棋谱的末端局面。
          </Text>
        </View>

        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={importTraining}
          style={[styles.importButton, saving && styles.disabledButton]}
        >
          <Text style={styles.importButtonText}>
            {saving ? '正在检查…' : '检查并导入训练'}
          </Text>
        </Pressable>

        <Text style={styles.privacy}>
          导入内容只保存在本机，不会上传。AI 当前使用离线本地引擎，
          Stockfish 接入后会替换自由对弈的走法提供者。
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  activeOption: {
    backgroundColor: '#6f4d25',
    borderColor: '#d49a43',
  },
  activeOptionText: { color: '#fff3df' },
  card: {
    backgroundColor: '#242924',
    borderColor: '#3c443c',
    borderRadius: 11,
    borderWidth: 1,
    marginTop: 11,
    padding: 13,
  },
  content: { paddingBottom: 32, paddingHorizontal: 16 },
  description: {
    color: '#8f978e',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 8,
  },
  disabledButton: { opacity: 0.5 },
  disabledOption: { opacity: 0.35 },
  error: {
    color: '#ef806f',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  eyebrow: {
    color: '#d49a43',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: 44,
  },
  headerText: { flex: 1, marginLeft: 14 },
  importButton: {
    alignItems: 'center',
    backgroundColor: '#8a5d27',
    borderColor: '#d49a43',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 50,
  },
  importButtonText: {
    color: '#fff3df',
    fontSize: 13,
    fontWeight: '900',
  },
  label: {
    color: '#d7a65c',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },
  optionButton: {
    alignItems: 'center',
    borderColor: '#4b534b',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 5,
  },
  optionRow: { flexDirection: 'row', gap: 7 },
  optionText: {
    color: '#c7cdc4',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  outlineButton: {
    borderColor: '#424a42',
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  outlineButtonText: {
    color: '#e5e2d9',
    fontSize: 11,
    fontWeight: '700',
  },
  pgnInput: {
    backgroundColor: '#171a18',
    borderColor: '#4a5149',
    borderRadius: 9,
    borderWidth: 1,
    color: '#f4f1e8',
    fontFamily: 'monospace',
    fontSize: 12,
    height: 230,
    padding: 12,
  },
  privacy: {
    color: '#737b73',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  screen: { backgroundColor: '#171a18', flex: 1 },
  title: {
    color: '#f4f1e8',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 2,
  },
  titleInput: {
    backgroundColor: '#171a18',
    borderColor: '#4a5149',
    borderRadius: 8,
    borderWidth: 1,
    color: '#f4f1e8',
    minHeight: 44,
    paddingHorizontal: 11,
  },
});
