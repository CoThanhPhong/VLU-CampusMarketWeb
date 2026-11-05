const cheerio = require('cheerio');
const User = require('../models/User');         
const UserDetail = require('../models/userDetail'); 

async function UserInfo(apiClient, mssv, rawPassword) {
    try {
        // 1. Kiểm tra xem UserDetail đã tồn tại chưa
        let existingDetail = await UserDetail.findOne({ mssv: mssv });

        if (existingDetail) {
            // Nếu đã tồn tại, tìm tiếp bản ghi User tương ứng để trả về
            const existingUser = await User.findOne({ profile: existingDetail._id });
            if (existingUser) {
                return existingUser; // TRẢ VỀ USER ĐỂ HÀM LOGIN CÓ DỮ LIỆU DÙNG TIẾP
            }
        }

        // 2. Nếu CHƯA tồn tại thì mới tiến hành gọi trang VLU để cào thông tin
        const response = await apiClient.get('https://online.vlu.edu.vn/Home/info', {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        const htmlContent = response.data;
        const htmlCheerio = cheerio.load(htmlContent);
        const data = [];
        htmlCheerio('div').children('label').each((i, el) => {
            data.push(htmlCheerio(el).text().trim());
        });
        const userInfo = {
            phone: data[11],
            mssv: data[12] || mssv, 
            name: data[15],
            email: data[28]
        };

        // 3. Tạo mới User
        const newUser = new User({
            name: userInfo.name,
            email: userInfo.email,
            password: rawPassword, // Sẽ tự động được hash bởi pre('save') hook
            role: 'user'
        });
        await newUser.save();

        // 4. Tạo mới UserDetail và liên kết 2 chiều
        const newUserDetail = new UserDetail({
            userID: newUser._id,
            name: userInfo.name,
            mssv: userInfo.mssv,
            email: userInfo.email,
            phone: userInfo.phone,
            bio: '',
            avatar: ''
        });
        await newUserDetail.save();

        // Cập nhật profile ngược lại vào User[cite: 1]
        newUser.profile = newUserDetail._id;
        await newUser.save();

        return newUser; // TRẢ VỀ USER VỪA TẠO MỚI XONG
        
    } catch (error) {
        console.error('Lỗi trong quá trình lấy hoặc lưu userinfo:', error.message);
        throw error; // Nên throw lỗi ra để hàm login bắt được nếu quá trình cào/lưu bị sập
    }
}

module.exports = UserInfo;