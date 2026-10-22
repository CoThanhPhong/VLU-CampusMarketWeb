// Dữ liệu mẫu để xem giao diện khi backend chưa có API người dùng / người đăng.
// Cấu trúc bám đúng model `product` và `userDetail` của backend.
// Ngày tháng tính theo thời điểm hiện tại nên dữ liệu mẫu lúc nào cũng "mới".

const DAY = 86400000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY).toISOString();

// ---- Ảnh minh hoạ tự vẽ bằng SVG (không phụ thuộc mạng) ----
const ART = {
  mobile: (c) => `
    <rect x="235" y="60" width="170" height="330" rx="30" fill="#1f2937"/>
    <rect x="245" y="72" width="150" height="306" rx="22" fill="${c}"/>
    <rect x="290" y="80" width="60" height="14" rx="7" fill="#1f2937"/>
    <rect x="262" y="120" width="116" height="62" rx="12" fill="#fff" opacity=".35"/>
    <rect x="262" y="196" width="116" height="14" rx="7" fill="#fff" opacity=".35"/>
    <rect x="262" y="220" width="80" height="14" rx="7" fill="#fff" opacity=".25"/>`,
  tablet: (c) => `
    <rect x="170" y="70" width="300" height="340" rx="26" fill="#1f2937"/>
    <rect x="182" y="82" width="276" height="316" rx="16" fill="${c}"/>
    <rect x="204" y="112" width="232" height="86" rx="12" fill="#fff" opacity=".35"/>
    <rect x="204" y="214" width="110" height="14" rx="7" fill="#fff" opacity=".35"/>
    <rect x="204" y="238" width="160" height="14" rx="7" fill="#fff" opacity=".25"/>`,
  laptop: (c) => `
    <rect x="150" y="90" width="340" height="215" rx="14" fill="#1f2937"/>
    <rect x="162" y="102" width="316" height="191" rx="6" fill="${c}"/>
    <rect x="182" y="124" width="150" height="14" rx="7" fill="#fff" opacity=".4"/>
    <rect x="182" y="148" width="110" height="14" rx="7" fill="#fff" opacity=".3"/>
    <path d="M110 315 H530 L510 345 Q508 352 500 352 H140 Q132 352 130 345 Z" fill="#cbd5e1"/>
    <rect x="290" y="315" width="60" height="8" rx="4" fill="#94a3b8"/>`,
  mac: (c) => `
    <rect x="150" y="90" width="340" height="215" rx="14" fill="#d1d5db"/>
    <rect x="160" y="100" width="320" height="195" rx="6" fill="#0f172a"/>
    <rect x="160" y="100" width="320" height="195" rx="6" fill="${c}" opacity=".85"/>
    <circle cx="320" cy="200" r="44" fill="#fff" opacity=".28"/>
    <path d="M110 315 H530 L515 340 Q512 348 504 348 H136 Q128 348 125 340 Z" fill="#e5e7eb"/>
    <rect x="290" y="315" width="60" height="8" rx="4" fill="#cbd5e1"/>`,
};

