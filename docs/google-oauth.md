# Google OAuth Setup

CareerOS already contains the browser button and the PKCE callback route. Google
OAuth still needs provider credentials in Supabase because those credentials
belong to the project owner, not to the application source code.

## Local Setup

1. In Google Cloud Console, create or select a project.
2. Configure the OAuth consent screen/Google Auth Platform branding.
3. Create an OAuth client with type **Web application**.
4. Add this authorized JavaScript origin:

```text
http://localhost:3000
```

5. Add this authorized redirect URI:

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

Use the exact callback URL displayed on the Supabase Google provider page.

6. In Supabase, open **Authentication -> Providers -> Google**.
7. Enable Google and paste the Google Client ID and Client Secret.
8. In **Authentication -> URL Configuration**, add this application callback:

```text
http://localhost:3000/auth/callback
```

Also add this password-recovery destination so Supabase can return users to the
new-password screen:

```text
http://localhost:3000/reset-password
```

## Production Setup

Add the production origin to Google and the production callback to Supabase:

```text
https://your-domain.example
https://your-domain.example/auth/callback
```

Keep the Supabase provider callback as the Google redirect URI. Google redirects
to Supabase first; Supabase then redirects to CareerOS.

## Verification Checklist

- Click **Sign in with Google** from the login view.
- Complete the Google consent flow.
- Confirm that `/auth/callback` redirects to `/dashboard`.
- Cancel the consent screen and confirm CareerOS shows a cancellation message.
- Test a malformed callback and confirm it returns to the login screen.
- Never commit the Google Client Secret or place it in `NEXT_PUBLIC_*` variables.

The callback uses a same-origin allow-list for its final destination and maps
provider failures to safe, user-facing messages.
