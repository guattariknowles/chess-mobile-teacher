import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { PlayScreen } from './src/screens/PlayScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <PlayScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171a18',
  },
});
