export type LeaderTab = "Bulanan" | "Tahunan" | "Mix";
export type LeaderEntry = { name: string; tier: LeaderTab; mvp: number };

export const leaderboardFull: Record<LeaderTab, LeaderEntry[]> = {
  Bulanan: [
    { name: "Ahmad_Zain", tier: "Bulanan", mvp: 12 },
    { name: "Siti_Rahma", tier: "Bulanan", mvp: 9 },
    { name: "Rizky_Alif", tier: "Bulanan", mvp: 6 },
    { name: "Dewi_Lestari", tier: "Bulanan", mvp: 5 },
    { name: "Fajar_Maulana", tier: "Bulanan", mvp: 4 },
    { name: "Anisa_Putri", tier: "Bulanan", mvp: 4 },
    { name: "Bagus_Pratama", tier: "Bulanan", mvp: 3 },
    { name: "Citra_Ayu", tier: "Bulanan", mvp: 3 },
    { name: "Dimas_Aditya", tier: "Bulanan", mvp: 3 },
    { name: "Eka_Wulandari", tier: "Bulanan", mvp: 2 },
    { name: "Galang_Reza", tier: "Bulanan", mvp: 2 },
    { name: "Hana_Safira", tier: "Bulanan", mvp: 2 },
    { name: "Iqbal_Hakim", tier: "Bulanan", mvp: 2 },
    { name: "Jihan_Aulia", tier: "Bulanan", mvp: 2 },
    { name: "Krisna_Bayu", tier: "Bulanan", mvp: 1 },
    { name: "Lina_Marlina", tier: "Bulanan", mvp: 1 },
    { name: "Maulana_Yusuf", tier: "Bulanan", mvp: 1 },
    { name: "Nadya_Kirana", tier: "Bulanan", mvp: 1 },
    { name: "Oka_Wirawan", tier: "Bulanan", mvp: 1 },
    { name: "Putra_Sanjaya", tier: "Bulanan", mvp: 1 },
  ],
  Tahunan: [
    { name: "Adityo Saputra", tier: "Tahunan", mvp: 7 },
    { name: "Vika Adellya", tier: "Tahunan", mvp: 5 },
    { name: "Hayabusa", tier: "Tahunan", mvp: 2 },
    { name: "Rendra_Wicaksono", tier: "Tahunan", mvp: 2 },
    { name: "Tania_Kusuma", tier: "Tahunan", mvp: 2 },
    { name: "Yoga_Pranata", tier: "Tahunan", mvp: 1 },
    { name: "Salsa_Bilqis", tier: "Tahunan", mvp: 1 },
    { name: "Bima_Arya", tier: "Tahunan", mvp: 1 },
    { name: "Kirana_Maharani", tier: "Tahunan", mvp: 1 },
    { name: "Daffa_Ramadhan", tier: "Tahunan", mvp: 1 },
    { name: "Larasati_Indah", tier: "Tahunan", mvp: 1 },
    { name: "Naufal_Hakim", tier: "Tahunan", mvp: 1 },
    { name: "Rara_Sekar", tier: "Tahunan", mvp: 1 },
    { name: "Yusuf_Ibrahim", tier: "Tahunan", mvp: 1 },
    { name: "Mega_Wati", tier: "Tahunan", mvp: 1 },
    { name: "Ferdi_Setiawan", tier: "Tahunan", mvp: 1 },
    { name: "Intan_Permata", tier: "Tahunan", mvp: 1 },
    { name: "Reza_Arkana", tier: "Tahunan", mvp: 1 },
    { name: "Sasha_Olivia", tier: "Tahunan", mvp: 1 },
    { name: "Wahyu_Nugraha", tier: "Tahunan", mvp: 1 },
  ],
  Mix: [
    { name: "Kevin_San", tier: "Mix", mvp: 15 },
    { name: "Putri_Utami", tier: "Mix", mvp: 11 },
    { name: "Budi_Gaming", tier: "Mix", mvp: 8 },
    { name: "Maya_Anggraini", tier: "Mix", mvp: 7 },
    { name: "Arif_Hidayat", tier: "Mix", mvp: 6 },
    { name: "Sinta_Ramadhani", tier: "Mix", mvp: 5 },
    { name: "Joko_Susanto", tier: "Mix", mvp: 5 },
    { name: "Wulan_Sari", tier: "Mix", mvp: 4 },
    { name: "Toni_Pratomo", tier: "Mix", mvp: 4 },
    { name: "Mira_Cahyani", tier: "Mix", mvp: 4 },
    { name: "Andre_Kurniawan", tier: "Mix", mvp: 3 },
    { name: "Bella_Anindita", tier: "Mix", mvp: 3 },
    { name: "Cahyo_Wibowo", tier: "Mix", mvp: 3 },
    { name: "Diana_Safitri", tier: "Mix", mvp: 2 },
    { name: "Erik_Sanjaya", tier: "Mix", mvp: 2 },
    { name: "Fina_Oktaviani", tier: "Mix", mvp: 2 },
    { name: "Gilang_Permadi", tier: "Mix", mvp: 2 },
    { name: "Hesti_Larasati", tier: "Mix", mvp: 1 },
    { name: "Ivan_Mahendra", tier: "Mix", mvp: 1 },
    { name: "Juwita_Sari", tier: "Mix", mvp: 1 },
  ],
};

export function getInitials(name: string) {
  return name
    .replace(/[_\s]+/g, " ")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
