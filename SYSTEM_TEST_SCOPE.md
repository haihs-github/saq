# KẾ HOẠCH PHẠM VI KIỂM THỬ HỆ THỐNG (SYSTEM TEST SCOPE)

**Dự án:** Hệ thống Quản lý Thiết bị (QLTB)  
**Stack:** Node.js + Express + MySQL (backend), Angular (frontend)  
**Ngày lập:** 10/05/2026  
**Người lập:** SQA Expert  

---

## TỔNG QUAN HỆ THỐNG

Hệ thống QLTB gồm các module chính:
- **Quản lý Người dùng** (CRUD user, đăng nhập, phân quyền)
- **Quản lý Thiết bị** (CRUD thiết bị + phòng học, soft-delete)
- **Mượn/Trả Thiết bị** (tạo phiếu mượn, trả, cập nhật trạng thái)
- **Đề xuất Yêu cầu** (giáo viên gửi phiếu đề xuất mua thiết bị)
- **Phê duyệt Yêu cầu** (ban quản lý duyệt/từ chối phiếu đề xuất)
- **Thống kê & Báo cáo** (xem lịch sử mượn/trả, export Excel)

**Phân quyền thực tế trong code:**
- `Giáo viên` — mượn thiết bị, gửi đề xuất
- `Ban quản lý` — quản lý thiết bị, phê duyệt, thống kê
- `Ban giám hiệu` — xem thống kê, phê duyệt
- `Admin` — toàn quyền

---

## BẢNG 1: CHỨC NĂNG CẦN KIỂM THỬ (YÊU CẦU CHỨC NĂNG)

