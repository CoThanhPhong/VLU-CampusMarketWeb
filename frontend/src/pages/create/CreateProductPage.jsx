import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [existingProducts, setExistingProducts] = useState([]);

  // Lấy ID sản phẩm từ query param (ví dụ: ?edit=65abc...) nếu có
  const searchParams = new URLSearchParams(location.search);
  const editProductId = searchParams.get('edit');
  const isEditing = Boolean(editProductId);

  // Lấy chuẩn xác ID người dùng hiện tại từ sessionStorage hoặc localStorage
  const getCurrentUserId = () => {
    try {
      const authData = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed._id || parsed.id || parsed.profile?.id || parsed.profile?._id || '';
      }
    } catch (e) {
      console.error("Lỗi đọc thông tin user từ storage:", e);
    }
    return '';
  };

  const currentUserId = getCurrentUserId();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    displayPrice: '',
    amount: 1, 
    local: 'Cơ sở 1',
    imgInputs: [{ type: 'url', value: '' }], 
    status: 'Còn hàng', 
    deviceType: 'mobile',
    author: currentUserId 
  });

  // 1. Tải danh sách sản phẩm hiện có
  useEffect(() => {
    if (!currentUserId) {
      console.warn("Chưa tìm thấy thông tin đăng nhập của người dùng.");
    }

    axios.post('/api/products/g')
      .then((res) => {
        if (res.data.success) {
          const productsList = res.data.data || [];
          setExistingProducts(productsList);

          // 2. Nếu đang ở chế độ chỉnh sửa, tìm sản phẩm tương ứng và điền sẵn vào form
          if (editProductId) {
            const productToEdit = productsList.find(item => String(item._id) === String(editProductId));
            if (productToEdit) {
              // Xử lý định dạng ảnh cũ (có thể là mảng chuỗi hoặc chuỗi đơn)
              let loadedImages = [{ type: 'url', value: '' }];
              const rawImgs = productToEdit.img || productToEdit.images;
              
              if (Array.isArray(rawImgs) && rawImgs.length > 0) {
                loadedImages = rawImgs.map(url => ({
                  type: url.startsWith('data:image') ? 'file' : 'url',
                  value: url
                }));
              } else if (typeof rawImgs === 'string' && rawImgs.trim() !== '') {
                loadedImages = [{
                  type: rawImgs.startsWith('data:image') ? 'file' : 'url',
                  value: rawImgs
                }];
              }

              setFormData({
                name: productToEdit.name || '',
                description: productToEdit.description || '',
                price: productToEdit.price || '',
                displayPrice: productToEdit.price ? Number(productToEdit.price).toLocaleString('vi-VN') : '',
                amount: productToEdit.amount || 1,
                local: productToEdit.local || 'Cơ sở 1',
                imgInputs: loadedImages,
                status: productToEdit.status || 'Còn hàng',
                deviceType: productToEdit.deviceType || 'mobile',
                author: currentUserId
              });
            }
          }
        }
      })
      .catch((err) => console.error('Lỗi tải danh sách sản phẩm:', err));
  }, [currentUserId, editProductId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePriceChange = (e) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    
    if (rawValue === '') {
      setFormData({ ...formData, price: '', displayPrice: '' });
      return;
    }

    const numericValue = Number(rawValue);
    const formattedDisplay = numericValue.toLocaleString('vi-VN');

    setFormData({
      ...formData,
      price: numericValue,
      displayPrice: formattedDisplay
    });
  };

  const handleImageTypeChange = (index, newType) => {
    const newInputs = [...formData.imgInputs];
    newInputs[index] = { type: newType, value: '' };
    setFormData({ ...formData, imgInputs: newInputs });
  };

  const handleImageValueChange = (index, val) => {
    const newInputs = [...formData.imgInputs];
    newInputs[index].value = val;
    setFormData({ ...formData, imgInputs: newInputs });
  };

  const handleImageFileUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Kích thước file ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      const newInputs = [...formData.imgInputs];
      newInputs[index].value = base64String;
      setFormData({ ...formData, imgInputs: newInputs });
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageField = () => {
    if (formData.imgInputs.length >= 5) {
      alert('Chỉ được phép tối đa 5 ảnh sản phẩm!');
      return;
    }
    setFormData({
      ...formData,
      imgInputs: [...formData.imgInputs, { type: 'url', value: '' }]
    });
  };

  const handleRemoveImageField = (index) => {
    const newInputs = formData.imgInputs.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      imgInputs: newInputs.length > 0 ? newInputs : [{ type: 'url', value: '' }]
    });
  };

  // HÀM XỬ LÝ XÓA BÀI VIẾT (Đã đồng bộ truyền _id chuẩn xác cho backend)
  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;

    setIsLoading(true);
    try {
      // Gọi API xóa sản phẩm khớp với backend deleteProduct (hỗ trợ truyền qua data body hoặc params)
      const res = await axios.delete(`/api/products/${editProductId}`, { 
        data: { _id: editProductId },
        withCredentials: true 
      });

      if (res.data.success) {
        alert('Xóa bài viết thành công!');
        sessionStorage.removeItem('productsCache');
        window.dispatchEvent(new Event('productsUpdated'));
        navigate('/home');
      } else {
        alert('Không thể xóa sản phẩm: ' + res.data.message);
      }
    } catch (err) {
      console.error('Lỗi khi xóa bài đăng:', err);
      alert('Xóa thất bại! ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUserId) {
      alert('Vui lòng đăng nhập lại để thực hiện tính năng này!');
      return;
    }

    const numericPrice = Number(formData.price);
    if (numericPrice < 0) {
      alert('Giá bán không được để số âm!');
      return;
    }
    if (numericPrice < 100000) {
      alert('Giá bán sản phẩm không được bé hơn 100.000 VNĐ!');
      return;
    }

    if (Number(formData.amount) < 1) {
      alert('Số lượng phải từ 1 trở lên!');
      return;
    }

    const validImages = formData.imgInputs
      .map(item => item.value)
      .filter(val => typeof val === 'string' && val.trim() !== '');

    if (validImages.length === 0) {
      alert('Vui lòng cung cấp ít nhất 1 hình ảnh cho sản phẩm!');
      return;
    }

    setIsLoading(true);

    try {
      const payloadData = {
        name: formData.name,
        description: formData.description,
        price: numericPrice,
        amount: Number(formData.amount),
        local: formData.local,
        status: formData.status,
        deviceType: formData.deviceType,
        author: currentUserId,
        img: validImages,
        startDate: new Date().toISOString()
      };

      if (isEditing) {
        // Cập nhật sản phẩm cũ thông qua API backend
        const updatePayload = {
          _id: editProductId,
          ...payloadData
        };

        const res = await axios.post('/api/products/c', updatePayload);

        if (res.data.success) {
          alert('Cập nhật bài viết thành công!');
          sessionStorage.removeItem('productsCache');
          window.dispatchEvent(new Event('productsUpdated'));
          navigate('/home');
        } else {
          alert('Không thể cập nhật sản phẩm: ' + res.data.message);
        }

      } else {
        const foundProduct = existingProducts.find((item) => {
          const itemAuthorId = item.author?._id || item.author?.id || item.author;
          const isSameAuthor = String(itemAuthorId) === String(currentUserId);
          const isSameName = item.name?.trim().toLowerCase() === formData.name.trim().toLowerCase();
          return isSameAuthor && isSameName;
        });

        if (foundProduct) {
          const updatedAmount = Number(foundProduct.amount || 0) + Number(formData.amount);
          const updatePayload = {
            ...foundProduct,
            ...payloadData,
            amount: updatedAmount
          };

          const res = await axios.post('/api/products/c', updatePayload);

          if (res.data.success) {
            alert(`Bạn đã có sản phẩm này! Đã tăng số lượng thêm ${formData.amount} và cập nhật thông tin.`);
            sessionStorage.removeItem('productsCache');
            window.dispatchEvent(new Event('productsUpdated'));
            navigate('/home');
          } else {
            alert('Không thể cập nhật sản phẩm: ' + res.data.message);
          }

        } else {
          // Tạo mới bài đăng (backend sẽ tự động đẩy _id vào UserDetail.products[])
          const res = await axios.post('/api/products/c', payloadData);

          if (res.data.success) {
            alert('Đăng bài viết mới thành công!');
            sessionStorage.removeItem('productsCache');
            window.dispatchEvent(new Event('productsUpdated'));
            navigate('/home'); 
          } else {
            alert('Không thể đăng bài: ' + res.data.message);
          }
        }
      }

    } catch (err) {
      console.error('Lỗi khi xử lý bài đăng:', err);
      alert('Lưu thất bại! ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '20px auto', backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#0f172a', fontSize: '20px', fontWeight: '700', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        {isEditing ? 'Chỉnh Sửa Bài Đăng Thiết Bị' : 'Đăng Tin Bán Thiết Bị'}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Tên thiết bị</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Giá bán (VNĐ) <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>(Tối thiểu 100.000đ)</span></label>
            <input 
              type="text" 
              name="displayPrice" 
              value={formData.displayPrice} 
              onChange={handlePriceChange} 
              required 
              placeholder="VD: 150.000" 
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Loại thiết bị</label>
            <select name="deviceType" value={formData.deviceType} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}>
              <option value="mobile">Điện thoại</option>
              <option value="tablet">Máy tính bảng</option>
              <option value="laptop">Laptop</option>
              <option value="mac">Macbook</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Cơ sở giao dịch</label>
            <select name="local" value={formData.local} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}>
              <option value="Cơ sở 1">Cơ sở 1</option>
              <option value="Cơ sở 2">Cơ sở 2</option>
              <option value="Cơ sở 3">Cơ sở 3</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Tình trạng</label>
            <select name="status" value={formData.status} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}>
              <option value="Còn hàng">Còn hàng</option>
              <option value="Hết hàng">Hết hàng</option> 
            </select>
          </div>
        </div>

        {/* PHẦN QUẢN LÝ HÌNH ẢNH */}
        <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '10px' }}>
            Hình ảnh sản phẩm (Tối đa 5 ảnh)
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {formData.imgInputs.map((imgItem, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                
                <select 
                  value={imgItem.type} 
                  onChange={(e) => handleImageTypeChange(index, e.target.value)}
                  style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: '#f8fafc', outline: 'none' }}
                >
                  <option value="url">Link URL</option>
                  <option value="file">Tải File</option>
                </select>

                {imgItem.type === 'url' ? (
                  <input 
                    type="url" 
                    value={imgItem.value} 
                    onChange={(e) => handleImageValueChange(index, e.target.value)} 
                    placeholder={`Nhập đường dẫn ảnh ${index + 1} (https://...)`} 
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} 
                  />
                ) : (
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(index, e)} 
                    style={{ flex: 1, fontSize: '12px' }} 
                  />
                )}

                {formData.imgInputs.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveImageField(index)}
                    style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    Xóa
                  </button>
                )}
              </div>
            ))}

            {formData.imgInputs.length < 5 && (
              <button 
                type="button" 
                onClick={handleAddImageField}
                style={{ alignSelf: 'flex-start', marginTop: '4px', padding: '6px 12px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                + Thêm ảnh khác
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Số lượng</label>
            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="1" style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Mô tả chi tiết</label>
          <textarea name="description" rows="4" value={formData.description} onChange={handleChange} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* CÁC NÚT HÀNH ĐỘNG */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="submit" disabled={isLoading} style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
            {isLoading ? 'Đang xử lý...' : (isEditing ? 'Lưu Thay Đổi' : 'Xác nhận Đăng tin')}
          </button>

          {/* NÚT XÓA CHỈ HIỆN KHI Ở CHẾ ĐỘ CHỈNH SỬA */}
          {isEditing && (
            <button 
              type="button" 
              onClick={handleDelete} 
              disabled={isLoading} 
              style={{ padding: '10px 16px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '600' }}
            >
              Xóa bài viết
            </button>
          )}

          <button type="button" onClick={() => navigate('/home')} style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  );
}