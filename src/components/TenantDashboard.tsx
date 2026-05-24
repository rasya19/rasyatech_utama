import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SchoolLogin from './SchoolLogin';
import TeachersTable from './TeachersTable';
import StudentsTable from './StudentsTable';
import { LayoutDashboard, Users, BookOpen, Settings, Loader2, School, LogOut } from 'lucide-react';

export default function TenantDashboard() {
  const [user, setUser] = useState<any | null>(null);
  const [schoolData, setSchoolData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSchoolData(session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSchoolData(session.user.email);
      }
    });

    // Guard: Prevent main domain from accessing tenant admin
    const hostname = window.location.hostname;
    const isMainDomain = hostname.split('.').length < 3 || hostname.startsWith('rasyatech') || hostname.startsWith('www');
    if (isMainDomain) {
      window.location.href = '/master-admin';
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchSchoolData = async (email: string | undefined) => {
    if (!email) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('admin_email', email)
      .single();
    
    if (data) setSchoolData(data);
    setLoading(false);
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#00BEC4]" /></div>;

  if (!user) return <SchoolLogin />;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'profile', label: 'Profil Sekolah', icon: <Settings className="w-5 h-5" /> },
    { id: 'academic', label: 'Manajemen Akademik', icon: <Users className="w-5 h-5" /> },
    { id: 'learning', label: 'Pembelajaran', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex">
      {/* Premium Sidebar with Midnight Blue `#0B2447` */}
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
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 text-rose-400" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

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
                    {schoolData?.subdomain}.rsch.my.id
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

            {activeTab === 'academic' && schoolData?.id ? (
              <div className="space-y-8">
                <TeachersTable schoolId={schoolData.id} />
                <StudentsTable schoolId={schoolData.id} />
              </div>
            ) : activeTab === 'academic' && (
              <p className="text-slate-500 font-bold">Data sekolah belum terkonfigurasi dengan lengkap.</p>
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
