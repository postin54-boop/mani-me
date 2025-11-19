import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const COLORS = {
  navy: '#0B1A33',
  sky: '#83C5F4',
  action: '#5A8DFF',
  white: '#FFFFFF',
  cardLight: '#FFFFFF',
  cardDark: '#071428',
  subtleLight: '#EEF6FF',
  subtleDark: '#081728',
};

export default function LandingScreen({ navigation }) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const styles = createStyles(dark);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Mani Me</Text>
          <Text style={styles.subtitle}>Your Parcel, Our Priority</Text>

          <View style={styles.features}>
            <Feature
              icon="📦"
              text="Send your parcel from the UK to Ghana"
              dark={dark}
            />
            <Feature
              icon="🛒"
              text="Shop groceries for family in Ghana"
              dark={dark}
            />
            <Feature
              icon="🎁"
              text="Buy packaging materials in the UK"
              dark={dark}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ icon, text, dark }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: dark ? 'rgba(131,197,244,0.08)' : '#EAF4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 16, color: dark ? '#E6F1FF' : '#0B1A33' }}>{text}</Text>
    </View>
  );
}

function createStyles(dark) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: dark ? COLORS.navy : '#F5FAFF',
    },
    scroll: {
      flexGrow: 1,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 520,
      borderRadius: 18,
      padding: 26,
      backgroundColor: dark ? COLORS.cardDark : COLORS.cardLight,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 6,
    },
    logoWrap: {
      alignSelf: 'center',
      width: 86,
      height: 86,
      borderRadius: 18,
      backgroundColor: dark ? COLORS.sky : COLORS.subtleLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
    },
    logo: { width: 60, height: 60 },
    title: {
      textAlign: 'center',
      fontSize: 28,
      fontWeight: '700',
      color: dark ? COLORS.white : COLORS.navy,
    },
    subtitle: {
      textAlign: 'center',
      color: dark ? '#BFD9F8' : '#556B85',
      marginTop: 6,
      marginBottom: 16,
    },
    features: {
      marginTop: 10,
      marginBottom: 18,
      paddingHorizontal: 6,
    },
    primaryBtn: {
      marginTop: 10,
      backgroundColor: COLORS.sky,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryText: {
      color: COLORS.navy,
      fontWeight: '700',
      fontSize: 17,
    },
    secondaryBtn: {
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(11,26,51,0.08)',
    },
    secondaryText: {
      color: dark ? COLORS.white : COLORS.navy,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}
