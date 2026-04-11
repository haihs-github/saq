# HỆ THỐNG QUẢN LÝ THIẾT BỊ TRƯỜNG HỌC

## 📋 GIỚI THIỆU

Hệ thống quản lý thiết bị trường học là ứng dụng web full-stack giúp quản lý việc mượn trả thiết bị dạy học, theo dõi tình trạng thiết bị, và xử lý các yêu cầu mượn thiết bị của giáo viên.

### Công nghệ sử dụng

**Backend:**
- Node.js + Express.js
- MySQL 8.0
- Babel (ES6+ transpiler)

**Frontend:**
- Angular 17.3
- TypeScript
- RxJS
- ExcelJS (xuất báo cáo)

**DevOps:**
- Docker & Docker Compose
- Nginx (reverse proxy)
- Cloudflare Tunnel

---

## 🎯 CHỨC NĂNG CHÍNH

### 1. QUẢN LÝ NGƯỜI DÙNG
- **Đăng nhập/Đăng ký**: Xác thực người dùng với token-based authentication
- **Phân quyền**: 4 vai trò người dùng
  - `Giáo viên (Teacher)`: Người dùng cơ bản
  - `Quản lý cơ sở vật chất (Facility Manager)`: Quản lý thiết bị và yêu cầu
  - `Ban giám hiệu (Management Board)`: Phê duyệt và thống kê
  - `Admin`: Toàn quyền quản trị
- **Quản lý tài khoản**: Xem, tạo, cập nhật, xóa người dùng

### 2. QUẢN LÝ THIẾT BỊ
- **Danh sách thiết bị**: Xem tất cả thiết bị theo môn học
  - Ngữ văn, Toán học, Vật lý, Hóa học, Sinh học
  - Lịch sử, Địa lý, Thể dục, Quốc phòng an ninh
- **Thông tin thiết bị**:
  - Tên thiết bị, mã thiết bị, môn học
  - Đơn vị tính, giá, số lượng
  - Ngày nhập, hạn sử dụng
  - Tình trạng (Mới, Hết hạn)
  - Vị trí (phòng học)
- **Thêm/Sửa/Xóa thiết bị**: Chỉ dành cho Facility Manager
- **Tìm kiếm thiết bị**: Tìm theo tên, mã, môn học

### 3. QUẢN LÝ PHÒNG HỌC
- Xem danh sách phòng học/phòng thí nghiệm
- Theo dõi thiết bị trong từng phòng

### 4. ĐĂNG KÝ MƯỢN THIẾT BỊ
- **Tạo phiếu đăng ký mượn**:
  - Chọn thiết bị cần mượn
  - Nhập thông tin: lớp, giáo viên, số lượng
  - Chọn ngày mượn, tiết mượn, tiết trả
- **Xem lịch sử đăng ký**: Theo dõi các phiếu đã tạo
- **Trạng thái phiếu**:
  - Chờ duyệt
  - Đã duyệt
  - Từ chối

### 5. QUẢN LÝ YÊU CẦU (REQUEST)
*Dành cho Facility Manager*
- Xem tất cả yêu cầu mượn thiết bị
- Phê duyệt/Từ chối yêu cầu
- Ghi chú lý do từ chối

### 6. QUẢN LÝ MƯỢN TRẢ
- **Xem phiếu mượn**:
  - Phiếu đang mượn
  - Phiếu đã trả
  - Phiếu quá hạn
- **Trả thiết bị**: Cập nhật trạng thái đã trả
- **Thông báo**: Cảnh báo thiết bị quá hạn trả

### 7. THỐNG KÊ BÁO CÁO
*Dành cho Management Board và Admin*
- **Thống kê theo thời gian**:
  - Số lượng thiết bị được mượn
  - Tỷ lệ trả đúng hạn/quá hạn
  - Thiết bị được mượn nhiều nhất
- **Thống kê theo môn học**: Phân tích sử dụng thiết bị
- **Xuất báo cáo Excel**: Tải báo cáo chi tiết

