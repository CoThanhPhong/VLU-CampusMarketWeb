import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import '../../css/CustomModal.css';

export default function CheckoutPage() {
  const user = sessionStorage.getItem('user');
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // State quản lý hiển thị popup xác nhận hủy
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user ? JSON.parse(user).profile.name : '',
    phone: user ? JSON.parse(user).profile.phone : '',
    local: 'Cơ sở 1',
    paymentMethod: 'COD'
  });

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const savedItems = sessionStorage.getItem('checkoutItems');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    } else {
      navigate('/cart');
    }
  }, [navigate]);

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const orderPayload = {
      orderItems: items.map(item => ({
        product: item.product || item._id,
        quantity: item.quantity,
        price: item.price,
        local: item.local
      })),
      shippingInfo: {
        fullName: formData.fullName,
        phone: formData.phone,
        local: formData.local
      },
      paymentMethod: formData.paymentMethod,
      totalPrice: totalPrice
    };

    try {
      const response = await axios.post('api/orders/c', orderPayload, {
        withCredentials: true
      });

      if (response.data.success) {
        showToast('Đặt hàng thành công!', 'success');
        
        // --- XỬ LÝ LỌC GIỎ HÀNG: CHỈ XÓA SẢN PHẨM ĐÃ MUA, GIỮ LẠI SẢN PHẨM CÒN LẠI ---
        let currentCart = [];
        try {
          const savedCart = sessionStorage.getItem('cartItems');
          if (savedCart) currentCart = JSON.parse(savedCart);
        } catch (err) { currentCart = []; }

        // Lấy danh sách ID các sản phẩm vừa thanh toán thành công
        const purchasedIds = items.map(i => String(i.product || i._id));

        // Lọc giỏ hàng: Giữ lại những sản phẩm KHÔNG nằm trong danh sách vừa thanh toán
        const remainingCart = currentCart.filter(item => {
          const itemId = String(item.product || item._id);
          return !purchasedIds.includes(itemId);
        });

        // Cập nhật lại giỏ hàng mới lên Session và Server
        sessionStorage.setItem('cartItems', JSON.stringify(remainingCart));
        await axios.post('/api/cart/u', { items: remainingCart }, { withCredentials: true }).catch(() => {});

        // Xóa dữ liệu checkout tạm thời
        sessionStorage.removeItem('checkoutItems');
        window.dispatchEvent(new Event('cartUpdated'));

        setTimeout(() => navigate('/orders'), 1000);
      }
    } catch (error) {
      console.error("Lỗi tạo đơn hàng:", error);
      showToast(error.response?.data?.message || 'Đặt hàng thất bại, vui lòng kiểm tra lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
      {notification && (
        <div className="custom-toast-container">
          <div className={`custom-toast ${notification.type}`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {notification.msg}
          </div>
        </div>
      )}

      {/* POPUP MODAL XÁC NHẬN HỦY TÙY CHỈNH */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px',
            width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            textAlign: 'center', animation: 'fadeIn 0.2s ease-in-out'
          }}>
            <div style={{ color: '#f59e0b', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
              <HelpCircle size={48} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>
              Xác nhận hủy thanh toán?
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn hủy đơn hàng này không? Sản phẩm được chọn sẽ được giữ lại trong giỏ hàng của bạn.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Quay lại
              </button>
              <button 
                type="button"
                onClick={() => navigate('/cart')}
                style={{
                  flex: 1, padding: '10px', backgroundColor: '#dc2626', color: '#ffffff',
                  border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Đồng ý hủy
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#333' }}>Xác Nhận Đơn Hàng & Thanh Toán</h2>
      
      <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e1e1e1' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>1. Thông tin người nhận</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="text" 
              name="fullName" 
              placeholder="Họ và tên người nhận" 
              value={formData.fullName} 
              onChange={handleChange} 
              required 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
            <input 
              type="text" 
              name="phone" 
              placeholder="Số điện thoại liên hệ" 
              value={formData.phone} 
              onChange={handleChange} 
              required 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
            
            <label style={{ fontWeight: 'bold', marginTop: '5px' }}>Chọn cơ sở nhận hàng:</label>
            <select 
              name="local" 
              value={formData.local} 
              onChange={handleChange} 
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="Cơ sở 1">Cơ sở 1</option>
              <option value="Cơ sở 2">Cơ sở 2</option>
              <option value="Cơ sở 3">Cơ sở 3</option>
            </select>
          </div>
        </div>

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e1e1e1' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>2. Phương thức thanh toán</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ cursor: 'pointer' }}><input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} /> Thanh toán khi nhận hàng (COD)</label>
            <label style={{ cursor: 'pointer' }}><input type="radio" name="paymentMethod" value="Banking" checked={formData.paymentMethod === 'Banking'} onChange={handleChange} /> Chuyển khoản ngân hàng trực tuyến</label>
            <label style={{ cursor: 'pointer' }}><input type="radio" name="paymentMethod" value="MoMo" checked={formData.paymentMethod === 'MoMo'} onChange={handleChange} /> Ví điện tử MoMo</label>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>3. Tóm tắt sản phẩm đặt mua</h3>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px dashed #eee' }}>
              <span>{item.name} (SL: <strong>{item.quantity}</strong>) - [{item.local}]</span>
              <span style={{ fontWeight: 'bold' }}>{(item.price * item.quantity).toLocaleString()} VNĐ</span>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: '15px' }}>
            <h3 style={{ margin: 0 }}>Tổng cộng: <span style={{ color: '#e74c3c' }}>{totalPrice.toLocaleString()} VNĐ</span></h3>
          </div>
        </div>

        {/* KHU VỰC NÚT HÀNH ĐỘNG (XÁC NHẬN & HỦY) */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="submit" 
            disabled={submitting}
            style={{ flex: 2, padding: '14px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Đang xử lý đơn hàng...' : 'Xác Nhận Đặt Hàng'}
          </button>

          {/* Nút Hủy mở Custom Modal xác nhận */}
          <button 
            type="button" 
            onClick={() => setShowCancelModal(true)}
            style={{ flex: 1, padding: '14px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}