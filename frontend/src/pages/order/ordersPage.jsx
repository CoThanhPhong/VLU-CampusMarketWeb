import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('api/orders/g', {
          withCredentials: true
        });
        if (response.data.success) {
          setOrders(response.data.data);
        }
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (err) {
        console.error("Lỗi lấy danh sách đơn hàng:", err);
        setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) {
      try {
        const response = await axios.put('api/orders/cancel', 
          { orderId }, 
          { withCredentials: true }
        );

        if (response.data.success) {
          setOrders(prev => prev.map(ord => {
            if (ord._id === orderId) {
              return { ...ord, orderStatus: "Đã hủy" };
            }
            return ord;
          }));
          alert('Hủy đơn hàng thành công.');
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Không thể hủy đơn hàng lúc này.');
      }
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><p>Đang tải danh sách đơn hàng...</p></div>;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}><p>{error}</p></div>;

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#333' }}>Lịch Sử Đơn Hàng Của Tôi</h2>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          <p style={{ fontSize: '16px' }}>Bạn chưa có lịch sử đơn hàng nào.</p>
        </div>
      ) : (
        orders.map(order => (
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
                backgroundColor: order.orderStatus === 'Đã hủy' ? '#f8d7da' : order.orderStatus === 'Đã hoàn thành' ? '#d4edda' : '#fff3cd',
                color: order.orderStatus === 'Đã hủy' ? '#721c24' : order.orderStatus === 'Đã hoàn thành' ? '#155724' : '#856404'
              }}>
                {order.orderStatus}
              </span>
            </div>

            <div style={{ marginBottom: '15px', background: '#f9f9f9', padding: '12px', borderRadius: '6px', fontSize: '14px' }}>
              <p style={{ margin: '4px 0' }}><strong>Người nhận:</strong> {order.shippingInfo.fullName} ({order.shippingInfo.phone})</p>
              {/* Đã tách rõ ràng địa chỉ và cơ sở nhận */}
              <p style={{ margin: '4px 0' }}><strong>Địa chỉ nhận:</strong> {order.shippingInfo.address} | <strong>Cơ sở nhận:</strong> {order.shippingInfo.local}</p>
              <p style={{ margin: '4px 0' }}><strong>Thanh toán:</strong> {order.paymentMethod} — <span style={{ color: order.isPaid ? 'green' : 'orange', fontWeight: 'bold' }}>{order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {order.orderItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '8px 0', borderBottom: '1px solid #f1f1f1' }}>
                  <img src={item.product?.img} alt={item.product?.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#333' }}>{item.product?.name}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>Số lượng: {item.quantity} | Cơ sở: {item.local}</p>
                  </div>
                  <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>{item.price.toLocaleString()} VNĐ</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <h3 style={{ margin: 0 }}>Tổng tiền: <span style={{ color: '#e74c3c' }}>{order.totalPrice.toLocaleString()} VNĐ</span></h3>
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
        ))
      )}
    </div>
  );
}