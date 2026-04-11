# 🐳 DỰ ÁN ĐÃ CHẠY THÀNH CÔNG VỚI DOCKER COMPOSE!

**Thời gian:** 03/04/2026 15:06

---

## ✅ TẤT CẢ CONTAINERS ĐANG CHẠY

### 1. 🗄️ MySQL Database
```
Container: mysql-db
Image: mysql:8.0
Status: ✅ Running (54 minutes)
Ports: 3307:3306
Database: datn
```

### 2. 🔧 Backend API
```
Container: node-backend
Image: node-be:latest
Status: ✅ Running
Ports: 8080:8080
Database Connection: ✅ Thành công!
```

### 3. 🌐 Nginx (Frontend)
```
Container: nginx-proxy
Image: nginx:latest
Status: ✅ Running
Ports: 80:80
Serving: Frontend build từ dist/frontend
```

### 4. ☁️ Cloudflare Tunnel
```
Container: cloudflared
Image: cloudflare/cloudflared:latest
Status: ✅ Running
Purpose: Expose local app to internet
```

---

## 🌐 TRUY CẬP ỨNG DỤNG

### Frontend (Production Mode)
**URL:** http://localhost

Hoặc: http://localhost:80

### Backend API
**URL:** http://localhost:8080

**Test API:**
```bash
curl http://localhost:8080/api/equipment
```

### Database
```bash
# Từ máy local
mysql -h localhost -P 3307 -u root -p
# Password: luyen123

# Hoặc qua Docker
docker exec -it mysql-db mysql -uroot -pluyen123 datn
```

---

## 🔑 THÔNG TIN ĐĂNG NHẬP

### Tài khoản 1: Giáo viên
- **Username:** `nguyenvantuan`
- **Password:** `123456`
- **Vai trò:** Giáo viên

### Tài khoản 2: Ban giám hiệu
- **Username:** `ledinhhung`
- **Password:** `123456`
- **Vai trò:** Ban giám hiệu

### Tài khoản 3: Ban quản lý
- **Username:** `luongvanluyen`
- **Password:** `123456`
- **Vai trò:** Ban quản lý

---

## 📊 KIỂM TRA TRẠNG THÁI

### Xem tất cả containers
```bash
docker ps
```

### Xem logs
```bash
# Backend logs
docker logs node-backend

# Frontend/Nginx logs
docker logs nginx-proxy

# Database logs
docker logs mysql-db

# Cloudflare logs
docker logs cloudflared

# Xem logs realtime
docker logs -f node-backend
```

### Kiểm tra health
```bash
# Backend API
curl http://localhost:8080/api/equipment

# Frontend
curl http://localhost
```

---

## 🛠️ QUẢN LÝ DOCKER COMPOSE

### Stop tất cả services
```bash
docker compose down
```

### Start lại tất cả services
```bash
docker compose up -d
```

### Restart một service cụ thể
```bash
# Restart backend
docker restart node-backend

# Restart frontend
docker restart nginx-proxy

# Restart database
docker restart mysql-db
```

### Xem logs của tất cả services
```bash
docker compose logs -f
```

### Rebuild và restart
```bash
# Rebuild backend image
cd backend
npm run build
docker build -f Dockerfile -t node-be .

# Rebuild frontend
cd frontend
npm run build

# Restart services
docker compose down
docker compose up -d
```

---

## 🔄 CẬP NHẬT CODE

### Khi thay đổi Backend
```bash
# 1. Build code
cd backend
npm run build

# 2. Rebuild Docker image
docker build -f Dockerfile -t node-be .

# 3. Restart container
docker restart node-backend

# Hoặc rebuild và restart toàn bộ
docker compose down
docker compose up -d --build
```

### Khi thay đổi Frontend
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Restart nginx (nginx sẽ serve file mới từ dist)
docker restart nginx-proxy
```

### Khi thay đổi Database
```bash
# Import SQL mới
docker exec -i mysql-db mysql -uroot -pluyen123 datn < your-new-file.sql

# Hoặc restart database
docker restart mysql-db
```

---

## 📁 CẤU TRÚC DOCKER

### Docker Compose Services
```yaml
services:
  - nginx (Frontend)
  - backend (Node.js API)
  - database-mysql (MySQL 8.0)
  - cloudflared (Tunnel)
