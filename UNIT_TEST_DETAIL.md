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

> 📸 **[SCREENSHOT 7]** Mở `backend/coverage/lcov-report/index.html` bằng browser → chụp trang tổng quan

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
> npm test -- src/__tests__/service/equipment.service.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | 68 passed / 68 total |
| Tests failed | 0 |
| Thời gian chạy | 1.305 s |

### Chi tiết pass/fail theo nhóm

| Nhóm hàm | Số TC | Passed | Failed |
|---|---|---|---|
| `findAllEquipment()` | 9 | 9 | 0 |
| `findOneEquipment()` | 11 | 11 | 0 |
| `findAllRoom()` | 9 | 9 | 0 |
| `createEquipment()` | 13 | 13 | 0 |
| `updateEquipment()` | 15 | 15 | 0 |
| `deleteEquipment()` | 11 | 11 | 0 |
| **TỔNG** | **68** | **68** | **0** |

### Screenshot — Terminal output

> 📸 **[SCREENSHOT 5]** Chụp toàn bộ terminal từ dòng `PASS src/__tests__/...` đến dòng `Tests: X passed, X total`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — equipment.service.js

> **Lệnh chạy:**
> ```bash
> npm test -- src/__tests__/service/equipment.service.test.js --coverage --collectCoverageFrom=src/module/equipment/equipment.service.js --coverageReporters=text --coverageReporters=html
> ```
> **HTML report:** `backend/coverage/lcov-report/index.html`

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---|---|---|---|
| `equipment.service.js` | 100% | 100% | 100% | 100% |

### Mục tiêu coverage

| Chỉ số | Mục tiêu | Thực tế | Đạt? |
|---|---|---|---|
| Statements | ≥ 80% | 100% | ✅ |
| Branches | ≥ 80% | 100% | ✅ |
| Functions | ≥ 80% | 100% | ✅ |
| Lines | ≥ 80% | 100% | ✅ |

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[SCREENSHOT 6]** Chụp bảng `File | % Stmts | % Branch | % Funcs | % Lines` trong terminal

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT 7]** Mở `backend/coverage/index.html` bằng browser → chụp trang tổng quan

_(Nếu dùng đúng lệnh ở trên, file HTML sẽ nằm ở `backend/coverage/lcov-report/index.html`.)_

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết equipment.service.js)

> 📸 **[SCREENSHOT 8]** Click vào `equipment.service.js` trong trang HTML → chụp chi tiết từng dòng

_(Dán ảnh vào đây)_

---

# UNIT TEST DETAIL - user.dao.js

> **File:** `backend/src/module/user/user.dao.js`
> **Module/Layer:** `UserDAO` (DAO Layer — truy cập DB MySQL qua `db.query`)
> **Framework:** Jest | **Mock:** `jest.mock('../../config/configDB')` hoặc mock trực tiếp `db.query`
> **Nghiệp vụ hệ thống:** Quản trị người dùng trong hệ thống quản lý thiết bị trường học. Ràng buộc nghiệp vụ chính: **username/email duy nhất**, trạng thái tài khoản `Active/Inactive`, role thuộc 4 nhóm: `Giáo viên`, `Ban giám hiệu`, `Ban quản lý`, `Admin`.

---

## 1. findAll()

> **Nghiệp vụ:** Admin xem toàn bộ danh sách người dùng để quản trị. DAO hiện tại query thẳng `SELECT * FROM datn.USER` (không filter theo role/status).

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_UDAO_FINDALL_01 | Trả về danh sách user khi DB có nhiều bản ghi (nhiều role) | Mock `db.query(sql, cb)` gọi `cb(null, [u1,u2,u3])` với các role khác nhau | Promise resolve mảng `[u1,u2,u3]` | CheckDB: `db.query` gọi 1 lần với `SELECT * FROM datn.USER` |
| TC_UDAO_FINDALL_02 | Trả về mảng rỗng khi bảng USER chưa có dữ liệu | `db.query` trả về `[]` | Resolve `[]` | Hệ thống mới khởi tạo |
| TC_UDAO_FINDALL_03 | Bao gồm cả user `Active` và `Inactive` (DAO không lọc) | `db.query` trả về 2 record: 1 Active, 1 Inactive | Resolve mảng chứa cả 2 record | Business: admin vẫn cần thấy user bị khóa |
| TC_UDAO_FINDALL_04 | Reject khi DB trả lỗi (mất kết nối / syntax error) | `db.query` gọi `cb(err)` với `err = new Error('ECONNREFUSED')` | Promise reject đúng `err` | Negative path — DAO không bắt lỗi, chỉ reject |
| TC_UDAO_FINDALL_05 | Verify SQL đúng (không có WHERE/ORDER BY ngoài ý muốn) | Gọi `findAll(anyValue)` với `data` bất kỳ | `db.query` nhận đúng string `SELECT * FROM datn.USER` | Param `data` hiện không dùng — testcase để phát hiện thay đổi ngoài ý muốn |
| TC_UDAO_FINDALL_06 | Xử lý dữ liệu lớn (stress data shape) | `db.query` trả về mảng 1000 rows (mock) | Resolve mảng 1000 rows | Gợi ý: test chỉ kiểm `length` và 1–2 record mẫu |
| TC_UDAO_FINDALL_07 | Không mutate kết quả DB | `db.query` trả về object có field lạ (ví dụ `EXTRA_FIELD`) | Resolve giữ nguyên object/field | Đảm bảo DAO không tự map/đổi field |
| TC_UDAO_FINDALL_08 | Trường hợp `results` bị `null` (DB driver trả về bất thường) | `db.query` gọi `cb(null, null)` | Resolve `null` | Robustness: code hiện `resolve(results)` nên sẽ resolve `null` |

---

## 2. findOneUser(id)

> **Nghiệp vụ:** Admin xem chi tiết 1 user theo ID để chỉnh sửa/khóa tài khoản. DAO hiện build SQL bằng template string: ``SELECT * FROM datn.USER WHERE ID = ${id}``.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_UDAO_FINDONE_01 | Trả về đúng user khi ID tồn tại | `id = 1`; `db.query` trả về `[user]` | Resolve `user` (phần tử đầu tiên) | CheckDB: SQL chứa `WHERE ID = 1` |
| TC_UDAO_FINDONE_02 | Trả về `undefined` khi không có user với ID đó | `id = 9999`; `db.query` trả về `[]` | Resolve `undefined` | Do `resolve(results[0])` |
| TC_UDAO_FINDONE_03 | Nếu DB trả về nhiều dòng (data lỗi) thì lấy dòng đầu | `id = 1`; `db.query` trả về `[u1,u2]` | Resolve `u1` | Username/ID should unique, testcase phòng dữ liệu bẩn |
| TC_UDAO_FINDONE_04 | Reject khi DB trả lỗi | `id=1`; `db.query` gọi `cb(err)` | Promise reject `err` | Negative path |
| TC_UDAO_FINDONE_05 | ID là string số (từ URL) vẫn query được | `id = '5'`; `db.query` trả về `[user]` | Resolve `user` | Controller thường truyền `req.params.id` dạng string |
| TC_UDAO_FINDONE_06 | ID = 0 (biên dưới) thường không có dữ liệu | `id = 0`; `db.query` trả về `[]` | Resolve `undefined` | Edge case |
| TC_UDAO_FINDONE_07 | ID âm (input bất hợp lệ) | `id = -1`; `db.query` trả về `[]` hoặc DB error | Resolve `undefined` (nếu results=[]) hoặc reject err | Notes: nên validate ở service/controller |
| TC_UDAO_FINDONE_08 | ID không phải số gây lỗi SQL (ví dụ chữ) | `id = 'abc'`; `db.query` trả về `err` (SQL parse error/unknown column) | Reject `err` | **Security/validation:** hiện query không parameterized |
| TC_UDAO_FINDONE_09 | ID = `undefined` tạo SQL sai và phải reject | `id = undefined`; `db.query` trả lỗi | Reject `err` | Robustness: nên reject sớm trước khi query |
| TC_UDAO_FINDONE_10 | Phát hiện rủi ro SQL injection qua `id` | `id = "1 OR 1=1"`; mock chỉ verify SQL string được build | Expected (đúng nghiệp vụ): không cho phép/parameterized; (hiện tại): SQL bị chèn | Notes: testcase dạng **security regression** để yêu cầu fix (dùng `WHERE ID = ?`) |

---

## 3. createUser(data)

> **Nghiệp vụ:** Admin tạo user mới. Ràng buộc quan trọng: `USER_UserName` và `USER_Email` **không được trùng**. Nếu không truyền `USER_Status` thì mặc định `'Active'`. DAO chạy 2 bước: (1) `SELECT` kiểm tra trùng, (2) `INSERT` nếu không trùng.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_UDAO_CREATE_01 | Tạo user mới thành công (happy path) | `data` đầy đủ; mock check query trả `[]`; mock insert query trả `{insertId: 10}` | Resolve `{id: 10}` | CheckDB: gọi `db.query` 2 lần: check + insert |
| TC_UDAO_CREATE_02 | Không cho tạo khi username đã tồn tại | Check query trả `[{ID: 1}]` | Reject `{message:'Username hoặc Email đã tồn tại'}` | Business: username unique |
| TC_UDAO_CREATE_03 | Không cho tạo khi email đã tồn tại | Check query trả `[{ID: 2}]` (trùng email) | Reject `{message:'Username hoặc Email đã tồn tại'}` | Business: email unique |
| TC_UDAO_CREATE_04 | Không cho tạo khi cả username và email đều trùng | Check query trả `[{ID: 3}]` | Reject `{message:'Username hoặc Email đã tồn tại'}` | Kỳ vọng message giống nhau cho cả 2 trường hợp |
| TC_UDAO_CREATE_05 | Reject khi DB lỗi ở bước kiểm tra trùng | Check query callback `cb(err)` | Reject `err` | Không thực hiện INSERT nếu check lỗi |
| TC_UDAO_CREATE_06 | Reject khi DB lỗi ở bước INSERT | Check query trả `[]`; Insert query callback `cb(err)` | Reject `err` | Negative path khi INSERT fail |
| TC_UDAO_CREATE_07 | Dùng query parameterized cho bước check (chống SQL injection) | `data.USER_UserName = "a' OR 1=1 --"`; gọi `createUser(data)` | `db.query` được gọi với `checkSql` + params `[username, email]` | Test này tập trung **verify param array** chứ không quan tâm DB trả gì |
| TC_UDAO_CREATE_08 | Truyền đúng params cho INSERT theo đúng thứ tự field | `data` đầy đủ; mock insert success | Resolve `{id: <insertId>}`; verify param order | Param order: FullName, Email, PhoneNumber, UserName, Password, Role, Status |
| TC_UDAO_CREATE_09 | Default `USER_Status` = 'Active' khi không truyền | `data.USER_Status = undefined`; check pass; insert success | Resolve `{id: ...}`; verify param cuối là `'Active'` | Do `data.USER_Status || 'Active'` |
| TC_UDAO_CREATE_10 | Default `USER_Status` = 'Active' khi truyền chuỗi rỗng | `data.USER_Status = ''`; check pass; insert success | Insert param status = `'Active'` | Edge: chuỗi rỗng bị coi là falsy |
| TC_UDAO_CREATE_11 | Default `USER_Status` = 'Active' khi truyền `null` | `data.USER_Status = null`; check pass; insert success | Insert param status = `'Active'` | Edge: null falsy |
| TC_UDAO_CREATE_12 | Giữ nguyên `USER_Status='Inactive'` khi truyền explicit | `data.USER_Status = 'Inactive'`; check pass; insert success | Insert param status = `'Inactive'` | Business: cho phép tạo user bị khóa ngay |
| TC_UDAO_CREATE_13 | Reject khi thiếu `USER_UserName` (DB báo lỗi input/constraint) | `data.USER_UserName = undefined`; mock check query trả `err` | Reject `err` | DAO không validate — testcase mô phỏng lỗi DB |
| TC_UDAO_CREATE_14 | Reject khi thiếu `USER_Email` | `data.USER_Email = undefined`; mock check query trả `err` | Reject `err` | Tương tự TC_UDAO_CREATE_13 |
| TC_UDAO_CREATE_15 | Reject khi thiếu `USER_Password` (NOT NULL/validation DB) | check pass; insert query trả `err` | Reject `err` | Business: password bắt buộc |
| TC_UDAO_CREATE_16 | Reject khi role không hợp lệ (nếu DB có constraint) | `data.USER_Role='UnknownRole'`; insert trả `err` | Reject `err` | Nếu DB không constraint thì sẽ insert — ghi rõ giả định trong Notes |
| TC_UDAO_CREATE_17 | Xử lý race-condition: check pass nhưng insert bị trùng unique | check query trả `[]`; insert trả `err` với code `ER_DUP_ENTRY` | Reject `err` | Nên có unique index ở DB — trường hợp cạnh tranh |
| TC_UDAO_CREATE_18 | InsertId = 0/undefined (driver trả bất thường) | check pass; insert trả `{insertId: undefined}` | Resolve `{id: undefined}` | Robustness: hiện code không validate insertId |
| TC_UDAO_CREATE_19 | Không insert khi check phát hiện trùng (đảm bảo không gọi query lần 2) | check query trả `[{ID:1}]` | Reject message; verify insert query **không** được gọi | CheckDB: số lần gọi `db.query` chỉ là 1 |
| TC_UDAO_CREATE_20 | Không tự trim/normalize dữ liệu (giữ nguyên input) | `data.USER_UserName='  user  '`; check pass; insert success | Insert param username giữ nguyên `'  user  '` | Notes: Nên trim ở service/controller theo nghiệp vụ |

---

## 4. updateUser(data)

