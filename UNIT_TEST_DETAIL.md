# UNIT TEST DETAIL - user.service.js

> **File:** `backend/src/module/user/user.service.js`
> **Framework:** Jest | **Mock:** `jest.mock('../user/user.dao')`
> **Nghiệp vụ hệ thống:** Quản lý thiết bị trường học — 4 role: `Giáo viên`, `Ban giám hiệu`, `Ban quản lý`, `Admin`; 2 trạng thái: `Active`, `Inactive`

---

## 1. token(length)

> **Nghiệp vụ:** Tạo chuỗi ngẫu nhiên dùng để ghép vào session token sau khi đăng nhập thành công (`ID + token(20) + role`). Đảm bảo tính bảo mật và không đoán được.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_TOKEN_01 | Token có đúng độ dài yêu cầu (trường hợp thông thường) | `length = 20` | Chuỗi có `length === 20` | Đây là độ dài thực tế dùng trong hệ thống |
| TC_TOKEN_02 | Token có đúng độ dài với giá trị nhỏ | `length = 5` | Chuỗi có `length === 5` | Kiểm tra vòng lặp ngắn |
| TC_TOKEN_03 | Token có đúng độ dài với giá trị lớn | `length = 100` | Chuỗi có `length === 100` | Kiểm tra vòng lặp dài |
| TC_TOKEN_04 | Token trả về chuỗi rỗng khi length = 0 | `length = 0` | `""` | Edge case: không tạo ký tự nào |
| TC_TOKEN_05 | Hai token liên tiếp khác nhau (tính ngẫu nhiên) | `length = 20`, gọi 2 lần | `token1 !== token2` | Bảo mật: token không được trùng lặp |
| TC_TOKEN_06 | Token chỉ chứa ký tự trong bộ ký tự `process.env.TOKEN` | `length = 50`, `TOKEN = "ABCabc123"` | Mỗi ký tự của kết quả thuộc `"ABCabc123"` | Kiểm tra charset hợp lệ |
| TC_TOKEN_07 | Token trả về kiểu string | `length = 10` | `typeof result === 'string'` | Kiểu dữ liệu phải là string để ghép chuỗi |
| TC_TOKEN_08 | Token length = 1 (biên dưới có nghĩa) | `length = 1` | Chuỗi có `length === 1` | Biên dưới |

---

## 2. normalizeRole(role)

> **Nghiệp vụ:** Chuẩn hóa role trước khi nhúng vào token. Token được parse ở frontend để xác định quyền truy cập. Nếu role có khoảng trắng (vd: `"Giáo viên"`, `"Ban quản lý"`) thì khi ghép vào token sẽ gây lỗi parse. Hàm xóa toàn bộ whitespace để token luôn liền mạch.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_ROLE_01 | Role "Giáo viên" được normalize đúng (role thực tế trong DB) | `"Giáo viên"` | `"Giáoviên"` | Role thực tế — giáo viên mượn thiết bị |
| TC_ROLE_02 | Role "Ban giám hiệu" được normalize đúng (role thực tế trong DB) | `"Ban giám hiệu"` | `"Bangiámhiệu"` | Role thực tế — ban giám hiệu phê duyệt |
| TC_ROLE_03 | Role "Ban quản lý" được normalize đúng (role thực tế trong DB) | `"Ban quản lý"` | `"Banquảnlý"` | Role thực tế — quản lý thiết bị |
| TC_ROLE_04 | Role "Admin" không có khoảng trắng giữ nguyên | `"Admin"` | `"Admin"` | Role admin không bị thay đổi |
| TC_ROLE_05 | Xóa khoảng trắng ở đầu chuỗi | `"  Giáo viên"` | `"Giáoviên"` | Leading spaces từ dữ liệu nhập không chuẩn |
| TC_ROLE_06 | Xóa khoảng trắng ở cuối chuỗi | `"Giáo viên  "` | `"Giáoviên"` | Trailing spaces |
| TC_ROLE_07 | Xóa khoảng trắng ở cả đầu, giữa và cuối | `"  Ban quản lý  "` | `"Banquảnlý"` | Dữ liệu nhập có nhiều khoảng trắng |
| TC_ROLE_08 | Xóa nhiều khoảng trắng liên tiếp giữa các từ | `"Ban   quản   lý"` | `"Banquảnlý"` | Multiple consecutive spaces |
| TC_ROLE_09 | Xóa tab character trong role | `"Giáo\tviên"` | `"Giáoviên"` | Tab cũng là whitespace |
| TC_ROLE_10 | Xóa newline character trong role | `"Giáo\nviên"` | `"Giáoviên"` | Newline từ dữ liệu không chuẩn |
| TC_ROLE_11 | Trả về chuỗi rỗng khi input toàn khoảng trắng | `"   "` | `""` | Edge case: role không hợp lệ |
| TC_ROLE_12 | Trả về chuỗi rỗng khi input rỗng | `""` | `""` | Edge case: role rỗng |
| TC_ROLE_13 | Không thay đổi chuỗi không có khoảng trắng | `"Admin"` | `"Admin"` | Chuỗi đã chuẩn không bị biến đổi |
| TC_ROLE_14 | Kết quả normalize được nhúng đúng vào token | `role = "Giáo viên"`, `ID = 1`, `token(20)` trả về `"AAAAAAAAAAAAAAAAAAAA"` | Token kết thúc bằng `"Giáoviên"` | Kiểm tra tích hợp với findUserNameAndPassword |

---

## 3. findAllUser()

> **Nghiệp vụ:** Admin xem danh sách toàn bộ người dùng trong hệ thống để quản lý (thêm/sửa/xóa). Hệ thống có 3 role chính: Giáo viên, Ban giám hiệu, Ban quản lý. Danh sách phải trả về tất cả user bất kể role hay trạng thái.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_FINDALL_01 | Lấy danh sách khi hệ thống có nhiều user với các role khác nhau | DAO trả về `[{ID:1, USER_Role:'Giáo viên', USER_Status:'Active'}, {ID:2, USER_Role:'Ban quản lý', USER_Status:'Active'}, {ID:3, USER_Role:'Ban giám hiệu', USER_Status:'Active'}]` | Mảng 3 phần tử đúng như DAO trả về | Happy path: hệ thống có đủ các role |
| TC_FINDALL_02 | Lấy danh sách bao gồm cả user Active và Inactive | DAO trả về `[{ID:1, USER_Status:'Active'}, {ID:2, USER_Status:'Inactive'}]` | Cả 2 user đều có trong kết quả | Không lọc theo status — trả về tất cả |
| TC_FINDALL_03 | Lấy danh sách khi hệ thống chỉ có 1 user | DAO trả về `[{ID:1, USER_UserName:'admin', USER_Role:'Admin'}]` | Mảng 1 phần tử | Hệ thống mới khởi tạo |
| TC_FINDALL_04 | Trả về mảng rỗng khi chưa có user nào trong hệ thống | DAO trả về `[]` | `[]` | Hệ thống chưa có dữ liệu |
| TC_FINDALL_05 | Trả về đúng cấu trúc dữ liệu user (đủ các field) | DAO trả về `[{ID:1, USER_FullName:'Nguyễn Văn Tuấn', USER_Email:'a@gmail.com', USER_PhoneNumber:'0901234567', USER_UserName:'nguyenvantuan', USER_Role:'Giáo viên', USER_Status:'Active'}]` | Object có đủ 7 field | Kiểm tra data integrity |
| TC_FINDALL_06 | Không gọi DAO với bất kỳ tham số nào | DAO mock trả về `[]` | `Dao.findAll` được gọi đúng 1 lần, không có argument | findAll không cần filter |
| TC_FINDALL_07 | Trả về error object khi DB mất kết nối (không throw ra ngoài) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object (service bắt lỗi bằng try/catch) | Hệ thống không crash khi DB lỗi |
| TC_FINDALL_08 | Trả về error object khi DB timeout | DAO reject với `new Error('Query timeout')` | Trả về error object | Xử lý timeout gracefully |

---

## 4. findOneUser()

> **Nghiệp vụ:** Xem chi tiết thông tin 1 user theo ID. Dùng khi admin muốn xem/sửa thông tin cụ thể của một người dùng. ID lấy từ `req.params.id` (luôn là string từ URL).

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_FINDONE_01 | Tìm thấy user Giáo viên đang Active | `req.params.id = "1"`, DAO trả về `{ID:1, USER_FullName:'Nguyễn Văn Tuấn', USER_Role:'Giáo viên', USER_Status:'Active'}` | Object user đầy đủ thông tin | Happy path: user tồn tại và Active |
| TC_FINDONE_02 | Tìm thấy user đang Inactive (tài khoản bị khóa) | `req.params.id = "2"`, DAO trả về `{ID:2, USER_UserName:'ledinhhung', USER_Status:'Inactive'}` | Object user với `USER_Status:'Inactive'` | User bị khóa vẫn tìm được — admin cần xem |
| TC_FINDONE_03 | Không tìm thấy user với ID không tồn tại trong DB | `req.params.id = "9999"`, DAO trả về `undefined` | `undefined` | ID không tồn tại |
| TC_FINDONE_04 | Truyền đúng ID xuống DAO (ID là string từ req.params) | `req.params.id = "5"` | `Dao.findOneUser` được gọi với argument `"5"` | req.params luôn là string |
| TC_FINDONE_05 | Tìm user với ID = "1" (ID nhỏ nhất) | `req.params.id = "1"`, DAO trả về user hợp lệ | User được trả về | Biên dưới của ID |
| TC_FINDONE_06 | Trả về đúng user theo ID, không trả về user khác | `req.params.id = "2"`, DAO trả về `{ID:2, USER_UserName:'ledinhhung'}` | `result.ID === 2` và `result.USER_UserName === 'ledinhhung'` | Đúng user, không nhầm lẫn |
| TC_FINDONE_07 | Trả về error object khi DB lỗi (không throw) | `req.params.id = "1"`, DAO reject với `new Error('DB error')` | Trả về error object | try/catch bắt lỗi |
| TC_FINDONE_08 | Gọi Dao.findOneUser đúng 1 lần | `req.params.id = "3"`, DAO trả về user | `Dao.findOneUser` được gọi đúng 1 lần | Không gọi thừa |

---

## 5. findUserNameAndPassword()

> **Nghiệp vụ:** Đăng nhập vào hệ thống. Chỉ user có `USER_Status = 'Active'` mới được đăng nhập (DAO lọc theo status). Khi thành công, trả về token có cấu trúc `ID + random(20) + normalizeRole(role)`. Frontend parse token này để xác định quyền: Giáo viên (mượn thiết bị), Ban quản lý (quản lý thiết bị), Ban giám hiệu (phê duyệt yêu cầu), Admin (quản lý user).

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_LOGIN_01 | Đăng nhập thành công với tài khoản Giáo viên Active | `req.body = {userName:'nguyenvantuan', password:'123456'}`, DAO trả về `{ID:1, USER_Role:'Giáo viên', USER_Status:'Active'}` | `{token: '1' + <20chars> + 'Giáoviên'}` | Happy path: role có khoảng trắng được normalize |
| TC_LOGIN_02 | Đăng nhập thành công với tài khoản Ban quản lý Active | `req.body = {userName:'luongvanluyen', password:'123456'}`, DAO trả về `{ID:3, USER_Role:'Ban quản lý', USER_Status:'Active'}` | `{token: '3' + <20chars> + 'Banquảnlý'}` | Role "Ban quản lý" normalize thành "Banquảnlý" |
| TC_LOGIN_03 | Đăng nhập thành công với tài khoản Ban giám hiệu Active | `req.body = {userName:'ledinhhung', password:'123456'}`, DAO trả về `{ID:2, USER_Role:'Ban giám hiệu', USER_Status:'Active'}` | `{token: '2' + <20chars> + 'Bangiámhiệu'}` | Role "Ban giám hiệu" normalize thành "Bangiámhiệu" |
| TC_LOGIN_04 | Token bắt đầu bằng đúng ID của user | `req.body = {userName:'nguyenvantuan', password:'123456'}`, DAO trả về `{ID:5, USER_Role:'Admin'}` | `result.token` bắt đầu bằng `'5'` | Frontend dùng ID để gọi API lấy thông tin user |
| TC_LOGIN_05 | Phần random giữa token có đúng 20 ký tự | `process.env.TOKEN = 'ABC'`, DAO trả về `{ID:1, USER_Role:'Admin'}` | Phần giữa token (bỏ ID đầu và role cuối) có length = 20 | Đảm bảo độ dài token đủ bảo mật |
| TC_LOGIN_06 | Token kết thúc bằng role đã được normalize | `DAO trả về {ID:1, USER_Role:'Giáo viên'}` | `result.token` kết thúc bằng `'Giáoviên'` | Frontend parse role từ cuối token |
| TC_LOGIN_07 | Truyền đúng tham số xuống DAO (table, userName, password) | `req.body = {userName:'testuser', password:'testpass'}` | `Dao.findUserNameAndPassword` được gọi với `{table:'datn.USER', userName:'testuser', password:'testpass'}` | Đúng table name và credentials |
| TC_LOGIN_08 | Đăng nhập thất bại khi sai password (DAO trả về undefined) | `req.body = {userName:'nguyenvantuan', password:'wrongpass'}`, DAO trả về `undefined` | Trả về error object (TypeError: Cannot read properties of undefined) | DAO trả về undefined khi không khớp |
| TC_LOGIN_09 | Đăng nhập thất bại khi username không tồn tại | `req.body = {userName:'khongtontai', password:'123456'}`, DAO trả về `undefined` | Trả về error object | Username không có trong DB |
| TC_LOGIN_10 | Đăng nhập thất bại khi tài khoản bị khóa (Inactive) | `req.body = {userName:'lockeduser', password:'123456'}`, DAO trả về `undefined` (vì SQL lọc `USER_Status = 'Active'`) | Trả về error object | User Inactive không được đăng nhập |
| TC_LOGIN_11 | Đăng nhập thất bại khi cả username và password đều sai | `req.body = {userName:'wrong', password:'wrong'}`, DAO trả về `undefined` | Trả về error object | Sai hoàn toàn credentials |
| TC_LOGIN_12 | Trả về object có đúng key `token` | DAO trả về `{ID:1, USER_Role:'Admin'}` | `result` có property `token` | Cấu trúc response đúng để frontend xử lý |
| TC_LOGIN_13 | Token là kiểu string (để lưu vào sessionStorage) | DAO trả về `{ID:1, USER_Role:'Admin'}` | `typeof result.token === 'string'` | Frontend lưu token vào sessionStorage |
| TC_LOGIN_14 | Trả về error object khi DB lỗi (không throw ra ngoài) | DAO reject với `new Error('DB connection failed')` | Trả về error object | try/catch bắt lỗi DB |
| TC_LOGIN_15 | Token của 2 lần đăng nhập cùng user khác nhau (phần random) | DAO trả về `{ID:1, USER_Role:'Admin'}`, gọi 2 lần | `token1 !== token2` | Mỗi lần đăng nhập tạo token mới |

---

## 6. createUser()

> **Nghiệp vụ:** Admin tạo tài khoản mới cho người dùng trong hệ thống. Mỗi user phải có username và email duy nhất. Role phải là một trong 4 giá trị hợp lệ: `Giáo viên`, `Ban giám hiệu`, `Ban quản lý`, `Admin`. Status mặc định là `Active`. DAO kiểm tra trùng lặp trước khi INSERT.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_CREATE_01 | Tạo tài khoản Giáo viên mới thành công | `req.body = {USER_FullName:'Trần Thị B', USER_Email:'b@gmail.com', USER_PhoneNumber:'0909999999', USER_UserName:'tranthib', USER_Password:'123456', USER_Role:'Giáo viên', USER_Status:'Active'}`, DAO trả về `{id:4}` | `{id:4}` | Happy path: tạo giáo viên mới |
| TC_CREATE_02 | Tạo tài khoản Ban quản lý mới thành công | `req.body = {..., USER_Role:'Ban quản lý', USER_Status:'Active'}`, DAO trả về `{id:5}` | `{id:5}` | Tạo user với role quản lý |
| TC_CREATE_03 | Tạo tài khoản Ban giám hiệu mới thành công | `req.body = {..., USER_Role:'Ban giám hiệu', USER_Status:'Active'}`, DAO trả về `{id:6}` | `{id:6}` | Tạo user với role ban giám hiệu |
| TC_CREATE_04 | Tạo tài khoản với USER_Status mặc định Active khi không truyền | `req.body = {USER_FullName:'Test', USER_Email:'t@t.com', USER_UserName:'test', USER_Password:'pass', USER_Role:'Giáo viên'}` (không có USER_Status), DAO trả về `{id:7}` | `{id:7}` | DAO xử lý `USER_Status || 'Active'` |
| TC_CREATE_05 | Tạo tài khoản với USER_Status = 'Inactive' (tạo tài khoản bị khóa ngay) | `req.body = {..., USER_Status:'Inactive'}`, DAO trả về `{id:8}` | `{id:8}` | Admin có thể tạo tài khoản Inactive |
| TC_CREATE_06 | Thất bại khi username đã tồn tại trong hệ thống | `req.body = {USER_UserName:'nguyenvantuan', ...}`, DAO reject với `{message:'Username hoặc Email đã tồn tại'}` | Trả về `{message:'Username hoặc Email đã tồn tại'}` | Không cho phép trùng username |
| TC_CREATE_07 | Thất bại khi email đã tồn tại trong hệ thống | `req.body = {USER_Email:'guyenvantuan22@gmail.com', ...}`, DAO reject với `{message:'Username hoặc Email đã tồn tại'}` | Trả về `{message:'Username hoặc Email đã tồn tại'}` | Không cho phép trùng email |
| TC_CREATE_08 | Thất bại khi cả username và email đều đã tồn tại | `req.body = {USER_UserName:'nguyenvantuan', USER_Email:'guyenvantuan22@gmail.com', ...}`, DAO reject với `{message:'Username hoặc Email đã tồn tại'}` | Trả về error object | Trùng cả 2 field |
| TC_CREATE_09 | Truyền đúng toàn bộ req.body xuống DAO | `req.body = {USER_FullName:'A', USER_Email:'a@a.com', USER_PhoneNumber:'0900000000', USER_UserName:'usera', USER_Password:'pass', USER_Role:'Giáo viên', USER_Status:'Active'}` | `Dao.createUser` được gọi với đúng object req.body | Không biến đổi dữ liệu trước khi gọi DAO |
| TC_CREATE_10 | Trả về insertId từ DAO sau khi tạo thành công | DAO trả về `{id:99}` | `result.id === 99` | ID mới được tạo trong DB |
| TC_CREATE_11 | Gọi Dao.createUser đúng 1 lần | DAO trả về `{id:1}` | `Dao.createUser` được gọi đúng 1 lần | Không gọi thừa |
| TC_CREATE_12 | Trả về error object khi DB lỗi (không throw) | DAO reject với `new Error('DB connection failed')` | Trả về error object | try/catch bắt lỗi |

