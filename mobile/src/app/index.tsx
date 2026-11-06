import { StyleSheet, Text, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Logo from '@/components/Logo'
import Stripes from '@/components/Stripes'
import { PillButton, TextLink } from '@/components/Buttons'
import { useSession } from '@/auth/session'
import { colors, fonts, PAGE_PADDING } from '@/theme'

// Welcome screen (green): first thing a signed-out passenger sees.
export default function Welcome() {
  const insets = useSafeAreaInsets()
  const { user } = useSession()
  if (user) return <Redirect href="/home" />

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
      <StatusBar style="dark" />

      <View style={styles.topBar}>
        <Logo lead={colors.white} end={colors.ink} />
        <Text style={styles.brand}>Routes</Text>
      </View>

      <View style={styles.headline} accessible accessibilityRole="header" accessibilityLabel="Transportation made easier">
        <Text style={styles.title}>Transportation</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Made Easier</Text>
          <View style={styles.tail}>
            <View style={styles.tailLine} />
            <View style={styles.tailDot} />
          </View>
        </View>
      </View>

      <View style={styles.stripes}>
        <Stripes />
      </View>

      <View style={styles.actions}>
        <PillButton label="Create a new account" variant="light" onPress={() => router.push('/sign-up')} />
        <TextLink label="Already have an account" color={colors.white} onPress={() => router.push('/log-in')} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.green },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 },
  brand: { fontFamily: fonts.medium, fontSize: 18, color: colors.ink },
  headline: { paddingHorizontal: 28, marginTop: 64 },
  title: { fontFamily: fonts.semibold, fontSize: 37, lineHeight: 46, color: colors.ink, letterSpacing: -0.6 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  tail: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, marginTop: 4 },
  tailLine: { width: 14, height: 2.5, backgroundColor: colors.ink },
  tailDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.ink, marginLeft: -1 },
  stripes: { flex: 1, justifyContent: 'center' },
  actions: { paddingHorizontal: PAGE_PADDING, gap: 18 },
})
