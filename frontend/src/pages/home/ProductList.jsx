import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
// Nhớ kiểm tra lại đường dẫn tới ProductCard cho đúng với cấu trúc thư mục của bạn
import ProductCard from "../../components/Route/ProductCard";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocal, setSelectedLocal] = useState('all');

  // Hàm gọi API lấy danh sách sản phẩm và lưu cache
  const fetchProductsFromAPI = () => {
    setLoading(true);
    axios.get('/api/products/g')
      .then((res) => {
        if (res.data.success) {
          const rawProducts = res.data.data || [];
          setProducts(rawProducts);
          sessionStorage.setItem('productsCache', JSON.stringify(rawProducts));
        }
      })
      .catch((err) => console.error('Lỗi API:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // 1. Kiểm tra xem người dùng có vừa bấm F5 (reload) trình duyệt hay không
    const navEntries = performance.getEntriesByType('navigation');
    const isReload = navEntries.length > 0 && navEntries[0].type === 'reload';

    const cachedData = sessionStorage.getItem('productsCache');

    // 2. Nếu là F5 hoặc chưa có cache -> Gọi API mới từ server
    if (isReload || !cachedData) {
      fetchProductsFromAPI();
    } else {
      // 3. Nếu chuyển trang nội bộ bình thường -> Lấy từ cache cho mượt
      try {
        setProducts(JSON.parse(cachedData));
      } catch (e) {
        setProducts([]);
      }
      setLoading(false);
    }

    // 4. Lắng nghe sự kiện cập nhật sản phẩm toàn hệ thống
    const handleProductsUpdated = () => {
      fetchProductsFromAPI();
    };

    window.addEventListener('productsUpdated', handleProductsUpdated);
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated);
    };
  }, []);

  // Lọc và sắp xếp sản phẩm (Sắp xếp mới nhất lên đầu, lọc bỏ sản phẩm hết hàng hoặc amount <= 0)
  const filteredProducts = useMemo(() => {
    // Sắp xếp theo ngày tạo mới nhất (createdAt hoặc startDate) giảm dần
    const sorted = [...products].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.startDate || 0);
      const dateB = new Date(b.createdAt || b.startDate || 0);
      return dateB - dateA; // Mới nhất xếp trước
    });

    return sorted.filter((item) => {
      const inStock = (item.amount || 0) > 0 && item.status !== 'Hết hàng'; // Loại bỏ sản phẩm hết hàng
      const matchSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || item.deviceType === selectedCategory;
      const matchLocal = selectedLocal === 'all' || item.local === selectedLocal;
      
      return inStock && matchSearch && matchCategory && matchLocal;
    });
  }, [products, searchTerm, selectedCategory, selectedLocal]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* CÔNG CỤ TÌM KIẾM VÀ LỌC */}
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px',
        border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '12px',
        alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'
      }}>
        {/* Ô Tìm kiếm */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo tên thiết bị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', borderRadius: '6px',
              border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
            }}
          />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        {/* Lọc loại máy */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'mobile', label: 'Điện thoại' },
            { id: 'laptop', label: 'Laptop' },
            { id: 'tablet', label: 'Tablet' },
            { id: 'mac', label: 'Mac' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '13px',
                fontWeight: '500', cursor: 'pointer',
                backgroundColor: selectedCategory === cat.id ? '#2563eb' : '#f1f5f9',
                color: selectedCategory === cat.id ? '#ffffff' : '#475569',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lọc cơ sở */}
        <select
          value={selectedLocal}
          onChange={(e) => setSelectedLocal(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
            fontSize: '13px', color: '#334155', outline: 'none', backgroundColor: '#ffffff', cursor: 'pointer'
          }}
        >
          <option value="all">Tất cả cơ sở</option>
          <option value="Cơ sở 1">Cơ sở 1</option>
          <option value="Cơ sở 2">Cơ sở 2</option>
          <option value="Cơ sở 3">Cơ sở 3</option>
        </select>
      </div>

      {/* SỐ LƯỢNG SẢN PHẨM */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Danh sách bài đăng bán ({filteredProducts.length})
        </h2>
      </div>

      {/* DANH SÁCH BÀI ĐĂNG */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '14px' }}>Đang tải dữ liệu...</div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '30px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
          Không tìm thấy bài đăng phù hợp.
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px'
        }}>
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}