---

## 7. updateUser()

> **Nghiệp vụ:** Admin cập nhật thông tin người dùng: đổi role, đổi password, khóa/mở tài khoản (đổi status). Đây là thao tác quan trọng — đổi role ảnh hưởng đến quyền truy cập của user trong toàn hệ thống. Đổi status sang Inactive sẽ ngăn user đăng nhập.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_UPDATE_01 | Cập nhật thông tin cơ bản của user thành công | `req.body = {ID:1, USER_FullName:'Nguyễn Văn Tuấn (Updated)', USER_Email:'new@gmail.com', USER_PhoneNumber:'0901111111', USER_UserName:'nguyenvantuan', USER_Password:'newpass', USER_Role:'Giáo viên', USER_Status:'Active'}`, DAO trả về `{message:'Cập nhật thành công', affectedRows:1}` | `{message:'Cập nhật thành công', affectedRows:1}` | Happy path |
| TC_UPDATE_02 | Nâng cấp role từ Giáo viên lên Ban quản lý | `req.body = {ID:1, USER_Role:'Ban quản lý', ...}`, DAO trả về `{message:'Cập nhật thành công', affectedRows:1}` | `{message:'Cập nhật thành công', affectedRows:1}` | Thay đổi quyền truy cập của user |
| TC_UPDATE_03 | Hạ cấp role từ Ban quản lý xuống Giáo viên | `req.body = {ID:3, USER_Role:'Giáo viên', ...}`, DAO trả về `{message:'Cập nhật thành công', affectedRows:1}` | `{message:'Cập nhật thành công', affectedRows:1}` | Thu hồi quyền quản lý |
| TC_UPDATE_04 | Khóa tài khoản user (Active → Inactive) | `req.body = {ID:1, USER_Status:'Inactive', ...}`, DAO trả về `{message:'Cập nhật thành công', affectedRows:1}` | `{message:'Cập nhật thành công', affectedRows:1}` | User bị khóa sẽ không đăng nhập được |
| TC_UPDATE_05 | Mở khóa tài khoản user (Inactive → Active) | `req.body = {ID:1, USER_Status:'Active', ...}`, DAO trả về `{message:'Cập nhật thành công', affectedRows:1}` | `{message:'Cập nhật thành công', affectedRows:1}` | Khôi phục quyền đăng nhập |
| TC_UPDATE_06 | Đổi password của user | `req.body = {ID:1, USER_Password:'newpassword123', USER_Role:'Giáo viên', USER_Status:'Active', ...}`, DAO trả về `{message:'Cập nhật thành công', affectedRows:1}` | `{message:'Cập nhật thành công', affectedRows:1}` | Reset password |
| TC_UPDATE_07 | Cập nhật số điện thoại của user | `req.body = {ID:1, USER_PhoneNumber:'0999888777', ...}`, DAO trả về `{message:'Cập nhật thành công', affectedRows:1}` | `{message:'Cập nhật thành công', affectedRows:1}` | Cập nhật thông tin liên hệ |
| TC_UPDATE_08 | Trả về affectedRows = 0 khi ID không tồn tại trong DB | `req.body = {ID:9999, ...}`, DAO trả về `{message:'Cập nhật thành công', affectedRows:0}` | `result.affectedRows === 0` | Không có bản ghi nào bị cập nhật |
| TC_UPDATE_09 | Truyền đúng toàn bộ req.body xuống DAO | `req.body = {ID:1, USER_FullName:'A', USER_Email:'a@a.com', USER_PhoneNumber:'0900000000', USER_UserName:'a', USER_Password:'pass', USER_Role:'Admin', USER_Status:'Active'}` | `Dao.updateUser` được gọi với đúng object req.body | Không biến đổi dữ liệu |
| TC_UPDATE_10 | Gọi Dao.updateUser đúng 1 lần | DAO trả về `{message:'Cập nhật thành công', affectedRows:1}` | `Dao.updateUser` được gọi đúng 1 lần | Không gọi thừa |
| TC_UPDATE_11 | Trả về error object khi DB lỗi (không throw) | DAO reject với `new Error('DB error')` | Trả về error object | try/catch bắt lỗi |

---

## 8. deleteUserById()

> **Nghiệp vụ:** Admin xóa vĩnh viễn tài khoản người dùng khỏi hệ thống. Thao tác này không thể hoàn tác. Cần lưu ý: nếu user đang có phiếu mượn thiết bị chưa trả, việc xóa có thể gây lỗi ràng buộc khóa ngoại ở tầng DB (xử lý ở DAO). ID lấy từ `req.params.id` (luôn là string từ URL).

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_DELETE_01 | Xóa thành công user Giáo viên không có ràng buộc | `req.params.id = "1"`, DAO trả về `{message:'Xóa người dùng thành công', affectedRows:1}` | `{message:'Xóa người dùng thành công', affectedRows:1}` | Happy path: user không có dữ liệu liên quan |
| TC_DELETE_02 | Xóa thành công user Ban quản lý | `req.params.id = "3"`, DAO trả về `{message:'Xóa người dùng thành công', affectedRows:1}` | `{message:'Xóa người dùng thành công', affectedRows:1}` | Xóa user có role quản lý |
| TC_DELETE_03 | Trả về affectedRows = 0 khi ID không tồn tại trong DB | `req.params.id = "9999"`, DAO trả về `{message:'Xóa người dùng thành công', affectedRows:0}` | `result.affectedRows === 0` | Không có bản ghi nào bị xóa |
| TC_DELETE_04 | Truyền đúng ID xuống DAO (ID là string từ req.params) | `req.params.id = "5"` | `Dao.deleteUserById` được gọi với argument `"5"` | req.params luôn là string |
| TC_DELETE_05 | Trả về error object khi user có ràng buộc khóa ngoại (đang có phiếu mượn) | `req.params.id = "1"`, DAO reject với `new Error('ER_ROW_IS_REFERENCED_2: Cannot delete or update a parent row')` | Trả về error object | User đang có phiếu mượn thiết bị chưa trả |
| TC_DELETE_06 | Trả về error object khi DB lỗi (không throw) | `req.params.id = "1"`, DAO reject với `new Error('DB connection failed')` | Trả về error object | try/catch bắt lỗi |
| TC_DELETE_07 | Trả về đúng message sau khi xóa thành công | `req.params.id = "2"`, DAO trả về `{message:'Xóa người dùng thành công', affectedRows:1}` | `result.message === 'Xóa người dùng thành công'` | Kiểm tra message response |
| TC_DELETE_08 | Gọi Dao.deleteUserById đúng 1 lần | `req.params.id = "2"`, DAO trả về `{message:'Xóa người dùng thành công', affectedRows:1}` | `Dao.deleteUserById` được gọi đúng 1 lần | Không gọi thừa |
| TC_DELETE_09 | Xóa user với ID = "1" (ID nhỏ nhất) | `req.params.id = "1"`, DAO trả về `{message:'Xóa người dùng thành công', affectedRows:1}` | `{message:'Xóa người dùng thành công', affectedRows:1}` | Biên dưới của ID |

---

## Tổng kết

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---|---|---|
| `token(length)` | 8 | CAO | Bảo mật session token |
| `normalizeRole(role)` | 14 | CAO | Parse role từ token ở frontend |
| `findAllUser()` | 8 | TRUNG BÌNH | Admin quản lý danh sách user |
| `findOneUser()` | 8 | TRUNG BÌNH | Admin xem chi tiết user |
| `findUserNameAndPassword()` | 15 | CAO | Đăng nhập — kiểm soát truy cập hệ thống |
| `createUser()` | 12 | CAO | Admin tạo tài khoản mới |
| `updateUser()` | 11 | CAO | Admin đổi role/status/password |
| `deleteUserById()` | 9 | CAO | Admin xóa tài khoản |
| **TỔNG** | **85** | | |

---

## Setup mẫu cho Jest

```javascript
// backend/src/__tests__/service/user.service.test.js
const UserService = require('../../module/user/user.service')
const Dao = require('../../module/user/user.dao')

jest.mock('../../module/user/user.dao')
jest.mock('dotenv', () => ({ config: jest.fn() }))

beforeEach(() => {
  process.env.TOKEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  jest.clearAllMocks()
})
```

> **Lưu ý nghiệp vụ quan trọng:**
> - Role thực tế trong DB: `'Giáo viên'`, `'Ban giám hiệu'`, `'Ban quản lý'`, `'Admin'`
> - Status hợp lệ: `'Active'` (đăng nhập được), `'Inactive'` (bị khóa)
> - Token format: `{ID}{random20chars}{normalizedRole}` — frontend parse để xác định quyền
> - DAO lọc `USER_Status = 'Active'` trong `findUserNameAndPassword` — user Inactive không đăng nhập được

---

## 1.5. Execution Report — user.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/user.service.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | _(điền sau khi chạy)_ |
| Tests failed | _(điền sau khi chạy)_ |
| Thời gian chạy | _(điền sau khi chạy)_ |

### Chi tiết pass/fail theo nhóm

| Nhóm hàm | Số TC | Passed | Failed |
|---|---|---|---|
| `token(length)` | 8 | | |
| `normalizeRole(role)` | 14 | | |
| `findAllUser()` | 8 | | |
| `findOneUser()` | 8 | | |
| `findUserNameAndPassword()` | 15 | | |
| `createUser()` | 12 | | |
| `updateUser()` | 11 | | |
| `deleteUserById()` | 9 | | |
| **TỔNG** | **85** | | |

### Screenshot — Terminal output

