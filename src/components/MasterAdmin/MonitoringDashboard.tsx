import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Printer, 
  Filter, 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle, 
  Wrench, 
  Building, 
  Activity, 
  Calendar,
  Plus,
  Trash2,
  Download,
  FileSpreadsheet
} from 'lucide-react';

// Define Interface for Ticket Complaint
interface ComplaintTicket {
  id: string;
  source: 'SIPUT' | 'LMS_ARMILLA';
  school_name: string;
  subdistrict: string; // Kecamatan
  description: string;
  status: 'draft' | 'review' | 'solved'; // draft: Tiket Masuk, review: Sedang Diperbaiki, solved: Selesai
  created_at: string;
  reporter_name?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Initial High-Fidelity Regional Demo Data to mimic real synced databases for SIPUT & Rasya LMS
const INITIAL_TICKETS: ComplaintTicket[] = [
  {
    id: 'TKT-001',
    source: 'SIPUT',
    school_name: 'SDN Cilincing 01',
    subdistrict: 'Cilincing',
    description: 'Aplikasi SIPUT tidak mencetak kartu ujian pascasiswa baru, muncul error server internal.',
    status: 'draft',
    created_at: '2026-05-28T02:15:00Z',
    reporter_name: 'Ahmad Subardjo',
    priority: 'high'
  },
  {
    id: 'TKT-002',
    source: 'LMS_ARMILLA',
    school_name: 'PKBM Armilla Nusa',
    subdistrict: 'Koja',
    description: 'Modul materi matematika kelas 12 tidak muncul di halaman siswa, mohon sinkronisasi ulang paket kurikulum.',
    status: 'draft',
    created_at: '2026-05-27T10:30:00Z',
    reporter_name: 'Siti Rahmawati',
    priority: 'medium'
  },
  {
    id: 'TKT-003',
    source: 'SIPUT',
    school_name: 'SMPN Tanjung Priok 14',
    subdistrict: 'Tanjung Priok',
    description: 'Data absensi presensi harian SIPUT sinkronisasi gagal di portal Dinas, mohon diperbaiki API integrasi data.',
    status: 'review',
    created_at: '2026-05-26T08:45:00Z',
    reporter_name: 'Heri Kiswanto',
    priority: 'high'
  },
  {
    id: 'TKT-004',
    source: 'LMS_ARMILLA',
    school_name: 'PKBM Harapan Bangsa',
    subdistrict: 'Kelapa Gading',
    description: 'Siswa mengalami kendala saat upload tugas akhir di LMS, ukuran file 5MB dibatasi.',
    status: 'review',
    created_at: '2026-05-25T14:20:00Z',
    reporter_name: 'Budi Santoso',
    priority: 'low'
  },
  {
    id: 'TKT-005',
    source: 'SIPUT',
    school_name: 'SDN Pademangan 03',
    subdistrict: 'Pademangan',
    description: 'Laporan kelulusan siswa PPDB SIPUT tidak memuat foto profil, sudah teratasi setelah refresh CDN.',
    status: 'solved',
    created_at: '2026-05-24T09:00:00Z',
    reporter_name: 'Dewi Lestari',
    priority: 'medium'
  },
  {
    id: 'TKT-006',
    source: 'LMS_ARMILLA',
    school_name: 'PKBM Armilla Sejahtera',
    subdistrict: 'Penjaringan',
    description: 'Reset password admin sekolah lms tidak bekerja, sudah di-override manual oleh master admin.',
    status: 'solved',
    created_at: '2026-05-23T11:10:00Z',
    reporter_name: 'Ismanto (Admin)',
    priority: 'high'
  }
];

// List of subdistricts (Kecamatan) in North Jakarta / regions
const KECAMATAN_LIST = [
  'Cilincing',
  'Koja',
  'Kelapa Gading',
  'Tanjung Priok',
  'Pademangan',
  'Penjaringan'
];

export default function MonitoringDashboard() {
  const [tickets, setTickets] = useState<ComplaintTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubdistrict, setFilterSubdistrict] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  
  // Modals / Print views / New Ticket Forms
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    source: 'SIPUT' as const,
    school_name: '',
    subdistrict: 'Cilincing',
    description: '',
    reporter_name: '',
    priority: 'medium' as const
  });

  // Load from LocalStorage or initialize with high-fidelity realistic data
  useEffect(() => {
    const cached = localStorage.getItem('rasyatech_central_complaints');
    if (cached) {
      try {
        setTickets(JSON.parse(cached));
      } catch (e) {
        setTickets(INITIAL_TICKETS);
      }
    } else {
      setTickets(INITIAL_TICKETS);
      localStorage.setItem('rasyatech_central_complaints', JSON.stringify(INITIAL_TICKETS));
    }
  }, []);

  const saveTickets = (updated: ComplaintTicket[]) => {
    setTickets(updated);
    localStorage.setItem('rasyatech_central_complaints', JSON.stringify(updated));
  };

  // Move Ticket logic for Kanban board
  const moveTicket = (id: string, direction: 'forward' | 'backward') => {
    const statusOrder: ComplaintTicket['status'][] = ['draft', 'review', 'solved'];
    const updated = tickets.map(ticket => {
      if (ticket.id === id) {
        const currentIndex = statusOrder.indexOf(ticket.status);
        let nextIndex = currentIndex;
        if (direction === 'forward' && currentIndex < statusOrder.length - 1) {
          nextIndex = currentIndex + 1;
        } else if (direction === 'backward' && currentIndex > 0) {
          nextIndex = currentIndex - 1;
        }
        return { ...ticket, status: statusOrder[nextIndex] };
      }
      return ticket;
    });
    saveTickets(updated);
  };

  const deleteTicket = (id: string) => {
    if (window.confirm(`Hapus tiket keluhan ${id}?`)) {
      const updated = tickets.filter(t => t.id !== id);
      saveTickets(updated);
    }
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.school_name.trim() || !newTicket.description.trim()) {
      alert('Mohon isi nama lembaga dan deskripsi kendala.');
      return;
    }

    const tktCode = `TKT-${Math.floor(100 + Math.random() * 900)}`;
    const ticketToAdd: ComplaintTicket = {
      id: tktCode,
      source: newTicket.source,
      school_name: newTicket.school_name,
      subdistrict: newTicket.subdistrict,
      description: newTicket.description,
      status: 'draft',
      created_at: new Date().toISOString(),
      reporter_name: newTicket.reporter_name || 'Staff Sekolah',
      priority: newTicket.priority
    };

    const updated = [ticketToAdd, ...tickets];
    saveTickets(updated);
    
    // Reset state & close modal
    setNewTicket({
      source: 'SIPUT',
      school_name: '',
      subdistrict: 'Cilincing',
      description: '',
      reporter_name: '',
      priority: 'medium'
    });
    setIsAddModalOpen(false);
  };

  // Filter & Search computation
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.reporter_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubdistrict = filterSubdistrict === 'all' || t.subdistrict === filterSubdistrict;
    const matchesSource = filterSource === 'all' || t.source === filterSource;

    return matchesSearch && matchesSubdistrict && matchesSource;
  });

  // Calculate statistics
  const countDraft = tickets.filter(t => t.status === 'draft').length;
  const countReview = tickets.filter(t => t.status === 'review').length;
  const countSolved = tickets.filter(t => t.status === 'solved').length;

  const getSourceBadgeColor = (source: 'SIPUT' | 'LMS_ARMILLA') => {
    if (source === 'SIPUT') {
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  };

  const getSourceLabel = (source: 'SIPUT' | 'LMS_ARMILLA') => {
    return source === 'SIPUT' ? 'SIPUT 📱' : 'LMS Armilla 💻';
  };

  const getPriorityBadge = (p?: 'low' | 'medium' | 'high') => {
    switch (p) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">CRITICAL</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-500/20 text-slate-300 border border-slate-500/30 uppercase">LOW</span>;
    }
  };

  // Clear demo reset handler
  const resetToDemo = () => {
    if (window.confirm('Kelbalikan semua data monitoring ke pengaturan demo pabrikan daerah Rasyatech?')) {
      saveTickets(INITIAL_TICKETS);
    }
  };

  // If in pure Dinas Print Mode, output clean formal layout optimized for black and white print to PDF
  if (isPrintMode) {
    return (
      <div className="p-12 bg-white text-black min-h-screen font-serif" id="print-area">
        <div className="flex justify-between items-start border-b-4 border-black pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center font-bold text-2xl">
              RT
            </div>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">RASYATECH CO.</h1>
              <p className="text-xs text-slate-600 font-sans font-bold">Infrastruktur & Layanan Teknologi Pendidikan Terpadu</p>
              <p className="text-[10px] text-slate-500 font-sans">Jl. Raya Pelabuhan No. 12, Jakarta Telp: (021) 43900xx Email: admin@rsch.my.id</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold border border-black px-4 py-2 uppercase bg-slate-100">Laporan Resmi</h2>
            <p className="text-xs mt-1 font-sans font-bold">Format: Dinas Pendidikan / Instansi Daerah</p>
            <p className="text-xs font-sans">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase underline">LAPORAN MONITORING KELUHAN TEKNOLOGI PENDIDIKAN REGIONAL</h2>
          <p className="text-sm font-sans mt-1">
            Status Operasional Penanganan Tiket Gangguan Sistem SIPUT & Rasya LMS PKBM
          </p>
          <div className="flex justify-center gap-6 mt-4 font-sans text-xs">
            <span>Kecamatan: <strong>{filterSubdistrict === 'all' ? 'SEMUA WILAYAH' : `KEC. ${filterSubdistrict.toUpperCase()}`}</strong></span>
            <span>•</span>
            <span>Produk: <strong>{filterSource === 'all' ? 'SEMUA PROGRAM' : filterSource}</strong></span>
            <span>•</span>
            <span>Total Keluhan: <strong>{filteredTickets.length} Tiket</strong></span>
          </div>
        </div>

        {/* Static Formal Table */}
        <table className="w-full text-left border-collapse border border-black text-xs font-sans">
          <thead>
            <tr className="bg-slate-200 border-b border-black text-xs font-black">
              <th className="border-r border-black p-3 text-center w-12">No.</th>
              <th className="border-r border-black p-3 w-20">ID Tiket</th>
              <th className="border-r border-black p-3 w-40">Lembaga / Sekolah</th>
              <th className="border-r border-black p-3 w-32">Kecamatan</th>
              <th className="border-r border-black p-3 w-32">Asal Aplikasi</th>
              <th className="border-r border-black p-3">Rincian Kendala / Masalah Utama</th>
              <th className="border-r border-black p-3 w-32 text-center">Status Kerja</th>
              <th className="p-3 w-28 text-center">Prioritas</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 italic border border-black">
                  Tidak ditemukan record data keluhan aktif yang sesuai dengan filter wilayah atau aplikasi ini.
                </td>
              </tr>
            ) : (
              filteredTickets.map((t, idx) => (
                <tr key={t.id} className="border-b border-black hover:bg-slate-50">
                  <td className="border-r border-black p-3 text-center">{idx + 1}</td>
                  <td className="border-r border-black p-3 font-mono font-bold">{t.id}</td>
                  <td className="border-r border-black p-3 font-semibold">{t.school_name}</td>
                  <td className="border-r border-black p-3">{t.subdistrict}</td>
                  <td className="border-r border-black p-3">
                    {t.source === 'SIPUT' ? 'SIPUT (Adm Penduduk)' : 'Rasya LMS PKBM'}
                  </td>
                  <td className="border-r border-black p-3 italic leading-snug">"{t.description}"</td>
                  <td className="border-r border-black p-3 text-center uppercase font-bold">
                    {t.status === 'draft' ? 'Tiket Masuk / Baru' : t.status === 'review' ? 'Sedang Diperbaiki' : 'Selesai Teratasi'}
                  </td>
                  <td className="p-3 text-center font-bold uppercase">{t.priority || 'medium'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Formal Stats Section inside Printout */}
        <div className="grid grid-cols-3 gap-4 mt-8 font-sans text-xs">
          <div className="border border-black p-3 rounded">
            <span className="block font-bold text-slate-700">IKHTISAR TIKET MASUK (DRAFT):</span>
            <span className="text-xl font-black">{filteredTickets.filter(t => t.status === 'draft').length} Tiket aktif</span>
          </div>
          <div className="border border-black p-3 rounded">
            <span className="block font-bold text-slate-700">SEDANG PERBAIKAN (REVIEW):</span>
            <span className="text-xl font-black">{filteredTickets.filter(t => t.status === 'review').length} Tiket diproses</span>
          </div>
          <div className="border border-black p-3 rounded bg-slate-50">
            <span className="block font-bold text-slate-700">SELESAI OPERASIONAL (SOLVED):</span>
            <span className="text-xl font-black text-emerald-700">{filteredTickets.filter(t => t.status === 'solved').length} Tiket tuntas</span>
          </div>
        </div>

        {/* Educational Signature Blocks */}
        <div className="mt-16 grid grid-cols-2 gap-12 font-sans text-xs">
          <div>
            <p className="mb-1">Mengetahui,</p>
            <p className="font-bold uppercase">Kepala Dinas Pendidikan Pemuda dan Olahraga</p>
            <div className="h-24"></div>
            <p className="font-bold underline">DR. H. SUPRIATNA, M.PD.</p>
            <p className="text-[10px] text-slate-500">NIP. 19741203 199903 1 004</p>
          </div>
          <div className="text-right mr-6">
            <p className="mb-1">Jakarta, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="font-bold uppercase">Direktur Utama Rasyatech Solution</p>
            <div className="h-24"></div>
            <p className="font-bold underline">MUHAMMAD ISMANTO</p>
            <p className="text-[10px] text-slate-500">Master Tech Lead & LMS Architect</p>
          </div>
        </div>

        {/* Back and PDF launch bar (hidden upon printing) */}
        <div className="mt-12 p-6 bg-slate-100 rounded-xl flex justify-between items-center print:hidden border border-slate-200">
          <div>
            <h4 className="font-black text-slate-800 text-sm">Mode Cetak Dokumen Dinas Aktif!</h4>
            <p className="text-slate-500 text-xs font-sans">Gunakan shortcut browser Anda (Ctrl+P / Cmd+P) untuk menyimpan sebagai File PDF resmi daerah yang rapi.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-black text-white hover:bg-slate-900 rounded-lg text-xs font-bold transition-all shadow-md"
            >
              Cetak Dokumen (Print)
            </button>
            <button
              onClick={() => setIsPrintMode(false)}
              className="px-5 py-2.5 bg-slate-300 text-black hover:bg-slate-400 rounded-lg text-xs font-bold transition-all"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090F1C] text-slate-200 p-8">
      {/* Header section with elegant portal background */}
      <div className="relative mb-10 pb-8 border-b border-slate-800/80">
        <div className="absolute top-0 right-0 p-1 flex gap-2">
          <button 
            onClick={resetToDemo}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg text-xs font-bold transition-all"
            title="Kembalikan sample data awal"
          >
            Reset Demo Data
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mr-36">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-rose-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg border border-white/10">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/15 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                  Central Command
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs text-rose-500 font-bold">LIVE REGIONAL</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                Monitoring Keluhan Terpusat <span className="text-rose-500 font-serif text-sm italic font-normal">(Rasyatech Portofolio Dinas)</span>
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl font-medium">
                Pusat kendali operasional lintas platform. Singkronisasi data pengaduan sekolah SIPUT (Sistem Informasi Penduduk Terpadu) & Rasya LMS PKBM Armilla Nusa secara real-time.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              <Plus className="w-4 h-4" /> Buka Tiket Masalah
            </button>
            <button
              onClick={() => setIsPrintMode(true)}
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-750 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 border border-slate-700 shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <Printer className="w-4 h-4" /> Cetak Laporan Kerja Dinas
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel: Summary Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#111827] border border-rose-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-rose-950/20 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-all duration-300 group-hover:bg-rose-500/10"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400 flex items-center gap-1.5 font-black text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block"></span>
              TIKET MASUK (NEW)
            </div>
            <AlertCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-5xl font-black text-white tracking-tight">{countDraft}</div>
          <p className="text-slate-400 text-xs font-semibold mt-2">Daftar laporan baru terdaftar belum ditugaskan ke staff.</p>
        </div>

        <div className="bg-[#111827] border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-amber-950/10 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-all duration-300 group-hover:bg-amber-500/10"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400 flex items-center gap-1.5 font-black text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              SEDANG DIPERBAIKI (BUGFIX)
            </div>
            <Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-5xl font-black text-white tracking-tight">{countReview}</div>
          <p className="text-slate-400 text-xs font-semibold mt-2">Masalah aktif yang sedang dikerjakan oleh tim developer Rasyatech.</p>
        </div>

        <div className="bg-[#111827] border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-emerald-950/10 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-all duration-300 group-hover:bg-emerald-500/10"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5 font-black text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              SELESAI OPERASIONAL
            </div>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-5xl font-black text-white tracking-tight">{countSolved}</div>
          <p className="text-slate-400 text-xs font-semibold mt-2">Tiket tuntas dan berhasil lolos verifikasi serta diarsipkan.</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 mb-8 flex flex-wrap gap-4 items-center justify-between shadow-xl">
        <div className="flex flex-wrap gap-4 items-center flex-1 min-w-[320px]">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[280px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
              <Search className="w-5 h-5" />
            </span>
            <input 
              type="text"
              placeholder="Cari tiket berdasar Kode, Lembaga, atau kendala..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#182235] border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Regional District Filter */}
          <div className="flex items-center gap-2 bg-[#182235] px-4 py-1 border border-slate-800 rounded-2xl min-w-[200px]">
            <MapPin className="w-4 h-4 text-rose-500" />
            <select
              value={filterSubdistrict}
              onChange={(e) => setFilterSubdistrict(e.target.value)}
              className="w-full bg-transparent text-slate-200 font-bold text-xs py-3 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111827] text-slate-300">Semua Kecamatan</option>
              {KECAMATAN_LIST.map(kec => (
                <option key={kec} value={kec} className="bg-[#111827] text-slate-200">Kecamatan {kec}</option>
              ))}
            </select>
          </div>

          {/* Source System App Filter */}
          <div className="flex items-center gap-2 bg-[#182235] px-4 py-1 border border-slate-800 rounded-2xl min-w-[170px]">
            <Activity className="w-4 h-4 text-indigo-400" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full bg-transparent text-slate-200 font-bold text-xs py-3 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#111827] text-slate-300">Semua Program</option>
              <option value="SIPUT" className="bg-[#111827] text-slate-200">SIPUT (Penduduk)</option>
              <option value="LMS_ARMILLA" className="bg-[#111827] text-slate-200">Rasya LMS</option>
            </select>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="text-right text-xs text-slate-400 font-medium">
          Menampilkan <span className="text-rose-400 font-bold">{filteredTickets.length}</span> dari <span className="text-white font-bold">{tickets.length}</span> total laporan kendala.
        </div>
      </div>

      {/* KANBAN BOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMN 1: TIKET MASUK */}
        <div className="bg-[#101726]/85 border border-slate-800/80 rounded-[32px] p-6 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500 rounded-t-[32px]"></div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              <h3 className="font-extrabold text-white text-base tracking-tight uppercase">TIKET MASUK</h3>
            </div>
            <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-xs font-black rounded-lg border border-rose-500/15">
              {filteredTickets.filter(t => t.status === 'draft').length} Laporan
            </span>
          </div>

          <div className="space-y-5 min-h-[450px]">
            {filteredTickets.filter(t => t.status === 'draft').length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 font-bold text-sm">
                Tidak ada keluhan masuk
              </div>
            ) : (
              filteredTickets.filter(t => t.status === 'draft').map(ticket => (
                <div key={ticket.id} className="bg-[#161F30] border border-slate-800/80 rounded-2xl p-5 hover:border-rose-500/40 transition-all duration-300 shadow-md relative group">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${getSourceBadgeColor(ticket.source)}`}>
                      {getSourceLabel(ticket.source)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(ticket.priority)}
                      <button 
                        onClick={() => deleteTicket(ticket.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Hapus Tiket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-white font-black text-sm mb-1">{ticket.school_name}</h4>
                  
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 font-black mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Kec. {ticket.subdistrict}</span>
                  </div>

                  <p className="text-slate-350 text-xs font-semibold leading-relaxed line-clamp-3 mb-4 italic">
                    "{ticket.description}"
                  </p>

                  <div className="flex justify-between items-center pt-3.5 border-t border-slate-800/60 text-[10px] text-slate-500 font-bold">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-550" />
                      <span>{new Date(ticket.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                    </div>
                    {ticket.reporter_name && (
                      <span className="truncate max-w-[120px]" title={ticket.reporter_name}>
                        Lap: {ticket.reporter_name}
                      </span>
                    )}
                  </div>

                  {/* Kanban shift arrows */}
                  <div className="flex justify-end gap-1.5 mt-3 pt-2">
                    <button
                      onClick={() => moveTicket(ticket.id, 'forward')}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-black tracking-tight border border-amber-500/25 flex items-center gap-1 w-full justify-center transition-all"
                    >
                      <span>Perbaiki</span> <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: SEDANG DIPERBAIKI */}
        <div className="bg-[#101726]/85 border border-slate-800/80 rounded-[32px] p-6 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 rounded-t-[32px]"></div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h3 className="font-extrabold text-white text-base tracking-tight uppercase">SEDANG DIPERBAIKI</h3>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-black rounded-lg border border-amber-500/15">
              {filteredTickets.filter(t => t.status === 'review').length} Proses
            </span>
          </div>

          <div className="space-y-5 min-h-[450px]">
            {filteredTickets.filter(t => t.status === 'review').length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 font-bold text-sm">
                Tidak ada tiket proses perbaikan
              </div>
            ) : (
              filteredTickets.filter(t => t.status === 'review').map(ticket => (
                <div key={ticket.id} className="bg-[#161F30] border border-slate-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition-all duration-300 shadow-md relative group">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${getSourceBadgeColor(ticket.source)}`}>
                      {getSourceLabel(ticket.source)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(ticket.priority)}
                      <button 
                        onClick={() => deleteTicket(ticket.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Hapus Tiket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-white font-black text-sm mb-1">{ticket.school_name}</h4>
                  
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 font-black mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Kec. {ticket.subdistrict}</span>
                  </div>

                  <p className="text-slate-350 text-xs font-semibold leading-relaxed line-clamp-3 mb-4 italic">
                    "{ticket.description}"
                  </p>

                  <div className="flex justify-between items-center pt-3.5 border-t border-slate-800/60 text-[10px] text-slate-500 font-bold">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-550" />
                      <span>{new Date(ticket.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                    </div>
                    {ticket.reporter_name && (
                      <span className="truncate max-w-[120px]" title={ticket.reporter_name}>
                        Lap: {ticket.reporter_name}
                      </span>
                    )}
                  </div>

                  {/* Move action buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
                    <button
                      onClick={() => moveTicket(ticket.id, 'backward')}
                      className="px-2 py-1.5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-350 border border-rose-500/20 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Kembalikan
                    </button>
                    <button
                      onClick={() => moveTicket(ticket.id, 'forward')}
                      className="px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-lg text-xs font-black tracking-tight transition-all flex items-center justify-center gap-1"
                    >
                      Selesai <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: SELESAI / AKTIF */}
        <div className="bg-[#101726]/85 border border-slate-800/80 rounded-[32px] p-6 shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 rounded-t-[32px]"></div>
          
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h3 className="font-extrabold text-white text-base tracking-tight uppercase">SELESAI</h3>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-lg border border-emerald-500/15">
              {filteredTickets.filter(t => t.status === 'solved').length} Tuntas
            </span>
          </div>

          <div className="space-y-5 min-h-[450px]">
            {filteredTickets.filter(t => t.status === 'solved').length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 font-bold text-sm">
                Belum ada tiket diselesaikan
              </div>
            ) : (
              filteredTickets.filter(t => t.status === 'solved').map(ticket => (
                <div key={ticket.id} className="bg-[#161F30] border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/40 transition-all duration-300 shadow-md relative group">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${getSourceBadgeColor(ticket.source)}`}>
                      {getSourceLabel(ticket.source)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(ticket.priority)}
                      <button 
                        onClick={() => deleteTicket(ticket.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Hapus Tiket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-white font-black text-sm mb-1">{ticket.school_name}</h4>
                  
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 font-black mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Kec. {ticket.subdistrict}</span>
                  </div>

                  <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-3 mb-4 italic line-through opacity-70">
                    "{ticket.description}"
                  </p>

                  <div className="flex justify-between items-center pt-3.5 border-t border-slate-800/60 text-[10px] text-slate-500 font-bold">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#00BEC4]" />
                      <span>Selesai</span>
                    </div>
                    {ticket.reporter_name && (
                      <span className="truncate max-w-[120px]" title={ticket.reporter_name}>
                        Lap: {ticket.reporter_name}
                      </span>
                    )}
                  </div>

                  {/* Move back options */}
                  <div className="mt-3 pt-2">
                    <button
                      onClick={() => moveTicket(ticket.id, 'backward')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 w-full justify-center"
                    >
                      <ArrowLeft className="w-3 h-3" /> Kembalikan ke Tim Perbaikan
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* CREATE NEW TICKET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-xl font-bold p-2"
            >
              ✕
            </button>
            
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Buka Laporan Masalah Baru</h3>
            <p className="text-slate-400 text-xs font-medium mb-6">Tambahkan keluhan baru lintas program secara instan untuk di-monitoring di panel.</p>

            <form onSubmit={handleCreateTicket} className="space-y-5">
              {/* Product Source */}
              <div>
                <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Asal Aplikasi / Layanan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewTicket(prev => ({ ...prev, source: 'SIPUT' }))}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      newTicket.source === 'SIPUT' 
                        ? 'bg-[#00BEC4]/10 border-[#00BEC4] text-white shadow-md' 
                        : 'bg-[#182235] border-slate-800 text-slate-400 hover:bg-[#182235]/65'
                    }`}
                  >
                    SIPUT 📱
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTicket(prev => ({ ...prev, source: 'LMS_ARMILLA' }))}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                      newTicket.source === 'LMS_ARMILLA' 
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md' 
                        : 'bg-[#182235] border-slate-800 text-slate-400 hover:bg-[#182235]/65'
                    }`}
                  >
                    LMS Armilla 💻
                  </button>
                </div>
              </div>

              {/* School name & Subdistrict */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Nama Sekolah / PKBM</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SLB Negeri 1 / PKBM Baru"
                    value={newTicket.school_name}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, school_name: e.target.value }))}
                    className="w-full bg-[#182235] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:ring-indigo-508 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Kecamatan Wilayah</label>
                  <select
                    value={newTicket.subdistrict}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, subdistrict: e.target.value }))}
                    className="w-full bg-[#182235] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-bold cursor-pointer"
                  >
                    {KECAMATAN_LIST.map(kec => (
                      <option key={kec} value={kec} className="bg-[#111827]">Kecamatan {kec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Reporter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Prioritas Kendala</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full bg-[#182235] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-bold cursor-pointer"
                  >
                    <option value="low" className="bg-[#111827]">Rendah (Low)</option>
                    <option value="medium" className="bg-[#111827]">Sedang (Medium)</option>
                    <option value="high" className="bg-[#111827]">Penting (Critical)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Nama Pelapor</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bu Hermin, S.Pd"
                    value={newTicket.reporter_name}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, reporter_name: e.target.value }))}
                    className="w-full bg-[#182235] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Bug Description */}
              <div>
                <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Rincian Kendala Sistem</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Deskripsikan dengan detail bug, error yang muncul, atau perbaikan modul yang dibutuhkan sekolah..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#182235] border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Actions submit */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#01BEC4] hover:bg-[#00ADC4] text-[#0B2447] font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-[#00BEC4]/20 transition-all"
                >
                  Daftarkan Keluhan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