> **Nghiệp vụ:** Admin cập nhật thông tin user (đổi role, đổi status, reset password). Trả về `{message, affectedRows}` để UI biết có cập nhật được record nào không.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_UDAO_UPDATE_01 | Update thành công 1 bản ghi | `data` đầy đủ; `db.query` trả `{affectedRows: 1}` | Resolve `{message:'Cập nhật thành công', affectedRows: 1}` | Happy path |
| TC_UDAO_UPDATE_02 | ID không tồn tại → affectedRows = 0 | `data.ID = 9999`; `db.query` trả `{affectedRows: 0}` | Resolve `{message:'Cập nhật thành công', affectedRows: 0}` | Notes: nghiệp vụ có thể muốn message khác (không tìm thấy) |
| TC_UDAO_UPDATE_03 | Reject khi DB lỗi (ví dụ mất kết nối) | `db.query` trả `err` | Reject `err` | Negative path |
| TC_UDAO_UPDATE_04 | Verify query dùng placeholder và params đúng thứ tự | Gọi `updateUser(data)` | `db.query(sql, params, cb)` nhận đủ 8 params | Param order theo code: FullName, Email, Phone, UserName, Password, Role, Status, ID |
| TC_UDAO_UPDATE_05 | Khóa tài khoản (Active → Inactive) | `data.USER_Status='Inactive'`; `affectedRows=1` | Resolve success với `affectedRows=1` | Business: user Inactive sẽ không login được |
| TC_UDAO_UPDATE_06 | Mở khóa tài khoản (Inactive → Active) | `data.USER_Status='Active'`; `affectedRows=1` | Resolve success | Nghiệp vụ mở khóa |
| TC_UDAO_UPDATE_07 | Đổi role (Giáo viên → Ban quản lý) | `data.USER_Role='Ban quản lý'` | Resolve success | Đổi quyền truy cập |
| TC_UDAO_UPDATE_08 | Reject khi vi phạm unique (đổi username/email trùng) | `db.query` trả `err` code `ER_DUP_ENTRY` | Reject `err` | Nếu DB có unique constraint |
| TC_UDAO_UPDATE_09 | Reject khi status không hợp lệ (nếu DB constraint) | `data.USER_Status='Blocked'`; `db.query` trả `err` | Reject `err` | Nếu status chỉ cho phép Active/Inactive |
| TC_UDAO_UPDATE_10 | Reject khi role không hợp lệ (nếu DB constraint) | `data.USER_Role='UnknownRole'`; `db.query` trả `err` | Reject `err` | Ghi rõ giả định constraint DB |
| TC_UDAO_UPDATE_11 | Trường hợp `data.ID` là string số (từ UI) | `data.ID = '1'`; `affectedRows=1` | Resolve success | MySQL tự cast string số |
| TC_UDAO_UPDATE_12 | Thiếu ID → DB có thể update 0 row hoặc lỗi | `data.ID = undefined`; mock `db.query` trả `err` hoặc `{affectedRows:0}` | Reject `err` hoặc resolve affectedRows=0 | Notes: nên validate `ID` bắt buộc trước khi query |
| TC_UDAO_UPDATE_13 | Thiếu field NOT NULL (ví dụ USER_Email=null) gây lỗi DB | `data.USER_Email = null`; `db.query` trả `err` | Reject `err` | Business: email bắt buộc |
| TC_UDAO_UPDATE_14 | Dữ liệu quá dài (Data too long) | `data.USER_FullName` > max length; `db.query` trả `err` | Reject `err` | Testcase cover constraint độ dài |
| TC_UDAO_UPDATE_15 | Không mutate payload, chỉ truyền đúng params | `data` bất kỳ; mock success | Verify `params` đúng theo `data` | CheckDB: so sánh params array |

---

## 5. deleteUserById(id)

> **Nghiệp vụ:** Admin xóa vĩnh viễn user. Nếu DB có ràng buộc FK (phiếu mượn/phiếu yêu cầu) thì có thể lỗi `ER_ROW_IS_REFERENCED_2`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_UDAO_DELETE_01 | Xóa thành công 1 user | `id=1`; `db.query` trả `{affectedRows: 1}` | Resolve `{message:'Xóa người dùng thành công', affectedRows: 1}` | Happy path |
| TC_UDAO_DELETE_02 | ID không tồn tại → affectedRows=0 | `id=9999`; `db.query` trả `{affectedRows: 0}` | Resolve `{message:'Xóa người dùng thành công', affectedRows: 0}` | Notes: UI có thể hiển thị “không tìm thấy” |
| TC_UDAO_DELETE_03 | Reject khi DB lỗi | `db.query` trả `err` | Reject `err` | Negative path |
| TC_UDAO_DELETE_04 | Reject khi vi phạm khóa ngoại (đang có phiếu mượn/yêu cầu) | `db.query` trả `err` code `ER_ROW_IS_REFERENCED_2` | Reject `err` | Business: không nên xóa khi còn lịch sử ràng buộc |
| TC_UDAO_DELETE_05 | Verify query dùng placeholder `?` (chống injection) | `id = "1 OR 1=1"`; chỉ verify call args | `db.query` nhận params `[id]`, SQL không bị nối chuỗi | deleteUserById dùng param array nên an toàn hơn |
| TC_UDAO_DELETE_06 | ID là string số vẫn xóa được | `id='2'`; `affectedRows=1` | Resolve success | Input từ URL thường là string |
| TC_UDAO_DELETE_07 | ID = null/undefined gây lỗi DB | `id=undefined`; `db.query` trả `err` | Reject `err` | Robustness: nên validate id trước khi query |
| TC_UDAO_DELETE_08 | Xóa user role Admin (nghiệp vụ có thể cấm) | `id` thuộc user Admin; `affectedRows=1` | Resolve success | Notes: nếu nghiệp vụ cấm xóa admin, kiểm tra ở service/controller |
| TC_UDAO_DELETE_09 | Verify message trả về đúng string | `affectedRows=1` | `result.message === 'Xóa người dùng thành công'` | Đảm bảo UI hiển thị đúng |
| TC_UDAO_DELETE_10 | Không log/throw ngoài Promise khi DB error | `db.query` trả `err` | Promise reject, không crash process | Trong test có thể spy `console.error` nếu cần |

---

## 6. findUserNameAndPassword(data)

> **Nghiệp vụ:** Đăng nhập. Chỉ cho phép user `USER_Status = 'Active'`. DAO hiện build SQL bằng string interpolation (không parameterized) → có rủi ro SQL injection và lỗi khi username/password có ký tự `'`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_UDAO_LOGIN_01 | Trả về user khi đăng nhập đúng username/password và Active | `data={userName:'u',password:'p'}`; `db.query` trả `[userActive]` | Resolve `userActive` | Happy path |
| TC_UDAO_LOGIN_02 | Trả về `undefined` khi sai password | `db.query` trả `[]` | Resolve `undefined` | `resolve(results[0])` |
| TC_UDAO_LOGIN_03 | Trả về `undefined` khi username không tồn tại | `db.query` trả `[]` | Resolve `undefined` | Không tìm thấy user |
| TC_UDAO_LOGIN_04 | User Inactive không đăng nhập được (do WHERE lọc Active) | `data` hợp lệ nhưng DB không trả dòng nào | Resolve `undefined` | Nghiệp vụ: tài khoản bị khóa |
| TC_UDAO_LOGIN_05 | Reject khi DB trả lỗi (mất kết nối/timeout) | `db.query` trả `err` | Reject `err` | Negative path |
| TC_UDAO_LOGIN_06 | Verify SQL có điều kiện `USER_Status = 'Active'` | Gọi `findUserNameAndPassword({userName:'a',password:'b'})` | SQL string chứa `USER_Status = 'Active'` | CheckDB: dùng `expect(sql).toContain(...)` |
| TC_UDAO_LOGIN_07 | Verify SQL nhúng đúng username/password (string interpolation) | userName/password đơn giản | SQL chứa `USER_UserName = '...'; USER_Password = '...'` | Dùng để phát hiện thay đổi query |
| TC_UDAO_LOGIN_08 | Username có dấu nháy `'` gây lỗi SQL và phải reject | `userName="o'reilly"`; mock DB trả `err` | Reject `err` | Robustness: nên dùng parameterized query |
| TC_UDAO_LOGIN_09 | Password có dấu nháy `'` gây lỗi SQL và phải reject | `password="p'1"`; mock DB trả `err` | Reject `err` | Security/robustness |
| TC_UDAO_LOGIN_10 | Input rỗng (username/password = '') | `data={userName:'', password:''}`; DB trả `[]` | Resolve `undefined` | Notes: validation nên ở service/controller |
| TC_UDAO_LOGIN_11 | Username có khoảng trắng đầu/cuối (không trim) | `userName='  user  '`; DB trả `[]` | Resolve `undefined` | Nếu nghiệp vụ cho phép trim thì cần xử lý ở service |
| TC_UDAO_LOGIN_12 | Case-sensitivity phụ thuộc collation (đảm bảo DAO không tự lower/upper) | `userName='User'`; mock trả `[]` | Resolve `undefined` | Notes: behavior do DB collation quyết định |
| TC_UDAO_LOGIN_13 | Nếu DB trả nhiều dòng (data lỗi) thì lấy dòng đầu | `db.query` trả `[u1,u2]` | Resolve `u1` | Username nên unique; testcase phòng dữ liệu bẩn |
| TC_UDAO_LOGIN_14 | Phát hiện rủi ro SQL injection qua username | `userName="' OR 1=1 --"`; chỉ verify SQL string bị chèn | Expected (đúng): không cho phép; (hiện tại): SQL bị chèn | Testcase security — đề xuất fix sang `WHERE USER_UserName=? AND USER_Password=?` |
| TC_UDAO_LOGIN_15 | DAO bỏ qua `data.table` (đang hardcode `datn.USER`) | `data={table:'other.USER', userName:'u', password:'p'}` | SQL vẫn query `FROM datn.USER` | Notes: nếu muốn multi-schema thì cần refactor |

---

## Tổng kết user.dao.js

| Hàm | Số test case | Độ ưu tiên (theo Strategy) | Nghiệp vụ chính |
|---|---:|---|---|
| `findAll()` | 8 | TRUNG BÌNH | Admin xem danh sách user |
| `findOneUser(id)` | 10 | TRUNG BÌNH | Admin xem chi tiết user |
| `createUser(data)` | 20 | CAO | Tạo user mới, ràng buộc unique username/email |
| `updateUser(data)` | 15 | CAO | Cập nhật role/status/password |
| `deleteUserById(id)` | 10 | CAO | Xóa user, xử lý FK constraint |
| `findUserNameAndPassword(data)` | 15 | CAO | Đăng nhập, lọc Active, lưu ý injection |
| **TỔNG** | **78** |  |  |

> **Ghi chú kỹ thuật quan trọng (DAO layer):**
> - `createUser`, `updateUser`, `deleteUserById` dùng placeholder `?` (an toàn hơn, dễ test params).
> - `findOneUser` và `findUserNameAndPassword` đang nối chuỗi trực tiếp → nên có testcase security để thúc đẩy refactor sang query parameterized.

---

## 1.5. Execution Report — user.dao.js

