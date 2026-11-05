import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = sessionStorage.getItem('cartItems');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const handleQuantityChange = (id, delta) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item._id === id) {
          const newQty = item.quantity + delta;
          if (newQty > 0 && newQty <= item.amount) {
            return { ...item, quantity: newQty };
          }
        }
        return item;
      });
      sessionStorage.setItem('cartItems', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveItem = (id) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item._id !== id);
      sessionStorage.setItem('cartItems', JSON.stringify(updated));
      return updated;
    });
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) return;
    sessionStorage.setItem('checkoutItems', JSON.stringify(cartItems));
    navigate('/checkout');
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#333' }}>Giỏ Hàng Của Bạn</h2>
      
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