| # | Tên Function/Feature | Nhóm Chức Năng | Lý Do Cần Kiểm Thử | Kỹ Thuật Black-box | Lý Do Chọn Kỹ Thuật |
|---|----------------------|----------------|---------------------|-------------------|----------------------|
| 1 | **Đăng nhập** (`POST /api/login`) | Xác thực & Phân quyền | Cổng vào hệ thống; code dùng string interpolation SQL → nguy cơ SQL Injection cao; token format `{ID}{random20}{role}` cần verify | EP, BVA, Error Guessing | EP phân vùng username/password hợp lệ-không hợp lệ; BVA kiểm tra độ dài; Error Guessing cho SQL injection, tài khoản Inactive |
| 2 | **Phân quyền theo Role** (authGuard, adminGuard) | Xác thực & Phân quyền | 4 role khác nhau, mỗi role có màn hình/API riêng; sai phân quyền gây lộ dữ liệu | Decision Table, Error Guessing | Decision Table mô hình hóa tổ hợp role × chức năng; Error Guessing cho bypass URL trực tiếp |
| 3 | **Tạo người dùng mới** (`POST /api/user`) | Quản lý Người dùng | Có check unique username/email trong DAO; password lưu plain-text (rủi ro bảo mật) | EP, BVA, Error Guessing | EP cho các trường bắt buộc; BVA độ dài username/email; Error Guessing cho duplicate, ký tự đặc biệt |
| 4 | **Cập nhật người dùng** (`PUT /api/user`) | Quản lý Người dùng | UPDATE toàn bộ 7 field cùng lúc; không có check unique khi update → có thể tạo duplicate | EP, Decision Table | EP cho từng field; Decision Table cho tổ hợp field bắt buộc/tùy chọn |
| 5 | **Xóa người dùng** (`GET /api/user-delete/:id`) | Quản lý Người dùng | Dùng GET để xóa (sai HTTP method); xóa cứng (hard delete) → không rollback được | Error Guessing, EP | Error Guessing cho ID không tồn tại, ID đang có phiếu mượn; EP cho ID hợp lệ/không hợp lệ |
| 6 | **Thêm thiết bị mới** (`POST /api/equipment`) | Quản lý Thiết bị | Transaction 3 bảng (EQUIPMENT_TYPE → MODEL → ITEM); không có validation input phía backend | EP, BVA, Error Guessing | EP cho các field text/number; BVA cho Price, Quantity (âm, 0, dương); Error Guessing cho thiếu field, sai kiểu dữ liệu |
| 7 | **Cập nhật thiết bị** (`PUT /api/equipment`) | Quản lý Thiết bị | Transaction 3 bảng; phân nhánh equipment vs room dựa trên `EQUIPMENT_ITEM_Name`; rollback khi lỗi | EP, Decision Table, State Transition | Decision Table cho nhánh equipment/room; State Transition cho trạng thái thiết bị (Mới→Đang dùng→Hỏng); EP cho từng field |
| 8 | **Xóa thiết bị/phòng** (`POST /api/equipment-delete`) | Quản lý Thiết bị | Soft-delete (set status = 'inactive'); cần verify bản ghi không còn hiển thị sau xóa | EP, Error Guessing | EP cho type=equipment/room/invalid; Error Guessing cho ID không tồn tại, xóa bản ghi đang được mượn |
| 9 | **Thêm phòng học mới** (`POST /api/equipment` với ROOM_Name) | Quản lý Phòng Học | Dùng chung endpoint với thiết bị, phân nhánh bằng `ROOM_Name`; transaction 2 bảng (ROOM_TYPE → ROOM) | EP, BVA, Error Guessing | EP cho Tên phòng, Tòa, Tầng, Số ghế; BVA cho Số ghế (0, âm, dương); Error Guessing cho thiếu ROOM_Name |
| 10 | **Cập nhật phòng học** (`PUT /api/equipment` với ROOM_Name) | Quản lý Phòng Học | Transaction 2 bảng; rollback khi lỗi; không validate input | EP, Decision Table | EP cho từng field; Decision Table cho tổ hợp field bắt buộc |
| 11 | **Tạo phiếu mượn thiết bị** (`POST /api/borrow-return-slip`) | Mượn/Trả Thiết bị | SQL dùng string interpolation → SQL Injection; cập nhật status thiết bị sang 'Đang mượn'; không check thiết bị đã mượn chưa | EP, State Transition, Error Guessing | State Transition cho vòng đời phiếu (Chưa trả→Đã trả); Error Guessing cho SQL injection, mượn thiết bị đang mượn, mảng equipments rỗng |
| 12 | **Trả thiết bị** (`PUT /api/borrow-return-slip`) | Mượn/Trả Thiết bị | Transaction phức tạp: cập nhật slip + date + equipment/room status; logic phân nhánh equipment vs room | State Transition, Decision Table, Error Guessing | State Transition cho trạng thái thiết bị (Đang mượn→Có sẵn); Decision Table cho nhánh equipment/room; Error Guessing cho items rỗng, SLIP_ID không hợp lệ |
| 13 | **Xem danh sách phiếu mượn/trả** (`GET /api/borrow-return-item`) | Mượn/Trả Thiết bị | API không yêu cầu xác thực (lỗ hổng bảo mật); JOIN 8 bảng → cần verify dữ liệu trả về đúng | EP, Error Guessing | EP cho filter theo userId; Error Guessing cho gọi API không có token |
| 14 | **Gửi đề xuất yêu cầu** (`POST /api/request-slip`) | Đề xuất & Phê duyệt | Transaction 2 bảng (REQUEST_SLIP + REQUEST_ITEM); dùng parameterized query (an toàn hơn); cho phép items rỗng | EP, Decision Table, Error Guessing | EP cho REQUEST_SLIP_Name, items array; Decision Table cho items có/không có; Error Guessing cho items=null, thiếu USER_ID |
| 15 | **Phê duyệt yêu cầu** (`PUT /api/approved`) | Đề xuất & Phê duyệt | Cập nhật status phiếu + cập nhật EQUIPMENT_ITEM_Status='Có sẵn' theo tên (không theo ID → rủi ro); transaction | State Transition, Decision Table, Error Guessing | State Transition cho trạng thái phiếu (Chưa duyệt→Đã duyệt); Decision Table cho items có/không có; Error Guessing cho tên thiết bị trùng |
| 16 | **Xem danh sách đề xuất** (`GET /api/request-slip`) | Đề xuất & Phê duyệt | JOIN 3 bảng; không có filter/pagination; cần verify dữ liệu đúng theo role | EP, Error Guessing | EP cho role có/không có quyền; Error Guessing cho gọi không có token |
| 17 | **Thống kê & Export Excel** (frontend Angular) | Thống kê & Báo cáo | Filter theo thời gian; export client-side; API `/borrow-return-item` không có auth | EP, BVA, Error Guessing | BVA cho khoảng thời gian (startDate > endDate, bằng nhau, hợp lệ); Error Guessing cho dataset rỗng, filter chồng nhau |
| 18 | **Xem chi tiết phiếu mượn** (`GET /api/borrow-return-slip-detail/:id`) | Thống kê & Báo cáo | Trả về chi tiết 1 phiếu; cần verify dữ liệu đúng với slip được chọn | EP, Error Guessing | EP cho ID hợp lệ/không hợp lệ; Error Guessing cho ID đã bị xóa |

