'use client';

import { useState, useEffect, ChangeEvent } from 'react';

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  image: string;
  tag: string;
  description: string;
  addedBy?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface User {
  email: string;
  role: 'admin' | 'seller' | 'buyer';
  isEligibleToUpload: boolean;
}

export default function Home() {
  const adminEmails = ['darlingjude9@gmail.com', 'judecherish233@gmail.com'];

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      title: "Luxury Designer Silk Outfit",
      category: "Fashion & Clothings",
      price: 28500,
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
      tag: "🔥 Hot Fashion",
      description: "Premium quality designer silk gown with elegant finishing."
    },
    {
      id: 2,
      title: "Classic Leather Fashion Handbag",
      category: "Bags & Footwear",
      price: 35000,
      image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
      tag: "✨ New Arrival",
      description: "Handcrafted genuine leather shoulder bag with gold metallic accents."
    },
    {
      id: 3,
      title: "Urban Streetwear Footwear",
      category: "Bags & Footwear",
      price: 42000,
      image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&auto=format&fit=crop&q=80",
      tag: "🟢 In Stock",
      description: "High-top cushioned streetwear sneakers with maximum comfort."
    },
    {
      id: 4,
      title: "Luxury Oud & Floral Perfume Set",
      category: "Female Beauty & Perfumes",
      price: 24500,
      image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80",
      tag: "✨ Hot Deal",
      description: "Long-lasting premium designer fragrance spray."
    },
    {
      id: 5,
      title: "Modern LED Garden & Home Decor Accent",
      category: "Home & Garden Decor",
      price: 18500,
      image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80",
      tag: "🏡 Garden & Home",
      description: "Decorative ambient LED warm light fixture for living rooms and gardens."
    },
    {
      id: 6,
      title: "Multi-Speed Kitchen Blender & Food Processor",
      category: "Kitchen & Appliances",
      price: 32000,
      image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&auto=format&fit=crop&q=80",
      tag: "🍳 Kitchen Utility",
      description: "Heavy-duty electric smoothie blender with stainless steel blades."
    }
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState<'overview' | 'shop' | 'orders' | 'customers' | 'founder' | 'broadcast' | 'settings'>('overview');
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('New product available now!');
  const [broadcastMessage, setBroadcastMessage] = useState('Hello! A new product has just been added to SHOP4EVERYTHING. Check it out now.');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [storeName, setStoreName] = useState('SHOP4EVERYTHING');
  const [storeTagline, setStoreTagline] = useState('Online Varieties, Wares & Decor');
  const [storePrimaryPhone, setStorePrimaryPhone] = useState('2349042797233');
  const [storeBackupPhone, setStoreBackupPhone] = useState('2348066295944');
  const [isDark, setIsDark] = useState(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Eligible Sellers List
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([
    { email: 'darlingjude9@gmail.com', role: 'admin', isEligibleToUpload: true },
    { email: 'judecherish233@gmail.com', role: 'admin', isEligibleToUpload: true },
    { email: 'seller@shop4everything.com', role: 'seller', isEligibleToUpload: false }
  ]);

  // Modals for Upload / Edit / Admin
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);

  // Founder Info
  const [authorName, setAuthorName] = useState('Darlingtina Jude');
  const [authorBio, setAuthorBio] = useState('Welcome to SHOP4EVERYTHING! We bring you top-tier fashion wares, luxury shoes, handcrafted bags, household items, garden decor, and appliances delivered right to your doorstep.');
  const [authorImage, setAuthorImage] = useState('/darlingtina.jpg');

  // New Item Form State (File Upload)
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Fashion & Clothings');
  const [newPrice, setNewPrice] = useState('');
  const [newTag, setNewTag] = useState('🟢 In Stock');
  const [newDesc, setNewDesc] = useState('');
  const [newImageFile, setNewImageFile] = useState<string>('');

  // Edit Item Form State
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Fashion & Clothings');
  const [editPrice, setEditPrice] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImageFile, setEditImageFile] = useState<string>('');

  // Load from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('shop4everything_products');
    if (savedProducts) {
      try { setProducts(JSON.parse(savedProducts)); } catch (e) {}
    }
    const savedCart = localStorage.getItem('shop4everything_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
    const savedUser = localStorage.getItem('shop4everything_user');
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) {}
    }
    const savedUsers = localStorage.getItem('shop4everything_users');
    if (savedUsers) {
      try { setRegisteredUsers(JSON.parse(savedUsers)); } catch (e) {}
    }
    const savedStoreName = localStorage.getItem('shop4everything_store_name');
    if (savedStoreName) setStoreName(savedStoreName);
    const savedStoreTagline = localStorage.getItem('shop4everything_store_tagline');
    if (savedStoreTagline) setStoreTagline(savedStoreTagline);
    const savedPrimaryPhone = localStorage.getItem('shop4everything_primary_phone');
    if (savedPrimaryPhone) setStorePrimaryPhone(savedPrimaryPhone);
    const savedBackupPhone = localStorage.getItem('shop4everything_backup_phone');
    if (savedBackupPhone) setStoreBackupPhone(savedBackupPhone);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('shop4everything_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('shop4everything_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('shop4everything_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('shop4everything_store_name', storeName);
  }, [storeName]);

  useEffect(() => {
    localStorage.setItem('shop4everything_store_tagline', storeTagline);
  }, [storeTagline]);

  useEffect(() => {
    localStorage.setItem('shop4everything_primary_phone', storePrimaryPhone);
  }, [storePrimaryPhone]);

  useEffect(() => {
    localStorage.setItem('shop4everything_backup_phone', storeBackupPhone);
  }, [storeBackupPhone]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('shop4everything-sync') : null;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'refresh') {
        window.location.reload();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'shop4everything-sync-event') {
        window.location.reload();
      }
    };

    channel?.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    return () => {
      channel?.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      channel?.close();
    };
  }, []);

  const categories = [
    'All',
    'Fashion & Clothings',
    'Bags & Footwear',
    'Female Beauty & Perfumes',
    'Home & Garden Decor',
    'Kitchen & Appliances',
    'Electronics & Gadgets'
  ];

  // Helper for converting uploaded file to Data URL
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, setTargetImage: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTargetImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;

    const emailClean = loginEmail.trim().toLowerCase();
    const isAdmin = adminEmails.includes(emailClean);

    const existingUser = registeredUsers.find(u => u.email.toLowerCase() === emailClean);
    const userRole = isAdmin ? 'admin' : (existingUser ? existingUser.role : 'buyer');
    const eligible = isAdmin ? true : (existingUser ? existingUser.isEligibleToUpload : false);

    const loggedUser: User = {
      email: emailClean,
      role: userRole,
      isEligibleToUpload: eligible
    };

    setCurrentUser(loggedUser);
    localStorage.setItem('shop4everything_user', JSON.stringify(loggedUser));

    if (!existingUser) {
      setRegisteredUsers(prev => [...prev, loggedUser]);
    }

    setIsLoginOpen(false);
    setLoginEmail('');
    setLoginPassword('');
    alert(`Welcome back, ${emailClean}! ${isAdmin ? '👑 You have full Admin control.' : ''}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('shop4everything_user');
    alert('Logged out successfully.');
  };

  // Eligibility Manager (Admin action)
  const toggleUserEligibility = (email: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setRegisteredUsers(prev =>
      prev.map(u => {
        if (u.email === email) {
          const updated = !u.isEligibleToUpload;
          return { ...u, isEligibleToUpload: updated, role: updated ? 'seller' : 'buyer' };
        }
        return u;
      })
    );
  };

  // Add Item Handler (Local File Upload)
  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) {
      alert('Please enter title and price!');
      return;
    }

    const item: Product = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      price: parseFloat(newPrice),
      image: newImageFile || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      tag: newTag,
      description: newDesc || 'High quality item.',
      addedBy: currentUser?.email
    };

    setProducts(prev => [item, ...prev]);
    setNewTitle('');
    setNewPrice('');
    setNewImageFile('');
    setNewDesc('');
    setIsUploadOpen(false);
    alert('✅ New item uploaded successfully!');
  };

  // Edit Item Handler
  const startEditingProduct = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditCategory(product.category);
    setEditPrice(product.price.toString());
    setEditTag(product.tag);
    setEditDesc(product.description);
    setEditImageFile(product.image);
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setProducts(prev =>
      prev.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            title: editTitle,
            category: editCategory,
            price: parseFloat(editPrice),
            tag: editTag,
            description: editDesc,
            image: editImageFile || p.image
          };
        }
        return p;
      })
    );

    setEditingProduct(null);
    alert('✨ Item updated successfully!');
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      setCart(prev => prev.filter(i => i.product.id !== productId));
    }
  };

  // Cart Functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const generateWhatsAppLink = (phoneNumber: string) => {
    if (cart.length === 0) return '#';
    let text = `🛍️ *NEW ORDER FROM SHOP4EVERYTHING*\n------------------------------------\n`;
    cart.forEach((item, index) => {
      text += `${index + 1}. *${item.product.title}*\n   • Qty: ${item.quantity}\n   • Price: ₦${(item.product.price * item.quantity).toLocaleString()}\n`;
    });
    text += `------------------------------------\n💰 *TOTAL AMOUNT: ₦${cartSubtotal.toLocaleString()}*\n\nPlease confirm availability and delivery!`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const canUserUpload = currentUser?.role === 'admin' || currentUser?.isEligibleToUpload;
  const isUserAdmin = currentUser?.role === 'admin';

  const refreshEveryone = (kind: 'upload' | 'settings' | 'broadcast') => {
    if (typeof window === 'undefined') return;

    const payload = { type: kind, timestamp: Date.now() };
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('shop4everything-sync');
        channel.postMessage(payload);
        channel.close();
      }
      localStorage.setItem('shop4everything-sync-event', JSON.stringify(payload));
    } catch (error) {
      console.log('Sync failed', error);
    }

    window.setTimeout(() => window.location.reload(), 300);
  };

  const dashboardMenu = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'shop', label: 'Shop', icon: '🛍️' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'founder', label: 'Founder', icon: '👑' },
    { id: 'broadcast', label: 'Broadcast', icon: '📣' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#090d16' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', transition: 'all 0.3s' }}>
      
      {/* ===== HEADER NAVIGATION ===== */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: isDark ? 'rgba(9, 13, 22, 0.88)' : 'rgba(248, 250, 252, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        padding: '12px 20px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff3366, #00f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem', color: '#fff', boxShadow: '0 4px 15px rgba(255,51,106,0.4)' }}>
              🛍️
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: '900', margin: 0, background: 'linear-gradient(135deg, #ff3366, #00f2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
                {storeName}
              </h1>
              <span style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>{storeTagline}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ flex: 1, maxWidth: '300px', minWidth: '180px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search products..."
              style={{
                width: '100%',
                padding: '8px 16px',
                borderRadius: '30px',
                background: isDark ? 'rgba(0,0,0,0.4)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                color: isDark ? '#fff' : '#000',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Actions & Login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Upload Button for Admin/Eligible Users */}
            {canUserUpload && (
              <button
                onClick={() => setIsUploadOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #00f2fe, #00ff9d)',
                  color: '#000',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '30px',
                  fontWeight: '900',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,242,254,0.3)',
                }}
              >
                ➕ Upload Item
              </button>
            )}

            {/* Admin User Management Button */}
            {isUserAdmin && (
              <button
                onClick={() => setIsUserMgmtOpen(true)}
                style={{
                  background: 'rgba(255, 51, 106, 0.15)',
                  color: '#ff3366',
                  border: '1px solid #ff3366',
                  padding: '8px 14px',
                  borderRadius: '30px',
                  fontWeight: '800',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                👑 User Eligibility
              </button>
            )}

            {/* User Profile / Login Button */}
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isUserAdmin ? '#ff3366' : '#00f2fe' }}>
                  {isUserAdmin ? '👑 Admin:' : '👤'} {currentUser.email.split('@')[0]}
                </span>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: isDark ? '#fff' : '#000',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                  padding: '8px 16px',
                  borderRadius: '30px',
                  fontWeight: '800',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                🔐 Login / Sign In
              </button>
            )}

            <button
              onClick={() => setIsDashboardOpen(true)}
              style={{
                background: 'rgba(0, 242, 254, 0.14)',
                color: '#00f2fe',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                padding: '8px 16px',
                borderRadius: '30px',
                fontWeight: '800',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              ☰ Dashboard
            </button>

            {isUserAdmin && (
              <button
                onClick={() => setIsBroadcastOpen(true)}
                style={{
                  background: 'rgba(255, 51, 106, 0.15)',
                  color: '#ff3366',
                  border: '1px solid #ff3366',
                  padding: '8px 14px',
                  borderRadius: '30px',
                  fontWeight: '800',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                📣 Broadcast
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #ff3366, #ff3366dd)',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '30px',
                fontWeight: '900',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(255,51,106,0.3)',
              }}
            >
              <span>🛒 Cart</span>
              <span style={{ background: '#fff', color: '#ff3366', borderRadius: '50%', padding: '2px 8px', fontSize: '0.78rem', fontWeight: '900' }}>
                {totalCartCount}
              </span>
            </button>

          </div>

        </div>
      </header>

      {/* ===== HERO BANNER ===== */}
      <section style={{ maxWidth: '1200px', margin: '20px auto 10px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '36px 20px', background: isDark ? 'radial-gradient(ellipse at top, rgba(255,51,106,0.15), rgba(9,13,22,0.6))' : 'radial-gradient(ellipse at top, rgba(0,242,254,0.15), #ffffff)' }}>
          <span style={{ background: 'rgba(255,51,106,0.2)', color: '#ff3366', padding: '4px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
            ✨ SHOP4EVERYTHING STORE
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: '900', margin: '12px 0 10px 0', lineHeight: '1.2' }}>
            {storeName} is ready for your next order
          </h2>
          <p style={{ maxWidth: '640px', margin: '0 auto 20px auto', fontSize: '0.95rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.6' }}>
            Fashion, shoes, bags, perfumes, garden decor & home appliances. Pick your list and order on WhatsApp!
          </p>
        </div>
      </section>

      {/* ===== CATEGORY FILTER TABS ===== */}
      <section style={{ maxWidth: '1200px', margin: '15px auto', padding: '0 20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 18px',
                borderRadius: '30px',
                border: selectedCategory === cat ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: selectedCategory === cat ? '#ff3366' : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                color: selectedCategory === cat ? '#fff' : isDark ? '#fff' : '#000',
                fontWeight: '800',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ===== PRODUCTS SHOWCASE GRID (WITH EDIT FOR ADMINS) ===== */}
      <main style={{ maxWidth: '1200px', margin: '20px auto 40px auto', padding: '0 20px' }}>
        <div className="responsive-grid">
          {filteredProducts.map(product => {
            const cartItem = cart.find(item => item.product.id === product.id);
            const inCartQty = cartItem ? cartItem.quantity : 0;

            return (
              <div key={product.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                
                {/* Admin / Eligible User Edit & Delete Controls */}
                {isUserAdmin && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => startEditingProduct(product)}
                      style={{ background: 'rgba(0, 242, 254, 0.9)', color: '#000', border: 'none', padding: '4px 10px', borderRadius: '12px', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{ background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '12px', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                )}

                <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden', background: '#000' }}>
                  <img
                    src={product.image}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '14px',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                  }}>
                    {product.tag}
                  </span>
                </div>

                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#00f2fe', fontWeight: '800', textTransform: 'uppercase' }}>
                      {product.category}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: '4px 0 6px 0', lineHeight: '1.3' }}>
                      {product.title}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                      {product.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#ff3366' }}>
                      ₦{product.price.toLocaleString()}
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        background: inCartQty > 0 ? '#25d366' : 'linear-gradient(135deg, #ff3366, #ff3366dd)',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: '800',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                      }}
                    >
                      {inCartQty > 0 ? `Added (${inCartQty}) ✓` : '+ Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ===== DASHBOARD SLIDE-OUT PANEL ===== */}
      {isDashboardOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }} onClick={() => setIsDashboardOpen(false)}>
          <div style={{ width: '360px', maxWidth: '90vw', height: '100%', background: isDark ? '#0f172a' : '#ffffff', padding: '20px', boxShadow: '-10px 0 30px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '1px' }}>Store Dashboard</div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', fontWeight: '900' }}>Manage your shop</h3>
              </div>
              <button onClick={() => setIsDashboardOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dashboardMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDashboardSection(item.id)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: dashboardSection === item.id ? '1px solid #ff3366' : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                    background: dashboardSection === item.id ? 'rgba(255,51,106,0.16)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    color: isDark ? '#fff' : '#000',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>

            <div style={{ borderRadius: '16px', padding: '14px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
              {dashboardSection === 'overview' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Overview</div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,242,254,0.12)' }}><strong>{products.length}</strong> products live</div>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(37,211,102,0.12)' }}><strong>{registeredUsers.length}</strong> registered users</div>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,51,106,0.12)' }}><strong>{totalCartCount}</strong> items in cart</div>
                  </div>
                </div>
              )}

              {dashboardSection === 'shop' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Shop Management</div>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: isDark ? '#94a3b8' : '#64748b' }}>Upload products, edit catalog items, and keep your store fresh with new arrivals.</p>
                  {canUserUpload && (
                    <button onClick={() => { setIsDashboardOpen(false); setIsUploadOpen(true); }} style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #00f2fe, #00ff9d)', color: '#000', fontWeight: '900', border: 'none', cursor: 'pointer' }}>➕ Upload Item</button>
                  )}
                </div>
              )}

              {dashboardSection === 'orders' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Orders</div>
                  {cart.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: isDark ? '#94a3b8' : '#64748b' }}>No pending order details yet. When a customer adds to cart, this panel will show the current order summary.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {cart.map((item) => (
                        <div key={item.product.id} style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                          <div style={{ fontWeight: '800' }}>{item.product.title}</div>
                          <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b' }}>Qty: {item.quantity} • ₦{(item.product.price * item.quantity).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {dashboardSection === 'customers' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Customers & Access</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {registeredUsers.map((u) => (
                      <div key={u.email} style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ fontWeight: '800' }}>{u.email}</div>
                        <div style={{ fontSize: '0.78rem', color: u.role === 'admin' ? '#ff3366' : u.isEligibleToUpload ? '#00f2fe' : '#94a3b8' }}>
                          {u.role === 'admin' ? 'Admin' : u.isEligibleToUpload ? 'Upload access' : 'Buyer only'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboardSection === 'founder' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '10px' }}>Founder</div>
                  <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #ff3366', marginBottom: '10px' }}>
                    <img src={authorImage} alt={authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>{authorName}</h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: isDark ? '#94a3b8' : '#64748b' }}>{authorBio}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <a href={`https://wa.me/${storePrimaryPhone}`} target="_blank" rel="noreferrer" style={{ background: '#25d366', color: '#fff', padding: '8px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '800', textAlign: 'center' }}>💬 Main Line: {storePrimaryPhone}</a>
                    <a href={`https://wa.me/${storeBackupPhone}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.08)', color: isDark ? '#fff' : '#000', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '800', textAlign: 'center' }}>📞 Backup Line: {storeBackupPhone}</a>
                  </div>
                </div>
              )}

              {dashboardSection === 'broadcast' && isUserAdmin && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Admin Broadcast</div>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: isDark ? '#94a3b8' : '#64748b' }}>Send an announcement to all registered users about a new product or update.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    <input value={broadcastSubject} onChange={(e) => setBroadcastSubject(e.target.value)} placeholder="Subject" style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? '#fff' : '#000' }} />
                    <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} rows={5} placeholder="Message" style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? '#fff' : '#000' }} />
                    <button onClick={() => {
                      setBroadcastStatus('Broadcast queued for all registered users.');
                      refreshEveryone('broadcast');
                    }} style={{ padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff3366, #ff3366dd)', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer' }}>📣 Send Broadcast</button>
                    {broadcastStatus && <div style={{ fontSize: '0.8rem', color: '#00f2fe' }}>{broadcastStatus}</div>}
                  </div>
                </div>
              )}

              {dashboardSection === 'settings' && isUserAdmin && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Store Settings</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store name" style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? '#fff' : '#000' }} />
                    <input value={storeTagline} onChange={(e) => setStoreTagline(e.target.value)} placeholder="Tagline" style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? '#fff' : '#000' }} />
                    <input value={storePrimaryPhone} onChange={(e) => setStorePrimaryPhone(e.target.value)} placeholder="Primary phone" style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? '#fff' : '#000' }} />
                    <input value={storeBackupPhone} onChange={(e) => setStoreBackupPhone(e.target.value)} placeholder="Backup phone" style={{ padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: isDark ? '#fff' : '#000' }} />
                    <button onClick={() => { setBroadcastStatus('Settings updated.'); refreshEveryone('settings'); }} style={{ padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #00f2fe, #00ff9d)', color: '#000', fontWeight: '900', border: 'none', cursor: 'pointer' }}>⚙️ Apply Settings</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== LOGIN MODAL ===== */}
      {isLoginOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#00f2fe' }}>🔐 Sign In / Admin Login</h3>
              <button onClick={() => setIsLoginOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '16px' }}>
              Log in with your email to continue.
            </p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. darlingjude9@gmail.com"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ff3366, #00f2fe)', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer' }}>
                🚀 Log In to SHOP4EVERYTHING
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== UPLOAD ITEM MODAL (WITH LOCAL FILE UPLOAD) ===== */}
      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#00f2fe' }}>➕ Upload New Item</h3>
              <button onClick={() => setIsUploadOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleAddNewProduct}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Product Title</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title" required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Price (₦)</label>
                  <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="25000" required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                </div>
              </div>

              {/* LOCAL FILE UPLOAD (NOT URL) */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📷 Upload Product Photo (Select File)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setNewImageFile)}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px dashed #00f2fe', color: '#fff' }}
                />
                {newImageFile && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img src={newImageFile} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #00f2fe' }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Stock Tag</label>
                <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="🟢 In Stock" style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Product description..." rows={2} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #00f2fe, #00ff9d)', color: '#000', border: 'none', borderRadius: '30px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer' }}>
                🚀 Publish Product →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT ITEM MODAL (ADMIN / ELIGIBLE USER) ===== */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#ff3366' }}>✏️ Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveEditProduct}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Product Title</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Price (₦)</label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                </div>
              </div>

              {/* CHANGE PHOTO VIA FILE UPLOAD */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📷 Change Product Photo (Upload File)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setEditImageFile)}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px dashed #ff3366', color: '#fff' }}
                />
                {editImageFile && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <img src={editImageFile} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #ff3366' }} />
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Stock Tag</label>
                <input type="text" value={editTag} onChange={(e) => setEditTag(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ff3366, #ff3366dd)', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer' }}>
                💾 Save Changes →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== ADMIN USER ELIGIBILITY MANAGEMENT MODAL ===== */}
      {isUserMgmtOpen && isUserAdmin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#ff3366' }}>👑 Admin User Eligibility Control</h3>
              <button onClick={() => setIsUserMgmtOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '16px' }}>
              As an Admin (<code>darlingjude9@gmail.com</code> / <code>judecherish233@gmail.com</code>), you can grant or revoke item upload privileges for any user:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {registeredUsers.map((u, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{u.email}</div>
                    <span style={{ fontSize: '0.72rem', color: u.role === 'admin' ? '#ff3366' : u.isEligibleToUpload ? '#00f2fe' : '#94a3b8', fontWeight: 'bold' }}>
                      {u.role === 'admin' ? '👑 Main Admin' : u.isEligibleToUpload ? '✅ Eligible Uploader' : '❌ Buyer Only'}
                    </span>
                  </div>

                  {u.role !== 'admin' && (
                    <button
                      onClick={() => toggleUserEligibility(u.email)}
                      style={{
                        background: u.isEligibleToUpload ? '#ef4444' : '#25d366',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {u.isEligibleToUpload ? 'Revoke Permission' : 'Grant Upload Privilege'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CART DRAWER & AUTOMATIC CALCULATOR ===== */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: isDark ? '#090d16' : '#ffffff',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
            borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
          }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🛒</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>Shopping Cart</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto 0', color: isDark ? '#94a3b8' : '#64748b' }}>
                  🛒 Your shopping cart is empty.<br/>Browse items above and add to cart!
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '16px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                    <img src={item.product.image} alt={item.product.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.88rem', fontWeight: '800' }}>{item.product.title}</h4>
                      <div style={{ fontSize: '0.85rem', color: '#ff3366', fontWeight: '900' }}>₦{item.product.price.toLocaleString()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <button onClick={() => updateQuantity(item.product.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: isDark ? '#fff' : '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                        <span style={{ fontSize: '0.82rem', fontWeight: '800' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: isDark ? '#fff' : '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '900' }}>₦{(item.product.price * item.quantity).toLocaleString()}</div>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', marginTop: '8px', fontWeight: 'bold' }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '20px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Total Selected Items:</span>
                <span style={{ fontWeight: '800' }}>{totalCartCount} items</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.2rem', fontWeight: '900' }}>
                <span>Grand Total:</span>
                <span style={{ color: '#ff3366' }}>₦{cartSubtotal.toLocaleString()}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href={generateWhatsAppLink(storePrimaryPhone)} target="_blank" rel="noreferrer" style={{ background: '#25d366', color: '#fff', padding: '14px', borderRadius: '30px', textDecoration: 'none', textAlign: 'center', fontWeight: '900', fontSize: '0.92rem', boxShadow: '0 4px 20px rgba(37,211,102,0.4)', pointerEvents: cart.length === 0 ? 'none' : 'auto', opacity: cart.length === 0 ? 0.5 : 1 }}>
                  SEND ORDERS NOW
                </a>
                <a href={generateWhatsAppLink(storeBackupPhone)} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.06)', color: isDark ? '#fff' : '#000', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, padding: '10px', borderRadius: '30px', textDecoration: 'none', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', pointerEvents: cart.length === 0 ? 'none' : 'auto', opacity: cart.length === 0 ? 0.5 : 1 }}>
                  📞 Backup Line ({storeBackupPhone}) →
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