> **Thời điểm thực thi:** 2026-04-11
> 
> **Lệnh chạy (backend):**
> ```bash
> cd backend
> npm test -- src/__tests__/dao/user.dao.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | 78 |
| Tests failed | 0 |
| Thời gian chạy | 0.805 s |

### Screenshot — Terminal output

> 📸 **[SCREENSHOT UDAO-1]** Chụp **toàn bộ terminal** từ dòng `PASS src/__tests__/dao/user.dao.test.js` đến dòng `Tests: 78 passed, 78 total` và dòng `Time: ...`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — user.dao.js

> **Thời điểm thực thi:** 2026-04-11
>
> **Lệnh chạy (backend):**
> ```bash
> cd backend
> npm test -- src/__tests__/dao/user.dao.test.js --coverage --verbose
> ```
>
> **HTML report (Jest lcov):** `backend/coverage/lcov-report/index.html`

### Tóm tắt độ bao phủ (file mục tiêu)

| File | Statements % | Branches % | Functions % | Lines % |
|---|---:|---:|---:|---:|
| `user.dao.js` | 100 | 100 | 100 | 100 |

### Tóm tắt độ bao phủ (toàn backend modules)

| Hạng mục | Statements % | Branches % | Functions % | Lines % |
|---|---:|---:|---:|---:|
| All files (collectCoverageFrom = `src/module/**/*.js`) | 11.46 | 11.39 | 12.50 | 12.58 |

> **Ghi chú:** Lệnh coverage hiện có thể **exit code 1** vì cấu hình `coverageThreshold.global = 80%` trong Jest, trong khi nhiều module khác chưa được test coverage. Tuy nhiên báo cáo HTML vẫn được tạo trong thư mục `backend/coverage/`.

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[SCREENSHOT UDAO-2]** Chụp bảng `File | % Stmts | % Branch | % Funcs | % Lines` trong terminal (đảm bảo thấy dòng `user/user.dao.js | 100 | 100 | 100 | 100`)

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT UDAO-3]** Mở `backend/coverage/lcov-report/index.html` bằng browser → chụp trang tổng quan (có danh sách folder/file và %)

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết user.dao.js)

> 📸 **[SCREENSHOT UDAO-4]** Trên trang HTML, click `user` → click `user.dao.js` → chụp màn hình phần code highlight (xanh = covered, đỏ = not covered)

_(Dán ảnh vào đây)_


# UNIT TEST DETAIL - equipment.dao.js

> **File:** `backend/src/module/equipment/equipment.dao.js`
> **Module/Layer:** `EquipmentDAO` (DAO Layer — truy cập DB MySQL qua `db.query` + transaction)
> **Framework:** Jest | **Mock gợi ý:** mock `../../config/configDB` với `query/beginTransaction/rollback/commit`
> **Nghiệp vụ hệ thống:** Quản lý danh mục **Thiết bị** và **Phòng**. Xóa là **soft delete** (đặt status = `'inactive'`). Tạo/cập nhật thiết bị dùng **transaction** 3 bảng (EQUIPMENT_TYPE → EQUIPMENT_MODEL → EQUIPMENT_ITEM). Tạo/cập nhật phòng dùng **transaction** 2 bảng (ROOM_TYPE → ROOM).

---

## 1. findAll()

> **Nghiệp vụ:** Lấy danh sách thiết bị đang hoạt động để hiển thị cho người dùng mượn. DAO query JOIN 3 bảng và **lọc** `EQUIPMENT_ITEM_Status != 'inactive'`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQDAO_FINDALL_01 | Trả về danh sách thiết bị khi DB có nhiều bản ghi (nhiều trạng thái hợp lệ) | `db.query` trả về `[eq1, eq2, eq3]` với status lần lượt `'Có sẵn'/'Đang sử dụng'/'Hỏng'` | Resolve `[eq1, eq2, eq3]` | DAO không lọc thêm ngoài điều kiện SQL |
| TC_EQDAO_FINDALL_02 | Trả về mảng rỗng khi không có thiết bị active | `db.query` trả về `[]` | Resolve `[]` | Hệ thống chưa nhập thiết bị hoặc tất cả đã inactive |
| TC_EQDAO_FINDALL_03 | CheckDB: SQL phải JOIN đủ 3 bảng (ITEM/MODEL/TYPE) | Gọi `findAll()` | `db.query` được gọi với SQL có `JOIN datn.EQUIPMENT_MODEL` và `JOIN datn.EQUIPMENT_TYPE` | Regression test đảm bảo không mất JOIN |
| TC_EQDAO_FINDALL_04 | CheckDB: SQL phải có filter `Status != 'inactive'` | Gọi `findAll()` | SQL chứa `WHERE ei.EQUIPMENT_ITEM_Status != 'inactive'` | Đảm bảo soft delete hoạt động đúng |
| TC_EQDAO_FINDALL_05 | CheckDB: Không truyền params (query signature `query(sql, cb)`) | Gọi `findAll()` | `db.query` được gọi với 2 args (sql, callback) | Đúng contract hiện tại |
| TC_EQDAO_FINDALL_06 | Reject khi DB trả lỗi (mất kết nối/timeout) | `db.query` gọi `cb(err)` | Promise reject đúng `err` | Negative path |
| TC_EQDAO_FINDALL_07 | Nếu DB driver trả `results=null` thì resolve `null` | `db.query` gọi `cb(null, null)` | Resolve `null` | Robustness: code hiện `resolve(results)` |
| TC_EQDAO_FINDALL_08 | Không mutate object trả về từ DB | `db.query` trả về object có field lạ | Resolve giữ nguyên object/field | Đảm bảo DAO không map/đổi field |
| TC_EQDAO_FINDALL_09 | Dữ liệu lớn (1000 dòng) vẫn resolve đúng length | `db.query` trả mảng 1000 rows | Resolve mảng 1000 rows | Stress data shape |
| TC_EQDAO_FINDALL_10 | Nếu DB trả nhiều bản ghi trùng ID (data bẩn) thì vẫn trả nguyên mảng | `db.query` trả `[row1,row2]` (cùng `ID`) | Resolve `[row1,row2]` | Data integrity nên xử ở DB constraints |

---

## 2. findAllRoom()

> **Nghiệp vụ:** Lấy danh sách phòng đang hoạt động để hiển thị khi tạo phiếu mượn. DAO query JOIN 2 bảng và **lọc** `ROOM_Status != 'inactive'`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQDAO_FINDALLROOM_01 | Trả về danh sách phòng khi DB có nhiều phòng (nhiều loại phòng) | `db.query` trả `[room1,room2,room3]` với `ROOM_TYPE_Name` khác nhau | Resolve `[room1,room2,room3]` | JOIN ROOM + ROOM_TYPE |
| TC_EQDAO_FINDALLROOM_02 | Trả về `[]` khi không có phòng active | `db.query` trả `[]` | Resolve `[]` | Tất cả inactive hoặc chưa tạo |
| TC_EQDAO_FINDALLROOM_03 | CheckDB: SQL phải JOIN `datn.ROOM_TYPE` | Gọi `findAllRoom()` | SQL chứa `JOIN datn.ROOM_TYPE` | Regression |
| TC_EQDAO_FINDALLROOM_04 | CheckDB: SQL phải lọc `ROOM_Status != 'inactive'` | Gọi `findAllRoom()` | SQL chứa `WHERE r.ROOM_Status != 'inactive'` | Soft delete |
| TC_EQDAO_FINDALLROOM_05 | Reject khi DB trả lỗi | `db.query` gọi `cb(err)` | Reject `err` | Negative path |
| TC_EQDAO_FINDALLROOM_06 | Resolve `null` khi DB trả `results=null` | `db.query` gọi `cb(null, null)` | Resolve `null` | Robustness |
| TC_EQDAO_FINDALLROOM_07 | Kết quả có đủ field vị trí (tòa/tầng) | `db.query` trả room có `LOCATION_Building/LOCATION_Floor` | Resolve object có đủ field | Yếu tố nghiệp vụ khi chọn phòng |
| TC_EQDAO_FINDALLROOM_08 | Không mutate dữ liệu phòng trả về | `db.query` trả object có field lạ | Resolve giữ nguyên | DAO không map |

---

## 3. findOne(data)

> **Nghiệp vụ:** Xem chi tiết 1 đối tượng để sửa. Input `data.id` có format `"{id}|{type}"` (ví dụ `"10|equipment"`, `"3|room"`). DAO parse để chọn query tương ứng và **lọc** inactive.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQDAO_FINDONE_01 | Trả về thiết bị khi `type=equipment` và ID tồn tại (active) | `data={id:'1|equipment'}`; `db.query` trả `[eq]` | Resolve `eq` | Happy path |
| TC_EQDAO_FINDONE_02 | Trả về `undefined` khi thiết bị không tồn tại | `data={id:'9999|equipment'}`; `db.query` trả `[]` | Resolve `undefined` | Do `resolve(results[0])` |
| TC_EQDAO_FINDONE_03 | Trả về `undefined` khi thiết bị inactive (bị lọc ở WHERE) | `data={id:'5|equipment'}`; `db.query` trả `[]` | Resolve `undefined` | Soft delete |
| TC_EQDAO_FINDONE_04 | Reject khi DB lỗi ở query thiết bị | `data={id:'1|equipment'}`; `db.query` gọi `cb(err)` | Reject `err` | Negative path |
| TC_EQDAO_FINDONE_05 | CheckDB: query thiết bị phải dùng placeholder `?` và params `[id]` | `data={id:'7|equipment'}` | `db.query` nhận params `['7']` | Chống injection |
| TC_EQDAO_FINDONE_06 | CheckDB: SQL thiết bị phải JOIN đủ 3 bảng và lọc inactive | `data={id:'7|equipment'}` | SQL có `JOIN ...MODEL...TYPE` và `Status != 'inactive'` | Regression |
| TC_EQDAO_FINDONE_07 | Trả về phòng khi `type=room` và ID tồn tại (active) | `data={id:'2|room'}`; `db.query` trả `[room]` | Resolve `room` | Happy path |
| TC_EQDAO_FINDONE_08 | Trả về `undefined` khi phòng không tồn tại | `data={id:'9999|room'}`; `db.query` trả `[]` | Resolve `undefined` | Do `results[0]` |
| TC_EQDAO_FINDONE_09 | Trả về `undefined` khi phòng inactive | `data={id:'9|room'}`; `db.query` trả `[]` | Resolve `undefined` | Soft delete |
| TC_EQDAO_FINDONE_10 | Reject khi DB lỗi ở query phòng | `data={id:'2|room'}`; `db.query` gọi `cb(err)` | Reject `err` | Negative path |
| TC_EQDAO_FINDONE_11 | CheckDB: query phòng phải dùng placeholder `?` và params `[id]` | `data={id:'2|room'}` | `db.query` nhận params `['2']` | Chống injection |
| TC_EQDAO_FINDONE_12 | Reject khi `type` không hợp lệ | `data={id:'1|invalid'}` | Reject `Error('Type không hợp lệ')` | Không gọi `db.query` |
| TC_EQDAO_FINDONE_13 | Reject khi thiếu delimiter `|` (type = undefined) | `data={id:'1'}` | Reject `Error('Type không hợp lệ')` | Robustness input |
| TC_EQDAO_FINDONE_14 | Khi có nhiều delimiter, chỉ lấy 2 phần đầu | `data={id:'1|equipment|extra'}` | Xử lý như `equipment` với `idType='1'` | `split('|')` lấy `[0],[1]` |
| TC_EQDAO_FINDONE_15 | idType rỗng (`'|equipment'`) vẫn query bằng params `['']` | `data={id:'|equipment'}`; DB trả `[]` | Resolve `undefined` | Edge case input từ client |
| TC_EQDAO_FINDONE_16 | Security regression: payload injection trong id vẫn là params, không nối chuỗi | `data={id:"1 OR 1=1|equipment"}` | `db.query` nhận params `["1 OR 1=1"]` | Query parameterized |
| TC_EQDAO_FINDONE_17 | Nếu DB trả nhiều dòng thì lấy dòng đầu | `db.query` trả `[row1,row2]` | Resolve `row1` | Robustness data bẩn |
| TC_EQDAO_FINDONE_18 | Type có sai casing (`'Equipment'`) bị coi là không hợp lệ | `data={id:'1|Equipment'}` | Reject `Error('Type không hợp lệ')` | Business rule: type enum cố định |

---

## 4. createEquipment(data)

> **Nghiệp vụ:** Thêm mới **thiết bị** hoặc **phòng**.
> - Nếu có `EQUIPMENT_ITEM_Name` → insert 3 bảng trong transaction và commit.
> - Nếu có `ROOM_Name` → insert 2 bảng trong transaction và commit.
> - Nếu không có cả 2 → rollback và reject `"Unknown data type"`.
> - Nếu có `EQUIPMENT_ITEM_PurchaseDate` → convert sang MySQL datetime string `YYYY-MM-DD HH:MM:SS`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQDAO_CREATE_01 | Tạo thiết bị mới thành công (commit) | `data` có `EQUIPMENT_ITEM_Name` + đủ type/model/item fields; mock insertId cho type/model; item insert OK | Resolve `{message:'Thêm thiết bị thành công'}` | Happy path transaction 3 bước |
| TC_EQDAO_CREATE_02 | CheckDB: thứ tự query khi tạo thiết bị phải là TYPE → MODEL → ITEM | Gọi `createEquipment(dataEquipment)` | `db.query` được gọi 3 lần theo đúng thứ tự | Regression cho flow transaction |
| TC_EQDAO_CREATE_03 | CheckDB: INSERT EQUIPMENT_TYPE dùng placeholder và params đúng | `dataEquipment` | Query 1 nhận params `[EQUIPMENT_TYPE_Name, EQUIPMENT_TYPE_Description]` | Chống injection |
| TC_EQDAO_CREATE_04 | CheckDB: INSERT EQUIPMENT_MODEL nhận đúng `typeId` từ insertId | mock `rType.insertId=5` | Query 2 nhận params `[..., 5]` | Verify propagation insertId |
| TC_EQDAO_CREATE_05 | CheckDB: INSERT EQUIPMENT_ITEM nhận đúng `modelId` từ insertId | mock `rModel.insertId=9` | Query 3 nhận params kết thúc bằng `9` | Verify FK |
| TC_EQDAO_CREATE_06 | Convert PurchaseDate: format MySQL datetime string | `data.EQUIPMENT_ITEM_PurchaseDate='2024-06-01'` | Params PurchaseDate match regex `^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$` | Notes: tránh flake timezone, assert pattern |
| TC_EQDAO_CREATE_07 | Không convert PurchaseDate nếu field không tồn tại | `data` không có `EQUIPMENT_ITEM_PurchaseDate` | Insert params có PurchaseDate = `undefined`/không set theo input | Theo code: chỉ convert khi truthy |
| TC_EQDAO_CREATE_08 | Throw khi PurchaseDate invalid (Invalid Date) | `data.EQUIPMENT_ITEM_PurchaseDate='not-a-date'` | Hàm throw `RangeError` trước khi beginTransaction | Lưu ý: đây là bug/edge do `toISOString()` |
| TC_EQDAO_CREATE_09 | Reject khi beginTransaction lỗi | mock `db.beginTransaction(cb(err))` | Reject `err` | Không chạy các query INSERT |
| TC_EQDAO_CREATE_10 | Rollback + reject khi INSERT TYPE lỗi | mock query 1 trả `err` | Rollback được gọi; reject `err` | Transaction rollback ở bước 1 |
| TC_EQDAO_CREATE_11 | Rollback + reject khi INSERT MODEL lỗi | query 1 OK; query 2 trả `err` | Rollback; reject `err` | Transaction rollback ở bước 2 |
| TC_EQDAO_CREATE_12 | Rollback + reject khi INSERT ITEM lỗi | query 1 OK; query 2 OK; query 3 trả `err` | Rollback; reject `err` | Transaction rollback ở bước 3 |
| TC_EQDAO_CREATE_13 | Tạo phòng mới thành công (commit) | `data` có `ROOM_Name` + fields; mock insertId room_type; insert room OK | Resolve `{message:'Thêm phòng thành công'}` | Happy path room transaction 2 bước |
| TC_EQDAO_CREATE_14 | CheckDB: INSERT ROOM_TYPE dùng placeholder và params đúng | `dataRoom` | Query 1 nhận params `[ROOM_TYPE_Name, ROOM_TYPE_Description]` | Chống injection |
| TC_EQDAO_CREATE_15 | CheckDB: INSERT ROOM nhận đúng `typeId` từ insertId | mock `rType.insertId=4` | Query 2 params kết thúc bằng `4` | Verify FK |
| TC_EQDAO_CREATE_16 | Rollback + reject khi INSERT ROOM_TYPE lỗi | query 1 trả `err` | Rollback; reject `err` | Transaction rollback |
| TC_EQDAO_CREATE_17 | Rollback + reject khi INSERT ROOM lỗi | query 1 OK; query 2 trả `err` | Rollback; reject `err` | Transaction rollback |
| TC_EQDAO_CREATE_18 | Rollback + reject `"Unknown data type"` khi input không phải equipment/room | `data={}` | Reject string `"Unknown data type"` | Lưu ý: reject là string, không phải Error |
| TC_EQDAO_CREATE_19 | Nếu DB trả insertId undefined ở TYPE thì MODEL insert có thể fail và phải rollback | mock `rType.insertId=undefined`; query 2 trả err FK | Rollback; reject err | Robustness cho insertId bất thường |
| TC_EQDAO_CREATE_20 | Nếu DB trả insertId undefined ở MODEL thì ITEM insert có thể fail và rollback | mock `rModel.insertId=undefined`; query 3 trả err FK | Rollback; reject err | Robustness |
| TC_EQDAO_CREATE_21 | Thiếu field bắt buộc (ví dụ EQUIPMENT_TYPE_Name=null) → DB lỗi và rollback | `dataEquipment` thiếu field; query 1 trả err | Rollback; reject err | Validation hiện phụ thuộc DB |
| TC_EQDAO_CREATE_22 | Duplicate entry (unique) ở TYPE/MODEL/ITEM → rollback + reject | mock query trả err `ER_DUP_ENTRY` | Rollback; reject err | Nghiệp vụ: tên loại/model có thể unique |
| TC_EQDAO_CREATE_23 | DB commit được gọi đúng 1 lần khi thành công | mock all queries OK | `db.commit` gọi 1 lần; resolve message | CheckDB: commit on success |
| TC_EQDAO_CREATE_24 | Không gọi rollback khi thành công | mock all queries OK | `db.rollback` không được gọi | Transaction correctness |

---

## 5. updateEquipment(data)

> **Nghiệp vụ:** Cập nhật **thiết bị** hoặc **phòng** theo 2 nhánh:
> - Nếu có `EQUIPMENT_ITEM_Name` → UPDATE 3 bảng trong transaction và commit.
> - Nếu có `ROOM_Name` → UPDATE 2 bảng trong transaction và commit.
> - Nếu không có cả 2 → rollback và reject `"Unknown data type"`.
> - Nếu có `EQUIPMENT_ITEM_PurchaseDate` → convert sang MySQL datetime string.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQDAO_UPDATE_01 | Update thiết bị thành công (commit) | `data` có `EQUIPMENT_ITEM_Name` + IDs; mock 3 update OK | Resolve `{message:'Update equipment thành công'}` | Happy path 3 bước |
| TC_EQDAO_UPDATE_02 | CheckDB: thứ tự update thiết bị ITEM → MODEL → TYPE | Gọi `updateEquipment(dataEquipment)` | `db.query` gọi theo đúng thứ tự 3 query | Regression |
| TC_EQDAO_UPDATE_03 | CheckDB: Update ITEM dùng placeholder và params đúng thứ tự | `dataEquipment` | Params `[Name, PurchaseDate, Price, Quantity, Status, Description, ID]` | Đúng contract query |
| TC_EQDAO_UPDATE_04 | Convert PurchaseDate: params là MySQL datetime string | `data.EQUIPMENT_ITEM_PurchaseDate='2024-01-10'` | Params PurchaseDate match regex `^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$` | Notes: assert pattern tránh timezone |
| TC_EQDAO_UPDATE_05 | Throw khi PurchaseDate invalid | `data.EQUIPMENT_ITEM_PurchaseDate='invalid'` | Hàm throw `RangeError` trước beginTransaction | Edge do `toISOString()` |
| TC_EQDAO_UPDATE_06 | Reject khi beginTransaction lỗi | mock `beginTransaction` trả err | Reject `err` | Không chạy query UPDATE |
| TC_EQDAO_UPDATE_07 | Rollback + reject khi UPDATE ITEM lỗi | query 1 trả err | Rollback; reject err | Transaction rollback bước 1 |
| TC_EQDAO_UPDATE_08 | Rollback + reject khi UPDATE MODEL lỗi | query 1 OK; query 2 err | Rollback; reject err | Transaction rollback bước 2 |
| TC_EQDAO_UPDATE_09 | Rollback + reject khi UPDATE TYPE lỗi | query 1 OK; query 2 OK; query 3 err | Rollback; reject err | Transaction rollback bước 3 |
| TC_EQDAO_UPDATE_10 | Update phòng thành công (commit) | `data` có `ROOM_Name` + IDs; mock 2 update OK | Resolve `{message:'Update room thành công'}` | Happy path 2 bước |
| TC_EQDAO_UPDATE_11 | CheckDB: thứ tự update phòng ROOM → ROOM_TYPE | Gọi `updateEquipment(dataRoom)` | 2 query theo đúng thứ tự | Regression |
| TC_EQDAO_UPDATE_12 | Rollback + reject khi UPDATE ROOM lỗi | query 1 err | Rollback; reject err | Transaction rollback |
| TC_EQDAO_UPDATE_13 | Rollback + reject khi UPDATE ROOM_TYPE lỗi | query 1 OK; query 2 err | Rollback; reject err | Transaction rollback |
| TC_EQDAO_UPDATE_14 | Rollback + reject `"Unknown data type"` khi input không có EQUIPMENT_ITEM_Name/ROOM_Name | `data={ID:1}` | Reject string `"Unknown data type"` | Lưu ý: reject là string |
| TC_EQDAO_UPDATE_15 | ID không tồn tại nhưng query không lỗi vẫn commit và trả message success | mock updates OK nhưng affectedRows=0 | Resolve `{message:'Update equipment thành công'}` hoặc `{message:'Update room thành công'}` | DAO không kiểm `affectedRows` |
| TC_EQDAO_UPDATE_16 | Status thiết bị đổi sang `'Đang sử dụng'` vẫn update được | `data.EQUIPMENT_ITEM_Status='Đang sử dụng'` | Resolve success | Nghiệp vụ mượn trả |
| TC_EQDAO_UPDATE_17 | Status thiết bị đổi sang `'Hỏng'` vẫn update được | `data.EQUIPMENT_ITEM_Status='Hỏng'` | Resolve success | Nghiệp vụ hỏng |
| TC_EQDAO_UPDATE_18 | Status phòng đổi sang `'Đang sửa chữa'` vẫn update được | `data.ROOM_Status='Đang sửa chữa'` | Resolve success | Nghiệp vụ phòng |
| TC_EQDAO_UPDATE_19 | Thiếu ID bắt buộc (ID/model_id/type_id) → DB lỗi và rollback | `dataEquipment` thiếu `ID` hoặc `EQUIPMENT_MODEL_ID` | Rollback; reject err | Validation phụ thuộc DB |
| TC_EQDAO_UPDATE_20 | Không gọi rollback khi thành công | mock all OK | `db.rollback` không gọi | Transaction correctness |

---

## 6. deleteEquipment(data)

> **Nghiệp vụ:** Xóa mềm (soft delete) thiết bị/phòng: cập nhật status = `'inactive'`. Input `{ id, type }` với type là `'equipment'` hoặc `'room'`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_EQDAO_DELETE_01 | Soft delete thiết bị thành công (type=equipment) | `data={id:1,type:'equipment'}`; `db.query` trả `{affectedRows:1}` | Resolve `{affectedRows:1}` | Happy path |
| TC_EQDAO_DELETE_02 | Soft delete phòng thành công (type=room) | `data={id:2,type:'room'}`; `db.query` trả `{affectedRows:1}` | Resolve `{affectedRows:1}` | Happy path |
| TC_EQDAO_DELETE_03 | CheckDB: delete equipment phải UPDATE EQUIPMENT_ITEM set inactive với placeholder `?` | `data={id:1,type:'equipment'}` | SQL chứa `UPDATE datn.EQUIPMENT_ITEM` và params `[1]` | Chống injection |
| TC_EQDAO_DELETE_04 | CheckDB: delete room phải UPDATE ROOM set inactive với placeholder `?` | `data={id:2,type:'room'}` | SQL chứa `UPDATE datn.ROOM` và params `[2]` | Chống injection |
| TC_EQDAO_DELETE_05 | Resolve affectedRows=0 khi ID không tồn tại | `data={id:9999,type:'equipment'}`; DB trả `{affectedRows:0}` | Resolve `{affectedRows:0}` | Không có bản ghi bị update |
| TC_EQDAO_DELETE_06 | Reject khi DB lỗi (equipment) | `data={id:1,type:'equipment'}`; `db.query` gọi `cb(err)` | Reject `err` | Negative path |
| TC_EQDAO_DELETE_07 | Reject khi DB lỗi (room) | `data={id:2,type:'room'}`; `db.query` gọi `cb(err)` | Reject `err` | Negative path |
| TC_EQDAO_DELETE_08 | Reject khi type không hợp lệ | `data={id:1,type:'invalid'}` | Reject `Error('Type không hợp lệ')` | Không gọi `db.query` |
| TC_EQDAO_DELETE_09 | Reject khi thiếu type (undefined) | `data={id:1}` | Reject `Error('Type không hợp lệ')` | Robustness input |
| TC_EQDAO_DELETE_10 | ID undefined: DB có thể trả lỗi và phải reject | `data={id:undefined,type:'equipment'}`; `db.query` trả err | Reject `err` | Validation phụ thuộc DB |
| TC_EQDAO_DELETE_11 | Security regression: payload injection trong id vẫn là params, không nối chuỗi | `data={id:'1 OR 1=1',type:'room'}` | `db.query` nhận params `['1 OR 1=1']` | Query parameterized |

---

## Tổng kết equipment.dao.js

| Hàm | Số test case | Độ ưu tiên (theo Strategy) | Nghiệp vụ chính |
|---|---:|---|---|
| `findAll()` | 10 | CAO | JOIN 3 bảng, lọc inactive |
| `findAllRoom()` | 8 | TRUNG BÌNH | JOIN 2 bảng, lọc inactive |
| `findOne(data)` | 18 | CAO | Parse `{id}|{type}`, lọc inactive |
| `createEquipment(data)` | 24 | CAO | Transaction insert 2–3 bảng + convert date |
| `updateEquipment(data)` | 20 | CAO | Transaction update 2–3 bảng + convert date |
| `deleteEquipment(data)` | 11 | CAO | Soft delete theo type |
| **TỔNG** | **91** |  |  |

---

## 1.5. Execution Report — equipment.dao.js

> **Lệnh chạy:**
> ```bash
> npm test -- src/__tests__/dao/equipment.dao.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | 91 passed / 91 total |
| Tests failed | 0 |
| Thời gian chạy | 1.877 s |

