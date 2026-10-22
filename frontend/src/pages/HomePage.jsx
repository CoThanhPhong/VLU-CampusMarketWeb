import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocal, setSelectedLocal] = useState('all');

  useEffect(() => {
    axios.get('http://localhost:5000/api/products/g')
      .then((res) => {
        if (res.data.success) {
          setProducts(res.data.data || []);
        }
      })
      .catch((err) => console.error('Lỗi kết nối API:', err))
      .finally(() => setLoading(false));
  }, []);

  // Xử lý lọc danh sách theo từ khóa, loại máy, cơ sở
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || item.deviceType === selectedCategory;
      const matchLocal = selectedLocal === 'all' || item.local === selectedLocal;

      return matchSearch && matchCategory && matchLocal;
    });
  }, [products, searchTerm, selectedCategory, selectedLocal]);

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '40px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER BANNER */}
      <div style={{
        backgroundColor: '#1e293b',
        color: '#ffffff',
        padding: '36px 20px',
        textAlign: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <span style={{ backgroundColor: '#3b82f6', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Khuôn viên Văn Lang
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '12px 0 8px 0' }}>
            🎓 Sàn Trao Đổi Thiết Bị Điện Tử Sinh Viên
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: 0 }}>
            Mua bán, nhượng lại Điện thoại, Laptop, Tablet giá tốt giữa các bạn sinh viên
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

          
          {/* ---> CHÈN THÊM NÚT NÀY VÀO <--- */}
          <button 
            onClick={() => window.location.href = '/create'}
            style={{
              padding: '10px 24px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
            }}>
            + Đăng Bài Viết Mới
          </button>  
        {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '-24px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Ô Ô Tìm kiếm */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 Tìm theo tên máy (iPhone, Asus, iPad...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Lọc theo Loại thiết bị */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'mobile', label: '📱 Điện thoại' },
              { id: 'laptop', label: '💻 Laptop' },
              { id: 'tablet', label: '📲 Tablet' },
              { id: 'mac', label: '🖥️ Mac' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: selectedCategory === cat.id ? '#2563eb' : '#f1f5f9',
                  color: selectedCategory === cat.id ? '#ffffff' : '#475569',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Lọc theo Cơ sở */}
          <div>
            <select
              value={selectedLocal}
              onChange={(e) => setSelectedLocal(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#334155',
                outline: 'none',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <option value="all">📍 Tất cả cơ sở</option>
              <option value="Cơ sở 1">Cơ sở 1</option>
              <option value="Cơ sở 2">Cơ sở 2</option>
              <option value="Cơ sở 3">Cơ sở 3</option>
            </select>
          </div>
        </div>

        {/* THÔNG BÁO SỐ LƯỢNG SẢN PHẨM */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px 0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            Danh sách bài đăng bán ({filteredProducts.length})
          </h2>
          {(searchTerm || selectedCategory !== 'all' || selectedLocal !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedLocal('all'); }}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
            >
              🔄 Xóa tất cả bộ lọc
            </button>
          )}
        </div>

        {/* HIỂN THỊ TRẠNG THÁI TẢI HOẶC DANH SÁCH */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            <p>Đang tải bài đăng từ cơ sở dữ liệu...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: '#64748b',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>Không tìm thấy bài đăng phù hợp</h3>
            <p style={{ fontSize: '14px', margin: 0 }}>Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc.</p>
          </div>
        ) : (
          /* LƯỚI SẢN PHẨM (GRID) */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px'
          }}>
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}