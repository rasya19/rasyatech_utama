import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';

const NativeAd = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && containerRef.current.childNodes.length === 0) {
      const script = document.createElement('script');
      script.src = "https://pl29415828.profitablecpmratenetwork.com/26c89f0fdb85ab44e206cf5063565f75/invoke.js";
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="native-ad-wrapper" style={{ padding: '40px 10%', display: 'flex', justifyContent: 'center', background: '#fff' }}>
      <div ref={containerRef} id="container-26c89f0fdb85ab44e206cf5063565f75" style={{ width: '100%', minHeight: '100px' }}></div>
    </div>
  );
};

const BannerAd = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && containerRef.current.childNodes.length === 0) {
      const conf = document.createElement('script');
      conf.innerHTML = `
        window.atOptions = {
          'key' : '3bae6710c4aa9be96222d65a398c7bfc',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      
      const script = document.createElement('script');
      script.src = "https://www.highperformanceformat.com/3bae6710c4aa9be96222d65a398c7bfc/invoke.js";
      script.async = true;

      containerRef.current.appendChild(conf);
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="banner-ad-wrapper" style={{ display: 'flex', justifyContent: 'center', margin: '40px 0', width: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '728px', minHeight: '90px' }}>
        {/* Ad will load here */}
      </div>
    </div>
  );
};

export default function RasyatechLanding() {
  const [payments, setPayments] = useState<any>({
    bankBcaProvider: 'BCA',
    bankBca: '1234567890',
    bankMandiriProvider: 'Mandiri',
    bankMandiri: '0987654321',
    eWallet: '081918226387',
    bankBcaName: 'PT Rasyatech Digital',
    bankMandiriName: 'PT Rasyatech Digital',
    eWalletName: 'Admin Rasyatech'
  });
  const [config, setConfig] = useState<any>({ 
    whatsapp: '6281918226387', 
    address: 'Mekarwangi, Kuningan - Jawa Barat', 
    heroTitle: 'Transformasi Digital Masa Depan', 
    heroSubtitle: 'Solusi Manajemen Sekolah (LMS) Terintegrasi, Jasa Service IT, dan Web Development Profesional berbasis di Mekarwangi, Kuningan.' 
  });
  const [laptops, setLaptops] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [showPayment, setShowPayment] = useState(false);
  const [showDaftarDropdown, setShowDaftarDropdown] = useState(false);

  useEffect(() => {
    // // Listen to Payments from Firestore
    // const unsubPayments = onSnapshot(doc(db, 'settings', 'payments'), (snap) => {
    //   if (snap.exists()) {
    //     setPayments((prev: any) => ({ ...prev, ...snap.data() }));
    //   }
    // }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/payments'));
    // 
    // // Listen to Config from Firestore
    // const unsubConfig = onSnapshot(doc(db, 'settings', 'config'), (snap) => {
    //   if (snap.exists()) {
    //     setConfig((prev: any) => ({ ...prev, ...snap.data() }));
    //   }
    // }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/config'));
    // 
    // // Listen to Laptops
    // const unsubLaptops = onSnapshot(collection(db, 'laptops'), (snap) => {
    //   const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //   setLaptops(list);
    // }, (err) => handleFirestoreError(err, OperationType.GET, 'laptops'));
    // 
    // // Listen to Ads
    // const unsubAds = onSnapshot(collection(db, 'ads'), (snap) => {
    //   const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //   setAds(list.filter((ad: any) => ad.isActive));
    // }, (err) => handleFirestoreError(err, OperationType.GET, 'ads'));
    // 
    // // Listen to Products
    // const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
    //   const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //   setProducts(list);
    // }, (err) => handleFirestoreError(err, OperationType.GET, 'products'));
    // 
    // // Listen to Affiliates
    // const unsubAffiliates = onSnapshot(collection(db, 'affiliates'), (snap) => {
    //   const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //   setAffiliates(list);
    // }, (err) => handleFirestoreError(err, OperationType.GET, 'affiliates'));
    // 
    // // Visitor Count Logic
    // const visitorRef = doc(db, 'stats', 'visitors');
    // const hasVisited = sessionStorage.getItem('rasyatech_visited');
    // 
    // if (!hasVisited) {
    //   const updateCount = async () => {
    //     try {
    //       const snap = await getDoc(visitorRef);
    //       if (!snap.exists()) {
    //         await setDoc(visitorRef, { count: 1 });
    //       } else {
    //         await updateDoc(visitorRef, { count: increment(1) });
    //       }
    //       sessionStorage.setItem('rasyatech_visited', 'true');
    //     } catch (e) {
    //       console.error("Error updating visitor count", e);
    //     }
    //   };
    //   updateCount();
    // }
    // 
    // // Listen to Visitor Count
    // const unsubStats = onSnapshot(visitorRef, (snap) => {
    //   if (snap.exists()) {
    //     setVisitorCount(snap.data().count || 0);
    //   }
    // });
    // 
    // return () => {
    //   unsubPayments();
    //   unsubConfig();
    //   unsubLaptops();
    //   unsubAds();
    //   unsubProducts();
    //   unsubAffiliates();
    //   unsubStats();
    // };
  }, []);

  useEffect(() => {
    const checkSchema = async () => {
      const { data, error } = await supabase.from('registrations').select('*').limit(1);
      if (data && data.length > 0) {
        console.log("DEBUG: Existing registration schema:", Object.keys(data[0]));
      } else {
        console.log("DEBUG: No existing registrations found or table empty.");
      }
      if (error) console.error("DEBUG: Schema check error:", error);
    };
    checkSchema();
  }, []);

  const selectPackage = (pkg: string, type: 'Annual' | 'Monthly' = 'Annual') => {
    const select = document.getElementById('packageSelect') as HTMLSelectElement;
    if (select) {
      if (pkg === 'Silver') {
        select.value = type === 'Annual' ? 'Silver (Annual Promo)' : 'Silver Monthly';
      } else if (pkg === 'Gold') {
        select.value = type === 'Annual' ? 'Gold (Annual Promo)' : 'Gold Monthly';
      } else if (pkg === 'Platinum') {
        select.value = 'Platinum';
      }
      
      const daftarSection = document.getElementById('daftar');
      daftarSection?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const formData = new FormData(target);
    const pkg = formData.get('package') as string;
    const school = formData.get('school_name') as string;
    const addr = formData.get('address') as string;
    const email = formData.get('email') as string;
    const waNumber = formData.get('wa_number') as string;
    const pass = formData.get('password') as string;
    const refCode = (formData.get('referral_code') as string || '').toUpperCase();
    
    let affiliateEmail = '';
    if (refCode) {
      const affiliate = affiliates.find(a => a.referralCode?.toUpperCase() === refCode);
      if (affiliate) {
        affiliateEmail = affiliate.email || '';
      }
    }
    
    // Calculate tentative expiry
    const contractStart = new Date().toISOString().split('T')[0];
    const contractEnd = new Date();
    if (pkg.includes('Annual')) {
      contractEnd.setFullYear(contractEnd.getFullYear() + 1);
    } else {
      contractEnd.setMonth(contractEnd.getMonth() + 1);
    }
   const contractEndDate = contractEnd.toISOString().split('T')[0];

  // 1. Buat pembaca data form HTML yang aktif
  const currentForm = e.currentTarget as HTMLFormElement;

  // 2. Susun data pendaftaran dengan mengambil langsung dari name HTML
  const registrationData: any = {
    school_name: school,
    admin_email: email,
    admin_name: school,
    whatsapp: waNumber,
    npsn: (currentForm.elements.namedItem('npsn') as HTMLInputElement)?.value || '-',
    subdomain: (currentForm.elements.namedItem('subdomain') as HTMLInputElement)?.value || '',
    password: (currentForm.elements.namedItem('password') as HTMLInputElement)?.value || '',
    status: 'pending',
    is_approved: false
  };

    console.log("Attempting registration with data:", registrationData);

    // Prepare WhatsApp message
    let promoText = "";
    if (pkg.includes("Annual Promo")) {
        promoText = `Saya tertarik dengan Promo Tahunan Paket ${pkg.split(' ')[0]}.%0A`;
    } else if (pkg.includes("Monthly")) {
        promoText = `Saya tertarik dengan Paket Bulanan ${pkg.split(' ')[0]}.%0A`;
    }

    const message = `Halo Rasyatech,%0A%0ASelamat Siang.%0A%0A${promoText}Saya ingin mendaftarkan sekolah baru:%0A` +
                    `Paket: ${pkg}%0A` +
                    `Nama Sekolah: ${school}%0A` +
                    `Alamat: ${addr}%0A` +
                    `Email Admin: ${email}%0A` +
                    `Password Request: ${pass}%0A%0A` +
                    `Mohon diproses untuk pembuatan akun admin sekolah kami. Terima kasih.`;
    
    // Redirect to WhatsApp immediately for better UX
    window.open(`https://wa.me/${config.whatsapp || '6281918226387'}?text=${message}`, '_blank');
    
    // Perform database insertion in the background
    supabase.from('registrations').insert([registrationData]).then(({ data, error }) => {
      if (error) {
        console.error("Supabase insertion failed in background:", error);
      } else {
        console.log("Supabase insertion successful:", data);
      }
    });

    setShowPayment(true);
    target.reset();
    
    setTimeout(() => {
      document.getElementById('payment')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    alert('Pendaftaran berhasil dikirim! Silakan ikuti instruksi pembayaran di bawah.');
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Teks berhasil disalin: ' + text);
    });
  };

  return (
    <div>
      <Helmet>
        <title>Rasyatech | Solusi IT & Digitalisasi Sekolah Kuningan</title>
        <meta name="description" content={config.heroSubtitle || "Solusi Manajemen Sekolah (LMS) Terintegrasi, Jasa Service IT, dan Web Development Profesional berbasis di Mekarwangi, Kuningan."} />
        <meta name="keywords" content="Rasyatech, LMS Sekolah, Jasa Service IT Kuningan, Web Development Kuningan, Digitalisasi Sekolah, Software Manajemen Sekolah" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rasyatech.my.id/" />
        <meta property="og:title" content="Rasyatech | Solusi IT & Digitalisasi Sekolah Kuningan" />
        <meta property="og:description" content={config.heroSubtitle || "Solusi Manajemen Sekolah (LMS) Terintegrasi, Jasa Service IT, dan Web Development Profesional berbasis di Mekarwangi, Kuningan."} />
        <meta property="og:image" content="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&q=80" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://rasyatech.my.id/" />
        <meta property="twitter:title" content="Rasyatech | Solusi IT & Digitalisasi Sekolah Kuningan" />
        <meta property="twitter:description" content={config.heroSubtitle || "Solusi Manajemen Sekolah (LMS) Terintegrasi, Jasa Service IT, dan Web Development Profesional berbasis di Mekarwangi, Kuningan."} />
        <meta property="twitter:image" content="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1200&q=80" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Rasyatech",
            "description": "Solusi Manajemen Sekolah (LMS) Terintegrasi, Jasa Service IT, dan Web Development Profesional.",
            "url": "https://rasyatech.my.id/",
            "telephone": config.whatsapp || "+6281918226387",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Mekarwangi",
              "addressLocality": "Kuningan",
              "addressRegion": "Jawa Barat",
              "addressCountry": "ID"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": -7.0006764,
              "longitude": 108.4908077
            },
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
              ],
              "opens": "08:00",
              "closes": "17:00"
            }
          })}
        </script>
      </Helmet>

      <nav>
        <div className="logo">RASYATECH</div>
        <div className="nav-links" style={{ gap: '25px', display: 'flex', alignItems: 'center' }}>
          <a href="#about">Tentang</a>
          <a href="#layanan">Layanan</a>
          {ads.length > 0 && <a href="#ads">Promo</a>}
          <a href="#inventory">Unit Laptop</a>
          <a href="#shop">Katalog Produk</a>
          <a href="#paket">Paket</a>
          <div className="relative group" style={{ position: 'relative' }}>
            <button 
              onMouseEnter={() => setShowDaftarDropdown(true)}
              onClick={() => setShowDaftarDropdown(!showDaftarDropdown)}
              className="btn-daftar" 
              style={{ marginLeft: '10px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              Daftar
              <svg className={`w-4 h-4 transition-transform ${showDaftarDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            {showDaftarDropdown && (
              <div 
                onMouseLeave={() => setShowDaftarDropdown(false)}
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  background: 'white', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                  padding: '10px', 
                  minWidth: '200px', 
                  marginTop: '10px',
                  zIndex: 1001,
                  border: '1px solid #f1f2f6'
                }}
              >
                <a 
                  href="#daftar" 
                  onClick={() => setShowDaftarDropdown(false)}
                  style={{ display: 'block', padding: '12px 15px', color: 'var(--navy)', textDecoration: 'none', fontWeight: 700, borderRadius: '8px', marginBottom: '5px' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  🚀 Daftar Paket LMS
                </a>
                <a 
                  href={`https://wa.me/${config.whatsapp || '6281918226387'}?text=Halo%20Rasyatech,%20saya%20ingin%20mendaftar%20sebagai%20Mitra%20Affiliasi.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowDaftarDropdown(false)}
                  style={{ display: 'block', padding: '12px 15px', color: 'var(--navy)', textDecoration: 'none', fontWeight: 700, borderRadius: '8px' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  🤝 Daftar Mitra Affiliasi
                </a>
                <Link 
                  to="/affiliate/portal"
                  style={{ display: 'block', padding: '12px 15px', color: 'var(--navy)', textDecoration: 'none', fontWeight: 700, borderRadius: '8px', borderTop: '1px solid #f1f2f6', marginTop: '5px' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#f8f9fa')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  📊 Portal Mitra (Login)
                </Link>
              </div>
            )}
          </div>
          <Link to="/admin" className="btn-login" style={{ marginLeft: '5px' }}>Portal Admin</Link>
        </div>
      </nav>

      <section className="hero">
        <h1>{config.heroTitle || 'Transformasi Digital Masa Depan'}</h1>
        <p>{config.heroSubtitle || 'Solusi Manajemen Sekolah (LMS) Terintegrasi, Jasa Service IT, dan Web Development Profesional berbasis di Mekarwangi, Kuningan.'}</p>
        <div>
          <a href="#layanan" style={{ background: 'var(--gold)', color: 'var(--navy)', padding: '15px 30px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>Eksplorasi Layanan</a>
        </div>
      </section>

      <BannerAd />

      {ads.length > 0 && (
        <section id="ads" className="ads-container" style={{ padding: '0 10%', background: '#f8f9fa' }}>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', padding: '20px 0', scrollbarWidth: 'none' }}>
            {ads.map((ad) => (
              <a 
                key={ad.id} 
                href={ad.link || '#'} 
                target={ad.link ? "_blank" : "_self"} 
                rel="noopener noreferrer"
                style={{ flex: '0 0 auto', width: '300px', display: 'block', textDecoration: 'none' }}
              >
                <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', background: 'white' }}>
                  <img src={ad.image} alt={ad.title} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                  <div style={{ padding: '15px' }}>
                    <p style={{ margin: 0, fontWeight: 800, color: 'var(--navy)', fontSize: '0.9rem' }}>{ad.title}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section id="layanan" className="services">
        <h2>Layanan Unggulan Kami</h2>
        <div className="service-grid">
          <div className="card">
            <h3>LMS Rasyatech</h3>
            <p>Sistem manajemen sekolah modern untuk semua jenjang dan instansi pendidikan lainnya.</p>
          </div>
          <div className="card">
            <h3>Servis IT & Komputer</h3>
            <p>Perbaikan hardware, laptop, dan pemeliharaan jaringan kantor oleh tenaga ahli Rasyacomp.</p>
          </div>
          <div className="card">
            <h3>Web Development</h3>
            <p>Pembuatan website profil sekolah atau bisnis dengan teknologi PWA dan Next.js.</p>
          </div>
        </div>
      </section>

      {laptops.length > 0 && (
        <section id="inventory" className="inventory-section" style={{ padding: '80px 10%', background: '#fff' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--navy)', fontVariant: 'small-caps' }}>Laptop Second Berkualitas</h2>
          <p style={{ textAlign: 'center', marginBottom: '40px', color: '#666' }}>Dapatkan unit laptop pilihan dengan kondisi prima dan garansi toko dari Rasyacomp.</p>
          
          <div className="laptop-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
            {laptops.map((laptop) => (
              <div key={laptop.id} className="laptop-card" style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f1f2f6', transition: 'transform 0.3s' }}>
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  <img src={laptop.image || 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=60'} alt={laptop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '25px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy)' }}>{laptop.name}</h3>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '4px 10px', 
                      borderRadius: '50px', 
                      fontWeight: 900, 
                      textTransform: 'uppercase',
                      background: laptop.isAvailable ? '#e8f7ef' : '#ffebee',
                      color: laptop.isAvailable ? '#27ae60' : '#e74c3c'
                    }}>
                      {laptop.isAvailable ? 'Ready' : 'Sold'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--gold)', fontWeight: 900, fontSize: '1.3rem', margin: '15px 0' }}>{laptop.price}</p>
                  <a 
                    href={`https://wa.me/${config.whatsapp || '6281918226387'}?text=Halo%20Rasyatech,%20saya%20tertarik%20dengan%20unit%20laptop%20${laptop.name}%20yang%20seharga%20${laptop.price}. apakah masih tersedia?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      background: 'var(--navy)', 
                      color: 'white', 
                      padding: '12px', 
                      borderRadius: '10px', 
                      textDecoration: 'none', 
                      fontWeight: 700,
                      marginTop: '20px'
                    }}
                  >
                    Tanya Admin
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="shop" className="products-section" style={{ padding: '80px 10%', background: '#f8f9fa' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: 'var(--navy)' }}>Katalog Aksesoris & Hardware</h2>
        <p style={{ textAlign: 'center', marginBottom: '40px', color: '#666' }}>Part laptop, aksesoris komputer, dan perangkat keras lainnya tersedia di RasyaComp.</p>
        
        {products.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {products.map((p) => (
              <div key={p.id} style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.02)', border: '1px solid #eee' }}>
                <div style={{ height: '160px', overflow: 'hidden' }}>
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '15px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'white', background: 'var(--navy)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{p.category}</span>
                  <h4 style={{ margin: '8px 0 4px', fontSize: '1rem', fontWeight: 800 }}>{p.name}</h4>
                  <p style={{ color: 'var(--gold)', fontWeight: 800, margin: '8px 0' }}>{p.price}</p>
                  <a 
                    href={`https://wa.me/${config.whatsapp || '6281918226387'}?text=Halo%20Rasyatech,%20saya%20tertarik%20dengan%20${p.name}%20seharga%20${p.price}.%20apakah%20stok%20tersedia?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', textAlign: 'center', padding: '8px', background: '#f1f2f6', color: 'var(--navy)', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    Beli Sekarang
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '20px', border: '2px dashed #eee' }}>
            <p style={{ color: '#aaa', fontWeight: 600 }}>Produk masih dalam tahap input oleh Admin. Silakan kembali lagi nanti.</p>
          </div>
        )}
      </section>

      <section id="paket" className="pricing">
        <h2>Pilihan Paket LMS Rasyatech</h2>
        <div className="promo-banner-container">
          <a href="https://wa.me/6281918226387?text=Halo%20Rasyatech,%20saya%20tertarik%20dengan%20Promo%20Tahunan:%20Bayar%2010%20Bulan,%20Gratis%202%20Bulan." target="_blank" rel="noopener noreferrer" className="promo-banner">
            🔥 Hemat 20% dengan Pembayaran Tahunan (Bayar 10 Bulan, Gratis 2 Bulan!)
          </a>
        </div>
        <p>Solusi manajemen digital yang dirancang untuk pertumbuhan sekolah Anda.</p>
        <div className="pricing-grid">
          <div className="price-card silver">
            <h4>Silver Package</h4>
            <div className="price">Rp 250.000 <span style={{ fontSize: '1rem', color: '#666' }}>/ Bulan</span></div>
            <div className="annual-price">
              💰 Rp 2.500.000 / Tahun<br />
              <span style={{ fontSize: '0.75rem' }}>(Promo Bayar 10 Bulan)</span>
            </div>
            <div className="monthly-indicator" style={{ background: '#f1f2f6', padding: '10px', borderRadius: '10px', marginTop: '10px', fontSize: '0.85rem' }}>
              📅 Opsi Bulanan Tersedia
            </div>
            <p style={{ fontSize: '0.85rem', color: '#e67e22', fontWeight: 600, marginTop: '-10px' }}>Setup: Rp 500.000 (Sekali)</p>
            <ul>
              <li><strong>Ideal:</strong> Sekolah Kecil / PKBM</li>
              <li><strong>Domain:</strong> Subdomain (.rsch.my.id)</li>
              <li><strong>Penyimpanan:</strong> 2GB Cloud Storage</li>
              <li>Support Email/WA Group</li>
            </ul>
            <button onClick={() => selectPackage('Silver', 'Annual')} style={{ display: 'block', width: '100%', background: 'var(--navy)', color: 'white', padding: '12px', borderRadius: '5px', fontWeight: 700 }}>Pilih Tahunan</button>
            <button onClick={() => selectPackage('Silver', 'Monthly')} style={{ display: 'block', width: '100%', background: 'transparent', color: 'var(--navy)', padding: '10px', borderRadius: '5px', fontWeight: 600, border: '1px solid var(--navy)', marginTop: '10px', fontSize: '0.9rem' }}>Pilih Bulanan</button>
          </div>
          <div className="price-card gold featured">
            <div className="badge">Terpopuler</div>
            <h4>Gold Package</h4>
            <div className="price">Rp 500.000 <span style={{ fontSize: '1rem', color: '#666' }}>/ Bulan</span></div>
            <div className="annual-price">
              💰 Rp 5.000.000 / Tahun<br />
              <span style={{ fontSize: '0.75rem' }}>(Promo Bayar 10 Bulan)</span>
            </div>
            <div className="monthly-indicator" style={{ background: '#f1f2f6', padding: '10px', borderRadius: '10px', marginTop: '10px', fontSize: '0.85rem' }}>
              📅 Opsi Bulanan Tersedia
            </div>
            <p style={{ fontSize: '0.85rem', color: '#e67e22', fontWeight: 600, marginTop: '-10px' }}>Setup: Rp 1.000.000 (Sekali)</p>
            <ul>
              <li><strong>Ideal:</strong> SMK / SMA / SMP</li>
              <li><strong>Domain:</strong> Subdomain (.rsch.my.id)</li>
              <li><strong>Penyimpanan:</strong> 10GB Cloud Storage</li>
              <li>Prioritas Jam Kerja</li>
            </ul>
            <button onClick={() => selectPackage('Gold', 'Annual')} style={{ display: 'block', width: '100%', background: 'var(--gold)', color: 'var(--navy)', padding: '12px', borderRadius: '5px', fontWeight: 700 }}>Pilih Tahunan</button>
            <button onClick={() => selectPackage('Gold', 'Monthly')} style={{ display: 'block', width: '100%', background: 'transparent', color: 'var(--navy)', padding: '10px', borderRadius: '5px', fontWeight: 600, border: '1px solid var(--navy)', marginTop: '10px', fontSize: '0.9rem' }}>Pilih Bulanan</button>
          </div>
          <div className="price-card platinum">
            <h4>Platinum Package</h4>
            <div className="price">Custom</div>
            <div className="annual-price" style={{ background: '#f1f2f6', color: '#2f3542', borderColor: '#ced6e0' }}>
              💎 Paket Eksklusif<br />
              <span style={{ fontSize: '0.75rem' }}>Sesuai Kebutuhan Besar</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#e67e22', fontWeight: 600, marginTop: '-10px' }}>Setup: Custom Setup</p>
            <ul>
              <li><strong>Ideal:</strong> Yayasan / Sekolah Besar</li>
              <li><strong>Domain:</strong> Custom Domain (.sch.id)</li>
              <li><strong>Penyimpanan:</strong> Unlimited / Sesuai Server</li>
              <li>24/7 + On-Site Support</li>
            </ul>
            <button onClick={() => selectPackage('Platinum')} style={{ display: 'block', width: '100%', background: 'var(--navy)', color: 'white', padding: '12px', borderRadius: '5px', fontWeight: 700 }}>Hubungi Kami</button>
          </div>
        </div>
      </section>

      <section id="daftar" className="registration">
        <div className="form-container">
          <h2>Pendaftaran Sekolah Baru</h2>
          <p style={{ marginBottom: '2rem', fontSize: '0.9rem', color: '#666' }}>Isi data di bawah ini. Akun Admin akan dikirimkan setelah proses verifikasi oleh tim Rasyatech.</p>
          <form id="regForm" onSubmit={handleRegistration}>
            <div className="form-group">
              <label>Paket yang Diminati</label>
              <select name="package" id="packageSelect" required>
                <option value="">-- Pilih Paket --</option>
                <option value="Silver Monthly">Silver Package (Bulanan - Rp 250k)</option>
                <option value="Silver (Annual Promo)">Silver Package (Promo Tahunan - Rp 2.5jt)</option>
                <option value="Gold Monthly">Gold Package (Bulanan - Rp 500k)</option>
                <option value="Gold (Annual Promo)">Gold Package (Promo Tahunan - Rp 5jt)</option>
                <option value="Platinum">Platinum Package (Custom)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nama Sekolah / Instansi</label>
              <input type="text" name="school_name" required placeholder="Contoh: PKBM Armilla Nusa" />
            </div>
            <div className="form-group">
              <label>NPSN Sekolah</label>
              <input type="text" name="npsn" placeholder="Contoh: P9984421" />
            </div>
            <div className="form-group">
              <label>Alamat Sekolah</label>
              <input type="text" name="address" required placeholder="Contoh: Mekarwangi, Kuningan" />
            </div>
            <div className="form-group">
              <label>Email Utama (Admin)</label>
              <input type="email" name="email" required placeholder="Contoh: admin@sekolah.sch.id" />
            </div>
            <div className="form-group">
              <label>Nomor WhatsApp (Aktif)</label>
              <input type="text" name="wa_number" required placeholder="Contoh: 08123456789" />
            </div>
            <div className="form-group">
              <label>Subdomain LMS yang Diinginkan</label>
              <input type="text" name="subdomain" placeholder="Contoh: armillanusa" />
            </div>
            <div className="form-group">
              <label>Password Admin (Nantinya)</label>
              <input type="password" name="password" required placeholder="Min. 8 Karakter" />
            </div>
            <div className="form-group">
              <label>Kode Referral (Opsional)</label>
              <input type="text" name="referral_code" placeholder="Contoh: MITRA01" />
            </div>
            <button type="submit" className="btn-submit">Kirim Pendaftaran</button>
          </form>
        </div>
      </section>

      <section id="payment" className={`payment-info ${showPayment ? 'active' : ''}`}>
        <h2 style={{ color: 'var(--navy)' }}>Instruksi Pembayaran</h2>
        <p>Silakan lakukan pembayaran sesuai dengan paket yang Anda pilih untuk mengaktifkan akun Admin Sekolah.</p>

        <div className="payment-grid">
          <div className="payment-card">
            <h4>🏧 Transfer Bank</h4>
            <p><strong>Bank {payments.bankBcaProvider || 'BCA'}</strong></p>
            <p>No. Rekening: {payments.bankBca} <button className="copy-btn" onClick={() => copyText(payments.bankBca)}>Salin</button></p>
            <p>a.n. {payments.bankBcaName}</p>
            <hr style={{ margin: '15px 0', border: 0, borderTop: '1px solid #ddd' }} />
            <p><strong>Bank {payments.bankMandiriProvider || 'Mandiri'}</strong></p>
            <p>No. Rekening: {payments.bankMandiri} <button className="copy-btn" onClick={() => copyText(payments.bankMandiri)}>Salin</button></p>
            <p>a.n. {payments.bankMandiriName}</p>
          </div>

          <div className="payment-card">
            <h4>📱 E-Wallet / QRIS</h4>
            <p><strong>DANA / OVO / GoPay</strong></p>
            <p>No. HP: {payments.eWallet} <button className="copy-btn" onClick={() => copyText(payments.eWallet)}>Salin</button></p>
            <p>a.n. {payments.eWalletName}</p>
            <div style={{ marginTop: '15px', background: '#eee', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>QRIS Standar Tersedia</span>
            </div>
          </div>

          <div className="payment-card">
            <h4>💳 Virtual Account</h4>
            <p>Pilih menu Virtual Account pada ATM/M-Banking Anda:</p>
            <p><strong>BCA VA:</strong> 80777 + No. HP</p>
            <p><strong>Mandiri VA:</strong> 90342 + No. HP</p>
            <p><strong>BRI VA:</strong> 128 + No. HP</p>
            <p style={{ fontSize: '0.8rem', color: '#e74c3c', marginTop: '10px' }}>*Konfirmasi otomatis setelah pembayaran.</p>
          </div>
        </div>

        <div style={{ marginTop: '3rem', padding: '2rem', borderRadius: '10px', background: '#fff9e6', border: '1px solid #ffeaa7' }}>
          <p><strong>Setelah Transfer:</strong> Kirim Bukti Pembayaran ke WhatsApp Admin kami untuk percepatan aktivasi server sekolah Anda.</p>
          <a href={`https://wa.me/${config.whatsapp || '6281918226387'}?text=Konfirmasi%20Pembayaran%20Rasyatech`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '10px', background: '#27ae60', color: 'white', padding: '10px 20px', borderRadius: '5px', textDecoration: 'none', fontWeight: 700 }}>Konfirmasi Via WhatsApp</a>
        </div>
      </section>

      <section className="portfolio">
        <h2>Mitra Strategis & Klien</h2>
        <div className="mitra-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', alignItems: 'center', marginTop: '40px' }}>
          <div className="client-logo">PKBM ARMILLA NUSA</div>
          {affiliates.map(af => (
            <a 
              key={af.id} 
              href={af.website || '#'} 
              target={af.website ? "_blank" : "_self"} 
              rel="noopener noreferrer"
              className="client-logo"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
            >
              <img src={af.logo} alt={af.name} style={{ height: '50px', objectFit: 'contain', marginBottom: '10px' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{af.name}</div>
            </a>
          ))}
        </div>
        <p style={{ marginTop: '2rem', color: '#666', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Membangun ekosistem pendidikan digital yang inklusif bersama mitra terpercaya di seluruh daerah.
        </p>
      </section>

      {ads.length > 0 && (
        <section className="ads-container bottom-ads" style={{ padding: '40px 10%', background: 'white' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1rem', color: '#ccc', textTransform: 'uppercase', letterSpacing: '2px' }}>Informasi Terkait</h3>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', padding: '10px 0', scrollbarWidth: 'none' }}>
            {ads.map((ad) => (
              <a 
                key={`${ad.id}-bottom`} 
                href={ad.link || '#'} 
                target={ad.link ? "_blank" : "_self"} 
                rel="noopener noreferrer"
                style={{ flex: '0 0 auto', width: '280px', display: 'block', textDecoration: 'none' }}
              >
                <div style={{ borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.03)', background: '#f8f9fa' }}>
                  <img src={ad.image} alt={ad.title} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                  <div style={{ padding: '12px' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--navy)', fontSize: '0.85rem' }}>{ad.title}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <BannerAd />

      <NativeAd />

      <footer>
        <p><strong>&copy; 2026 Rasyatech</strong></p>
        <div className="contact-info">
          📍 {config.address || 'Mekarwangi, Kuningan - Jawa Barat'}<br />
          📱 WhatsApp: <a href={`https://wa.me/${config.whatsapp || '6281918226387'}`} style={{ color: 'white', textDecoration: 'none' }}>{config.whatsapp || '081918226387'}</a> | ✉ Email: ismanto095@gmail.com
        </div>
        <div style={{ marginTop: '20px', fontSize: '0.75rem', opacity: 0.6 }}>
          👤 Jumlah Pengunjung: {visitorCount.toLocaleString()}
        </div>
      </footer>
    </div>
  );
}