### Chi tiết pass/fail theo nhóm

| Nhóm hàm | Số TC | Passed | Failed |
|---|---:|---:|---:|
| `findAll()` | 10 | 10 | 0 |
| `findAllRoom()` | 8 | 8 | 0 |
| `findOne(data)` | 18 | 18 | 0 |
| `createEquipment(data)` | 24 | 24 | 0 |
| `updateEquipment(data)` | 20 | 20 | 0 |
| `deleteEquipment(data)` | 11 | 11 | 0 |
| **TỔNG** | **91** | **91** | **0** |

### Screenshot — Terminal output

> 📸 **[SCREENSHOT EDAO-1]** Chụp toàn bộ terminal từ dòng `PASS src/__tests__/dao/equipment.dao.test.js` đến dòng `Tests: 91 passed, 91 total`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — equipment.dao.js

> **Lệnh chạy:**
> ```bash
> npm test -- src/__tests__/dao/equipment.dao.test.js --coverage --collectCoverageFrom=src/module/equipment/equipment.dao.js --coverageReporters=text --coverageReporters=html
> ```
> **HTML report:** `backend/coverage/lcov-report/index.html`

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---:|---:|---:|---:|
| `equipment.dao.js` | 100% | 100% | 100% | 100% |

### Mục tiêu coverage

| Chỉ số | Mục tiêu | Thực tế | Đạt? |
|---|---|---:|---|
| Statements | ≥ 80% | 100% | ✅ |
| Branches | ≥ 80% | 100% | ✅ |
| Functions | ≥ 80% | 100% | ✅ |
| Lines | ≥ 80% | 100% | ✅ |

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[SCREENSHOT EDAO-2]** Chụp bảng `File | % Stmts | % Branch | % Funcs | % Lines` trong terminal (đảm bảo thấy dòng `equipment.dao.js | 100 | 100 | 100 | 100`)

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT EDAO-3]** Mở `backend/coverage/lcov-report/index.html` bằng browser → chụp trang tổng quan

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết equipment.dao.js)

> 📸 **[SCREENSHOT EDAO-4]** Trên trang HTML, click `equipment` → click `equipment.dao.js` → chụp phần code highlight

_(Dán ảnh vào đây)_

---

# UNIT TEST DETAIL - borrowReturn.dao.js

> **File:** `backend/src/module/borrowReturn/borrowReturn.dao.js`
> **Module/Layer:** `BorrowReturnDAO` (DAO Layer — truy cập DB MySQL qua `db.query` + transaction ở `borrowReturnSlipDAO`)
> **Framework:** Jest | **Mock gợi ý:** mock `../../config/configDB` với `query/beginTransaction/rollback/commit`
> **Nghiệp vụ hệ thống:** Quản lý **phiếu mượn/trả** cho **thiết bị** hoặc **phòng**.
> - Tạo phiếu mượn: tạo `BORROW_RETURN_SLIP` + `BORROW_RETURN_DATE` + `BORROW_RETURN_ITEM`, đồng thời đổi trạng thái thiết bị/phòng sang `'Đang mượn'`.
> - Trả: cập nhật phiếu sang `'Đã trả'`, set `DATE_ActualReturnDate = NOW()` (timezone +07:00), đổi trạng thái thiết bị/phòng về `'Có sẵn'` nếu đang `'Đang mượn'`.

> **Lưu ý kỹ thuật quan trọng khi viết unit test:**
> - `convertDateArray()` đã được **export** trong `module.exports` để unit test trực tiếp (đã có test `TC_BRDAO_CONVERT_*` trong `borrowReturn.dao.test.js`).
> - `createBorrowReturnSlipDAO()` hiện build SQL bằng string interpolation (không dùng placeholder `?`) ⇒ testcase có phần **security regression** (SQL injection) để ghi nhận rủi ro.

---

## 1. convertDateArray(dateArray, gioBatDau = 7, phutMoiTiet = 45)

