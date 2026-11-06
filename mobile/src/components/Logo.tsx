import { StyleSheet, View } from 'react-native'
import { colors } from '@/theme'

type Props = {
  /** Colour of the first dot and the connecting line. */
  lead?: string
  /** Colour of the end dot. */
  end?: string
  size?: number
}

// The Routes mark: a dot, a short line, and a second dot (●—●).
export default function Logo({ lead = colors.ink, end = colors.green, size = 16 }: Props) {
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="Routes">
      <View style={[styles.dot, { width: size, height: size, backgroundColor: lead }]} />
      <View style={[styles.line, { width: size * 1.25, height: Math.max(2, size / 6), backgroundColor: lead }]} />
      <View style={[styles.dot, { width: size, height: size, marginLeft: size * 0.4, backgroundColor: end }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { borderRadius: 999 },
  line: { marginLeft: -2 },
})
