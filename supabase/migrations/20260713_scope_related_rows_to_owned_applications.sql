-- Keep evidence and learning sprints linked only to applications owned by the same user.
drop policy if exists "Users can create own evidence" on public.evidence_items;
create policy "Users can create own evidence"
on public.evidence_items for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    application_id is null
    or exists (
      select 1 from public.applications
      where applications.id = evidence_items.application_id
        and applications.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can update own evidence" on public.evidence_items;
create policy "Users can update own evidence"
on public.evidence_items for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    application_id is null
    or exists (
      select 1 from public.applications
      where applications.id = evidence_items.application_id
        and applications.user_id = auth.uid()
    )
  )
);

drop policy if exists "Users can create own learning sprints" on public.learning_sprints;
create policy "Users can create own learning sprints"
on public.learning_sprints for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.applications
    where applications.id = learning_sprints.application_id
      and applications.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own learning sprints" on public.learning_sprints;
create policy "Users can update own learning sprints"
on public.learning_sprints for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.applications
    where applications.id = learning_sprints.application_id
      and applications.user_id = auth.uid()
  )
);