> **Nghiệp vụ:** Quy đổi lịch mượn theo **tiết học + ngày** thành timestamp dạng MySQL `YYYY-MM-DD HH:MM:SS`.
> - Mặc định bắt đầu tiết 1 lúc **07:00**, mỗi tiết **45 phút**.
> - Ví dụ: tiết 1 → 07:00, tiết 2 → 07:45, tiết 3 → 08:30 ...

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BRDAO_CONVERT_01 | Convert đúng tiết 1 (biên dưới hợp lệ) | `dateArray=['1','2026-04-11']` | `'2026-04-11 07:00:00'` | Happy path theo lịch học chuẩn |
| TC_BRDAO_CONVERT_02 | Convert đúng tiết 2 (cộng 45 phút) | `['2','2026-04-11']` | `'2026-04-11 07:45:00'` | Kiểm tra phút lẻ 45 |
| TC_BRDAO_CONVERT_03 | Convert đúng tiết 3 (cộng 90 phút) | `['3','2026-04-11']` | `'2026-04-11 08:30:00'` | Kiểm tra chuyển giờ |
| TC_BRDAO_CONVERT_04 | Convert đúng tiết 4 | `['4','2026-04-11']` | `'2026-04-11 09:15:00'` | Kiểm tra phút 15 |
| TC_BRDAO_CONVERT_05 | Convert đúng tiết 5 | `['5','2026-04-11']` | `'2026-04-11 10:00:00'` | Kiểm tra round hour |
| TC_BRDAO_CONVERT_06 | Tiết là number thay vì string vẫn convert đúng | `[1,'2026-04-11']` | `'2026-04-11 07:00:00'` | `Number(dateArray[0])` |
| TC_BRDAO_CONVERT_07 | Tiết có khoảng trắng vẫn parse được | `[' 2 ','2026-04-11']` | `'2026-04-11 07:45:00'` | `Number(' 2 ')` hợp lệ |
| TC_BRDAO_CONVERT_08 | Custom `gioBatDau` | `['1','2026-04-11'], gioBatDau=8` | `'2026-04-11 08:00:00'` | Trường hợp thay đổi lịch |
| TC_BRDAO_CONVERT_09 | Custom `phutMoiTiet` (50 phút/tiết) | `['2','2026-04-11'], phutMoiTiet=50` | `'2026-04-11 07:50:00'` | Thay đổi thời lượng tiết |
| TC_BRDAO_CONVERT_10 | Tiết là 0 (không hợp lệ nghiệp vụ) vẫn trả chuỗi (ghi nhận) | `['0','2026-04-11']` | Chuỗi datetime có thể < 07:00 (vd 06:15) | Business rule nên validate ở service/controller |
| TC_BRDAO_CONVERT_11 | Tiết âm (không hợp lệ nghiệp vụ) vẫn trả chuỗi (ghi nhận) | `['-1','2026-04-11']` | Chuỗi datetime có thể < 07:00 | Nên bổ sung validate tiết >= 1 |
| TC_BRDAO_CONVERT_12 | Tiết là float (vd 1.5) tạo timestamp lẻ (ghi nhận) | `['1.5','2026-04-11']` | Có thể ra phút không chuẩn | `Number('1.5')` -> 1.5; nghiệp vụ tiết phải là int |
| TC_BRDAO_CONVERT_13 | Tiết rất lớn làm vượt ngày (cross-day) | `['25','2026-04-11']` | Ngày có thể tăng sang 2026-04-12 | `setHours` tự roll-over ngày |
| TC_BRDAO_CONVERT_14 | Date string dạng ISO có timezone vẫn parse được | `['1','2026-04-11T00:00:00.000Z']` | Trả chuỗi đúng format | Robustness input |
| TC_BRDAO_CONVERT_15 | Date string invalid tạo chuỗi NaN (ghi nhận) | `['1','not-a-date']` | Chuỗi chứa `NaN-NaN-NaN` | Bug/edge: code không validate `new Date()` |
| TC_BRDAO_CONVERT_16 | dateArray thiếu phần tử [1] (ngày) | `['1']` | Chuỗi chứa `NaN-NaN-NaN` | `new Date(undefined)` invalid |
| TC_BRDAO_CONVERT_17 | dateArray rỗng | `[]` | Chuỗi chứa `NaN-NaN-NaN` | Edge input từ client |
| TC_BRDAO_CONVERT_18 | dateArray không phải array (vd null) | `null` | Throw TypeError | `dateArray[0]` access error |
| TC_BRDAO_CONVERT_19 | Padding đúng 2 chữ số cho month/day/hour/minute | `['1','2026-01-02']` | `'2026-01-02 07:00:00'` | Verify `padStart(2,'0')` |
| TC_BRDAO_CONVERT_20 | Output luôn kết thúc `:00` giây | input hợp lệ | `...:00` | `ss='00'` cố định |
| TC_BRDAO_CONVERT_21 | Không mutate input array (an toàn side-effect) | `const a=['1','2026-04-11']` | `a` không đổi | Hàm chỉ đọc |
| TC_BRDAO_CONVERT_22 | Security: input ngày chứa ký tự lạ không làm crash (ghi nhận) | `['1','2026-04-11;DROP TABLE']` | Chuỗi NaN hoặc date invalid | Nên validate format ngày |

---

## 2. findAllBorrowReturn()

> **Nghiệp vụ:** Lấy **tất cả** dữ liệu mượn/trả để hiển thị tổng hợp (JOIN nhiều bảng). 1 phiếu có nhiều item ⇒ kết quả có nhiều dòng cho cùng `BORROW_RETURN_SLIP_ID`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BRDAO_FINDALLBR_01 | Resolve danh sách khi DB trả nhiều dòng (nhiều phiếu) | `db.query` trả `[{BORROW_RETURN_SLIP_ID:1,...},{BORROW_RETURN_SLIP_ID:2,...}]` | Resolve đúng mảng | Happy path |
| TC_BRDAO_FINDALLBR_02 | Resolve `[]` khi chưa có phiếu nào | `db.query` trả `[]` | Resolve `[]` | Hệ thống mới |
| TC_BRDAO_FINDALLBR_03 | 1 phiếu nhiều item → nhiều dòng cùng slip ID | `db.query` trả 3 rows với `BORROW_RETURN_SLIP_ID=1` khác `EQUIPMENT_ITEM_ID/ROOM_ID` | Resolve giữ nguyên 3 rows | UI thường group theo slip |
| TC_BRDAO_FINDALLBR_04 | Dòng item là thiết bị: field phòng null | `db.query` trả row có `EQUIPMENT_ITEM_ID != null`, `ROOM_ID=null` | Resolve row giữ nguyên | LEFT JOIN room |
| TC_BRDAO_FINDALLBR_05 | Dòng item là phòng: field thiết bị null | row có `ROOM_ID != null`, `EQUIPMENT_ITEM_ID=null` | Resolve row giữ nguyên | LEFT JOIN equipment |
| TC_BRDAO_FINDALLBR_06 | Slip status `'Chưa trả'` hiển thị đúng | row `BORROW_RETURN_SLIP_Status='Chưa trả'` | Resolve giữ nguyên status | Nghiệp vụ mượn |
| TC_BRDAO_FINDALLBR_07 | Slip status `'Đã trả'` hiển thị đúng | row `...Status='Đã trả'` | Resolve giữ nguyên status | Nghiệp vụ trả |
| TC_BRDAO_FINDALLBR_08 | Date fields có thể null (ActualReturnDate) | row `DATE_ActualReturnDate=null` | Resolve null | Khi chưa trả |
| TC_BRDAO_FINDALLBR_09 | CheckDB: SQL có ORDER BY `brs.ID` | gọi `findAllBorrowReturn()` | SQL chứa `ORDER BY brs.ID` | Đảm bảo thứ tự phiếu |
| TC_BRDAO_FINDALLBR_10 | CheckDB: SQL JOIN đủ bảng trọng yếu (SLIP/USER/DATE/ITEM) | gọi hàm | SQL chứa `FROM datn.BORROW_RETURN_SLIP` + `JOIN datn.\`USER\`` + `JOIN datn.BORROW_RETURN_DATE` + `JOIN datn.BORROW_RETURN_ITEM` | Regression query |
| TC_BRDAO_FINDALLBR_11 | DB lỗi (timeout/mất kết nối) → reject err | `db.query` cb(err) | Promise reject `err` | Negative path |
| TC_BRDAO_FINDALLBR_12 | Robustness: DB trả `results=null` → resolve null | `cb(null,null)` | Resolve `null` | Code `resolve(results)` |
| TC_BRDAO_FINDALLBR_13 | Không truyền params vào db.query | gọi hàm | `db.query` nhận (sql, cb) | Contract hiện tại |
| TC_BRDAO_FINDALLBR_14 | Data integrity: giữ nguyên field lạ DB trả | row có `EXTRA_FIELD` | Resolve giữ nguyên | DAO không map |
| TC_BRDAO_FINDALLBR_15 | Performance: dataset lớn (1000 rows) vẫn resolve đúng length | results 1000 | length 1000 | Stress data shape |

---

## 3. findByUserBorrowReturnSlipDAO(userId)

> **Nghiệp vụ:** Lấy danh sách phiếu mượn/trả theo **USER_ID** (dùng cho “phiếu của tôi”), sắp xếp `ID DESC`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BRDAO_FINDBYUSER_01 | User có nhiều phiếu → resolve mảng nhiều phần tử | `userId=1`, DB trả `[slip3,slip2,slip1]` | Resolve đúng mảng | Happy path |
| TC_BRDAO_FINDBYUSER_02 | User chưa có phiếu → resolve `[]` | `userId=2`, DB trả `[]` | Resolve `[]` | Không có dữ liệu |
| TC_BRDAO_FINDBYUSER_03 | Phiếu có status `'Chưa trả'` và `'Đã trả'` cùng tồn tại | results mix status | Resolve giữ nguyên | Lịch sử mượn trả |
| TC_BRDAO_FINDBYUSER_04 | ActualReturnDate có thể null | row `DATE_ActualReturnDate=null` | Resolve null | Chưa trả |
| TC_BRDAO_FINDBYUSER_05 | CheckDB: SQL có placeholder `?` và params `[userId]` | gọi hàm | `db.query(sql,[userId],cb)` | Chống injection |
| TC_BRDAO_FINDBYUSER_06 | Security regression: userId là payload injection vẫn được truyền qua params | `userId="1 OR 1=1"` | `params=['1 OR 1=1']` | Không nối chuỗi |
| TC_BRDAO_FINDBYUSER_07 | CheckDB: SQL có `ORDER BY brs.ID DESC` | gọi hàm | SQL chứa `ORDER BY brs.ID DESC` | Thứ tự mới nhất |
| TC_BRDAO_FINDBYUSER_08 | DB lỗi → reject err | `cb(err)` | reject `err` | Negative path |
| TC_BRDAO_FINDBYUSER_09 | userId undefined vẫn query (ghi nhận) | `userId=undefined` | `params=[undefined]` và resolve theo DB | Business nên validate userId |
| TC_BRDAO_FINDBYUSER_10 | userId null vẫn query (ghi nhận) | `userId=null` | `params=[null]` | Validate ở service |
| TC_BRDAO_FINDBYUSER_11 | Không mutate results trả về | results object | giữ nguyên | DAO không map |
| TC_BRDAO_FINDBYUSER_12 | Robustness: DB trả `results=null` → resolve null | `cb(null,null)` | resolve `null` | Code `resolve(results)` |

---

## 4. findAllBorrowReturnSlipDAO(data)

> **Nghiệp vụ:** Lấy danh sách phiếu mượn/trả (JOIN SLIP/DATE/ITEM). **Lưu ý:** code hiện `resolve(results[0])` (chỉ trả **dòng đầu tiên**) ⇒ testcase cần ghi nhận behavior này.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BRDAO_FINDALLSLIP_01 | DB trả nhiều dòng → chỉ resolve dòng đầu tiên (behavior hiện tại) | DB trả `[row1,row2]` | Resolve `row1` | Ghi nhận bug/requirement hiện tại |
| TC_BRDAO_FINDALLSLIP_02 | DB trả 1 dòng → resolve đúng row đó | DB trả `[row1]` | Resolve `row1` | Happy path theo behavior |
| TC_BRDAO_FINDALLSLIP_03 | DB trả `[]` → resolve `undefined` | DB trả `[]` | Resolve `undefined` | `results[0]` |
| TC_BRDAO_FINDALLSLIP_04 | DB lỗi → reject err | `cb(err)` | Reject `err` | Negative path |
| TC_BRDAO_FINDALLSLIP_05 | CheckDB: SQL JOIN đủ 3 bảng SLIP/DATE/ITEM | gọi hàm | SQL chứa `FROM datn.BORROW_RETURN_SLIP` + `JOIN datn.BORROW_RETURN_DATE` + `JOIN datn.BORROW_RETURN_ITEM` | Regression |
| TC_BRDAO_FINDALLSLIP_06 | Không sử dụng tham số `data` (ghi nhận) | gọi với `data={foo:1}` | `db.query` không nhận params | Code hiện không dùng `data` |
| TC_BRDAO_FINDALLSLIP_07 | Kết quả có `EQUIPMENT_ITEM_ID` null khi item là phòng | DB trả row `EQUIPMENT_ITEM_ID=null` | Resolve row giữ nguyên | Borrow phòng |
| TC_BRDAO_FINDALLSLIP_08 | Slip có Notes rỗng vẫn trả về | `BORROW_RETURN_SLIP_Notes=''` | Resolve giữ nguyên | Nghiệp vụ ghi chú |
| TC_BRDAO_FINDALLSLIP_09 | Slip status mix `'Chưa trả'/'Đã trả'` | DB trả row status | Resolve giữ nguyên | Business |
| TC_BRDAO_FINDALLSLIP_10 | Robustness: DB trả `results=null` → resolve crash? (ghi nhận) | `cb(null,null)` | Throw TypeError hoặc resolve undefined tùy runtime | `results[0]` với null sẽ crash ⇒ bug |
| TC_BRDAO_FINDALLSLIP_11 | CheckDB: `db.query` gọi với (sql, cb) đúng 2 args | gọi hàm | length args=2 | Contract |
| TC_BRDAO_FINDALLSLIP_12 | Data integrity: giữ nguyên field lạ | row có field lạ | Resolve giữ nguyên | DAO không map |

---

## 5. createBorrowReturnSlipDAO(data)

