const cheerio = require('cheerio');
const User = require('../models/User');         
const UserDetail = require('../models/userDetail'); 

async function VLUInfo(apiClient) {
    // Tiến hành cào dữ liệu từ VLU để bổ sung
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

    return data;
}

async function UserInfo(apiClient, mssv, rawPassword) {
    try {        
        // 1. Kiểm tra xem User đã tồn tại trong DB chưa (dựa vào mssv)
        let existingUser = await User.findOne({ mssv: mssv });

        if (existingUser) {
            // Nếu user đã tồn tại, kiểm tra xem đã có profile (UserDetail) chưa
            if (existingUser.profile) {
                // Đã có cả User và Detail -> Trả về luôn, không cào dữ liệu, không lưu DB
                return existingUser;
            } else {

            // Nếu user đã tồn tại NHƯNG chưa có profile (chưa có detail)
            const data = await VLUInfo(apiClient);
            const userInfo = {
                phone: data[11],
                name: data[15],
                email: data[28]
            };

            const defautAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${mssv}`;
            
            // Tạo mới UserDetail cho user cũ này
            const newUserDetail = new UserDetail({
                id: existingUser._id, // Hoặc dùng _id của user cũ
                name: userInfo.name,
                phone: userInfo.phone,
                bio: '',
                avatar: defautAvatarUrl,
                products: [], // Mặc định là mảng rỗng, có thể update sau,
                cart: [] // Mặc định là mảng rỗng, có thể update sau
            });
            await newUserDetail.save();

            // Cập nhật liên kết profile vào user cũ
            existingUser.profile = newUserDetail._id;
            // Nếu cần cập nhật lại email/tên ở User gốc (nếu thiếu) có thể update ở đây, tạm thời ta giữ nguyên hoặc save lại
            await existingUser.save();
        }
            // Populate lại để trả về đầy đủ object có profile
            return await User.findById(existingUser._id).populate('profile');
        
        } else {
        // 2. Nếu User HOÀN TOÀN CHƯA TỒN TẠI trong DB -> Tiến hành cào dữ liệu
        const data = await VLUInfo(apiClient);
        const userInfo = {
            phone: data[11],
            mssv: data[12] || mssv, 
            name: data[15],
            email: data[28]
        };

        // 3. Tạo mới User
        const newUser = new User({
            mssv: userInfo.mssv,
            email: userInfo.email,
            password: rawPassword, // Sẽ tự động được hash bởi pre('save') hook
            role: 'user'
        });
        await newUser.save();

        const defautAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${userInfo.name}`
        // 4. Tạo mới UserDetail và liên kết 2 chiều
        const newUserDetail = new UserDetail({
            id: newUser._id,
            name: userInfo.name,
            phone: userInfo.phone,
            bio: '',
            avatar: defautAvatarUrl,
            products: [], // Mặc định là mảng rỗng, có thể update sau,
            cart: [] // Mặc định là mảng rỗng, có thể update sau
        });
        await newUserDetail.save();

        // Cập nhật profile ngược lại vào User
        newUser.profile = newUserDetail._id;
        await newUser.save();

        // Trả về user mới kèm theo profile đã populate
        return await User.findById(newUser._id).populate('profile');
    }
    } catch (error) {
        console.error('Lỗi trong quá trình xử lý userinfo:', error.message);
        throw error; 
    }
}

module.exports = UserInfo;