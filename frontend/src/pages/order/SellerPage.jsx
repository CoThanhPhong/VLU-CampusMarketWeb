import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, AlertCircle, DollarSign, XCircle } from 'lucide-react';
import { ConfirmModal } from '../../components/toast/ConfirmModal';
import '../../css/CustomModal.css';
import '../../css/SellerPage.css';

export default function SellerPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(null);
  const [notification, setNotification] = useState(null);
  const [currentSellerId, setCurrentSellerId] = useState(null);

  // State quản lý Modal Xác nhận
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

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/auth/profile', { withCredentials: true });
      if (res.data && res.data.success) {
        setCurrentSellerId(res.data.data?._id || res.data.data?.id);
      }
    } catch (err) {
      console.error('Không thể lấy thông tin user hiện tại:', err);
    }
  };

  const fetchSellerPage = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await axios.get('/api/orders/seller/g', { withCredentials: true });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      if (!isBackground) {
        showToast(err.response?.data?.message || 'Không thể tải đơn hàng người bán', 'error');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchSellerPage();

    const intervalId = setInterval(() => fetchSellerPage(true), 5 * 60 * 1000);
    const handleFocus = () => fetchSellerPage(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleConfirmItemPayment = (orderId, itemId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận thanh toán',
      message: 'Xác nhận đã nhận tiền thanh toán cho sản phẩm này?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setBtnLoading(itemId || orderId);
          const res = await axios.put('/api/orders/confirm-item', { orderId, itemId }, { withCredentials: true });

          if (res.data.success) {
            setOrders(prev =>
              prev.map(ord => ord._id === orderId ? res.data.data : ord)
            );
            showToast('Đã xác nhận thành công sản phẩm!', 'success');
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Lỗi khi xác nhận', 'error');
        } finally {
          setBtnLoading(null);
        }
      }
    });
  };

  const handleReject = (orderId, itemId = null) => {
    const isWholeOrder = itemId === null;
    const loadingKey = isWholeOrder ? `order-${orderId}` : itemId;
    setConfirmModal({
      isOpen: true,
      title: isWholeOrder ? 'Từ chối đơn hàng' : 'Từ chối sản phẩm',
      message: isWholeOrder
        ? 'Bạn có chắc chắn muốn từ chối tất cả sản phẩm của mình trong đơn hàng này không?'
        : 'Bạn có chắc chắn muốn từ chối sản phẩm này không?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          setBtnLoading(loadingKey);
          const endpoint = isWholeOrder ? '/api/orders/reject' : '/api/orders/reject-item';
          const payload = isWholeOrder ? { orderId } : { orderId, itemId };
          const res = await axios.put(endpoint, payload, { withCredentials: true });

          if (res.data.success) {
            setOrders(prev => prev.map(ord => ord._id === orderId ? res.data.data : ord));
            window.dispatchEvent(new Event('orderUpdated'));
            showToast(isWholeOrder ? 'Đã từ chối đơn hàng.' : 'Đã từ chối sản phẩm.', 'success');
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Không thể từ chối lúc này.', 'error');
        } finally {
          setBtnLoading(null);
        }
      }
    });
  };

  const pendingCount = orders.filter(ord => {
    // Bỏ qua đơn hàng đã bị hủy
    if (ord.orderStatus === 'Đã hủy') return false;

    // Kiểm tra xem trong đơn có sản phẩm nào thuộc về seller này mà chưa được xác nhận không
    const hasUnpaidSellerItems = ord.orderItems.some(item => {
      const authorField = item.product?.author || item.product?.seller || item.author;
      const authorId = typeof authorField === 'object' ? authorField?._id : authorField;
      
      const isMyProduct = !currentSellerId || String(authorId) === String(currentSellerId);
      const isNotPaid = item.status === 'Chờ xác nhận' && !(item.isPaid === true || item.status === 'Đã xác nhận');

      return isMyProduct && isNotPaid;
    });

    return hasUnpaidSellerItems;
  }).length;

  return (
    <div className="seller-orders-container">
      {notification && (
        <div className="custom-toast-container">
          <div className={`custom-toast ${notification.type}`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {notification.msg}
          </div>
        </div>
      )}

      <div className="seller-orders-header">
        <div>
          <h1>Đơn Hàng Cần Xử Lý {pendingCount != 0 ? `${pendingCount} đơn chờ xác nhận`: ""}</h1>
          <p>Danh sách đơn hàng của các sản phẩm bạn đang đăng bán</p>
        </div>
      </div>

      {loading ? (
        <div className="orders-loading">Đang kiểm tra đơn hàng...</div>
      ) : orders.length === 0 ? (
        <div className="orders-empty">Chưa có ai đặt mua sản phẩm của bạn.</div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const filteredItems = order.orderItems.filter(item => {
              if (!currentSellerId) return true;
              const authorField = item.product?.author || item.product?.seller || item.author || item.seller;
              const authorId = typeof authorField === 'object' ? authorField?._id || authorField?.id : authorField;
              return String(authorId) === String(currentSellerId);
            });

            if (filteredItems.length === 0) return null;

            const sellerTotalIncome = filteredItems.reduce((sum, item) => (
              item.status === 'Đã từ chối' || item.status === 'Đã hủy'
                ? sum
                : sum + (item.price * item.quantity)
            ), 0);
            const isAllSellerItemsPaid = filteredItems.every(item => item.isPaid === true || item.status === 'Đã xác nhận');
            const areAllSellerItemsRejected = filteredItems.every(item => item.status === 'Đã từ chối');
            const areAllSellerItemsProcessed = filteredItems.every(item => (
              item.status === 'Đã từ chối' || item.status === 'Đã xác nhận'
            ));
            const canRejectSellerItems = filteredItems.every(item => (
              item.status === 'Chờ xác nhận' || item.status === 'Đã từ chối'
            ));

            return (
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
                      : areAllSellerItemsRejected
                      ? 'cancelled'
                      : areAllSellerItemsProcessed
                      ? 'paid' 
                      : 'pending'
                  }`}>
                    {order.orderStatus === 'Đã hủy' ? (
                      <><XCircle size={14} /> Người mua đã hủy</>
                    ) : areAllSellerItemsRejected ? (
                      <><XCircle size={14} /> Đã từ chối</>
                    ) : isAllSellerItemsPaid ? (
                      <><CheckCircle size={14} /> Đã xác nhận</>
                    ) : areAllSellerItemsProcessed ? (
                      <><CheckCircle size={14} /> Đã xử lý</>
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
                    {filteredItems.map((item, idx) => {
                      const itemId = item._id || item.product?._id;
                      const isItemPaid = item.isPaid === true || item.status === 'Đã xác nhận';
                      const isItemRejected = item.status === 'Đã từ chối';

                      return (
                        <div key={idx} className="product-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <img 
                              src={Array.isArray(item.product?.img) ? item.product.img[0] : (item.product?.img || 'https://via.placeholder.com/50')} 
                              alt="" 
                              className="product-img" 
                              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} 
                            />
                            <div className="product-details">
                              <p className="product-name" style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{item.product?.name || item.name}</p>
                              <p className="product-qty" style={{ margin: 0, fontSize: '13px', color: '#666' }}>Số lượng: {item.quantity} | Giao tại: {item.local}</p>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div className="product-price" style={{ fontWeight: 'bold', color: '#e74c3c' }}>
                              {(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ
                            </div>

                            {order.orderStatus === 'Đã hủy' ? (
                              <span style={{ fontSize: '12px', color: '#ef4444' }}>Đã hủy</span>
                            ) : isItemRejected ? (
                              <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <XCircle size={14} /> Đã từ chối
                              </span>
                            ) : isItemPaid ? (
                              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={14} /> Đã xác nhận
                              </span>
                            ) : (
                              <div className="seller-item-actions">
                                <button
                                  onClick={() => handleConfirmItemPayment(order._id, itemId)}
                                  disabled={btnLoading === itemId || btnLoading === order._id || btnLoading === `order-${order._id}`}
                                  className="btn-confirm-payment"
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                  <DollarSign size={14} />
                                  {btnLoading === itemId ? 'Đang xử lý...' : 'Xác Nhận'}
                                </button>
                                <button
                                  onClick={() => handleReject(order._id, itemId)}
                                  disabled={btnLoading === itemId || btnLoading === order._id || btnLoading === `order-${order._id}`}
                                  className="btn-reject-order"
                                >
                                  <XCircle size={14} />
                                  {btnLoading === itemId ? 'Đang xử lý...' : 'Từ chối'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="order-card-footer">
                  <div>
                    <span className="total-price-label">Tổng thu nhập (sản phẩm của bạn):</span>
                    <span className="total-price-amount">{sellerTotalIncome.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  {!areAllSellerItemsRejected && !isAllSellerItemsPaid && canRejectSellerItems && order.orderStatus !== 'Đã hủy' && (
                    <button
                      onClick={() => handleReject(order._id)}
                      disabled={btnLoading === `order-${order._id}` || btnLoading === order._id}
                      className="btn-reject-order"
                    >
                      <XCircle size={14} />
                      {btnLoading === `order-${order._id}` ? 'Đang xử lý...' : 'Từ chối đơn'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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