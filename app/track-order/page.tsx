'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TrackOrderPage() {
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_email', email.trim().toLowerCase())
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ color: '#ff3366', fontSize: '1.8rem', fontWeight: '900' }}>Track Your Order</h1>
        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Enter the email you used to place the order.</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #333', color: '#fff' }}
          />
          <button onClick={handleSearch} style={{ padding: '10px 20px', background: '#ff3366', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>

        {orders.length === 0 && !loading && email && (
          <p style={{ color: '#64748b' }}>No orders found for that email.</p>
        )}

        {orders.map(order => (
          <div key={order.id} style={{ background: '#111', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ color: '#00f2fe' }}>Order #{order.id}</strong>
              <span style={{ color: order.status === 'Pending' ? '#ff3366' : '#25d366', fontWeight: 'bold' }}>{order.status}</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <div>Date: {new Date(order.created_at).toLocaleString()}</div>
              <div>Total: ₦{order.grand_total?.toLocaleString()}</div>
              <div>Items: {order.items?.length || 0}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}