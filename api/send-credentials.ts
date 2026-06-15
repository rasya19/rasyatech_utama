import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, school_name, subdomain, product } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  try {
    // Konfigurasi email (ganti dengan email kamu)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,  // Ganti dengan email pengirim
        pass: process.env.EMAIL_PASS,  // Ganti dengan password app Gmail
      },
    });

    // Tentukan portal URL berdasarkan produk
    const portalUrl = product === 'siput' 
      ? `https://${subdomain}.siput.rsch.my.id`
      : `https://kesetaraan.rsch.my.id`;

    await transporter.sendMail({
      from: `"SIPUT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Akun ${school_name} Telah Aktif - SIPUT`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #2563eb;">✅ Akun Anda Telah Aktif!</h2>
          <p>Berikut kredensial akses <strong>${school_name}</strong>:</p>
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p><strong>🔗 Portal Akses:</strong><br/>
            <a href="${portalUrl}" style="color: #2563eb;">${portalUrl}</a></p>
            
            <p><strong>📧 Email:</strong><br/>${email}</p>
            
            <p><strong>🔑 Password Sementara:</strong><br/>
            <code style="background: #fff; padding: 8px; display: inline-block; border-radius: 4px;">${password}</code></p>
          </div>
          
          <p>⚠️ <strong>Segera ganti password Anda setelah login pertama kali!</strong></p>
          
          <p>Terima kasih telah menggunakan layanan SIPUT.</p>
          <hr/>
          <p style="font-size: 12px; color: #6b7280;">Pesan ini dikirim otomatis oleh sistem Rasyatech.</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'Email kredensial terkirim' });
  } catch (error: any) {
    console.error('Email error:', error);
    res.status(500).json({ error: error.message });
  }
}
