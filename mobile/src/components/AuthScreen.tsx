import type { ReactNode } from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Logo from './Logo'
import { colors, fonts, PAGE_PADDING } from '@/theme'

type Props = { title: string; children: ReactNode }

// Layout shared by the form screens (create account, log in): logo, big
// title, then the form. Scrolls, and keeps the focused field above the
// keyboard (Expo apps are edge-to-edge on Android, so KeyboardAvoidingView
// needs behavior="padding" on both platforms).
export default function AuthScreen({ title, children }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.logo}>
          <Logo lead={colors.ink} end={colors.green} />
        </View>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: PAGE_PADDING, flexGrow: 1 },
  logo: { marginBottom: 46 },
  title: { fontFamily: fonts.medium, fontSize: 32, lineHeight: 42, color: colors.ink, marginBottom: 14, letterSpacing: -0.3 },
})
