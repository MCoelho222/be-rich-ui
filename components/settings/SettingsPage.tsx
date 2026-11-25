"use client";
/** Settings (frontend.md §6.6, ui-behavior §2–§3): profile, password, household, members, invitations. */
import { Loader2, Mail, RotateCw, UserMinus, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { FormError, PasswordField } from "@/components/auth/fields";
import { Skeleton, WidgetError } from "@/components/dashboard/Widget";
import { FieldShell, Select } from "@/components/entries/pickers";
import { PageHeader } from "@/components/shell/PageHeader";
import { FormDialog, PrimaryButton, SecondaryButton } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import {
  COUNTRIES,
  digits,
  formatNational,
  isValidCpf,
  maskCep,
  maskCpf,
  splitPhone,
  UFS,
} from "@/lib/br";
import { CURRENCIES, type Currency } from "@/lib/entries";
import { useErrorMessage } from "@/lib/errors";
import { formatDate, shortName } from "@/lib/format";
import { useLanguage } from "@/lib/preferences";
import { useMembers } from "@/lib/queries";
import {
  useChangePassword,
  useHousehold,
  useInvitationAction,
  useInvitations,
  useLeaveHousehold,
  useProfile,
  useRemoveMember,
  useUpdateHousehold,
  useUpdateProfile,
  type Profile,
} from "@/lib/settings";
import { todayIso } from "@/lib/period";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

const SECTIONS = ["profile", "password", "household", "members", "invitations"] as const;
type Section = (typeof SECTIONS)[number];

function fieldErrors(error: unknown): Record<string, string> {
  return error instanceof ApiError
    ? Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, v[0]]))
    : {};
}

