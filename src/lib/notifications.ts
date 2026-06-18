// lib/notifications.ts

import { buildTenantApprovalMessage } from './tenant-url';

const FONNTE_TOKEN = 'jpRJKUuhWcFdnDFrbLVT'; // Ganti dengan token Anda

export const sendWhatsAppNotification = async (formData: {
  full_name: string;
  product_type: string;
  business_name: string;
  whatsapp: string;
}) => {
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
        target: '081918226387', // Isi dengan nomor Anda
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

/** Notifikasi setelah pendaftaran disetujui — kirim link portal tenant unik. */
export const sendTenantApprovalNotification = async (params: {
  fullName: string;
  businessName: string;
  product: string;
  kodeTenant: string;
  email?: string;
  whatsapp: string;
}): Promise<void> => {
  const { buildTenantApprovalMessage } = await import('./tenant-url');
  const { portalUrl, whatsappText } = buildTenantApprovalMessage({
    fullName: params.fullName,
    businessName: params.businessName,
    product: params.product,
    kodeTenant: params.kodeTenant,
    email: params.email,
  });

  try {
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: FONNTE_TOKEN },
      body: new URLSearchParams({
        target: '081918226387',
        message: `*Tenant Disetujui*\n${params.businessName} (${params.product})\nPortal: ${portalUrl}`,
      }),
    });

    const wa = params.whatsapp.replace(/\D/g, '');
    if (wa) {
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { Authorization: FONNTE_TOKEN },
        body: new URLSearchParams({
          target: wa,
          message: whatsappText,
        }),
      });
    }

    if (params.email) {
      try {
        await fetch('/api/notify-tenant-approved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: params.email,
            fullName: params.fullName,
            businessName: params.businessName,
            product: params.product,
            portalUrl,
          }),
        });
      } catch (emailErr) {
        console.warn('[sendTenantApprovalNotification] email API:', emailErr);
      }
    }
  } catch (error) {
    console.error('Gagal kirim notifikasi approval tenant:', error);
  }
};