> **Nghiệp vụ:** Tạo phiếu mượn mới và set trạng thái đang mượn.
> - Nếu `data.equipments[0].EQUIPMENT_ITEM_Name` tồn tại ⇒ coi là **mượn thiết bị** (EQUIPMENT_ITEM).
> - Ngược lại ⇒ coi là **mượn phòng** (ROOM).
> - Tạo `BORROW_RETURN_SLIP` status `'Chưa trả'` + `BORROW_RETURN_DATE` (borrow/exception return) + nhiều `BORROW_RETURN_ITEM`, và update status item `'Đang mượn'`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BRDAO_CREATE_01 | Tạo phiếu mượn **thiết bị** 1 item thành công | `data.equipments=[{ID:10,EQUIPMENT_ITEM_Name:'EPX200-001'}]`, DB trả `results[0].insertId=1` | Resolve `{borrowReturnSlipId:1, equipments:[10], message:'Tạo phiếu mượn thành công'}` | Happy path equipment |
| TC_BRDAO_CREATE_02 | Tạo phiếu mượn **thiết bị** nhiều item thành công | equipments `[10,11,12]` | `equipments=[10,11,12]` | Map `e.ID` |
| TC_BRDAO_CREATE_03 | Tạo phiếu mượn **phòng** 1 item thành công | `data.equipments=[{ID:3,ROOM_Name:'A101'}]` (không có EQUIPMENT_ITEM_Name), DB insertId=2 | Resolve `{borrowReturnSlipId:2, equipments:[3], ...}` | Happy path room |
| TC_BRDAO_CREATE_04 | Tạo phiếu mượn phòng nhiều item (nếu nghiệp vụ cho phép) | rooms `[3,4]` | equipments=[3,4] | Ghi nhận: code cho phép loop nhiều phòng |
| TC_BRDAO_CREATE_05 | CheckDB: SQL luôn insert BORROW_RETURN_SLIP với status `'Chưa trả'` | gọi hàm | SQL chứa `VALUES\n\t\t\t  ('Chưa trả'` | Regression |
| TC_BRDAO_CREATE_06 | CheckDB: SQL có `SET @slipId = LAST_INSERT_ID()` | gọi hàm | SQL chứa `LAST_INSERT_ID()` | Đảm bảo FK dùng slipId |
| TC_BRDAO_CREATE_07 | CheckDB: Insert BORROW_RETURN_DATE dùng convertDateArray(StartDate/EndDate) | `StartDate=['1','2026-04-11']`, `EndDate=['2','2026-04-11']` | SQL chứa `'YYYY-MM-DD HH:MM:SS'` cho cả 2 date | Test gián tiếp convertDateArray |
| TC_BRDAO_CREATE_08 | CheckDB: Với equipment, mỗi item tạo INSERT BORROW_RETURN_ITEM(EQUIPMENT_ITEM_ID, BORROW_RETURN_SLIP_ID) | equipments 2 items | SQL có 2 block `INSERT INTO ... (EQUIPMENT_ITEM_ID, BORROW_RETURN_SLIP_ID)` | Đếm số block theo length |
| TC_BRDAO_CREATE_09 | CheckDB: Với room, mỗi item tạo INSERT BORROW_RETURN_ITEM(ROOM_ID, BORROW_RETURN_SLIP_ID) | rooms 2 items | SQL có 2 block `(...ROOM_ID, BORROW_RETURN_SLIP_ID)` | Branch room |
| TC_BRDAO_CREATE_10 | CheckDB: Với equipment, mỗi item update EQUIPMENT_ITEM_Status='Đang mượn' | equipments | SQL có `UPDATE datn.EQUIPMENT_ITEM\n\t\t\t  SET EQUIPMENT_ITEM_Status = 'Đang mượn'` | Business set đang mượn |
| TC_BRDAO_CREATE_11 | CheckDB: Với room, mỗi item update ROOM_Status='Đang mượn' | rooms | SQL có `UPDATE datn.ROOM\n\t\t\t  SET ROOM_Status = 'Đang mượn'` | Business set đang mượn |
| TC_BRDAO_CREATE_12 | Dữ liệu Note rỗng vẫn tạo phiếu được (theo code) | `Note=''` | Resolve success | Validation không có |
| TC_BRDAO_CREATE_13 | BORROW_RETURN_SLIP_Name có dấu tiếng Việt vẫn tạo được | Name `'Phiếu mượn thiết bị lớp 12A'` | Resolve success | Unicode string |
| TC_BRDAO_CREATE_14 | StartDate/EndDate đảo ngược (Start > End) vẫn tạo (ghi nhận) | StartDate sau EndDate | Resolve success hoặc DB ok | Business rule nên chặn ở service |
| TC_BRDAO_CREATE_15 | equipments rỗng → crash (ghi nhận) | `equipments=[]` | Throw TypeError (`equipments[0]`) | Nên validate input |
| TC_BRDAO_CREATE_16 | equipments undefined → crash (ghi nhận) | `data={}` | Throw TypeError | Nên validate |
| TC_BRDAO_CREATE_17 | equipment item thiếu ID → SQL chứa `undefined` (ghi nhận) | equipments `[{EQUIPMENT_ITEM_Name:'X'}]` | DB error / reject err | Vì `${item.ID}` |
| TC_BRDAO_CREATE_18 | room item thiếu ID → SQL chứa `undefined` (ghi nhận) | rooms `[{ROOM_Name:'A101'}]` | DB error / reject err | `${item.ID}` |
| TC_BRDAO_CREATE_19 | user object thiếu ID → SQL sai (ghi nhận) | `USER={}` | DB error / reject err | `${data.USER.ID}` |
| TC_BRDAO_CREATE_20 | DB reject khi insert/query lỗi → reject err | db.query cb(err) | Reject `err` | Negative path |
| TC_BRDAO_CREATE_21 | Robustness: DB trả results không có `[0].insertId` → borrowReturnSlipId undefined | results `[{}]` | Resolve `{borrowReturnSlipId: undefined, ...}` | Ghi nhận phụ thuộc driver |
| TC_BRDAO_CREATE_22 | Security regression: Name chứa dấu `'` làm vỡ SQL (ghi nhận rủi ro) | `BORROW_RETURN_SLIP_Name="O'Hara"` | DB error / reject err | Không escape string |
| TC_BRDAO_CREATE_23 | Security regression: Note chứa `'` làm vỡ SQL | `Note="I'm ok"` | DB error / reject err | Không escape |
| TC_BRDAO_CREATE_24 | Security regression: SQL injection attempt trong Name | `Name="x'); DROP TABLE datn.BORROW_RETURN_SLIP; --"` | DB error hoặc nguy cơ injection | Ghi nhận lỗ hổng do interpolation |
| TC_BRDAO_CREATE_25 | Security regression: equipment ID injection (string) | `equipments=[{ID:"1; DROP TABLE datn.EQUIPMENT_ITEM;--",EQUIPMENT_ITEM_Name:'X'}]` | DB error / nguy cơ injection | ID cũng bị nối chuỗi |
| TC_BRDAO_CREATE_26 | Nhiều equipments trùng ID vẫn sinh nhiều statement (ghi nhận) | `[ID:10, ID:10]` | SQL có 2 block insert/update | Business nên dedupe |
| TC_BRDAO_CREATE_27 | Mượn thiết bị đang `'Hỏng'` vẫn set `'Đang mượn'` (ghi nhận) | equipment status 'Hỏng' | Code vẫn update 'Đang mượn' | Rule nên chặn ở service |
| TC_BRDAO_CREATE_28 | Mượn thiết bị đang `'Đang mượn'` vẫn update `'Đang mượn'` (ghi nhận) | status 'Đang mượn' | Không phát hiện conflict | Business: không cho mượn trùng |
| TC_BRDAO_CREATE_29 | Mượn phòng đang `'Đang sửa chữa'` vẫn update `'Đang mượn'` (ghi nhận) | room status 'Đang sửa chữa' | Code vẫn update | Rule nghiệp vụ thiếu |
| TC_BRDAO_CREATE_30 | CheckDB: có đúng số lần INSERT/UPDATE theo số item | equipments length=N | SQL chứa N lần INSERT ITEM và N lần UPDATE status | Verify loop build sql |
| TC_BRDAO_CREATE_31 | DATE_ActualReturnDate luôn NULL khi tạo phiếu | input bình thường | SQL chứa `DATE_ActualReturnDate, ... VALUES (..., NULL, @slipId)` | Nghiệp vụ chưa trả |
| TC_BRDAO_CREATE_32 | Khi convertDateArray trả NaN (ngày invalid) → DB reject | StartDate=['1','not-a-date'] | reject err | Date invalid string |
| TC_BRDAO_CREATE_33 | Phân nhánh equipment dựa vào `equipments[0].EQUIPMENT_ITEM_Name` | equipments[0] có field | chọn nhánh equipment | Behavior spec |
| TC_BRDAO_CREATE_34 | Phân nhánh room khi equipment name falsy/undefined | equipments[0] không có field | chọn nhánh room | Behavior spec |
| TC_BRDAO_CREATE_35 | `equipments` chứa mix equipment+room (bất nhất) (ghi nhận) | first là equipment, sau là room | SQL build theo nhánh equipment | Business nên validate homogeneity |
| TC_BRDAO_CREATE_36 | `BORROW_RETURN_SLIP_Name` rỗng (ghi nhận) | Name='' | DB có thể reject hoặc accept | Validation phụ thuộc DB |

---

## 6. borrowReturnSlipDAO(data)

> **Nghiệp vụ:** Trả thiết bị/phòng cho 1 phiếu:
> 1) Update `BORROW_RETURN_SLIP_Status` = `'Đã trả'`
> 2) Update `DATE_ActualReturnDate` = NOW() (timezone +07)
> 3) Nếu trả thiết bị: update từng `EQUIPMENT_ITEM` status về `'Có sẵn'` nếu đang `'Đang mượn'`
> 4) Nếu trả phòng: update `ROOM` status về `'Có sẵn'` nếu đang `'Đang mượn'`
> Tất cả chạy trong transaction: lỗi ở bất kỳ bước nào ⇒ rollback.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_BRDAO_RETURN_01 | Reject khi data không phải array | `data=null` | Reject `Error('Data is empty or invalid')` | Try/catch throw -> reject |
| TC_BRDAO_RETURN_02 | Reject khi data là [] | `data=[]` | Reject `Error('Data is empty or invalid')` | Validate đầu vào |
| TC_BRDAO_RETURN_03 | SlipId lấy từ `BORROW_RETURN_SLIP_ID` | `data=[{BORROW_RETURN_SLIP_ID:1, items:[...]}]` | Tiếp tục transaction | Branch slipId |
| TC_BRDAO_RETURN_04 | SlipId lấy từ `ID` khi thiếu BORROW_RETURN_SLIP_ID | `data=[{ID:2, items:[...]}]` | Tiếp tục transaction | Fallback slip.ID |
| TC_BRDAO_RETURN_05 | Reject khi slipId undefined | `data=[{items:[]}]` | Reject `Error('Invalid BORROW_RETURN_SLIP_ID')` | Validate slipId |
| TC_BRDAO_RETURN_06 | Reject khi slipId không phải số | `data=[{BORROW_RETURN_SLIP_ID:'abc'}]` | Reject `Error('Invalid BORROW_RETURN_SLIP_ID')` | `isNaN('abc')` true |
| TC_BRDAO_RETURN_07 | Accept slipId là numeric string | `slipId='1'` | Transaction chạy | `isNaN('1')` false |
| TC_BRDAO_RETURN_08 | beginTransaction lỗi → reject err | mock `beginTransaction(cb(err))` | Reject `err` | Không chạy query |
| TC_BRDAO_RETURN_09 | CheckDB: Query 1 update slip status `'Đã trả'` | success path | `db.query` gọi SQL chứa `SET BORROW_RETURN_SLIP_Status = 'Đã trả'` | Regression |
| TC_BRDAO_RETURN_10 | Update slip lỗi → rollback + reject err | query1 cb(err) | rollback called; reject err | Transaction |
| TC_BRDAO_RETURN_11 | CheckDB: Query 2 update ActualReturnDate dùng CONVERT_TZ | success path | SQL chứa `CONVERT_TZ(NOW(), '+00:00', '+07:00')` | Timezone requirement |
| TC_BRDAO_RETURN_12 | Update date lỗi → rollback + reject err | query2 cb(err) | rollback called; reject err | Transaction |
| TC_BRDAO_RETURN_13 | Trả **thiết bị** 1 item: status `'Đang mượn'` → `'Có sẵn'` | items `[{EQUIPMENT_ITEM_ID:10,EQUIPMENT_ITEM_Status:'Đang mượn'}]` | Resolve `true` | Business mapping status |
| TC_BRDAO_RETURN_14 | Trả thiết bị 1 item: status không phải `'Đang mượn'` giữ nguyên | status `'Hỏng'` | Update status `'Hỏng'` | Code: else keep |
| TC_BRDAO_RETURN_15 | Trả thiết bị nhiều item: tất cả update ok → commit 1 lần | items length 3 | Resolve true; commit called once | completed counter |
| TC_BRDAO_RETURN_16 | Trả thiết bị: item thiếu `EQUIPMENT_ITEM_ID` → rollback + reject Error | items `[{},...]` | Reject `Error('EQUIPMENT_ITEM_ID missing')` | Validate từng item |
| TC_BRDAO_RETURN_17 | Trả thiết bị: query update 1 item lỗi → rollback + reject err | updateOneEquipment cb(err) | rollback called; reject err | Transaction |
| TC_BRDAO_RETURN_18 | Trả thiết bị: commit callback trả err → reject err | commit(cb(err)) | Reject err | Code `err ? reject(err)` |
| TC_BRDAO_RETURN_19 | Trả thiết bị: items=[] → đi nhánh room và reject (ghi nhận) | items `[]` | Reject `Error('ROOM_ID or status not found')` | Behavior hiện tại (nên validate items) |
| TC_BRDAO_RETURN_20 | Trả **phòng**: ROOM_Status `'Đang mượn'` → `'Có sẵn'` | items `[{ROOM_ID:3, ROOM_Status:'Đang mượn'}]` | Resolve true | Business mapping room |
| TC_BRDAO_RETURN_21 | Trả phòng: ROOM_Status `'Đang sửa chữa'` giữ nguyên | oldStatus 'Đang sửa chữa' | Update 'Đang sửa chữa' | Code: else keep |
| TC_BRDAO_RETURN_22 | Trả phòng: thiếu ROOM_ID → rollback + reject Error | items `[{ROOM_Status:'Đang mượn'}]` | Reject `Error('ROOM_ID or status not found')` | Validate roomId |
| TC_BRDAO_RETURN_23 | Trả phòng: thiếu ROOM_Status → rollback + reject Error | items `[{ROOM_ID:3}]` | Reject `Error('ROOM_ID or status not found')` | Validate status |
| TC_BRDAO_RETURN_24 | Trả phòng: update room lỗi → rollback + reject err | updateRoom cb(err) | rollback called | Transaction |
| TC_BRDAO_RETURN_25 | Trả phòng: commit callback trả err → reject err | commit(cb(err)) | Reject err | Negative path |
| TC_BRDAO_RETURN_26 | Khi `slip.items` undefined → items=[] và bị reject (ghi nhận) | slip không có items | Reject `ROOM_ID or status not found` | Nên validate items tồn tại |
| TC_BRDAO_RETURN_27 | `items` là null thay vì [] → crash? (ghi nhận) | `items=null` | Reject error (TypeError) | `items = slip.items || []` => null => []? thực tế null || [] => [] |
| TC_BRDAO_RETURN_28 | CheckDB: equipment path phải UPDATE datn.EQUIPMENT_ITEM bằng placeholder `?` và params `[status,id]` | success path | `db.query(updateOneEquipmentSQL,[newStatus,id],cb)` | Query parameterized ở bước trả |
| TC_BRDAO_RETURN_29 | CheckDB: room path UPDATE datn.ROOM dùng placeholder `?` | success path | params `[newStatus, roomId]` | Query parameterized |
| TC_BRDAO_RETURN_30 | Mixed payload: items[0] có EQUIPMENT_ITEM_ID nhưng item sau lại là room → fail (ghi nhận) | items `[ {EQUIPMENT_ITEM_ID:10}, {ROOM_ID:3} ]` | rollback + reject equipment missing ID | Business should validate homogeneity |
| TC_BRDAO_RETURN_31 | SlipId numeric 0 bị coi invalid (ghi nhận) | slipId=0 | Reject Invalid BORROW_RETURN_SLIP_ID | `!slipId` check |
| TC_BRDAO_RETURN_32 | SlipId âm vẫn pass isNaN nhưng business không hợp lệ (ghi nhận) | slipId=-1 | Transaction chạy | Nên validate >0 |
| TC_BRDAO_RETURN_33 | Update slip query dùng đúng param slipId | slipId=5 | params `[5]` | CheckDB |
| TC_BRDAO_RETURN_34 | Update date query dùng đúng param slipId | slipId=5 | params `[5]` | CheckDB |
| TC_BRDAO_RETURN_35 | Equipment status mapping: `'Đang mượn'` → `'Có sẵn'` | item status 'Đang mượn' | update status 'Có sẵn' | Business |
| TC_BRDAO_RETURN_36 | Equipment status mapping: `'Hỏng'` giữ nguyên | item status 'Hỏng' | update 'Hỏng' | Business |
| TC_BRDAO_RETURN_37 | Room status mapping: `'Đang mượn'` → `'Có sẵn'` | oldStatus 'Đang mượn' | update 'Có sẵn' | Business |
| TC_BRDAO_RETURN_38 | Room status mapping: `'Có sẵn'` giữ nguyên (ghi nhận) | oldStatus 'Có sẵn' | update 'Có sẵn' | “Trả” idempotent |
| TC_BRDAO_RETURN_39 | Regression: commit chỉ chạy sau khi update xong tất cả equipment items | items length N | commit gọi sau N callback | completed counter |
| TC_BRDAO_RETURN_40 | Regression: rollback phải được gọi đúng 1 lần khi lỗi giữa chừng | mock lỗi ở item k | rollback called once | Transaction correctness |

