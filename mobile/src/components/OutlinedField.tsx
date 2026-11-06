import { useState, type ReactNode, type Ref } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native'
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from './Icons'
import { colors, fonts } from '@/theme'

type Props = TextInputProps & {
  label: string
  /** Error message; when set the label turns red, an ⓘ icon shows and the message appears below. */
  error?: string | null
  /** Password field: hides the text and adds a show/hide toggle. */
  password?: boolean
  /** Content before the input, e.g. the +20 country prefix. */
  prefix?: ReactNode
  ref?: Ref<TextInputInstance>
}

// Pill-shaped input with its label sitting on the border (the label is always
// "floating", as in the mockups). Used for every field on the auth screens.
export default function OutlinedField({ label, error, password = false, prefix, ref, style, onFocus, onBlur, ...input }: Props) {
  const [focused, setFocused] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const hasError = !!error

  return (
    <View style={styles.wrap}>
      <View style={[styles.box, focused && styles.boxFocused]}>
        {prefix}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={colors.muted}
          selectionColor={colors.green}
          cursorColor={colors.ink}
          secureTextEntry={password && !revealed}
          autoCapitalize={password ? 'none' : input.autoCapitalize}
          autoCorrect={false}
          accessibilityLabel={label}
          accessibilityHint={error ?? undefined}
          onFocus={(e) => { setFocused(true); onFocus?.(e) }}
          onBlur={(e) => { setFocused(false); onBlur?.(e) }}
          {...input}
        />
        {password && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={styles.trailing}
          >
            {revealed ? <EyeOffIcon color={colors.muted} /> : <EyeIcon color={colors.muted} />}
          </Pressable>
        )}
        {hasError && (
          <View style={styles.trailing} accessibilityElementsHidden importantForAccessibility="no">
            <AlertCircleIcon color={colors.error} />
          </View>
        )}
      </View>

      {/* Label drawn over the border; its background hides the line behind it. */}
      <Text style={[styles.label, hasError && styles.labelError]} pointerEvents="none" numberOfLines={1}>
        {label}
      </Text>

      {hasError && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 9 },
  box: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 12,
  },
  boxFocused: { borderWidth: 1.6, borderColor: colors.ink },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  trailing: { marginLeft: 8, height: '100%', justifyContent: 'center' },
  label: {
    position: 'absolute',
    top: 0,
    left: 24,
    maxWidth: '80%',
    paddingHorizontal: 6,
    backgroundColor: colors.bg,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
  },
  labelError: { color: colors.error },
  error: {
    marginTop: 5,
    marginLeft: 20,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.error,
  },
})
