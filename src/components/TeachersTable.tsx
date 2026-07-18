import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, Users, Save, X } from 'lucide-react';

export default function TeachersTable({ schoolId }: { schoolId: string }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', nip: '' });

  useEffect(() => {
    fetchTeachers();
  }, [schoolId]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content/teachers?school_id=${schoolId}`);
      if (!response.ok) throw new Error('Gagal mengambil data guru');
      const data = await response.json();
      setTeachers(data);
    } catch (error: any) {
      console.error("Error (TeachersTable):", error);
      alert("Gagal memuat data guru: " + error.message);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/content/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingTeacher?.id, school_id: schoolId })
      });
      if (!response.ok) throw new Error('Gagal menyimpan data guru');
      closeModal();
      fetchTeachers();
    } catch (error: any) {
      alert("Gagal menyimpan data guru: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin hapus data ini?')) {
      try {
        const response = await fetch(`/api/content/teachers/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Gagal menghapus data guru');
        fetchTeachers();
      } catch (error: any) {
        alert("Gagal menghapus data guru: " + error.message);
      }
    }
  };

  const openModal = (teacher: any = null) => {
    setEditingTeacher(teacher);
    setFormData(teacher ? { name: teacher.name, nip: teacher.nip } : { name: '', nip: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Data Guru
        </h3>
        <button onClick={() => openModal()} className="px-4 py-2 bg-indigo-600 text-white font-black rounded-xl text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Guru
        </button>
      </div>
      <table className="w-full">
        <thead>
            <tr className="text-left text-slate-400 text-xs font-black uppercase tracking-widest">
                <th className="pb-4">Nama</th>
                <th className="pb-4">NIP</th>
                <th className="pb-4">Aksi</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
            {teachers.map(t => (
                <tr key={t.id}>
                    <td className="py-4 font-bold">{t.name}</td>
                    <td className="py-4 font-bold">{t.nip}</td>
                    <td className="py-4 flex gap-2">
                        <button onClick={() => openModal(t)} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-3xl w-full max-w-md">
                <h3 className="text-xl font-black mb-4">{editingTeacher ? 'Edit Guru' : 'Tambah Guru'}</h3>
                <input placeholder="Nama" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 mb-4 bg-slate-50 rounded-xl" />
                <input placeholder="NIP" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} className="w-full p-3 mb-4 bg-slate-50 rounded-xl" />
                <div className="flex gap-2">
                    <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Simpan</button>
                    <button onClick={closeModal} className="px-6 py-3 bg-slate-100 font-bold rounded-xl"><X className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
