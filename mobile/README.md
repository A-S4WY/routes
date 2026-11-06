# Routes — passenger app

React Native app (Expo SDK 58, Expo Router) for Routes passengers.
The admin dashboard is the web app at the root of this repository.

## Run it on your phone

1. Install **Expo Go** from the Play Store on the phone.
2. On the computer, from the repository root:

   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. Make sure the phone and computer are on the same Wi-Fi, open Expo Go and
   scan the QR code shown in the terminal.

If the phone can't connect (e.g. a guest or office network that isolates
devices), run `npx expo start --tunnel` instead.

## What's here

| Screen | File |
| --- | --- |
| Welcome (green) | `src/app/index.tsx` |
| Create an account | `src/app/sign-up.tsx` |
| Log in | `src/app/log-in.tsx` |
| Signed-in placeholder | `src/app/home.tsx` |

- `src/components/` — shared UI: `OutlinedField` (pill input with the label
  on the border and the error state), `PhonePrefix` (🇪🇬 +20), buttons, logo,
  diagonal stripes.
- `src/auth/` — `validation.ts` (field rules), `api.ts` (sign up / log in),
  `session.tsx` (who is signed in).
- `src/theme.ts` — colours and fonts (Poppins).

## Backend

There's no backend yet: `src/auth/api.ts` uses an in-memory stand-in that
behaves like the real API. To see the "E-mail is already in use" error, sign
up with `ams.sawy@gmail.com` (that account's password is `routes123`).
Accounts you create last until the app is reloaded.

When the backend is ready, set `EXPO_PUBLIC_API_URL` and replace the function
bodies in `src/auth/api.ts` with `fetch()` calls — the screens only depend on
its types.

## Checks

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint
npx expo-doctor    # dependency / config check
```
