import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  type ImportedTrainingRecord,
  isImportedTrainingRecord,
} from './importedTraining';

const STORAGE_KEY = '@free-chess/imported-training/v1';

export async function loadImportedTrainings(): Promise<
  ImportedTrainingRecord[]
> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isImportedTrainingRecord)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function saveImportedTraining(
  record: ImportedTrainingRecord,
): Promise<ImportedTrainingRecord[]> {
  const records = await loadImportedTrainings();
  const nextRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  };
  const nextRecords = [
    nextRecord,
    ...records.filter((item) => item.id !== record.id),
  ];

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
  return nextRecords;
}

export async function deleteImportedTraining(
  id: string,
): Promise<ImportedTrainingRecord[]> {
  const records = await loadImportedTrainings();
  const nextRecords = records.filter((record) => record.id !== id);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
  return nextRecords;
}
