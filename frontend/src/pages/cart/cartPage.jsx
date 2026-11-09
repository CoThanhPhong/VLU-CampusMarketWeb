import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Hàm gọi API lấy giỏ hàng từ Server
  const fetchCartFromAPI = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart/g', {
        method: 'GET',
        credentials: 'include', // Gửi kèm Cookie/Session
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setCartItems(data.data);
        // Lưu lại vào sessionStorage
        sessionStorage.setItem('cartItems', JSON.stringify(data.data));
      }
    } catch (error) {
      console.error('Lỗi kết nối API:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Hàm đồng bộ giỏ hàng lên Server khi CRUD (tăng giảm, xóa)
  const syncCartToServer = async (updatedItems) => {
    try {
      await fetch('/api/cart/u', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items: updatedItems }),
      });
    } catch (error) {
      console.error('Lỗi đồng bộ giỏ hàng lên server:', error);
    }
  };

  // 3. Xử lý khi load trang hoặc bấm F5
  useEffect(() => {
    // Kiểm tra xem user có vừa bấm F5 (reload) trình duyệt hay không
    const navEntries = performance.getEntriesByType('navigation');
    const isReload = navEntries.length > 0 && navEntries[0].type === 'reload';

    const savedCart = sessionStorage.getItem('cartItems');

    if (isReload || !savedCart) {
      // TRƯỜNG HỢP 1: Vừa bấm F5 hoặc chưa có dữ liệu trong sessionStorage -> Gọi API lấy mới từ server
      fetchCartFromAPI();
      window.dispatchEvent(new Event('cartUpdated'));
    } else {
      // TRƯỜNG HỢP 2: Chuyển trang nội bộ (Client-side routing) -> Dùng luôn data sẵn có trong sessionStorage cho mượt
      setCartItems(JSON.parse(savedCart));
      window.dispatchEvent(new Event('cartUpdated'));
    }
  }, []);

  // Thay đổi số lượng (CRUD)
  const handleQuantityChange = (id, delta) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item._id === id) {
          const newQty = item.quantity + delta;
          if (newQty >= 0 && newQty <= item.amount) {
            if (newQty === 0) {
            handleRemoveItem(item._id);
          }
            window.dispatchEvent(new Event('cartUpdated'));
            return { ...item, quantity: newQty };
          } 
        }
        return item;
      });
      syncCartToServer(updated); // Đồng bộ ngầm lên server
      return updated;
    });
  };

  // Xóa sản phẩm (CRUD)
  const handleRemoveItem = (id) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item._id !== id);
      sessionStorage.setItem('cartItems', JSON.stringify(updated));
      syncCartToServer(updated); // Đồng bộ ngầm lên server
      return updated;
    });
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    sessionStorage.setItem('checkoutItems', JSON.stringify(cartItems));
    navigate('/checkout');
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Giỏ Hàng Của Bạn {loading && <span style={{fontSize: '14px', color: '#888'}}>(Đang đồng bộ từ server...)</span>}</h2>
      </div>
      
      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>Giỏ hàng của bạn đang trống.</p>
        </div>
      ) : (
        <div>
          {cartItems.map(item => (
            <div key={item._id} style={{ display: 'flex', borderBottom: '1px solid #e1e1e1', padding: '20px 0', alignItems: 'center', gap: '20px' }}>
              <img src={item.img} alt={item.name} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#2c3e50' }}>{item.name}</h4>
                <p style={{ margin: '4px 0', color: '#555' }}>Cơ sở lưu trữ: <strong>{item.local}</strong></p>
                <p style={{ margin: '4px 0', color: '#e74c3c', fontWeight: 'bold' }}>{item.price.toLocaleString()} VNĐ</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8f9fa', padding: '6px 12px', borderRadius: '6px' }}>
                <button onClick={() => handleQuantityChange(item._id, -1)} style={{ padding: '4px 10px', cursor: 'pointer', border: '1px solid #ccc', background: '#fff', borderRadius: '4px' }}>-</button>
                <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => handleQuantityChange(item._id, 1)} style={{ padding: '4px 10px', cursor: 'pointer', border: '1px solid #ccc', background: '#fff', borderRadius: '4px' }}>+</button>
              </div>
              <button onClick={() => handleRemoveItem(item._id)} style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Xóa</button>
            </div>
          ))}

          <div style={{ marginTop: '30px', textAlign: 'right', background: '#fdfdfd', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Tổng thanh toán: <span style={{ color: '#e74c3c' }}>{totalPrice.toLocaleString()} VNĐ</span></h3>
            <button 
              onClick={handleProceedToCheckout}
              style={{ padding: '12px 24px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      )}
    </div>
  );
}