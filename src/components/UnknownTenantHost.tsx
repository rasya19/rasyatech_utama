/** Halaman error untuk hostname tenant yang tidak dikenali / tidak ada di database. */
export default function UnknownTenantHost() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-200 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[#151C30] border border-slate-800 rounded-3xl p-10 text-center shadow-2xl">
        <p className="text-6xl font-black text-rose-500 mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-3">Tenant Tidak Ditemukan</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Hostname <span className="text-white font-mono">{hostname}</span> tidak terdaftar di
          ekosistem Rasyatech atau subdomain belum aktif.
        </p>
        <p className="text-slate-500 text-xs mb-8">
          Periksa penulisan URL tenant Anda, atau hubungi support jika pendaftaran sudah disetujui.
        </p>
        <a
          href="https://rasyatech.com"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-sm"
        >
          Kembali ke Beranda Rasyatech
        </a>
      </div>
    </div>
  );
}
