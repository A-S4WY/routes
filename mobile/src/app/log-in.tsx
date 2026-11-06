import { useRef, useState } from 'react'
import { StyleSheet, View, type TextInputInstance } from 'react-native'
import { router } from 'expo-router'
import AuthScreen from '@/components/AuthScreen'
import OutlinedField from '@/components/OutlinedField'
import { PillButton, TextLink } from '@/components/Buttons'
import { logIn } from '@/auth/api'
import { useSession } from '@/auth/session'
import { validateEmail } from '@/auth/validation'

// Log in (passengers). No mockup yet — built in the same style as
// "Create an account".
export default function LogIn() {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const passwordRef = useRef<TextInputInstance>(null)

  async function submit() {
    const eErr = validateEmail(email)
    const pErr = password ? null : 'Password is required'
    setEmailError(eErr)
    setPasswordError(pErr)
    if (eErr || pErr) return

    setSubmitting(true)
    const result = await logIn(email, password)
    setSubmitting(false)
    if (!result.ok) {
      setPasswordError(result.message)
      return
    }
    signIn(result.user)
    router.replace('/home')
  }

  return (
    <AuthScreen title="Log in">
      <View style={styles.fields}>
        <OutlinedField
          label="E-mail"
          value={email}
          onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(validateEmail(t)) }}
          onBlur={() => email && setEmailError(validateEmail(email))}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <OutlinedField
          ref={passwordRef}
          label="Password"
          password
          value={password}
          onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(null) }}
          error={passwordError}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </View>

      <View style={styles.actions}>
        <PillButton label="Log in" onPress={submit} loading={submitting} />
        <TextLink label="Create a new account" onPress={() => router.replace('/sign-up')} />
      </View>
    </AuthScreen>
  )
}

const styles = StyleSheet.create({
  fields: { gap: 18 },
  actions: { marginTop: 34, gap: 16 },
})
