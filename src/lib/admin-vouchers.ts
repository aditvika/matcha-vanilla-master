import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_EMAIL = "tyozxtar@gmail.com";

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () =>
    Array.from({ length: 4 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  return `MV-${block()}-${block()}`;
}

function assertAdmin(claims: { email?: string } | Record<string, unknown>) {
  const email = (claims as { email?: string }).email?.toLowerCase();
  if (email !== ADMIN_EMAIL) {
    throw new Error("FORBIDDEN");
  }
}

export const generateVouchersFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { quantity: number; packageType: "monthly" | "yearly" }) => {
      const quantity = Math.max(1, Math.min(100, Math.floor(input.quantity)));
      const packageType =
        input.packageType === "yearly" ? "yearly" : "monthly";
      return { quantity, packageType };
    },
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    assertAdmin(context.claims as { email?: string });
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
    assertAdmin(context.claims as { email?: string });
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
    const email = (context.claims as { email?: string }).email?.toLowerCase();
    return { isAdmin: email === ADMIN_EMAIL, email: email ?? null };
  });
