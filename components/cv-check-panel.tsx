"use client";

import { CheckCircle2, FileCheck2, Save, ShieldAlert, Upload, Wand2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { AiInsightButton, type AiProviderSettingSummary } from "@/components/ai-insight-button";
import { analyzeCvText } from "@/lib/careeros-analyzer";
import { cvTextSchema, formatValidationError } from "@/lib/dashboard-validation";
import { createClient } from "@/lib/supabase/browser";

type CvApplicationOption = {
  id: string;
  company: string;
  role: string;
  job_description: string | null;
};

export function CvCheckPanel({
  aiSettings,
  applications,
  initialCvText,
  userId,
}: {
  aiSettings: AiProviderSettingSummary[];
  applications: CvApplicationOption[];
  initialCvText: string | null;
  userId: string;
}) {
  const router = useRouter();
  const firstApplicationWithJd = applications.find((application) => application.job_description);
  const [selectedApplicationId, setSelectedApplicationId] = useState(firstApplicationWithJd?.id ?? "manual");
  const selectedApplication = applications.find((application) => application.id === selectedApplicationId);
  const [manualJobDescription, setManualJobDescription] = useState(
    firstApplicationWithJd?.job_description ?? "",
  );
  const [cvText, setCvText] = useState(initialCvText ?? "");
  const [pdfStatus, setPdfStatus] = useState<"idle" | "reading" | "ready" | "error">("idle");
  const [pdfMessage, setPdfMessage] = useState("");
  const [cvSaveStatus, setCvSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [cvSaveMessage, setCvSaveMessage] = useState("");
  const jobDescription = selectedApplication?.job_description?.trim() || manualJobDescription;
  const cvCheck = useMemo(() => analyzeCvText(cvText, jobDescription), [cvText, jobDescription]);
  const scoreTone =
    cvCheck.score >= 78
      ? "border-[#5C7A5C]/55 bg-[#5C7A5C]/18 text-[#DDF0DD]"
      : cvCheck.score >= 58
        ? "border-[#C77D2E]/50 bg-[#C77D2E]/14 text-[#FFD8B0]"
      : "border-[#C77D2E]/65 bg-[#C77D2E]/22 text-[#FFD8B0]";

  async function handleCvUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setPdfStatus("error");
      setPdfMessage("Choose a PDF file to extract CV text.");
      input.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPdfStatus("error");
      setPdfMessage("This PDF is larger than 5 MB. Try a smaller export.");
      input.value = "";
      return;
    }

    setPdfStatus("reading");
    setPdfMessage("Reading PDF text locally in your browser...");

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const pages: string[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (pageText) pages.push(pageText);
      }

      const extractedText = pages.join("\n\n").trim();
      if (extractedText.length < 40) {
        throw new Error("not-enough-text");
      }

      setCvText(extractedText.slice(0, 100_000));
      setPdfStatus("ready");
      setPdfMessage(`Read ${pdf.numPages} page${pdf.numPages === 1 ? "" : "s"} from ${file.name}.`);
    } catch (error) {
      console.error("CV PDF extraction failed", error);
      setPdfStatus("error");
      setPdfMessage(
        error instanceof Error && error.message === "not-enough-text"
          ? "This PDF has no selectable text. Paste the CV text or export a text-based PDF."
          : "We could not read this PDF. Try a text-based PDF or paste the CV text.",
      );
    } finally {
      input.value = "";
    }
  }

  async function saveCvText() {
    setCvSaveStatus("saving");
    setCvSaveMessage("");

    const parsedCvText = cvTextSchema.safeParse(cvText);
    if (!parsedCvText.success) {
      setCvSaveStatus("error");
      setCvSaveMessage(formatValidationError(parsedCvText.error));
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("user_profiles").upsert(
      {
        cv_text: parsedCvText.data,
        user_id: userId,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      setCvSaveStatus("error");
      setCvSaveMessage(error.message);
      return;
    }

    setCvSaveStatus("saved");
    setCvSaveMessage("CV saved.");
    router.refresh();
  }

  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <article className="card-sheen dashboard-card-tint dashboard-card-rose rounded-[22px] border border-white/10 p-4 shadow-dashboard-card md:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.14em] text-[#AEB6C2]">
              <FileCheck2 size={17} strokeWidth={1.8} />
              ATS CV Inspection
            </p>
            <h2 className="font-serif text-[clamp(1.75rem,3vw,2.55rem)] font-normal leading-none tracking-[-0.01em]">
              Readability before tailoring
            </h2>
          </div>
          <span className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase ${scoreTone}`}>
            {cvCheck.score}% readable
          </span>
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-medium text-white/74">Compare against application</span>
          <select
            className="dashboard-input w-full"
            onChange={(event) => setSelectedApplicationId(event.target.value)}
            value={selectedApplicationId}
          >
            <option value="manual">Manual JD context</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.company} - {application.role}
              </option>
            ))}
          </select>
        </label>

        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-medium text-white/74">CV text</span>
          <span className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-dashed border-white/18 bg-[#171A1F]/44 px-3 py-2.5 text-xs text-[#AEB6C2]">
            <span>{pdfMessage || "Upload a text-based PDF, or paste the text below."}</span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/16 bg-white/[0.04] px-3 py-2 font-semibold text-white/82 transition hover:border-[#9BB99B]/55 hover:bg-white/[0.08]">
              <Upload size={15} strokeWidth={1.8} />
              {pdfStatus === "reading" ? "Reading..." : "Upload PDF"}
              <input
                accept="application/pdf,.pdf"
                className="sr-only"
                disabled={pdfStatus === "reading"}
                onChange={handleCvUpload}
                type="file"
              />
            </label>
          </span>
          <textarea
            className="dashboard-input min-h-[260px] w-full resize-y leading-6"
            onChange={(event) => {
              setCvText(event.target.value);
              setCvSaveStatus("idle");
              setCvSaveMessage("");
            }}
            placeholder="Paste plain CV text here, or upload a text-based PDF above."
            value={cvText}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p
              className={`text-xs ${
                cvSaveStatus === "error" ? "text-[#FFD8B0]" : "text-[#AEB6C2]"
              }`}
            >
              {cvSaveMessage || "Save the extracted text to keep it available for your next session."}
            </p>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#9BB99B]/45 bg-[#5C7A5C]/14 px-4 text-sm font-semibold text-[#DDF0DD] transition hover:border-[#9BB99B]/70 hover:bg-[#5C7A5C]/24 disabled:cursor-not-allowed disabled:opacity-60"
              data-testid="cv-save"
              disabled={cvSaveStatus === "saving"}
              onClick={saveCvText}
              type="button"
            >
              <Save size={15} strokeWidth={1.9} />
              {cvSaveStatus === "saving" ? "Saving..." : cvSaveStatus === "saved" ? "Saved" : "Save CV text"}
            </button>
          </div>
          {pdfStatus === "error" ? <p className="mt-2 text-xs text-[#FFD8B0]">{pdfMessage}</p> : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-white/74">JD context</span>
          <textarea
            className="dashboard-input min-h-[140px] w-full resize-y leading-6"
            onChange={(event) => {
              setSelectedApplicationId("manual");
              setManualJobDescription(event.target.value);
            }}
            placeholder="Paste the target JD here, or select an application above."
            value={jobDescription}
          />
        </label>
      </article>

      <article className="card-sheen dashboard-card-tint dashboard-card-plum rounded-[22px] border border-white/10 p-4 shadow-dashboard-card md:p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <InspectionMetric label="Matched keywords" value={String(cvCheck.keywordMatches.length)} />
          <InspectionMetric label="Missing keywords" value={String(cvCheck.missingKeywords.length)} />
          <InspectionMetric label="Risky claims" value={String(cvCheck.riskyClaims.length)} />
        </div>

        <div className="mb-4 overflow-hidden rounded-[20px] border border-white/10">
          {cvCheck.sections.map((section) => (
            <div
              className="flex gap-3 border-t border-white/10 px-4 py-3 first:border-t-0"
              key={section.label}
            >
              {section.passed ? (
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#9BB99B]" size={18} strokeWidth={1.9} />
              ) : (
                <XCircle className="mt-0.5 shrink-0 text-[#C77D2E]" size={18} strokeWidth={1.9} />
              )}
              <div>
                <p className="font-semibold text-white">{section.label}</p>
                <p className="mt-1 text-sm leading-6 text-[#AEB6C2]">{section.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <KeywordBox title="Detected from your CV" items={cvCheck.keywordMatches} tone="good" />
          <KeywordBox title="Missing from JD" items={cvCheck.missingKeywords} tone="warn" />
        </div>

        <div className="mb-4 rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
            <ShieldAlert size={17} strokeWidth={1.8} />
            Claim risk
          </p>
          {cvCheck.riskyClaims.length > 0 ? (
            <ul className="space-y-2 text-sm leading-6 text-white/76">
              {cvCheck.riskyClaims.map((claim) => (
                <li key={claim}>• {claim}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-white/72">
              No broad risky claims detected. Keep it evidence-backed.
            </p>
          )}
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">
            <Wand2 size={17} strokeWidth={1.8} />
            Evidence-backed fixes
          </p>
          <ul className="space-y-2 text-sm leading-6 text-white/76">
            {(cvCheck.suggestions.length ? cvCheck.suggestions : ["CV is in a usable state for this rule-based pass."]).map(
              (suggestion) => (
                <li key={suggestion}>• {suggestion}</li>
              ),
            )}
          </ul>
        </div>

        <div className="mt-4">
          <AiInsightButton
            input={{
              keywordMatches: cvCheck.keywordMatches,
              missingKeywords: cvCheck.missingKeywords,
              riskyClaims: cvCheck.riskyClaims,
              score: cvCheck.score,
              suggestions: cvCheck.suggestions,
            }}
            kind="ats-check"
            settings={aiSettings}
          />
        </div>
      </article>
    </section>
  );
}

function InspectionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-[#303849] p-4">
      <p className="mb-2 text-xs uppercase tracking-[0.13em] text-[#AEB6C2]">{label}</p>
      <p className="font-serif text-4xl leading-none">{value}</p>
    </div>
  );
}

function KeywordBox({
  items,
  title,
  tone,
}: {
  items: string[];
  title: string;
  tone: "good" | "warn";
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#171A1F]/54 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-[#AEB6C2]">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.slice(0, 12).map((item) => (
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                tone === "good"
                  ? "border-[#5C7A5C]/45 bg-[#5C7A5C]/14 text-[#DDF0DD]"
                  : "border-[#C77D2E]/45 bg-[#C77D2E]/14 text-[#FFD8B0]"
              }`}
              key={item}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-[#AEB6C2]">None</span>
        )}
      </div>
    </div>
  );
}