> 📸 **[SCREENSHOT 1]** Chụp toàn bộ terminal từ dòng `PASS src/__tests__/...` đến dòng `Tests: X passed, X total`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — user.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/user.service.test.js --coverage --verbose
> ```
> **HTML report:** `backend/coverage/index.html`

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---|---|---|---|
| `user.service.js` | _(điền)_ | _(điền)_ | _(điền)_ | _(điền)_ |

### Mục tiêu coverage

| Chỉ số | Mục tiêu | Thực tế | Đạt? |
|---|---|---|---|
| Statements | ≥ 80% | | |
| Branches | ≥ 80% | | |
| Functions | ≥ 80% | | |
| Lines | ≥ 80% | | |

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[SCREENSHOT 2]** Chụp bảng `File | % Stmts | % Branch | % Funcs | % Lines` trong terminal

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT 3]** Mở `backend/coverage/index.html` bằng browser → chụp trang tổng quan

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết user.service.js)

> 📸 **[SCREENSHOT 4]** Click vào `user.service.js` trong trang HTML → chụp chi tiết từng dòng (xanh = covered, đỏ = not covered)

_(Dán ảnh vào đây)_

---

# UNIT TEST DETAIL - equipment.service.js

> **File:** `backend/src/module/equipment/equipment.service.js`
> **Framework:** Jest | **Mock:** `jest.mock('./equipment.dao')`
> **Nghiệp vụ hệ thống:** Quản lý thiết bị và phòng học. Hệ thống có 2 loại đối tượng: **Thiết bị** (EQUIPMENT_ITEM — máy chiếu, laptop, loa...) và **Phòng** (ROOM — phòng học, phòng lab, phòng họp). Xóa là **soft delete** (đặt status = `'inactive'`), không xóa vật lý. Tạo/cập nhật thiết bị dùng **transaction** 3 bảng (EQUIPMENT_TYPE → EQUIPMENT_MODEL → EQUIPMENT_ITEM). Tạo/cập nhật phòng dùng **transaction** 2 bảng (ROOM_TYPE → ROOM).

---

## 1. findAllEquipment()

> **Nghiệp vụ:** Lấy danh sách toàn bộ thiết bị đang hoạt động (status != `'inactive'`) để hiển thị cho người dùng mượn. Kết quả JOIN 3 bảng: EQUIPMENT_ITEM + EQUIPMENT_MODEL + EQUIPMENT_TYPE. Thiết bị đã bị soft delete (inactive) **không được hiển thị**.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_FINDALL_01 | Lấy danh sách thiết bị khi có nhiều thiết bị đang hoạt động | DAO trả về `[{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_TYPE_Name:'Projector'}, {ID:2, EQUIPMENT_ITEM_Name:'DL15-001', EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_TYPE_Name:'Laptop'}]` | Mảng 2 phần tử đúng như DAO trả về | Happy path: có nhiều thiết bị |
| TC_EQ_FINDALL_02 | Danh sách không chứa thiết bị đã bị soft delete (inactive) | DAO trả về `[{ID:1, EQUIPMENT_ITEM_Status:'Có sẵn'}]` (DAO đã lọc inactive) | Chỉ trả về thiết bị active | DAO lọc `WHERE EQUIPMENT_ITEM_Status != 'inactive'` |
| TC_EQ_FINDALL_03 | Trả về mảng rỗng khi tất cả thiết bị đều inactive | DAO trả về `[]` | `[]` | Tất cả thiết bị đã bị xóa mềm |
| TC_EQ_FINDALL_04 | Trả về mảng rỗng khi chưa có thiết bị nào trong hệ thống | DAO trả về `[]` | `[]` | Hệ thống mới, chưa nhập thiết bị |
| TC_EQ_FINDALL_05 | Trả về đúng cấu trúc dữ liệu JOIN 3 bảng | DAO trả về `[{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_PurchaseDate:'2024-01-10', EQUIPMENT_ITEM_Price:12000000, EQUIPMENT_ITEM_Quantity:1, EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_MODEL_ID:1, EQUIPMENT_MODEL_Name:'Epson X200', EQUIPMENT_MODEL_Branch:'Epson', EQUIPMENT_TYPE_ID:1, EQUIPMENT_TYPE_Name:'Projector'}]` | Object có đủ field từ 3 bảng | Kiểm tra data integrity sau JOIN |
| TC_EQ_FINDALL_06 | Trả về thiết bị với nhiều loại khác nhau (Projector, Laptop, Speaker) | DAO trả về 3 thiết bị với 3 EQUIPMENT_TYPE_Name khác nhau | Mảng 3 phần tử, mỗi phần tử có EQUIPMENT_TYPE_Name khác nhau | Hệ thống có nhiều loại thiết bị |
| TC_EQ_FINDALL_07 | Gọi Dao.findAll đúng 1 lần, không truyền tham số | DAO mock trả về `[]` | `Dao.findAll` được gọi đúng 1 lần | Không cần filter ở service layer |
| TC_EQ_FINDALL_08 | Trả về error object khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi, hệ thống không crash |
| TC_EQ_FINDALL_09 | Trả về error object khi DB timeout | DAO reject với `new Error('Query timeout')` | Trả về error object | Xử lý timeout gracefully |

---

## 2. findOneEquipment()

> **Nghiệp vụ:** Xem chi tiết 1 thiết bị hoặc 1 phòng để hiển thị form chỉnh sửa. ID có định dạng đặc biệt: `"{id}|{type}"` — ví dụ `"1|equipment"` hoặc `"2|room"`. DAO parse chuỗi này để biết query bảng nào. Thiết bị/phòng đã inactive **không được trả về**.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_FINDONE_01 | Tìm thấy thiết bị theo ID hợp lệ (type=equipment) | `req.params.id = "1\|equipment"`, DAO trả về `{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_TYPE_NAME:'Projector'}` | Object thiết bị đầy đủ thông tin | Happy path: thiết bị tồn tại và active |
| TC_EQ_FINDONE_02 | Tìm thấy phòng theo ID hợp lệ (type=room) | `req.params.id = "1\|room"`, DAO trả về `{ID:1, ROOM_Name:'A101', ROOM_Status:'Có sẵn', ROOM_TYPE_Name:'Classroom'}` | Object phòng đầy đủ thông tin | Happy path: phòng tồn tại và active |
| TC_EQ_FINDONE_03 | Trả về undefined khi thiết bị đã bị soft delete (inactive) | `req.params.id = "5\|equipment"`, DAO trả về `undefined` (DAO lọc `status != 'inactive'`) | `undefined` | Thiết bị đã xóa mềm không hiển thị |
| TC_EQ_FINDONE_04 | Trả về undefined khi phòng đã bị soft delete (inactive) | `req.params.id = "2\|room"`, DAO trả về `undefined` | `undefined` | Phòng đã xóa mềm không hiển thị |
| TC_EQ_FINDONE_05 | Trả về undefined khi ID thiết bị không tồn tại trong DB | `req.params.id = "9999\|equipment"`, DAO trả về `undefined` | `undefined` | ID không tồn tại |
| TC_EQ_FINDONE_06 | Trả về undefined khi ID phòng không tồn tại trong DB | `req.params.id = "9999\|room"`, DAO trả về `undefined` | `undefined` | ID không tồn tại |
| TC_EQ_FINDONE_07 | Truyền đúng object `{id}` xuống DAO | `req.params.id = "3\|equipment"` | `Dao.findOne` được gọi với `{id: "3\|equipment"}` | Kiểm tra argument truyền xuống DAO |
| TC_EQ_FINDONE_08 | Trả về đúng cấu trúc JOIN 3 bảng cho thiết bị | DAO trả về `{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_MODEL_NAME:'Epson X200', EQUIPMENT_MODEL_Branch:'Epson', EQUIPMENT_TYPE_NAME:'Projector', EQUIPMENT_TYPE_Description:'Máy chiếu phục vụ giảng dạy'}` | Object có đủ field từ 3 bảng | Kiểm tra data integrity |
| TC_EQ_FINDONE_09 | Trả về đúng cấu trúc JOIN 2 bảng cho phòng | DAO trả về `{ID:1, ROOM_Name:'A101', ROOM_Capacity:40, ROOM_Status:'Có sẵn', LOCATION_Building:'A', LOCATION_Floor:1, ROOM_TYPE_Name:'Classroom'}` | Object có đủ field từ 2 bảng | Kiểm tra data integrity |
| TC_EQ_FINDONE_10 | Trả về error object khi DB lỗi (không throw) | DAO reject với `new Error('DB error')` | Trả về error object | try/catch bắt lỗi |
| TC_EQ_FINDONE_11 | Trả về error khi type không hợp lệ | `req.params.id = "1\|invalid"`, DAO reject với `new Error('Type không hợp lệ')` | Trả về error object | Type phải là 'equipment' hoặc 'room' |

---

## 3. findAllRoom()

> **Nghiệp vụ:** Lấy danh sách toàn bộ phòng đang hoạt động (status != `'inactive'`) để hiển thị khi tạo phiếu mượn thiết bị. Giáo viên chọn phòng khi mượn thiết bị. Kết quả JOIN 2 bảng: ROOM + ROOM_TYPE. Phòng đã bị soft delete **không được hiển thị**. Hệ thống có 3 loại phòng: Classroom, Lab, Conference.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_ROOM_FINDALL_01 | Lấy danh sách phòng khi có nhiều phòng đang hoạt động | DAO trả về `[{ID:1, ROOM_Name:'A101', ROOM_Status:'Có sẵn', ROOM_TYPE_Name:'Classroom'}, {ID:2, ROOM_Name:'B201', ROOM_Status:'Có sẵn', ROOM_TYPE_Name:'Lab'}, {ID:3, ROOM_Name:'C01', ROOM_Status:'Có sẵn', ROOM_TYPE_Name:'Conference'}]` | Mảng 3 phần tử | Happy path: có đủ 3 loại phòng |
| TC_ROOM_FINDALL_02 | Danh sách không chứa phòng đã bị soft delete (inactive) | DAO trả về `[{ID:1, ROOM_Name:'A101', ROOM_Status:'Có sẵn'}]` (DAO đã lọc inactive) | Chỉ trả về phòng active | DAO lọc `WHERE ROOM_Status != 'inactive'` |
| TC_ROOM_FINDALL_03 | Trả về mảng rỗng khi tất cả phòng đều inactive | DAO trả về `[]` | `[]` | Tất cả phòng đã bị xóa mềm |
| TC_ROOM_FINDALL_04 | Trả về mảng rỗng khi chưa có phòng nào trong hệ thống | DAO trả về `[]` | `[]` | Hệ thống mới, chưa nhập phòng |
| TC_ROOM_FINDALL_05 | Trả về đúng cấu trúc dữ liệu JOIN 2 bảng (ROOM + ROOM_TYPE) | DAO trả về `[{ID:1, ROOM_Name:'A101', ROOM_Capacity:40, ROOM_Description:'Phòng học lớn', ROOM_Status:'Có sẵn', LOCATION_Building:'A', LOCATION_Floor:1, ROOM_TYPE_Name:'Classroom', ROOM_TYPE_Description:'Phòng học tiêu chuẩn'}]` | Object có đủ field từ 2 bảng | Kiểm tra data integrity sau JOIN |
| TC_ROOM_FINDALL_06 | Trả về phòng với đầy đủ thông tin vị trí (tòa nhà, tầng) | DAO trả về `[{ROOM_Name:'A101', LOCATION_Building:'A', LOCATION_Floor:1}, {ROOM_Name:'B201', LOCATION_Building:'B', LOCATION_Floor:2}]` | Mỗi phòng có LOCATION_Building và LOCATION_Floor | Thông tin vị trí cần thiết khi mượn thiết bị |
| TC_ROOM_FINDALL_07 | Truyền đúng table name xuống DAO | `process.env.DATABASE = 'datn'`, DAO mock trả về `[]` | `Dao.findAllRoom` được gọi đúng 1 lần | Service gọi DAO không cần tham số (DAO dùng hardcode table) |
| TC_ROOM_FINDALL_08 | Trả về error object khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |
| TC_ROOM_FINDALL_09 | Trả về error object khi DB timeout | DAO reject với `new Error('Query timeout')` | Trả về error object | Xử lý timeout gracefully |

---

## 4. createEquipment()

> **Nghiệp vụ:** Ban quản lý thêm thiết bị mới hoặc phòng mới vào hệ thống. Hàm xử lý **2 loại dữ liệu** dựa trên field trong `req.body`:
> - Nếu có `EQUIPMENT_ITEM_Name` → tạo thiết bị: INSERT 3 bảng trong transaction (EQUIPMENT_TYPE → EQUIPMENT_MODEL → EQUIPMENT_ITEM)
> - Nếu có `ROOM_Name` → tạo phòng: INSERT 2 bảng trong transaction (ROOM_TYPE → ROOM)
> - Nếu không có cả 2 → reject "Unknown data type"
> `EQUIPMENT_ITEM_PurchaseDate` được convert sang định dạng MySQL datetime trước khi INSERT.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_CREATE_01 | Tạo thiết bị mới thành công (Projector) | `req.body = {EQUIPMENT_ITEM_Name:'EPX200-004', EQUIPMENT_ITEM_PurchaseDate:'2024-06-01', EQUIPMENT_ITEM_Price:12000000, EQUIPMENT_ITEM_Quantity:1, EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_ITEM_Description:'Máy chiếu mới', EQUIPMENT_MODEL_Name:'Epson X200', EQUIPMENT_MODEL_Branch:'Epson', EQUIPMENT_TYPE_Name:'Projector', EQUIPMENT_TYPE_Description:'Máy chiếu'}`, DAO trả về `{message:'Thêm thiết bị thành công'}` | `{message:'Thêm thiết bị thành công'}` | Happy path: tạo thiết bị mới |
| TC_EQ_CREATE_02 | Tạo thiết bị mới thành công (Laptop) | `req.body = {EQUIPMENT_ITEM_Name:'DL15-003', EQUIPMENT_TYPE_Name:'Laptop', EQUIPMENT_MODEL_Name:'Dell Inspiron 15', ...}`, DAO trả về `{message:'Thêm thiết bị thành công'}` | `{message:'Thêm thiết bị thành công'}` | Tạo thiết bị loại Laptop |
| TC_EQ_CREATE_03 | Tạo phòng mới thành công (Classroom) | `req.body = {ROOM_Name:'A102', ROOM_Capacity:40, ROOM_Description:'Phòng học mới', ROOM_Status:'Có sẵn', LOCATION_Building:'A', LOCATION_Floor:1, ROOM_TYPE_Name:'Classroom', ROOM_TYPE_Description:'Phòng học tiêu chuẩn'}`, DAO trả về `{message:'Thêm phòng thành công'}` | `{message:'Thêm phòng thành công'}` | Happy path: tạo phòng mới |
| TC_EQ_CREATE_04 | Tạo phòng Lab mới thành công | `req.body = {ROOM_Name:'B202', ROOM_TYPE_Name:'Lab', ...}`, DAO trả về `{message:'Thêm phòng thành công'}` | `{message:'Thêm phòng thành công'}` | Tạo phòng thực hành |
| TC_EQ_CREATE_05 | Tạo phòng họp mới thành công | `req.body = {ROOM_Name:'C02', ROOM_TYPE_Name:'Conference', ...}`, DAO trả về `{message:'Thêm phòng thành công'}` | `{message:'Thêm phòng thành công'}` | Tạo phòng họp |
| TC_EQ_CREATE_06 | Truyền đúng req.body xuống DAO | `req.body = {EQUIPMENT_ITEM_Name:'Test', ...}` | `Dao.createEquipment` được gọi với đúng `req.body` | Không biến đổi dữ liệu ở service layer |
| TC_EQ_CREATE_07 | Trả về error khi transaction thất bại ở bước INSERT EQUIPMENT_TYPE | DAO reject với `new Error('Duplicate entry for EQUIPMENT_TYPE')` | Trả về error object | Transaction rollback khi lỗi bước 1 |
| TC_EQ_CREATE_08 | Trả về error khi transaction thất bại ở bước INSERT EQUIPMENT_MODEL | DAO reject với `new Error('FK constraint failed on EQUIPMENT_MODEL')` | Trả về error object | Transaction rollback khi lỗi bước 2 |
| TC_EQ_CREATE_09 | Trả về error khi transaction thất bại ở bước INSERT EQUIPMENT_ITEM | DAO reject với `new Error('FK constraint failed on EQUIPMENT_ITEM')` | Trả về error object | Transaction rollback khi lỗi bước 3 |
| TC_EQ_CREATE_10 | Trả về error khi transaction thất bại ở bước INSERT ROOM_TYPE | DAO reject với `new Error('DB error on ROOM_TYPE')` | Trả về error object | Transaction rollback khi tạo phòng lỗi |
| TC_EQ_CREATE_11 | Trả về error khi data không có EQUIPMENT_ITEM_Name lẫn ROOM_Name | `req.body = {someOtherField:'value'}`, DAO reject với `"Unknown data type"` | Trả về error object `"Unknown data type"` | Dữ liệu không hợp lệ |
| TC_EQ_CREATE_12 | Gọi Dao.createEquipment đúng 1 lần | DAO trả về `{message:'Thêm thiết bị thành công'}` | `Dao.createEquipment` được gọi đúng 1 lần | Không gọi thừa |
| TC_EQ_CREATE_13 | Trả về error khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |

---

## 5. updateEquipment()

> **Nghiệp vụ:** Ban quản lý cập nhật thông tin thiết bị hoặc phòng. Hàm xử lý **2 loại dữ liệu** dựa trên field trong `req.body`:
> - Nếu có `EQUIPMENT_ITEM_Name` → cập nhật thiết bị: UPDATE 3 bảng trong transaction (EQUIPMENT_ITEM + EQUIPMENT_MODEL + EQUIPMENT_TYPE)
> - Nếu có `ROOM_Name` → cập nhật phòng: UPDATE 2 bảng trong transaction (ROOM + ROOM_TYPE)
> - Nếu không có cả 2 → rollback và reject "Unknown data type"
> `EQUIPMENT_ITEM_PurchaseDate` được convert sang định dạng MySQL datetime. Cập nhật status thiết bị ảnh hưởng đến khả năng mượn (chỉ thiết bị `'Có sẵn'` mới được mượn).

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_UPDATE_01 | Cập nhật thông tin thiết bị thành công | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'EPX200-001 (Updated)', EQUIPMENT_ITEM_PurchaseDate:'2024-01-10', EQUIPMENT_ITEM_Price:13000000, EQUIPMENT_ITEM_Quantity:1, EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_ITEM_Description:'Cập nhật mô tả', EQUIPMENT_MODEL_ID:1, EQUIPMENT_MODEL_Name:'Epson X200', EQUIPMENT_MODEL_Branch:'Epson', EQUIPMENT_TYPE_ID:1, EQUIPMENT_TYPE_Name:'Projector', EQUIPMENT_TYPE_Description:'Máy chiếu'}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Happy path: cập nhật thiết bị |
| TC_EQ_UPDATE_02 | Cập nhật thông tin phòng thành công | `req.body = {ID:1, ROOM_Name:'A101 (Updated)', ROOM_Capacity:45, ROOM_Description:'Phòng học lớn hơn', ROOM_Status:'Có sẵn', LOCATION_Building:'A', LOCATION_Floor:1, ROOM_TYPE_ID:1, ROOM_TYPE_Name:'Classroom', ROOM_TYPE_Description:'Phòng học tiêu chuẩn'}`, DAO trả về `{message:'Update room thành công'}` | `{message:'Update room thành công'}` | Happy path: cập nhật phòng |
| TC_EQ_UPDATE_03 | Cập nhật status thiết bị từ 'Có sẵn' sang 'Đang sử dụng' | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Status:'Đang sử dụng', ...}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Thiết bị đang được mượn |
| TC_EQ_UPDATE_04 | Cập nhật status thiết bị từ 'Đang sử dụng' về 'Có sẵn' (sau khi trả) | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Status:'Có sẵn', ...}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Thiết bị được trả lại |
| TC_EQ_UPDATE_05 | Cập nhật status thiết bị sang 'Hỏng' (thiết bị bị hư) | `req.body = {ID:2, EQUIPMENT_ITEM_Name:'DL15-001', EQUIPMENT_ITEM_Status:'Hỏng', ...}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Đánh dấu thiết bị hỏng |
| TC_EQ_UPDATE_06 | Cập nhật giá thiết bị (định giá lại) | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Price:15000000, ...}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Cập nhật giá trị tài sản |
| TC_EQ_UPDATE_07 | Cập nhật sức chứa phòng | `req.body = {ID:1, ROOM_Name:'A101', ROOM_Capacity:50, ...}`, DAO trả về `{message:'Update room thành công'}` | `{message:'Update room thành công'}` | Thay đổi sức chứa phòng |
| TC_EQ_UPDATE_08 | Cập nhật status phòng sang 'Đang sửa chữa' | `req.body = {ID:2, ROOM_Name:'B201', ROOM_Status:'Đang sửa chữa', ...}`, DAO trả về `{message:'Update room thành công'}` | `{message:'Update room thành công'}` | Phòng tạm thời không dùng được |
| TC_EQ_UPDATE_09 | Trả về error khi transaction UPDATE EQUIPMENT_ITEM thất bại | DAO reject với `new Error('DB error on EQUIPMENT_ITEM update')` | Trả về error object | Transaction rollback khi lỗi bước 1 |
| TC_EQ_UPDATE_10 | Trả về error khi transaction UPDATE EQUIPMENT_MODEL thất bại | DAO reject với `new Error('DB error on EQUIPMENT_MODEL update')` | Trả về error object | Transaction rollback khi lỗi bước 2 |
| TC_EQ_UPDATE_11 | Trả về error khi transaction UPDATE EQUIPMENT_TYPE thất bại | DAO reject với `new Error('DB error on EQUIPMENT_TYPE update')` | Trả về error object | Transaction rollback khi lỗi bước 3 |
| TC_EQ_UPDATE_12 | Trả về error khi data không có EQUIPMENT_ITEM_Name lẫn ROOM_Name | `req.body = {ID:1, someField:'value'}`, DAO reject với `"Unknown data type"` | Trả về error object `"Unknown data type"` | Dữ liệu không hợp lệ |
| TC_EQ_UPDATE_13 | Truyền đúng req.body xuống DAO | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'Test', ...}` | `Dao.updateEquipment` được gọi với đúng `req.body` | Không biến đổi dữ liệu ở service layer |
| TC_EQ_UPDATE_14 | Gọi Dao.updateEquipment đúng 1 lần | DAO trả về `{message:'Update equipment thành công'}` | `Dao.updateEquipment` được gọi đúng 1 lần | Không gọi thừa |
| TC_EQ_UPDATE_15 | Trả về error khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |

---

## 6. deleteEquipment()

> **Nghiệp vụ:** Ban quản lý xóa thiết bị hoặc phòng khỏi danh sách hiển thị. Đây là **soft delete** — không xóa vật lý khỏi DB mà chỉ đặt status = `'inactive'`. Thiết bị/phòng inactive sẽ không xuất hiện trong `findAllEquipment()` và `findAllRoom()`. Dữ liệu lịch sử mượn trả vẫn được giữ nguyên. `req.body` phải có `{id, type}` — type là `'equipment'` hoặc `'room'`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_DELETE_01 | Soft delete thiết bị thành công (type=equipment) | `req.body = {id:1, type:'equipment'}`, DAO trả về `{affectedRows:1}` | `{affectedRows:1}` | Happy path: thiết bị bị ẩn khỏi danh sách |
| TC_EQ_DELETE_02 | Soft delete phòng thành công (type=room) | `req.body = {id:1, type:'room'}`, DAO trả về `{affectedRows:1}` | `{affectedRows:1}` | Happy path: phòng bị ẩn khỏi danh sách |
| TC_EQ_DELETE_03 | Sau khi soft delete thiết bị, thiết bị không còn xuất hiện trong findAllEquipment | `req.body = {id:1, type:'equipment'}`, DAO deleteEquipment trả về `{affectedRows:1}`, DAO findAll trả về `[]` | `findAllEquipment` trả về mảng không chứa thiết bị ID=1 | Kiểm tra tính nhất quán nghiệp vụ |
| TC_EQ_DELETE_04 | Sau khi soft delete phòng, phòng không còn xuất hiện trong findAllRoom | `req.body = {id:1, type:'room'}`, DAO deleteEquipment trả về `{affectedRows:1}`, DAO findAllRoom trả về `[]` | `findAllRoom` trả về mảng không chứa phòng ID=1 | Kiểm tra tính nhất quán nghiệp vụ |
| TC_EQ_DELETE_05 | Trả về affectedRows = 0 khi ID thiết bị không tồn tại | `req.body = {id:9999, type:'equipment'}`, DAO trả về `{affectedRows:0}` | `result.affectedRows === 0` | Không có bản ghi nào bị cập nhật |
| TC_EQ_DELETE_06 | Trả về affectedRows = 0 khi ID phòng không tồn tại | `req.body = {id:9999, type:'room'}`, DAO trả về `{affectedRows:0}` | `result.affectedRows === 0` | Không có bản ghi nào bị cập nhật |
| TC_EQ_DELETE_07 | Trả về error khi type không hợp lệ | `req.body = {id:1, type:'invalid'}`, DAO reject với `new Error('Type không hợp lệ')` | Trả về error object | Type phải là 'equipment' hoặc 'room' |
| TC_EQ_DELETE_08 | Truyền đúng req.body xuống DAO | `req.body = {id:2, type:'equipment'}` | `Dao.deleteEquipment` được gọi với đúng `{id:2, type:'equipment'}` | Kiểm tra argument |
| TC_EQ_DELETE_09 | Gọi Dao.deleteEquipment đúng 1 lần | DAO trả về `{affectedRows:1}` | `Dao.deleteEquipment` được gọi đúng 1 lần | Không gọi thừa |
| TC_EQ_DELETE_10 | Trả về error khi DB lỗi (không throw) | DAO reject với `new Error('DB connection failed')` | Trả về error object | try/catch bắt lỗi |
| TC_EQ_DELETE_11 | Soft delete thiết bị đang có phiếu mượn chưa trả (ràng buộc nghiệp vụ) | `req.body = {id:1, type:'equipment'}`, DAO trả về `{affectedRows:1}` | `{affectedRows:1}` | Soft delete không vi phạm FK — chỉ đổi status, không xóa vật lý |

---

## Tổng kết equipment.service.js

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---|---|---|
| `findAllEquipment()` | 9 | TRUNG BÌNH | Hiển thị danh sách thiết bị để mượn |
| `findOneEquipment()` | 11 | TRUNG BÌNH | Xem chi tiết thiết bị/phòng để chỉnh sửa |
| `findAllRoom()` | 9 | TRUNG BÌNH | Hiển thị danh sách phòng khi tạo phiếu mượn |
| `createEquipment()` | 13 | CAO | Thêm thiết bị/phòng mới (transaction 2-3 bảng) |
| `updateEquipment()` | 15 | CAO | Cập nhật thiết bị/phòng (transaction 2-3 bảng) |
| `deleteEquipment()` | 11 | CAO | Soft delete thiết bị/phòng |
| **TỔNG** | **68** | | |

---

> **Lưu ý nghiệp vụ quan trọng:**
> - `findOne` và `deleteEquipment` dùng format ID đặc biệt: `"{id}|{type}"` cho findOne, `{id, type}` object cho delete
> - Xóa là **soft delete** — đặt status = `'inactive'`, không xóa vật lý → lịch sử mượn trả không bị ảnh hưởng
> - `createEquipment` và `updateEquipment` phân biệt thiết bị/phòng qua field `EQUIPMENT_ITEM_Name` vs `ROOM_Name`
> - Status thiết bị thực tế: `'Có sẵn'`, `'Đang sử dụng'`, `'Hỏng'`, `'inactive'`
> - Status phòng thực tế: `'Có sẵn'`, `'Đang sửa chữa'`, `'inactive'`

---

## 1.5. Execution Report — equipment.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/equipment.service.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | _(điền sau khi chạy)_ |
| Tests failed | _(điền sau khi chạy)_ |
| Thời gian chạy | _(điền sau khi chạy)_ |

### Chi tiết pass/fail theo nhóm

| Nhóm hàm | Số TC | Passed | Failed |
|---|---|---|---|
| `findAllEquipment()` | 9 | | |
| `findOneEquipment()` | 11 | | |
| `findAllRoom()` | 9 | | |
| `createEquipment()` | 13 | | |
| `updateEquipment()` | 15 | | |
| `deleteEquipment()` | 11 | | |
| **TỔNG** | **68** | | |

### Screenshot — Terminal output

> 📸 **[SCREENSHOT 5]** Chụp toàn bộ terminal từ dòng `PASS src/__tests__/...` đến dòng `Tests: X passed, X total`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — equipment.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/equipment.service.test.js --coverage --verbose
> ```
> **HTML report:** `backend/coverage/index.html`

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---|---|---|---|
| `equipment.service.js` | _(điền)_ | _(điền)_ | _(điền)_ | _(điền)_ |