export function mockImage(type, hue = 210, label = "") {
  const c1 = `hsl(${hue} 70% 93%)`;
  const c2 = `hsl(${(hue + 40) % 360} 70% 82%)`;
  const accent = `hsl(${hue} 75% 52%)`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="640" height="480" fill="url(#g)"/>
    ${(ART[type] ?? ART.laptop)(accent)}
    <text x="320" y="428" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a" opacity=".5">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function mockAvatar(text, hue) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="hsl(${hue} 60% 55%)"/><text x="60" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#fff">${text}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const multi = (type, hue, name) =>
  [mockImage(type, hue, name), mockImage(type, hue + 25, "Mặt sau"), mockImage(type, hue - 25, "Phụ kiện đi kèm")].join("|");

// ---- Người dùng (khớp model userDetail; _id chính là userID) ----
export const MOCK_USERS = [
  {
    _id: "6ace1ce78429535964e00001",
    name: "Trần Minh Anh",
    bio: "Sinh viên năm 3 ngành Công nghệ thông tin. Mình lên đời máy mới nên nhượng lại vài thiết bị còn rất đẹp. Giao dịch trực tiếp tại trường, thoải mái kiểm tra máy trước khi nhận.",
    email: "minhanh@example.com",
    avatar: "",
    phone: "0901234567",
    studentID: "2274802010123",
    role: "user",
    createdAt: daysFromNow(-120),
  },
  {
    _id: "6ace1ce78429535964e00002",
    name: "Lê Hoàng Phúc",
    bio: "Thanh lý đồ công nghệ cũ, có bảo hành lại 1 tháng. Ưu tiên giao dịch giờ nghỉ trưa.",
    email: "hoangphuc@example.com",
    avatar: mockAvatar("PH", 205),
    phone: "0912345678",
    studentID: "2174802010456",
    role: "user",
    createdAt: daysFromNow(-300),
  },
  {
    _id: "6ace1ce78429535964e00003",
    name: "Nguyễn Thu Hà",
    bio: "",
    email: "thuha@example.com",
    avatar: "",
    phone: "",
    studentID: "2374802010789",
    role: "user",
    createdAt: daysFromNow(-40),
  },
];

const [U1, U2, U3] = MOCK_USERS.map((u) => u._id);

// ---- Tin đăng (khớp model product) ----
export const MOCK_PRODUCTS = [
  {
    _id: "6ace1ce78429535964d00001",
    name: "iPhone 13 128GB màu xanh, pin 91%",
    description:
      "Máy dùng kỹ, không trầy xước, ngoại hình đẹp khoảng 98%. Pin 91%, Face ID và camera hoạt động tốt, chưa từng sửa chữa.\n\nĐi kèm: hộp, cáp sạc zin, ốp lưng và 1 miếng dán cường lực mới.\nMình nhận kiểm tra máy thoải mái trước khi mua, có thể giao dịch trực tiếp tại Cơ sở 3 vào giờ nghỉ trưa.\n\nGiá đã rất mềm nên không bớt thêm, cảm ơn các bạn!",
    price: 11500000,
    amount: 1,
    local: "Cơ sở 3",
    img: multi("mobile", 205, "iPhone 13"),
    startDate: daysFromNow(-2),
    status: "Còn hàng",
    deviceType: "mobile",
    endDate: daysFromNow(12),
    seller: U1,
    createdAt: daysFromNow(-2),
  },
  {
    _id: "6ace1ce78429535964d00002",
    name: "MacBook Air M1 8GB/256GB",
    description:
      "MacBook Air M1 dùng học tập và làm đồ án, máy rất sạch, sạc 74 lần. Bàn phím và màn hình hoàn hảo. Có kèm sạc và túi chống sốc.",
    price: 15900000,
    amount: 1,
    local: "Cơ sở 1",
    img: multi("mac", 160, "MacBook Air M1"),
    startDate: daysFromNow(-5),
    status: "Còn hàng",
    deviceType: "mac",
    endDate: daysFromNow(9),
    seller: U2,
    createdAt: daysFromNow(-5),
  },
  {
    _id: "6ace1ce78429535964d00003",
    name: "Dell Inspiron 15 3520 i5 thế hệ 12",
    description: "Laptop văn phòng, RAM 16GB, SSD 512GB. Còn 2 máy, mua cùng lúc có thể thương lượng.",
    price: 9800000,
    amount: 2,
    local: "Cơ sở 2",
    img: mockImage("laptop", 25, "Dell Inspiron 15"),
    startDate: daysFromNow(-1),
    status: "Còn hàng",
    deviceType: "laptop",
    endDate: daysFromNow(20),
    seller: U1,
    createdAt: daysFromNow(-1),
  },
  {
    _id: "6ace1ce78429535964d00004",
    name: "iPad Gen 9 64GB kèm Apple Pencil",
    description: "iPad dùng ghi chú và xem tài liệu, kèm Pencil đời 1 và bao da. Máy chưa từng rơi.",
    price: 6200000,
    amount: 1,
    local: "Cơ sở 3",
    img: mockImage("tablet", 280, "iPad Gen 9"),
    startDate: daysFromNow(-3),
    status: "Còn hàng",
    deviceType: "tablet",
    endDate: daysFromNow(15),
    seller: U3,
    createdAt: daysFromNow(-3),
  },
  {
    _id: "6ace1ce78429535964d00005",
    name: "Samsung Galaxy S21 FE 128GB",
    description: "Màn hình đẹp, pin còn tốt. Bán gấp trước khi hết hạn đăng.",
    price: 5400000,
    amount: 1,
    local: "Cơ sở 1",
    img: mockImage("mobile", 265, "Galaxy S21 FE"),
    startDate: daysFromNow(-9),
    status: "Còn hàng",
    deviceType: "mobile",
    endDate: daysFromNow(2),
    seller: U1,
    createdAt: daysFromNow(-9),
  },
  {
    _id: "6ace1ce78429535964d00006",
    name: "Lenovo ThinkPad T14 Gen 2",
    description: "Đã có người nhận. Cảm ơn các bạn đã quan tâm.",
    price: 12700000,
    amount: 0,
    local: "Cơ sở 2",
    img: mockImage("laptop", 195, "ThinkPad T14"),
    startDate: daysFromNow(-14),
    status: "Hết hàng",
    deviceType: "laptop",
    endDate: daysFromNow(1),
    seller: U2,
    createdAt: daysFromNow(-14),
  },
  {
    _id: "6ace1ce78429535964d00007",
    name: "MacBook Pro 14 inch M1 Pro 16GB/512GB",
    description: "Máy mạnh cho đồ hoạ và lập trình, màn hình Liquid Retina XDR rất đẹp. Full box, còn bảo hành Apple 4 tháng.",
    price: 28500000,
    amount: 1,
    local: "Cơ sở 1",
    img: multi("mac", 235, "MacBook Pro 14"),
    startDate: daysFromNow(-4),
    status: "Còn hàng",
    deviceType: "mac",
    endDate: daysFromNow(10),
    seller: U1,
    createdAt: daysFromNow(-4),
  },
  {
    _id: "6ace1ce78429535964d00008",
    name: "iPad Air 5 M1 64GB Wi-Fi",
    description: "Đã bán.",
    price: 11900000,
    amount: 0,
    local: "Cơ sở 2",
    img: mockImage("tablet", 320, "iPad Air 5"),
    startDate: daysFromNow(-25),
    status: "Hết hàng",
    deviceType: "tablet",
    endDate: daysFromNow(-5),
    seller: U1,
    createdAt: daysFromNow(-25),
  },
  {
    _id: "6ace1ce78429535964d00009",
    name: "Xiaomi Redmi Note 12 128GB",
    description: "Máy phụ, còn 3 chiếc. Tin đã quá hạn đăng nên cần hỏi lại người bán.",
    price: 3100000,
    amount: 3,
    local: "Cơ sở 3",
    img: mockImage("mobile", 20, "Redmi Note 12"),
    startDate: daysFromNow(-20),
    status: "Còn hàng",
    deviceType: "mobile",
    endDate: daysFromNow(-1),
    seller: U3,
    createdAt: daysFromNow(-20),
  },
  {
    // Tin tối thiểu: không mô tả, không người đăng, không hạn đăng (để thử các trường hợp thiếu dữ liệu)
    _id: "6ace1ce78429535964d00010",
    name: "Asus Vivobook 14 Ryzen 5",
    price: 8200000,
    amount: 1,
    local: "Cơ sở 3",
    img: mockImage("laptop", 340, "Asus Vivobook 14"),
    startDate: daysFromNow(-6),
    status: "Còn hàng",
    deviceType: "laptop",
  },
];