---

## BẢNG 2: CHỨC NĂNG CẦN KIỂM THỬ (YÊU CẦU PHI CHỨC NĂNG)

| # | Tên Function/Feature | Nhóm Đặc Tính | Lý Do Cần Kiểm Thử | Kỹ Thuật Black-box | Lý Do Chọn Kỹ Thuật |
|---|----------------------|---------------|---------------------|-------------------|----------------------|
| 1 | **SQL Injection qua Login** | Bảo mật (Security) | `user.dao.js` dùng string interpolation: `` `WHERE USER_UserName = '${data.userName}'` `` → lỗ hổng nghiêm trọng | Error Guessing | Thử các payload SQLi kinh điển: `' OR 1=1--`, `'; DROP TABLE USER;--` |
| 2 | **SQL Injection qua Borrow-Return** | Bảo mật (Security) | `createBorrowReturnSlipDAO` dùng string interpolation cho SLIP_Name và Note → tương tự lỗ hổng login | Error Guessing | Inject qua các field text trong payload tạo phiếu mượn |
| 3 | **Xác thực API không có token** | Bảo mật (Security) | `GET /api/borrow-return-item` trả dữ liệu đầy đủ kể cả không có Bearer token → lộ dữ liệu nhạy cảm | Error Guessing | Gọi API trực tiếp không có Authorization header, kiểm tra response |
| 4 | **Mật khẩu lưu plain-text** | Bảo mật (Security) | `user.dao.js` INSERT password trực tiếp không hash → vi phạm bảo mật cơ bản | Error Guessing | Kiểm tra DB trực tiếp sau khi tạo user, xem giá trị USER_Password |
| 5 | **Thời gian phản hồi API** | Hiệu năng (Performance) | JOIN 8 bảng trong `findAllBorrowReturn`; không có index rõ ràng → có thể chậm khi data lớn | Load Testing (Error Guessing) | Đo response time với dataset nhỏ/lớn; ngưỡng chấp nhận < 2s |
| 6 | **Tính toàn vẹn Transaction** | Độ tin cậy (Reliability) | 3 transaction phức tạp (createEquipment, updateEquipment, borrowReturnSlip) có rollback; cần verify rollback hoạt động đúng khi lỗi giữa chừng | Error Guessing, State Transition | Simulate lỗi DB ở bước giữa transaction, kiểm tra dữ liệu không bị ghi nửa chừng |
| 7 | **Responsive UI** | Khả năng sử dụng (Usability) | Checklist ghi nhận nhiều lỗi vỡ giao diện khi zoom/phóng to; ảnh hưởng trải nghiệm người dùng | Error Guessing | Test trên các viewport: 1366×768, 1920×1080, mobile 375px; zoom 80%/125%/150% |
| 8 | **Tương thích trình duyệt** | Tương thích (Compatibility) | Angular app cần chạy ổn trên Chrome, Edge, Firefox | Error Guessing | Chạy các test case chính trên từng trình duyệt, so sánh kết quả |
| 9 | **Race Condition khi mượn đồng thời** | Độ tin cậy (Reliability) | Không có DB-level lock khi tạo phiếu mượn → 2 user mượn cùng thiết bị cùng lúc có thể tạo 2 phiếu | Error Guessing | Gửi 2 request đồng thời cho cùng thiết bị, kiểm tra chỉ 1 phiếu được tạo |
| 10 | **Xử lý lỗi mạng/server** | Độ tin cậy (Reliability) | Frontend cần hiển thị thông báo lỗi thân thiện khi API lỗi 500 hoặc timeout | Error Guessing | Simulate network error, kiểm tra UI không crash và hiển thị thông báo phù hợp |

---

## BẢNG 3: CHỨC NĂNG KHÔNG CẦN KIỂM THỬ

