import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function PremiumModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="premium-modal-content">
        <DialogHeader>
          <DialogTitle className="premium-modal-title">Fitur Premium MVMaster</DialogTitle>
          <DialogDescription className="premium-modal-desc" asChild>
            <div>
              <p className="premium-modal-line">Halo Teman-teman Kreatif! ✨</p>

              <p className="premium-modal-line">
                Pertama-tama, terima kasih banyak sudah mendukung dan memercayakan kebutuhan HD foto/video kamu di MVMaster.
              </p>

              <p className="premium-modal-line">
                Perlu diketahui, saat ini aplikasi MVMaster masih berada dalam tahap awal rilis{" "}
                <strong>(Early Stage)</strong>. Kami berkomitmen penuh untuk selalu memberikan hasil up-scaling AI yang{" "}
                <strong>nyata, jujur, dan berkualitas tinggi</strong> tanpa iming-iming palsu.
              </p>

              <p className="premium-modal-line">
                Karena proses AI HD ini membutuhkan komputasi awan (cloud server) yang murni online dan memakan biaya
                operasional mandiri, untuk saat ini akun Premium terpaksa kami batasi dengan sistem kuota berkala{" "}
                <strong>(FUP)</strong> demi menjaga kestabilan server agar tidak jebol dan performanya tetap adil bagi
                semua pengguna.
              </p>

              <ul className="premium-modal-list">
                <li>
                  <strong>Paket Bulanan:</strong> Akses Premium dengan kuota aman maksimal{" "}
                  <strong>50 foto &amp; 15 video per minggu</strong> (reset otomatis tiap minggu sesuai masa aktif).
                </li>
                <li>
                  <strong>Paket Tahunan:</strong> Akses Premium dengan kuota aman maksimal{" "}
                  <strong>150 foto &amp; 30 video per bulan</strong> (reset otomatis tiap bulan).
                </li>
              </ul>

              <p className="premium-modal-line">
                Kami sangat mengharapkan pemahaman dan kerja sama dari teman-teman semua. Setiap rupiah yang kamu
                keluarkan untuk langganan saat ini akan langsung diputar kembali untuk upgrade kapasitas server yang
                lebih besar, perbaikan bug, serta penambahan fitur-fitur baru ke depannya sesuai request kalian.
              </p>

              <p className="premium-modal-line">
                Mari kita bangun MVMaster menjadi aplikasi yang lebih sempurna sama-sama! 🚀
              </p>

              <p className="premium-modal-signature">— Adityo Saputra (Developer MVMaster)</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            type="button"
            className="premium-modal-btn"
            onClick={() => onOpenChange(false)}
          >
            Saya Mengerti
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
