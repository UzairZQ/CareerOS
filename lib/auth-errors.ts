export function formatAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("email rate limit") ||
    normalized.includes("rate limit")
  ) {
    return "Too many confirmation emails were requested. Please wait a few minutes and try again.";
  }

  if (normalized.includes("email_address_invalid")) {
    return "Enter a valid email address.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (normalized.includes("user already registered")) {
    return "An account with this email already exists. Sign in instead.";
  }

  return message;
}