| # | Tên Function/Feature | Nhóm Chức Năng | Lý Do Không Cần Kiểm Thử |
|---|----------------------|----------------|--------------------------|
| 1 | **Xem danh sách thiết bị** (`GET /api/equipment`) | Quản lý Thiết bị | Chỉ là SELECT đơn giản với JOIN 3 bảng, không có logic nghiệp vụ phức tạp; đã được verify gián tiếp qua các test case thêm/cập nhật thiết bị |
| 2 | **Xem chi tiết 1 thiết bị** (`GET /api/equipment/:id`) | Quản lý Thiết bị | Logic đơn giản: parse `id|type` rồi SELECT; rủi ro thấp; được cover khi test update/delete |
| 3 | **Xem danh sách phòng học** (`GET /api/room`) | Quản lý Phòng Học | SELECT đơn giản với JOIN 2 bảng, không có logic nghiệp vụ; tương tự GET equipment |
| 4 | **Xem phiếu mượn theo user** (`GET /api/borrow-return-slip/:id`) | Mượn/Trả Thiết bị | SELECT đơn giản lọc theo USER_ID; không có logic phức tạp; được verify gián tiếp khi test tạo phiếu |
| 5 | **Xem tất cả phiếu mượn** (`GET /api/borrow-return-slip`) | Mượn/Trả Thiết bị | `findAllBorrowReturnSlipDAO` chỉ trả `results[0]` (có thể là bug); tuy nhiên đây là read-only, rủi ro thấp; được cover bởi test thống kê |
| 6 | **Giao diện tĩnh (Header, Footer, Navbar)** | Giao diện (UI) | Nội dung tĩnh, không có logic nghiệp vụ; đã được verify ở unit test/UI test; ít rủi ro |
| 7 | **Cấu hình Docker/Nginx** | Infrastructure | Thuộc phạm vi DevOps/deployment, không phải system test; đã được verify khi deploy thành công |
| 8 | **Cloudflare Tunnel config** | Infrastructure | Cấu hình mạng/tunnel, không liên quan đến logic nghiệp vụ; nằm ngoài phạm vi system test |
| 9 | **Babel transpile config** | Build Tool | Công cụ build, không ảnh hưởng đến logic nghiệp vụ; đã được verify khi build thành công |
| 10 | **Xem 1 user theo ID** (`GET /api/user/:id`) | Quản lý Người dùng | SELECT đơn giản; dùng string interpolation nhưng endpoint này chỉ admin dùng nội bộ; rủi ro thấp so với login |

---

## GHI CHÚ KỸ THUẬT QUAN TRỌNG

### Lỗ hổng cần ưu tiên kiểm thử ngay

| Vị trí | Vấn đề | Mức độ |
|--------|--------|--------|
| `user.dao.js` - `findUserNameAndPassword` | SQL Injection qua string interpolation | 🔴 Critical |
| `user.dao.js` - `findOneUser` | SQL Injection qua string interpolation | 🔴 Critical |
| `borrowReturn.dao.js` - `createBorrowReturnSlipDAO` | SQL Injection qua string interpolation | 🔴 Critical |
| `user.dao.js` - `createUser` | Password lưu plain-text, không hash | 🔴 Critical |
| `GET /api/borrow-return-item` | Không có authentication | 🟠 High |
| `request.dao.js` - `approvedSlip` | Cập nhật thiết bị theo tên thay vì ID | 🟠 High |
| `GET /api/user-delete/:id` | Dùng GET method để xóa (sai REST convention) | 🟡 Medium |
| `findAllBorrowReturnSlipDAO` | Chỉ trả `results[0]` thay vì `results` | 🟡 Medium |

### Kỹ thuật Black-box ưu tiên theo module

- **Đăng nhập / Phân quyền** → EP + BVA + Error Guessing (bảo mật cao nhất)
- **CRUD Thiết bị / Phòng** → EP + BVA + Decision Table (nhiều field, nhiều nhánh)
- **Mượn/Trả** → State Transition + Decision Table (vòng đời phiếu phức tạp)
- **Đề xuất / Phê duyệt** → State Transition + Decision Table
- **Thống kê** → BVA + Error Guessing (filter thời gian, export)

---

*File được tạo tự động dựa trên phân tích mã nguồn backend (Node.js/Express/MySQL) và tài liệu test case hệ thống QLTB.*
