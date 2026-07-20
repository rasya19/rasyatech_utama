import React, { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import SchoolLogin from './SchoolLogin';
import { 
  LayoutDashboard, Users, BookOpen, Settings, Loader2, School, LogOut,
  FileText, CheckCircle2, AlertTriangle, TrendingUp, ShieldCheck, HelpCircle, BarChart2,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

// High-Fidelity Dinas Government Datasets
const MOCK_DATA_SISWA = [
  { year: '2023', 'Siswa Baru': 3450, 'Total Aktif': 10200 },
  { year: '2024', 'Siswa Baru': 4120, 'Total Aktif': 12150 },
  { year: '2025', 'Siswa Baru': 4890, 'Total Aktif': 14320 },
  { year: '2026', 'Siswa Baru': 5480, 'Total Aktif': 16180 },
];

const MOCK_DATA_SARANA = [
  { name: 'Layak / Baik', value: 68 },
  { name: 'Rusak Ringan', value: 22 },
  { name: 'Rusak Berat', value: 10 },
];
const COLORS_SARANA = ['#10B981', '#F59E0B', '#EF4444'];

const MOCK_DATA_LULUSAN = [
  { year: '2023', 'Kelulusan': 2800, 'Lanjut ke SD': 2520 },
  { year: '2024', 'Kelulusan': 3100, 'Lanjut ke SD': 2850 },
  { year: '2025', 'Kelulusan': 3600, 'Lanjut ke SD': 3420 },
  { year: '2026', 'Kelulusan': 4200, 'Lanjut ke SD': 4050 },
];

const MOCK_DATA_AKREDITASI = [
  { status: 'Akreditasi A', 'Jumlah PAUD': 48 },
  { status: 'Akreditasi B', 'Jumlah PAUD': 76 },
  { status: 'Akreditasi C', 'Jumlah PAUD': 32 },
  { status: 'Belum Akreditasi', 'Jumlah PAUD': 14 },
];

export default function TenantDashboard() {
  const [user, setUser] = useState<any | null>(null);
  const [schoolData, setSchoolData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Check for mock testing session first
    const mockSession = sessionStorage.getItem('siput_mock_session');
    if (mockSession) {
      const parsed = JSON.parse(mockSession);
      setUser(parsed.user);
      setSchoolData(parsed.schoolData);
      const isDinasMail = parsed.user.email?.toLowerCase().includes('dinas') || parsed.schoolData?.role === 'DINAS';
      setActiveTab(isDinasMail ? 'dinas_dashboard' : 'dashboard');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchSchoolData(currentUser.email || undefined);
      } else {
        setLoading(false);
      }
    });

    // Guard: Prevent main domain from accessing tenant admin
    const hostname = window.location.hostname;
    const isMainDomain = hostname.split('.').length < 3 || hostname.startsWith('rasyatech') || hostname.startsWith('www');
    if (isMainDomain) {
      // Redirect handled by app routes but double guard here if needed
    }

    return () => unsubscribe();
  }, []);

  const fetchSchoolData = async (email: string | undefined) => {
    if (!email) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/registrations?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        const singleData = Array.isArray(data) ? data[0] : data;
        if (singleData) {
          setSchoolData(singleData);
          const isDinasMail = email.toLowerCase().includes('dinas') || singleData.role === 'DINAS' || singleData.paket_langganan?.toUpperCase() === 'DINAS';
          if (isDinasMail) {
            setActiveTab('dinas_dashboard');
          }
        }
      }
    } catch (err) {
      console.error("Error fetching school data:", err);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#00BEC4]" /></div>;

  if (!user) return <SchoolLogin />;

  const isDinas = user?.email?.toLowerCase().includes('dinas') || 
                  schoolData?.role === 'DINAS' || 
                  schoolData?.paket_langganan?.toUpperCase() === 'DINAS';

  const role = isDinas ? 'DINAS' : 'SEKOLAH';

  // Debugging Role-State
  console.log('Current Layout Role: ' + role);

  // ----------------------------------------------------
  // GOVERNMENT DINAS PANEL LAYOUT (completely decoupled)
  // ----------------------------------------------------
  if (isDinas) {
    const dinasTabs = [
      { id: 'dinas_dashboard', label: 'Dashboard Analisis', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'dinas_siswa', label: 'Rekapitulasi Murid', icon: <Users className="w-5 h-5" /> },
      { id: 'dinas_sarpras', label: 'Status Sarpras', icon: <School className="w-5 h-5" /> },
      { id: 'dinas_akreditasi', label: 'Akreditasi PAUD', icon: <ShieldCheck className="w-5 h-5" /> },
    ];

    const currentTab = dinasTabs.find(t => t.id === activeTab) || dinasTabs[0];

    return (
      <div className="dinas-container bg-slate-950 text-slate-100 font-sans">
        
        {/* Conditional Sidebar: Dinas Exclusive Sidebar. School sidebar is fully omitted. */}
        <aside className="w-72 flex-shrink-0 bg-slate-900 flex flex-col shadow-2xl border-r border-slate-800/80 h-full z-20">
          
          {/* Dinas Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider text-[#00BEC4] leading-tight">
                SIPUT <span className="text-emerald-400">DINAS</span>
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#475569] block mt-0.5">KAB. KUNINGAN</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
            <nav className="flex flex-col gap-2">
              {dinasTabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all duration-200 text-left ${
                      isActive 
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10 translate-x-1 font-extrabold' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <span className={isActive ? 'text-slate-950' : 'text-emerald-400'}>{tab.icon}</span>
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Goverment Meta info & Actions */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
                <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">Petugas Dinas</p>
                <p className="text-xs font-bold text-slate-200 truncate mt-0.5" title={user.email}>{user.email}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-extrabold uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Sesi Aman Aktif
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => {
                    const mockSession = {
                      user: { email: 'paud_melati@siput.id', id: 'mock-sekolah-id' },
                      schoolData: { id: 'demo-school-id', school_name: 'PAUD Melati Kuningan', subdomain: 'paudmelati', npsn: '20230412', address: 'Jl. Raya Cilimus No. 12, Kuningan' }
                    };
                    sessionStorage.setItem('siput_mock_session', JSON.stringify(mockSession));
                    window.location.reload();
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-[11px] rounded-lg border border-slate-700/60 transition"
                >
                  Beralih ke Portal Sekolah
                </button>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('siput_mock_session');
                    signOut(auth);
                    window.location.reload();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold text-xs rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar Dinas
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Fixing Overflow: Full Width / Height Workspace layout completely insulated */}
        <main className="flex-1 h-full flex flex-col bg-slate-950 overflow-hidden min-w-0">
          
          {/* Header Panel */}
          <header className="bg-slate-900 border-b border-slate-800/85 py-5 px-10 flex justify-between items-center sticky top-0 z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00BEC4]">Dinas Pendidikan & Kebudayaan</span>
              <h1 className="text-xl font-black text-white tracking-tight uppercase">{currentTab.label}</h1>
            </div>

            <div className="bg-slate-950 px-5 py-2.5 rounded-xl border border-slate-800 font-black text-xs text-emerald-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Admin Dinas Kuningan
            </div>
          </header>

          {/* Secure Scrollable Content Body container for Dinas view */}
          <div className="flex-1 p-6 md:p-10 overflow-y-auto w-full max-w-[1600px] mx-auto space-y-8">
            
            {activeTab === 'dinas_dashboard' && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Government Official Intro Banner */}
                <div className="bg-gradient-to-r from-[#0284C7] to-[#0369A1] p-8 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-10 translate-x-12 -translate-y-12">
                    <School className="w-72 h-72" />
                  </div>
                  <div className="relative z-10 space-y-2">
                    <span className="bg-white/15 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">SIPUT - Sistem Informasi PAUD Terpadu</span>
                    <h3 className="text-2xl font-black text-white">Sistem Sinkronisasi Lintas Layanan Kependidikan</h3>
                    <p className="text-slate-100 text-sm max-w-2xl leading-relaxed">Pusat pemantauan dinamika murid, kondisi fasilitas sarana prasarana, kelulusan, serta jaminan akreditasi di wilayah Kabupaten Kuningan secara komprehensif.</p>
                  </div>
                </div>

                {/* Responsive Grid: Graphic displays (2 cols in desktop, 1 col in mobile) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Grafik 1: Penerimaan Siswa Baru */}
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col h-[380px]">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Grafik Perkembangan</span>
                        <h4 className="text-base font-black text-white">Trend Penerimaan Siswa Baru</h4>
                      </div>
                      <Users className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_DATA_SISWA}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                          <XAxis dataKey="year" stroke="#94A3B8" fontSize={11} />
                          <YAxis stroke="#94A3B8" fontSize={11} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '10px' }}
                            labelStyle={{ fontWeight: 'bold', color: '#10B981' }} 
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Siswa Baru" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Total Aktif" fill="#00BEC4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Grafik 2: Kelayakan Sarana Prasarana */}
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col h-[380px]">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Analisis Sarpras</span>
                        <h4 className="text-base font-black text-white">Kelayakan Fisik Gedung Sekolah</h4>
                      </div>
                      <School className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col md:flex-row items-center justify-center gap-6">
                      <div className="w-1/2 h-full min-h-[180px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={MOCK_DATA_SARANA}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {MOCK_DATA_SARANA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_SARANA[index % COLORS_SARANA.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-black text-white">100%</span>
                          <span className="text-[9px] text-slate-400 uppercase">Tinjau Fisik</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 font-semibold text-xs text-slate-300 w-full md:w-auto">
                        {MOCK_DATA_SARANA.map((item, idx) => (
                          <div key={item.name} className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800 min-w-[170px]">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_SARANA[idx] }}></span>
                            <div className="flex-1">
                              <div>{item.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{item.value}% dari total PAUD</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grafik 3: Kelulusan & Melanjutkan ke Sekolah Dasar */}
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col h-[380px]">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Statistik Melanjutkan</span>
                        <h4 className="text-base font-black text-white">Lulusan & Penyerapan Tingkat SD</h4>
                      </div>
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_DATA_LULUSAN}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                          <XAxis dataKey="year" stroke="#94A3B8" fontSize={11} />
                          <YAxis stroke="#94A3B8" fontSize={11} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '10px' }}
                            labelStyle={{ fontWeight: 'bold', color: '#1B9E77' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="Kelulusan" stroke="#10B981" strokeWidth={3} activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="Lanjut ke SD" stroke="#00BEC4" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Grafik 4: Distribusi Akreditasi */}
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col h-[380px]">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase">Akreditasi BAN-SM</span>
                        <h4 className="text-base font-black text-white">Pemetaan Legalitas & Mutu PAUD</h4>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_DATA_AKREDITASI} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                          <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                          <YAxis dataKey="status" type="category" stroke="#94A3B8" fontSize={10} width={100} />
                          <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '10px' }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Jumlah PAUD" fill="#00BEC4" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {activeTab === 'dinas_siswa' && (
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-xl font-black text-white">Tinjauan Kolektif Jumlah Siswa Wilayah</h3>
                  <p className="text-slate-400 text-xs mt-1">Data sinkronisasi murid dari semua dapodik PAUD yang terdaftar di SIPUT.</p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 text-emerald-400 uppercase text-[10px] tracking-wider font-extrabold">
                      <tr>
                        <th className="p-4 border-b border-slate-800">Lembaga Sekolah</th>
                        <th className="p-4 border-b border-slate-800">Nomor NPSN</th>
                        <th className="p-4 border-b border-slate-800">Kecamatan</th>
                        <th className="p-4 border-b border-slate-800">Laki-Laki</th>
                        <th className="p-4 border-b border-slate-800">Perempuan</th>
                        <th className="p-4 border-b border-slate-800 text-white font-extrabold">Total Siswa Terdaftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-semibold text-xs">
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-4">PAUD Melati Kuningan</td>
                        <td className="p-4 text-emerald-400">20230412</td>
                        <td className="p-4">Cilimus</td>
                        <td className="p-4">34 murid</td>
                        <td className="p-4">32 murid</td>
                        <td className="p-4 text-white font-extrabold font-mono">66</td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-4">TK Kartika Kuningan</td>
                        <td className="p-4 text-emerald-400">10293412</td>
                        <td className="p-4">Kuningan Kota</td>
                        <td className="p-4">42 murid</td>
                        <td className="p-4">40 murid</td>
                        <td className="p-4 text-white font-extrabold font-mono">82</td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-4">PAUD Mawar Lestari</td>
                        <td className="p-4 text-emerald-400">10928341</td>
                        <td className="p-4">Jalaksana</td>
                        <td className="p-4">19 murid</td>
                        <td className="p-4">24 murid</td>
                        <td className="p-4 text-white font-extrabold font-mono">43</td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="p-4">KB Armilla Nusa</td>
                        <td className="p-4 text-emerald-400">50823412</td>
                        <td className="p-4">Kuningan Kota</td>
                        <td className="p-4">15 murid</td>
                        <td className="p-4">18 murid</td>
                        <td className="p-4 text-white font-extrabold font-mono">33</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'dinas_sarpras' && (
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-xl font-black text-white">Status Penilaian Sarpras Sekolah</h3>
                  <p className="text-slate-400 text-xs mt-1">Status kelayakan fasilitas berdasarkan survei berkala fisik bangunan dinas setempat.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 border-l-4 border-emerald-500">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Kondisi Layak</span>
                    <h4 className="text-4xl font-black text-emerald-400 mt-2">122 PAUD</h4>
                    <span className="text-[11px] text-slate-400 block mt-2">Fasilitas memadai, ruang kelas aman & berkualitas.</span>
                  </div>
                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 border-l-4 border-amber-500">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Rusak Ringan</span>
                    <h4 className="text-4xl font-black text-amber-500 mt-2">38 PAUD</h4>
                    <span className="text-[11px] text-slate-400 block mt-2">Perbaikan kosmetik ringan, siap dibenahi komite.</span>
                  </div>
                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 border-l-4 border-rose-500">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Rusak Berat / Rehab</span>
                    <h4 className="text-4xl font-black text-rose-500 mt-2">18 PAUD</h4>
                    <span className="text-[11px] text-slate-400 block mt-2">Fasilitas kritis, memperoleh prioritas penyaluran dana DAK.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dinas_akreditasi' && (
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-xl font-black text-white">Distribusi Penilaian Akreditasi Mutu Lembaga</h3>
                  <p className="text-slate-400 text-xs mt-1">Audit berkala dari BAN-PAUD untuk menjamin legalitas proses bimbingan belajar.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-3xl font-black text-emerald-400 block">A</span>
                    <span className="text-xs text-slate-300 block mt-2 font-bold uppercase tracking-wide">48 PAUD Terakreditasi</span>
                  </div>
                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-3xl font-black text-sky-400 block">B</span>
                    <span className="text-xs text-slate-300 block mt-2 font-bold uppercase tracking-wide">76 PAUD Terakreditasi</span>
                  </div>
                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-3xl font-black text-amber-500 block">C</span>
                    <span className="text-xs text-slate-300 block mt-2 font-bold uppercase tracking-wide">32 PAUD Terakreditasi</span>
                  </div>
                  <div className="p-6 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-3xl font-black text-rose-500 block">N/A</span>
                    <span className="text-xs text-slate-300 block mt-2 font-bold uppercase tracking-wide">14 PAUD Belum Akreditasi</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    );
  }

  // ----------------------------------------------------
  // STANDARD SCHOOL PORTAL LAYOUT (navy #0B2447 themed)
  // ----------------------------------------------------
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'profile', label: 'Profil Sekolah', icon: <Settings className="w-5 h-5" /> },
    { id: 'learning', label: 'Pembelajaran', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex">
      {/* Premium Sidebar with Midnight Blue `#0B2447` */}
      {role === 'DINAS' ? null : (
        <aside id="tenant-sidebar" className="w-72 flex-shrink-0 bg-[#0B2447] flex flex-col shadow-2xl z-20">
          
          {/* Sidebar Header with Brushed Metal and Silver Steel texture */}
          <div id="sidebar-header" className="brushed-metal p-6 flex flex-col items-center justify-center border-b border-white/10 relative">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 bg-[#0b2447] rounded-xl flex items-center justify-center text-[#00BEC4] shadow-md border border-white/20">
                <School className="w-6 h-6" />
              </div>
              <div>
                <h2 id="sidebar-logo-text" className="text-lg font-black tracking-tight text-[#0B2447] leading-none flex items-center gap-1">
                  Rasya<span className="text-[#00BEC4]">Tech</span>
                </h2>
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#475569] block mt-1">School Portal</span>
              </div>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <nav className="flex flex-col gap-2">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    id={`tab-btn-${tab.id}`}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all duration-200 text-left ${
                      isActive 
                        ? 'bg-[#00BEC4] text-[#0B2447] shadow-lg shadow-[#00BEC4]/20 translate-x-1' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className={isActive ? 'text-[#0B2447]' : 'text-[#00BEC4]'}>{tab.icon}</span>
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer Account Action */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="px-3">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Logged in as</p>
                <p className="text-xs font-bold text-white truncate mt-0.5">{user.email}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => {
                    const mockSession = {
                      user: { email: 'dinas@kuningan.go.id', id: 'mock-dinas-id' },
                      schoolData: { school_name: 'Dinas Pendidikan Kab. Kuningan', role: 'DINAS', subdomain: 'dinas' }
                    };
                    sessionStorage.setItem('siput_mock_session', JSON.stringify(mockSession));
                    window.location.reload();
                  }}
                  className="w-full py-2 bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-[11px] rounded-lg transition"
                >
                  Beralih ke Portal Dinas
                </button>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('siput_mock_session');
                    signOut(auth);
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5 text-rose-400" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Main Workspace Frame */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Workspace Top Header */}
        <header className="bg-white border-b border-slate-200/80 py-6 px-10 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h1 className="text-2xl font-black text-[#0B2447] tracking-tight truncate capitalize">{tabs.find(t => t.id === activeTab)?.label}</h1>
          <div className="bg-[#f8fafc] px-6 py-3 rounded-2xl border border-slate-100 shadow-sm font-bold text-[#0B2447] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] animate-pulse"></span>
            {schoolData?.school_name || 'Sekolah'}
          </div>
        </header>

        {/* Content Body Container */}
        <div className="flex-1 p-10 overflow-y-auto">
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-sm min-h-[550px]">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-[#0B2447] to-[#153a6e] text-white p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-extrabold mb-1">Selamat datang kembali!</h3>
                    <p className="text-cyan-100 text-sm">Kelola proses belajar-mengajar Anda dengan mudah dan efektif di portal RasyaTech.</p>
                  </div>
                  <div className="px-5 py-2.5 bg-white/10 rounded-xl border border-white/10 text-xs font-black tracking-wide">
                    {schoolData?.subdomain || 'demo'}.rsch.my.id
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stats Cards - White with micro border, floating shadow */}
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 group">
                    <div className="text-[#00BEC4] font-black tracking-wider text-xs uppercase mb-1">Total Siswa</div>
                    <div className="text-4xl font-black text-[#0B2447]">0</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-3">Tidak ada catatan siswa terdaftar.</div>
                  </div>
                  
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 group">
                    <div className="text-[#14B8A6] font-black tracking-wider text-xs uppercase mb-1">Total Guru</div>
                    <div className="text-4xl font-black text-[#0B2447]">0</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-3">Belum ada akun guru terdaftar.</div>
                  </div>

                  <div className="p-6 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 group">
                    <div className="text-amber-500 font-black tracking-wider text-xs uppercase mb-1">Materi Aktif</div>
                    <div className="text-4xl font-black text-[#0B2447]">0</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-3">Sistem pengajaran siap digunakan.</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-black text-[#0B2447]">Data Profil Sekolah</h3>
                </div>
                
                <div className="bg-[#f8fafc] p-8 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6 border border-slate-200/50">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Nama Instansi Sekolah</label>
                    <input className="w-full p-4 mt-2 bg-white rounded-xl font-bold border border-slate-200 text-[#0B2447] focus:outline-none focus:ring-2 focus:ring-[#00BEC4]" defaultValue={schoolData?.school_name} />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Nomor NPSN</label>
                    <input className="w-full p-4 mt-2 bg-white rounded-xl font-bold border border-slate-200 text-[#0B2447] focus:outline-none focus:ring-2 focus:ring-[#00BEC4]" defaultValue={schoolData?.npsn} />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Alamat Lengkap</label>
                    <textarea className="w-full p-4 mt-2 bg-white rounded-xl font-bold border border-slate-200 text-[#0B2447] focus:outline-none focus:ring-2 focus:ring-[#00BEC4] h-24" defaultValue={schoolData?.address} />
                  </div>
                </div>
                
                <button className="px-10 py-4 bg-[#00BEC4] text-[#0B2447] font-extrabold rounded-xl transition-all duration-200 hover:bg-[#14B8A6] shadow-lg shadow-[#00BEC4]/20">
                  Simpan Perubahan
                </button>
              </div>
            )}

            {activeTab === 'learning' && (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl p-10 bg-slate-50/50">
                <BookOpen className="w-16 h-16 text-[#00BEC4] mb-4" />
                <h4 className="text-xl font-extrabold text-[#0B2447] mb-1">Materi & Tugas Digital</h4>
                <p className="text-slate-500 font-medium max-w-md">LMS terpadu (Modul materi, penugasan offline-online, rekapitulasi nilai) sedang dalam tahap finalisasi rilis.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
