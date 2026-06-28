# MedTrak

A production-grade **family medication tracker** built as a PWA.

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** — "Warm Kinship" design system from `design/warm_kinship/DESIGN.md`
- **Supabase** — auth, Postgres, Row Level Security, Realtime
- **next-pwa** (`@ducanh2912/next-pwa`) — service worker, offline fallback, installable, push-ready

Two roles:

- **Patient** — sees their own medications, confirms doses, views adherence history.
- **Caretaker** — manages every patient in the family group: medications, schedules, inventory, and dosing on a patient's behalf.

---

## 1. Prerequisites

- Node.js 18.18+ (or 20+)
- A Supabase project with the `mt_*` schema deployed, RLS enabled, and Realtime turned on for `mt_logs` and `mt_inventory`.

## 2. Environment variables

`.env.local` is already created with the project's public Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://nknucdxrdxhkulfgrsxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Optional — Web Push. Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

> The anon key is safe in the browser bundle — security is enforced by RLS, not by hiding the key.

## 3. Install & run

```bash
npm install
npm run dev        # http://localhost:3000
```

- `npm run icons` generates the PWA icons (`public/icons/icon-192.png`, `icon-512.png`). It runs automatically before `dev` and `build`, so you don't normally call it directly.
- The service worker is **disabled in development** (so HMR works). To test install/offline/push, do a production build:

```bash
npm run build
npm start
```

## 4. Deploy to Vercel

1. Push this repo to GitHub (see §7).
2. Import the project in Vercel (framework auto-detects Next.js; `vercel.json` is included).
3. Add the two `NEXT_PUBLIC_*` env vars (and the VAPID pair if using push) in the Vercel dashboard.
4. Deploy. Middleware runs on the Edge runtime by default.

---

## 5. Expected Supabase RLS policies

The app talks to Supabase **as the signed-in user**, so every table needs policies. Your schema already has RLS enabled — verify the policies below exist (here is a reference set you can adapt). A helper `is_member_of(group uuid)` keeps them readable:

```sql
create or replace function public.is_member_of(group_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.mt_members m
    where m.family_group_id = group_id and m.user_id = auth.uid()
  );
$$;

-- mt_family_groups
create policy "create groups"  on public.mt_family_groups for insert to authenticated with check (true);
create policy "read groups"    on public.mt_family_groups for select to authenticated using (true); -- needed to look up by invite_code when joining
create policy "update own grp" on public.mt_family_groups for update to authenticated using (is_member_of(id));

-- mt_members
create policy "read self+family" on public.mt_members for select to authenticated
  using (user_id = auth.uid() or is_member_of(family_group_id));
create policy "join/insert members" on public.mt_members for insert to authenticated
  with check (user_id = auth.uid() or is_member_of(family_group_id)); -- caretaker adds managed patients (user_id null)
create policy "update members" on public.mt_members for update to authenticated
  using (user_id = auth.uid() or is_member_of(family_group_id));

-- mt_medications / mt_schedules / mt_inventory  (scope by family group)
create policy "rw meds" on public.mt_medications for all to authenticated
  using (is_member_of(family_group_id)) with check (is_member_of(family_group_id));

create policy "rw schedules" on public.mt_schedules for all to authenticated
  using (exists (select 1 from public.mt_medications x where x.id = medication_id and is_member_of(x.family_group_id)))
  with check (exists (select 1 from public.mt_medications x where x.id = medication_id and is_member_of(x.family_group_id)));

create policy "rw inventory" on public.mt_inventory for all to authenticated
  using (exists (select 1 from public.mt_medications x where x.id = medication_id and is_member_of(x.family_group_id)))
  with check (exists (select 1 from public.mt_medications x where x.id = medication_id and is_member_of(x.family_group_id)));

-- mt_logs  (any member of the patient's family can read/confirm)
create policy "rw logs" on public.mt_logs for all to authenticated
  using (exists (select 1 from public.mt_members m where m.id = patient_id and is_member_of(m.family_group_id)))
  with check (exists (select 1 from public.mt_members m where m.id = patient_id and is_member_of(m.family_group_id)));

-- mt_notification_prefs (own row, by member)
create policy "rw prefs" on public.mt_notification_prefs for all to authenticated
  using (exists (select 1 from public.mt_members m where m.id = member_id and m.user_id = auth.uid()))
  with check (exists (select 1 from public.mt_members m where m.id = member_id and m.user_id = auth.uid()));
```

> If joining by invite code fails, it's almost always the `mt_family_groups` **select** policy being too strict — the joiner isn't a member yet, so they need to be able to look the group up by code (or use a `security definer` RPC).

Also enable Realtime replication for `mt_logs` and `mt_inventory` (Database → Replication, or `alter publication supabase_realtime add table ...`).

---

## 6. Project structure

```
app/
  auth/            sign-in, sign-up, forgot-password, update-password, callback
  onboarding/      create / join a family group (server actions)
  patient/         today (realtime), history (calendar), settings
  caretaker/       dashboard, patients, patients/[id], medications(+add/[id]), inventory, settings
  offline/         PWA offline fallback
  layout.tsx, page.tsx, globals.css
components/        UI primitives, nav/shell, patient + caretaker feature components, pwa/
lib/
  supabase/        browser + server clients, middleware session helper
  actions/         server actions: doses, medications, inventory, patients, settings
  auth.ts, queries.ts, dose.ts, caretaker.ts, utils.ts, constants.ts, types.ts, push.ts
middleware.ts      auth gate + role-based redirects (Edge)
worker/index.js    custom SW push + notificationclick handlers
scripts/           zero-dependency PWA icon generator
public/manifest.json
```

## 7. Git (working at the repo root)

This app lives at the **repo root**. The root is not yet a git repo, so initialise it and point at your remote:

```bash
git init
git add .
git commit -m "MedTrak: initial build"
git branch -M main
git remote add origin https://github.com/empakt-ai/medtrack.git
git push -u origin main      # use --force only if intentionally replacing remote history
```

`.gitignore` excludes `node_modules`, `.next`, `.env*.local`, and the generated service-worker files.

---

## 8. Notes & decisions

- **next-pwa:** uses the actively maintained `@ducanh2912/next-pwa` fork (the original `next-pwa` is unmaintained and breaks with the App Router).
- **Managed patients:** a caretaker can add a patient who doesn't have their own login (`mt_members.user_id = null`). Patients can also self-join with the invite code and pick their role.
- **Reset flow:** `/auth/update-password` was added so the password-reset email link can complete (not in the original route list, but required for a working flow).
- **"Today":** computed in the server's timezone (UTC on Vercel). For multi-timezone production use, derive the day from the user's locale.
- **Push:** subscription + endpoint storage is implemented. Actually *sending* pushes needs a server using the VAPID **private** key (e.g. a Supabase Edge Function or cron) — that delivery piece is intentionally out of scope here.
- **Colors:** UI surfaces use the Stitch token `#fcf9f8`; the PWA manifest `background_color` is `#f8f7f4` per the brief.
```
