export type UserProfileData = {
  full_name: string | null;
  current_city: string | null;
  work_authorization:
    | "unknown"
    | "student_visa"
    | "eu_citizen"
    | "job_seeker"
    | "work_permit"
    | "other";
  languages: string[];
  target_roles: string[];
  profile_note: string | null;
};

export function calculateProfileReadiness(profile: UserProfileData) {
  const checks = [
    Boolean(profile.full_name?.trim()),
    profile.target_roles.length > 0,
    profile.languages.length > 0,
    profile.work_authorization !== "unknown",
    Boolean(profile.current_city?.trim()),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