### Mục tiêu coverage

| Chỉ số | Mục tiêu | Thực tế | Đạt? |
|---|---|---|---|
| Statements | ≥ 80% | | |
| Branches | ≥ 80% | | |
| Functions | ≥ 80% | | |
| Lines | ≥ 80% | | |

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[SCREENSHOT 6]** Chụp bảng `File | % Stmts | % Branch | % Funcs | % Lines` trong terminal

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT 7]** Mở `backend/coverage/index.html` bằng browser → chụp trang tổng quan

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết equipment.service.js)

> 📸 **[SCREENSHOT 8]** Click vào `equipment.service.js` trong trang HTML → chụp chi tiết từng dòng

_(Dán ảnh vào đây)_


# UNIT TEST DETAIL - equipment.service.js

> **File:** `backend/src/module/equipment/equipment.service.js`
> **Framework:** Jest | **Mock:** `jest.mock('./equipment.dao')`
> **Nghiệp vụ hệ thống:** Quản lý thiết bị và phòng học. Hệ thống có 2 loại đối tượng: **Thiết bị** (EQUIPMENT_ITEM — máy chiếu, laptop, loa...) và **Phòng** (ROOM — phòng học, phòng lab, phòng họp). Xóa là **soft delete** (đặt status = `'inactive'`), không xóa vật lý. Tạo/cập nhật thiết bị dùng **transaction** 3 bảng (EQUIPMENT_TYPE → EQUIPMENT_MODEL → EQUIPMENT_ITEM). Tạo/cập nhật phòng dùng **transaction** 2 bảng (ROOM_TYPE → ROOM).

---

## 1. findAllEquipment()

> **Nghiệp vụ:** Lấy danh sách toàn bộ thiết bị đang hoạt động (status != `'inactive'`) để hiển thị cho người dùng mượn. Kết quả JOIN 3 bảng: EQUIPMENT_ITEM + EQUIPMENT_MODEL + EQUIPMENT_TYPE. Thiết bị đã bị soft delete (inactive) **không được hiển thị**.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_FINDALL_01 | Lấy danh sách thiết bị khi có nhiều thiết bị đang hoạt động | DAO trả về `[{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_TYPE_Name:'Projector'}, {ID:2, EQUIPMENT_ITEM_Name:'DL15-001', EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_TYPE_Name:'Laptop'}]` | Mảng 2 phần tử đúng như DAO trả về | Happy path: có nhiều thiết bị |
| TC_EQ_FINDALL_02 | Danh sách không chứa thiết bị đã bị soft delete (inactive) | DAO trả về `[{ID:1, EQUIPMENT_ITEM_Status:'Có sẵn'}]` (DAO đã lọc inactive) | Chỉ trả về thiết bị active | DAO lọc `WHERE EQUIPMENT_ITEM_Status != 'inactive'` |
| TC_EQ_FINDALL_03 | Trả về mảng rỗng khi tất cả thiết bị đều inactive | DAO trả về `[]` | `[]` | Tất cả thiết bị đã bị xóa mềm |
| TC_EQ_FINDALL_04 | Trả về mảng rỗng khi chưa có thiết bị nào trong hệ thống | DAO trả về `[]` | `[]` | Hệ thống mới, chưa nhập thiết bị |
| TC_EQ_FINDALL_05 | Trả về đúng cấu trúc dữ liệu JOIN 3 bảng | DAO trả về `[{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_PurchaseDate:'2024-01-10', EQUIPMENT_ITEM_Price:12000000, EQUIPMENT_ITEM_Quantity:1, EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_MODEL_ID:1, EQUIPMENT_MODEL_Name:'Epson X200', EQUIPMENT_MODEL_Branch:'Epson', EQUIPMENT_TYPE_ID:1, EQUIPMENT_TYPE_Name:'Projector'}]` | Object có đủ field từ 3 bảng | Kiểm tra data integrity sau JOIN |
| TC_EQ_FINDALL_06 | Trả về thiết bị với nhiều loại khác nhau (Projector, Laptop, Speaker) | DAO trả về 3 thiết bị với 3 EQUIPMENT_TYPE_Name khác nhau | Mảng 3 phần tử, mỗi phần tử có EQUIPMENT_TYPE_Name khác nhau | Hệ thống có nhiều loại thiết bị |
| TC_EQ_FINDALL_07 | Gọi Dao.findAll đúng 1 lần, không truyền tham số | DAO mock trả về `[]` | `Dao.findAll` được gọi đúng 1 lần | Không cần filter ở service layer |
| TC_EQ_FINDALL_08 | Trả về error object khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi, hệ thống không crash |
| TC_EQ_FINDALL_09 | Trả về error object khi DB timeout | DAO reject với `new Error('Query timeout')` | Trả về error object | Xử lý timeout gracefully |

---

## 2. findOneEquipment()

> **Nghiệp vụ:** Xem chi tiết 1 thiết bị hoặc 1 phòng để hiển thị form chỉnh sửa. ID có định dạng đặc biệt: `"{id}|{type}"` — ví dụ `"1|equipment"` hoặc `"2|room"`. DAO parse chuỗi này để biết query bảng nào. Thiết bị/phòng đã inactive **không được trả về**.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_FINDONE_01 | Tìm thấy thiết bị theo ID hợp lệ (type=equipment) | `req.params.id = "1\|equipment"`, DAO trả về `{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_TYPE_NAME:'Projector'}` | Object thiết bị đầy đủ thông tin | Happy path: thiết bị tồn tại và active |
| TC_EQ_FINDONE_02 | Tìm thấy phòng theo ID hợp lệ (type=room) | `req.params.id = "1\|room"`, DAO trả về `{ID:1, ROOM_Name:'A101', ROOM_Status:'Có sẵn', ROOM_TYPE_Name:'Classroom'}` | Object phòng đầy đủ thông tin | Happy path: phòng tồn tại và active |
| TC_EQ_FINDONE_03 | Trả về undefined khi thiết bị đã bị soft delete (inactive) | `req.params.id = "5\|equipment"`, DAO trả về `undefined` (DAO lọc `status != 'inactive'`) | `undefined` | Thiết bị đã xóa mềm không hiển thị |
| TC_EQ_FINDONE_04 | Trả về undefined khi phòng đã bị soft delete (inactive) | `req.params.id = "2\|room"`, DAO trả về `undefined` | `undefined` | Phòng đã xóa mềm không hiển thị |
| TC_EQ_FINDONE_05 | Trả về undefined khi ID thiết bị không tồn tại trong DB | `req.params.id = "9999\|equipment"`, DAO trả về `undefined` | `undefined` | ID không tồn tại |
| TC_EQ_FINDONE_06 | Trả về undefined khi ID phòng không tồn tại trong DB | `req.params.id = "9999\|room"`, DAO trả về `undefined` | `undefined` | ID không tồn tại |
| TC_EQ_FINDONE_07 | Truyền đúng object `{id}` xuống DAO | `req.params.id = "3\|equipment"` | `Dao.findOne` được gọi với `{id: "3\|equipment"}` | Kiểm tra argument truyền xuống DAO |
| TC_EQ_FINDONE_08 | Trả về đúng cấu trúc JOIN 3 bảng cho thiết bị | DAO trả về `{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_MODEL_NAME:'Epson X200', EQUIPMENT_MODEL_Branch:'Epson', EQUIPMENT_TYPE_NAME:'Projector', EQUIPMENT_TYPE_Description:'Máy chiếu phục vụ giảng dạy'}` | Object có đủ field từ 3 bảng | Kiểm tra data integrity |
| TC_EQ_FINDONE_09 | Trả về đúng cấu trúc JOIN 2 bảng cho phòng | DAO trả về `{ID:1, ROOM_Name:'A101', ROOM_Capacity:40, ROOM_Status:'Có sẵn', LOCATION_Building:'A', LOCATION_Floor:1, ROOM_TYPE_Name:'Classroom'}` | Object có đủ field từ 2 bảng | Kiểm tra data integrity |
| TC_EQ_FINDONE_10 | Trả về error object khi DB lỗi (không throw) | DAO reject với `new Error('DB error')` | Trả về error object | try/catch bắt lỗi |
| TC_EQ_FINDONE_11 | Trả về error khi type không hợp lệ | `req.params.id = "1\|invalid"`, DAO reject với `new Error('Type không hợp lệ')` | Trả về error object | Type phải là 'equipment' hoặc 'room' |

---

## 3. findAllRoom()

> **Nghiệp vụ:** Lấy danh sách toàn bộ phòng đang hoạt động (status != `'inactive'`) để hiển thị khi tạo phiếu mượn thiết bị. Giáo viên chọn phòng khi mượn thiết bị. Kết quả JOIN 2 bảng: ROOM + ROOM_TYPE. Phòng đã bị soft delete **không được hiển thị**. Hệ thống có 3 loại phòng: Classroom, Lab, Conference.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_ROOM_FINDALL_01 | Lấy danh sách phòng khi có nhiều phòng đang hoạt động | DAO trả về `[{ID:1, ROOM_Name:'A101', ROOM_Status:'Có sẵn', ROOM_TYPE_Name:'Classroom'}, {ID:2, ROOM_Name:'B201', ROOM_Status:'Có sẵn', ROOM_TYPE_Name:'Lab'}, {ID:3, ROOM_Name:'C01', ROOM_Status:'Có sẵn', ROOM_TYPE_Name:'Conference'}]` | Mảng 3 phần tử | Happy path: có đủ 3 loại phòng |
| TC_ROOM_FINDALL_02 | Danh sách không chứa phòng đã bị soft delete (inactive) | DAO trả về `[{ID:1, ROOM_Name:'A101', ROOM_Status:'Có sẵn'}]` (DAO đã lọc inactive) | Chỉ trả về phòng active | DAO lọc `WHERE ROOM_Status != 'inactive'` |
| TC_ROOM_FINDALL_03 | Trả về mảng rỗng khi tất cả phòng đều inactive | DAO trả về `[]` | `[]` | Tất cả phòng đã bị xóa mềm |
| TC_ROOM_FINDALL_04 | Trả về mảng rỗng khi chưa có phòng nào trong hệ thống | DAO trả về `[]` | `[]` | Hệ thống mới, chưa nhập phòng |
| TC_ROOM_FINDALL_05 | Trả về đúng cấu trúc dữ liệu JOIN 2 bảng (ROOM + ROOM_TYPE) | DAO trả về `[{ID:1, ROOM_Name:'A101', ROOM_Capacity:40, ROOM_Description:'Phòng học lớn', ROOM_Status:'Có sẵn', LOCATION_Building:'A', LOCATION_Floor:1, ROOM_TYPE_Name:'Classroom', ROOM_TYPE_Description:'Phòng học tiêu chuẩn'}]` | Object có đủ field từ 2 bảng | Kiểm tra data integrity sau JOIN |
| TC_ROOM_FINDALL_06 | Trả về phòng với đầy đủ thông tin vị trí (tòa nhà, tầng) | DAO trả về `[{ROOM_Name:'A101', LOCATION_Building:'A', LOCATION_Floor:1}, {ROOM_Name:'B201', LOCATION_Building:'B', LOCATION_Floor:2}]` | Mỗi phòng có LOCATION_Building và LOCATION_Floor | Thông tin vị trí cần thiết khi mượn thiết bị |
| TC_ROOM_FINDALL_07 | Truyền đúng table name xuống DAO | `process.env.DATABASE = 'datn'`, DAO mock trả về `[]` | `Dao.findAllRoom` được gọi đúng 1 lần | Service gọi DAO không cần tham số (DAO dùng hardcode table) |
| TC_ROOM_FINDALL_08 | Trả về error object khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |
| TC_ROOM_FINDALL_09 | Trả về error object khi DB timeout | DAO reject với `new Error('Query timeout')` | Trả về error object | Xử lý timeout gracefully |

---

## 4. createEquipment()

