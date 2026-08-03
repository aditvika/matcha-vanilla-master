import { createServerFn } from "@tanstack/react-start";

/**
 * Returns whether an account exists for the given email.
 * Used only to give a friendly "Account not found" message on sign-in failure.
 */
export const emailExists = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => ({
    email: String(data?.email ?? "").trim().toLowerCase(),
  }))
  .handler(async ({ data }) => {
    if (!data.email) return { exists: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) return { exists: true };
    return {
      exists: result.users.some((u) => (u.email ?? "").toLowerCase() === data.email),
    };
  });
