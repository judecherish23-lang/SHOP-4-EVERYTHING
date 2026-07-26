'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { supabase } from '../lib/supabase';

// --- CLIENT-SIDE IMAGE COMPRESSOR UTILITY ---
const compressImageFile = (file: File, quality: number = 0.7, maxWidth: number = 1000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to process image canvas context.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- HELPER TO UPLOAD IMAGE TO SUPABASE STORAGE BUCKET ---
const uploadBase64ToStorage = async (base64: string, fileName: string): Promise<string> => {
  // If it's already a public web URL (e.g. from Unsplash or previous upload), return as is
  if (!base64 || !base64.startsWith('data:image')) return base64;

  try {
    const response = await fetch(base64);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(`public/${fileName}.jpg`, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error.message);
      return base64; // Fallback
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Storage helper failed:', err);
    return base64;
  }
};

interface Product {
  id: number;
  title: string;
  category: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  images?: string[]; // <-- Upgraded to support multiple color variant images
  tag: string;
  description: string;
  addedBy?: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedColorImage?: string;
  selectedColorIndex?: number; // <-- Added to track image number (1, 2, 3...)
}

interface User {
  email: string;
  role: string;
  isEligibleToUpload: boolean;
}

interface BroadcastEntry {
  id: number;
  subject: string;
  message: string;
  sentBy: string;
  created_at: string;
}

interface StoreSettings {
  id?: number;
  storeName: string;
  storeTagline: string;
  storeLogoUrl: string;
  primaryPhone: string;
  backupPhone: string;
  supportEmail: string;
  currencySymbol: string;
  deliveryFee: number;
  socialInstagram: string;
  socialTwitter: string;
  socialFacebook: string;
  maintenanceMode: boolean;
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function Home() {
  // --- STATE ---
  const adminEmails = ['darlingjude9@gmail.com', 'judecherish233@gmail.com'];
  
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('shop4everything_products_cache');
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return [];
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastEntry[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastEntry | null>(null);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'SHOP4EVERYTHING',
    storeTagline: 'Online Varieties, Wares & Decor',
    storeLogoUrl: '',
    primaryPhone: '2349042797233',
    backupPhone: '2348066295944',
    supportEmail: 'support@shop4everything.com',
    currencySymbol: '₦',
    deliveryFee: 0,
    socialInstagram: '',
    socialTwitter: '',
    socialFacebook: '',
    maintenanceMode: false
  });

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [storeOrders, setStoreOrders] = useState<any[]>([]);
 
  // UI States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState<'overview' | 'shop' | 'orders' | 'customers' | 'founder' | 'broadcast' | 'settings' | 'account' | 'policy'>('overview');
  
  // Modals & Chatbot States
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hi! I am Darling Chatbot 🤖. How can I help you with your shopping today?' }
  ]);

  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');

  const isDark = true;
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallCard, setShowInstallCard] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  // Authentication State (Member Login vs Guest Registration)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Modals for Upload / Edit & Multi-Image Color Variant Viewer
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProductImages, setViewingProductImages] = useState<string[] | null>(null);

  const [compressionQuality, setCompressionQuality] = useState<number>(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('shop4everything_compression_quality');
    if (saved) return parseFloat(saved);
  }
  return 0.7;
});

// Save quality choice whenever it changes so it never resets automatically
useEffect(() => {
  localStorage.setItem('shop4everything_compression_quality', compressionQuality.toString());
}, [compressionQuality]);
const [selectedVariantImage, setSelectedVariantImage] = useState<string | null>(null);

  // Founder Info (Static for now)
  const authorName = 'Darlingtina Jude';
  const authorBio = 'Welcome to SHOP4EVERYTHING! We bring you top-tier fashion wares, luxury shoes, handcrafted bags, household items, garden decor, and appliances delivered right to your doorstep.';
  const authorImage = '/darlingtina.jpg';

  // Forms & Multi-Image State Arrays
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Fashion & Clothings');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newTag, setNewTag] = useState('🟢 In Stock');
  const [newDesc, setNewDesc] = useState('');
  const [newImageFile, setNewImageFile] = useState<string>('');
  const [newImagesList, setNewImagesList] = useState<string[]>([]);

  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Fashion & Clothings');
  const [editPrice, setEditPrice] = useState('');
  const [editOriginalPrice, setEditOriginalPrice] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editImageFile, setEditImageFile] = useState<string>('');
  const [editImagesList, setEditImagesList] = useState<string[]>([]);

const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    // Show the user's message immediately
    const newMessages: {role: 'user' | 'assistant', content: string}[] = [
      ...chatMessages, 
      { role: 'user', content: chatInput }
    ];
    setChatMessages(newMessages);
    setChatInput(''); // Clear the input box

    try {
      // Send the chat history to our secure backend route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, storeName: settings.storeName })
      });

      const data = await response.json();
      
      // Update chat with Darling Chatbot's reply
      if (data.reply) {
        setChatMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setChatMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having connection issues right now 😵‍💫" }]);
      }
    } catch (err) {
      setChatMessages([...newMessages, { role: 'assistant', content: "Network error. Can't reach the server." }]);
    }
  };