function SaveButton({
  pending,
  disabled,
  label,
}: {
  pending: boolean;
  disabled?: boolean;
  label: string;
}) {
  return (
    <PrimaryButton type="submit" disabled={pending || disabled} className="self-start">
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {label}
    </PrimaryButton>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const section: Section = SECTIONS.includes(params.get("section") as Section)
    ? (params.get("section") as Section)
    : "profile";
  const go = (next: Section) =>
    router.replace(next === "profile" ? pathname : `${pathname}?section=${next}`, {
      scroll: false,
    });

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="flex flex-col gap-6 px-4 pt-2 pb-10 sm:px-8 lg:flex-row">
        {/* Sub-navigation: a list on larger screens, a select on phones */}
        <nav aria-label={t("title")} className="hidden w-52 shrink-0 flex-col gap-1 lg:flex">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => go(s)}
              aria-current={section === s ? "page" : undefined}
              className={cn(
                "h-9 rounded-lg px-3 text-left text-sm font-medium",
                section === s
                  ? "bg-surface-2 text-text"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              )}
            >
              {t(`section.${s}`)}
            </button>
          ))}
        </nav>
        <div className="lg:hidden">
          <Select
            value={section}
            onChange={(e) => go(e.target.value as Section)}
            aria-label={t("title")}
          >
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`section.${s}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-6">
          {section === "profile" && <ProfileSection />}
          {section === "password" && <PasswordSection />}
          {section === "household" && <HouseholdSection />}
          {section === "members" && <MembersSection />}
          {section === "invitations" && <InvitationsSection />}
        </div>
      </div>
    </>
  );
}

// --- Profile (ui-behavior §2) --------------------------------------------------------

function ProfileSection() {
  const profile = useProfile();
  if (profile.isPending) return <Skeleton className="h-[640px] w-full rounded-xl" />;
  if (profile.isError) return <WidgetError onRetry={() => void profile.refetch()} />;
  return <ProfileForm profile={profile.data} />;
}

function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations("settings");
  const update = useUpdateProfile();
  const errorMessage = useErrorMessage();
  const { setLanguage } = useLanguage();
  const phone = splitPhone(profile.phone);
  const a = profile.address;
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    cpf: maskCpf(profile.cpf ?? ""),
    birth_date: profile.birth_date ?? "",
    country: phone.country.code,
    phone: formatNational(phone.country, phone.national),
    cep: maskCep(a?.cep ?? ""),
    street: a?.street ?? "",
    number: a?.number ?? "",
    noNumber: !!a && !a.number,
    complement: a?.complement ?? "",
    neighborhood: a?.neighborhood ?? "",
    city: a?.city ?? "",
    state: a?.state ?? "",
    notes: profile.notes ?? "",
    language: profile.language as Locale,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));
  const country = COUNTRIES.find((c) => c.code === form.country) ?? COUNTRIES[0];
  const hasAddress = [
    form.cep,
    form.street,
    form.city,
    form.state,
    form.number,
    form.complement,
    form.neighborhood,
  ].some((v) => digits(v) || v.trim());

  const validateCpf = () => {
    const cpf = digits(form.cpf);
    setErrors((e) => ({ ...e, cpf: cpf && !isValidCpf(cpf) ? t("invalidCpf") : "" }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!form.name.trim()) found.name = t("required");
    if (digits(form.cpf) && !isValidCpf(form.cpf)) found.cpf = t("invalidCpf");
    if (form.birth_date && form.birth_date >= todayIso())
      found.birth_date = t("birthPast");
    if (hasAddress) {
      if (digits(form.cep).length !== 8) found["address.cep"] = t("required");
      if (!form.street.trim()) found["address.street"] = t("required");
      if (!form.city.trim()) found["address.city"] = t("required");
      if (!form.state) found["address.state"] = t("required");
    }
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      cpf: digits(form.cpf) || null,
      birth_date: form.birth_date || null,
      phone: digits(form.phone) ? `+${country.dial}${digits(form.phone)}` : null,
      address: hasAddress
        ? {
            cep: digits(form.cep),
            street: form.street.trim(),
            number: form.noNumber ? null : form.number.trim() || null,
            complement: form.complement.trim() || null,
            neighborhood: form.neighborhood.trim() || null,
            city: form.city.trim(),
            state: form.state,
          }
        : null,
      notes: form.notes.trim() || null,
      language: form.language,
    };
    update
      .mutateAsync(body)
      .then(() => {
        toast.success(t("saved"));
        setLanguage(form.language);
      })
      .catch((error) => {
        const fields = fieldErrors(error);
        setErrors(fields);
        if (!Object.keys(fields).length) toast.error(errorMessage(error));
      });
  };

  const counter =
    form.notes.length >= 400 ? <span className="num">{form.notes.length}/500</span> : undefined;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <Card title={t("section.profile")} description={t("profileIntro")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label={t("name")} required error={errors.name}>
            <Input
              value={form.name}
              maxLength={100}
              onChange={(e) => set("name")(e.target.value)}
              autoComplete="name"
            />
          </FieldShell>
          <FieldShell label={t("email")} required error={errors.email}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              autoComplete="email"
            />
          </FieldShell>
          <FieldShell label="CPF" error={errors.cpf}>
            <Input
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => set("cpf")(maskCpf(e.target.value))}
              onBlur={validateCpf}
              aria-invalid={!!errors.cpf}
            />
          </FieldShell>
          <FieldShell label={t("birthDate")} error={errors.birth_date}>
            <Input
              type="date"
              value={form.birth_date}
              max={todayIso()}
              onChange={(e) => set("birth_date")(e.target.value)}
            />
          </FieldShell>
          <FieldShell label={t("phone")} error={errors.phone} className="sm:col-span-2">
            <div className="flex gap-2">
              <Select
                value={form.country}
                onChange={(e) => set("country")(e.target.value)}
                aria-label={t("country")}
                className="w-36"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} +{c.dial}
                  </option>
                ))}
              </Select>
              <Input
                inputMode="tel"
                autoComplete="tel-national"
                placeholder={country.code === "BR" ? "(48) 99999-9999" : ""}
                value={form.phone}
                onChange={(e) => set("phone")(formatNational(country, e.target.value))}
                aria-label={t("phone")}
              />
            </div>
          </FieldShell>
          <FieldShell label={t("language")}>
            <Select value={form.language} onChange={(e) => set("language")(e.target.value)}>
              <option value="pt">Português</option>
              <option value="en">English</option>
            </Select>
          </FieldShell>
        </div>
      </Card>

      <Card title={t("address")}>
        <div className="grid gap-4 sm:grid-cols-6">
          <FieldShell label="CEP" error={errors["address.cep"]} className="sm:col-span-2">
            <Input
              inputMode="numeric"
              placeholder="00000-000"
              value={form.cep}
              onChange={(e) => set("cep")(maskCep(e.target.value))}
            />
          </FieldShell>
          <FieldShell
            label={t("street")}
            error={errors["address.street"]}
            className="sm:col-span-4"
          >
            <Input
              value={form.street}
              maxLength={120}
              onChange={(e) => set("street")(e.target.value)}
              autoComplete="address-line1"
            />
          </FieldShell>
          <FieldShell label={t("number")} className="sm:col-span-2">
            <div className="flex items-center gap-3">
              <Input
                value={form.noNumber ? "" : form.number}
                disabled={form.noNumber}
                maxLength={10}
                onChange={(e) => set("number")(e.target.value)}
                aria-label={t("number")}
              />
              <label className="flex shrink-0 items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.noNumber}
                  onChange={(e) => set("noNumber")(e.target.checked)}
                  className="size-4 accent-[var(--brand)]"
                />
                S/N
              </label>
            </div>
          </FieldShell>
          <FieldShell label={t("complement")} className="sm:col-span-4">
            <Input
              value={form.complement}
              maxLength={60}
              onChange={(e) => set("complement")(e.target.value)}
            />
          </FieldShell>
          <FieldShell label={t("neighborhood")} className="sm:col-span-2">
            <Input
              value={form.neighborhood}
              maxLength={60}
              onChange={(e) => set("neighborhood")(e.target.value)}
            />
          </FieldShell>
          <FieldShell label={t("city")} error={errors["address.city"]} className="sm:col-span-3">
            <Input
              value={form.city}
              maxLength={60}
              onChange={(e) => set("city")(e.target.value)}
              autoComplete="address-level2"
            />
          </FieldShell>
          <FieldShell label={t("state")} error={errors["address.state"]} className="sm:col-span-1">
            <Select value={form.state} onChange={(e) => set("state")(e.target.value)}>
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
            </Select>
          </FieldShell>
        </div>
      </Card>

      <Card title={t("notes")}>
        <FieldShell label={t("notes")} hint={counter}>
          <textarea
            value={form.notes}
            maxLength={500}
            rows={4}
            placeholder={t("notesPlaceholder")}
            onChange={(e) => set("notes")(e.target.value)}
            className="rounded-lg border border-line-strong bg-surface-2 px-3 py-2 text-[15px] outline-none placeholder:text-text-faint focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--ring-color)]"
          />
        </FieldShell>
      </Card>

      <SaveButton pending={update.isPending} label={t("save")} />
    </form>
  );
}

// --- Password (auth.md §4.5) ---------------------------------------------------------

function PasswordSection() {
  const t = useTranslations("settings");
  const change = useChangePassword();
  const errorMessage = useErrorMessage();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const tooShort = next.length > 0 && (next.length < 8 || next.length > 128);

  return (
    <Card title={t("section.password")} description={t("passwordIntro")}>
      <form
        noValidate
        className="flex max-w-sm flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          change
            .mutateAsync({ current_password: current, new_password: next })
            .then(() => {
              toast.success(t("passwordChanged"));
              setCurrent("");
              setNext("");
            })
            .catch((e) =>
              setError(
                e instanceof ApiError && e.code === "INVALID_CREDENTIALS"
                  ? t("wrongPassword")
                  : errorMessage(e)
              )
            );
        }}
      >
        <PasswordField
          label={t("currentPassword")}
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <PasswordField
          label={t("newPassword")}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          hint={t("passwordHint")}
          error={tooShort ? t("passwordLength") : undefined}
        />
        <FormError message={error} />
        <SaveButton
          pending={change.isPending}
          disabled={!current || !next || tooShort}
          label={t("changePassword")}
        />
      </form>
    </Card>
  );
}

// --- Household (ui-behavior §3.1) ----------------------------------------------------

function HouseholdSection() {
  const t = useTranslations("settings");
  const household = useHousehold();
  const update = useUpdateHousehold();
  const errorMessage = useErrorMessage();
  const [name, setName] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [confirming, setConfirming] = useState(false);
  if (household.isPending) return <Skeleton className="h-60 w-full rounded-xl" />;
  if (household.isError) return <WidgetError onRetry={() => void household.refetch()} />;

  const h = household.data;
  const nextName = name ?? h.name;
  const nextCurrency = currency ?? h.default_currency;
  const changedCurrency = nextCurrency !== h.default_currency;

  const save = () =>
    update
      .mutateAsync({
        ...(nextName !== h.name ? { name: nextName.trim() } : {}),
        ...(changedCurrency ? { default_currency: nextCurrency } : {}),
      })
      .then(() => {
        toast.success(t("saved"));
        setConfirming(false);
        setName(null);
        setCurrency(null);
      })
      .catch((error) => toast.error(errorMessage(error)));

  return (
    <Card title={t("section.household")}>
      <form
        noValidate
        className="flex max-w-md flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          // ui-behavior §3.1: changing the currency asks for confirmation first.
          if (changedCurrency) setConfirming(true);
          else void save();
        }}
      >
        <FieldShell label={t("householdName")} required>
          <Input value={nextName} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </FieldShell>
        <FieldShell label={t("defaultCurrency")}>
          <Select value={nextCurrency} onChange={(e) => setCurrency(e.target.value as Currency)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </FieldShell>
        <SaveButton
          pending={update.isPending}
          disabled={!nextName.trim() || (nextName === h.name && !changedCurrency)}
          label={t("save")}
        />
      </form>
      {confirming && (
        <FormDialog
          open
          width="sm"
          onOpenChange={(open) => !open && setConfirming(false)}
          title={t("currencyTitle")}
          footer={
            <>
              <SecondaryButton onClick={() => setConfirming(false)}>{t("cancel")}</SecondaryButton>
              <PrimaryButton disabled={update.isPending} onClick={() => void save()}>
                {t("confirm")}
              </PrimaryButton>
            </>
          }
        >
          <p className="text-sm text-text-2">{t("currencyBody", { currency: nextCurrency })}</p>
        </FormDialog>
      )}
    </Card>
  );
}

// --- Members (ui-behavior §3.2) ------------------------------------------------------

function MembersSection() {
  const t = useTranslations("settings");
  const members = useMembers();
  const remove = useRemoveMember();
  const leave = useLeaveHousehold();
  const errorMessage = useErrorMessage();
  const [confirm, setConfirm] = useState<
    { type: "remove"; id: string; name: string } | { type: "leave" } | null
  >(null);
  if (members.isPending) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (members.isError) return <WidgetError onRetry={() => void members.refetch()} />;
  const solo = members.data.length < 2; // §4.2 rule 2: the last member can't leave or be removed

  const act = () => {
    if (!confirm) return;
    const done =
      confirm.type === "remove"
        ? remove.mutateAsync(confirm.id).then(() => toast.success(t("removed")))
        : leave.mutateAsync();
    done.then(() => setConfirm(null)).catch((error) => toast.error(errorMessage(error)));
  };

  return (
    <Card title={t("section.members")} description={solo ? t("soloHint") : undefined}>
      <ul className="flex flex-col">
        {members.data.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap items-center gap-3 border-t border-line py-3 first:border-t-0"
          >
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-brand"
            >
              {m.name[0]?.toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {shortName(m.name)}{" "}
                {m.is_you && <span className="font-normal text-text-muted">({t("you")})</span>}
              </span>
              <span className="block truncate text-sm text-text-muted">{m.email}</span>
            </span>
            {!solo &&
              (m.is_you ? (
                <SecondaryButton onClick={() => setConfirm({ type: "leave" })} className="h-9">
                  {t("leave")}
                </SecondaryButton>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirm({ type: "remove", id: m.id, name: shortName(m.name) })}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-text-muted hover:bg-surface-2 hover:text-negative"
                >
                  <UserMinus size={16} aria-hidden />
                  {t("remove")}
                </button>
              ))}
          </li>
        ))}
      </ul>
      {confirm && (
        <FormDialog
          open
          width="sm"
          onOpenChange={(open) => !open && setConfirm(null)}
          title={
            confirm.type === "leave" ? t("leaveTitle") : t("removeTitle", { name: confirm.name })
          }
          footer={
            <>
              <SecondaryButton onClick={() => setConfirm(null)}>{t("cancel")}</SecondaryButton>
              <PrimaryButton danger disabled={remove.isPending || leave.isPending} onClick={act}>
                {confirm.type === "leave" ? t("leave") : t("remove")}
              </PrimaryButton>
            </>
          }
        >
          <p className="text-sm text-text-2">
            {confirm.type === "leave" ? t("leaveBody") : t("removeBody", { name: confirm.name })}
          </p>
        </FormDialog>
      )}
    </Card>
  );
}

// --- Invitations (ui-behavior §3.3) --------------------------------------------------

function InvitationsSection() {
  const t = useTranslations("settings");
  const invitations = useInvitations();
  const members = useMembers().data ?? [];
  const action = useInvitationAction();
  const errorMessage = useErrorMessage();
  const [email, setEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const invite = (event: React.FormEvent) => {
    event.preventDefault();
    setInviteError(null);
    action
      .mutateAsync({ kind: "invite", email: email.trim() })
      .then(() => {
        toast.success(t("inviteSent", { email: email.trim() }));
        setEmail("");
      })
      .catch((error) => {
        if (error instanceof ApiError && error.fields.email) setInviteError(t("emailHasAccount"));
        else if (error instanceof ApiError && error.code === "CONFLICT")
          setInviteError(t("alreadyPending"));
        else if (error instanceof ApiError && error.code === "EMAIL_FAILED")
          setInviteError(t("emailFailed"));
        else setInviteError(errorMessage(error));
      });
  };

  const run = (kind: "resend" | "revoke", id: string) =>
    action
      .mutateAsync({ kind, id })
      .then(() => {
        toast.success(kind === "resend" ? t("resent") : t("revoked"));
        setRevoking(null);
      })
      .catch((error) => toast.error(errorMessage(error)));

  return (
    <Card title={t("section.invitations")} description={t("invitationsIntro")}>
      <form noValidate onSubmit={invite} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@exemplo.com"
            aria-label={t("inviteEmail")}
            aria-invalid={!!inviteError}
          />
          <PrimaryButton
            type="submit"
            disabled={!email.includes("@") || action.isPending}
            className="shrink-0"
          >
            <Mail size={16} aria-hidden />
            {t("invite")}
          </PrimaryButton>
        </div>
        {inviteError && <p className="text-[13px] text-negative">{inviteError}</p>}
      </form>
      {invitations.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : invitations.isError ? (
        <WidgetError onRetry={() => void invitations.refetch()} />
      ) : invitations.data.length === 0 ? (
        <p className="text-sm text-text-muted">{t("noInvitations")}</p>
      ) : (
        <ul className="flex flex-col">
          {invitations.data.map((inv) => {
            const by = members.find((m) => m.id === inv.invited_by_id);
            return (
              <li
                key={inv.id}
                className="flex flex-wrap items-center gap-3 border-t border-line py-3 first:border-t-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{inv.email}</span>
                  <span className="num block text-sm text-text-muted">
                    {t("invitedBy", {
                      name: by ? shortName(by.name) : "—",
                      date: formatDate(inv.expires_at.slice(0, 10)),
                    })}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void run("resend", inv.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-text-muted hover:bg-surface-2 hover:text-text"
                >
                  <RotateCw size={15} aria-hidden />
                  {t("resend")}
                </button>
                <button
                  type="button"
                  onClick={() => setRevoking(inv.id)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-text-muted hover:bg-surface-2 hover:text-negative"
                >
                  <X size={15} aria-hidden />
                  {t("revoke")}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {revoking && (
        <FormDialog
          open
          width="sm"
          onOpenChange={(open) => !open && setRevoking(null)}
          title={t("revokeTitle")}
          footer={
            <>
              <SecondaryButton onClick={() => setRevoking(null)}>{t("cancel")}</SecondaryButton>
              <PrimaryButton
                danger
                disabled={action.isPending}
                onClick={() => void run("revoke", revoking)}
              >
                {t("revoke")}
              </PrimaryButton>
            </>
          }
        >
          <p className="text-sm text-text-2">{t("revokeBody")}</p>
        </FormDialog>
      )}
    </Card>
  );
}
