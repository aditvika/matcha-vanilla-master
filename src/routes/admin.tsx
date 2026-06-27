import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, RefreshCw, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  generateVouchersFn,
  listVouchersFn,
  checkIsAdminFn,
} from "@/lib/admin-vouchers";
import { useSupabaseSession } from "@/hooks/use-supabase-session";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — Matcha Vanilla Production" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const { session, loading } = useSupabaseSession();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [quantity, setQuantity] = useState(5);
  const [packageType, setPackageType] = useState<"monthly" | "yearly">("monthly");
  const qc = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({ to: "/auth" });
      return;
    }
    checkIsAdminFn()
      .then((res) => {
        if (!res.isAdmin) {
          toast.error("Access denied");
          navigate({ to: "/home" });
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        navigate({ to: "/home" });
      });
  }, [loading, session, navigate]);

  const vouchersQuery = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: () => listVouchersFn(),
    enabled: authorized === true,
  });

  const genMutation = useMutation({
    mutationFn: (input: { quantity: number; packageType: "monthly" | "yearly" }) =>
      generateVouchersFn({ data: input }),
    onSuccess: (rows) => {
      toast.success(`Generated ${rows.length} voucher(s)`);
      qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const copy = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success(`Copied ${code}`));
  }, []);

  if (loading || authorized === null) {
    return (
      <main className="home-root">
        <div className="home-content">
          <p style={{ color: "white", padding: 24 }}>Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="home-root">
      <div className="home-glow home-glow-green" aria-hidden />
      <div className="home-content home-fade-in">
        <header className="home-header">
          <Link to="/settings" className="home-icon-btn" aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <p className="home-greet-eyebrow">
              <Shield size={12} style={{ display: "inline", marginRight: 4 }} />
              Admin
            </p>
            <h1 className="home-greet">Voucher Dashboard</h1>
          </div>
        </header>

        <section className="home-section">
          <h2 className="home-section-title">Generate Vouchers</h2>
          <div className="admin-gen-card">
            <label className="admin-field">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </label>
            <label className="admin-field">
              <span>Package</span>
              <select
                value={packageType}
                onChange={(e) =>
                  setPackageType(e.target.value as "monthly" | "yearly")
                }
              >
                <option value="monthly">Monthly (30 days)</option>
                <option value="yearly">Yearly (365 days)</option>
              </select>
            </label>
            <button
              type="button"
              className="admin-generate-btn"
              onClick={() => genMutation.mutate({ quantity, packageType })}
              disabled={genMutation.isPending}
            >
              <Plus size={16} />
              <span>{genMutation.isPending ? "Generating…" : "Generate"}</span>
            </button>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <h2 className="home-section-title">All Vouchers</h2>
            <button
              type="button"
              className="home-section-more"
              onClick={() => vouchersQuery.refetch()}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vouchersQuery.data?.map((v) => (
                  <tr key={v.id}>
                    <td className="admin-code">{v.code}</td>
                    <td>
                      <span className={`admin-pkg admin-pkg-${v.package_type}`}>
                        {v.package_type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-status ${v.is_used ? "admin-status-used" : "admin-status-unused"}`}
                      >
                        {v.is_used ? "Used" : "Unused"}
                      </span>
                    </td>
                    <td className="admin-muted">
                      {new Date(v.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {!v.is_used && (
                        <button
                          type="button"
                          className="admin-copy-btn"
                          onClick={() => copy(v.code)}
                          aria-label="Copy"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!vouchersQuery.isLoading && !vouchersQuery.data?.length && (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      No vouchers yet. Generate some above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