### 8. THÔNG BÁO
- Thông báo thiết bị sắp đến hạn trả
- Cảnh báo thiết bị quá hạn
- Thông báo yêu cầu được phê duyệt/từ chối

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN

### Yêu cầu hệ thống
- Node.js 16+ và npm
- MySQL 8.0
- Docker và Docker Compose (tùy chọn)

### ⚡ CÁCH NHANH NHẤT (Development Mode)

#### Bước 1: Cài đặt dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

#### Bước 2: Khởi động Database

**Với Docker (Khuyến nghị):**
```bash
# Mở Docker Desktop trước
# Sau đó chạy:
docker compose up -d database-mysql

# Đợi 10-20 giây cho database khởi động
# Kiểm tra:
docker logs mysql-db
```

**Với MySQL local:**
```bash
# Tạo database
mysql -u root -p
CREATE DATABASE datn;
exit;

# Import dữ liệu
mysql -u root -p datn < backend/database/qltb-tq.sql
```

#### Bước 3: Cấu hình Backend
File `backend/.env` đã có sẵn:
```env
DB_HOST=localhost
USER=root
PASS=luyen123
DATABASE=datn
DB_PORT=3306
TOKEN=abcdefghijklmnopqrstuvwxyz
```

**Lưu ý:** Nếu dùng Docker, database sẽ chạy trên port 3307, cần đổi:
```env
DB_PORT=3307
```

#### Bước 4: Chạy Backend
```bash
cd backend
npm run dev
```
✅ Backend chạy tại: http://localhost:8080
✅ Xem log: "Kết nối csdl thành công!"

#### Bước 5: Chạy Frontend
```bash
cd frontend
npm start
```
✅ Frontend chạy tại: http://localhost:4200
✅ Đợi compile xong (1-2 phút)

---

### 🐳 CÁCH CHẠY VỚI DOCKER COMPOSE (Production)

#### Bước 1: Build images
```bash
# Build backend
cd backend
npm run build
docker build -f Dockerfile -t node-be .

# Build frontend
cd frontend
npm run build
docker build -f Dockerfile -t node-fe .
```

#### Bước 2: Khởi động tất cả services
```bash
docker compose -p datn up -d
```

Dự án sẽ chạy tại:
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:8080
- MySQL: localhost:3307

#### Bước 3: Xem logs
```bash
docker compose logs -f
```

#### Bước 4: Dừng services
```bash
docker compose down
```

---

## 📁 CẤU TRÚC DỰ ÁN

```
project/
├── backend/
│   ├── src/
│   │   ├── app-router/
│   │   │   └── routeApi.js          # Định nghĩa API routes
│   │   ├── config/
│   │   │   └── configDB.js          # Cấu hình database
│   │   ├── module/
│   │   │   ├── user/                # Module người dùng
│   │   │   ├── equipment/           # Module thiết bị
│   │   │   ├── borrowReturn/        # Module mượn trả
│   │   │   └── request/             # Module yêu cầu
│   │   ├── public/                  # Static files
│   │   └── index.js                 # Entry point
│   ├── database/
│   │   └── qltb-tq.sql             # Database schema
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── page-home/       # Trang chủ
│   │   │   │   ├── page-thiet-bi/   # Quản lý thiết bị
│   │   │   │   ├── page-dang-ky/    # Đăng ký mượn
│   │   │   │   ├── page-muon/       # Quản lý mượn trả
│   │   │   │   ├── page-request/    # Quản lý yêu cầu
│   │   │   │   ├── page-approved/   # Phê duyệt
│   │   │   │   ├── page-thong-ke/   # Thống kê báo cáo
│   │   │   │   ├── page-admin/      # Quản trị
│   │   │   │   └── ...
│   │   │   ├── services/            # API services
│   │   │   ├── guards/              # Route guards
│   │   │   └── app.routes.ts        # Routing config
│   │   └── ...
│   ├── package.json
│   └── Dockerfile
│
└── docker-compose.yml               # Docker orchestration
```

