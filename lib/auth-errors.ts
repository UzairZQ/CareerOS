export function formatAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("email rate limit") ||
    normalized.includes("rate limit")
  ) {
    return "Too many email requests were made. Please wait a few minutes before trying again.";
  }

  if (normalized.includes("email_address_invalid")) {
    return "Enter a valid email address.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (isEmailNotConfirmedError(message)) {
    return "Confirm your email before signing in. Check your inbox or spam folder, then try again.";
  }

  if (normalized.includes("user already registered")) {
    return "An account with this email already exists. Sign in instead.";
  }

  return message;
}

export function isEmailNotConfirmedError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed") ||
    normalized.includes("email is not confirmed")
  );
}