---

## Tổng kết borrowReturn.dao.js

| Hàm | Số test case (đề xuất) | Độ ưu tiên (theo Strategy) | Nghiệp vụ chính |
|---|---:|---|---|
| `convertDateArray()` | 22 | CAO | Quy đổi tiết + ngày → datetime |
| `findAllBorrowReturn()` | 15 | TRUNG BÌNH | JOIN tổng hợp phiếu + item + user + date |
| `findByUserBorrowReturnSlipDAO()` | 12 | TRUNG BÌNH | Lịch sử phiếu theo user |
| `findAllBorrowReturnSlipDAO()` | 12 | TRUNG BÌNH | JOIN slip/date/item (behavior: chỉ trả row đầu) |
| `createBorrowReturnSlipDAO()` | 36 | CAO | Tạo phiếu + đổi trạng thái đang mượn (SQL multi-statement) |
| `borrowReturnSlipDAO()` | 40 | CAO | Trả + cập nhật ngày trả + rollback/commit |
| **TỔNG** | **137** |  |  |

---

## 1.5. Execution Report — borrowReturn.dao.js

> **Lệnh chạy:**
> ```bash
> npm test -- src/__tests__/dao/borrowReturn.dao.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | 42 passed / 42 total |
| Tests failed | 0 |
| Thời gian chạy | 0.999 s |

### Chi tiết pass/fail theo nhóm

| Nhóm hàm | Số test | Passed | Failed |
|---|---:|---:|---:|
| `convertDateArray()` | 7 | 7 | 0 |
| `findAllBorrowReturn()` | 5 | 5 | 0 |
| `findByUserBorrowReturnSlipDAO()` | 5 | 5 | 0 |
| `findAllBorrowReturnSlipDAO()` | 5 | 5 | 0 |
| `createBorrowReturnSlipDAO()` | 8 | 8 | 0 |
| `borrowReturnSlipDAO()` | 12 | 12 | 0 |
| **TỔNG** | **42** | **42** | **0** |

### Screenshot — Terminal output

> 📸 **[SCREENSHOT BRDAO-1]** Chụp toàn bộ terminal từ dòng `PASS src/__tests__/dao/borrowReturn.dao.test.js` đến các dòng tổng kết:
> - `Tests: 42 passed, 42 total`
> - `Time: 0.999 s`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — borrowReturn.dao.js

> **Lệnh chạy:**
> ```bash
> npm test -- src/__tests__/dao/borrowReturn.dao.test.js --coverage --collectCoverageFrom=src/module/borrowReturn/borrowReturn.dao.js --coverageReporters=text --coverageReporters=html
> ```
> **HTML report:** `backend/coverage/lcov-report/index.html`

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---:|---:|---:|---:|
| `borrowReturn.dao.js` | 97.32% | 87.5% | 97.14% | 99% |

### Mục tiêu coverage

| Chỉ số | Mục tiêu | Thực tế | Đạt? |
|---|---|---:|---|
| Statements | ≥ 80% | 97.32% | ✅ |
| Branches | ≥ 80% | 87.5% | ✅ |
| Functions | ≥ 80% | 97.14% | ✅ |
| Lines | ≥ 80% | 99% | ✅ |

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[SCREENSHOT BRDAO-2]** Chụp bảng `File | % Stmts | % Branch | % Funcs | % Lines` trong terminal (đảm bảo thấy dòng của `borrowReturn.dao.js` và các số `97.32 | 87.5 | 97.14 | 99`)

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT BRDAO-3]** Mở `backend/coverage/lcov-report/index.html` bằng browser → chụp trang tổng quan

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết borrowReturn.dao.js)

> 📸 **[SCREENSHOT BRDAO-4]** Trên trang HTML, click `borrowReturn` → click `borrowReturn.dao.js` → chụp phần code highlight (đoạn line được cover/uncover)

_(Dán ảnh vào đây)_

---

# UNIT TEST DETAIL - request.dao.js

> **File:** `backend/src/module/request/request.dao.js`
> **Module/Layer:** `RequestDAO` (DAO Layer — thao tác DB MySQL qua `db.query` + transaction)
> **Framework:** Jest | **Mock gợi ý:** mock `../../config/configDB` với `query/beginTransaction/commit/rollback`
> **Nghiệp vụ hệ thống (theo code hiện tại):**
> - **Tạo phiếu yêu cầu**: Insert `REQUEST_SLIP` với status mặc định `'Chưa duyệt'`, `REQUEST_SLIP_RequestDate = NOW()`, `APPROVER_ID = NULL`.
> - **Chi tiết yêu cầu**: Nếu có `items`, insert nhiều dòng `REQUEST_ITEM` liên kết `REQUEST_SLIP_ID`.
> - **Duyệt phiếu**: Update `REQUEST_SLIP_Status` + `REQUEST_SLIP_ApproveNotes`; nếu có `items` thì update `EQUIPMENT_ITEM_Status = 'Có sẵn'` theo `EQUIPMENT_ITEM_Name`.

---

## 1. requestSlip(data)

> **Nghiệp vụ:** Người dùng (thường là Giáo viên/Ban quản lý) tạo **phiếu yêu cầu**; phiếu ở trạng thái **chờ duyệt** (`'Chưa duyệt'`).
> - Bắt buộc theo DB/business thường có: `REQUEST_SLIP_Name`, `REQUEST_SLIP_Description` (note), `REQUESTER_ID`.
> - `items` có thể rỗng (phiếu tổng quát) hoặc có nhiều item.
> - Tất cả chạy trong transaction: lỗi ở bất kỳ bước nào ⇒ rollback.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_REQDAO_REQSLIP_01 | Tạo phiếu yêu cầu thành công với 1 item | `data={REQUEST_SLIP_Name:'Yêu cầu thiết bị', REQUEST_SLIP_Note:'Mua mới', USER_ID:5, items:[{ID:10,EQUIPMENT_ITEM_Name:'EPX200-001',EQUIPMENT_ITEM_Description:'Máy chiếu',EQUIPMENT_TYPE_Name:'Projector',EQUIPMENT_ITEM_Status:'Đề xuất',REQUEST_ITEM_Status:'Chưa duyệt'}]}` | Resolve `{slipId:<insertId>}` | Happy path: slip + 1 item |
| TC_REQDAO_REQSLIP_02 | Tạo phiếu yêu cầu thành công với nhiều items (3 items) | `items=[item1,item2,item3]` | Resolve `{slipId}` sau khi insert đủ 3 item | Verify commit sau item cuối |
| TC_REQDAO_REQSLIP_03 | Tạo phiếu thành công khi `items=[]` (không có item) | `items=[]` | Resolve `{slipId}` | Code: commit ngay sau insert slip |
| TC_REQDAO_REQSLIP_04 | Tạo phiếu thành công khi `items` không phải array (null) | `items=null` | Resolve `{slipId}` | Code: `!Array.isArray(items)` ⇒ commit |
| TC_REQDAO_REQSLIP_05 | Tạo phiếu thành công khi không truyền `items` | thiếu `items` | Resolve `{slipId}` | Phiếu tổng quát |
| TC_REQDAO_REQSLIP_06 | CheckDB: gọi `beginTransaction` đúng 1 lần | input hợp lệ | `db.beginTransaction` called once | Transaction wrapper |
| TC_REQDAO_REQSLIP_07 | CheckDB: Insert slip dùng placeholder `?` (chống SQL injection) | Name/Note có ký tự nguy hiểm | `db.query(insertSlipSQL, slipValues, cb)` | Không nối string |
| TC_REQDAO_REQSLIP_08 | CheckDB: Slip status luôn `'Chưa duyệt'` | input bất kỳ | slipValues[1] = `'Chưa duyệt'` | Default status |
| TC_REQDAO_REQSLIP_09 | CheckDB: RequestDate set bằng `NOW()` từ DB | input hợp lệ | SQL chứa `NOW()` | Timestamp server-side |
| TC_REQDAO_REQSLIP_10 | CheckDB: Approver fields mặc định NULL | input hợp lệ | SQL chứa `REQUEST_SLIP_ApproveNotes ... NULL` và `APPROVER_ID ... NULL` | Chưa duyệt chưa có approver |
| TC_REQDAO_REQSLIP_11 | CheckDB: SlipValues map đúng field Name/Note/User_ID | input hợp lệ | values = `[Name,'Chưa duyệt',Note,USER_ID]` | Đúng mapping |
| TC_REQDAO_REQSLIP_12 | CheckDB: Insert item dùng placeholder `?` và truyền đúng 7 params | input items hợp lệ | `values=[slipId, name, desc, type, status, requestItemStatus, id]` | Regression mapping |
| TC_REQDAO_REQSLIP_13 | CheckDB: Mỗi item sẽ insert đúng 1 lần | items length = N | `db.query(insertItemSQL, ...)` called N times | Loop correctness |
| TC_REQDAO_REQSLIP_14 | Rollback: lỗi beginTransaction → reject ngay | mock beginTransaction err | Reject `err` | Không gọi query |
| TC_REQDAO_REQSLIP_15 | Rollback: lỗi insert slip → rollback và reject | insert slip cb(err) | Reject `err` + `db.rollback` called | Không insert item |
| TC_REQDAO_REQSLIP_16 | Rollback: lỗi insert item ở item thứ 2 → rollback và reject | items 3, item2 lỗi | Reject `err`, rollback called, commit not called | Atomicity |
| TC_REQDAO_REQSLIP_17 | Rollback: lỗi commit (sau insert slip, không có item) → reject | items=[] và commit cb(err) | Reject `err` | Code có nhánh `err ? reject(err)` |
| TC_REQDAO_REQSLIP_18 | Rollback: lỗi commit (sau insert đủ items) → reject | items length>0 và commit cb(err) | Reject `err` | Commit error path |
| TC_REQDAO_REQSLIP_19 | Business: Tên phiếu có unicode tiếng Việt | Name `'Yêu cầu sửa máy chiếu lớp 12A'` | Resolve `{slipId}` | Unicode safe |
| TC_REQDAO_REQSLIP_20 | Business: Note có xuống dòng/chuỗi dài | Note dài | Resolve `{slipId}` hoặc DB reject | Ghi nhận phụ thuộc schema |
| TC_REQDAO_REQSLIP_21 | Business: User_ID là giáo viên tạo phiếu (role không check ở DAO) | `USER_ID=teacherId` | DAO vẫn insert bình thường | Validation role nằm ở layer khác |
| TC_REQDAO_REQSLIP_22 | Business: User_ID không tồn tại (FK) → DB reject | USER_ID=9999 | Reject err | Phụ thuộc FK DB |
| TC_REQDAO_REQSLIP_23 | Edge: thiếu REQUEST_SLIP_Name → DB có thể reject | Name undefined | Reject err | Constraint NOT NULL (nếu có) |
| TC_REQDAO_REQSLIP_24 | Edge: thiếu USER_ID → DB có thể reject | USER_ID undefined | Reject err | Constraint/FK |
| TC_REQDAO_REQSLIP_25 | Edge: item thiếu `ID` → DB có thể reject hoặc insert NULL | item.ID undefined | Reject err hoặc resolve | Phụ thuộc schema `EQUIPMENT_ITEM_ID` |
| TC_REQDAO_REQSLIP_26 | Edge: item thiếu `EQUIPMENT_ITEM_Name` | item missing name | Reject err hoặc insert NULL | Phụ thuộc schema |
| TC_REQDAO_REQSLIP_27 | Security regression: Name chứa payload `"x'); DROP TABLE ..."` vẫn an toàn do params | Name payload | Insert vẫn dùng params array | Chống injection |
| TC_REQDAO_REQSLIP_28 | Security regression: Note chứa `'` không làm vỡ SQL | Note `"I'm ok"` | Resolve `{slipId}` | Params handle quoting |
| TC_REQDAO_REQSLIP_29 | Data consistency: items có 2 item trùng tên vẫn insert đủ 2 dòng | items duplicate names | Resolve `{slipId}` | DAO không dedupe |
| TC_REQDAO_REQSLIP_30 | Performance: tạo phiếu với 50 items | items length=50 | Resolve `{slipId}` sau khi insert đủ | Stress loop |
| TC_REQDAO_REQSLIP_31 | CheckDB: commit chỉ gọi sau khi completed === items.length | items length=N | commit gọi đúng 1 lần sau N callback | completed counter |
| TC_REQDAO_REQSLIP_32 | CheckDB: không commit sớm nếu callback item về không theo thứ tự | items length=3, callbacks out-of-order | commit chỉ khi đủ 3 | Concurrency callbacks |
| TC_REQDAO_REQSLIP_33 | Robustness: DB trả `result.insertId` undefined (driver mismatch) | result `{}` | Resolve `{slipId: undefined}` hoặc lỗi khi insert item | Ghi nhận phụ thuộc driver |
| TC_REQDAO_REQSLIP_34 | Rollback: 2 item lỗi gần như đồng thời (race) vẫn chỉ rollback 1 lần (mong muốn) | mock 2 callback err | Reject err; rollback called | Dao hiện không chống double-callback; ghi nhận |

