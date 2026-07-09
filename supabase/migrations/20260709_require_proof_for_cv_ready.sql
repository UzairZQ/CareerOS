-- Keep CV-ready evidence tied to an actual proof link, not only a typed claim.
alter table public.evidence_items
  drop column if exists is_cv_ready;

alter table public.evidence_items
  add column is_cv_ready boolean generated always as (
    confidence in ('direct', 'bridge', 'basic')
    and coalesce(length(trim(evidence_summary)), 0) > 0
    and coalesce(length(trim(proof_url)), 0) > 0
  ) stored;
