import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors, fonts } from '@/theme'

type ButtonProps = {
  label: string
  onPress: () => void
  /** 'primary' = green (forms), 'light' = off-white (on the green welcome screen). */
  variant?: 'primary' | 'light'
  loading?: boolean
  disabled?: boolean
}

export function PillButton({ label, onPress, variant = 'primary', loading = false, disabled = false }: ButtonProps) {
  const light = variant === 'light'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: light ? colors.bg : pressed ? colors.greenPressed : colors.green },
        pressed && light && styles.lightPressed,
        (disabled || loading) && styles.dim,
      ]}
    >
      {loading ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.pillText}>{label}</Text>}
    </Pressable>
  )
}

type LinkProps = { label: string; onPress: () => void; color?: string }

// Plain text button, e.g. "Already have an account".
export function TextLink({ label, onPress, color = colors.ink }: LinkProps) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={10} style={({ pressed }) => [styles.link, pressed && styles.dim]}>
      <Text style={[styles.linkText, { color }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontFamily: fonts.medium, fontSize: 18, color: colors.ink, includeFontPadding: false },
  lightPressed: { backgroundColor: '#E2E2E2' },
  dim: { opacity: 0.6 },
  link: { alignSelf: 'center', paddingVertical: 6 },
  linkText: { fontFamily: fonts.regular, fontSize: 15 },
})
