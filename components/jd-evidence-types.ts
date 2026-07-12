export type ApplicationOption = {
  id: string;
  company: string;
  role: string;
  job_description: string | null;
};

export type InitialEvidenceItem = {
  application_id: string | null;
  skill: string;
  evidence_summary: string | null;
  confidence: "direct" | "bridge" | "basic" | "learning" | "missing";
  proof_url: string | null;
};
