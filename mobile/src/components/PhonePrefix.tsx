import { StyleSheet, Text, View } from 'react-native'
import { colors, fonts } from '@/theme'

// Egyptian flag + "+20" + divider, shown before the phone number input.
// The flag is drawn (red / white / black bands with the gold eagle as a dot)
// so it looks the same on every device.
export default function PhonePrefix() {
  return (
    <View style={styles.row} accessibilityLabel="Egypt, country code +20">
      <View style={styles.flag}>
        <View style={[styles.band, { backgroundColor: '#CE1126' }]} />
        <View style={[styles.band, styles.white]}>
          <View style={styles.eagle} />
        </View>
        <View style={[styles.band, { backgroundColor: '#111111' }]} />
      </View>
      <Text style={styles.code}>+20</Text>
      <View style={styles.divider} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  flag: { width: 18, height: 12, borderRadius: 1.5, overflow: 'hidden' },
  band: { flex: 1 },
  white: { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  eagle: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#C09300' },
  code: { marginLeft: 8, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, includeFontPadding: false },
  divider: { width: 1, height: 22, marginLeft: 14, backgroundColor: colors.ink },
})