---

## 🔌 API ENDPOINTS

### Authentication
- `POST /api/login` - Đăng nhập

### User Management
- `GET /api/user` - Lấy danh sách người dùng
- `GET /api/user/:id` - Lấy thông tin người dùng
- `POST /api/user` - Tạo người dùng mới
- `PUT /api/user` - Cập nhật người dùng
- `GET /api/user-delete/:id` - Xóa người dùng

### Equipment Management
- `GET /api/equipment` - Lấy danh sách thiết bị
- `GET /api/equipment/:id` - Lấy thông tin thiết bị
- `POST /api/equipment` - Thêm thiết bị mới
- `PUT /api/equipment` - Cập nhật thiết bị
- `POST /api/equipment-delete` - Xóa thiết bị
- `GET /api/room` - Lấy danh sách phòng

### Borrow/Return Management
- `GET /api/borrow-return-slip` - Lấy tất cả phiếu mượn trả
- `GET /api/borrow-return-slip/:id` - Lấy phiếu theo user
- `GET /api/borrow-return-slip-detail/:id` - Chi tiết phiếu
- `POST /api/borrow-return-slip` - Tạo phiếu mượn
- `PUT /api/borrow-return-slip` - Cập nhật trạng thái trả
- `GET /api/borrow-return-item` - Lấy danh sách item

### Request Management
- `GET /api/request-slip` - Lấy danh sách yêu cầu
- `POST /api/request-slip` - Tạo yêu cầu mới
- `PUT /api/approved` - Phê duyệt yêu cầu

---

## 👥 PHÂN QUYỀN NGƯỜI DÙNG

| Chức năng | Teacher | Facility Manager | Management Board | Admin |
|-----------|---------|------------------|------------------|-------|
| Xem thiết bị | ✅ | ✅ | ✅ | ✅ |
| Đăng ký mượn | ✅ | ✅ | ✅ | ✅ |
| Xem phiếu mượn của mình | ✅ | ✅ | ✅ | ✅ |
| Quản lý thiết bị | ❌ | ✅ | ❌ | ✅ |
| Xử lý yêu cầu | ❌ | ✅ | ❌ | ✅ |
| Quản lý người dùng | ❌ | ✅ | ❌ | ✅ |
| Phê duyệt | ❌ | ✅ | ✅ | ✅ |
| Thống kê báo cáo | ❌ | ✅ | ✅ | ✅ |

---

## 🗄️ CẤU TRÚC DATABASE

### Bảng `home_user`
- Lưu thông tin người dùng
- Các trường: id, username, password, role, email, phone, ...

### Bảng `home_device`
- Lưu thông tin thiết bị
- Các trường: id, name, code, mon (môn học), unit, price, quantity, ngaynhap, hansudung, status, location, userId_id

### Bảng `home_borrowreturn`
- Lưu thông tin phiếu mượn trả
- Các trường: id, lop, giaovien, deviceId_id, userId_id, so_luong, ngay_dang_ky, tiet_muon, tiet_tra, ngay_muon, ngay_tra, da_tra

### Bảng `room`
- Lưu thông tin phòng học

---

## 🔧 TROUBLESHOOTING

### Lỗi kết nối database
```bash
# Kiểm tra MySQL đang chạy
docker ps | grep mysql

# Xem logs
docker logs mysql-db
```

### Lỗi port đã được sử dụng
```bash
# Thay đổi port trong docker-compose.yml hoặc .env
```

### Frontend không kết nối được backend
- Kiểm tra API URL trong frontend config
- Đảm bảo CORS được cấu hình đúng trong backend

---

## 📝 GHI CHÚ

- Tài khoản mặc định có thể được tạo từ database seed
- Token authentication có thời hạn, cần refresh khi hết hạn
- Backup database định kỳ để tránh mất dữ liệu
- Môi trường production nên sử dụng HTTPS và bảo mật token

---

## 👨‍💻 TÁC GIẢ

**LuongLuyen**

---

## 📄 LICENSE

ISC License
