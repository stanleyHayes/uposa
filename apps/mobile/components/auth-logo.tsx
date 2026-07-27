import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

export function AuthLogo() {
  return (
    <View style={styles.wrap}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} contentFit="contain" transition={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 16 },
  logo: { width: 96, height: 96 },
});
