import { StyleSheet, Text, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Logo from '@/components/Logo'
import { PillButton } from '@/components/Buttons'
import { useSession } from '@/auth/session'
import { colors, fonts, PAGE_PADDING } from '@/theme'

// Placeholder for the signed-in passenger area (next screens to design).
export default function Home() {
  const insets = useSafeAreaInsets()
  const { user, signOut } = useSession()
  if (!user) return <Redirect href="/" />

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}>
      <StatusBar style="dark" />
      <Logo />
      <Text style={styles.title}>Hi, {user.firstName}</Text>
      <Text style={styles.body}>You&apos;re signed in as {user.email}.</Text>
      <View style={styles.spacer} />
      <PillButton label="Log out" variant="light" onPress={() => { signOut(); router.replace('/') }} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: PAGE_PADDING },
  title: { marginTop: 46, fontFamily: fonts.medium, fontSize: 32, color: colors.ink },
  body: { marginTop: 8, fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  spacer: { flex: 1 },
})