> **Nghiệp vụ:** Ban quản lý thêm thiết bị mới hoặc phòng mới vào hệ thống. Hàm xử lý **2 loại dữ liệu** dựa trên field trong `req.body`:
> - Nếu có `EQUIPMENT_ITEM_Name` → tạo thiết bị: INSERT 3 bảng trong transaction (EQUIPMENT_TYPE → EQUIPMENT_MODEL → EQUIPMENT_ITEM)
> - Nếu có `ROOM_Name` → tạo phòng: INSERT 2 bảng trong transaction (ROOM_TYPE → ROOM)
> - Nếu không có cả 2 → reject "Unknown data type"
> `EQUIPMENT_ITEM_PurchaseDate` được convert sang định dạng MySQL datetime trước khi INSERT.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_CREATE_01 | Tạo thiết bị mới thành công (Projector) | `req.body = {EQUIPMENT_ITEM_Name:'EPX200-004', EQUIPMENT_ITEM_PurchaseDate:'2024-06-01', EQUIPMENT_ITEM_Price:12000000, EQUIPMENT_ITEM_Quantity:1, EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_ITEM_Description:'Máy chiếu mới', EQUIPMENT_MODEL_Name:'Epson X200', EQUIPMENT_MODEL_Branch:'Epson', EQUIPMENT_TYPE_Name:'Projector', EQUIPMENT_TYPE_Description:'Máy chiếu'}`, DAO trả về `{message:'Thêm thiết bị thành công'}` | `{message:'Thêm thiết bị thành công'}` | Happy path: tạo thiết bị mới |
| TC_EQ_CREATE_02 | Tạo thiết bị mới thành công (Laptop) | `req.body = {EQUIPMENT_ITEM_Name:'DL15-003', EQUIPMENT_TYPE_Name:'Laptop', EQUIPMENT_MODEL_Name:'Dell Inspiron 15', ...}`, DAO trả về `{message:'Thêm thiết bị thành công'}` | `{message:'Thêm thiết bị thành công'}` | Tạo thiết bị loại Laptop |
| TC_EQ_CREATE_03 | Tạo phòng mới thành công (Classroom) | `req.body = {ROOM_Name:'A102', ROOM_Capacity:40, ROOM_Description:'Phòng học mới', ROOM_Status:'Có sẵn', LOCATION_Building:'A', LOCATION_Floor:1, ROOM_TYPE_Name:'Classroom', ROOM_TYPE_Description:'Phòng học tiêu chuẩn'}`, DAO trả về `{message:'Thêm phòng thành công'}` | `{message:'Thêm phòng thành công'}` | Happy path: tạo phòng mới |
| TC_EQ_CREATE_04 | Tạo phòng Lab mới thành công | `req.body = {ROOM_Name:'B202', ROOM_TYPE_Name:'Lab', ...}`, DAO trả về `{message:'Thêm phòng thành công'}` | `{message:'Thêm phòng thành công'}` | Tạo phòng thực hành |
| TC_EQ_CREATE_05 | Tạo phòng họp mới thành công | `req.body = {ROOM_Name:'C02', ROOM_TYPE_Name:'Conference', ...}`, DAO trả về `{message:'Thêm phòng thành công'}` | `{message:'Thêm phòng thành công'}` | Tạo phòng họp |
| TC_EQ_CREATE_06 | Truyền đúng req.body xuống DAO | `req.body = {EQUIPMENT_ITEM_Name:'Test', ...}` | `Dao.createEquipment` được gọi với đúng `req.body` | Không biến đổi dữ liệu ở service layer |
| TC_EQ_CREATE_07 | Trả về error khi transaction thất bại ở bước INSERT EQUIPMENT_TYPE | DAO reject với `new Error('Duplicate entry for EQUIPMENT_TYPE')` | Trả về error object | Transaction rollback khi lỗi bước 1 |
| TC_EQ_CREATE_08 | Trả về error khi transaction thất bại ở bước INSERT EQUIPMENT_MODEL | DAO reject với `new Error('FK constraint failed on EQUIPMENT_MODEL')` | Trả về error object | Transaction rollback khi lỗi bước 2 |
| TC_EQ_CREATE_09 | Trả về error khi transaction thất bại ở bước INSERT EQUIPMENT_ITEM | DAO reject với `new Error('FK constraint failed on EQUIPMENT_ITEM')` | Trả về error object | Transaction rollback khi lỗi bước 3 |
| TC_EQ_CREATE_10 | Trả về error khi transaction thất bại ở bước INSERT ROOM_TYPE | DAO reject với `new Error('DB error on ROOM_TYPE')` | Trả về error object | Transaction rollback khi tạo phòng lỗi |
| TC_EQ_CREATE_11 | Trả về error khi data không có EQUIPMENT_ITEM_Name lẫn ROOM_Name | `req.body = {someOtherField:'value'}`, DAO reject với `"Unknown data type"` | Trả về error object `"Unknown data type"` | Dữ liệu không hợp lệ |
| TC_EQ_CREATE_12 | Gọi Dao.createEquipment đúng 1 lần | DAO trả về `{message:'Thêm thiết bị thành công'}` | `Dao.createEquipment` được gọi đúng 1 lần | Không gọi thừa |
| TC_EQ_CREATE_13 | Trả về error khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |

---

## 5. updateEquipment()

> **Nghiệp vụ:** Ban quản lý cập nhật thông tin thiết bị hoặc phòng. Hàm xử lý **2 loại dữ liệu** dựa trên field trong `req.body`:
> - Nếu có `EQUIPMENT_ITEM_Name` → cập nhật thiết bị: UPDATE 3 bảng trong transaction (EQUIPMENT_ITEM + EQUIPMENT_MODEL + EQUIPMENT_TYPE)
> - Nếu có `ROOM_Name` → cập nhật phòng: UPDATE 2 bảng trong transaction (ROOM + ROOM_TYPE)
> - Nếu không có cả 2 → rollback và reject "Unknown data type"
> `EQUIPMENT_ITEM_PurchaseDate` được convert sang định dạng MySQL datetime. Cập nhật status thiết bị ảnh hưởng đến khả năng mượn (chỉ thiết bị `'Có sẵn'` mới được mượn).

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_UPDATE_01 | Cập nhật thông tin thiết bị thành công | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'EPX200-001 (Updated)', EQUIPMENT_ITEM_PurchaseDate:'2024-01-10', EQUIPMENT_ITEM_Price:13000000, EQUIPMENT_ITEM_Quantity:1, EQUIPMENT_ITEM_Status:'Có sẵn', EQUIPMENT_ITEM_Description:'Cập nhật mô tả', EQUIPMENT_MODEL_ID:1, EQUIPMENT_MODEL_Name:'Epson X200', EQUIPMENT_MODEL_Branch:'Epson', EQUIPMENT_TYPE_ID:1, EQUIPMENT_TYPE_Name:'Projector', EQUIPMENT_TYPE_Description:'Máy chiếu'}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Happy path: cập nhật thiết bị |
| TC_EQ_UPDATE_02 | Cập nhật thông tin phòng thành công | `req.body = {ID:1, ROOM_Name:'A101 (Updated)', ROOM_Capacity:45, ROOM_Description:'Phòng học lớn hơn', ROOM_Status:'Có sẵn', LOCATION_Building:'A', LOCATION_Floor:1, ROOM_TYPE_ID:1, ROOM_TYPE_Name:'Classroom', ROOM_TYPE_Description:'Phòng học tiêu chuẩn'}`, DAO trả về `{message:'Update room thành công'}` | `{message:'Update room thành công'}` | Happy path: cập nhật phòng |
| TC_EQ_UPDATE_03 | Cập nhật status thiết bị từ 'Có sẵn' sang 'Đang sử dụng' | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Status:'Đang sử dụng', ...}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Thiết bị đang được mượn |
| TC_EQ_UPDATE_04 | Cập nhật status thiết bị từ 'Đang sử dụng' về 'Có sẵn' (sau khi trả) | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Status:'Có sẵn', ...}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Thiết bị được trả lại |
| TC_EQ_UPDATE_05 | Cập nhật status thiết bị sang 'Hỏng' (thiết bị bị hư) | `req.body = {ID:2, EQUIPMENT_ITEM_Name:'DL15-001', EQUIPMENT_ITEM_Status:'Hỏng', ...}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Đánh dấu thiết bị hỏng |
| TC_EQ_UPDATE_06 | Cập nhật giá thiết bị (định giá lại) | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Price:15000000, ...}`, DAO trả về `{message:'Update equipment thành công'}` | `{message:'Update equipment thành công'}` | Cập nhật giá trị tài sản |
| TC_EQ_UPDATE_07 | Cập nhật sức chứa phòng | `req.body = {ID:1, ROOM_Name:'A101', ROOM_Capacity:50, ...}`, DAO trả về `{message:'Update room thành công'}` | `{message:'Update room thành công'}` | Thay đổi sức chứa phòng |
| TC_EQ_UPDATE_08 | Cập nhật status phòng sang 'Đang sửa chữa' | `req.body = {ID:2, ROOM_Name:'B201', ROOM_Status:'Đang sửa chữa', ...}`, DAO trả về `{message:'Update room thành công'}` | `{message:'Update room thành công'}` | Phòng tạm thời không dùng được |
| TC_EQ_UPDATE_09 | Trả về error khi transaction UPDATE EQUIPMENT_ITEM thất bại | DAO reject với `new Error('DB error on EQUIPMENT_ITEM update')` | Trả về error object | Transaction rollback khi lỗi bước 1 |
| TC_EQ_UPDATE_10 | Trả về error khi transaction UPDATE EQUIPMENT_MODEL thất bại | DAO reject với `new Error('DB error on EQUIPMENT_MODEL update')` | Trả về error object | Transaction rollback khi lỗi bước 2 |
| TC_EQ_UPDATE_11 | Trả về error khi transaction UPDATE EQUIPMENT_TYPE thất bại | DAO reject với `new Error('DB error on EQUIPMENT_TYPE update')` | Trả về error object | Transaction rollback khi lỗi bước 3 |
| TC_EQ_UPDATE_12 | Trả về error khi data không có EQUIPMENT_ITEM_Name lẫn ROOM_Name | `req.body = {ID:1, someField:'value'}`, DAO reject với `"Unknown data type"` | Trả về error object `"Unknown data type"` | Dữ liệu không hợp lệ |
| TC_EQ_UPDATE_13 | Truyền đúng req.body xuống DAO | `req.body = {ID:1, EQUIPMENT_ITEM_Name:'Test', ...}` | `Dao.updateEquipment` được gọi với đúng `req.body` | Không biến đổi dữ liệu ở service layer |
| TC_EQ_UPDATE_14 | Gọi Dao.updateEquipment đúng 1 lần | DAO trả về `{message:'Update equipment thành công'}` | `Dao.updateEquipment` được gọi đúng 1 lần | Không gọi thừa |
| TC_EQ_UPDATE_15 | Trả về error khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |

---

## 6. deleteEquipment()

> **Nghiệp vụ:** Ban quản lý xóa thiết bị hoặc phòng khỏi danh sách hiển thị. Đây là **soft delete** — không xóa vật lý khỏi DB mà chỉ đặt status = `'inactive'`. Thiết bị/phòng inactive sẽ không xuất hiện trong `findAllEquipment()` và `findAllRoom()`. Dữ liệu lịch sử mượn trả vẫn được giữ nguyên. `req.body` phải có `{id, type}` — type là `'equipment'` hoặc `'room'`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQ_DELETE_01 | Soft delete thiết bị thành công (type=equipment) | `req.body = {id:1, type:'equipment'}`, DAO trả về `{affectedRows:1}` | `{affectedRows:1}` | Happy path: thiết bị bị ẩn khỏi danh sách |
| TC_EQ_DELETE_02 | Soft delete phòng thành công (type=room) | `req.body = {id:1, type:'room'}`, DAO trả về `{affectedRows:1}` | `{affectedRows:1}` | Happy path: phòng bị ẩn khỏi danh sách |
| TC_EQ_DELETE_03 | Sau khi soft delete thiết bị, thiết bị không còn xuất hiện trong findAllEquipment | `req.body = {id:1, type:'equipment'}`, DAO deleteEquipment trả về `{affectedRows:1}`, DAO findAll trả về `[]` | `findAllEquipment` trả về mảng không chứa thiết bị ID=1 | Kiểm tra tính nhất quán nghiệp vụ |
| TC_EQ_DELETE_04 | Sau khi soft delete phòng, phòng không còn xuất hiện trong findAllRoom | `req.body = {id:1, type:'room'}`, DAO deleteEquipment trả về `{affectedRows:1}`, DAO findAllRoom trả về `[]` | `findAllRoom` trả về mảng không chứa phòng ID=1 | Kiểm tra tính nhất quán nghiệp vụ |
| TC_EQ_DELETE_05 | Trả về affectedRows = 0 khi ID thiết bị không tồn tại | `req.body = {id:9999, type:'equipment'}`, DAO trả về `{affectedRows:0}` | `result.affectedRows === 0` | Không có bản ghi nào bị cập nhật |
| TC_EQ_DELETE_06 | Trả về affectedRows = 0 khi ID phòng không tồn tại | `req.body = {id:9999, type:'room'}`, DAO trả về `{affectedRows:0}` | `result.affectedRows === 0` | Không có bản ghi nào bị cập nhật |
| TC_EQ_DELETE_07 | Trả về error khi type không hợp lệ | `req.body = {id:1, type:'invalid'}`, DAO reject với `new Error('Type không hợp lệ')` | Trả về error object | Type phải là 'equipment' hoặc 'room' |
| TC_EQ_DELETE_08 | Truyền đúng req.body xuống DAO | `req.body = {id:2, type:'equipment'}` | `Dao.deleteEquipment` được gọi với đúng `{id:2, type:'equipment'}` | Kiểm tra argument |
| TC_EQ_DELETE_09 | Gọi Dao.deleteEquipment đúng 1 lần | DAO trả về `{affectedRows:1}` | `Dao.deleteEquipment` được gọi đúng 1 lần | Không gọi thừa |
| TC_EQ_DELETE_10 | Trả về error khi DB lỗi (không throw) | DAO reject với `new Error('DB connection failed')` | Trả về error object | try/catch bắt lỗi |
| TC_EQ_DELETE_11 | Soft delete thiết bị đang có phiếu mượn chưa trả (ràng buộc nghiệp vụ) | `req.body = {id:1, type:'equipment'}`, DAO trả về `{affectedRows:1}` | `{affectedRows:1}` | Soft delete không vi phạm FK — chỉ đổi status, không xóa vật lý |

---

## Tổng kết equipment.service.js

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---|---|---|
| `findAllEquipment()` | 9 | TRUNG BÌNH | Hiển thị danh sách thiết bị để mượn |
| `findOneEquipment()` | 11 | TRUNG BÌNH | Xem chi tiết thiết bị/phòng để chỉnh sửa |
| `findAllRoom()` | 9 | TRUNG BÌNH | Hiển thị danh sách phòng khi tạo phiếu mượn |
| `createEquipment()` | 13 | CAO | Thêm thiết bị/phòng mới (transaction 2-3 bảng) |
| `updateEquipment()` | 15 | CAO | Cập nhật thiết bị/phòng (transaction 2-3 bảng) |
| `deleteEquipment()` | 11 | CAO | Soft delete thiết bị/phòng |
| **TỔNG** | **68** | | |

---

> **Lưu ý nghiệp vụ quan trọng:**
> - `findOne` và `deleteEquipment` dùng format ID đặc biệt: `"{id}|{type}"` cho findOne, `{id, type}` object cho delete
> - Xóa là **soft delete** — đặt status = `'inactive'`, không xóa vật lý → lịch sử mượn trả không bị ảnh hưởng
> - `createEquipment` và `updateEquipment` phân biệt thiết bị/phòng qua field `EQUIPMENT_ITEM_Name` vs `ROOM_Name`
> - Status thiết bị thực tế: `'Có sẵn'`, `'Đang sử dụng'`, `'Hỏng'`, `'inactive'`
> - Status phòng thực tế: `'Có sẵn'`, `'Đang sửa chữa'`, `'inactive'`

---

## 1.5. Execution Report — equipment.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/equipment.service.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | _(điền sau khi chạy)_ |
| Tests failed | _(điền sau khi chạy)_ |
| Thời gian chạy | _(điền sau khi chạy)_ |

### Chi tiết pass/fail theo nhóm

| Nhóm hàm | Số TC | Passed | Failed |
|---|---|---|---|
| `findAllEquipment()` | 9 | | |
| `findOneEquipment()` | 11 | | |
| `findAllRoom()` | 9 | | |
| `createEquipment()` | 13 | | |
| `updateEquipment()` | 15 | | |
| `deleteEquipment()` | 11 | | |
| **TỔNG** | **68** | | |

### Screenshot — Terminal output