// --- AUTOMATIC CONVERTER: BASE64 TO SUPABASE STORAGE CDN URLS ---
  const compressExistingProductsInSupabase = async () => {
    if (!confirm(`Are you sure you want to convert all existing database Base64 images to fast Supabase Storage URLs? This will make your site load instantly.`)) return;

    const { data: allProds, error: fetchErr } = await supabase.from('products').select('*');
    if (fetchErr || !allProds) {
      alert('Error fetching products for migration: ' + (fetchErr?.message || 'Unknown error'));
      return;
    }

    let updatedCount = 0;
    for (const prod of allProds) {
      let modified = false;
      let mainImgUrl = prod.image;
      let imagesList = prod.images ? [...prod.images] : [];

      // Convert main image if it's base64 (ensure we pass a clean name)
      if (mainImgUrl && mainImgUrl.startsWith('data:image')) {
        // Notice we changed 'migrated-id-main' to 'migrated-id-main-img'
        mainImgUrl = await uploadBase64ToStorage(mainImgUrl, `migrated-${prod.id}-main-img`);
        modified = true;
      }

      // Convert variant array images if they are base64
      if (imagesList.length > 0) {
        for (let i = 0; i < imagesList.length; i++) {
          if (imagesList[i] && imagesList[i].startsWith('data:image')) {
            imagesList[i] = await uploadBase64ToStorage(imagesList[i], `migrated-${prod.id}-${i}`);
            modified = true;
          }
        }
      }

      if (modified) {
        const { error: updateErr } = await supabase.from('products').update({
          image: mainImgUrl,
          images: imagesList
        }).eq('id', prod.id);

        if (!updateErr) updatedCount++;
      }
    }

    alert(`✅ Successfully converted ${updatedCount} products to fast CDN Storage URLs! Refreshing app...`);
    window.location.reload();
  };

  // --- CLOUD FETCHING & REAL-TIME AUTO-REFRESH SUBSCRIPTIONS ---
  useEffect(() => {
    const fetchGlobalData = async () => {
      const { data: prodData } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (prodData) {
        setProducts(prodData as Product[]);
        localStorage.setItem('shop4everything_products_cache', JSON.stringify(prodData));
      }
      const { data: setData } = await supabase.from('store_settings').select('*').limit(1).single();
      if (setData) setSettings(setData as StoreSettings);
 
      const { data: bcData } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false });
      if (bcData && bcData.length > 0) {
        setBroadcasts(bcData as BroadcastEntry[]);
        setActiveBroadcast(bcData[0] as BroadcastEntry);
      }
 
      const { data: usrData } = await supabase.from('store_users').select('*');
      if (usrData) setRegisteredUsers(usrData as User[]);

      const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ordData) setStoreOrders(ordData);
    };

    fetchGlobalData();

    // Supabase Real-time Channel for Instant Auto-Refresh across all clients
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
        await fetchGlobalData();

        if (payload.table === 'store_users' && payload.eventType === 'UPDATE') {
          const updatedEmail = payload.new.email;
          const localUser = localStorage.getItem('shop4everything_user');
          const sessionUser = sessionStorage.getItem('shop4everything_user');

          if (localUser) {
            try {
              const parsed = JSON.parse(localUser);
              if (parsed.email === updatedEmail) {
                const refreshedUser = {
                  ...parsed,
                  role: payload.new.role,
                  isEligibleToUpload: payload.new.isEligibleToUpload,
                };
                localStorage.setItem('shop4everything_user', JSON.stringify(refreshedUser));
                setCurrentUser(refreshedUser);
              }
            } catch (e) {}
          } else if (sessionUser) {
            try {
              const parsed = JSON.parse(sessionUser);
              if (parsed.email === updatedEmail) {
                const refreshedUser = {
                  ...parsed,
                  role: payload.new.role,
                  isEligibleToUpload: payload.new.isEligibleToUpload,
                };
                sessionStorage.setItem('shop4everything_user', JSON.stringify(refreshedUser));
                setCurrentUser(refreshedUser);
              }
            } catch (e) {}
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- LOCAL CACHE, PERSISTENCE & PWA ---
  useEffect(() => {
    const savedCart = localStorage.getItem('shop4everything_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }

    const rememberedUser = localStorage.getItem('shop4everything_user') || sessionStorage.getItem('shop4everything_user');
    if (rememberedUser) {
      try { setCurrentUser(JSON.parse(rememberedUser)); } catch (e) {}
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
                         
    if (isStandalone) {
      setIsInstalled(true);
      setShowInstallCard(false);
    } else {
      const dismissed = localStorage.getItem('shop4everything_install_dismissed');
      if (dismissed) {
        setShowInstallCard(false);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
      if (!isInstalled && !localStorage.getItem('shop4everything_install_dismissed')) {
        setShowInstallCard(true);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, [isInstalled]);

  useEffect(() => {
    localStorage.setItem('shop4everything_cart', JSON.stringify(cart));
  }, [cart]);

  // --- PWA INSTALL HANDLER ---
  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) {
      setShowInstallCard(false);
      localStorage.setItem('shop4everything_install_dismissed', 'true');
      return;
    }

    try {
      await deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredInstallPrompt(null);
      setShowInstallCard(false);
      localStorage.setItem('shop4everything_install_dismissed', 'true');
    } catch (error) {
      console.log('Install prompt error', error);
      setShowInstallCard(false);
      localStorage.setItem('shop4everything_install_dismissed', 'true');
    }
  };

  // --- AUTHENTICATION: NATIVE SUPABASE AUTH & WELCOME EMAIL ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      alert('Please enter both email and password.');
      return;
    }

    const emailClean = authEmail.trim().toLowerCase();
    const isAdmin = adminEmails.includes(emailClean);

    let loggedUser: User;

    if (authMode === 'register') {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailClean,
        password: authPassword,
      });

      if (authError) {
        alert('Registration error: ' + authError.message);
        return;
      }

      const { data: existingUser } = await supabase.from('store_users').select('*').eq('email', emailClean).maybeSingle();

      if (existingUser) {
        loggedUser = existingUser as User;
      } else {
        loggedUser = {
          email: emailClean,
          role: isAdmin ? 'admin' : 'buyer',
          isEligibleToUpload: isAdmin
        };

        const { error: insertError } = await supabase.from('store_users').upsert([loggedUser], { onConflict: 'email' });
        if (insertError) {
          alert('Database profile error: ' + insertError.message);
          return;
        }
        
        const { data: freshUsers } = await supabase.from('store_users').select('*');
        if (freshUsers) setRegisteredUsers(freshUsers as User[]);
      }
      
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailClean,
            subject: `🎉 Welcome to ${settings.storeName}!`,
            message: `Hello there,\n\nYour account has been successfully created. You now have full access to browse, save your cart, and stay updated with our latest collections.\n\nThank you for joining us!`,
            type: 'welcome',
            storeName: settings.storeName
          })
        });
      } catch (err) {
        console.error("Welcome email failed to send.");
      }
      
      alert(`🎉 Registration successful! A verification and welcome email have been sent directly to ${emailClean}.`);
      setAuthMode('login');
      return;

    } else {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailClean,
        password: authPassword,
      });

      if (authError) {
        alert('Login failed: ' + authError.message);
        return;
      }

      const { data: existingUser } = await supabase.from('store_users').select('*').eq('email', emailClean).maybeSingle();

      loggedUser = (existingUser as User) || {
        email: emailClean,
        role: isAdmin ? 'admin' : 'buyer',
        isEligibleToUpload: isAdmin
      };

      if (!existingUser) {
        await supabase.from('store_users').upsert([loggedUser], { onConflict: 'email' });
      }

      if (isAdmin && loggedUser.role !== 'admin') {
        loggedUser.role = 'admin';
        loggedUser.isEligibleToUpload = true;
        await supabase.from('store_users').update({ role: 'admin', isEligibleToUpload: true }).eq('email', emailClean);
      }

      alert(`Welcome back, ${emailClean}!`);
    }

    setCurrentUser(loggedUser);
    
    if (rememberMe) {
      localStorage.setItem('shop4everything_user', JSON.stringify(loggedUser));
    } else {
      sessionStorage.setItem('shop4everything_user', JSON.stringify(loggedUser));
    }

    setIsLoginOpen(false);
    setAuthEmail('');
    setAuthPassword('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('shop4everything_user');
    sessionStorage.removeItem('shop4everything_user');
    alert('Logged out successfully.');
  };

  // --- PASSWORD RESET HANDLER ---
  const handlePasswordReset = async () => {
    if (!authEmail) {
      alert('Please enter your email address in the field above first.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim().toLowerCase(), {
      redirectTo: 'https://shop-4-everything.vercel.app',
    });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Password reset link sent! Check your email inbox.');
    }
  };

  // --- SELLER / UPLOAD PRIVILEGE MANAGER ---
  const toggleUserEligibility = async (email: string, currentStatus: boolean) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const newStatus = !currentStatus;
    const newRole = newStatus ? 'seller' : 'buyer';

    const { error } = await supabase
      .from('store_users')
      .update({ isEligibleToUpload: newStatus, role: newRole })
      .eq('email', email);

    if (!error) {
      setRegisteredUsers(prev => prev.map(u => u.email === email ? { ...u, isEligibleToUpload: newStatus, role: newRole } : u));
      
      if (currentUser.email === email) {
        const updatedUser = { ...currentUser, isEligibleToUpload: newStatus, role: newRole };
        setCurrentUser(updatedUser);
        localStorage.setItem('shop4everything_user', JSON.stringify(updatedUser));
      }
      alert(`Successfully updated permissions for ${email}`);
    } else {
      alert("Error updating user role: " + error.message);
    }
  };

  // --- MULTI-IMAGE & FILE HANDLERS ---
  const handleMultipleFilesChange = async (e: ChangeEvent<HTMLInputElement>, setTargetImages: React.Dispatch<React.SetStateAction<string[]>>) => {
    const files = e.target.files;
    if (!files) return;
    
    const compressedPromises: Promise<string>[] = [];
    for (let i = 0; i < files.length; i++) {
      compressedPromises.push(compressImageFile(files[i], compressionQuality));
    }

    try {
      const processedImages = await Promise.all(compressedPromises);
      setTargetImages(prev => [...prev, ...processedImages]);
    } catch (err) {
      console.error('Image compression failed', err);
      alert('Error compressing images. Please try different files.');
    }
  };

  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = Number(newPrice);
    const parsedOriginalPrice = Number(newOriginalPrice);

    if (!newTitle.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid title and price.'); return;
    }

    // Upload images to Supabase Storage bucket first to get small CDN URLs
    const rawList = newImagesList.length > 0 ? newImagesList : (newImageFile ? [newImageFile] : []);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < rawList.length; i++) {
      const url = await uploadBase64ToStorage(rawList[i], `prod-${Date.now()}-${i}`);
      uploadedUrls.push(url);
    }

    const primaryImg = uploadedUrls[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
    const allImages = uploadedUrls.length > 0 ? uploadedUrls : [primaryImg];
    const newItem = {
      title: newTitle.trim(),
      category: newCategory,
      price: parsedPrice,
      originalPrice: parsedOriginalPrice > 0 ? parsedOriginalPrice : null,
      image: primaryImg,
      images: allImages,
      tag: newTag || '🟢 In Stock',
      description: newDesc.trim() || 'High quality item.',
      addedBy: currentUser?.email || null
    };

    const { data, error } = await supabase.from('products').insert([newItem]).select();
    if (error) { alert('Upload error: ' + error.message); return; }

    if (data) setProducts(prev => [data[0] as Product, ...prev]);

    setNewTitle(''); setNewPrice(''); setNewOriginalPrice(''); setNewImageFile(''); setNewImagesList([]); setNewDesc('');
    setIsUploadOpen(false);
    alert('✅ Item uploaded!');
  };

  const startEditingProduct = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.title); setEditCategory(product.category);
    setEditPrice(product.price.toString()); setEditOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
    setEditTag(product.tag); setEditDesc(product.description); setEditImageFile(product.image);
    setEditImagesList(product.images || [product.image]);
  };

 const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const primaryImg = editImagesList[0] || editImageFile || editingProduct.image;
    const allImages = editImagesList.length > 0 ? editImagesList : [primaryImg];

    const updatedItem = {
      title: editTitle,
      category: editCategory,
      price: parseFloat(editPrice),
      originalPrice: parseFloat(editOriginalPrice) || null,
      tag: editTag,
      description: editDesc,
      image: primaryImg,
      images: allImages
    };

    const { error } = await supabase.from('products').update(updatedItem).eq('id', editingProduct.id);
    if (error) { alert('Update error: ' + error.message); return; }

    setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...updatedItem, originalPrice: updatedItem.originalPrice || undefined } : p));
    setEditingProduct(null);
    alert('✨ Item updated globally!');
  }; 

  const handleDeleteProduct = async (productId: number) => {
    if (confirm('Are you sure you want to completely delete this item?')) {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (!error) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        setCart(prev => prev.filter(i => i.product.id !== productId));
      }
    }
  };

  // --- CART ---
  const addToCart = (product: Product, customImage?: string, colorIndex?: number) => {
    const targetImage = customImage || product.image;
    const targetIndex = colorIndex !== undefined ? colorIndex : 1;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedColorImage === targetImage);
      if (existing) {
        return prev.map(item => (item.product.id === product.id && item.selectedColorImage === targetImage) 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { product, quantity: 1, selectedColorImage: targetImage, selectedColorIndex: targetIndex }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item).filter(i => i && i.quantity > 0) as CartItem[]);
  };

  const removeFromCart = (productId: number) => setCart(prev => prev.filter(item => item.product.id !== productId));

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const grandTotal = cartSubtotal > 0 ? cartSubtotal + settings.deliveryFee : 0;

  const generateWhatsAppLink = (phoneNumber: string) => {
    if (cart.length === 0) return '#';
    let text = `🛍️ *NEW ORDER FROM ${settings.storeName}*\n------------------------------------\n`;
    cart.forEach((item, index) => {
      const colorLabel = item.selectedColorIndex ? ` [Color: Image ${item.selectedColorIndex}]` : '';
      text += `${index + 1}. *${item.product.title}*${colorLabel}\n   • Qty: ${item.quantity}\n   • Price: ${settings.currencySymbol}${(item.product.price * item.quantity).toLocaleString()}\n`;
    });
    const deliveryText = settings.deliveryFee > 0 ? `${settings.currencySymbol}${settings.deliveryFee.toLocaleString()}` : 'Talk to Seller';
    text += `------------------------------------\n🚚 Delivery Fee: ${deliveryText}\n💰 *GRAND TOTAL: ${settings.currencySymbol}${grandTotal.toLocaleString()}*\n\nPlease confirm availability!`;
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
  };

  // --- ADMIN SETTINGS & AUTOMATED BROADCAST ACTIONS ---
  const handleSaveSettings = async () => {
    if (!settings.id) {
      const { data } = await supabase.from('store_settings').insert([settings]).select().single();
      if (data) setSettings(data as StoreSettings);
    } else {
      await supabase.from('store_settings').update(settings).eq('id', settings.id);
    }
    setBroadcastStatus('Global settings saved successfully!');
    setTimeout(() => setBroadcastStatus(''), 3000);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      alert('Please enter a subject and message.');
      return;
    }

    const entry = {
      subject: broadcastSubject,
      message: broadcastMessage,
      sentBy: currentUser?.email || 'admin'
    };

    const { data, error } = await supabase.from('broadcasts').insert([entry]).select();
    if (error) {
      alert('Broadcast error: ' + error.message);
      return;
    }

    if (data) {
      setBroadcasts(prev => [data[0] as BroadcastEntry, ...prev]);
      setActiveBroadcast(data[0] as BroadcastEntry);
    }

    const allEmails = registeredUsers.map(u => u.email);
    setBroadcastStatus('Sending secure emails to all users...');
    
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: allEmails,
          subject: `📢 ${broadcastSubject}`,
          message: broadcastMessage,
          type: 'broadcast',
          storeName: settings.storeName
        })
      });
      setBroadcastStatus(`✅ Broadcast banner updated and Real Emails dispatched to ${allEmails.length} members!`);
    } catch (err) {
      setBroadcastStatus('⚠️ Banner updated, but email dispatch failed.');
    }

    setBroadcastSubject('');
    setBroadcastMessage('');
    setTimeout(() => setBroadcastStatus(''), 5000);
  };

  // --- FILTERS & VARS ---
  const categories = ['All', 'Fashion & Clothings', 'Bags & Footwear', 'Female Beauty & Perfumes', 'Home & Garden Decor', 'Kitchen & Appliances', 'Electronics & Gadgets'];
  
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const canUserUpload = currentUser?.role === 'admin' || currentUser?.isEligibleToUpload === true;
  const isUserAdmin = currentUser?.role === 'admin';

  const dashboardMenu = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'shop', label: 'Shop Management', icon: '🛍️' },
    { id: 'orders', label: 'My Cart & Orders', icon: '📦' },
    { id: 'broadcast', label: 'Inbox & Broadcasts', icon: '📣' },
    { id: 'policy', label: 'Terms & Return Policy', icon: '📜' },
    { id: 'account', label: currentUser ? 'Account & Logout' : 'Member Login', icon: currentUser ? '👤' : '🔐' },
    { id: 'founder', label: 'Contact Founder', icon: '👑' },
    ...(isUserAdmin ? [{ id: 'customers', label: 'User Roles', icon: '👥' }, { id: 'settings', label: 'Global Settings', icon: '⚙️' }] : [])
  ] as const;

  if (settings.maintenanceMode && !isUserAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16', color: '#fff', textAlign: 'center', padding: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#ff3366', marginBottom: '10px' }}>🛠️ We'll be right back!</h1>
          <p style={{ color: '#94a3b8' }}>{settings.storeName} is currently updating inventory. Check back soon.</p>
          <button onClick={() => setIsLoginOpen(true)} style={{ marginTop: '20px', background: 'transparent', border: '1px solid #333', color: '#555', padding: '5px 10px', borderRadius: '5px' }}>Admin Login</button>
        </div>
        
        {isLoginOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.75)' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '28px', background: '#111' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#00f2fe' }}>Admin Bypass</h3>
              <button onClick={() => setIsLoginOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAuthSubmit}>
              <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Admin Email" required style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', background: '#222', border: 'none', color: '#fff' }} />
              <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', background: '#222', border: 'none', color: '#fff' }} />
              <button type="submit" style={{ width: '100%', padding: '10px', background: '#ff3366', color: '#fff', border: 'none', borderRadius: '5px' }}>Unlock</button>
            </form>
          </div>
        </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#090d16' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', transition: 'all 0.3s' }}>
      
      {/* ===== HEADER NAVIGATION (CENTERED) ===== */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: isDark ? 'rgba(9, 13, 22, 0.88)' : 'rgba(248, 250, 252, 0.88)',
        backdropFilter: 'blur(20px)', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, padding: '12px 20px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          
          {/* Centered Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
            {settings.storeLogoUrl ? (
              <img src={settings.storeLogoUrl} alt="Logo" style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff3366, #00f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem', color: '#fff' }}>🛍️</div>
            )}
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: '900', margin: 0, background: 'linear-gradient(135deg, #ff3366, #00f2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>{settings.storeName}</h1>
              <span style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>{settings.storeTagline}</span>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px', maxWidth: '400px' }}>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="🔍 Search products..." style={{ width: '100%', padding: '8px 16px', borderRadius: '30px', background: isDark ? 'rgba(0,0,0,0.4)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`, color: isDark ? '#fff' : '#000', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {canUserUpload && (
                <button onClick={() => setIsUploadOpen(true)} style={{ background: 'linear-gradient(135deg, #00f2fe, #00ff9d)', color: '#000', border: 'none', padding: '8px 14px', borderRadius: '30px', fontWeight: '900', fontSize: '0.78rem', cursor: 'pointer' }}>➕ Upload Item</button>
              )}

              <button onClick={() => setIsCartOpen(true)} style={{ background: 'linear-gradient(135deg, #ff3366, #ff3366dd)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '30px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🛒 Cart</span>
                <span style={{ background: '#fff', color: '#ff3366', borderRadius: '50%', padding: '2px 8px', fontSize: '0.78rem', fontWeight: '900' }}>{totalCartCount}</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ===== FLOATING MODERN MENU BUTTON (TOP LEFT - HIDES WHEN DRAWER IS OPEN) ===== */}
      {!isDashboardOpen && (
        <button 
          onClick={() => setIsDashboardOpen(true)} 
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 999,
            background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'}`,
            color: '#00f2fe',
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
            transition: 'all 0.2s ease'
          }}
          title="Open Dashboard Menu"
        >
          ⋮
        </button>
      )}

      {showInstallCard && !isInstalled && (
        <section style={{ maxWidth: '1200px', margin: '20px auto 10px auto', padding: '0 20px' }}>
          <div style={{ border: '1px solid rgba(0,242,254,0.35)', background: 'linear-gradient(135deg, rgba(0,242,254,0.18), rgba(255,51,106,0.14))', borderRadius: '20px', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.88rem', color: '#00f2fe', textTransform: 'uppercase' }}>
                {deferredInstallPrompt ? 'Install App' : 'Save to Home Screen'}
              </div>
              <div style={{ fontSize: '0.9rem', color: isDark ? '#f8fafc' : '#0f172a', marginTop: '4px' }}>
                {deferredInstallPrompt 
                  ? `Get the full ${settings.storeName} experience natively on your device.` 
                  : `Tap your browser menu (⋮ or ⇧) and select "Add to Home Screen" to save shortcut.`}
              </div>
            </div>

            {deferredInstallPrompt ? (
              <button onClick={handleInstallClick} style={{ background: 'linear-gradient(135deg, #ff3366, #00f2fe)', color: '#fff', border: 'none', borderRadius: '999px', padding: '10px 16px', fontWeight: '900', cursor: 'pointer' }}>
                Install Now
              </button>
            ) : (
              <button onClick={() => {
                alert('To save shortcut: Tap your browser share or menu icon, then select "Add to Home Screen".');
              }} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', padding: '10px 16px', fontWeight: '900', cursor: 'pointer' }}>
                How to Save Shortcut
              </button>
            )}
          </div>
        </section>
      )}

      {/* ===== HERO BANNER ===== */}
      <section style={{ maxWidth: '1200px', margin: '20px auto 10px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '36px 20px', background: isDark ? 'radial-gradient(ellipse at top, rgba(255,51,106,0.15), rgba(9,13,22,0.6))' : 'radial-gradient(ellipse at top, rgba(0,242,254,0.15), #ffffff)' }}>
          <span style={{ background: 'rgba(255,51,106,0.2)', color: '#ff3366', padding: '4px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>✨ OFFICIAL STORE</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: '900', margin: '12px 0 10px 0', lineHeight: '1.2' }}>{settings.storeName}</h2>
          <p style={{ maxWidth: '640px', margin: '0 auto 20px auto', fontSize: '0.95rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: '1.6' }}>{settings.storeTagline}</p>
        </div>
      </section>

      {activeBroadcast && (
        <section style={{ maxWidth: '1200px', margin: '15px auto 0 auto', padding: '0 20px' }}>
          <div style={{ borderRadius: '18px', padding: '14px 16px', background: 'linear-gradient(135deg, rgba(255,51,106,0.16), rgba(0,242,254,0.12))', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: '900', color: '#ff3366', textTransform: 'uppercase', letterSpacing: '1px' }}>📢 Latest Broadcast</div>
            <div style={{ fontSize: '1rem', fontWeight: '900', marginTop: '4px' }}>{activeBroadcast.subject}</div>
            <div style={{ fontSize: '0.9rem', color: isDark ? '#cbd5e1' : '#475569', marginTop: '6px' }}>{activeBroadcast.message}</div>
          </div>
        </section>
      )}

      {/* ===== CATEGORY FILTER ===== */}
      <section style={{ maxWidth: '1200px', margin: '15px auto', padding: '0 20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: '8px 18px', borderRadius: '30px', border: selectedCategory === cat ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: selectedCategory === cat ? '#ff3366' : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', color: selectedCategory === cat ? '#fff' : isDark ? '#fff' : '#000', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s ease' }}>{cat}</button>
          ))}
        </div>
      </section>

      {/* ===== PRODUCTS GRID ===== */}
      <main style={{ maxWidth: '1200px', margin: '20px auto 40px auto', padding: '0 20px' }}>
        <div className="responsive-grid">
          {products.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '20px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="glass-card" style={{ height: '320px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }}>
                    <div style={{ height: '180px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)' }}></div>
                    <div style={{ height: '16px', width: '60%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}></div>
                    <div style={{ height: '14px', width: '80%', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }}></div>
                  </div>
                ))}
              </div>
              <p style={{ textAlign: 'center', color: '#00f2fe', marginTop: '20px', fontWeight: 'bold', fontSize: '0.85rem' }}>⚡ Loading product catalog...</p>
            </div>
          )}
          {filteredProducts.map(product => {
            const cartItem = cart.find(item => item.product.id === product.id);
            const inCartQty = cartItem ? cartItem.quantity : 0;
            return (
              <div key={product.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                {isUserAdmin && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '6px' }}>
                    <button onClick={() => startEditingProduct(product)} style={{ background: 'rgba(0, 242, 254, 0.9)', color: '#000', border: 'none', padding: '4px 10px', borderRadius: '12px', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}>✏️ Edit</button>
                    <button onClick={() => handleDeleteProduct(product.id)} style={{ background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '12px', fontWeight: '900', fontSize: '0.72rem', cursor: 'pointer' }}>🗑️</button>
                  </div>
                )}
                <div 
                  onClick={() => {
                    const activeImages = product.images && product.images.length > 0 ? product.images : [product.image];
                    setViewingProductImages(activeImages);
                  }}
                  style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden', background: '#000', cursor: 'pointer' }}
                >
                  <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', color: '#fff', padding: '4px 10px', borderRadius: '14px', fontSize: '0.72rem', fontWeight: '800' }}>{product.tag}</span>

                  {/* Multi-Image Color Variant Indicator (...) */}
                  {product.images && product.images.length > 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingProductImages(product.images || [product.image]);
                      }}
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(8px)',
                        color: '#00f2fe',
                        border: '1px solid rgba(0, 242, 254, 0.4)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        zIndex: 5
                      }}
                      title="View all color variants"
                    >
                      <span>•••</span> <span style={{ fontSize: '0.7rem', color: '#fff' }}>{product.images.length} colors</span>
                    </button>
                  )}
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#00f2fe', fontWeight: '800', textTransform: 'uppercase' }}>{product.category}</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: '4px 0 6px 0', lineHeight: '1.3' }}>{product.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 12px 0', lineHeight: '1.4' }}>{product.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, paddingTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#ff3366' }}>{settings.currencySymbol}{product.price.toLocaleString()}</div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div style={{ fontSize: '0.85rem', color: isDark ? '#64748b' : '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>{settings.currencySymbol}{product.originalPrice.toLocaleString()}</div>
                      )}
                    </div>
                    <button onClick={() => addToCart(product)} style={{ width: '100%', background: inCartQty > 0 ? '#25d366' : 'linear-gradient(135deg, #ff3366, #ff3366dd)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '20px', fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>{inCartQty > 0 ? `Added to Cart (${inCartQty}) ✓` : '+ Add to Cart'}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ===== DASHBOARD DRAWER ===== */}
      {isDashboardOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }} onClick={() => setIsDashboardOpen(false)}>
          <div style={{ width: '360px', maxWidth: '90vw', height: '100%', background: isDark ? '#0f172a' : '#ffffff', padding: '20px', boxShadow: '-10px 0 30px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '900', color: '#00f2fe', textTransform: 'uppercase', letterSpacing: '1px' }}>{currentUser ? `${currentUser.email}` : 'Guest User'}</div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', fontWeight: '900' }}>Dashboard</h3>
              </div>
              <button onClick={() => setIsDashboardOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dashboardMenu.map((item) => (
                <button key={item.id} onClick={() => setDashboardSection(item.id as any)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '12px', border: dashboardSection === item.id ? '1px solid #ff3366' : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`, background: dashboardSection === item.id ? 'rgba(255,51,106,0.16)' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: isDark ? '#fff' : '#000', fontWeight: '800', cursor: 'pointer' }}>{item.icon} {item.label}</button>
              ))}
            </div>

            <div style={{ borderRadius: '16px', padding: '14px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
              
              {dashboardSection === 'overview' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Overview</div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,242,254,0.12)' }}><strong>{products.length}</strong> products live</div>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(37,211,102,0.12)' }}><strong>{registeredUsers.length}</strong> total registered users</div>
                    <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,51,106,0.12)' }}><strong>{totalCartCount}</strong> items in your cart</div>
                  </div>
                </div>
              )}

              {dashboardSection === 'shop' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Shop Management</div>
                  {canUserUpload ? (
                    <button onClick={() => { setIsDashboardOpen(false); setIsUploadOpen(true); }} style={{ width: '100%', padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #00f2fe, #00ff9d)', color: '#000', fontWeight: '900', border: 'none', cursor: 'pointer' }}>➕ Upload New Item</button>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>You need seller/admin permission to upload items.</p>
                  )}
                </div>
              )}

              {dashboardSection === 'orders' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Current Cart</div>
                  {cart.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '15px' }}>Your cart is empty.</p> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                      {cart.map((item) => (
                        <div key={item.product.id} style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                          <div style={{ fontWeight: '800' }}>{item.product.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Qty: {item.quantity} • {settings.currencySymbol}{(item.product.price * item.quantity).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#00f2fe', marginBottom: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>📦 Order History & Logs</div>
                  {storeOrders.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>No past orders recorded yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                      {storeOrders
                        .filter(o => isUserAdmin || o.user_email === currentUser?.email)
                        .map((ord) => (
                          <div key={ord.id} style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0,242,254,0.06)', border: '1px solid rgba(0,242,254,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: '#00f2fe' }}>
                              <span>Order #{ord.id}</span>
                              <span style={{ color: ord.status === 'Pending' ? '#ff3366' : '#25d366' }}>{ord.status}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0' }}>{new Date(ord.created_at).toLocaleDateString()} • {ord.user_email}</div>
                            <div style={{ fontWeight: '900', fontSize: '0.85rem' }}>Total: {settings.currencySymbol}{ord.grand_total.toLocaleString()}</div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {dashboardSection === 'broadcast' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Inbox & Broadcasts</div>
                  
                  {isUserAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Send an Automated Broadcast:</span>
                      <input value={broadcastSubject} onChange={(e) => setBroadcastSubject(e.target.value)} placeholder="Subject" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                      <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} rows={3} placeholder="Message body..." style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                      
                      <button onClick={handleSendBroadcast} style={{ padding: '10px', borderRadius: '8px', background: 'linear-gradient(135deg, #ff3366, #00f2fe)', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                        🚀 Send Automated Broadcast (Banner + Email to All)
                      </button>

                      {broadcastStatus && <div style={{ fontSize: '0.75rem', color: '#00f2fe' }}>{broadcastStatus}</div>}
                    </div>
                  )}

                  {/* Broadcast Feed */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {broadcasts.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No messages yet.</p> : 
                      broadcasts.map(b => (
                        <div key={b.id} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', borderLeft: '3px solid #ff3366', position: 'relative' }}>
                          
                          {/* Admin Delete Button */}
                          {isUserAdmin && (
                            <button 
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this broadcast?')) {
                                  const { error } = await supabase.from('broadcasts').delete().eq('id', b.id);
                                  if (!error) {
                                    setBroadcasts(prev => prev.filter(item => item.id !== b.id));
                                    if (activeBroadcast?.id === b.id) setActiveBroadcast(null);
                                  } else {
                                    alert('Error deleting broadcast: ' + error.message);
                                  }
                                }
                              }} 
                              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>
                              🗑️ Delete
                            </button>
                          )}

                          <div style={{ fontWeight: '800', fontSize: '0.9rem', paddingRight: isUserAdmin ? '50px' : '0' }}>{b.subject}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>{b.message}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '8px', textAlign: 'right' }}>Sent by {b.sentBy} on {new Date(b.created_at).toLocaleDateString()}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {dashboardSection === 'customers' && isUserAdmin && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>User Management</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {registeredUsers.map((u) => (
                      <div key={u.email} style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{u.email}</div>
                          <div style={{ fontSize: '0.75rem', color: u.role === 'admin' ? '#ff3366' : u.isEligibleToUpload ? '#00f2fe' : '#94a3b8' }}>{u.role.toUpperCase()}</div>
                        </div>
                        {u.role !== 'admin' && (
                          <button onClick={() => toggleUserEligibility(u.email, u.isEligibleToUpload)} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: u.isEligibleToUpload ? '#ef4444' : '#25d366', color: '#fff' }}>
                            {u.isEligibleToUpload ? 'Revoke Upload' : 'Grant Upload'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboardSection === 'policy' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '10px' }}>Terms & Return Policy</div>
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.7', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <strong style={{ color: '#00f2fe' }}>1. Payment Terms:</strong>
                    <p style={{ marginBottom: '12px', marginTop: '4px' }}>All orders must be paid in full to the provided official bank accounts before dispatch. Cash on delivery is not supported unless explicitly agreed upon.</p>
                    
                    <strong style={{ color: '#00f2fe' }}>2. Return & Exchange Policy:</strong>
                    <p style={{ marginBottom: '12px', marginTop: '4px' }}>Returns are accepted within 3 days of delivery only if the item received is defective or significantly different from the description. Items must be in their original, unused condition.</p>
                    
                    <strong style={{ color: '#00f2fe' }}>3. Shipping & Dispatch:</strong>
                    <p style={{ marginBottom: '12px', marginTop: '4px' }}>Orders are dispatched within 24-48 hours after payment confirmation. Delivery times vary by your location.</p>
                    
                    <strong style={{ color: '#00f2fe' }}>4. Customer Support:</strong>
                    <p style={{ marginTop: '4px' }}>If you experience any issues with your order, please contact our founder directly via the WhatsApp lines provided in the contact section.</p>
                  </div>
                </div>
              )}

              {dashboardSection === 'founder' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '10px' }}>Founder Contact</div>
                  <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #ff3366', marginBottom: '10px' }}>
                    <img src={authorImage} alt={authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>{authorName}</h4>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8' }}>{authorBio}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <a href={`https://wa.me/${settings.primaryPhone}`} target="_blank" rel="noreferrer" style={{ background: '#25d366', color: '#fff', padding: '8px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '800', textAlign: 'center' }}>💬 Chat on WhatsApp</a>
                    {settings.socialInstagram && <a href={settings.socialInstagram} target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: '#fff', padding: '8px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '800', textAlign: 'center' }}>📷 Instagram</a>}
                  </div>
                </div>
              )}

              {dashboardSection === 'account' && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '10px' }}>Account & Security</div>
                  {currentUser ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Logged in as:</div>
                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#00f2fe' }}>{currentUser.email}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isUserAdmin ? '#ff3366' : '#25d366', marginTop: '4px' }}>Role: {currentUser.role.toUpperCase()}</div>
                      </div>
                      <button onClick={() => { setIsDashboardOpen(false); handleLogout(); }} style={{ width: '100%', padding: '10px', borderRadius: '12px', background: '#ef4444', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer' }}>🚪 Logout from Account</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>You are not logged in. Access your member account or register below.</p>
                      <button onClick={() => { setIsDashboardOpen(false); setIsLoginOpen(true); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff3366, #00f2fe)', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer' }}>🔐 Open Login / Register</button>
                    </div>
                  )}
                </div>
              )}

              {dashboardSection === 'settings' && isUserAdmin && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#ff3366', marginBottom: '8px' }}>Global Settings</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div><label style={{fontSize:'0.7rem'}}>Store Name</label><input value={settings.storeName} onChange={(e) => setSettings({...settings, storeName: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
                    <div><label style={{fontSize:'0.7rem'}}>Tagline</label><input value={settings.storeTagline} onChange={(e) => setSettings({...settings, storeTagline: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
                    <div><label style={{fontSize:'0.7rem'}}>Currency Symbol</label><input value={settings.currencySymbol} onChange={(e) => setSettings({...settings, currencySymbol: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
                    <div><label style={{fontSize:'0.7rem'}}>Delivery Fee (Amount)</label><input type="number" value={settings.deliveryFee} onChange={(e) => setSettings({...settings, deliveryFee: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
                    <div><label style={{fontSize:'0.7rem'}}>Primary Phone (No + sign)</label><input value={settings.primaryPhone} onChange={(e) => setSettings({...settings, primaryPhone: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', background: 'rgba(255,51,106,0.1)', padding: '10px', borderRadius: '8px' }}>
                      <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Enable Maintenance Mode (Hides store from buyers)</label>
                    </div>

                    <button onClick={handleSaveSettings} style={{ padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #00f2fe, #00ff9d)', color: '#000', fontWeight: '900', border: 'none', cursor: 'pointer', marginTop: '10px' }}>⚙️ Save All Settings Globally</button>
                    {broadcastStatus && <div style={{ fontSize: '0.75rem', color: '#00f2fe', textAlign: 'center' }}>{broadcastStatus}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== CART DRAWER ===== */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: '100%', maxWidth: '460px', background: isDark ? '#090d16' : '#ffffff', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,0.5)', borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
            <div style={{ padding: '20px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '1.4rem' }}>🛒</span><h2 style={{ fontSize: '1.2rem', fontWeight: '900', margin: 0 }}>Shopping Cart</h2></div>
              <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto 0', color: isDark ? '#94a3b8' : '#64748b' }}>🛒 Your cart is empty.<br/>Browse items and add to cart!</div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '16px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                    <img src={item.selectedColorImage || item.product.image} alt={item.product.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '12px', border: '1px solid rgba(255,51,106,0.3)' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.88rem', fontWeight: '800' }}>{item.product.title}</h4>
                      <div style={{ fontSize: '0.85rem', color: '#ff3366', fontWeight: '900' }}>{settings.currencySymbol}{item.product.price.toLocaleString()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <button onClick={() => updateQuantity(item.product.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: isDark ? '#fff' : '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                        <span style={{ fontSize: '0.82rem', fontWeight: '800' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: isDark ? '#fff' : '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '900' }}>{settings.currencySymbol}{(item.product.price * item.quantity).toLocaleString()}</div>
                      <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', marginTop: '8px', fontWeight: 'bold' }}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '20px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}><span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Items Subtotal:</span><span style={{ fontWeight: '800' }}>{settings.currencySymbol}{cartSubtotal.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}><span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Delivery Fee:</span><span style={{ fontWeight: '800' }}>{settings.deliveryFee > 0 ? `${settings.currencySymbol}${settings.deliveryFee.toLocaleString()}` : 'Talk to Seller'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.2rem', fontWeight: '900' }}><span>Grand Total:</span><span style={{ color: '#ff3366' }}>{settings.currencySymbol}{grandTotal.toLocaleString()}</span></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    if (cart.length === 0) return;
                    setIsCheckoutModalOpen(true); // Triggers the bank popup
                  }}
                  style={{ background: '#25d366', color: '#fff', padding: '14px', borderRadius: '30px', border: 'none', textAlign: 'center', fontWeight: '900', fontSize: '0.92rem', boxShadow: '0 4px 20px rgba(37,211,102,0.4)', cursor: 'pointer', pointerEvents: cart.length === 0 ? 'none' : 'auto', opacity: cart.length === 0 ? 0.5 : 1 }}
                >
                  SEND ORDERS NOW
                </button>
                <a href={generateWhatsAppLink(settings.backupPhone)} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,0.06)', color: isDark ? '#fff' : '#000', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, padding: '10px', borderRadius: '30px', textDecoration: 'none', textAlign: 'center', fontWeight: '800', fontSize: '0.8rem', pointerEvents: cart.length === 0 ? 'none' : 'auto', opacity: cart.length === 0 ? 0.5 : 1 }}>📞 Backup Line ({settings.backupPhone}) →</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHECKOUT BANK DETAILS MODAL ===== */}
      {isCheckoutModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '24px', background: isDark ? '#0f172a' : '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#00f2fe' }}>🏦 Secure Payment</h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
              To complete your order of <strong style={{ color: '#ff3366', fontSize: '1rem' }}>{settings.currencySymbol}{grandTotal.toLocaleString()}</strong>, please transfer the exact amount to any of our official accounts below:
            </p>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(0,242,254,0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#ff3366', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase' }}>Option 1: OPay</div>
              <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px' }}>6110935365</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>DARLINGTINA Chiamaka JUDE</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(0,242,254,0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#ff3366', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase' }}>Option 2: Guaranty Trust Bank (GTB)</div>
              <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px' }}>0939827195</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Darlingtina Chiamaka Jude</div>
            </div>

            <button 
              onClick={async () => {
                // Step 2: Save order to Supabase database
                const orderPayload = {
                  user_email: currentUser?.email || 'guest@shop4everything.com',
                  items: cart.map(i => ({
                    title: i.product.title,
                    price: i.product.price,
                    quantity: i.quantity,
                    colorIndex: i.selectedColorIndex || 1,
                    image: i.selectedColorImage || i.product.image
                  })),
                  subtotal: cartSubtotal,
                  delivery_fee: settings.deliveryFee,
                  grand_total: grandTotal,
                  status: 'Pending'
                };

                await supabase.from('orders').insert([orderPayload]);

                // Step 3: Open WhatsApp link to send the order evidence
                window.open(generateWhatsAppLink(settings.primaryPhone), '_blank');
                
                // Step 4: Close the modals
                setIsCheckoutModalOpen(false);
                setIsCartOpen(false);
              }}
              style={{ width: '100%', padding: '14px', borderRadius: '30px', background: 'linear-gradient(135deg, #25d366, #128c7e)', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,211,102,0.3)' }}
            >
              ✓ I HAVE MADE PAYMENT
            </button>
          </div>
        </div>
      )}

      {/* ===== AUTHENTICATION MODAL (REGISTER vs LOGIN + REMEMBER ME) ===== */}
      {isLoginOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#00f2fe' }}>
                {authMode === 'login' ? '🔐 Member Login' : '📝 Guest Registration'}
              </h3>
              <button onClick={() => setIsLoginOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Mode Switch Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
              <button type="button" onClick={() => setAuthMode('login')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMode === 'login' ? '#ff3366' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>Login</button>
              <button type="button" onClick={() => setAuthMode('register')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: authMode === 'register' ? '#ff3366' : 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>Register</button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="e.g. user@email.com" required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Password</label>
                <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              </div>

              {/* Remember Me Checkbox & Forgot Password Link */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} id="rememberMe" style={{ width: '16px', height: '16px', accentColor: '#ff3366' }} />
                  <label htmlFor="rememberMe" style={{ fontSize: '0.8rem', cursor: 'pointer', color: '#cbd5e1' }}>Remember me</label>
                </div>

                {authMode === 'login' && (
                  <button 
                    type="button" 
                    onClick={handlePasswordReset} 
                    style={{ background: 'none', border: 'none', color: '#00f2fe', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 'bold' }}>
                    Forgot Password?
                  </button>
                )}
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ff3366, #00f2fe)', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: '900', fontSize: '0.9rem', cursor: 'pointer' }}>
                {authMode === 'login' ? '🚀 Secure Login' : '✨ Register & Get Welcome Email'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== UPLOAD ITEM MODAL (MULTI-IMAGE / COLOR VARIANTS) ===== */}
      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#00f2fe' }}>➕ Upload Item</h3>
              <button onClick={() => setIsUploadOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddNewProduct}>
              <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Title</label><input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
              <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Category</label><select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>{categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Actual Price</label><input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Fake Price (Optional)</label><input type="number" value={newOriginalPrice} onChange={(e) => setNewOriginalPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
              </div>

              {/* COMPRESSOR QUALITY SLIDER FOR UPLOADS */}
              <div style={{ marginBottom: '14px', background: 'rgba(0,242,254,0.08)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(0,242,254,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#00f2fe' }}>⚡ Active Image Compressor Quality</label>
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff' }}>{Math.round(compressionQuality * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.35" 
                  max="0.95" 
                  step="0.05" 
                  value={compressionQuality} 
                  onChange={(e) => setCompressionQuality(parseFloat(e.target.value))} 
                  style={{ width: '100%', accentColor: '#00f2fe', cursor: 'pointer' }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Applies instantly to all new uploads & saves preference.</span>
                 {currentUser && adminEmails.includes(currentUser.email) && (
                    <button 
                      type="button" 
                      onClick={compressExistingProductsInSupabase}
                      style={{ background: '#ff3366', color: '#fff', border: 'none', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', cursor: 'pointer' }}
                    >
                      🚀 Compress All Old DB Items
                    </button>
                  )}
                </div>
              </div>
              
              {/* Multi-Image File Selection */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📷 Upload Color Variant Images (Select multiple)</label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleMultipleFilesChange(e, setNewImagesList)} style={{ width: '100%', padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px dashed #00f2fe', color: '#fff' }} />
                {newImagesList.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '10px', paddingBottom: '4px' }}>
                    {newImagesList.map((img, idx) => (
                      <img key={idx} src={img} alt="Preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid #00f2fe' }} />
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Tag</label><input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="🟢 In Stock" style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
              <div style={{ marginBottom: '18px' }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Description</label><textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #00f2fe, #00ff9d)', color: '#000', border: 'none', borderRadius: '30px', fontWeight: '900', cursor: 'pointer' }}>🚀 Publish Product</button>
            </form>
          </div>
        </div>
      )}

     {/* ===== EDIT ITEM MODAL WITH COMPRESSOR & FULL IMAGE MANAGER ===== */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }} onClick={() => setEditingProduct(null)}>
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto', background: isDark ? '#0f172a' : '#ffffff' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#ff3366' }}>✏️ Edit Product & Manage Images</h3>
              <button onClick={() => setEditingProduct(null)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSaveEditProduct}>
              <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Title</label><input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
              <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Category</label><select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>{categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Actual Price</label><input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Fake Price</label><input type="number" value={editOriginalPrice} onChange={(e) => setEditOriginalPrice(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
              </div>
              
              {/* IMAGE COMPRESSION LEVEL CONTROLLER */}
              <div style={{ marginBottom: '14px', background: 'rgba(0,242,254,0.08)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(0,242,254,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#00f2fe' }}>⚡ Image Compressor Quality</label>
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff' }}>{Math.round(compressionQuality * 100)}% Quality</span>
                </div>
                <input 
                  type="range" 
                  min="0.3" 
                  max="0.95" 
                  step="0.05" 
                  value={compressionQuality} 
                  onChange={(e) => setCompressionQuality(parseFloat(e.target.value))} 
                  style={{ width: '100%', accentColor: '#00f2fe', cursor: 'pointer' }} 
                />
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Lower quality = smaller file size & faster loading speeds.</span>
              </div>

              {/* Multi-Image Edit & Removal Manager */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>📷 Update & Manage Color Variant Images (Tap ✕ to remove)</label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleMultipleFilesChange(e, setEditImagesList)} style={{ width: '100%', padding: '8px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px dashed #ff3366', color: '#fff', marginBottom: '10px' }} />
                
                {editImagesList.length > 0 ? (
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {editImagesList.map((imgUrl, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #ff3366', background: '#000' }}>
                        <img src={imgUrl} alt={`Variant ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditImagesList(prev => prev.filter((_, i) => i !== idx));
                          }} 
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Remove image"
                        >
                          ✕
                        </button>
                        <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.55rem', padding: '1px 3px', borderRadius: '4px' }}>Img {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444' }}>⚠️ At least one image is recommended.</p>
                )}
              </div>

              <div style={{ marginBottom: '12px' }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Tag</label><input type="text" value={editTag} onChange={(e) => setEditTag(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
              <div style={{ marginBottom: '18px' }}><label style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>Description</label><textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} /></div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ff3366, #ff3366dd)', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: '900', cursor: 'pointer' }}>💾 Save & Compress Changes</button>
            </form>
          </div>
        </div>
      )}

     {/* ===== COLOR VARIANT MINI VIEWER MODAL ===== */}
      {viewingProductImages && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} onClick={() => setViewingProductImages(null)}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '24px', background: isDark ? '#0f172a' : '#ffffff', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#00f2fe' }}>🎨 Color Variants</h3>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tap any color to add to cart</span>
              </div>
              <button onClick={() => setViewingProductImages(null)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {viewingProductImages.map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    const parentProduct = products.find(p => p.images && p.images.includes(imgUrl));
                    if (parentProduct) {
                      addToCart(parentProduct, imgUrl, idx + 1);
                      setViewingProductImages(null);
                    }
                  }}
                  style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '2px solid rgba(0,242,254,0.4)', background: '#000', height: '160px', cursor: 'pointer' }}
                  title="Click to add this color variant to cart"
                >
                  <img src={imgUrl} alt={`Color Variant ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.85)', color: '#00f2fe', fontSize: '0.7rem', fontWeight: '900', padding: '3px 8px', borderRadius: '6px' }}>
                    Image {idx + 1} (Tap to Buy)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CHECKOUT BANK DETAILS MODAL ===== */}
      {isCheckoutModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '24px', background: isDark ? '#0f172a' : '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: '#00f2fe' }}>🏦 Secure Payment</h3>
              <button onClick={() => setIsCheckoutModalOpen(false)} style={{ background: 'none', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
              To complete your order of <strong style={{ color: '#ff3366', fontSize: '1rem' }}>{settings.currencySymbol}{grandTotal.toLocaleString()}</strong>, please transfer the exact amount to any of our official accounts below:
            </p>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(0,242,254,0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#ff3366', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase' }}>Option 1: OPay</div>
              <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px' }}>6110935365</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>DARLINGTINA Chiamaka JUDE</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(0,242,254,0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#ff3366', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase' }}>Option 2: Guaranty Trust Bank (GTB)</div>
              <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px' }}>0939827195</div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Darlingtina Chiamaka Jude</div>
            </div>

            <button 
              onClick={async () => {
                // Save order to Supabase database
                const orderPayload = {
                  user_email: currentUser?.email || 'guest@shop4everything.com',
                  items: cart.map(i => ({
                    title: i.product.title,
                    price: i.product.price,
                    quantity: i.quantity,
                    colorIndex: i.selectedColorIndex || 1,
                    image: i.selectedColorImage || i.product.image
                  })),
                  subtotal: cartSubtotal,
                  delivery_fee: settings.deliveryFee,
                  grand_total: grandTotal,
                  status: 'Pending'
                };

                await supabase.from('orders').insert([orderPayload]);

                // Open WhatsApp link to send the order evidence
                window.open(generateWhatsAppLink(settings.primaryPhone), '_blank');
                
                // Close the modals
                setIsCheckoutModalOpen(false);
                setIsCartOpen(false);
              }}
              style={{ width: '100%', padding: '14px', borderRadius: '30px', background: 'linear-gradient(135deg, #25d366, #128c7e)', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,211,102,0.3)' }}
            >
              ✓ I HAVE MADE PAYMENT
            </button>
          </div>
        </div>
      )}

      {/* ===== FLOATING ACTION BUTTONS (SHARE & CHATBOT) ===== */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 90, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: settings.storeName, text: settings.storeTagline, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Store link copied to clipboard!');
            }
          }}
          style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
          title="Share Store"
        >
          🔗
        </button>

        <button 
          onClick={() => setIsChatOpen(true)}
          style={{ width: '55px', height: '55px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff3366, #00f2fe)', color: '#fff', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,51,106,0.4)' }}
          title="Darling Chatbot"
        >
          💬
        </button>
      </div>

      {/* ===== DARLING CHATBOT MODAL ===== */}
      {isChatOpen && (
        <div style={{ position: 'fixed', bottom: '90px', right: '20px', zIndex: 100, width: '340px', maxWidth: 'calc(100vw - 40px)', height: '420px', background: isDark ? '#0f172a' : '#ffffff', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(0,242,254,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #ff3366, #00f2fe)', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: '900', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span> Darling Chatbot
            </div>
            <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? '#00f2fe' : 'rgba(255,255,255,0.1)', color: msg.role === 'user' ? '#000' : '#fff', padding: '10px 14px', borderRadius: '14px', maxWidth: '85%', fontSize: '0.85rem', lineHeight: '1.4' }}>
                {msg.content}
              </div>
            ))}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)' }}>
            <input 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Ask me anything..." 
              style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
            />
            <button 
              onClick={handleSendMessage}
              style={{ background: '#ff3366', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}