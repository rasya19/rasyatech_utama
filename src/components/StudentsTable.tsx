import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Plus, Edit2, Trash2, Users } from 'lucide-react';

export default function StudentsTable({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', nisn: '' });

  useEffect(() => {
    fetchStudents();
  }, [schoolId]);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', schoolId);
    
    if (error) {
        console.error("Supabase Error (StudentsTable):", error);
        alert("Gagal memuat data siswa: " + error.message);
    } else if (data) {
        setStudents(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (editingStudent) {
        await supabase.from('students').update(formData).eq('id', editingStudent.id);
    } else {
        await supabase.from('students').insert({ ...formData, school_id: schoolId });
    }
    closeModal();
    fetchStudents();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin hapus data ini?')) {
        await supabase.from('students').delete().eq('id', id);
        fetchStudents();
    }
  };

  const openModal = (student: any = null) => {
    setEditingStudent(student);
    setFormData(student ? { name: student.name, nisn: student.nisn } : { name: '', nisn: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Data Siswa
        </h3>
        <button onClick={() => openModal()} className="px-4 py-2 bg-indigo-600 text-white font-black rounded-xl text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Siswa
        </button>
      </div>
      <table className="w-full">
        <thead>
            <tr className="text-left text-slate-400 text-xs font-black uppercase tracking-widest">
                <th className="pb-4">Nama</th>
                <th className="pb-4">NISN</th>
                <th className="pb-4">Aksi</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
            {students.map(s => (
                <tr key={s.id}>
                    <td className="py-4 font-bold">{s.name}</td>
                    <td className="py-4 font-bold">{s.nisn}</td>
                    <td className="py-4 flex gap-2">
                        <button onClick={() => openModal(s)} className="text-slate-400 hover:text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                </tr>
            ))}
        </tbody>
      </table>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-3xl w-full max-w-md">
                <h3 className="text-xl font-black mb-4">{editingStudent ? 'Edit Siswa' : 'Tambah Siswa'}</h3>
                <input placeholder="Nama" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 mb-4 bg-slate-50 rounded-xl" />
                <input placeholder="NISN" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} className="w-full p-3 mb-4 bg-slate-50 rounded-xl" />
                <div className="flex gap-2">
                    <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">Simpan</button>
                    <button onClick={closeModal} className="px-6 py-3 bg-slate-100 font-bold rounded-xl">Batal</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
