import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'ismanto095@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, fullName, businessName, product, portalUrl } = req.body || {};

  if (!email || !portalUrl) {
    return res.status(400).json({ error: 'email dan portalUrl wajib' });
  }

  if (!process.env.EMAIL_PASS) {
    return res.status(200).json({ skipped: true, message: 'EMAIL_PASS tidak dikonfigurasi' });
  }

  try {
    await transporter.sendMail({
      from: '"Rasyatech Support" <ismanto095@gmail.com>',
      to: String(email),
      subject: `Pendaftaran ${businessName || 'Tenant'} Disetujui — ${product || 'Rasyatech'}`,
      text:
        `Halo ${fullName || 'Admin'},\n\n` +
        `Pendaftaran Anda untuk ${businessName} (${product}) telah DISETUJUI.\n\n` +
        `Portal tenant Anda:\n${portalUrl}\n\n` +
        `Gunakan link di atas untuk mengakses sistem. Jangan membuka domain utama jika Anda adalah pengguna tenant.\n\n` +
        `Salam,\nRasyatech Support`,
    });

    return res.status(200).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal kirim email';
    return res.status(500).json({ error: message });
  }
}