---

## 2. getAllRequestSlip()

> **Nghiệp vụ:** Ban quản lý/Ban giám hiệu xem danh sách **tất cả phiếu yêu cầu** theo thời gian mới nhất.
> - Query dùng LEFT JOIN nên phiếu không có item vẫn xuất hiện.
> - 1 slip nhiều item ⇒ nhiều dòng cùng `REQUEST_SLIP_ID`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_REQDAO_GETALL_01 | Resolve danh sách khi DB trả nhiều dòng | DB trả mảng rows | Resolve đúng mảng | Happy path |
| TC_REQDAO_GETALL_02 | Resolve `[]` khi chưa có phiếu nào | DB trả `[]` | Resolve `[]` | Empty state |
| TC_REQDAO_GETALL_03 | 1 slip nhiều items → nhiều dòng cùng REQUEST_SLIP_ID | rows có 3 dòng `REQUEST_SLIP_ID=1` | Resolve giữ nguyên 3 dòng | UI group theo slip |
| TC_REQDAO_GETALL_04 | Slip không có item (LEFT JOIN) → REQUEST_ITEM_ID null | row `REQUEST_ITEM_ID=null` | Resolve row giữ nguyên | Slip header only |
| TC_REQDAO_GETALL_05 | CheckDB: SQL có ORDER BY RequestDate DESC | gọi hàm | SQL chứa `ORDER BY rs.REQUEST_SLIP_RequestDate DESC` | Newest first |
| TC_REQDAO_GETALL_06 | CheckDB: SQL có LEFT JOIN REQUEST_ITEM | gọi hàm | SQL chứa `LEFT JOIN datn.REQUEST_ITEM` | Include slips w/o items |
| TC_REQDAO_GETALL_07 | CheckDB: SQL có LEFT JOIN USER để lấy USER_FullName | gọi hàm | SQL chứa `LEFT JOIN datn.USER u` | Show requester name |
| TC_REQDAO_GETALL_08 | DB lỗi (timeout/mất kết nối) → reject err | `db.query` cb(err) | Reject err | Negative path |
| TC_REQDAO_GETALL_09 | Robustness: DB trả `results=null` → resolve null | cb(null,null) | Resolve null | DAO `resolve(results)` |
| TC_REQDAO_GETALL_10 | Data integrity: giữ nguyên field lạ DB trả | row có extra field | Resolve giữ nguyên | DAO không map |
| TC_REQDAO_GETALL_11 | Business: hiển thị đúng status `'Chưa duyệt'` | row status | Resolve status giữ nguyên | Nghiệp vụ chờ duyệt |
| TC_REQDAO_GETALL_12 | Business: hiển thị đúng status `'Đã duyệt'`/`'Từ chối'` | row status | Resolve giữ nguyên | Lịch sử duyệt |
| TC_REQDAO_GETALL_13 | Business: ApproveNotes có thể null | `REQUEST_SLIP_ApproveNotes=null` | Resolve null | Chưa duyệt |
| TC_REQDAO_GETALL_14 | Business: USER_FullName null nếu requester bị xóa (LEFT JOIN) | `USER_FullName=null` | Resolve null | Data drift |
| TC_REQDAO_GETALL_15 | CheckDB: `db.query` gọi với (sql, cb) không params | gọi hàm | `db.query` args length=2 | Contract |

---

## 3. approvedSlip(data)

> **Nghiệp vụ:** Người duyệt cập nhật trạng thái phiếu (`REQUEST_SLIP_Status`) và ghi chú duyệt (`REQUEST_SLIP_ApproveNotes`).
> - Nếu phiếu được duyệt và có `items`, code hiện tại cập nhật trạng thái thiết bị `EQUIPMENT_ITEM_Status = 'Có sẵn'` dựa theo `EQUIPMENT_ITEM_Name`.
> - Transaction: lỗi update slip hoặc update thiết bị ⇒ rollback.
> **Ghi nhận quan trọng:** code hiện không ràng buộc “chỉ khi status = Đã duyệt mới update thiết bị”. Testcase sẽ ghi nhận behavior hiện tại.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_REQDAO_APPROVE_01 | Duyệt phiếu thành công khi không có item | `data={REQUEST_SLIP_ID:1, REQUEST_SLIP_Status:'Đã duyệt', REQUEST_SLIP_ApproveNotes:'OK', items:[]}` | Resolve `{message:'Duyệt phiếu (không có item)'}` | Happy path no-item |
| TC_REQDAO_APPROVE_02 | Duyệt phiếu thành công với 1 item → update thiết bị + commit | items `[ {EQUIPMENT_ITEM_Name:'EPX200-001'} ]` | Resolve `{message:'Duyệt phiếu & cập nhật thiết bị thành công'}` | Happy path item |
| TC_REQDAO_APPROVE_03 | Duyệt phiếu thành công với nhiều item (3) | items 3 names | Resolve success sau khi update đủ 3 | commit after count==len |
| TC_REQDAO_APPROVE_04 | CheckDB: beginTransaction gọi đúng 1 lần | input hợp lệ | beginTransaction called once | Transaction wrapper |
| TC_REQDAO_APPROVE_05 | CheckDB: update REQUEST_SLIP dùng placeholder `?` và truyền đúng 3 params | input hợp lệ | params `[status, notes, slipId]` | Chống injection |
| TC_REQDAO_APPROVE_06 | CheckDB: update thiết bị set status `'Có sẵn'` đúng SQL | input có items | SQL chứa `SET EQUIPMENT_ITEM_Status = 'Có sẵn'` | Business set available |
| TC_REQDAO_APPROVE_07 | CheckDB: update thiết bị WHERE theo `EQUIPMENT_ITEM_Name = ?` | item name | params `[name]` | Ghi nhận update by name |
| TC_REQDAO_APPROVE_08 | Rollback: beginTransaction lỗi → reject err | beginTransaction err | Reject err | Không query |
| TC_REQDAO_APPROVE_09 | Rollback: update slip lỗi → rollback + reject | sqlSlip cb(err) | rollback called; reject err | Atomicity |
| TC_REQDAO_APPROVE_10 | Rollback: update item lỗi ở item thứ 2 → rollback + reject | items 3, item2 err | rollback called; reject err | Atomicity |
| TC_REQDAO_APPROVE_11 | Edge: items undefined → coi như [] và commit message no-item | `items=undefined` | Resolve message no-item | `data.items || []` |
| TC_REQDAO_APPROVE_12 | Edge: items=null → coi như [] và commit message no-item | `items=null` | Resolve message no-item | `null || []` -> [] |
| TC_REQDAO_APPROVE_13 | Edge: REQUEST_SLIP_ID undefined → DB có thể reject | slipId undefined | Reject err | Constraint/WHERE id |
| TC_REQDAO_APPROVE_14 | Edge: status undefined → DB có thể reject hoặc set NULL | status undefined | Reject err hoặc resolve | Phụ thuộc schema |
| TC_REQDAO_APPROVE_15 | Edge: approveNotes null vẫn update được (theo code) | notes null | Resolve success | Placeholder accepts null |
| TC_REQDAO_APPROVE_16 | Business: status = 'Từ chối' và items rỗng → vẫn commit no-item | status 'Từ chối', items=[] | message no-item | DAO không phân biệt |
| TC_REQDAO_APPROVE_17 | Business regression: status='Từ chối' nhưng có items → code vẫn update thiết bị (ghi nhận) | status 'Từ chối', items length>0 | Resolve success & thiết bị bị set 'Có sẵn' | Đây là behavior hiện tại |
| TC_REQDAO_APPROVE_18 | Business: approveNotes chứa unicode tiếng Việt | notes 'Không đủ ngân sách' | Resolve | Unicode safe |
| TC_REQDAO_APPROVE_19 | Business: slipId không tồn tại (affectedRows=0) nhưng không lỗi → DAO vẫn update items/commit | slipId=9999 | Resolve success | DAO không check affectedRows |
| TC_REQDAO_APPROVE_20 | Business: item name không tồn tại (affectedRows=0) nhưng không lỗi → vẫn commit | item name fake | Resolve success | DAO không check affectedRows |
| TC_REQDAO_APPROVE_21 | Security regression: slipId injection payload vẫn an toàn do params | slipId='1 OR 1=1' | params include string | SQL parameterized |
| TC_REQDAO_APPROVE_22 | Security regression: notes chứa payload vẫn an toàn do params | notes payload | update slip uses params | No string concat |
| TC_REQDAO_APPROVE_23 | Data quality: item thiếu EQUIPMENT_ITEM_Name → update thiết bị với undefined | item `{}` | DB có thể reject hoặc update none; DAO resolve nếu không err | Phụ thuộc DB |
| TC_REQDAO_APPROVE_24 | Data quality: item name rỗng '' | name='' | DB update none; DAO commit | Phụ thuộc DB |
| TC_REQDAO_APPROVE_25 | Data drift: trùng EQUIPMENT_ITEM_Name trong DB (nhiều row) → update nhiều row (ghi nhận) | name trùng | DAO vẫn resolve | Risk do update by name |
| TC_REQDAO_APPROVE_26 | Concurrency callbacks: update item trả về không theo thứ tự vẫn commit đúng khi đủ count | items 3, callbacks out-of-order | commit after count==3 | count counter |
| TC_REQDAO_APPROVE_27 | Rollback: 2 item errors race-condition có thể gọi rollback nhiều lần (ghi nhận) | 2 callbacks err | reject 1 err | DAO không guard double-callback |
| TC_REQDAO_APPROVE_28 | CheckDB: khi items=[] không gọi update thiết bị | items=[] | db.query gọi 1 lần (update slip) | Không update item |
| TC_REQDAO_APPROVE_29 | CheckDB: khi items>0, số lần update thiết bị = items.length | items length=N | query called 1+N | 1 slip update + N item updates |
| TC_REQDAO_APPROVE_30 | Robustness: commit error không được xử lý (ghi nhận) | mock commit cb(err) | DAO vẫn resolve | Code commit không nhận err param |

---

## Tổng kết request.dao.js

| Hàm | Số test case (đề xuất) | Độ ưu tiên (theo Strategy) | Nghiệp vụ chính |
|---|---:|---|---|
| `requestSlip(data)` | 34 | CAO | Tạo phiếu yêu cầu + insert items (transaction) |
| `getAllRequestSlip()` | 15 | TRUNG BÌNH | Lấy danh sách yêu cầu (LEFT JOIN, order desc) |
| `approvedSlip(data)` | 30 | CAO | Duyệt phiếu + update thiết bị (transaction) |
| **TỔNG** | **79** |  |  |

---

## 1.5. Execution Report — request.dao.js

> **Thời điểm thực thi:** 2026-04-12
>
> **Lệnh chạy (backend):**
> ```bash
> cd backend
> npm test -- src/__tests__/dao/request.dao.test.js --no-coverage --verbose
> ```

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| Test Suites | 1 passed / 1 total |
| Tests passed | 33 |
| Tests failed | 0 |
| Thời gian chạy | 1.1 s |

### Screenshot — Terminal output

> 📸 **[SCREENSHOT RDAO-1]** Chụp **toàn bộ terminal** từ dòng `PASS src/__tests__/dao/request.dao.test.js` đến dòng `Tests: 33 passed, 33 total` và dòng `Time: 1.1 s`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — request.dao.js

> **Thời điểm thực thi:** 2026-04-12
>
> **Lệnh chạy (backend) — chỉ collect coverage cho file mục tiêu:**
> ```bash
> cd backend
> npm test -- src/__tests__/dao/request.dao.test.js --coverage --collectCoverageFrom=src/module/request/request.dao.js --coverageReporters=text --coverageReporters=html
> ```
>
> **HTML report (Jest lcov):** `backend/coverage/lcov-report/index.html`

### Tóm tắt độ bao phủ

| File | Statements % | Branches % | Functions % | Lines % |
|---|---:|---:|---:|---:|
| `request.dao.js` | 100% | 100% | 100% | 100% |

### Screenshot 1 — Bảng coverage trong terminal

> 📸 **[SCREENSHOT RDAO-2]** Chụp bảng `File | % Stmts | % Branch | % Funcs | % Lines` trong terminal (đảm bảo thấy dòng `request.dao.js | 100 | 100 | 100 | 100`)

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT RDAO-3]** Mở `backend/coverage/lcov-report/index.html` bằng browser → chụp trang tổng quan (có danh sách folder/file và %)

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết request.dao.js)

> 📸 **[SCREENSHOT RDAO-4]** Trên trang HTML, click `request` → click `request.dao.js` → chụp màn hình phần code highlight (xanh = covered, đỏ = not covered)

_(Dán ảnh vào đây)_
