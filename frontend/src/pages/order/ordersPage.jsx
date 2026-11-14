import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ConfirmModal } from '../../components/toast/ConfirmModal';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import '../../css/CustomModal.css';

export default function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // State quản lý Modal Xác nhận thay cho window.confirm
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchOrders = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const response = await axios.get('/api/orders/g', {
        withCredentials: true
      });
      if (response.data.success) {
        setOrders(response.data.data);
      }
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error("Lỗi lấy danh sách đơn hàng:", err);
      if (!isBackground) {
        setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const intervalId = setInterval(() => fetchOrders(true), 5 * 60 * 1000);
    const handleStatusUpdate = () => fetchOrders(true);

    window.addEventListener('focus', handleStatusUpdate);
    window.addEventListener('orderStatusUpdated', handleStatusUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleStatusUpdate);
      window.removeEventListener('orderStatusUpdated', handleStatusUpdate);
    };
  }, []);

  const handleCancelOrder = (orderId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận hủy đơn hàng',
      message: 'Bạn có chắc chắn muốn hủy đơn hàng này không?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const response = await axios.put('/api/orders/cancel', 
            { orderId }, 
            { withCredentials: true }
          );

          if (response.data.success) {
            setOrders(prev => prev.map(ord => {
              if (ord._id === orderId) {
                return { 
                  ...ord, 
                  orderStatus: "Đã hủy",
                  orderItems: ord.orderItems.map(item => ({ ...item, status: "Đã hủy", isPaid: false }))
                };
              }
              return ord;
            }));
            showToast('Hủy đơn hàng thành công.', 'success');
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Không thể hủy đơn hàng lúc này.', 'error');
        }
      }
    });
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><p>Đang tải danh sách đơn hàng...</p></div>;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}><p>{error}</p></div>;

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      {notification && (
        <div className="custom-toast-container">
          <div className={`custom-toast ${notification.type}`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {notification.msg}
          </div>
        </div>
      )}

      <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#333' }}>Lịch Sử Đơn Hàng Của Tôi</h2>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>Bạn chưa có lịch sử đơn hàng nào.</p>
        </div>
      ) : (
        orders.map(order => {
          let badgeBg = '#fff3cd'; 
          let badgeColor = '#856404';
          if (order.orderStatus === 'Đã hủy') {
            badgeBg = '#f8d7da';
            badgeColor = '#721c24';
          } else if (order.orderStatus === 'Đã từ chối') {
            badgeBg = '#f8d7da';
            badgeColor = '#721c24';
          } else if (order.orderStatus === 'Đã xác nhận' || order.isPaid) {
            badgeBg = '#d4edda';
            badgeColor = '#155724';
          }

          return (
            <div key={order._id} style={{ border: '1px solid #dcdcdc', borderRadius: '8px', padding: '20px', marginBottom: '25px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#555' }}>Mã đơn hàng: <strong>{order._id}</strong></span>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>Ngày đặt: {new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <span style={{ 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {order.orderStatus === 'Đã hủy' || order.orderStatus === 'Đã từ chối' ? <XCircle size={14} /> : null}
                  {order.orderStatus}
                </span>
              </div>

              <div style={{ marginBottom: '15px', background: '#f9f9f9', padding: '12px', borderRadius: '6px', fontSize: '14px' }}>
                <p style={{ margin: '4px 0' }}><strong>Người nhận:</strong> {order.shippingInfo?.fullName} ({order.shippingInfo?.phone})</p>
                <p style={{ margin: '4px 0' }}><strong>Địa chỉ nhận:</strong> {order.shippingInfo?.address || 'Cơ sở học tập'} | <strong>Cơ sở nhận:</strong> {order.shippingInfo?.local}</p>
                <p style={{ margin: '4px 0' }}><strong>Thanh toán chung:</strong> {order.paymentMethod}</p>
              </div>

              {/* Danh sách sản phẩm trong đơn kèm hình ảnh và trạng thái xác nhận */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {order.orderItems.map((item, idx) => {
                  const isItemConfirmed = item.isPaid === true || item.status === 'Đã xác nhận';
                  const isItemRejected = item.status === 'Đã từ chối';
                  const productImg = Array.isArray(item.product?.img) ? item.product.img[0] : (item.product?.img || item.img || 'https://via.placeholder.com/60');
                  
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: '1px solid #f1f1f1' }}>
                      <img 
                        src={productImg} 
                        alt={item.product?.name || item.name} 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>{item.product?.name || item.name}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Số lượng: {item.quantity} | Cơ sở: {item.local}</p>
                        
                        <div style={{ marginTop: '4px', fontSize: '12px', fontWeight: 'bold', color: isItemRejected || order.orderStatus === 'Đã hủy' ? '#dc2626' : isItemConfirmed ? '#16a34a' : '#d97706' }}>
                          {order.orderStatus === 'Đã hủy' ? 'Đã hủy' : isItemRejected ? 'Người bán đã từ chối' : isItemConfirmed ? '✓ Người bán đã xác nhận' : '⏳ Chờ người bán xác nhận'}
                        </div>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>{(item.price * item.quantity).toLocaleString()} VNĐ</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                <h3 style={{ margin: 0 }}>Tổng tiền: <span style={{ color: '#e74c3c' }}>{order.totalPrice?.toLocaleString()} VNĐ</span></h3>
                {order.orderStatus === 'Chờ xác nhận' && (
                  <button 
                    onClick={() => handleCancelOrder(order._id)}
                    style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Hủy Đơn Hàng
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* MODAL XÁC NHẬN CHUNG */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}