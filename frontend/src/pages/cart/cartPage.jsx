import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, CheckSquare, Square, Store, AlertCircle } from 'lucide-react';
import axios from 'axios';
import '../../css/CustomModal.css';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({});
  const [notification, setNotification] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Tải giỏ hàng và đồng bộ thông tin tác giả
  useEffect(() => {
    let isMounted = true;

    const fetchCartAndProducts = async () => {
      try {
        setLoading(true);
        
        const [cartRes, prodRes] = await Promise.all([
          axios.get('/api/cart/g', { withCredentials: true }).catch(() => null),
          axios.get('/api/products/g', { withCredentials: true }).catch(() => null)
        ]);

        if (!isMounted) return;

        let items = [];
        if (cartRes && cartRes.data && cartRes.data.success) {
          items = cartRes.data.data?.items || cartRes.data.data || [];
        } else {
          const saved = sessionStorage.getItem('cartItems');
          if (saved) items = JSON.parse(saved);
        }

        const allProducts = prodRes?.data?.data || [];

        const enrichedItems = items.map(item => {
          const productId = item.product || item._id;
          const foundProduct = allProducts.find(p => String(p._id) === String(productId));
          if (foundProduct && foundProduct.author) {
            return { ...item, author: foundProduct.author };
          }
          return item;
        });

        setCartItems(enrichedItems);
      } catch (err) {
        console.warn("Lỗi tải giỏ hàng:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCartAndProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateCartOnServer = async (updatedItems) => {
    try {
      const res = await axios.post('/api/cart/u', { items: updatedItems }, { withCredentials: true });
      if (res.data.success) {
        const newItems = res.data.data?.items || res.data.data || updatedItems;
        setCartItems(newItems);
        sessionStorage.setItem('cartItems', JSON.stringify(newItems));
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      setCartItems(updatedItems);
      sessionStorage.setItem('cartItems', JSON.stringify(updatedItems));
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const handleQuantityChange = (index, delta) => {
    const updated = [...cartItems];
    const item = updated[index];
    const newQty = (item.quantity || 1) + delta;
    const maxStock = item.amount || 99;

    if (newQty >= 1 && newQty <= maxStock) {
      item.quantity = newQty;
      updateCartOnServer(updated);
    }
  };

  const handleRemoveItem = (index) => {
    const updated = cartItems.filter((_, i) => i !== index);
    updateCartOnServer(updated);
    showToast('Đã xóa sản phẩm khỏi giỏ hàng.', 'success');
  };

  const handleRemoveSelected = () => {
    const updated = cartItems.filter((_, index) => !selectedItems[index]);
    setSelectedItems({});
    updateCartOnServer(updated);
    showToast('Đã xóa các sản phẩm đã chọn.', 'success');
  };

  // Xóa các sản phẩm được chọn riêng cho từng nhóm người bán
  const handleRemoveStoreSelected = (storeItemIndices) => {
    const updated = cartItems.filter((_, index) => !storeItemIndices.includes(index) || !selectedItems[index]);
    
    const nextSelected = { ...selectedItems };
    storeItemIndices.forEach(idx => delete nextSelected[idx]);
    setSelectedItems(nextSelected);

    updateCartOnServer(updated);
    showToast('Đã xóa các sản phẩm đã chọn trong nhóm.', 'success');
  };

  const toggleSelectItem = (index) => {
    setSelectedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleSelectStore = (storeItemsIndexList) => {
    const allSelected = storeItemsIndexList.every(index => selectedItems[index]);
    setSelectedItems(prev => {
      const next = { ...prev };
      storeItemsIndexList.forEach(index => {
        next[index] = !allSelected;
      });
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allSelected = cartItems.length > 0 && cartItems.every((_, index) => selectedItems[index]);
    const next = {};
    if (!allSelected) {
      cartItems.forEach((_, index) => { next[index] = true; });
    }
    setSelectedItems(next);
  };

  // --- GOM NHÓM THEO TÁC GIẢ ---
  const groupedByStore = cartItems.reduce((acc, item, index) => {
    const authorField = item.author;
    let storeId = 'vlu-store-chung';
    let storeName = 'Thành viên VLU';

    if (authorField) {
      if (typeof authorField === 'object' && authorField !== null) {
        storeId = String(authorField._id || authorField.id || 'vlu-store-chung');
        storeName = authorField.profile?.name || authorField.name || 'Thành viên VLU';
      } else {
        storeId = String(authorField);
        storeName = `Người bán (${String(authorField).slice(-6)})`;
      }
    }

    if (!acc[storeId]) {
      acc[storeId] = { storeName, items: [] };
    }
    acc[storeId].items.push({ ...item, originalIndex: index });
    return acc;
  }, {});

  const totalSelectedPrice = cartItems.reduce((sum, item, index) => {
    if (selectedItems[index]) {
      return sum + (item.price || 0) * (item.quantity || 1);
    }
    return sum;
  }, 0);

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  const handleCheckoutSelected = () => {
    const itemsToCheckout = cartItems.filter((_, index) => selectedItems[index]);
    if (itemsToCheckout.length === 0) {
      showToast('Vui lòng chọn ít nhất một sản phẩm để thanh toán.', 'error');
      return;
    }
    sessionStorage.setItem('checkoutItems', JSON.stringify(itemsToCheckout));
    navigate('/checkout');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Đang tải giỏ hàng...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px', fontFamily: 'Inter, sans-serif' }}>
      {notification && (
        <div className="custom-toast-container">
          <div className={`custom-toast ${notification.type}`}>
            <AlertCircle size={18} /> {notification.msg}
          </div>
        </div>
      )}

      <button className="back-link" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', color: '#475569', cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={16}/> Tiếp tục mua sắm
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShoppingBag size={24} color="#2563eb" /> Giỏ Hàng Của Tôi ({cartItems.length})
        </h2>
        
        {cartItems.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={toggleSelectAll} 
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {cartItems.length > 0 && cartItems.every((_, i) => selectedItems[i]) ? <CheckSquare size={18}/> : <Square size={18}/>}
              Chọn tất cả
            </button>

            {selectedCount > 0 && (
              <button 
                onClick={handleRemoveSelected}
                style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={16} /> Xóa đã chọn ({selectedCount})
              </button>
            )}
          </div>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <ShoppingBag size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>Giỏ hàng của bạn đang trống</h3>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Hãy khám phá thêm các sản phẩm tuyệt vời trên VLU Campus Market nhé!</p>
          <button onClick={() => navigate('/')} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            Khám phá ngay
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.entries(groupedByStore).map(([storeId, storeData]) => {
            const storeItemIndices = storeData.items.map(i => i.originalIndex);
            const isStoreAllSelected = storeItemIndices.every(idx => selectedItems[idx]);
            const storeSelectedCount = storeItemIndices.filter(idx => selectedItems[idx]).length;

            return (
              <div key={storeId} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {/* Header nhóm: cố định hiệu ứng hover cho nút và tiêu đề */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      onClick={() => toggleSelectStore(storeItemIndices)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {isStoreAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    <Store size={18} color="#475569" />
                    <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{storeData.storeName}</span>
                  </div>

                  {storeSelectedCount > 0 && (
                    <button 
                      onClick={() => handleRemoveStoreSelected(storeItemIndices)}
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    >
                      <Trash2 size={14} /> Xóa nhóm này ({storeSelectedCount})
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {storeData.items.map((item) => {
                    const idx = item.originalIndex;
                    const isSelected = !!selectedItems[idx];
                    const productImg = Array.isArray(item.img) ? item.img[0] : (item.img || 'https://via.placeholder.com/70');

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                        <button 
                          onClick={() => toggleSelectItem(idx)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSelected ? '#2563eb' : '#94a3b8', display: 'flex', alignItems: 'center', transition: 'transform 0.1s' }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>

                        <img 
                          src={productImg} 
                          alt={item.name} 
                          style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                        />

                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{item.name}</h4>
                          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>📍 Địa điểm: {item.local || 'Cơ sở 1'}</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#dc2626' }}>
                            {(item.price || 0).toLocaleString('vi-VN')} VNĐ
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                          <button onClick={() => handleQuantityChange(idx, -1)} style={{ padding: '4px 10px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                          <span style={{ padding: '0 12px', fontSize: '14px', fontWeight: '600' }}>{item.quantity || 1}</span>
                          <button onClick={() => handleQuantityChange(idx, 1)} style={{ padding: '4px 10px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                        </div>

                        <button 
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px', transition: 'color 0.2s' }}
                          title="Xóa sản phẩm"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#dc2626'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginTop: '10px' }}>
            <div>
              <span style={{ fontSize: '14px', color: '#64748b' }}>Đã chọn: <b>{selectedCount}</b> sản phẩm</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                Tổng thanh toán: <span style={{ color: '#dc2626' }}>{totalSelectedPrice.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <button 
              onClick={handleCheckoutSelected}
              disabled={selectedCount === 0}
              style={{ 
                backgroundColor: selectedCount > 0 ? '#dc2626' : '#94a3b8', 
                color: '#fff', 
                border: 'none', 
                padding: '12px 28px', 
                borderRadius: '8px', 
                fontSize: '15px', 
                fontWeight: '700', 
                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed', 
                boxShadow: selectedCount > 0 ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => { if (selectedCount > 0) e.currentTarget.style.backgroundColor = '#b91c1c'; }}
              onMouseLeave={(e) => { if (selectedCount > 0) e.currentTarget.style.backgroundColor = '#dc2626'; }}
            >
              Mua Hàng ({selectedCount})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}