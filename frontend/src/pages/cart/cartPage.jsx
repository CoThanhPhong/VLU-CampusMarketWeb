import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, CheckSquare, Square, Store, AlertCircle } from 'lucide-react';
import axios from 'axios';
import '../../css/CustomModal.css';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState({}); // Lưu theo dạng { "productId_local": true }
  const [notification, setNotification] = useState(null);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Tải giỏ hàng, danh sách sản phẩm và phân giải thông tin tác giả đầy đủ
  useEffect(() => {
    let isMounted = true;

    const fetchCartAndProducts = async () => {
      try {
        setLoading(true);
        
        const [cartRes, prodRes] = await Promise.all([
          axios.get('/api/cart/g', { withCredentials: true }).catch(() => null),
          axios.get('/api/products/g?getAll=true', { withCredentials: true }).catch(() => null)
        ]);

        if (!isMounted) return;

        let items = [];
        if (cartRes && cartRes.data && cartRes.data.success) {
          items = cartRes.data.data?.items || cartRes.data.data || [];
        } else {
          const saved = sessionStorage.getItem('cartItems');
          if (saved) items = JSON.parse(saved);
        }

        const responseData = prodRes?.data;
        const allProducts = Array.isArray(responseData) 
          ? responseData 
          : (responseData?.data || responseData?.products || []);

        const enrichedItems = await Promise.all(items.map(async (item) => {
          const productId = item.product || item._id;
          let foundProduct = allProducts.find(p => String(p._id || p.id) === String(productId));
          
          let authorData = foundProduct ? foundProduct.author : item.author;

          if (authorData && typeof authorData === 'string') {
            try {
              const userRes = await axios.post('/api/auth/user', { id: authorData });
              const userData = userRes.data?.data || userRes.data?.user || userRes.data;
              if (userData) {
                authorData = userData;
              }
            } catch (err) {
              console.warn("Không thể tải thông tin tác giả cho ID:", authorData);
            }
          }

          return { 
            ...item, 
            product: productId, // Đảm bảo luôn có trường product chuẩn
            author: authorData,
            name: foundProduct?.name || item.name,
            price: foundProduct?.price ?? item.price,
            local: foundProduct?.local || item.local,
            amount: foundProduct?.amount ?? item.amount,
            img: foundProduct?.img || item.img
          };
        }));

        if (isMounted) {
          setCartItems(enrichedItems);
        }
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
    const itemToRemove = cartItems[index];
    const key = `${itemToRemove.product}_${itemToRemove.local || 'Cơ sở 1'}`;
    
    const updated = cartItems.filter((_, i) => i !== index);
    const nextSelected = { ...selectedItems };
    delete nextSelected[key];
    setSelectedItems(nextSelected);

    updateCartOnServer(updated);
    showToast('Đã xóa sản phẩm khỏi giỏ hàng.', 'success');
  };

  const handleRemoveSelected = () => {
    const updated = cartItems.filter(item => {
      const key = `${item.product}_${item.local || 'Cơ sở 1'}`;
      return !selectedItems[key];
    });
    setSelectedItems({});
    updateCartOnServer(updated);
    showToast('Đã xóa các sản phẩm đã chọn.', 'success');
  };

  const handleRemoveStoreSelected = (storeKeys) => {
    const updated = cartItems.filter(item => {
      const key = `${item.product}_${item.local || 'Cơ sở 1'}`;
      return !storeKeys.includes(key) || !selectedItems[key];
    });
    
    const nextSelected = { ...selectedItems };
    storeKeys.forEach(k => delete nextSelected[k]);
    setSelectedItems(nextSelected);

    updateCartOnServer(updated);
    showToast('Đã xóa các sản phẩm đã chọn trong nhóm.', 'success');
  };

  const toggleSelectItem = (itemKey) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const toggleSelectStore = (storeKeys) => {
    const allSelected = storeKeys.every(key => selectedItems[key]);
    setSelectedItems(prev => {
      const next = { ...prev };
      storeKeys.forEach(key => {
        next[key] = !allSelected;
      });
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allKeys = cartItems.map(item => `${item.product}_${item.local || 'Cơ sở 1'}`);
    const allSelected = allKeys.length > 0 && allKeys.every(key => selectedItems[key]);
    const next = {};
    if (!allSelected) {
      allKeys.forEach(key => { next[key] = true; });
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
        storeName = authorField.profile?.name || authorField.name || authorField.username || 'Thành viên VLU';
      } else {
        storeId = String(authorField);
        storeName = `Người bán (${String(authorField).slice(-6)})`;
      }
    }

    if (!acc[storeId]) {
      acc[storeId] = { storeName, items: [] };
    }
    const itemKey = `${item.product}_${item.local || 'Cơ sở 1'}`;
    acc[storeId].items.push({ ...item, originalIndex: index, itemKey });
    return acc;
  }, {});

  const totalSelectedPrice = cartItems.reduce((sum, item) => {
    const itemKey = `${item.product}_${item.local || 'Cơ sở 1'}`;
    if (selectedItems[itemKey]) {
      return sum + (item.price || 0) * (item.quantity || 1);
    }
    return sum;
  }, 0);

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  const handleCheckoutSelected = () => {
    const itemsToCheckout = cartItems.filter(item => {
      const itemKey = `${item.product}_${item.local || 'Cơ sở 1'}`;
      return selectedItems[itemKey];
    });

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
              {cartItems.length > 0 && cartItems.every(item => selectedItems[`${item.product}_${item.local || 'Cơ sở 1'}`]) ? <CheckSquare size={18}/> : <Square size={18}/>}
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
            const storeKeys = storeData.items.map(i => i.itemKey);
            const isStoreAllSelected = storeKeys.every(key => selectedItems[key]);
            const storeSelectedCount = storeKeys.filter(key => selectedItems[key]).length;

            return (
              <div key={storeId} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {/* Header nhóm */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                      onClick={() => toggleSelectStore(storeKeys)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center' }}
                    >
                      {isStoreAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                    <Store size={18} color="#475569" />
                    <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{storeData.storeName}</span>
                  </div>

                  {storeSelectedCount > 0 && (
                    <button 
                      onClick={() => handleRemoveStoreSelected(storeKeys)}
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash2 size={14} /> Xóa nhóm này ({storeSelectedCount})
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {storeData.items.map((item) => {
                    const idx = item.originalIndex;
                    const itemKey = item.itemKey;
                    const isSelected = !!selectedItems[itemKey];
                    const productImg = Array.isArray(item.img) ? item.img[0] : (item.img || 'https://via.placeholder.com/70');

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                        <button 
                          onClick={() => toggleSelectItem(itemKey)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isSelected ? '#2563eb' : '#94a3b8', display: 'flex', alignItems: 'center' }}
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
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }}
                          title="Xóa sản phẩm"
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
                boxShadow: selectedCount > 0 ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none'
              }}
            >
              Mua Hàng ({selectedCount})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}