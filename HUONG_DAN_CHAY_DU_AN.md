# HƯỚNG DẪN CHẠY DỰ ÁN CHI TIẾT

## ✅ TRẠNG THÁI HIỆN TẠI

### Đã hoàn thành:
- ✅ Cài đặt dependencies cho Backend
- ✅ Cài đặt dependencies cho Frontend  
- ✅ Backend đang chạy trên port 8080
- ✅ Frontend đang khởi động

### Cần khắc phục:
- ⚠️ Database MySQL chưa được khởi động

---

## 🔧 CÁCH KHẮC PHỤC VÀ CHẠY DỰ ÁN

### PHƯƠNG ÁN 1: Sử dụng Docker (Khuyến nghị)

#### Bước 1: Khởi động Docker Desktop
1. Mở ứng dụng **Docker Desktop** trên Windows
2. Đợi cho đến khi Docker Desktop hiển thị trạng thái "Running"
3. Kiểm tra bằng lệnh:
```bash
docker ps
```

#### Bước 2: Khởi động Database
```bash
# Khởi động chỉ MySQL database
docker compose up -d database-mysql

# Hoặc khởi động tất cả services
docker compose up -d
```

#### Bước 3: Kiểm tra Database đã chạy
```bash
docker ps | grep mysql
docker logs mysql-db
```

#### Bước 4: Import dữ liệu (nếu cần)
```bash
# Nếu database chưa có dữ liệu
docker exec -i mysql-db mysql -uroot -pluyen123 datn < backend/database/qltb-tq.sql
```

#### Bước 5: Restart Backend
Backend sẽ tự động kết nối lại khi database đã sẵn sàng. Nếu không, restart:
```bash
# Backend đang chạy trong terminal, nhấn Ctrl+C và chạy lại
cd backend
npm run dev
```

---

### PHƯƠNG ÁN 2: Cài đặt MySQL trực tiếp

#### Bước 1: Tải và cài đặt MySQL
1. Tải MySQL 8.0 từ: https://dev.mysql.com/downloads/mysql/
2. Cài đặt với mật khẩu root: `luyen123`
3. Đảm bảo MySQL Service đang chạy

#### Bước 2: Tạo Database
```sql
CREATE DATABASE datn;
```

#### Bước 3: Import dữ liệu
```bash
mysql -u root -p datn < backend/database/qltb-tq.sql
# Nhập mật khẩu: luyen123
```

#### Bước 4: Kiểm tra kết nối
```bash
mysql -u root -p
# Nhập mật khẩu: luyen123
USE datn;
SHOW TABLES;
```

---

## 🚀 TRUY CẬP ỨNG DỤNG

Sau khi database đã chạy thành công:

### Backend API
- URL: http://localhost:8080
- Test API: http://localhost:8080/api/equipment

### Frontend
- URL: http://localhost:4200
- Đợi Angular compile xong (khoảng 1-2 phút)

### Tài khoản đăng nhập mặc định
Kiểm tra trong database table `home_user` để lấy thông tin đăng nhập.

---

## 📊 KIỂM TRA TRẠNG THÁI

### Kiểm tra Backend
```bash
# Xem logs backend
# Backend đang chạy trong terminal riêng

# Test API
curl http://localhost:8080/api/equipment
```

### Kiểm tra Frontend
```bash
# Xem logs frontend
# Frontend đang chạy trong terminal riêng

# Mở trình duyệt
# http://localhost:4200
```

### Kiểm tra Database
```bash
# Với Docker
docker exec -it mysql-db mysql -uroot -pluyen123 -e "SHOW DATABASES;"

# Với MySQL local
mysql -u root -p -e "SHOW DATABASES;"
```

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi 1: "Access denied for user 'root'@'localhost'"
**Nguyên nhân:** Mật khẩu MySQL không đúng hoặc MySQL chưa chạy

**Giải pháp:**
1. Kiểm tra MySQL đang chạy
2. Kiểm tra mật khẩu trong file `backend/.env`
3. Reset mật khẩu MySQL nếu cần

### Lỗi 2: "Port 8080 already in use"
**Nguyên nhân:** Port đã được sử dụng bởi ứng dụng khác

**Giải pháp:**
```bash
# Tìm process đang dùng port
netstat -ano | findstr :8080

# Kill process (thay PID bằng số thực tế)
taskkill /PID <PID> /F

# Hoặc đổi port trong backend/.env
PORT=8081
```

### Lỗi 3: "Cannot connect to Docker daemon"
**Nguyên nhân:** Docker Desktop chưa chạy

**Giải pháp:**
1. Mở Docker Desktop
2. Đợi cho đến khi hiển thị "Running"
3. Chạy lại lệnh docker compose

### Lỗi 4: Frontend không load được
**Nguyên nhân:** Angular đang compile

**Giải pháp:**
- Đợi thêm 1-2 phút
- Kiểm tra terminal frontend có lỗi không
- Refresh trình duyệt (Ctrl + F5)

### Lỗi 5: "CORS error" khi gọi API
**Nguyên nhân:** Backend chưa cấu hình CORS đúng

**Giải pháp:**
- Backend đã có `cors()` middleware
- Kiểm tra URL API trong frontend config
- Đảm bảo backend đang chạy

---

## 📝 CHECKLIST CHẠY DỰ ÁN

- [ ] Docker Desktop đang chạy (hoặc MySQL đã cài đặt)
- [ ] Database MySQL đã khởi động
- [ ] Database `datn` đã được tạo và import dữ liệu
- [ ] Backend đang chạy trên port 8080
- [ ] Backend kết nối database thành công (xem log: "Kết nối csdl thành công!")
- [ ] Frontend đang chạy trên port 4200
- [ ] Frontend compile thành công
- [ ] Có thể truy cập http://localhost:4200
- [ ] Có thể đăng nhập vào hệ thống

---

## 🎯 BƯỚC TIẾP THEO

1. **Khởi động Docker Desktop** (nếu dùng Docker)
2. **Chạy lệnh:** `docker compose up -d database-mysql`
3. **Đợi 10-20 giây** cho database khởi động
4. **Kiểm tra log backend** - sẽ thấy "Kết nối csdl thành công!"
5. **Mở trình duyệt** và truy cập http://localhost:4200

---

## 💡 MẸO HỮU ÍCH

### Xem logs realtime
```bash
# Backend logs
# Xem trong terminal đang chạy backend

# Frontend logs  
# Xem trong terminal đang chạy frontend

# Database logs (Docker)
docker logs -f mysql-db
```

### Restart services
```bash
# Restart backend: Ctrl+C trong terminal backend, sau đó
npm run dev

# Restart frontend: Ctrl+C trong terminal frontend, sau đó
npm start

# Restart database (Docker)
docker restart mysql-db
```

### Stop tất cả services
```bash
# Stop backend và frontend: Ctrl+C trong mỗi terminal

# Stop Docker services
docker compose down
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Kiểm tra logs trong terminal
2. Kiểm tra Docker Desktop status
3. Kiểm tra file .env có đúng cấu hình không
4. Đảm bảo ports 3306, 4200, 8080 không bị chiếm dụng

---

**Chúc bạn chạy dự án thành công! 🎉**
