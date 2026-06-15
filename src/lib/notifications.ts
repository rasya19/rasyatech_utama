// lib/notifications.ts

const FONNTE_TOKEN = 'jpRJKUuhWcFdnDFrbLVT'; // Ganti dengan token Anda

export const sendWhatsAppNotification = async (formData: any) => {
  const getWaMessage = (data: any) => {
    const base = `*Pendaftaran SaaS Rasyatech Baru*\n\nNama: ${data.full_name}\nLayanan: ${data.product_type}\nSekolah/Bisnis: ${data.business_name}\nWhatsApp: ${data.whatsapp}`;
    
    switch (data.product_type) {
      case 'lms':
        return `${base}\n\n*Status:* Menunggu Verifikasi Admin (Armilla LMS).`;
      case 'siput':
        return `${base}\n\n*Status:* Menunggu Verifikasi Admin (SIPUT PAUD).`;
      case 'scanbite':
        return `${base}\n\n*Status:* Menunggu Konfigurasi QR Menu (ScanBite).`;
      default:
        return `${base}\n\n*Status:* Segera dihubungi tim support.`;
    }
  };

  try {
    // Notifikasi ke Anda (Admin)
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: FONNTE_TOKEN },
      body: new URLSearchParams({
        target: 'NOMOR_WA_ANDA', // Isi dengan nomor Anda
        message: getWaMessage(formData),
      }),
    });

    // Notifikasi ke Pelanggan
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: FONNTE_TOKEN },
      body: new URLSearchParams({
        target: formData.whatsapp,
        message: `Halo ${formData.full_name}, pendaftaran Anda di Rasyatech sudah kami terima. Tim kami akan segera menghubungi Anda. Terima kasih!`,
      }),
    });
  } catch (error) {
    console.error('Gagal mengirim WA:', error);
  }
};
