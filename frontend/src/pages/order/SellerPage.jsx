import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, AlertCircle, DollarSign, XCircle, Radio } from 'lucide-react';
import '../../css/SellerPage.css';

export default function SellerPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchSellerPage = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await axios.get('/api/orders/seller/g', { withCredentials: true });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      if (!isBackground) {
        showNotification(err.response?.data?.message || 'Không thể tải đơn hàng người bán', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerPage();
    // Tự động đồng bộ ngầm định kỳ từ DB mỗi 5 giây
    const intervalId = setInterval(() => fetchSellerPage(true), 5000);
    const handleFocus = () => fetchSellerPage(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleConfirmPayment = async (orderId) => {
    if (!window.confirm('Xác nhận đã nhận tiền thanh toán cho đơn hàng này?')) return;

    try {
      setBtnLoading(orderId);
      const res = await axios.put('/api/orders/confirm', { orderId }, { withCredentials: true });

      if (res.data.success) {
        setOrders(prev =>
          prev.map(ord => ord._id === orderId ? { ...ord, isPaid: true, orderStatus: 'Đã thanh toán' } : ord)
        );
        showNotification(`Đã xác nhận đơn #${orderId.slice(-6)}!`, 'success');
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Lỗi khi xác nhận', 'error');
    } finally {
      setBtnLoading(null);
    }
  };

  const showNotification = (msg, type) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Tính số lượng đơn đang chờ xác nhận thực tế
  const pendingCount = orders.filter(ord => !ord.isPaid && ord.orderStatus !== 'Đã hủy').length;

  return (
    <div className="seller-orders-container">
      <div className="seller-orders-header">
        <div>
          <h1>Đơn Hàng Cần Xử Lý ({pendingCount} đơn chờ xác nhận)</h1>
          <p>Danh sách đơn hàng của các sản phẩm bạn đang đăng bán</p>
        </div>
      
      </div>

      {notification && (
        <div className={`alert-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {notification.msg}
        </div>
      )}

      {loading ? (
        <div className="orders-loading">Đang kiểm tra đơn hàng...</div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">Chưa có ai đặt mua sản phẩm của bạn.</div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Mã đơn:</span>
                  <span className="order-id">{order._id}</span>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <span className={`status-badge ${
                  order.orderStatus === 'Đã hủy' 
                    ? 'cancelled' 
                    : order.isPaid 
                    ? 'paid' 
                    : 'pending'
                }`}>
                  {order.orderStatus === 'Đã hủy' ? (
                    <><XCircle size={14} /> Người mua đã hủy</>
                  ) : order.isPaid ? (
                    <><CheckCircle size={14} /> Đã thanh toán</>
                  ) : (
                    <><Clock size={14} /> Chờ người bán xác nhận</>
                  )}
                </span>
              </div>

              <div className="order-card-body">
                <div className="buyer-info-box">
                  <div className="title">Thông tin người mua</div>
                  <p className="buyer-name">{order.shippingInfo?.fullName}</p>
                  <p><b>SĐT:</b> {order.shippingInfo?.phone}</p>
                  <p><b>Cơ sở nhận:</b> {order.shippingInfo?.local}</p>
                  <p><b>PTTT:</b> {order.paymentMethod}</p>
                </div>

                <div className="order-items-list">
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="product-item">
                      <img src={item.product?.img || 'https://via.placeholder.com/50'} alt="" className="product-img" />
                      <div className="product-details">
                        <p className="product-name">{item.product?.name || item.name}</p>
                        <p className="product-qty">Số lượng: {item.quantity} | Giao tại: {item.local}</p>
                      </div>
                      <div className="product-price">
                        {(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-card-footer">
                <div>
                  <span className="total-price-label">Tổng thu nhập:</span>
                  <span className="total-price-amount">{order.totalPrice?.toLocaleString('vi-VN')} VNĐ</span>
                </div>

                {order.orderStatus === 'Đã hủy' ? (
                  <div className="status-completed" style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}>
                    <XCircle size={16} color="#ef4444" /> Đơn hàng đã bị hủy
                  </div>
                ) : !order.isPaid ? (
                  <button
                    onClick={() => handleConfirmPayment(order._id)}
                    disabled={btnLoading === order._id}
                    className="btn-confirm-payment"
                  >
                    <DollarSign size={16} />
                    {btnLoading === order._id ? 'Đang xử lý...' : 'Xác Nhận Đã Nhận Tiền'}
                  </button>
                ) : (
                  <div className="status-completed">
                    <CheckCircle size={16} color="#16a34a" /> Đã xác nhận thanh toán
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}