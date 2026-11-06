import { useRef, useState } from 'react'
import { StyleSheet, View, type TextInputInstance } from 'react-native'
import { router } from 'expo-router'
import AuthScreen from '@/components/AuthScreen'
import OutlinedField from '@/components/OutlinedField'
import PhonePrefix from '@/components/PhonePrefix'
import { PillButton, TextLink } from '@/components/Buttons'
import { isEmailTaken, signUp } from '@/auth/api'
import { useSession } from '@/auth/session'
import {
  normalizePhone, validateEmail, validateName, validatePassword, validatePasswordMatch, validatePhone,
} from '@/auth/validation'

type Field = 'firstName' | 'lastName' | 'email' | 'password' | 'confirm' | 'phone'
type Values = Record<Field, string>
type Errors = Partial<Record<Field, string | null>>

const EMPTY: Values = { firstName: '', lastName: '', email: '', password: '', confirm: '', phone: '' }

function validate(field: Field, v: Values): string | null {
  switch (field) {
    case 'firstName': return validateName(v.firstName, 'First name')
    case 'lastName': return validateName(v.lastName, 'Last name')
    case 'email': return validateEmail(v.email)
    case 'password': return validatePassword(v.password)
    case 'confirm': return validatePasswordMatch(v.password, v.confirm)
    case 'phone': return validatePhone(v.phone)
  }
}
const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'password', 'confirm', 'phone']

// Create an account (passengers). Errors appear once a field has been left
// (or on Continue), and update as the user fixes them.
export default function SignUp() {
  const { signIn } = useSession()
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  // Last e-mail the server said is taken, so the error survives re-validation.
  const [takenEmail, setTakenEmail] = useState<string | null>(null)

  // One ref per input, to move focus with the keyboard's "next" key.
  const firstNameRef = useRef<TextInputInstance>(null)
  const lastNameRef = useRef<TextInputInstance>(null)
  const emailRef = useRef<TextInputInstance>(null)
  const passwordRef = useRef<TextInputInstance>(null)
  const confirmRef = useRef<TextInputInstance>(null)
  const phoneRef = useRef<TextInputInstance>(null)
  const focusField = (field: Field) => ({
    firstName: firstNameRef, lastName: lastNameRef, email: emailRef,
    password: passwordRef, confirm: confirmRef, phone: phoneRef,
  })[field].current?.focus()

  function errorFor(field: Field, v: Values) {
    if (field === 'email' && takenEmail && v.email.trim().toLowerCase() === takenEmail) {
      return 'E-mail is already in use'
    }
    return validate(field, v)
  }

  function change(field: Field, text: string) {
    const next = { ...values, [field]: text }
    setValues(next)
    // Re-check fields the user has already visited (and the confirmation,
    // which depends on the password).
    setErrors((e) => {
      const updated = { ...e }
      if (touched[field]) updated[field] = errorFor(field, next)
      if (field === 'password' && touched.confirm) updated.confirm = errorFor('confirm', next)
      return updated
    })
  }

  async function leave(field: Field) {
    setTouched((t) => ({ ...t, [field]: true }))
    const error = errorFor(field, values)
    setErrors((e) => ({ ...e, [field]: error }))
    // Tell the user early if the e-mail is already registered.
    if (field === 'email' && !error) {
      const email = values.email.trim().toLowerCase()
      if (await isEmailTaken(email)) {
        setTakenEmail(email)
        setErrors((e) => ({ ...e, email: 'E-mail is already in use' }))
      }
    }
  }

  async function submit() {
    const all: Errors = Object.fromEntries(FIELDS.map((f) => [f, errorFor(f, values)]))
    setErrors(all)
    setTouched(Object.fromEntries(FIELDS.map((f) => [f, true])))
    const firstBad = FIELDS.find((f) => all[f])
    if (firstBad) {
      focusField(firstBad)
      return
    }

    setSubmitting(true)
    const result = await signUp({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: `+20${normalizePhone(values.phone)}`,
      password: values.password,
    })
    setSubmitting(false)

    if (!result.ok) {
      if (result.field === 'email') setTakenEmail(values.email.trim().toLowerCase())
      const field = result.field as Field | undefined
      if (field) setErrors((e) => ({ ...e, [field]: result.message }))
      return
    }
    signIn(result.user)
    router.replace('/home')
  }

  const fieldProps = (field: Field) => ({
    value: values[field],
    onChangeText: (t: string) => change(field, t),
    onBlur: () => leave(field),
    error: errors[field],
  })

  return (
    <AuthScreen title="Create an account">
      <View style={styles.fields}>
        <OutlinedField
          ref={firstNameRef}
          label="First Name"
          {...fieldProps('firstName')}
          autoCapitalize="words"
          autoComplete="name-given"
          textContentType="givenName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => focusField('lastName')}
        />
        <OutlinedField
          ref={lastNameRef}
          label="Last Name"
          {...fieldProps('lastName')}
          autoCapitalize="words"
          autoComplete="name-family"
          textContentType="familyName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => focusField('email')}
        />
        <OutlinedField
          ref={emailRef}
          label="E-mail"
          {...fieldProps('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => focusField('password')}
        />
        <OutlinedField
          ref={passwordRef}
          label="Password"
          password
          {...fieldProps('password')}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => focusField('confirm')}
        />
        <OutlinedField
          ref={confirmRef}
          label="Re-Enter Password"
          password
          {...fieldProps('confirm')}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => focusField('phone')}
        />
        <OutlinedField
          ref={phoneRef}
          label="Phone Number"
          prefix={<PhonePrefix />}
          {...fieldProps('phone')}
          keyboardType="phone-pad"
          autoComplete="tel-national"
          textContentType="telephoneNumber"
          maxLength={13}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </View>

      <View style={styles.actions}>
        <PillButton label="Continue" onPress={submit} loading={submitting} />
        <TextLink label="Already have an account" onPress={() => router.replace('/log-in')} />
      </View>
    </AuthScreen>
  )
}

const styles = StyleSheet.create({
  fields: { gap: 18 },
  actions: { marginTop: 34, gap: 16 },
})
