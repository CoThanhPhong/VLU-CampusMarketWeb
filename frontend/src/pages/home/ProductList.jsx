import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ProductCard from "../../components/Route/ProductCard";

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 1. Đọc số trang từ URL (mặc định là 1 nếu không có)
  const pageFromUrl = parseInt(searchParams.get("page")) || 1;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocal, setSelectedLocal] = useState('all');

  const [currentPage, setCurrentPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 20;

  // 2. Lắng nghe sự thay đổi của URL query parameters (hỗ trợ khi bấm nút Quay lại từ trang chi tiết)
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page")) || 1;
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
  }, [searchParams]);

  // Sửa từ 'category' thành 'deviceType' để khớp với Model database và Backend
  const fetchProducts = (page = 1, search = '', category = 'all', local = 'all') => {
    setLoading(true);
    let url = `/api/products/g?page=${page}&limit=${limit}`;
    if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    if (category !== 'all') url += `&deviceType=${encodeURIComponent(category)}`;
    if (local !== 'all') url += `&local=${encodeURIComponent(local)}`;

    axios.get(url)
      .then((res) => {
        if (res.data.success) {
          setProducts(res.data.data || []);
          setCurrentPage(res.data.currentPage || page);
          setTotalPages(res.data.totalPages || 1);
          setTotalProducts(res.data.totalProducts || 0);
        }
      })
      .catch((err) => console.error('Lỗi API:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts(currentPage, searchTerm, selectedCategory, selectedLocal);

    const handleProductsUpdated = () => {
      fetchProducts(currentPage, searchTerm, selectedCategory, selectedLocal);
    };

    window.addEventListener('productsUpdated', handleProductsUpdated);
    return () => {
      window.removeEventListener('productsUpdated', handleProductsUpdated);
    };
  }, [currentPage, searchTerm, selectedCategory, selectedLocal]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setSearchParams({ page: 1 });
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    setSearchParams({ page: 1 });
  };

  const handleLocalChange = (e) => {
    setSelectedLocal(e.target.value);
    setCurrentPage(1);
    setSearchParams({ page: 1 });
  };

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    range.push(1);
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i < totalPages && i > 1) range.push(i);
    }
    if (totalPages > 1) range.push(totalPages);

    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  // 3. Cập nhật state đồng thời đẩy số trang lên URL query params
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({ page: page }); // Cập nhật URL thành ?page=X
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* THANH TÌM KIẾM VÀ LỌC */}
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px',
        border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '12px',
        alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px'
      }}>
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Tìm theo tên thiết bị..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%', padding: '9px', borderRadius: '6px',
              border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Các nút phân loại thiết bị */}
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
              onClick={() => handleCategoryChange(cat.id)}
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

        <select
          value={selectedLocal}
          onChange={handleLocalChange}
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

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
          Danh sách bài đăng bán ({totalProducts})
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '14px' }}>Đang tải dữ liệu...</div>
      ) : products.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '30px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
          Không tìm thấy bài đăng phù hợp.
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px'
          }}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} currentPage={currentPage}/>
            ))}
          </div>

          {/* THANH PHÂN TRANG */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '35px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                  backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500', fontSize: '12px'
                }}
              >
                &laquo; Đầu
              </button>

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                  backgroundColor: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                  color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500', fontSize: '12px'
                }}
              >
                &lsaquo; Trước
              </button>

              {getPageNumbers().map((item, index) => {
                if (item === '...') {
                  return <span key={index} style={{ padding: '0 4px', color: '#64748b' }}>...</span>;
                }
                const isSelected = currentPage === item;
                return (
                  <button
                    key={index}
                    onClick={() => handlePageChange(item)}
                    style={{
                      minWidth: '34px', height: '34px', padding: '0 6px', borderRadius: '6px',
                      border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#334155',
                      fontWeight: isSelected ? '700' : '500', fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {item}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                  backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500', fontSize: '12px'
                }}
              >
                Sau &rsaquo;
              </button>

              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                  backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                  color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500', fontSize: '12px'
                }}
              >
                Cuối &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}