> 📸 **[SCREENSHOT 5]** Chụp toàn bộ terminal từ dòng `PASS src/__tests__/...` đến dòng `Tests: X passed, X total`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — equipment.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/equipment.service.test.js --coverage --verbose
> ```
> **HTML report:** `backend/coverage/index.html`

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---|---|---|---|
| `equipment.service.js` | _(điền)_ | _(điền)_ | _(điền)_ | _(điền)_ |

### Mục tiêu coverage

| Chỉ số | Mục tiêu | Thực tế | Đạt? |
|---|---|---|---|
| Statements | ≥ 80% | | |
| Branches | ≥ 80% | | |
| Functions | ≥ 80% | | |
| Lines | ≥ 80% | | |

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[SCREENSHOT 6]** Chụp bảng `File | % Stmts | % Branch | % Funcs | % Lines` trong terminal

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT 7]** Mở `backend/coverage/index.html` bằng browser → chụp trang tổng quan

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết equipment.service.js)

> 📸 **[SCREENSHOT 8]** Click vào `equipment.service.js` trong trang HTML → chụp chi tiết từng dòng

_(Dán ảnh vào đây)_
# UNIT TEST DETAIL - borrowReturn.service.js

> **File:** `backend/src/module/borrowReturn/borrowReturn.service.js`
> **Framework:** Jest | **Mock:** `jest.mock('./borrowReturn.dao')`
> **Nghiệp vụ hệ thống:** Quản lý mượn/trả thiết bị và phòng học.
> - Giáo viên tạo phiếu mượn thiết bị hoặc phòng
> - Phiếu mượn có 2 trạng thái: `'Chưa trả'` → `'Đã trả'`
> - Khi mượn: status thiết bị/phòng đổi thành `'Đang mượn'`
> - Khi trả: status thiết bị/phòng đổi về `'Có sẵn'`, ghi nhận ngày trả thực tế
> - `convertDateArray([tiet, ngay])` tính giờ bắt đầu từ tiết học (tiết 1 = 7:00, mỗi tiết 45 phút)

---

## 1. findAllBorrowReturnSlip()

> **Nghiệp vụ:** Ban quản lý xem toàn bộ danh sách phiếu mượn trong hệ thống (cả Chưa trả và Đã trả). Kết quả JOIN 3 bảng: BORROW_RETURN_SLIP + BORROW_RETURN_DATE + BORROW_RETURN_ITEM. Dùng để theo dõi tình trạng mượn trả tổng thể.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BR_FINDALL_SLIP_01 | Lấy danh sách khi có nhiều phiếu mượn (cả Chưa trả và Đã trả) | DAO trả về `[{BORROW_RETURN_SLIP_ID:1, BORROW_RETURN_SLIP_Status:'Chưa trả'}, {BORROW_RETURN_SLIP_ID:2, BORROW_RETURN_SLIP_Status:'Đã trả'}]` | Mảng 2 phần tử đúng như DAO trả về | Happy path: có cả 2 trạng thái |
| TC_BR_FINDALL_SLIP_02 | Trả về mảng rỗng khi chưa có phiếu mượn nào | DAO trả về `undefined` (DAO dùng `results[0]`) | `undefined` | Hệ thống mới, chưa có phiếu mượn |
| TC_BR_FINDALL_SLIP_03 | Trả về đúng cấu trúc dữ liệu JOIN 3 bảng | DAO trả về `{BORROW_RETURN_SLIP_ID:1, BORROW_RETURN_SLIP_Name:'Phiếu 1', BORROW_RETURN_SLIP_Status:'Chưa trả', USER_ID:1, BORROW_RETURN_DATE_ID:1, DATE_BorrowDate:'2024-01-10', DATE_ExceptionReturnDate:'2024-01-12', BORROW_RETURN_ITEM_ID:1, EQUIPMENT_ITEM_ID:1}` | Object có đủ field từ 3 bảng | Kiểm tra data integrity |
| TC_BR_FINDALL_SLIP_04 | Gọi Dao.findAllBorrowReturnSlipDAO đúng 1 lần | DAO mock trả về `undefined` | `Dao.findAllBorrowReturnSlipDAO` được gọi đúng 1 lần | CheckDB: không cần tham số |
| TC_BR_FINDALL_SLIP_05 | Trả về error object khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |
| TC_BR_FINDALL_SLIP_06 | Trả về error object khi DB timeout | DAO reject với `new Error('Query timeout')` | Trả về error object | Xử lý timeout gracefully |

---

## 2. findByUserBorrowReturnSlip()

> **Nghiệp vụ:** Giáo viên xem lịch sử phiếu mượn của chính mình theo USER_ID. Kết quả JOIN BORROW_RETURN_SLIP + BORROW_RETURN_DATE, sắp xếp theo ID DESC (mới nhất trước). ID lấy từ `req.params.id` (string từ URL).

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BR_FINDBYUSER_01 | Lấy danh sách phiếu mượn của user có nhiều phiếu | `req.params.id = "1"`, DAO trả về `[{ID:2, BORROW_RETURN_SLIP_Status:'Chưa trả'}, {ID:1, BORROW_RETURN_SLIP_Status:'Đã trả'}]` | Mảng 2 phần tử, sắp xếp ID DESC | Happy path: user có nhiều phiếu |
| TC_BR_FINDBYUSER_02 | Lấy danh sách phiếu mượn của user chỉ có 1 phiếu | `req.params.id = "2"`, DAO trả về `[{ID:1, BORROW_RETURN_SLIP_Status:'Chưa trả'}]` | Mảng 1 phần tử | User mới mượn lần đầu |
| TC_BR_FINDBYUSER_03 | Trả về mảng rỗng khi user chưa có phiếu mượn nào | `req.params.id = "3"`, DAO trả về `[]` | `[]` | User chưa từng mượn thiết bị |
| TC_BR_FINDBYUSER_04 | Trả về mảng rỗng khi user ID không tồn tại | `req.params.id = "9999"`, DAO trả về `[]` | `[]` | ID không tồn tại trong DB |
| TC_BR_FINDBYUSER_05 | Trả về cả phiếu Chưa trả và Đã trả của user | `req.params.id = "1"`, DAO trả về `[{BORROW_RETURN_SLIP_Status:'Chưa trả'}, {BORROW_RETURN_SLIP_Status:'Đã trả'}]` | Mảng chứa cả 2 trạng thái | Không lọc theo status |
| TC_BR_FINDBYUSER_06 | Trả về đúng cấu trúc dữ liệu (có ngày mượn, ngày trả dự kiến) | `req.params.id = "1"`, DAO trả về `[{ID:1, BORROW_RETURN_SLIP_Name:'Phiếu 1', BORROW_RETURN_SLIP_Status:'Chưa trả', USER_ID:1, DATE_BorrowDate:'2024-01-10 07:00:00', DATE_ExceptionReturnDate:'2024-01-10 08:30:00', DATE_ActualReturnDate:null}]` | Object có đủ field ngày tháng | Kiểm tra data integrity |
| TC_BR_FINDBYUSER_07 | CheckDB: Dao được gọi với đúng userId từ req.params | `req.params.id = "5"` | `Dao.findByUserBorrowReturnSlipDAO` được gọi với `"5"` | req.params luôn là string |
| TC_BR_FINDBYUSER_08 | Trả về error object khi DB lỗi (không throw) | DAO reject với `new Error('DB error')` | Trả về error object | try/catch bắt lỗi |

---

## 3. findBorrowReturnSlipDetail()

> **Nghiệp vụ:** Xem chi tiết 1 phiếu mượn theo ID phiếu — hiển thị danh sách thiết bị/phòng trong phiếu đó. Dùng khi giáo viên hoặc ban quản lý muốn xem chi tiết phiếu để xử lý trả. **Lưu ý:** `findBorrowReturnSlipDetailDAO` không có trong DAO exports hiện tại — đây là bug thực tế cần ghi nhận.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BR_FINDDETAIL_01 | Lấy chi tiết phiếu mượn thiết bị theo ID hợp lệ | `req.params.id = "1"`, DAO trả về `[{BORROW_RETURN_SLIP_ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_ITEM_Status:'Đang mượn'}]` | Mảng chi tiết phiếu mượn | Happy path: phiếu mượn thiết bị |
| TC_BR_FINDDETAIL_02 | Lấy chi tiết phiếu mượn phòng theo ID hợp lệ | `req.params.id = "2"`, DAO trả về `[{BORROW_RETURN_SLIP_ID:2, ROOM_Name:'A101', ROOM_Status:'Đang mượn'}]` | Mảng chi tiết phiếu mượn phòng | Happy path: phiếu mượn phòng |
| TC_BR_FINDDETAIL_03 | Trả về undefined/rỗng khi ID phiếu không tồn tại | `req.params.id = "9999"`, DAO trả về `[]` | `[]` | ID không tồn tại |
| TC_BR_FINDDETAIL_04 | Phiếu có nhiều thiết bị — trả về đủ tất cả | `req.params.id = "1"`, DAO trả về mảng 3 phần tử (3 thiết bị) | Mảng 3 phần tử | Phiếu mượn nhiều thiết bị cùng lúc |
| TC_BR_FINDDETAIL_05 | CheckDB: Dao được gọi với đúng slipId từ req.params | `req.params.id = "3"` | `Dao.findBorrowReturnSlipDetailDAO` được gọi với `"3"` | req.params luôn là string |
| TC_BR_FINDDETAIL_06 | Trả về error object khi DAO không tồn tại (bug thực tế) | `findBorrowReturnSlipDetailDAO` không được export từ DAO | Trả về error object (TypeError) | Bug: DAO thiếu hàm này — service sẽ throw |
| TC_BR_FINDDETAIL_07 | Trả về error object khi DB lỗi (không throw) | DAO reject với `new Error('DB error')` | Trả về error object | try/catch bắt lỗi |

---

## 4. createBorrowReturnSlip()

> **Nghiệp vụ:** Giáo viên tạo phiếu mượn thiết bị hoặc phòng. Phân biệt loại qua `data.equipments[0].EQUIPMENT_ITEM_Name`:
> - Có `EQUIPMENT_ITEM_Name` → mượn thiết bị: INSERT SLIP + DATE + ITEM, UPDATE status thiết bị → `'Đang mượn'`
> - Không có → mượn phòng: INSERT SLIP + DATE + ITEM, UPDATE status phòng → `'Đang mượn'`
> `StartDate` và `EndDate` là `[tiet, ngay]` — được convert bằng `convertDateArray()`
> Phiếu mới luôn có status `'Chưa trả'`

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BR_CREATE_01 | Tạo phiếu mượn thiết bị thành công | `req.body = {BORROW_RETURN_SLIP_Name:'Phiếu mượn 1', Note:'Ghi chú', USER:{ID:1}, StartDate:['1','2024-01-10'], EndDate:['3','2024-01-10'], equipments:[{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001'}]}`, DAO trả về `{borrowReturnSlipId:1, equipments:[1], message:'Tạo phiếu mượn thành công'}` | `{borrowReturnSlipId:1, message:'Tạo phiếu mượn thành công'}` | Happy path: mượn thiết bị |
| TC_BR_CREATE_02 | Tạo phiếu mượn phòng thành công | `req.body = {..., equipments:[{ID:1, ROOM_Name:'A101'}]}` (không có EQUIPMENT_ITEM_Name), DAO trả về `{borrowReturnSlipId:2, message:'Tạo phiếu mượn thành công'}` | `{borrowReturnSlipId:2, message:'Tạo phiếu mượn thành công'}` | Happy path: mượn phòng |
| TC_BR_CREATE_03 | Tạo phiếu mượn nhiều thiết bị cùng lúc | `req.body = {..., equipments:[{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001'}, {ID:4, EQUIPMENT_ITEM_Name:'DL15-001'}]}`, DAO trả về `{borrowReturnSlipId:3, equipments:[1,4], message:'Tạo phiếu mượn thành công'}` | `{equipments:[1,4], message:'Tạo phiếu mượn thành công'}` | Mượn nhiều thiết bị |
| TC_BR_CREATE_04 | Phiếu mượn mới luôn có status 'Chưa trả' | `req.body = {...}`, DAO trả về `{borrowReturnSlipId:1, message:'Tạo phiếu mượn thành công'}` | `result.message === 'Tạo phiếu mượn thành công'` | Status 'Chưa trả' được set trong SQL |
| TC_BR_CREATE_05 | Truyền đúng req.body xuống DAO | `req.body = {BORROW_RETURN_SLIP_Name:'Test', Note:'', USER:{ID:1}, StartDate:['1','2024-01-10'], EndDate:['2','2024-01-10'], equipments:[{ID:1, EQUIPMENT_ITEM_Name:'EPX200-001'}]}` | `Dao.createBorrowReturnSlipDAO` được gọi với đúng `req.body` | CheckDB: không biến đổi dữ liệu |
| TC_BR_CREATE_06 | Trả về error khi DB lỗi trong transaction (không throw) | DAO reject với `new Error('DB transaction failed')` | Trả về error object | try/catch bắt lỗi |
| TC_BR_CREATE_07 | Gọi Dao.createBorrowReturnSlipDAO đúng 1 lần | DAO trả về `{message:'Tạo phiếu mượn thành công'}` | `Dao.createBorrowReturnSlipDAO` được gọi đúng 1 lần | CheckDB |
| TC_BR_CREATE_08 | Trả về borrowReturnSlipId sau khi tạo thành công | DAO trả về `{borrowReturnSlipId:99, message:'Tạo phiếu mượn thành công'}` | `result.borrowReturnSlipId === 99` | ID phiếu mượn mới |

---

## 5. borrowReturnSlip()

> **Nghiệp vụ:** Xử lý trả thiết bị hoặc phòng. `req.body` là mảng các item cần trả. Logic:
> - Cập nhật BORROW_RETURN_SLIP status → `'Đã trả'`
> - Cập nhật DATE_ActualReturnDate = NOW() (giờ VN +07:00)
> - Nếu item có `EQUIPMENT_ITEM_ID`: cập nhật status thiết bị `'Đang mượn'` → `'Có sẵn'`
> - Nếu item có `ROOM_ID`: cập nhật status phòng `'Đang mượn'` → `'Có sẵn'`
> - Toàn bộ trong 1 transaction — rollback nếu bất kỳ bước nào lỗi

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BR_RETURN_01 | Trả thiết bị thành công — status thiết bị đổi về 'Có sẵn' | `req.body = [{BORROW_RETURN_SLIP_ID:1, items:[{EQUIPMENT_ITEM_ID:1, EQUIPMENT_ITEM_Status:'Đang mượn'}]}]`, DAO trả về `true` | `true` | Happy path: trả thiết bị |
| TC_BR_RETURN_02 | Trả phòng thành công — status phòng đổi về 'Có sẵn' | `req.body = [{BORROW_RETURN_SLIP_ID:2, items:[{ROOM_ID:1, ROOM_Status:'Đang mượn'}]}]`, DAO trả về `true` | `true` | Happy path: trả phòng |
| TC_BR_RETURN_03 | Trả nhiều thiết bị cùng lúc trong 1 phiếu | `req.body = [{BORROW_RETURN_SLIP_ID:1, items:[{EQUIPMENT_ITEM_ID:1, EQUIPMENT_ITEM_Status:'Đang mượn'}, {EQUIPMENT_ITEM_ID:4, EQUIPMENT_ITEM_Status:'Đang mượn'}]}]`, DAO trả về `true` | `true` | Trả nhiều thiết bị |
| TC_BR_RETURN_04 | Trả về error khi data rỗng (DAO validate) | `req.body = []`, DAO reject với `new Error('Data is empty or invalid')` | Trả về error object | DAO kiểm tra `data.length === 0` |
| TC_BR_RETURN_05 | Trả về error khi BORROW_RETURN_SLIP_ID không hợp lệ | `req.body = [{BORROW_RETURN_SLIP_ID: null, items:[]}]`, DAO reject với `new Error('Invalid BORROW_RETURN_SLIP_ID')` | Trả về error object | DAO validate slipId |
| TC_BR_RETURN_06 | Trả về error khi transaction rollback (UPDATE SLIP thất bại) | DAO reject với `new Error('DB error on UPDATE SLIP')` | Trả về error object | Transaction rollback |
| TC_BR_RETURN_07 | Trả về error khi transaction rollback (UPDATE DATE thất bại) | DAO reject với `new Error('DB error on UPDATE DATE')` | Trả về error object | Transaction rollback bước 2 |
| TC_BR_RETURN_08 | Trả về error khi transaction rollback (UPDATE EQUIPMENT thất bại) | DAO reject với `new Error('DB error on UPDATE EQUIPMENT')` | Trả về error object | Transaction rollback bước 3 |
| TC_BR_RETURN_09 | Truyền đúng req.body xuống DAO | `req.body = [{BORROW_RETURN_SLIP_ID:1, items:[...]}]` | `Dao.borrowReturnSlipDAO` được gọi với đúng `req.body` | CheckDB |
| TC_BR_RETURN_10 | Gọi Dao.borrowReturnSlipDAO đúng 1 lần | DAO trả về `true` | `Dao.borrowReturnSlipDAO` được gọi đúng 1 lần | CheckDB |
| TC_BR_RETURN_11 | Trả về error khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |

---

## 6. findAllBorrowReturn()

> **Nghiệp vụ:** Ban quản lý xem toàn bộ chi tiết mượn trả — JOIN 9 bảng để lấy đầy đủ thông tin: phiếu mượn, user, ngày tháng, thiết bị (model, type), phòng (room type). Dùng để xuất báo cáo Excel và theo dõi tổng thể tài sản.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BR_FINDALL_01 | Lấy danh sách khi có nhiều bản ghi mượn trả | DAO trả về mảng 5 phần tử với đầy đủ thông tin | Mảng 5 phần tử đúng như DAO trả về | Happy path |
| TC_BR_FINDALL_02 | Trả về mảng rỗng khi chưa có phiếu mượn nào | DAO trả về `[]` | `[]` | Hệ thống mới |
| TC_BR_FINDALL_03 | Trả về đúng cấu trúc dữ liệu JOIN 9 bảng | DAO trả về `[{BORROW_RETURN_SLIP_ID:1, BORROW_RETURN_SLIP_Status:'Chưa trả', USER_ID:1, USER_FullName:'Nguyễn Văn Tuấn', USER_Role:'Giáo viên', DATE_BorrowDate:'2024-01-10', EQUIPMENT_ITEM_ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', EQUIPMENT_MODEL_Name:'Epson X200', EQUIPMENT_TYPE_Name:'Projector', ROOM_ID:null, ROOM_Name:null}]` | Object có đủ field từ 9 bảng | Kiểm tra data integrity |
| TC_BR_FINDALL_04 | Trả về cả phiếu Chưa trả và Đã trả | DAO trả về `[{BORROW_RETURN_SLIP_Status:'Chưa trả'}, {BORROW_RETURN_SLIP_Status:'Đã trả'}]` | Mảng chứa cả 2 trạng thái | Không lọc theo status |
| TC_BR_FINDALL_05 | Trả về bản ghi mượn thiết bị (có EQUIPMENT_ITEM_ID, ROOM_ID = null) | DAO trả về `[{EQUIPMENT_ITEM_ID:1, EQUIPMENT_ITEM_Name:'EPX200-001', ROOM_ID:null}]` | Object có EQUIPMENT_ITEM_ID, ROOM_ID là null | LEFT JOIN → phòng null khi mượn thiết bị |
| TC_BR_FINDALL_06 | Trả về bản ghi mượn phòng (có ROOM_ID, EQUIPMENT_ITEM_ID = null) | DAO trả về `[{ROOM_ID:1, ROOM_Name:'A101', EQUIPMENT_ITEM_ID:null}]` | Object có ROOM_ID, EQUIPMENT_ITEM_ID là null | LEFT JOIN → thiết bị null khi mượn phòng |
| TC_BR_FINDALL_07 | Gọi Dao.findAllBorrowReturn đúng 1 lần, không tham số | DAO mock trả về `[]` | `Dao.findAllBorrowReturn` được gọi đúng 1 lần | CheckDB |
| TC_BR_FINDALL_08 | Trả về error object khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |
| TC_BR_FINDALL_09 | Trả về error object khi DB timeout | DAO reject với `new Error('Query timeout')` | Trả về error object | Xử lý timeout gracefully |

---

## Tổng kết borrowReturn.service.js

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---|---|---|
| `findAllBorrowReturnSlip()` | 6 | TRUNG BÌNH | Ban quản lý xem tổng danh sách phiếu |
| `findByUserBorrowReturnSlip()` | 8 | TRUNG BÌNH | Giáo viên xem lịch sử mượn của mình |
| `findBorrowReturnSlipDetail()` | 7 | TRUNG BÌNH | Xem chi tiết 1 phiếu để xử lý trả |
| `createBorrowReturnSlip()` | 8 | CAO | Tạo phiếu mượn thiết bị/phòng |
| `borrowReturnSlip()` | 11 | CAO | Xử lý trả — transaction phức tạp nhất |
| `findAllBorrowReturn()` | 9 | TRUNG BÌNH | Báo cáo tổng thể mượn trả |
| **TỔNG** | **49** | | |

> **Lưu ý nghiệp vụ quan trọng:**
> - Status phiếu mượn: `'Chưa trả'` → `'Đã trả'`
> - Status thiết bị/phòng khi mượn: `'Có sẵn'` → `'Đang mượn'`
> - Status thiết bị/phòng khi trả: `'Đang mượn'` → `'Có sẵn'`
> - `borrowReturnSlip` dùng transaction — rollback toàn bộ nếu bất kỳ bước nào lỗi
> - `findBorrowReturnSlipDetailDAO` **không được export** từ DAO hiện tại — bug thực tế
> - `findAllBorrowReturnSlipDAO` trả về `results[0]` (1 object) thay vì mảng — cần lưu ý khi test

---

## 1.5. Execution Report — borrowReturn.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/borrowReturn.service.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | _(điền sau khi chạy)_ |
| Tests failed | _(điền sau khi chạy)_ |
| Thời gian chạy | _(điền sau khi chạy)_ |

### Chi tiết pass/fail theo nhóm

| Nhóm hàm | Số TC | Passed | Failed |
|---|---|---|---|
| `findAllBorrowReturn()` | 6 | | |
| `findAllBorrowReturnSlip()` | 5 | | |
| `findByUserBorrowReturnSlip()` | 5 | | |
| `findBorrowReturnSlipDetail()` | 1 | | |
| `createBorrowReturnSlip()` | 6 | | |
| `borrowReturnSlip()` | 9 | | |
| **TỔNG** | **32** | | |

### Screenshot — Terminal output

> 📸 **[CHỤP MÀN HÌNH 1]**
> Chụp toàn bộ terminal từ dòng `PASS src/__tests__/service/borrowReturn.service.test.js`
> đến dòng `Tests: 32 passed, 32 total`

_(Dán ảnh vào đây)_

---

# 1.6. Code Coverage Report — borrowReturn.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/borrowReturn.service.test.js --coverage --verbose
> ```
> **HTML report:** Mở file `backend/coverage/lcov-report/borrowReturn/borrowReturn.service.js.html` bằng browser

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---|---|---|---|
| `borrowReturn.service.js` | _(điền)_ | _(điền)_ | _(điền)_ | _(điền)_ |

### Mục tiêu coverage

| Chỉ số | Mục tiêu | Thực tế | Đạt? |
|---|---|---|---|
| Statements | ≥ 80% | | |
| Branches | ≥ 80% | | |
| Functions | ≥ 80% | | |
| Lines | ≥ 80% | | |

### Cách lấy số liệu để điền vào 2 bảng trên

Sau khi chạy lệnh `--coverage`, mở file:
```
backend/coverage/lcov-report/borrowReturn/borrowReturn.service.js.html
```
Nhìn vào 4 con số ở đầu trang (ví dụ: `100% Statements 42/42`) → điền vào bảng.

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[CHỤP MÀN HÌNH 2]**
> Chụp bảng text coverage xuất hiện cuối terminal sau khi chạy `--coverage`
> (Bảng có dạng: `File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines`)

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[CHỤP MÀN HÌNH 3]**
> Mở `backend/coverage/lcov-report/index.html` bằng browser → chụp trang tổng quan

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết borrowReturn.service.js)

> 📸 **[CHỤP MÀN HÌNH 4]**
> Trong trang HTML, click vào thư mục `borrowReturn` → click vào `borrowReturn.service.js`
> Chụp màn hình trang chi tiết (dòng xanh = covered, đỏ = not covered)

_(Dán ảnh vào đây)_


---

# UNIT TEST DETAIL - request.service.js

> **File:** `backend/src/module/request/request.service.js`
> **Framework:** Jest | **Mock:** `jest.mock('./request.dao')`
> **Nghiệp vụ hệ thống:** Quản lý yêu cầu mua sắm/bổ sung thiết bị mới.
> - **Giáo viên** tạo phiếu yêu cầu (`requestSlip`) khi cần thiết bị mới chưa có trong hệ thống
> - **Ban giám hiệu / Ban quản lý** xem danh sách yêu cầu (`getRequestSlip`) để xét duyệt
> - **Ban giám hiệu / Ban quản lý** phê duyệt hoặc từ chối yêu cầu (`approvedSlip`)
> - Phiếu yêu cầu có 3 trạng thái: `'Chưa duyệt'` → `'Đã duyệt'` hoặc `'Từ chối'`
> - Khi duyệt: status các thiết bị trong phiếu được cập nhật → `'Có sẵn'`
> - Phiếu yêu cầu có thể có hoặc không có danh sách items (REQUEST_ITEM)

---

## 1. requestSlip()

> **Nghiệp vụ:** Giáo viên tạo phiếu yêu cầu mua sắm thiết bị mới. DAO thực hiện transaction:
> 1. INSERT REQUEST_SLIP với status = `'Chưa duyệt'`, ngày tạo = NOW()
> 2. Nếu có `data.items` → INSERT từng REQUEST_ITEM liên kết với phiếu
> 3. Nếu không có items → commit ngay sau bước 1
> Trả về `{slipId}` — ID của phiếu vừa tạo.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_REQ_CREATE_01 | Tạo phiếu yêu cầu thành công với danh sách thiết bị cần mua | `req.body = {REQUEST_SLIP_Name:'Yêu cầu mua máy chiếu', REQUEST_SLIP_Note:'Phòng A101 cần thêm máy chiếu', USER_ID:1, items:[{ID:null, EQUIPMENT_ITEM_Name:'Máy chiếu Epson', EQUIPMENT_ITEM_Description:'Máy chiếu 4K', EQUIPMENT_TYPE_Name:'Projector', EQUIPMENT_ITEM_Status:'Chưa có', REQUEST_ITEM_Status:'Chờ duyệt'}]}`, DAO trả về `{slipId:5}` | `{slipId:5}` | Happy path: tạo phiếu có items |
| TC_REQ_CREATE_02 | Tạo phiếu yêu cầu với nhiều thiết bị cần mua | `req.body = {REQUEST_SLIP_Name:'Yêu cầu mua thiết bị phòng lab', USER_ID:1, items:[{EQUIPMENT_ITEM_Name:'Laptop Dell'}, {EQUIPMENT_ITEM_Name:'Loa JBL'}, {EQUIPMENT_ITEM_Name:'Máy chiếu Epson'}]}`, DAO trả về `{slipId:6}` | `{slipId:6}` | Tạo phiếu có nhiều items |
| TC_REQ_CREATE_03 | Tạo phiếu yêu cầu không có items (chỉ có thông tin phiếu) | `req.body = {REQUEST_SLIP_Name:'Yêu cầu khẩn', REQUEST_SLIP_Note:'Cần thiết bị gấp', USER_ID:2, items:[]}`, DAO trả về `{slipId:7}` | `{slipId:7}` | DAO commit ngay sau INSERT SLIP khi items rỗng |
| TC_REQ_CREATE_04 | Phiếu được tạo với status mặc định 'Chưa duyệt' | `req.body = {REQUEST_SLIP_Name:'Yêu cầu mới', USER_ID:1, items:[]}`, DAO trả về `{slipId:8}` | `{slipId:8}` | DAO hardcode status = 'Chưa duyệt' khi INSERT |
| TC_REQ_CREATE_05 | Giáo viên tạo nhiều phiếu yêu cầu khác nhau (mỗi lần tạo 1 phiếu) | Gọi 2 lần với `USER_ID:1`, DAO trả về `{slipId:5}` rồi `{slipId:6}` | Lần 1: `{slipId:5}`, Lần 2: `{slipId:6}` | Mỗi lần tạo ra slipId khác nhau |
| TC_REQ_CREATE_06 | CheckDB: Dao.requestSlip được gọi với đúng req.body (không biến đổi) | `req.body = {REQUEST_SLIP_Name:'Test', USER_ID:1, items:[]}` | `Dao.requestSlip` được gọi với đúng object req.body | Service không biến đổi dữ liệu trước khi gọi DAO |
| TC_REQ_CREATE_07 | CheckDB: Dao.requestSlip được gọi đúng 1 lần | DAO trả về `{slipId:1}` | `Dao.requestSlip` được gọi đúng 1 lần | Không gọi thừa |
| TC_REQ_CREATE_08 | Trả về error khi transaction INSERT REQUEST_SLIP thất bại | DAO reject với `new Error('Transaction failed: INSERT SLIP error')` | Trả về error object | Transaction rollback khi lỗi bước 1 |
| TC_REQ_CREATE_09 | Trả về error khi transaction INSERT REQUEST_ITEM thất bại | DAO reject với `new Error('Transaction failed: INSERT ITEM error')` | Trả về error object | Transaction rollback khi lỗi bước 2 |
| TC_REQ_CREATE_10 | Trả về error khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi, hệ thống không crash |
| TC_REQ_CREATE_11 | Trả về slipId là số nguyên dương | DAO trả về `{slipId:99}` | `result.slipId === 99` và `typeof result.slipId === 'number'` | Kiểm tra kiểu dữ liệu slipId |

---

## 2. getRequestSlip()

> **Nghiệp vụ:** Ban giám hiệu / Ban quản lý xem toàn bộ danh sách phiếu yêu cầu để xét duyệt. Kết quả JOIN 3 bảng: REQUEST_SLIP + REQUEST_ITEM + USER. Sắp xếp theo ngày tạo DESC (mới nhất trước). Hiển thị cả phiếu `'Chưa duyệt'`, `'Đã duyệt'`, `'Từ chối'`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_REQ_GETALL_01 | Lấy danh sách khi có nhiều phiếu với các trạng thái khác nhau | DAO trả về `[{REQUEST_SLIP_ID:3, REQUEST_SLIP_Status:'Chưa duyệt', USER_FullName:'Nguyễn Văn Tuấn'}, {REQUEST_SLIP_ID:2, REQUEST_SLIP_Status:'Đã duyệt', USER_FullName:'Lê Đình Hưng'}, {REQUEST_SLIP_ID:1, REQUEST_SLIP_Status:'Từ chối', USER_FullName:'Nguyễn Văn Tuấn'}]` | Mảng 3 phần tử, sắp xếp theo ngày tạo DESC | Happy path: có đủ 3 trạng thái |
| TC_REQ_GETALL_02 | Lấy danh sách chỉ có phiếu 'Chưa duyệt' (hệ thống mới) | DAO trả về `[{REQUEST_SLIP_ID:1, REQUEST_SLIP_Status:'Chưa duyệt'}]` | Mảng 1 phần tử | Chưa có phiếu nào được xử lý |
| TC_REQ_GETALL_03 | Trả về mảng rỗng khi chưa có phiếu yêu cầu nào | DAO trả về `[]` | `[]` | Hệ thống mới, chưa có yêu cầu |
| TC_REQ_GETALL_04 | Trả về đúng cấu trúc dữ liệu JOIN 3 bảng | DAO trả về `[{REQUEST_SLIP_ID:1, REQUEST_SLIP_Name:'Yêu cầu mua máy chiếu', REQUEST_SLIP_RequestDate:'2024-06-01', REQUEST_SLIP_Status:'Chưa duyệt', REQUEST_SLIP_Description:'Cần thêm máy chiếu', REQUEST_SLIP_ApproveNotes:null, REQUESTER_ID:1, USER_FullName:'Nguyễn Văn Tuấn', REQUEST_ITEM_ID:1, EQUIPMENT_ITEM_Name:'Máy chiếu Epson', EQUIPMENT_TYPE_Name:'Projector', REQUEST_ITEM_Status:'Chờ duyệt'}]` | Object có đủ field từ 3 bảng | Kiểm tra data integrity sau JOIN |
| TC_REQ_GETALL_05 | Phiếu có REQUEST_SLIP_ApproveNotes = null khi chưa duyệt | DAO trả về `[{REQUEST_SLIP_ID:1, REQUEST_SLIP_Status:'Chưa duyệt', REQUEST_SLIP_ApproveNotes:null}]` | `result[0].REQUEST_SLIP_ApproveNotes === null` | Ghi chú phê duyệt chỉ có sau khi xử lý |
| TC_REQ_GETALL_06 | Phiếu có REQUEST_SLIP_ApproveNotes sau khi đã duyệt | DAO trả về `[{REQUEST_SLIP_ID:2, REQUEST_SLIP_Status:'Đã duyệt', REQUEST_SLIP_ApproveNotes:'Đồng ý mua thêm thiết bị'}]` | `result[0].REQUEST_SLIP_ApproveNotes` có giá trị | Ghi chú phê duyệt được lưu |
| TC_REQ_GETALL_07 | Phiếu bị từ chối có ghi chú lý do | DAO trả về `[{REQUEST_SLIP_ID:3, REQUEST_SLIP_Status:'Từ chối', REQUEST_SLIP_ApproveNotes:'Ngân sách không đủ'}]` | `result[0].REQUEST_SLIP_ApproveNotes === 'Ngân sách không đủ'` | Lý do từ chối được lưu trong ApproveNotes |
| TC_REQ_GETALL_08 | Phiếu có nhiều items (LEFT JOIN → nhiều dòng cùng REQUEST_SLIP_ID) | DAO trả về `[{REQUEST_SLIP_ID:1, EQUIPMENT_ITEM_Name:'Máy chiếu'}, {REQUEST_SLIP_ID:1, EQUIPMENT_ITEM_Name:'Laptop'}]` | Mảng 2 phần tử cùng REQUEST_SLIP_ID=1 | LEFT JOIN tạo nhiều dòng cho 1 phiếu |
| TC_REQ_GETALL_09 | CheckDB: Dao.getAllRequestSlip được gọi đúng 1 lần | DAO mock trả về `[]` | `Dao.getAllRequestSlip` được gọi đúng 1 lần | Không gọi thừa |
| TC_REQ_GETALL_10 | Trả về error object khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |
| TC_REQ_GETALL_11 | Trả về error object khi DB timeout | DAO reject với `new Error('Query timeout')` | Trả về error object | Xử lý timeout gracefully |

---

## 3. approvedSlip()

> **Nghiệp vụ:** Ban giám hiệu / Ban quản lý phê duyệt hoặc từ chối phiếu yêu cầu. DAO thực hiện transaction:
> 1. UPDATE REQUEST_SLIP: đặt `REQUEST_SLIP_Status` và `REQUEST_SLIP_ApproveNotes`
> 2. Nếu có `data.items` → UPDATE từng EQUIPMENT_ITEM: đặt `EQUIPMENT_ITEM_Status = 'Có sẵn'` theo tên thiết bị
> 3. Nếu không có items → commit ngay sau bước 1
> `req.body` phải có: `{REQUEST_SLIP_ID, REQUEST_SLIP_Status, REQUEST_SLIP_ApproveNotes, items}`

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_REQ_APPROVE_01 | Phê duyệt phiếu thành công — status → 'Đã duyệt', thiết bị → 'Có sẵn' | `req.body = {REQUEST_SLIP_ID:1, REQUEST_SLIP_Status:'Đã duyệt', REQUEST_SLIP_ApproveNotes:'Đồng ý mua thêm thiết bị', items:[{EQUIPMENT_ITEM_Name:'Máy chiếu Epson'}]}`, DAO trả về `{message:'Duyệt phiếu & cập nhật thiết bị thành công'}` | `{message:'Duyệt phiếu & cập nhật thiết bị thành công'}` | Happy path: duyệt phiếu có items |
| TC_REQ_APPROVE_02 | Từ chối phiếu — status → 'Từ chối', ghi lý do | `req.body = {REQUEST_SLIP_ID:2, REQUEST_SLIP_Status:'Từ chối', REQUEST_SLIP_ApproveNotes:'Ngân sách không đủ', items:[]}`, DAO trả về `{message:'Duyệt phiếu (không có item)'}` | `{message:'Duyệt phiếu (không có item)'}` | Từ chối không cần cập nhật thiết bị |
| TC_REQ_APPROVE_03 | Phê duyệt phiếu có nhiều thiết bị — tất cả thiết bị → 'Có sẵn' | `req.body = {REQUEST_SLIP_ID:3, REQUEST_SLIP_Status:'Đã duyệt', REQUEST_SLIP_ApproveNotes:'OK', items:[{EQUIPMENT_ITEM_Name:'Laptop Dell'}, {EQUIPMENT_ITEM_Name:'Loa JBL'}]}`, DAO trả về `{message:'Duyệt phiếu & cập nhật thiết bị thành công'}` | `{message:'Duyệt phiếu & cập nhật thiết bị thành công'}` | Cập nhật nhiều thiết bị cùng lúc |
| TC_REQ_APPROVE_04 | Phê duyệt phiếu không có items — chỉ cập nhật status phiếu | `req.body = {REQUEST_SLIP_ID:4, REQUEST_SLIP_Status:'Đã duyệt', REQUEST_SLIP_ApproveNotes:'Đồng ý', items:[]}`, DAO trả về `{message:'Duyệt phiếu (không có item)'}` | `{message:'Duyệt phiếu (không có item)'}` | DAO commit ngay sau UPDATE SLIP khi items rỗng |
| TC_REQ_APPROVE_05 | Từ chối phiếu với ghi chú lý do chi tiết | `req.body = {REQUEST_SLIP_ID:5, REQUEST_SLIP_Status:'Từ chối', REQUEST_SLIP_ApproveNotes:'Thiết bị đã có đủ trong kho, không cần mua thêm', items:[]}`, DAO trả về `{message:'Duyệt phiếu (không có item)'}` | `{message:'Duyệt phiếu (không có item)'}` | Ghi chú lý do từ chối chi tiết |
| TC_REQ_APPROVE_06 | Phê duyệt phiếu đã bị từ chối trước đó (đổi status ngược lại) | `req.body = {REQUEST_SLIP_ID:6, REQUEST_SLIP_Status:'Đã duyệt', REQUEST_SLIP_ApproveNotes:'Xem xét lại, đồng ý', items:[]}`, DAO trả về `{message:'Duyệt phiếu (không có item)'}` | `{message:'Duyệt phiếu (không có item)'}` | Có thể đổi status từ 'Từ chối' → 'Đã duyệt' |
| TC_REQ_APPROVE_07 | CheckDB: Dao.approvedSlip được gọi với đúng req.body (không biến đổi) | `req.body = {REQUEST_SLIP_ID:1, REQUEST_SLIP_Status:'Đã duyệt', REQUEST_SLIP_ApproveNotes:'OK', items:[]}` | `Dao.approvedSlip` được gọi với đúng object req.body | Service không biến đổi dữ liệu |
| TC_REQ_APPROVE_08 | CheckDB: Dao.approvedSlip được gọi đúng 1 lần | DAO trả về `{message:'Duyệt phiếu (không có item)'}` | `Dao.approvedSlip` được gọi đúng 1 lần | Không gọi thừa |
| TC_REQ_APPROVE_09 | Trả về error khi transaction UPDATE REQUEST_SLIP thất bại | DAO reject với `new Error('Transaction failed: UPDATE SLIP error')` | Trả về error object | Transaction rollback khi lỗi bước 1 |
| TC_REQ_APPROVE_10 | Trả về error khi transaction UPDATE EQUIPMENT_ITEM thất bại | DAO reject với `new Error('Transaction failed: UPDATE ITEM error')` | Trả về error object | Transaction rollback khi lỗi bước 2 |
| TC_REQ_APPROVE_11 | Trả về error khi REQUEST_SLIP_ID không tồn tại trong DB | DAO reject với `new Error('Slip ID not found')` | Trả về error object | Phiếu không tồn tại |
| TC_REQ_APPROVE_12 | Trả về error khi DB mất kết nối (không throw) | DAO reject với `new Error('ECONNREFUSED')` | Trả về error object | try/catch bắt lỗi |

---

## Tổng kết request.service.js

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---|---|---|
| `requestSlip()` | 11 | CAO | Giáo viên tạo phiếu yêu cầu mua thiết bị |
| `getRequestSlip()` | 11 | TRUNG BÌNH | Ban quản lý xem danh sách phiếu để xét duyệt |
| `approvedSlip()` | 12 | CAO | Phê duyệt / từ chối phiếu, cập nhật status thiết bị |
| **TỔNG** | **34** | | |

> **Lưu ý nghiệp vụ quan trọng:**
> - Status phiếu yêu cầu: `'Chưa duyệt'` → `'Đã duyệt'` hoặc `'Từ chối'`
> - `requestSlip` hardcode status = `'Chưa duyệt'` khi tạo — không nhận status từ client
> - `approvedSlip` cập nhật EQUIPMENT_ITEM theo **tên thiết bị** (`EQUIPMENT_ITEM_Name`), không theo ID
> - Khi duyệt có items: tất cả thiết bị trong phiếu được đặt status = `'Có sẵn'`
> - `getRequestSlip` dùng LEFT JOIN → 1 phiếu có nhiều items sẽ tạo nhiều dòng kết quả
> - `getAllRequestSlip` trong DAO không nhận tham số (service truyền `req.body` nhưng DAO bỏ qua)


---

## 1.5. Execution Report — request.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/request.service.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | _(điền sau khi chạy)_ |
| Tests failed | _(điền sau khi chạy)_ |
| Thời gian chạy | _(điền sau khi chạy)_ |

### Chi tiết pass/fail theo nhóm

| Nhóm hàm | Số TC | Passed | Failed |
|---|---|---|---|
| `requestSlip()` | 11 | | |
| `getRequestSlip()` | 11 | | |
| `approvedSlip()` | 12 | | |
| **TỔNG** | **34** | | |

### Screenshot — Terminal output

> 📸 **[CHỤP MÀN HÌNH 1]**
> Chụp toàn bộ terminal từ dòng `PASS src/__tests__/service/request.service.test.js`
> đến dòng `Tests: 34 passed, 34 total`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — request.service.js

> **Lệnh chạy:**
> ```bash
> npx jest src/__tests__/service/request.service.test.js --coverage --verbose
> ```
> **HTML report:** Mở file `backend/coverage/lcov-report/request/request.service.js.html` bằng browser

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---|---|---|---|
| `request.service.js` | _(điền)_ | _(điền)_ | _(điền)_ | _(điền)_ |

### Mục tiêu coverage

| Chỉ số | Mục tiêu | Thực tế | Đạt? |
|---|---|---|---|
| Statements | ≥ 80% | | |
| Branches | ≥ 80% | | |
| Functions | ≥ 80% | | |
| Lines | ≥ 80% | | |

### Cách lấy số liệu để điền vào 2 bảng trên

Sau khi chạy lệnh `--coverage`, mở file:
```
backend/coverage/lcov-report/request/request.service.js.html
```
Nhìn vào 4 con số ở đầu trang → điền vào bảng.

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[CHỤP MÀN HÌNH 2]**
> Chụp bảng text coverage xuất hiện cuối terminal sau khi chạy `--coverage`
> (Bảng có dạng: `File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines`)

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[CHỤP MÀN HÌNH 3]**
> Mở `backend/coverage/lcov-report/index.html` bằng browser → chụp trang tổng quan

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết request.service.js)

> 📸 **[CHỤP MÀN HÌNH 4]**
> Trong trang HTML, click vào thư mục `request` → click vào `request.service.js`
> Chụp màn hình trang chi tiết (dòng xanh = covered, đỏ = not covered)

_(Dán ảnh vào đây)_


---

# UNIT TEST DETAIL - facility-manager.guard.ts

> **File:** `frontend/src/app/guards/facility-manager.guard.ts`
> **Framework:** Jasmine + Karma (Angular TestBed)
> **Mock:** `AuthService` được mock bằng `jasmine.createSpyObj`
>
> **Nghiệp vụ hệ thống:**
> Guard bảo vệ các route dành riêng cho **Ban quản lý cơ sở vật chất** (`Banquảnlý`):
> - `/request` — Xem danh sách yêu cầu mua sắm thiết bị
> - `/them-cap-nhat` — Thêm/cập nhật thiết bị và phòng
> - `/account` — Quản lý tài khoản người dùng
> - `/quan-ly` — Trang quản lý tổng thể
>
> **Logic guard:**
> - Gọi `authService.isFacilityManager()` → trả về `true` nếu role = `'Banquảnlý'`
> - `isFacilityManager()` gọi `getRole()` → parse token từ sessionStorage
> - Token format: `{ID}{random20chars}{normalizedRole}` — role ở cuối token
> - `getRole()` kiểm tra token có kết thúc bằng `'Banquảnlý'` không
> - Nếu `true` → cho phép truy cập route
> - Nếu `false` → chặn truy cập (trả về `false`)
>
> **Các role trong hệ thống:** `'Giáoviên'` | `'Banquảnlý'` | `'Bangiámhiệu'`

---

## facilityManagerGuard(route, state)

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_FM_GUARD_01 | Cho phép truy cập khi user là Ban quản lý (isFacilityManager = true) | `authService.isFacilityManager()` trả về `true` | Guard trả về `true` | Happy path: đúng role được phép |
| TC_FM_GUARD_02 | Chặn truy cập khi user là Giáo viên (không phải Ban quản lý) | `authService.isFacilityManager()` trả về `false` (role = `'Giáoviên'`) | Guard trả về `false` | Giáo viên không được vào trang quản lý |
| TC_FM_GUARD_03 | Chặn truy cập khi user là Ban giám hiệu (không phải Ban quản lý) | `authService.isFacilityManager()` trả về `false` (role = `'Bangiámhiệu'`) | Guard trả về `false` | Ban giám hiệu không được vào trang quản lý cơ sở |
| TC_FM_GUARD_04 | Chặn truy cập khi chưa đăng nhập (token = null) | `authService.isFacilityManager()` trả về `false` (token = null → getRole() = null) | Guard trả về `false` | User chưa đăng nhập không được truy cập |
| TC_FM_GUARD_05 | Chặn truy cập khi token hết hạn hoặc bị xóa khỏi sessionStorage | `authService.isFacilityManager()` trả về `false` (sessionStorage rỗng) | Guard trả về `false` | Token không còn trong sessionStorage |
| TC_FM_GUARD_06 | Chặn truy cập khi token không hợp lệ (không kết thúc bằng role hợp lệ) | `authService.isFacilityManager()` trả về `false` (token không match bất kỳ role nào) | Guard trả về `false` | Token bị giả mạo hoặc corrupt |
| TC_FM_GUARD_07 | Guard gọi đúng `authService.isFacilityManager()` (không gọi method khác) | `authService.isFacilityManager()` được spy | `isFacilityManager` được gọi đúng 1 lần | Guard chỉ dùng isFacilityManager, không dùng isTeacher hay isAdmin |
| TC_FM_GUARD_08 | Bảo vệ route `/request` — chỉ Ban quản lý được vào | `route.url = '/request'`, `authService.isFacilityManager()` trả về `true` | Guard trả về `true` | Route xem yêu cầu mua sắm |
| TC_FM_GUARD_09 | Bảo vệ route `/them-cap-nhat` — chỉ Ban quản lý được vào | `route.url = '/them-cap-nhat'`, `authService.isFacilityManager()` trả về `true` | Guard trả về `true` | Route thêm/cập nhật thiết bị |
| TC_FM_GUARD_10 | Bảo vệ route `/account` — chỉ Ban quản lý được vào | `route.url = '/account'`, `authService.isFacilityManager()` trả về `true` | Guard trả về `true` | Route quản lý tài khoản |
| TC_FM_GUARD_11 | Bảo vệ route `/quan-ly` — chỉ Ban quản lý được vào | `route.url = '/quan-ly'`, `authService.isFacilityManager()` trả về `true` | Guard trả về `true` | Route quản lý tổng thể |
| TC_FM_GUARD_12 | Giáo viên bị chặn khi cố truy cập `/them-cap-nhat` | `route.url = '/them-cap-nhat'`, `authService.isFacilityManager()` trả về `false` | Guard trả về `false` | Giáo viên không được thêm/sửa thiết bị |
| TC_FM_GUARD_13 | Giáo viên bị chặn khi cố truy cập `/account` | `route.url = '/account'`, `authService.isFacilityManager()` trả về `false` | Guard trả về `false` | Giáo viên không được quản lý tài khoản |
| TC_FM_GUARD_14 | Guard trả về kiểu boolean (không phải Observable hay Promise) | `authService.isFacilityManager()` trả về `true` | `typeof result === 'boolean'` | Guard là synchronous, trả về boolean trực tiếp |
| TC_FM_GUARD_15 | Guard inject AuthService đúng cách qua Angular DI | `TestBed.configureTestingModule` với mock AuthService | Guard được tạo thành công, không throw lỗi DI | Kiểm tra dependency injection |

---

## Tổng kết facility-manager.guard.ts

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---|---|---|
| `facilityManagerGuard(route, state)` | 15 | CAO | Bảo vệ 4 route quản lý cơ sở vật chất |
| **TỔNG** | **15** | | |

> **Lưu ý nghiệp vụ quan trọng:**
> - Guard chỉ kiểm tra `isFacilityManager()` — không redirect, chỉ trả về `true/false`
> - `isFacilityManager()` phụ thuộc vào `getRole()` → phụ thuộc vào token trong sessionStorage
> - Token format: `{ID}{20 random chars}{normalizedRole}` — role ở cuối, không có khoảng trắng
> - Role `'Banquảnlý'` là normalize của `'Ban quản lý'` (xóa space)
> - Guard này **không** bảo vệ route `/approved` và `/thong-ke-bao-cao` — đó là `adminGuard`
> - Trong Angular, guard `CanActivateFn` là function, không phải class → test qua `TestBed.runInInjectionContext`

---

## Setup mẫu cho Jasmine/Karma

```typescript
// frontend/src/app/guards/facility-manager.guard.spec.ts
import { TestBed } from '@angular/core/testing'
import { CanActivateFn } from '@angular/router'
import { facilityManagerGuard } from './facility-manager.guard'
import { AuthService } from '../services/auth.service'

describe('facilityManagerGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => facilityManagerGuard(...guardParameters))

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['isFacilityManager'])

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
  })

  // TC_FM_GUARD_01
  it('should return true when user is Facility Manager', () => {
    mockAuthService.isFacilityManager.and.returnValue(true)
    const result = executeGuard({} as any, {} as any)
    expect(result).toBeTrue()
  })

  // TC_FM_GUARD_02
  it('should return false when user is Teacher', () => {
    mockAuthService.isFacilityManager.and.returnValue(false)
    const result = executeGuard({} as any, {} as any)
    expect(result).toBeFalse()
  })
})
```


---

## 1.5. Execution Report — facility-manager.guard.ts

> **Lệnh chạy:**
> ```bash
> node node_modules/@angular/cli/bin/ng.js test --include="src/app/guards/facility-manager.guard.spec.ts" --watch=false --browsers=ChromeHeadless --no-progress
> ```
> *(Chạy từ thư mục `frontend`)*

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | _(điền sau khi chạy)_ |
| Tests failed | _(điền sau khi chạy)_ |
| Thời gian chạy | _(điền sau khi chạy)_ |

### Chi tiết pass/fail theo nhóm

| Nhóm | Số TC | Passed | Failed |
|---|---|---|---|
| Kiểm tra quyền truy cập theo role | 6 | | |
| Kiểm tra interaction với AuthService | 1 | | |
| Kiểm tra bảo vệ từng route | 6 | | |
| Kiểm tra kiểu dữ liệu và DI | 2 | | |
| **TỔNG** | **15** | | |

### Screenshot — Terminal output

> 📸 **[CHỤP MÀN HÌNH 1]**
> Chụp toàn bộ terminal từ dòng `Chrome Headless ... Connected`
> đến dòng `TOTAL: 15 SUCCESS`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — facility-manager.guard.ts

> **Lệnh chạy:**
> ```bash
> node node_modules/@angular/cli/bin/ng.js test --include="src/app/guards/facility-manager.guard.spec.ts" --watch=false --browsers=ChromeHeadless --code-coverage --no-progress
> ```
> *(Chạy từ thư mục `frontend`)*
> **HTML report:** Mở file `frontend/coverage/index.html` bằng browser

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---|---|---|---|
| `facility-manager.guard.ts` | _(điền)_ | _(điền)_ | _(điền)_ | _(điền)_ |

### Mục tiêu coverage

| Chỉ số | Mục tiêu | Thực tế | Đạt? |
|---|---|---|---|
| Statements | ≥ 90% | | |
| Branches | ≥ 90% | | |
| Functions | ≥ 90% | | |
| Lines | ≥ 90% | | |

### Cách lấy số liệu để điền vào 2 bảng trên

Sau khi chạy lệnh `--code-coverage`, mở file:
```
frontend/coverage/index.html
```
Tìm dòng `facility-manager.guard.ts` → lấy 4 con số % → điền vào bảng.

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[CHỤP MÀN HÌNH 2]**
> Chụp phần cuối terminal sau khi chạy `--code-coverage`
> (Phần có dạng: `Statements : XX% | Branches : XX% | Functions : XX% | Lines : XX%`)

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[CHỤP MÀN HÌNH 3]**
> Mở `frontend/coverage/index.html` bằng browser → chụp trang tổng quan

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết facility-manager.guard.ts)

> 📸 **[CHỤP MÀN HÌNH 4]**
> Trong trang HTML, tìm và click vào `facility-manager.guard.ts`
> Chụp màn hình trang chi tiết (dòng xanh = covered, đỏ = not covered)

_(Dán ảnh vào đây)_
