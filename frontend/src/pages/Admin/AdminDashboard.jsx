import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, Users, Package, Trash2, ArrowLeft, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dữ liệu quản trị
  const [stats, setStats] = useState({ usersCount: 0, productsCount: 0 });
  const [products, setProducts] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products' hoặc 'users'
  const [currentLoggedInUserId, setCurrentLoggedInUserId] = useState(null);

  // Cấu hình phân trang Server-side (20 bài / trang)
  const [productPage, setProductPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const itemsPerPage = 20; 

  // State lưu danh sách ID các mục được chọn
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (!storedUser) {
        alert('Vui lòng đăng nhập để tiếp tục!');
        navigate('/login');
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const userId = parsedUser._id || parsedUser.id || parsedUser.profile?._id;
      const userRole = parsedUser.role || parsedUser.profile?.role;
      const isUserAdmin = userRole === 'admin' || parsedUser.isAdmin === true;

      if (!isUserAdmin) {
        alert('Cảnh báo: Bạn không có quyền truy cập trang Quản trị!');
        navigate('/home');
        return;
      }

      setIsAdmin(true);
      setCurrentLoggedInUserId(userId ? String(userId) : null);
    } catch (err) {
      console.error('Lỗi xác thực quyền admin:', err);
      navigate('/home');
    }
  }, [navigate]);

  // Gọi API lấy dữ liệu mỗi khi page thay đổi hoặc chuyển tab
  useEffect(() => {
    if (isAdmin) {
      fetchAllAdminData(productPage);
    }
  }, [isAdmin, productPage]);

  const fetchAllAdminData = async (page = 1) => {
    setLoading(true);
    try {
      // Truyền tham số isAdmin=true, page và limit lên Backend
      const resProducts = await axios.get(`/api/products/g?isAdmin=true&page=${page}&limit=${itemsPerPage}`);
      if (resProducts.data.success) {
        let prodData = resProducts.data.data || [];
        
        // Sắp xếp: Ưu tiên 'Chờ duyệt' lên đầu tiên, kế đến là 'Bị từ chối'
        prodData.sort((a, b) => {
          const statusA = a.status || 'Chờ duyệt';
          const statusB = b.status || 'Chờ duyệt';
          
          const getPriority = (st) => {
            if (st === 'Chờ duyệt') return 1;
            if (st === 'Bị từ chối') return 2;
            return 3; 
          };

          const pA = getPriority(statusA);
          const pB = getPriority(statusB);

          if (pA !== pB) return pA - pB;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setProducts(prodData);
        setTotalPages(resProducts.data.totalPages || 1);
        setTotalProductsCount(resProducts.data.totalProducts || prodData.length);
        setStats(prev => ({ ...prev, productsCount: resProducts.data.totalProducts || prodData.length }));
      }

      try {
        const resUsers = await axios.get('/api/auth/users');
        if (resUsers.data.success) {
          const userData = resUsers.data.data || [];
          setUsersList(userData);
          setStats(prev => ({ ...prev, usersCount: userData.length }));
        }
      } catch (uErr) {
        console.warn('Endpoint danh sách user chưa sẵn sàng.');
      }

    } catch (err) {
      console.error('Lỗi tải dữ liệu quản trị:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ CHECKBOX BÀI ĐĂNG ---
  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map(p => p._id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectProduct = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(item => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  // --- HÀNH ĐỘNG HÀNG LOẠT CHO BÀI ĐĂNG ---
  const handleBulkUpdateProductStatus = async (statusType) => {
    if (selectedProductIds.length === 0) return;
    const actionName = statusType === 'Đã duyệt' ? 'duyệt' : 'từ chối';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} các bài đăng đã chọn?`)) return;

    try {
      await Promise.all(
        selectedProductIds.map(id => axios.put('/api/products/update-status', { productId: id, status: statusType }))
      );
      
      alert(`Đã ${actionName} các bài đăng đã chọn thành công!`);
      setSelectedProductIds([]);
      fetchAllAdminData(productPage);
    } catch (err) {
      console.error('Lỗi thao tác hàng loạt sản phẩm:', err);
      alert('Có lỗi xảy ra khi thực hiện thao tác.');
    }
  };

  const handleDeleteSelectedProducts = async () => {
    if (selectedProductIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProductIds.length} bài đăng đã chọn?`)) return;

    try {
      await Promise.all(
        selectedProductIds.map(id => 
          axios.delete(`/api/products/d`, { data: { productId: id } })
        )
      );
      
      alert('Đã xóa các bài đăng đã chọn thành công!');
      setSelectedProductIds([]);
      sessionStorage.removeItem('productsCache');
      window.dispatchEvent(new Event('productsUpdated'));
      fetchAllAdminData(productPage);
    } catch (err) {
      console.error('Lỗi xóa nhiều sản phẩm:', err);
      alert('Có lỗi xảy ra khi xóa một số sản phẩm.');
    }
  };

  // --- XỬ LÝ CHECKBOX NGƯỜI DÙNG ---
  const handleSelectAllUsers = (e) => {
    if (e.target.checked) {
      const selectableUsers = usersList
        .filter(u => String(u._id) !== String(currentLoggedInUserId))
        .map(u => u._id);
      setSelectedUserIds(selectableUsers);
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id) => {
    if (String(id) === String(currentLoggedInUserId)) return;
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(item => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  // --- HÀNH ĐỘNG HÀNG LOẠT CHO NGƯỜI DÙNG ---
  const handleBulkUpdateUserRole = async (newRole) => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Bạn có chắc muốn đổi quyền của ${selectedUserIds.length} tài khoản đã chọn thành [${newRole.toUpperCase()}] không?`)) return;

    try {
      await Promise.all(
        selectedUserIds.map(id => axios.put('/api/auth/user/update-role', { userId: id, newRole }))
      );

      alert('Đã cập nhật quyền hàng loạt thành công!');
      setUsersList(usersList.map(u => selectedUserIds.includes(u._id) ? { ...u, role: newRole } : u));
      setSelectedUserIds([]);
    } catch (err) {
      console.error('Lỗi phân quyền hàng loạt:', err);
      alert('Có lỗi xảy ra khi cập nhật quyền.');
    }
  };

  const handleDeleteSelectedUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa ${selectedUserIds.length} tài khoản đã chọn?`)) return;

    try {
      await Promise.all(
        selectedUserIds.map(id => 
          axios.delete(`/api/auth/user/d`, { data: { userId: id } })
        )
      );
      
      alert('Đã xóa các tài khoản đã chọn thành công!');
      setUsersList(usersList.filter(u => !selectedUserIds.includes(u._id)));
      setSelectedUserIds([]);
    } catch (err) {
      console.error('Lỗi xóa nhiều user:', err);
      alert('Có lỗi xảy ra khi xóa một số tài khoản.');
    }
  };

  // Thao tác đơn lẻ
  const handleUpdateProductStatus = async (productId, statusType) => {
    try {
      const res = await axios.put('/api/products/update-status', { productId, status: statusType });
      if (res.data.success) {
        alert(`Đã ${statusType} bài viết thành công!`);
        fetchAllAdminData(productPage);
      }
    } catch (err) {
      alert('Lỗi thao tác: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài đăng này không?')) return;
    try {
      const res = await axios.delete(`/api/products/d`, {
        data: { productId: productId }
      });
      if (res.data.success || res.status === 200) {
        alert('Đã xóa bài viết thành công!');
        sessionStorage.removeItem('productsCache');
        window.dispatchEvent(new Event('productsUpdated'));
        fetchAllAdminData(productPage);
      }
    } catch (err) {
      console.error('Lỗi xóa sản phẩm:', err);
      alert('Không thể xóa sản phẩm.');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (String(userId) === String(currentLoggedInUserId)) {
      alert('Bạn không thể tự thay đổi quyền hạn của chính mình!');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn đổi quyền của tài khoản này thành [${newRole.toUpperCase()}] không?`)) {
      try {
        const res = await axios.put('/api/auth/user/update-role', { userId, newRole });
        if (res.data.success) {
          alert('Cập nhật quyền thành công!');
          setUsersList(usersList.map(u => u._id === userId ? { ...u, role: newRole } : u));
        }
      } catch (err) {
        alert('Lỗi cập nhật quyền.');
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (String(userId) === String(currentLoggedInUserId)) {
      alert('Bạn không thể tự xóa tài khoản của chính mình!');
      return;
    }
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      const res = await axios.delete(`/api/auth/user/d`, {
        data: { userId: userId }
      });
      if (res.data.success || res.status === 200) {
        alert('Đã xóa tài khoản thành công!');
        setUsersList(usersList.filter(u => !selectedUserIds.includes(u._id) && u._id !== userId));
      }
    } catch (err) {
      console.error('Lỗi xóa người dùng:', err);
      alert('Không thể xóa người dùng.');
    }
  };

  // --- HÀM TẠO MẢNG SỐ TRANG CÓ DẤU CHẤM LỬNG (...) ---
  const getPaginationPages = () => {
    const pages = [];
    const maxVisiblePages = 5; // Số lượng nút trang tối đa hiển thị trực tiếp

    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, productPage - 1);
      let end = Math.min(totalPages - 1, productPage + 1);

      if (productPage <= 3) {
        end = 4;
      } else if (productPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  if (!isAdmin) return null;

  if (loading && products.length === 0) {
    return <div style={{ textAlign: 'center', padding: '80px 0', fontSize: '16px', color: '#64748b' }}>Đang tải dữ liệu hệ thống...</div>;
  }

  // Điều kiện hiển thị nút hành động hàng loạt
  const hasApprovableSelected = products.some(
    p => selectedProductIds.includes(p._id) && (!p.status || p.status === 'Chờ duyệt' || p.status === 'Bị từ chối')
  );
  const hasPendingSelected = products.some(
    p => selectedProductIds.includes(p._id) && (!p.status || p.status === 'Chờ duyệt')
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 16px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={28} color="#dc2626" />
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Hệ Thống Quản Trị (Admin Dashboard)</h1>
        </div>
        <button onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Trang chủ
        </button>
      </div>

      {/* CARDS THỐNG KÊ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px', color: '#2563eb' }}><Package size={24} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Tổng số sản phẩm</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{stats.productsCount}</div>
          </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', color: '#16a34a' }}><Users size={24} /></div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Tổng số người dùng</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{usersList.length || stats.usersCount}</div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button onClick={() => setActiveTab('products')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'products' ? '#2563eb' : '#f1f5f9', color: activeTab === 'products' ? '#fff' : '#475569' }}>
          Kiểm duyệt Bài đăng ({totalProductsCount})
        </button>
        <button onClick={() => setActiveTab('users')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '600', fontSize: '14px', cursor: 'pointer', backgroundColor: activeTab === 'users' ? '#2563eb' : '#f1f5f9', color: activeTab === 'users' ? '#fff' : '#475569' }}>
          Quản lý Người dùng  ({usersList.length})
        </button>
      </div>

      {/* CONTENT TABLE */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {activeTab === 'products' ? (
          <>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <span style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>Danh sách bài đăng hệ thống</span>
              {selectedProductIds.length > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {hasApprovableSelected && (
                    <button onClick={() => handleBulkUpdateProductStatus('Đã duyệt')} style={{ padding: '6px 12px', backgroundColor: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> Duyệt ({selectedProductIds.length})
                    </button>
                  )}
                  {hasPendingSelected && (
                    <button onClick={() => handleBulkUpdateProductStatus('Từ chối')} style={{ padding: '6px 12px', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle size={14} /> Từ chối ({selectedProductIds.length})
                    </button>
                  )}
                  <button onClick={handleDeleteSelectedProducts} style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={14} /> Xóa ({selectedProductIds.length})
                  </button>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', width: '40px' }}>
                      <input type="checkbox" onChange={handleSelectAllProducts} checked={products.length > 0 && selectedProductIds.length === products.length} style={{ cursor: 'pointer' }} />
                    </th>
                    <th style={{ padding: '12px 16px' }}>Tên sản phẩm</th>
                    <th style={{ padding: '12px 16px' }}>Loại</th>
                    <th style={{ padding: '12px 16px' }}>Giá tiền</th>
                    <th style={{ padding: '12px 16px' }}>Cơ sở</th>
                    <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác kiểm duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item) => {
                    const isSelected = selectedProductIds.includes(item._id);
                    const isPending = !item.status || item.status === 'Chờ duyệt';
                    const isRejected = item.status === 'Bị từ chối';
                    const isAvailable = item.status === 'Còn hàng' || item.status === 'Đã duyệt';
                    const isSoldOut = item.status === 'Hết hàng' || item.amount === 0;

                    return (
                      <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isSelected ? '#f8fafc' : 'transparent' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <input type="checkbox" checked={isSelected} onChange={() => handleSelectProduct(item._id)} style={{ cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#2563eb', cursor: 'pointer' }} onClick={() => navigate(`/product/${item._id}`)}>
                          {item.name}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>{item.deviceType}</td>
                        <td style={{ padding: '12px 16px', color: '#dc2626', fontWeight: '700' }}>{item.price?.toLocaleString('vi-VN')} VNĐ</td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>{item.local}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: '600', 
                            backgroundColor: isAvailable ? '#dcfce7' : isSoldOut ? '#f1f5f9' : isPending ? '#fef3c7' : '#fee2e2', 
                            color: isAvailable ? '#16a34a' : isSoldOut ? '#475569' : isPending ? '#d97706' : '#991b1b' 
                          }}>
                            {isSoldOut ? 'Hết hàng' : (item.status || 'Chờ duyệt')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                          {isPending && (
                            <>
                              <button onClick={() => handleUpdateProductStatus(item._id, 'Đã duyệt')} style={{ padding: '6px 10px', backgroundColor: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={13} /> Duyệt
                              </button>
                              <button onClick={() => handleUpdateProductStatus(item._id, 'Từ chối')} style={{ padding: '6px 10px', backgroundColor: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <XCircle size={13} /> Từ chối
                              </button>
                            </>
                          )}

                          {isRejected && (
                            <button onClick={() => handleUpdateProductStatus(item._id, 'Đã duyệt')} style={{ padding: '6px 10px', backgroundColor: '#dcfce7', color: '#16a34a', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={13} /> Duyệt
                            </button>
                          )}

                          <button onClick={() => handleDeleteProduct(item._id)} style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Trash2 size={13} /> Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* THANH PHÂN TRANG THÔNG MINH (CÓ DẤU CHẤM LỬNG ...) */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', padding: '16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <button 
                onClick={() => setProductPage(1)} 
                disabled={productPage === 1}
                style={{ padding: '6px 10px', backgroundColor: productPage === 1 ? '#e2e8f0' : '#ffffff', color: productPage === 1 ? '#94a3b8' : '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: productPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }}
                title="Trang đầu"
              >
                <ChevronsLeft size={16} />
              </button>

              <button 
                onClick={() => setProductPage(prev => Math.max(prev - 1, 1))} 
                disabled={productPage === 1}
                style={{ padding: '6px 12px', backgroundColor: productPage === 1 ? '#e2e8f0' : '#ffffff', color: productPage === 1 ? '#94a3b8' : '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: productPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                <ChevronLeft size={16} /> Trước
              </button>

              {getPaginationPages().map((item, index) => {
                if (item === '...') {
                  return (
                    <span key={`ellipsis-${index}`} style={{ padding: '6px 10px', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={item}
                    onClick={() => setProductPage(item)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: productPage === item ? '#2563eb' : '#ffffff',
                      color: productPage === item ? '#ffffff' : '#334155',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {item}
                  </button>
                );
              })}

              <button 
                onClick={() => setProductPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={productPage === totalPages}
                style={{ padding: '6px 12px', backgroundColor: productPage === totalPages ? '#e2e8f0' : '#ffffff', color: productPage === totalPages ? '#94a3b8' : '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: productPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                Sau <ChevronRight size={16} />
              </button>

              <button 
                onClick={() => setProductPage(totalPages)} 
                disabled={productPage === totalPages}
                style={{ padding: '6px 10px', backgroundColor: productPage === totalPages ? '#e2e8f0' : '#ffffff', color: productPage === totalPages ? '#94a3b8' : '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: productPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }}
                title="Trang cuối"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <span style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>Danh sách người dùng hệ thống </span>
              {selectedUserIds.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => handleBulkUpdateUserRole('admin')} style={{ padding: '6px 12px', backgroundColor: '#dbeafe', color: '#2563eb', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                    Set Admin ({selectedUserIds.length})
                  </button>
                  <button onClick={() => handleBulkUpdateUserRole('user')} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                    Set User ({selectedUserIds.length})
                  </button>
                  <button onClick={handleDeleteSelectedUsers} style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Trash2 size={14} /> Xóa ({selectedUserIds.length})
                  </button>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', width: '40px' }}>
                      <input type="checkbox" onChange={handleSelectAllUsers} checked={usersList.filter(u => String(u._id) !== String(currentLoggedInUserId)).length > 0 && selectedUserIds.length === usersList.filter(u => String(u._id) !== String(currentLoggedInUserId)).length} style={{ cursor: 'pointer' }} />
                    </th>
                    <th style={{ padding: '12px 16px' }}>Họ tên</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Quyền hiện tại</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Đổi quyền (Role)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        Chưa có dữ liệu người dùng hoặc đang tải...
                      </td>
                    </tr>
                  ) : (
                    usersList.map((user) => {
                      const isSelf = String(user._id) === String(currentLoggedInUserId);
                      const isSelected = selectedUserIds.includes(user._id);

                      return (
                        <tr key={user._id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isSelected ? '#f8fafc' : 'transparent' }}>
                          <td style={{ padding: '12px 16px' }}>
                            {!isSelf && (
                              <input type="checkbox" checked={isSelected} onChange={() => handleSelectUser(user._id)} style={{ cursor: 'pointer' }} />
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }} onClick={() => navigate(`/user/${user._id}`)}>
                            {user.profile?.name || user.name || 'Thành viên'} {isSelf && <span style={{ color: '#2563eb', fontSize: '11px', fontWeight: 'normal' }}>(Tài khoản của bạn)</span>}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#475569' }}>{user.email}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', backgroundColor: user.role === 'admin' ? '#dbeafe' : '#f1f5f9', color: user.role === 'admin' ? '#2563eb' : '#475569' }}>
                              {user.role || 'user'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {isSelf ? (
                              <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Không thể tự đổi quyền</span>
                            ) : (
                              <select value={user.role || 'user'} onChange={(e) => handleUpdateRole(user._id, e.target.value)} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', backgroundColor: '#fff', cursor: 'pointer' }}>
                                <option value="user">User (Thường)</option>
                                <option value="admin">Admin (Quản trị)</option>
                              </select>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {!isSelf && (
                              <button onClick={() => handleDeleteUser(user._id)} style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600', fontSize: '12px' }}>
                                <Trash2 size={13} /> Xóa tài khoản
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
}