import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "tyozxtar@gmail.com";

type AuthenticatedContext = {
  claims: unknown;
  userId: string;
  supabase: {
    auth: {
      getUser: () => Promise<{
        data: { user: { email?: string | null } | null };
        error: unknown;
      }>;
    };
  };
};

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () =>
    Array.from({ length: 4 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  return `MV-${block()}-${block()}`;
}

function getClaimEmail(claims: unknown) {
  if (!claims || typeof claims !== "object") return "";
  const email = (claims as { email?: unknown }).email;
  return typeof email === "string" ? email.toLowerCase() : "";
}

async function getAuthenticatedEmail(context: AuthenticatedContext) {
  const claimEmail = getClaimEmail(context.claims);
  if (claimEmail) return claimEmail;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(context.userId);
  if (error) throw new Error("Unauthorized: Invalid user session");
  return data.user?.email?.toLowerCase() ?? "";
}

async function assertAdmin(context: AuthenticatedContext) {
  const email = await getAuthenticatedEmail(context);
  if (email !== ADMIN_EMAIL) {
    throw new Error("FORBIDDEN");
  }
  return email;
}

export type PackageType = "monthly" | "yearly" | "yearly_vip";

const PACKAGE_TYPES: PackageType[] = ["monthly", "yearly", "yearly_vip"];

export const PLAN_CREDITS: Record<PackageType, number> = {
  monthly: 200,
  yearly: 250,
  yearly_vip: 400,
};

export const generateVouchersFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { quantity: number; packageType: PackageType }) => {
      const quantity = Math.max(1, Math.min(100, Math.floor(input.quantity)));
      const packageType: PackageType = PACKAGE_TYPES.includes(input.packageType)
        ? input.packageType
        : "monthly";
      return { quantity, packageType };
    },
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthenticatedContext);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const rows = Array.from({ length: data.quantity }, () => ({
      code: randomCode(),
      package_type: data.packageType,
    }));

    const { data: inserted, error } = await supabaseAdmin
      .from("vouchers")
      .insert(rows)
      .select("id, code, package_type, is_used, created_at");

    if (error) throw new Error(error.message);
    return inserted ?? [];
  });


export const listVouchersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as AuthenticatedContext);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("vouchers")
      .select("id, code, package_type, is_used, used_by, used_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const checkIsAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = await getAuthenticatedEmail(context as AuthenticatedContext);
    return { isAdmin: email === ADMIN_EMAIL, email: email ?? null };
  });

export const listSubscribersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as AuthenticatedContext);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Get active premium profiles
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, is_premium, premium_until")
      .eq("is_premium", true)
      .gt("premium_until", new Date().toISOString())
      .order("premium_until", { ascending: true });
    if (pErr) throw new Error(pErr.message);

    // Determine package via most recent used voucher per user
    const ids = (profiles ?? []).map((p) => p.id);
    let pkgMap = new Map<string, "monthly" | "yearly">();
    if (ids.length) {
      const { data: vs, error: vErr } = await supabaseAdmin
        .from("vouchers")
        .select("used_by, package_type, used_at")
        .in("used_by", ids)
        .order("used_at", { ascending: false });
      if (vErr) throw new Error(vErr.message);
      for (const v of vs ?? []) {
        if (v.used_by && !pkgMap.has(v.used_by)) {
          pkgMap.set(v.used_by, v.package_type as "monthly" | "yearly");
        }
      }
    }

    return (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      display_name: p.display_name,
      premium_until: p.premium_until,
      package_type: pkgMap.get(p.id) ?? "monthly",
    }));
  });
