'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  image: string;
  tag: string;
  description: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Home() {
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
    },
    {
      id: 7,
      title: "Silicone Air Fryer Non-Stick Liner Set",
      category: "Kitchen & Appliances",
      price: 4500,
      image: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80",
      tag: "🔥 Popular",
      description: "Reusable heat-resistant silicone air fryer baking liners."
    },
    {
      id: 8,
      title: "High-Capacity Fast Charge Power Bank",
      category: "Electronics & Gadgets",
      price: 16500,
      image: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80",
      tag: "⚡ Fast Charge",
      description: "20,000mAh dual USB fast charging portable power bank."
    }
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Author & Founder State (Updated to Darlingtina Jude & photo)
  const [authorName, setAuthorName] = useState('Darlingtina Jude');
  const [authorBio, setAuthorBio] = useState('Welcome to SHOP4EVERYTHING! We bring you top-tier fashion wares, luxury shoes, handcrafted bags, household items, garden decor, and appliances delivered right to your doorstep.');
  const [authorImage, setAuthorImage] = useState('/darlingtina.jpg');

  // New Product Form State for Admin
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Fashion & Clothings');
  const [newPrice, setNewPrice] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newTag, setNewTag] = useState('🟢 In Stock');
  const [newDesc, setNewDesc] = useState('');

  // Load Cart & Theme from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('shop4everything_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }
    const savedTheme = localStorage.getItem('shop4everything_theme');
    setIsDark(savedTheme !== 'light');
  }, []);

  // Sync Cart to localStorage
  useEffect(() => {
    localStorage.setItem('shop4everything_cart', JSON.stringify(cart));
  }, [cart]);

  const categories = [
    'All',
    'Fashion & Clothings',
    'Bags & Footwear',
    'Female Beauty & Perfumes',
    'Home & Garden Decor',
    'Kitchen & Appliances',
    'Electronics & Gadgets'
  ];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Automatic Total Price Calculator
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Generate Formatted WhatsApp Order Message
  const generateWhatsAppLink = (phoneNumber: string) => {
    if (cart.length === 0) return '#';
    let text = `🛍️ *NEW ORDER FROM SHOP4EVERYTHING*\n`;
    text += `------------------------------------\n`;
    cart.forEach((item, index) => {
      text += `${index + 1}. *${item.product.title}*\n`;
      text += `   • Qty: ${item.quantity}\n`;
      text += `   • Price: ₦${(item.product.price * item.quantity).toLocaleString()}\n`;
    });
    text += `------------------------------------\n`;
    text += `💰 *TOTAL AMOUNT: ₦${cartSubtotal.toLocaleString()}*\n\n`;
    text += `Please confirm my order availability and delivery details!`;

    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
  };

  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) {
      alert('Please provide product title and price!');
      return;
    }
    const item: Product = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      price: parseFloat(newPrice),
      image: newImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      tag: newTag,
      description: newDesc || 'High quality item.'
    };
    setProducts(prev => [item, ...prev]);
    setNewTitle('');
    setNewPrice('');
    setNewImage('');
    setNewDesc('');
    alert('✅ Product added successfully!');
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const primaryPhone = '2349042797233';
  const backupPhone = '2348066295944';

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
                SHOP4EVERYTHING
              </h1>
              <span style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>Online Varieties, Wares & Decor</span>
            </div>
          </div>

          {/* Search Input */}
          <div style={{ flex: 1, maxWidth: '320px', minWidth: '200px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search fashion, decor, appliances..."
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

          {/* Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsAdminOpen(true)}
              style={{
                background: 'rgba(0, 242, 254, 0.12)',
                color: '#00f2fe',
                border: '1px solid #00f2fe',
                padding: '6px 14px',
                borderRadius: '30px',
                fontWeight: '800',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
            >
              ⚙️ Admin Portal
            </button>

            {/* Shopping Cart Button */}
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
            ✨ SHOP4EVERYTHING VARIETIES
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: '900', margin: '12px 0 10px 0', lineHeight: '1.2' }}>
            Everything You Need, All in One Place
          </h2>
          <p style={{ maxWidth: '640px', margin: '0 auto 20px auto', fontSize: '0.95rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.6' }}>
            Explore fashion, beauty, garden decor, household appliances, and gadgets. Pick your items and order via WhatsApp instantly!
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

      {/* ===== PRODUCTS SHOWCASE GRID ===== */}
      <main style={{ maxWidth: '1200px', margin: '20px auto 40px auto', padding: '0 20px' }}>
        <div className="responsive-grid">
          {filteredProducts.map(product => {
            const cartItem = cart.find(item => item.product.id === product.id);
            const inCartQty = cartItem ? cartItem.quantity : 0;

            return (
              <div key={product.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden', background: '#000' }}>
                  <img
                    src={product.image}
                    alt={product.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
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

      {/* ===== ABOUT THE FOUNDER SECTION (DARLINGTINA & IMAGE) ===== */}
      <section style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
        <div className="glass-card" style={{ padding: '30px', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Founder Image Space */}
          <div style={{ position: 'relative', width: '140px', height: '140px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #ff3366', boxShadow: '0 8px 30px rgba(255,51,106,0.3)', flexShrink: 0 }}>
            <img src={authorImage} alt={authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <div style={{ flex: 1, minWidth: '260px' }}>
            <span style={{ fontSize: '0.75rem', color: '#00f2fe', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              👑 STORE FOUNDER
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '4px 0 8px 0' }}>{authorName}</h2>
            <p style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.6', margin: '0 0 14px 0' }}>
              {authorBio}
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/${primaryPhone}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#25d366',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                💬 Main Line: 09042797233
              </a>

              <a
                href={`https://wa.me/${backupPhone}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: isDark ? '#fff' : '#000',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📞 Backup Line: 08066295944
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ===== SHOPPING CART DRAWER & AUTOMATIC CALCULATOR ===== */}
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
                      <div style={{ fontSize: '0.9rem', fontWeight: '900' }}>
                        ₦{(item.product.price * item.quantity).toLocaleString()}
                      </div>
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
                <a
                  href={generateWhatsAppLink(primaryPhone)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#25d366',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: '30px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontWeight: '900',
                    fontSize: '0.92rem',
                    boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
                    pointerEvents: cart.length === 0 ? 'none' : 'auto',
                    opacity: cart.length === 0 ? 0.5 : 1,
                  }}
                >
                  💬 Checkout via Main WhatsApp (09042797233) →
                </a>

                <a
                  href={generateWhatsAppLink(backupPhone)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: isDark ? '#fff' : '#000',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                    padding: '10px',
                    borderRadius: '30px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    pointerEvents: cart.length === 0 ? 'none' : 'auto',
                    opacity: cart.length === 0 ? 0.5 : 1,
                  }}
                >
                  📞 Backup Line (08066295944) →
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===== ADMIN PORTAL MODAL ===== */}
      {isAdminOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
          <div className="glass-card" style={{ maxWidth: '540px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '900', color: '#00f2fe' }}>⚙️ Admin Store Portal</h3>
              <button onClick={() => setIsAdminOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800', color: '#ff3366' }}>👑 Store Founder Profile</h4>
              <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Founder Name" style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <input type="text" value={authorImage} onChange={(e) => setAuthorImage(e.target.value)} placeholder="Founder Image Path" style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <textarea value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} placeholder="Founder Bio" rows={2} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>

            <form onSubmit={handleAddNewProduct}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: '800', color: '#00f2fe' }}>➕ Add New Item to SHOP4EVERYTHING</h4>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Product Title" required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} style={{ background: '#000' }}>{c}</option>)}
                </select>
                <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Price (₦)" required style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              </div>

              <input type="text" value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="Image URL" style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />

              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #00f2fe, #00ff9d)', color: '#000', border: 'none', borderRadius: '30px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer' }}>
                🚀 Publish Product to Store →
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
