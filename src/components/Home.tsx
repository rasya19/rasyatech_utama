import { useState, useEffect } from 'react';
import { 
  Laptop, 
  Settings, 
  ShoppingBag, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  Phone, 
  Clock, 
  ChevronRight, 
  Menu, 
  X, 
  CheckCircle2,
  Cpu,
  Monitor,
  Wrench,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Dynamic Data
  const [dbConfig, setDbConfig] = useState<any>(null);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbLaptops, setDbLaptops] = useState<any[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Fetch Data
    const fetchData = async () => {
        const { data: config } = await supabase.from('settings').select('*').eq('id', 'config').maybeSingle();
        if (config) setDbConfig(config);

        const { data: services } = await supabase.from('services').select('*');
        if (services) setDbServices(services);

        const { data: laptops } = await supabase.from('laptops').select('*');
        if (laptops) setDbLaptops(laptops);
    };
    fetchData();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fallback defaults
  const displayServices = dbServices.length > 0 ? dbServices : [
    { title: "Instalasi Software", description: "Instal ulang Windows, driver, aplikasi desain, office, dan optimasi performa laptop Anda.", icon: <Monitor className="w-8 h-8" />, color: "bg-indigo-50 text-indigo-600" },
    { title: "Service Hardware", description: "Perbaikan hardware laptop, ganti keyboard, layar pecah, engsel rusak, hingga servis mesin/motherboard.", icon: <Wrench className="w-8 h-8" />, color: "bg-yellow-50 text-yellow-600" },
    { title: "Jual Beli Laptop", description: "Terima tukar tambah, jual laptop baru dan bekas berkualitas dengan garansi terpercaya.", icon: <Package className="w-8 h-8" />, color: "bg-slate-50 text-slate-800" }
  ];

  const displayLaptops = dbLaptops.length > 0 ? dbLaptops : [
    { name: "MacBook Air M1", price: "Rp 10.xxx.xxx", image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=800", isAvailable: true },
    { name: "Asus ROG Strix", price: "Rp 12.xxx.xxx", image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=800", isAvailable: true },
    { name: "Lenovo ThinkPad", price: "Rp 5.xxx.xxx", image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=800", isAvailable: true },
    { name: "Dell XPS 13", price: "Rp 15.xxx.xxx", image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=800", isAvailable: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav id="nav" className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg py-3' : 'bg-white/95 backdrop-blur-sm shadow-sm py-5 border-b border-indigo-50'}`}>
        <div className="max-w-7xl mx-auto px-10 flex justify-between items-center text-slate-900 border-none">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
              <span className="text-white font-black text-xl">RC</span>
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Rasya<span className="text-indigo-600">Comp</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-semibold">
            <a href="#hero" className="text-slate-600 hover:text-indigo-600 transition-colors relative group">
              Beranda
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
            </a>
            <a href="#services" className="text-slate-600 hover:text-indigo-600 transition-colors relative group">
              Servis
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
            </a>
            <a href="#products" className="text-slate-600 hover:text-indigo-600 transition-colors relative group">
              Katalog
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
            </a>
            <a 
              href={`https://wa.me/${dbConfig?.whatsapp || '6281234567890'}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-yellow-400 px-6 py-2.5 rounded-full font-bold text-slate-900 shadow-lg shadow-yellow-200 hover:bg-yellow-300 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Hubungi Kami
            </a>
          </div>

          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[60] bg-white pt-24 px-10 md:hidden"
          >
            <div className="flex flex-col gap-8 text-2xl font-black tracking-tight">
              <a href="#hero" onClick={() => setIsMenuOpen(false)}>Beranda</a>
              <a href="#services" onClick={() => setIsMenuOpen(false)}>Layanan</a>
              <a href="#products" onClick={() => setIsMenuOpen(false)}>Unit Tersedia</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)}>Lokasi</a>
              <a 
                href={`https://wa.me/${dbConfig?.whatsapp || '6281234567890'}`}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-center shadow-xl shadow-indigo-200"
              >
                Chat Sekarang
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section */}
        <section id="hero" className="relative md:min-h-screen flex items-center bg-white overflow-hidden pt-32 md:pt-48 border-none">
          <div className="max-w-7xl mx-auto px-10 grid grid-cols-12 gap-0 w-full items-center pt-8 pb-20 md:py-0 border-none">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="col-span-12 lg:col-span-7 pr-0 lg:pr-12"
            >
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full w-fit mb-8">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold tracking-wide uppercase">Solusi Laptop Terpercaya</span>
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 leading-[1.1] mb-8">
                {dbConfig?.heroTitle || 'Laptop Bermasalah?'} <br/>
                <span className="text-indigo-600">Biar Kami Tangani.</span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed">
                Spesialis instalasi OS, servis hardware, hingga jual-beli laptop bekas berkualitas tinggi. Cepat, Bergaransi, dan Transparan.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-4 bg-slate-900 text-white p-5 rounded-3xl shadow-xl">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
                  <div>
                    <div className="font-bold text-lg leading-tight">Servis Kilat</div>
                    <div className="text-slate-400 text-sm">Mulai dari 1 Jam Jadi</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-indigo-600 text-white p-5 rounded-3xl shadow-xl shadow-indigo-200">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">💻</div>
                  <div>
                    <div className="font-bold text-lg leading-tight">Tukar Tambah</div>
                    <div className="text-indigo-100 text-sm">Harga Terbaik Pasar</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block col-span-5 relative"
            >
              <div className="bg-indigo-700 p-12 rounded-[48px] relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400 rounded-full translate-y-1/2 -translate-x-1/2 opacity-20"></div>
                
                <div className="relative space-y-6 z-10">
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 hover:scale-[1.02] transition-transform">
                    <div className="text-3xl mb-3">⚙️</div>
                    <h3 className="text-white font-bold text-xl mb-1">Instalasi & Software</h3>
                    <p className="text-indigo-100 text-sm">Windows 10/11, Software Desain, & Game.</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 hover:scale-[1.02] transition-transform">
                    <div className="text-3xl mb-3">🛠️</div>
                    <h3 className="text-white font-bold text-xl mb-1">Hardware Service</h3>
                    <p className="text-indigo-100 text-sm">Ganti LCD, Keyboard, Baterai, & Motherboard.</p>
                  </div>
                  <div className="bg-yellow-400 p-6 rounded-3xl border border-white/20 hover:scale-[1.02] transition-transform shadow-lg shadow-yellow-500/20">
                    <div className="text-3xl mb-3">💰</div>
                    <h3 className="text-slate-900 font-bold text-xl mb-1">Jual Beli Laptop</h3>
                    <p className="text-slate-700 text-sm">Terima laptop bekas segala kondisi harga jujur.</p>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/20 flex items-center justify-between relative z-10">
                  <div>
                    <div className="text-white font-black text-4xl leading-none">1.5k+</div>
                    <div className="text-indigo-200 text-xs uppercase font-bold tracking-widest mt-1">Laptop Teratasi</div>
                  </div>
                  <div>
                    <div className="text-white font-black text-4xl leading-none">100%</div>
                    <div className="text-indigo-200 text-xs uppercase font-bold tracking-widest mt-1">Aman & Garansi</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services / Categories */}
        <section id="services" className="py-24 bg-slate-50 border-none">
          <div className="max-w-7xl mx-auto px-10">
            <div className="text-center md:text-left mb-16">
              <div className="h-1.5 w-24 bg-indigo-600 mb-6 mx-auto md:mx-0"></div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">Layanan Spesialis Kami</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {displayServices.map((service, idx) => (
                <div 
                  key={idx}
                  className="bg-white p-10 rounded-[32px] shadow-sm hover:shadow-2xl transition-all border border-slate-100 group"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-3xl group-hover:scale-110 transition-transform ${typeof service.icon === 'string' ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {typeof service.icon === 'string' ? <Monitor /> : service.icon}
                  </div>
                  <h4 className="text-2xl font-black mb-4 text-slate-900">{service.title}</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Catalog Section */}
        <section id="products" className="py-24 bg-white border-none">
          <div className="max-w-7xl mx-auto px-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <div className="h-1.5 w-16 bg-yellow-400 mb-6 transition-all duration-500 ease-in-out"></div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900">Unit Pilihan Terbaru</h2>
              </div>
              <button className="text-indigo-600 font-black flex items-center gap-2 group text-lg">
                Lihat Katalog Lengkap 
                <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayLaptops.map((laptop, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-6 shadow-md group-hover:shadow-indigo-100 group-hover:shadow-2xl transition-all">
                    <img 
                      src={laptop.image} 
                      alt={laptop.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                       <button className="w-full py-4 bg-yellow-400 text-slate-900 font-black rounded-2xl shadow-xl">
                          Check Detail
                       </button>
                    </div>
                    <div className={`absolute top-6 left-6 ${laptop.isAvailable ? 'bg-white/90 shadow-sm' : 'bg-red-500 text-white'} backdrop-blur px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest`}>
                      {laptop.isAvailable ? 'Available' : 'Sold Out'}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-xl mb-1 text-slate-900">{laptop.name}</h4>
                    <p className="text-indigo-600 font-black text-lg italic tracking-tight">{laptop.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact/CTA */}
        <section id="contact" className="py-24 bg-indigo-600 text-white overflow-hidden relative border-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/10 rounded-full -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-10 relative z-10 text-center md:text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Siap Servis<br/>Hari Ini?</h2>
                <p className="text-xl text-indigo-100 mb-12 max-w-lg">
                  Konsultasikan gratis masalah laptop Anda. Kami berikan diagnosa jujur dan estimasi biaya transparan.
                </p>
                <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                  <a href={`https://wa.me/${dbConfig?.whatsapp || '6281234567890'}`} className="px-10 py-5 bg-yellow-400 text-slate-900 font-extrabold rounded-3xl text-xl shadow-2xl hover:bg-yellow-300 transition-all flex items-center gap-3">
                    <Phone className="w-6 h-6" /> Chat WhatsApp
                  </a>
                  <div className="flex flex-col justify-center">
                    <span className="font-black text-2xl leading-none">{dbConfig?.whatsapp || '0812-3456-7890'}</span>
                    <span className="text-indigo-200 text-sm font-bold uppercase tracking-widest mt-1 italic">Fast Response</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-[40px] p-8 md:p-12 text-slate-900 shadow-3xl">
                <h3 className="text-3xl font-black mb-8">Lokasi Kami</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                      <MapPin />
                    </div>
                    <div>
                      <p className="font-black text-xl">RasyaComp Pusat</p>
                      <p className="text-slate-500 font-medium">{dbConfig?.address || 'Jl. Pemuda No. 45, Jakarta Timur'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                      <Clock />
                    </div>
                    <div>
                      <p className="font-black text-xl">Jam Buka</p>
                      <p className="text-slate-500 font-medium">{dbConfig?.openingHours || 'Setiap Hari: 09:00 - 20:00 WIB'}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-10 rounded-3xl overflow-hidden h-48 bg-slate-100 grayscale hover:grayscale-0 transition-all cursor-pointer border border-slate-200 flex items-center justify-center text-slate-400 font-bold italic">
                   [ Google Maps Preview ]
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-10 px-10 border-t border-white/5 border-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-xs text-slate-500 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
               <span className="text-white text-lg tracking-tight">Rasya<span className="text-indigo-500">Comp</span></span>
             </div>
             <span className="h-4 w-px bg-white/10 hidden md:block"></span>
             <span>{dbConfig?.address || 'Jl. Pemuda No. 45, Jakarta'}</span>
          </div>
          
          <div className="flex gap-8 text-center md:text-right">
            <span className="hover:text-white transition-colors cursor-pointer">Instagram: @rasyacomp</span>
            <span className="hover:text-white transition-colors cursor-pointer hidden sm:block">Facebook: Rasya Comp Tech</span>
            <span>© {new Date().getFullYear()} All Rights Reserved</span>
          </div>
        </div>
      </footer>
      
      {/* Admin Link (Hidden/Secretive) */}
      <div className="fixed bottom-4 left-4 opacity-0 hover:opacity-10 transition-opacity">
        <Link to="/admin" className="text-[10px] text-slate-400">Admin</Link>
      </div>

      {/* Fixed WA Mobile Button */}
      <a 
        href={`https://wa.me/${dbConfig?.whatsapp || '6281234567890'}`}
        className="fixed bottom-8 right-8 z-[70] md:hidden w-16 h-16 bg-yellow-400 text-slate-900 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-all border-4 border-white"
      >
        <Phone className="w-8 h-8" />
      </a>
    </div>
  );
}