```

### Volumes
```
- ./frontend/dist/frontend → /usr/share/nginx/html (Frontend files)
- ./nginx/nginx.conf → /etc/nginx/nginx.conf (Nginx config)
- ./insert.sql → /docker-entrypoint-initdb.d/insert.sql (DB init)
```

### Networks
```
webnet (bridge) - Kết nối tất cả containers
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: Port already in use
```bash
# Tìm process đang dùng port
netstat -ano | findstr :8080
netstat -ano | findstr :80

# Kill process
taskkill /PID <PID> /F

# Hoặc stop development servers trước khi chạy Docker
```

### Lỗi: Container không start
```bash
# Xem logs chi tiết
docker logs <container-name>

# Restart container
docker restart <container-name>

# Xóa và tạo lại
docker compose down
docker compose up -d
```

### Lỗi: Backend không kết nối Database
```bash
# Kiểm tra database đang chạy
docker ps | grep mysql

# Kiểm tra logs
docker logs mysql-db

# Restart cả hai
docker restart mysql-db
docker restart node-backend
```

### Lỗi: Frontend không load
```bash
# Kiểm tra nginx logs
docker logs nginx-proxy

# Kiểm tra file dist có tồn tại
ls frontend/dist/frontend

# Rebuild frontend
cd frontend
npm run build
docker restart nginx-proxy
```

### Lỗi: Image not found
```bash
# Build lại images
cd backend
npm run build
docker build -f Dockerfile -t node-be .

cd ../frontend
npm run build

# Start lại
docker compose up -d
```

---

## 💾 BACKUP & RESTORE

### Backup Database
```bash
# Export database
docker exec mysql-db mysqldump -uroot -pluyen123 datn > backup_$(date +%Y%m%d).sql

# Hoặc
docker exec mysql-db mysqldump -uroot -pluyen123 datn > backup.sql
```

### Restore Database
```bash
# Import database
docker exec -i mysql-db mysql -uroot -pluyen123 datn < backup.sql
```

### Backup Volumes
```bash
# Backup toàn bộ data
docker run --rm -v qltb-pr_mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz /data
```

---

## 🔒 BẢO MẬT

### Thay đổi mật khẩu Database
```bash
# Vào MySQL
docker exec -it mysql-db mysql -uroot -pluyen123

# Đổi password
ALTER USER 'root'@'%' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;

# Cập nhật docker-compose.yml và .env
```

### Thay đổi mật khẩu User
```bash
# Vào database
docker exec -it mysql-db mysql -uroot -pluyen123 datn

# Đổi password
UPDATE USER SET USER_Password = 'new_password' WHERE USER_UserName = 'username';
```

---

## 📈 MONITORING

### Xem resource usage
```bash
# CPU, Memory usage
docker stats

# Chỉ xem một container
docker stats node-backend
```

### Xem network
```bash
# List networks
docker network ls

# Inspect network
docker network inspect qltb-pr_webnet
```

### Xem volumes
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect <volume-name>
```

---

## 🚀 PRODUCTION TIPS

### 1. Environment Variables
Sử dụng file `.env` riêng cho production:
```bash
# .env.production
DB_HOST=production-db-host
DB_PORT=3306
TOKEN=your-secure-token
```

### 2. SSL/HTTPS
Cấu hình SSL trong nginx hoặc sử dụng Cloudflare Tunnel

### 3. Logging
```bash
# Cấu hình log rotation
docker run --log-driver json-file --log-opt max-size=10m --log-opt max-file=3
```

### 4. Health Checks
Thêm health checks vào docker-compose.yml:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## 📞 HỖ TRỢ

### Tài liệu
- README.md - Tài liệu đầy đủ
- HUONG_DAN_CHAY_DU_AN.md - Hướng dẫn chi tiết
- DU_AN_DA_CHAY_THANH_CONG.md - Development mode

### Commands Cheat Sheet
```bash
# Start all
docker compose up -d

# Stop all
docker compose down

# View logs
docker compose logs -f

# Restart service
docker restart <service-name>

# Rebuild
docker compose up -d --build

# Remove all
docker compose down -v
```

---

## 🎊 KẾT LUẬN

Dự án đã chạy thành công với Docker Compose! Tất cả 4 containers đang hoạt động:

✅ MySQL Database
✅ Backend API (Node.js)
✅ Frontend (Nginx)
✅ Cloudflare Tunnel

**Truy cập ngay:** http://localhost

**Đăng nhập với:**
- Username: `nguyenvantuan` / `ledinhhung` / `luongvanluyen`
- Password: `123456`

---

**Chúc bạn sử dụng thành công! 🎉**
