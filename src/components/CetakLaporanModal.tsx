import React from 'react';
import { Jurnal, Kelas, Mapel, Guru, Sekolah, Jurusan, Siswa } from '../types';
import { X, Printer, HelpCircle, FileText, Check } from 'lucide-react';

interface CetakLaporanModalProps {
  type: 'harian' | 'mingguan' | 'bulanan' | 'monitoring';
  classId?: string | null;
  filterDate?: string; // Standard fallback for default selection
  kelas: Kelas[];
  jurusan: Jurusan[];
  mapel: Mapel[];
  guru: Guru[];
  siswa: Siswa[];
  jurnals: Jurnal[];
  schoolInfo: Sekolah;
  onClose: () => void;
}

export default function CetakLaporanModal({
  type,
  classId,
  filterDate = new Date().toISOString().split('T')[0],
  kelas,
  jurusan,
  mapel,
  guru,
  siswa,
  jurnals,
  schoolInfo,
  onClose
}: CetakLaporanModalProps) {
  
  const targetClass = classId ? kelas.find(k => k.id === classId) : null;
  const targetJurusan = targetClass ? jurusan.find(j => j.id === targetClass.jurusanId) : null;

  // Filter journals for printing:
  // 1. By Class (only if not monitoring)
  let selectedJournals = type === 'monitoring' ? jurnals : jurnals.filter(j => j.kelasId === classId);

  // 2. By Time Range depending on report type
  let dateTitleStr = '';
  const dateObj = new Date(filterDate);

  if (type === 'monitoring') {
    selectedJournals = selectedJournals.filter(j => j.tanggal === filterDate);
    dateTitleStr = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } else if (type === 'harian') {
    // Show entries within the same week (7-day window from the filtered date's Monday)
    const currentDay = dateObj.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1; // standard Monday based
    const monday = new Date(dateObj);
    monday.setDate(dateObj.getDate() - distanceToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];

    selectedJournals = selectedJournals.filter(j => j.tanggal >= mondayStr && j.tanggal <= sundayStr);
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    dateTitleStr = `Minggu Ini (${monday.toLocaleDateString('id-ID', options)} s/d ${sunday.toLocaleDateString('id-ID', options)})`;
  } else {
    // Monthly rekap
    const currentMonth = dateObj.getMonth(); // 0-11
    const currentYear = dateObj.getFullYear();
    
    selectedJournals = selectedJournals.filter((j) => {
      const jDate = new Date(j.tanggal);
      return jDate.getMonth() === currentMonth && jDate.getFullYear() === currentYear;
    });

    dateTitleStr = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  // Sort journals ascending by date and jamKe
  const sortedPrintJournals = [...selectedJournals].sort((a, b) => {
    const compDate = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
    if (compDate !== 0) return compDate;
    return a.jamKe.localeCompare(b.jamKe);
  });

  const getMapelName = (id: string) => mapel.find(m => m.id === id)?.nama || 'N/A';
  const getMapelCode = (id: string) => mapel.find(m => m.id === id)?.kode || 'N/A';
  
  const getGuruName = (id: string) => {
    if (!id) return 'N/A';
    return id.split(',').map(subId => {
      const g = guru.find(x => x.id === subId.trim());
      return g ? g.nama : 'N/A';
    }).join(' & ');
  };

  const getGuruKode = (id: string) => {
    if (!id) return '-';
    return id.split(',').map(subId => {
      const g = guru.find(x => x.id === subId.trim());
      return g ? g.kodeGuru : '-';
    }).join(', ');
  };

  const handlePrintTrigger = () => {
    window.print();
  };

  const getPresenceTranslation = (status: 'hadir' | 'tidak' | 'tugas') => {
    switch (status) {
      case 'hadir': return 'HADIR';
      case 'tugas': return 'GURU BERHALANGAN, MEMBERIKAN TUGAS';
      case 'tidak': return 'TIDAK HADIR (JAM KOSONG)';
    }
  };

  const formattedPrintDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0.5 sm:p-4 z-50 overflow-y-auto no-print">
      
      {/* Outer Modal Container */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col my-4 max-h-[95vh] text-slate-800 border border-slate-200">
        
        {/* Modal Controls Bar (hidden during printer action) */}
        <div className="p-4 bg-slate-50 border-b border-slate-205 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-100 text-orange-700 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-850">
                Prapinjau Cetak Laporan - {type === 'monitoring' ? 'Monitoring KBM Harian' : type === 'harian' ? 'Harian' : type === 'mingguan' ? 'Mingguan' : 'Bulanan'}
              </h3>
              <p className="text-[11px] text-slate-400">Tekan Ctrl+P untuk mencetak dalam format kertas physical / PDF</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintTrigger}
              className="py-2 px-3.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 text-slate-500 rounded-xl cursor-pointer transition-colors"
              title="Tutup Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body Scrollable inside modal, fully optimized for printer page */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white" id="printable-area">
          
          {/* STYLING FOR PRINT ONLY AT-RULE */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-area, #printable-area * {
                visibility: visible;
              }
              #printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 0 !important;
                margin: 0 !important;
                background-color: white !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          {/* ==================== KOP SURAT (OFFICIAL SCHOOL LETTERHEAD) ==================== */}
          <div className="border-b-4 border-double border-slate-800 pb-4 mb-6 flex items-center gap-5 text-left">
            <div className="w-20 h-20 bg-orange-100 border border-orange-200 text-orange-600 rounded-full shrink-0 flex items-center justify-center font-black text-2xl font-mono text-center shadow-inner relative">
              🏫
              <span className="absolute bottom-0 text-[8px] font-bold bg-slate-800 text-white rounded px-1">SMK</span>
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600 leading-none">MAJELIS PENDIDIKAN DASAR MENENGAH DAN PENDIDIKAN NONFORMAL</h4>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-normal uppercase mt-0.5">{schoolInfo.nama}</h2>
              <p className="text-[10px] font-mono font-medium text-slate-400 mt-0.5">TERAKREDITASI "A" | NPSN: {schoolInfo.npsn}</p>
              <p className="text-xs text-slate-500 leading-tight mt-1">
                Alamat: {schoolInfo.alamat} <br />
                Website: <span className="font-semibold text-slate-700">{schoolInfo.website}</span> | Email: <span className="font-semibold text-slate-700">{schoolInfo.email}</span>
              </p>
            </div>
          </div>

          {/* ==================== DOCUMENT TITLE ==================== */}
          <div className="text-center mb-6 space-y-1">
            <h3 className="text-base font-extrabold tracking-wide uppercase text-slate-900 underline decoration-slate-400 underline-offset-4">
              {type === 'monitoring' 
                ? 'LAPORAN MONITORING KETERLAKSANAAN KBM DAN PENGISIAN JURNAL HARIAN'
                : type === 'harian' 
                ? 'LAPORAN REKAPITULASI JURNAL MENGAJAR HARIAN' 
                : type === 'mingguan' 
                ? 'LAPORAN REKAPITULASI JURNAL MENGAJAR MINGGUAN' 
                : 'LAPORAN REKAPITULASI JURNAL MENGAJAR BULANAN'}
            </h3>
            <p className="text-xs font-mono text-slate-550 font-bold">Periode: {dateTitleStr}</p>
          </div>

          {/* ==================== MASTER SPECIFICATIONS ==================== */}
          {type === 'monitoring' ? (
            <div className="grid grid-cols-2 gap-4 text-xs mb-5 border border-slate-200 bg-slate-50/50 p-4 rounded-xl leading-relaxed">
              <div className="space-y-1 text-left">
                <p><span className="text-slate-400 font-medium">Nama Institusi :</span> <strong className="text-slate-800">{schoolInfo.nama}</strong></p>
                <p><span className="text-slate-400 font-medium">Fokus Laporan :</span> <strong className="text-slate-800">Pemantauan Jurnal Kelas Harian</strong></p>
                <p><span className="text-slate-400 font-medium">Total Kelas Aktif :</span> <strong className="text-slate-800">{kelas.length} Kelas Paralel</strong></p>
              </div>
              <div className="space-y-1 text-right">
                <p><span className="text-slate-400 font-medium">Tahun Ajaran :</span> <strong className="text-slate-800">2026/2027</strong></p>
                <p><span className="text-slate-400 font-medium">Tanggal Pemantauan :</span> <strong className="text-slate-800">{dateTitleStr}</strong></p>
                <p><span className="text-slate-400 font-medium">Tanggal Cetak :</span> <strong className="text-slate-800">{formattedPrintDate}</strong></p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-xs mb-5 border border-slate-200 bg-slate-50/50 p-4 rounded-xl leading-relaxed">
              <div className="space-y-1 text-left">
                <p><span className="text-slate-400 font-medium">Nama Institusi :</span> <strong className="text-slate-800">{schoolInfo.nama}</strong></p>
                <p><span className="text-slate-400 font-medium">Struktur Kelas :</span> <strong className="text-slate-800">{targetClass?.nama || 'N/A'}</strong></p>
                <p><span className="text-slate-400 font-medium">Program Jurusan :</span> <strong className="text-slate-800">{targetJurusan?.nama || 'N/A'} ({targetJurusan?.singkatan || 'N/A'})</strong></p>
              </div>
              <div className="space-y-1 text-right">
                <p><span className="text-slate-400 font-medium">Tahun Ajaran :</span> <strong className="text-slate-800">2026/2027</strong></p>
                <p><span className="text-slate-400 font-medium">Sistem Verifikasi :</span> <strong className="text-emerald-700">Terverifikasi Digital Ketua Kelas</strong></p>
                <p><span className="text-slate-400 font-medium">Tanggal Cetak :</span> <strong className="text-slate-800">{formattedPrintDate}</strong></p>
              </div>
            </div>
          )}

          {/* ==================== CORE DATA TABLE ==================== */}
          {type === 'monitoring' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-350">
                <thead className="bg-slate-100 text-slate-800 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th scope="col" className="border border-slate-350 px-3 py-2 text-center w-8">No</th>
                    <th scope="col" className="border border-slate-350 px-4 py-2 w-32">Nama Kelas</th>
                    <th scope="col" className="border border-slate-350 px-4 py-2 w-44">Program Jurusan</th>
                    <th scope="col" className="border border-slate-350 px-4 py-2">Penanggung Jawab (Ketua Kelas)</th>
                    <th scope="col" className="border border-slate-350 px-3 py-2 text-center w-36">Status Pengisian</th>
                    <th scope="col" className="border border-slate-350 px-4 py-2">Detail Jurnal Terisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {kelas.map((k, idx) => {
                    const matchedJurusan = jurusan.find(j => j.id === k.jurusanId);
                    const classInDateEntries = jurnals.filter(j => j.kelasId === k.id && j.tanggal === filterDate);
                    const ketuaKelas = siswa.find(s => s.kelasId === k.id && s.isKetuaKelas);
                    
                    return (
                      <tr key={k.id} className="hover:bg-slate-50/50">
                        <td className="border border-slate-350 px-3 py-2 text-center font-mono font-bold">{idx + 1}</td>
                        <td className="border border-slate-350 px-4 py-2 font-bold text-slate-900">{k.nama}</td>
                        <td className="border border-slate-350 px-4 py-2 font-medium text-slate-600">
                          {matchedJurusan ? `${matchedJurusan.nama} (${matchedJurusan.singkatan})` : 'Umum'}
                        </td>
                        <td className="border border-slate-350 px-4 py-2 font-bold text-slate-850">
                          {ketuaKelas ? ketuaKelas.nama : '(Belum ditunjuk)'}
                          {ketuaKelas && <p className="text-[9.5px] text-slate-400 font-mono font-normal">NIS: {ketuaKelas.nis}</p>}
                        </td>
                        <td className="border border-slate-350 px-3 py-2 text-center font-extrabold text-[10px]">
                          <span className={`px-2.5 py-0.5 rounded font-bold ${
                            classInDateEntries.length > 0 
                              ? 'text-emerald-850 bg-emerald-50 border border-emerald-200' 
                              : 'text-rose-850 bg-rose-50 border border-rose-200'
                          }`}>
                            {classInDateEntries.length > 0 
                              ? `TERISI (${classInDateEntries.length} SESI)` 
                              : 'BELUM MENGISI'}
                          </span>
                        </td>
                        <td className="border border-slate-350 px-4 py-2.5 text-left text-slate-650 leading-relaxed max-w-xs">
                          {classInDateEntries.length === 0 ? (
                            <span className="text-rose-600 font-semibold italic text-[10.5px]">Menunggu laporan ketua kelas</span>
                          ) : (
                            <div className="space-y-1 font-medium">
                              {classInDateEntries.map((j) => {
                                const m = mapel.find(map => map.id === j.mapelId);
                                return (
                                  <div key={j.id} className="text-[10px] leading-tight">
                                    <span className="font-bold text-slate-700">Jam {j.jamKe}:</span> {m ? m.nama : 'Mapel'} ({j.statusKehadiran.toUpperCase()})
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Monitoring statistics box */}
              {(() => {
                const totalKelasCount = kelas.length;
                const filledKelasCount = kelas.filter(k => jurnals.some(j => j.kelasId === k.id && j.tanggal === filterDate)).length;
                const notFilledKelasCount = totalKelasCount - filledKelasCount;
                const score = totalKelasCount > 0 ? Math.round((filledKelasCount / totalKelasCount) * 100) : 0;
                
                return (
                  <div className="mt-5 border border-slate-350 bg-slate-50 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-semibold leading-relaxed gap-3">
                    <div>
                      <p className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Rasio Kepatuhan Jurnal Harian :</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="w-48 bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300">
                          <div className="bg-indigo-650 bg-indigo-600 h-full" style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-sm font-black text-indigo-700">{score}% Kepatuhan</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-[11px] text-slate-700 font-mono">
                      <p>Total Kelas Terdata: <strong className="text-slate-900">{totalKelasCount} Kelas</strong></p>
                      <p>Selesai Mengisi Jurnal: <strong className="text-emerald-700">{filledKelasCount} Kelas</strong></p>
                      <p>Belum Mengisi Jurnal: <strong className="text-rose-600">{notFilledKelasCount} Kelas</strong></p>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-350">
                <thead className="bg-slate-100 text-slate-800 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th scope="col" className="border border-slate-350 px-3 py-2 text-center w-8">No</th>
                    <th scope="col" className="border border-slate-350 px-3 py-2 text-center w-28">Hari & Tanggal</th>
                    <th scope="col" className="border border-slate-350 px-3 py-2 text-center w-18">Jam Ke</th>
                    <th scope="col" className="border border-slate-350 px-4 py-2">Mata Pelajaran</th>
                    <th scope="col" className="border border-slate-350 px-4 py-2">Guru Pengampu</th>
                    <th scope="col" className="border border-slate-350 px-3 py-2 text-center w-24">Kehadiran</th>
                    <th scope="col" className="border border-slate-350 px-4 py-2">Pokok Bahasan / Materi Pembelajaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedPrintJournals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-slate-350 text-center py-8 text-slate-450 italic font-medium">
                        ( Tidak ditemukan rekaman jurnal mengajar pada periode / kelas terpilih )
                      </td>
                    </tr>
                  ) : (
                    sortedPrintJournals.map((jr, idx) => (
                      <tr key={jr.id} className="hover:bg-slate-50/50">
                        <td className="border border-slate-350 px-3 py-2 text-center font-mono font-bold">{idx + 1}</td>
                        <td className="border border-slate-350 px-3 py-2 font-semibold">
                          <p>{jr.tanggal}</p>
                          <p className="text-[10px] text-slate-400 font-sans font-normal">{jr.hari}</p>
                        </td>
                        <td className="border border-slate-350 px-3 py-2 text-center font-semibold text-slate-705">
                          Jam {jr.jamKe}
                        </td>
                        <td className="border border-slate-350 px-4 py-2 font-bold text-slate-900">
                          {getMapelName(jr.mapelId)}
                          <p className="text-[9px] text-slate-400 font-mono font-normal">Kode: {getMapelCode(jr.mapelId)}</p>
                        </td>
                        <td className="border border-slate-350 px-4 py-2 font-medium">
                          {getGuruName(jr.guruId)}
                          <p className="text-[9px] text-slate-400 font-mono">Kode Guru: {getGuruKode(jr.guruId)}</p>
                        </td>
                        <td className="border border-slate-350 px-3 py-2 text-center font-extrabold text-[10px]">
                          <span className={`px-2 py-0.5 rounded ${
                            jr.statusKehadiran === 'hadir' 
                              ? 'text-emerald-850 bg-emerald-50 border border-emerald-200' 
                              : jr.statusKehadiran === 'tugas' 
                              ? 'text-amber-850 bg-amber-50 border border-amber-200' 
                              : 'text-rose-850 bg-rose-50 border border-rose-200'
                          }`}>
                            {getPresenceTranslation(jr.statusKehadiran)}
                          </span>
                        </td>
                        <td className="border border-slate-350 px-4 py-2 whitespace-pre-wrap text-left text-slate-650 leading-relaxed max-w-xs select-text">
                          {jr.catatan}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ==================== SIGNATURE BLOCKS ==================== */}
          <div className="mt-12 grid grid-cols-2 gap-8 text-xs leading-relaxed select-none">
            <div className="space-y-12">
              <div>
                <p className="text-slate-500 font-medium">Mengetahui/Menyetujui,</p>
                <p className="font-bold text-slate-800 uppercase">Kepala Sekolah {schoolInfo.nama}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 underline decoration-slate-500 underline-offset-4">{schoolInfo.kepalaSekolah}</p>
                <p className="text-slate-500 mt-0.5">NIP/Kode. {schoolInfo.nipKepalaSekolah}</p>
              </div>
            </div>

            <div className="space-y-12 text-right">
              <div>
                <p className="text-slate-500 font-medium">Mungkid, {formattedPrintDate}</p>
                <p className="font-bold text-slate-800 uppercase">Waka Kurikulum / Guru Piket</p>
              </div>
              <div className="pr-4">
                <p className="font-bold text-slate-900 underline decoration-slate-500 underline-offset-4">......................................................</p>
                <p className="text-slate-500 mt-0.5">NIP/Kode. .................................................</p>
              </div>
            </div>
          </div>

          {/* Formal note */}
          <div className="mt-16 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400 font-mono no-print">
            Dokumen ini di-generate secara digital melalui Aplikasi Jurnal Mengajar Online Sekolah.
          </div>

        </div>

        {/* Modal Footer helper */}
        <div className="p-4 bg-slate-50 border-t border-slate-205 flex items-center justify-between no-print shrink-0 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Format tabel sudah disesuaikan agar rapi di kertas A4 saat di-print.</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Selesai & Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
