# UNIT TEST DETAIL - auth.guard.ts

> **File:** `frontend/src/app/guards/auth.guard.ts`
> **Function:** `authGuard(route, state)`
> **Framework:** Jasmine + Karma | **Mock:** `AuthService`, `Router`
> **Nghiệp vụ hệ thống:** Các màn hình nghiệp vụ (mượn/trả thiết bị, yêu cầu/phê duyệt, thống kê, quản trị) là **protected routes**. Người dùng **chưa đăng nhập** không được truy cập và phải bị điều hướng sang `/login`.

---

## 1. authGuard(route, state)

> **Nghiệp vụ:**
> - Nếu người dùng đã đăng nhập (`AuthService.isLoggedIn()` trả về truthy) → cho phép vào route (trả về `true`).
> - Nếu chưa đăng nhập → **chặn truy cập** (trả về `false`) và **redirect** sang `/login`.
>
> **Lưu ý triển khai hiện tại:** Guard **không** kiểm tra role/quyền; việc phân quyền (Admin/Teacher/Manager/Board) phải do các guard role riêng đảm nhiệm (`adminGuard`, `teacherGuard`, ...).

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_AUTHGUARD_01 | Cho phép truy cập route nghiệp vụ khi đã đăng nhập (happy path) | `state.url = '/equipment'`; mock `authService.isLoggedIn()` → `true` | Return `true`; `router.navigate` **không** được gọi | Ví dụ nghiệp vụ: giáo viên xem danh sách thiết bị để tạo phiếu mượn |
| TC_AUTHGUARD_02 | Cho phép truy cập route quản trị khi đã đăng nhập | `state.url = '/admin'`; mock `isLoggedIn()` → `true` | Return `true`; không redirect | Guard này chỉ kiểm tra đăng nhập, không phân quyền |
| TC_AUTHGUARD_03 | Chặn truy cập khi chưa đăng nhập và điều hướng sang `/login` | `state.url = '/equipment'`; mock `isLoggedIn()` → `false` | Return `false`; `router.navigate(['/login'])` được gọi 1 lần | Case phổ biến nhất: truy cập trực tiếp URL khi chưa login |
| TC_AUTHGUARD_04 | Chặn truy cập route nhạy cảm (phê duyệt yêu cầu) khi chưa đăng nhập | `state.url = '/approved'`; mock `isLoggedIn()` → `false` | Return `false`; navigate `/login` | Nghiệp vụ: ban giám hiệu phê duyệt yêu cầu là tác vụ nhạy cảm |
| TC_AUTHGUARD_05 | Redirect đúng ngay cả khi URL có query/fragment | `state.url = '/borrow-return?from=menu#top'`; mock `isLoggedIn()` → `false` | Return `false`; navigate `/login` | Hiện tại không lưu `returnUrl`; nếu cần “quay lại trang đang xem” phải bổ sung logic |
| TC_AUTHGUARD_06 | Guard không phụ thuộc `route` (route có thể là object phức tạp) | `route.data = { any: 'value' }`; `state.url='/equipment'`; `isLoggedIn()` → `false` | Return `false`; navigate `/login` | Guard không đọc `route` nên mọi route protected đều xử lý giống nhau |
| TC_AUTHGUARD_07 | Guard không phụ thuộc `state` (kể cả state thiếu/undefined trong test) | `state = undefined as any`; `isLoggedIn()` → `false` | Return `false`; navigate `/login` | Runtime thường không xảy ra, nhưng giúp đảm bảo guard không truy cập `state.url` |
| TC_AUTHGUARD_08 | Xử lý khi `isLoggedIn()` trả về `undefined/null` (bug ở AuthService) | mock `isLoggedIn()` → `undefined` (hoặc `null`) | Return `false`; navigate `/login` | JS dùng truthy/falsey; nên trường hợp này vẫn bị chặn |
| TC_AUTHGUARD_09 | Ghi nhận rủi ro nếu `isLoggedIn()` trả về truthy không phải boolean | mock `isLoggedIn()` → `'true' as any` | Return `true`; không redirect | Đây là “hành vi theo code hiện tại”; nếu muốn chặt chẽ hơn nên đổi sang `isLoggedIn() === true` |
| TC_AUTHGUARD_10 | Propagate lỗi nếu `isLoggedIn()` throw (vd sessionStorage bị chặn / SSR edge) | mock `isLoggedIn()` → throw `SecurityError` | Guard throw; không có return value; `router.navigate` không được gọi | Nghiệp vụ: nếu không đọc được token thì nên coi như chưa đăng nhập; cần chỉnh code để catch lỗi nếu muốn graceful |
| TC_AUTHGUARD_11 | Propagate lỗi nếu `router.navigate` throw đồng bộ | `isLoggedIn()` → `false`; mock `router.navigate` throw `new Error('Navigation failed')` | Guard throw | Bao phủ nhánh lỗi side-effect khi redirect |
| TC_AUTHGUARD_12 | Guard vẫn trả `false` dù `router.navigate` trả Promise reject | `isLoggedIn()` → `false`; `router.navigate` → `Promise.reject(...)` | Return `false`; navigate được gọi | Guard không await promise; có thể phát sinh unhandled rejection nếu không được framework xử lý |
| TC_AUTHGUARD_13 | Guard vẫn trả `false` dù `router.navigate` resolve `false` (navigation canceled) | `isLoggedIn()` → `false`; `router.navigate` → `Promise.resolve(false)` | Return `false`; navigate được gọi | Trường hợp navigation bị cancel/guard khác chặn |
| TC_AUTHGUARD_14 | Verify redirect path đúng chuẩn `/login` | `isLoggedIn()` → `false` | `router.navigate` được gọi đúng với `['/login']` | Tránh sai dạng gọi `'/login'` hoặc nhầm route khác |
| TC_AUTHGUARD_15 | `isLoggedIn()` chỉ được gọi 1 lần cho mỗi lần guard chạy | `isLoggedIn()` là spy; gọi `authGuard` 1 lần | `isLoggedIn` called exactly once | Tránh gọi lặp (tốn tài nguyên, khó debug) |
| TC_AUTHGUARD_16 | Không redirect khi đã đăng nhập (không có side-effect) | `isLoggedIn()` → `true` | `router.navigate` never called | Side-effect redirect chỉ nên xảy ra ở nhánh chưa login |
| TC_AUTHGUARD_17 | Nhiều lần truy cập liên tiếp khi chưa login → mỗi lần đều cố redirect | Gọi guard 3 lần; `isLoggedIn()` → `false` | Mỗi lần return `false`; `router.navigate` tổng 3 lần | Thực tế có thể bị gọi nhiều lần (multiple route checks); cân nhắc tối ưu nếu spam navigation |
| TC_AUTHGUARD_18 | Misconfiguration: gắn guard lên chính route `/login` khi chưa đăng nhập | `state.url='/login'`; `isLoggedIn()` → `false` | Return `false`; navigate `/login` | Có nguy cơ loop/không hiển thị login; cấu hình route nên tránh case này |
| TC_AUTHGUARD_19 | Misconfiguration: gắn guard lên route `/login` khi đã đăng nhập | `state.url='/login'`; `isLoggedIn()` → `true` | Return `true`; không redirect | Có thể khiến trang login bị “bỏ qua” (không mong muốn) |
| TC_AUTHGUARD_20 | Phân quyền không thuộc trách nhiệm của authGuard | Route yêu cầu Admin (business), nhưng `isLoggedIn()` → `true` (user là Teacher) | Return `true` | Trường hợp này phải bị chặn bởi `adminGuard`/guard role tương ứng, không phải `authGuard` |
| TC_AUTHGUARD_21 | Token hết hạn nhưng `isLoggedIn()` vẫn trả true → vẫn cho qua (theo triển khai hiện tại) | Mock `isLoggedIn()` → `true` (dù token “expired” theo nghiệp vụ) | Return `true` | Nghiệp vụ thường cần kiểm tra expiry; hiện tại AuthService không validate expiry nên đây là “gap” cần cải tiến |

---

## Tổng kết auth.guard.ts

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---:|---|---|
| `authGuard(route, state)` | 21 | CAO | Bảo vệ route — bắt buộc đăng nhập, redirect `/login` |

---

## 1.5. Execution Report — auth.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng thực thi unit test cho `auth.guard.ts` (số test pass/fail) bằng terminal screenshot.
>
> **CheckDB:** N/A — Guard không truy cập DB.
>
> **Rollback:** N/A — Guard không thay đổi DB.

> **Lệnh chạy (khuyến nghị: chỉ chạy riêng auth.guard để dễ đối chiếu 21 test case):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/auth.guard.spec.ts
```

> **Ngày chạy:** 12/04/2026

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| File test | `src/app/guards/auth.guard.spec.ts` |
| Tổng số test | **21** |
| Passed | **21** |
| Failed | **0** |
| Trình duyệt | ChromeHeadless |

### Log kết quả (copy từ terminal)

```text
Chrome Headless ... (Windows 10): Executed 21 of 21 SUCCESS
TOTAL: 21 SUCCESS
```

### Screenshot — Terminal output (bằng chứng chạy test)

> 📸 **[SCREENSHOT AUTH-EXEC-01]** Chụp màn hình **terminal** từ đoạn:
> - Bắt đầu ở dòng có chữ **`Karma v... server started`** (hoặc ngay sau đó)
> - Đến hết dòng **`TOTAL: 21 SUCCESS`**
>
> Ảnh phải nhìn thấy rõ các dòng quan trọng sau (hoặc tương đương):
> - `Chrome Headless ...: Executed 21 of 21 SUCCESS ...`
> - `TOTAL: 21 SUCCESS`

_(Dán ảnh vào đây)_

---

# UNIT TEST DETAIL - teacher.guard.ts

> **File:** `frontend/src/app/guards/teacher.guard.ts`
> **Function:** `teacherGuard(route, state)`
> **Framework:** Jasmine + Karma | **Mock:** `AuthService`
> **Nghiệp vụ hệ thống (vai trò Teacher):** Giáo viên là nhóm người dùng thực hiện các thao tác nghiệp vụ như: xem thiết bị/phòng học, **đăng ký** mượn thiết bị, **mượn/trả** theo quy trình của hệ thống. Các route thuộc nhóm Teacher (ví dụ: `/dang-ky`, `/muon`) chỉ nên cho phép người dùng có role **Teacher** truy cập.

---

## 1. teacherGuard(route, state)

> **Nghiệp vụ:**
> - Nếu `AuthService.isTeacher()` trả về truthy → cho phép vào route (trả về `true`).
> - Nếu không → chặn truy cập (trả về `false`).
>
> **CheckDB/Rollback:** N/A — Guard không truy cập DB và không thay đổi DB.
>
> **Lưu ý triển khai hiện tại:** Guard **không redirect** sang trang khác khi bị chặn (không gọi Router). Nếu nghiệp vụ cần điều hướng (vd: về `/login` hoặc `/error`) thì phải bổ sung trong code.
>
> **Lưu ý cấu hình route hiện tại:** Trong `app.routes.ts`, các route nhóm Teacher hiện mới gắn `authGuard` (chưa gắn `teacherGuard`). Điều này có thể làm user đã đăng nhập nhưng **không phải Teacher** vẫn truy cập được các màn Teacher. Bảng testcase dưới đây vẫn mô tả hành vi/requirement theo **teacherGuard**.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_TEACHGUARD_01 | Cho phép truy cập màn hình đăng ký mượn thiết bị khi user là Teacher (happy path) | Mock `authService.isTeacher()` → `true`; `state.url='/dang-ky'` | Return `true` | Nghiệp vụ: giáo viên vào màn hình **Đăng ký** để tạo phiếu đăng ký mượn thiết bị/phòng học |
| TC_TEACHGUARD_02 | Cho phép truy cập màn hình mượn thiết bị khi user là Teacher | Mock `isTeacher()` → `true`; `state.url='/muon'` | Return `true` | Nghiệp vụ: giáo viên thực hiện thao tác **Mượn** theo lịch/phiếu |
| TC_TEACHGUARD_03 | Cho phép truy cập màn hình thiết bị/phòng học khi user là Teacher | Mock `isTeacher()` → `true`; `state.url='/thiet-bi'` (hoặc `'/phong-hoc'`) | Return `true` | Nghiệp vụ: giáo viên xem danh sách thiết bị/phòng để tra cứu trước khi đăng ký |
| TC_TEACHGUARD_04 | Chặn truy cập màn hình đăng ký khi user không phải Teacher (deny path) | Mock `isTeacher()` → `false`; `state.url='/dang-ky'` | Return `false` | Ví dụ: Ban quản lý/khối khác cố truy cập URL đăng ký của giáo viên |
| TC_TEACHGUARD_05 | Chặn truy cập màn hình mượn khi user không phải Teacher | Mock `isTeacher()` → `false`; `state.url='/muon'` | Return `false` | Nghiệp vụ: chỉ giáo viên mới thao tác mượn theo vai trò |
| TC_TEACHGUARD_06 | Chặn truy cập khi chưa đăng nhập (giả định `isTeacher()` trả false) | Mock `isTeacher()` → `false`; `state.url='/dang-ky'` | Return `false` | Thực tế thường kết hợp `authGuard` trước, nhưng testcase này đảm bảo `teacherGuard` tự nó vẫn deny |
| TC_TEACHGUARD_07 | Chặn truy cập khi user là Admin nhưng vào route Teacher (theo rule “Teacher-only”) | Mock `isTeacher()` → `false` (role=Admin theo nghiệp vụ); `state.url='/dang-ky'` | Return `false` | Nếu nghiệp vụ muốn Admin được phép vào mọi màn hình, cần thay đổi logic guard (không nằm trong triển khai hiện tại) |
| TC_TEACHGUARD_08 | Chặn truy cập khi user là Facility Manager nhưng vào route Teacher | Mock `isTeacher()` → `false` (role=Facility Manager); `state.url='/muon'` | Return `false` | Phân quyền: Facility Manager quản lý thiết bị/yêu cầu, không thuộc luồng thao tác Teacher |
| TC_TEACHGUARD_09 | Chặn truy cập khi user là Management Board nhưng vào route Teacher | Mock `isTeacher()` → `false` (role=Board); `state.url='/muon'` | Return `false` | Board thường chỉ phê duyệt/thống kê, không thao tác mượn như giáo viên |
| TC_TEACHGUARD_10 | Bảo mật: thiếu dữ liệu role/session → mặc định deny | Mock `isTeacher()` → `false` (token/role undefined do parse lỗi) | Return `false` | Nguyên tắc an toàn: thiếu thông tin quyền thì chặn |
| TC_TEACHGUARD_11 | Xử lý khi `isTeacher()` trả về `undefined/null` (bug/edge) | Mock `isTeacher()` → `undefined` (hoặc `null`) | Return `false` | JS truthy/falsey: undefined/null → falsey |
| TC_TEACHGUARD_12 | Ghi nhận hành vi hiện tại: `isTeacher()` trả truthy không phải boolean vẫn cho qua | Mock `isTeacher()` → `'true' as any` | Return `true` | Đây là “hành vi theo code hiện tại”; nếu muốn strict boolean cần sửa sang `isTeacher() === true` |
| TC_TEACHGUARD_13 | Ghi nhận hành vi hiện tại: `isTeacher()` trả `'Teacher'` (truthy) vẫn cho qua | Mock `isTeacher()` → `'Teacher' as any` | Return `true` | Nếu AuthService normalize role và trả string, guard vẫn pass do truthy |
| TC_TEACHGUARD_14 | Guard không phụ thuộc `route` (route có data phức tạp vẫn xử lý đúng) | `route.data={feature:'dang-ky-muon'}`; mock `isTeacher()` → `false` | Return `false` | Guard không đọc `route` nên mọi quyết định dựa hoàn toàn vào `isTeacher()` |
| TC_TEACHGUARD_15 | Guard không phụ thuộc `state` (state undefined vẫn chạy) | `state = undefined as any`; mock `isTeacher()` → `false` | Return `false` | Đảm bảo guard không truy cập `state.url` trong triển khai hiện tại |
| TC_TEACHGUARD_16 | `isTeacher()` chỉ được gọi 1 lần mỗi lần guard chạy | Spy `isTeacher()`; gọi `teacherGuard` 1 lần | `isTeacher` called exactly once | Tránh gọi lặp (tốn tài nguyên, khó debug) |
| TC_TEACHGUARD_17 | Nhiều lần check liên tiếp: hành vi nhất quán (deny) | Gọi guard 3 lần; `isTeacher()` → `false` | Mỗi lần return `false` | Router có thể evaluate guard nhiều lần; hành vi phải nhất quán |
| TC_TEACHGUARD_18 | Propagate lỗi nếu `isTeacher()` throw (document hiện trạng) | Mock `isTeacher()` throw `Error('token parse failed')` | Guard throw | Nếu muốn graceful (deny thay vì throw) thì cần try/catch trong guard/AuthService |
| TC_TEACHGUARD_19 | Misconfiguration: gắn teacherGuard lên chính route `/login` khi user không phải Teacher | `state.url='/login'`; mock `isTeacher()` → `false` | Return `false` | Có thể khiến trang login bị chặn/không hiển thị; cấu hình route nên tránh |
| TC_TEACHGUARD_20 | Rủi ro bảo mật: “tamper client role” — nếu `isTeacher()` trả true thì guard cho qua | Mock `isTeacher()` → `true` trong khi nghiệp vụ “user không phải Teacher” | Return `true` | Nhấn mạnh: phân quyền cuối cùng phải kiểm soát ở backend; guard chỉ là lớp UI-gating |

---

## Tổng kết teacher.guard.ts

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---:|---|---|
| `teacherGuard(route, state)` | 20 | CAO | Cho phép Teacher, chặn người dùng không phải Teacher |

---

## 1.5. Execution Report — teacher.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng thực thi unit test cho `teacher.guard.ts` (số test pass/fail) bằng terminal screenshot.
>
> **CheckDB:** N/A — Guard không truy cập DB.
>
> **Rollback:** N/A — Guard không thay đổi DB.

> **Lệnh chạy (khuyến nghị: chỉ chạy riêng teacher.guard để dễ đối chiếu 20 test case):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/teacher.guard.spec.ts
```

> **Ngày chạy:** 12/04/2026

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| File test | `src/app/guards/teacher.guard.spec.ts` |
| Tổng số test (theo bảng TC) | **20** |
| Passed | **20** |
| Failed | **0** |
| Trình duyệt | ChromeHeadless |

### Log kết quả (copy từ terminal)

```text
Chrome Headless ... (Windows 10): Executed 20 of 20 SUCCESS
TOTAL: 20 SUCCESS
```

### Screenshot — Terminal output (bằng chứng chạy test)

> 📸 **[SCREENSHOT TEACHER-EXEC-01]** Chụp màn hình **terminal** từ đoạn:
> - Bắt đầu ở dòng có chữ **`Karma v... server started`** (hoặc ngay sau đó)
> - Đến hết dòng **`TOTAL: 20 SUCCESS`**
>
> Ảnh phải nhìn thấy rõ các dòng quan trọng sau (hoặc tương đương):
> - `Chrome Headless ...: Executed 20 of 20 SUCCESS ...`
> - `TOTAL: 20 SUCCESS`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — teacher.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng độ bao phủ (coverage) bằng terminal + HTML report.
>
> **CheckDB/Rollback:** N/A — không liên quan DB.

> **Lệnh chạy (tạo HTML coverage):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/teacher.guard.spec.ts --code-coverage
```

> **Ngày chạy:** 12/04/2026

> **HTML report:** `frontend/coverage/index.html`

### Tóm tắt coverage (lấy từ terminal)

| Chỉ số | Kết quả |
|---|---|
| Statements | 16.27% (7/43) |
| Branches | 11.76% (2/17) |
| Functions | 6.25% (1/16) |
| Lines | 17.5% (7/40) |

### Log coverage summary (copy từ terminal)

```text
=============================== Coverage summary ===============================
Statements   : 16.27% ( 7/43 )
Branches     : 11.76% ( 2/17 )
Functions    : 6.25% ( 1/16 )
Lines        : 17.5% ( 7/40 )
================================================================================
```

### Screenshot 1 — Coverage summary trong terminal

> 📸 **[SCREENSHOT TEACHER-COV-01]** Chụp màn hình **terminal** đúng khối:
> - Bắt đầu từ dòng `=============================== Coverage summary ===============================`
> - Đến hết dòng `================================================================================`

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT TEACHER-COV-02]** Mở file `frontend/coverage/index.html` bằng browser và chụp:
> - Phần **bảng danh sách file** (có cột % Stmts / % Branch / % Funcs / % Lines)
> - Thấy được dòng liên quan `teacher.guard.ts` trong danh sách (nếu có)

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết teacher.guard.ts)

> 📸 **[SCREENSHOT TEACHER-COV-03]** Trong trang HTML coverage:
> - Click vào dòng `teacher.guard.ts` (hoặc đường dẫn tương ứng trong cây thư mục)
> - Chụp màn hình trang chi tiết có **các dòng code** được tô màu (covered/not covered)

_(Dán ảnh vào đây)_

---

# UNIT TEST DETAIL - facility-manager.guard.ts

> **File:** `frontend/src/app/guards/facility-manager.guard.ts`
> **Function:** `facilityManagerGuard(route, state)`
> **Framework:** Jasmine + Karma | **Mock:** `AuthService`
> **Nghiệp vụ hệ thống (vai trò Facility Manager):** Ban quản lý cơ sở vật chất/thiết bị chịu trách nhiệm xử lý **yêu cầu** (`/request`), **thêm/cập nhật thiết bị** (`/them-cap-nhat`), quản lý **tài khoản** (`/account`) và màn hình **quản lý** (`/quan-ly`). Các route này chỉ cho phép đúng role **Facility Manager** truy cập.

---

## 1. facilityManagerGuard(route, state)

> **Nghiệp vụ:**
> - Nếu `AuthService.isFacilityManager()` trả về truthy → cho phép vào route (trả về `true`).
> - Nếu không → chặn truy cập (trả về `false`).
>
> **CheckDB/Rollback:** N/A — Guard không truy cập DB và không thay đổi DB.
>
> **Lưu ý triển khai hiện tại:** Guard **không redirect** sang trang khác khi bị chặn (không gọi Router). Nếu nghiệp vụ cần điều hướng (vd: về `/login`, `/error`, hoặc trang `/403`) thì phải bổ sung trong code.
>
> **Lưu ý cấu hình route hiện tại:** Trong `app.routes.ts`, các route `/request`, `/them-cap-nhat`, `/account`, `/quan-ly` đang gắn `canActivate: [authGuard, facilityManagerGuard]`.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_FACMGUARD_01 | Cho phép truy cập màn hình xử lý yêu cầu khi user là Facility Manager (happy path) | Mock `authService.isFacilityManager()` → `true`; `state.url='/request'` | Return `true` | Nghiệp vụ: ban quản lý xử lý các yêu cầu mượn/đề xuất thiết bị |
| TC_FACMGUARD_02 | Cho phép truy cập màn hình thêm/cập nhật thiết bị khi user là Facility Manager | Mock `isFacilityManager()` → `true`; `state.url='/them-cap-nhat'` | Return `true` | Nghiệp vụ: tạo/cập nhật thông tin thiết bị thuộc phạm vi quản lý |
| TC_FACMGUARD_03 | Cho phép truy cập màn hình quản lý tài khoản khi user là Facility Manager | Mock `isFacilityManager()` → `true`; `state.url='/account'` | Return `true` | Nghiệp vụ: quản lý thông tin tài khoản/quyền trong phạm vi nghiệp vụ |
| TC_FACMGUARD_04 | Cho phép truy cập màn hình quản lý khi user là Facility Manager | Mock `isFacilityManager()` → `true`; `state.url='/quan-ly'` | Return `true` | Nghiệp vụ: màn tổng hợp/điều phối quản lý thiết bị |
| TC_FACMGUARD_05 | Chặn truy cập `/request` khi user không phải Facility Manager (deny path) | Mock `isFacilityManager()` → `false`; `state.url='/request'` | Return `false` | Ví dụ: Teacher/Board cố truy cập URL xử lý yêu cầu |
| TC_FACMGUARD_06 | Chặn truy cập `/them-cap-nhat` khi user không phải Facility Manager | Mock `isFacilityManager()` → `false`; `state.url='/them-cap-nhat'` | Return `false` | Bảo vệ chức năng thay đổi dữ liệu thiết bị khỏi role không phù hợp |
| TC_FACMGUARD_07 | Chặn truy cập khi chưa đăng nhập (giả định `isFacilityManager()` trả false) | Mock `isFacilityManager()` → `false`; `state.url='/request'` | Return `false` | Thực tế `authGuard` chạy trước, nhưng testcase này đảm bảo guard standalone vẫn deny |
| TC_FACMGUARD_08 | Chặn truy cập khi user là Teacher nhưng cố vào chức năng Facility Manager | Mock `isFacilityManager()` → `false` (role=Teacher theo nghiệp vụ); `state.url='/request'` | Return `false` | Teacher chỉ đăng ký/mượn; không xử lý yêu cầu/quản lý thiết bị |
| TC_FACMGUARD_09 | Chặn truy cập khi user là Management Board nhưng cố vào chức năng Facility Manager | Mock `isFacilityManager()` → `false` (role=Board); `state.url='/request'` | Return `false` | Board thường phê duyệt/thống kê; không thao tác quản lý thiết bị |
| TC_FACMGUARD_10 | Chặn truy cập khi user là Admin nhưng vào route Facility Manager (theo rule “Manager-only”) | Mock `isFacilityManager()` → `false` (role=Admin theo nghiệp vụ); `state.url='/quan-ly'` | Return `false` | Nếu nghiệp vụ muốn Admin được phép vào mọi màn hình, cần thay đổi logic guard (không nằm trong triển khai hiện tại) |
| TC_FACMGUARD_11 | Bảo mật: thiếu dữ liệu role/session → mặc định deny | Mock `isFacilityManager()` → `false` (token/role undefined do parse lỗi) | Return `false` | Nguyên tắc an toàn: thiếu thông tin quyền thì chặn |
| TC_FACMGUARD_12 | Xử lý khi `isFacilityManager()` trả về `undefined/null` (bug/edge) | Mock `isFacilityManager()` → `undefined` (hoặc `null`) | Return `false` | JS truthy/falsey: undefined/null → falsey |
| TC_FACMGUARD_13 | Ghi nhận hành vi hiện tại: `isFacilityManager()` trả truthy không phải boolean vẫn cho qua | Mock `isFacilityManager()` → `'true' as any` | Return `true` | Đây là “hành vi theo code hiện tại”; nếu muốn strict boolean cần sửa sang `isFacilityManager() === true` |
| TC_FACMGUARD_14 | Ghi nhận hành vi hiện tại: `isFacilityManager()` trả `'Manager'` (truthy) vẫn cho qua | Mock `isFacilityManager()` → `'Manager' as any` | Return `true` | Nếu AuthService normalize role và trả string, guard vẫn pass do truthy |
| TC_FACMGUARD_15 | Guard không phụ thuộc `route` (route có data phức tạp vẫn xử lý đúng) | `route.data={feature:'equipment-management'}`; mock `isFacilityManager()` → `false` | Return `false` | Guard không đọc `route` nên mọi quyết định dựa hoàn toàn vào `isFacilityManager()` |
| TC_FACMGUARD_16 | Guard không phụ thuộc `state` (state undefined vẫn chạy) | `state = undefined as any`; mock `isFacilityManager()` → `false` | Return `false` | Đảm bảo guard không truy cập `state.url` trong triển khai hiện tại |
| TC_FACMGUARD_17 | `isFacilityManager()` chỉ được gọi 1 lần mỗi lần guard chạy | Spy `isFacilityManager()`; gọi guard 1 lần | `isFacilityManager` called exactly once | Tránh gọi lặp (tốn tài nguyên, khó debug) |
| TC_FACMGUARD_18 | Nhiều lần check liên tiếp: hành vi nhất quán (deny) | Gọi guard 3 lần; `isFacilityManager()` → `false` | Mỗi lần return `false` | Router có thể evaluate guard nhiều lần; hành vi phải nhất quán |
| TC_FACMGUARD_19 | Propagate lỗi nếu `isFacilityManager()` throw (document hiện trạng) | Mock `isFacilityManager()` throw `Error('token parse failed')` | Guard throw | Nếu muốn graceful (deny thay vì throw) thì cần try/catch trong guard/AuthService |
| TC_FACMGUARD_20 | Misconfiguration: gắn facilityManagerGuard lên chính route `/login` khi user không phải Manager | `state.url='/login'`; mock `isFacilityManager()` → `false` | Return `false` | Có thể khiến trang login bị chặn/không hiển thị; cấu hình route nên tránh |
| TC_FACMGUARD_21 | Rủi ro bảo mật: “tamper client role” — nếu `isFacilityManager()` trả true thì guard cho qua | Mock `isFacilityManager()` → `true` trong khi nghiệp vụ “user không phải Manager” | Return `true` | Nhấn mạnh: phân quyền cuối cùng phải kiểm soát ở backend; guard chỉ là lớp UI-gating |

---

## Tổng kết facility-manager.guard.ts

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---:|---|---|
| `facilityManagerGuard(route, state)` | 21 | CAO | Cho phép Facility Manager, chặn người dùng không phải Facility Manager |

---

## 1.5. Execution Report — facility-manager.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng thực thi unit test cho `facility-manager.guard.ts` (số test pass/fail) bằng terminal screenshot.
>
> **CheckDB:** N/A — Guard không truy cập DB.
>
> **Rollback:** N/A — Guard không thay đổi DB.

> **Lệnh chạy (khuyến nghị: chỉ chạy riêng facility-manager.guard để dễ đối chiếu 21 test case):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/facility-manager.guard.spec.ts
```

> **Ngày chạy:** 12/04/2026

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| File test | `src/app/guards/facility-manager.guard.spec.ts` |
| Tổng số test (theo bảng TC) | **21** |
| Passed | **21** |
| Failed | **0** |
| Trình duyệt | ChromeHeadless |

### Log kết quả (copy từ terminal)

```text
Chrome Headless ... (Windows 10): Executed 21 of 21 SUCCESS
TOTAL: 21 SUCCESS
```

### Screenshot — Terminal output (bằng chứng chạy test)

> 📸 **[SCREENSHOT FACMG-EXEC-01]** Chụp màn hình **terminal** từ đoạn:
> - Bắt đầu ở dòng có chữ **`Karma v... server started`** (hoặc ngay sau đó)
> - Đến hết dòng **`TOTAL: 21 SUCCESS`**
>
> Ảnh phải nhìn thấy rõ các dòng quan trọng sau (hoặc tương đương):
> - `Chrome Headless ...: Executed 21 of 21 SUCCESS ...`
> - `TOTAL: 21 SUCCESS`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — facility-manager.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng độ bao phủ (coverage) bằng terminal + HTML report.
>
> **CheckDB/Rollback:** N/A — không liên quan DB.

> **Lệnh chạy (tạo HTML coverage):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/facility-manager.guard.spec.ts --code-coverage
```

> **Ngày chạy:** 12/04/2026

> **HTML report:** `frontend/coverage/index.html`

### Tóm tắt coverage (lấy từ terminal)

| Chỉ số | Kết quả |
|---|---|
| Statements | 16.27% (7/43) |
| Branches | 11.76% (2/17) |
| Functions | 6.25% (1/16) |
| Lines | 17.5% (7/40) |

### Log coverage summary (copy từ terminal)

```text
=============================== Coverage summary ===============================
Statements   : 16.27% ( 7/43 )
Branches     : 11.76% ( 2/17 )
Functions    : 6.25% ( 1/16 )
Lines        : 17.5% ( 7/40 )
================================================================================
```

### Screenshot 1 — Coverage summary trong terminal

> 📸 **[SCREENSHOT FACMG-COV-01]** Chụp màn hình **terminal** đúng khối:
> - Bắt đầu từ dòng `=============================== Coverage summary ===============================`
> - Đến hết dòng `================================================================================`

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT FACMG-COV-02]** Mở file `frontend/coverage/index.html` bằng browser và chụp:
> - Phần **bảng danh sách file** (có cột % Stmts / % Branch / % Funcs / % Lines)
> - Thấy được dòng liên quan `facility-manager.guard.ts` trong danh sách (nếu có)

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết facility-manager.guard.ts)

> 📸 **[SCREENSHOT FACMG-COV-03]** Trong trang HTML coverage:
> - Click vào dòng `facility-manager.guard.ts` (hoặc đường dẫn tương ứng trong cây thư mục)
> - Chụp màn hình trang chi tiết có **các dòng code** được tô màu (covered/not covered)

_(Dán ảnh vào đây)_

---

# UNIT TEST DETAIL - management-board.guard.ts

> **File:** `frontend/src/app/guards/management-board.guard.ts`
> **Function:** `managementBoardGuard(route, state)`
> **Framework:** Jasmine + Karma | **Mock:** `AuthService`
> **Nghiệp vụ hệ thống (vai trò Management Board):** Ban giám hiệu/Ban quản trị chịu trách nhiệm các tác vụ **phê duyệt** và **theo dõi báo cáo/thống kê**. Các route thuộc nhóm Board (ví dụ nghiệp vụ: phê duyệt yêu cầu, xem báo cáo) chỉ nên cho phép đúng role **Management Board** truy cập.

---

## 1. managementBoardGuard(route, state)

> **Nghiệp vụ:**
> - Nếu `AuthService.isManagementBoard()` trả về truthy → cho phép vào route (trả về `true`).
> - Nếu không → chặn truy cập (trả về `false`).
>
> **CheckDB/Rollback:** N/A — Guard không truy cập DB và không thay đổi DB.
>
> **Lưu ý triển khai hiện tại:** Guard **không redirect** khi bị chặn (không gọi Router). Nếu nghiệp vụ yêu cầu điều hướng (vd: về `/login`, `/error`, hoặc `/403`) thì cần bổ sung logic.
>
> **Lưu ý cấu hình route hiện tại:** Trong `app.routes.ts`, các route nhạy cảm như `/approved` và `/thong-ke-bao-cao` hiện đang gắn `adminGuard` (không phải `managementBoardGuard`). Bảng testcase dưới đây mô tả yêu cầu/behavior theo **managementBoardGuard**.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_MBGUARD_01 | Cho phép truy cập chức năng phê duyệt khi user là Management Board (happy path) | Mock `authService.isManagementBoard()` → `true`; `state.url='/approved'` | Return `true` | Nghiệp vụ: Board vào màn **phê duyệt** các yêu cầu |
| TC_MBGUARD_02 | Cho phép truy cập màn thống kê/báo cáo khi user là Management Board | Mock `isManagementBoard()` → `true`; `state.url='/thong-ke-bao-cao'` | Return `true` | Nghiệp vụ: Board xem báo cáo tổng hợp để ra quyết định |
| TC_MBGUARD_03 | Chặn truy cập phê duyệt khi user không phải Management Board (deny path) | Mock `isManagementBoard()` → `false`; `state.url='/approved'` | Return `false` | Ví dụ: Teacher/Manager cố truy cập URL phê duyệt |
| TC_MBGUARD_04 | Chặn truy cập thống kê/báo cáo khi user không phải Management Board | Mock `isManagementBoard()` → `false`; `state.url='/thong-ke-bao-cao'` | Return `false` | Báo cáo thường chứa thông tin nhạy cảm → chỉ Board được xem |
| TC_MBGUARD_05 | Chặn truy cập khi chưa đăng nhập (giả định `isManagementBoard()` trả false) | Mock `isManagementBoard()` → `false`; `state.url='/approved'` | Return `false` | Thực tế thường có `authGuard` chạy trước, nhưng guard standalone vẫn phải deny |
| TC_MBGUARD_06 | Chặn Teacher truy cập chức năng phê duyệt | Mock `isManagementBoard()` → `false` (role=Teacher); `state.url='/approved'` | Return `false` | Teacher chỉ thao tác đăng ký/mượn; không phê duyệt |
| TC_MBGUARD_07 | Chặn Facility Manager truy cập chức năng phê duyệt (tách nhiệm vụ) | Mock `isManagementBoard()` → `false` (role=Facility Manager); `state.url='/approved'` | Return `false` | Ban quản lý xử lý request/thiết bị, còn phê duyệt thuộc Board |
| TC_MBGUARD_08 | Chặn Admin truy cập route Board (theo rule “Board-only”) | Mock `isManagementBoard()` → `false` (role=Admin); `state.url='/approved'` | Return `false` | Nếu nghiệp vụ muốn Admin vào mọi màn hình, cần đổi logic/requirements |
| TC_MBGUARD_09 | Bảo mật: thiếu dữ liệu role/session → mặc định deny | Mock `isManagementBoard()` → `false` (token/role undefined do parse lỗi) | Return `false` | Nguyên tắc an toàn: thiếu thông tin quyền thì chặn |
| TC_MBGUARD_10 | Xử lý khi `isManagementBoard()` trả `undefined/null` (bug/edge) | Mock `isManagementBoard()` → `undefined` (hoặc `null`) | Return `false` | JS truthy/falsey: undefined/null → falsey |
| TC_MBGUARD_11 | Ghi nhận hành vi hiện tại: `isManagementBoard()` trả truthy không phải boolean vẫn cho qua | Mock `isManagementBoard()` → `'true' as any` | Return `true` | Theo code hiện tại; nếu muốn strict boolean cần sửa sang `isManagementBoard() === true` |
| TC_MBGUARD_12 | Ghi nhận hành vi hiện tại: `isManagementBoard()` trả `'Board'` (truthy) vẫn cho qua | Mock `isManagementBoard()` → `'Board' as any` | Return `true` | Nếu AuthService normalize role và trả string, guard vẫn pass do truthy |
| TC_MBGUARD_13 | Guard không phụ thuộc `route` (route có data phức tạp vẫn xử lý đúng) | `route.data={feature:'approval'}`; mock `isManagementBoard()` → `false` | Return `false` | Guard không đọc route.data nên quyết định dựa hoàn toàn `isManagementBoard()` |
| TC_MBGUARD_14 | Guard không phụ thuộc `state` (state undefined vẫn chạy) | `state = undefined as any`; mock `isManagementBoard()` → `false` | Return `false` | Đảm bảo guard không truy cập `state.url` trong triển khai hiện tại |
| TC_MBGUARD_15 | `isManagementBoard()` chỉ được gọi 1 lần mỗi lần guard chạy | Spy `isManagementBoard()`; gọi guard 1 lần | `isManagementBoard` called exactly once | Tránh gọi lặp (tốn tài nguyên, khó debug) |
| TC_MBGUARD_16 | Nhiều lần check liên tiếp: hành vi nhất quán (deny) | Gọi guard 3 lần; `isManagementBoard()` → `false` | Mỗi lần return `false` | Router có thể evaluate guard nhiều lần; hành vi phải nhất quán |
| TC_MBGUARD_17 | Propagate lỗi nếu `isManagementBoard()` throw (document hiện trạng) | Mock `isManagementBoard()` throw `Error('token parse failed')` | Guard throw | Nếu muốn graceful (deny thay vì throw) thì cần try/catch trong guard/AuthService |
| TC_MBGUARD_18 | Misconfiguration: gắn managementBoardGuard lên route `/login` khi user không phải Board | `state.url='/login'`; mock `isManagementBoard()` → `false` | Return `false` | Có thể khiến trang login bị chặn/không hiển thị; cấu hình route nên tránh |
| TC_MBGUARD_19 | Rủi ro bảo mật: “tamper client role” — nếu `isManagementBoard()` trả true thì guard cho qua | Mock `isManagementBoard()` → `true` trong khi nghiệp vụ “user không phải Board” | Return `true` | Nhấn mạnh: phân quyền cuối cùng phải enforce ở backend; guard chỉ là lớp UI-gating |

---

## Tổng kết management-board.guard.ts

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---:|---|---|
| `managementBoardGuard(route, state)` | 19 | CAO | Cho phép Management Board, chặn người dùng không phải Management Board |

---

## 1.5. Execution Report — management-board.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng thực thi unit test cho `management-board.guard.ts` (số test pass/fail) bằng terminal screenshot.
>
> **CheckDB:** N/A — Guard không truy cập DB.
>
> **Rollback:** N/A — Guard không thay đổi DB.

> **Lệnh chạy (khuyến nghị: chỉ chạy riêng management-board.guard để dễ đối chiếu 19 test case):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/management-board.guard.spec.ts
```

> **Ngày chạy:** 12/04/2026

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| File test | `src/app/guards/management-board.guard.spec.ts` |
| Tổng số test (theo bảng TC) | **19** |
| Passed | **19** |
| Failed | **0** |
| Trình duyệt | ChromeHeadless |

### Log kết quả (copy từ terminal)

```text
Chrome Headless ... (Windows 10): Executed 19 of 19 SUCCESS
TOTAL: 19 SUCCESS
```

### Screenshot — Terminal output (bằng chứng chạy test)

> 📸 **[SCREENSHOT MB-EXEC-01]** Chụp màn hình **terminal** từ đoạn:
> - Bắt đầu ở dòng có chữ **`Karma v... server started`** (hoặc ngay sau đó)
> - Đến hết dòng **`TOTAL: 19 SUCCESS`**
>
> Ảnh phải nhìn thấy rõ các dòng quan trọng sau (hoặc tương đương):
> - `Chrome Headless ...: Executed 19 of 19 SUCCESS ...`
> - `TOTAL: 19 SUCCESS`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — management-board.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng độ bao phủ (coverage) bằng terminal + HTML report.
>
> **CheckDB/Rollback:** N/A — không liên quan DB.

> **Lệnh chạy (tạo HTML coverage):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/management-board.guard.spec.ts --code-coverage
```

> **Ngày chạy:** 12/04/2026

> **HTML report:** `frontend/coverage/index.html`

### Tóm tắt coverage (lấy từ terminal)

| Chỉ số | Kết quả |
|---|---|
| Statements | 16.27% (7/43) |
| Branches | 11.76% (2/17) |
| Functions | 6.25% (1/16) |
| Lines | 17.5% (7/40) |

### Log coverage summary (copy từ terminal)

```text
=============================== Coverage summary ===============================
Statements   : 16.27% ( 7/43 )
Branches     : 11.76% ( 2/17 )
Functions    : 6.25% ( 1/16 )
Lines        : 17.5% ( 7/40 )
================================================================================
```

### Screenshot 1 — Coverage summary trong terminal

> 📸 **[SCREENSHOT MB-COV-01]** Chụp màn hình **terminal** đúng khối:
> - Bắt đầu từ dòng `=============================== Coverage summary ===============================`
> - Đến hết dòng `================================================================================`

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT MB-COV-02]** Mở file `frontend/coverage/index.html` bằng browser và chụp:
> - Phần **bảng danh sách file** (có cột % Stmts / % Branch / % Funcs / % Lines)
> - Thấy được dòng liên quan `management-board.guard.ts` trong danh sách (nếu có)

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết management-board.guard.ts)

> 📸 **[SCREENSHOT MB-COV-03]** Trong trang HTML coverage:
> - Click vào dòng `management-board.guard.ts` (hoặc đường dẫn tương ứng trong cây thư mục)
> - Chụp màn hình trang chi tiết có **các dòng code** được tô màu (covered/not covered)

_(Dán ảnh vào đây)_

---

# UNIT TEST DETAIL - admin.guard.ts

> **File:** `frontend/src/app/guards/admin.guard.ts`
> **Function:** `adminGuard(route, state)`
> **Framework:** Jasmine + Karma | **Mock:** `AuthService`
> **Nghiệp vụ hệ thống:** Các màn hình/chức năng **quản trị hệ thống** (quản lý người dùng, phân quyền, cấu hình danh mục, thao tác quản trị) chỉ cho phép **Admin** truy cập. Người dùng không phải Admin phải bị **chặn truy cập**.

---

## 1. adminGuard(route, state)

> **Nghiệp vụ:**
> - Nếu `AuthService.isAdmin()` trả về truthy → cho phép vào route (trả về `true`).
> - Nếu không → chặn truy cập (trả về `false`).
>
> **CheckDB/Rollback:** N/A — Guard không truy cập DB và không thay đổi DB.
>
> **Lưu ý triển khai hiện tại:** Guard **không redirect** sang trang khác khi bị chặn (không gọi Router). Nếu nghiệp vụ cần điều hướng (vd: về `/login` hoặc `/403`) thì phải bổ sung trong code.

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| TC_ADMINGUARD_01 | Cho phép truy cập trang quản trị khi người dùng là Admin (happy path) | Mock `authService.isAdmin()` → `true`; `state.url='/admin'` | Return `true` | Nghiệp vụ: Admin vào màn hình quản trị người dùng/phân quyền |
| TC_ADMINGUARD_02 | Chặn truy cập trang quản trị khi người dùng không phải Admin | Mock `isAdmin()` → `false`; `state.url='/admin'` | Return `false` | Case phổ biến: giáo viên/ban khác cố truy cập URL admin |
| TC_ADMINGUARD_03 | Chặn truy cập khi chưa đăng nhập (giả định `isAdmin()` trả false) | Mock `isAdmin()` → `false`; `state.url='/admin'` | Return `false` | Nghiệp vụ: chưa login thì chắc chắn không có quyền Admin |
| TC_ADMINGUARD_04 | Chặn truy cập khi user là Teacher nhưng cố vào trang quản trị | Mock `isAdmin()` → `false` (role=Teacher theo nghiệp vụ) | Return `false` | Phân quyền: Teacher chỉ thao tác mượn/trả, không quản trị hệ thống |
| TC_ADMINGUARD_05 | Chặn truy cập khi user là Ban giám hiệu (Board) nhưng cố vào trang quản trị | Mock `isAdmin()` → `false` (role=Board) | Return `false` | Board chỉ phê duyệt, không quản trị người dùng |
| TC_ADMINGUARD_06 | Chặn truy cập khi user là Ban quản lý cơ sở vật chất (Manager) nhưng cố vào trang quản trị | Mock `isAdmin()` → `false` (role=Manager) | Return `false` | Manager quản lý thiết bị, không được phân quyền hệ thống |
| TC_ADMINGUARD_07 | Chặn truy cập khi dữ liệu phiên bị thiếu role (token thiếu/parse lỗi) | Mock `isAdmin()` → `false` (token/role undefined) | Return `false` | Bảo mật: thiếu thông tin quyền → mặc định deny |
| TC_ADMINGUARD_08 | Xử lý khi `isAdmin()` trả về `undefined/null` (bug/edge) | Mock `isAdmin()` → `undefined` (hoặc `null`) | Return `false` | JS truthy/falsey: undefined/null → falsey |
| TC_ADMINGUARD_09 | Ghi nhận hành vi hiện tại: `isAdmin()` trả về truthy không phải boolean vẫn cho qua | Mock `isAdmin()` → `'true' as any` | Return `true` | Đây là hành vi theo code hiện tại (truthy) — nếu muốn strict boolean cần sửa `isAdmin() === true` |
| TC_ADMINGUARD_10 | Ghi nhận hành vi hiện tại: `isAdmin()` trả về chuỗi `'Admin'` (truthy) vẫn cho qua | Mock `isAdmin()` → `'Admin' as any` | Return `true` | Nếu AuthService có normalize role và trả string, guard vẫn pass do truthy |
| TC_ADMINGUARD_11 | Guard không phụ thuộc `route` (route chứa data phức tạp vẫn xử lý đúng) | `route.data={feature:'user-management'}`; `isAdmin()` → `false` | Return `false` | Guard không đọc `route` nên nghiệp vụ dựa hoàn toàn `isAdmin()` |
| TC_ADMINGUARD_12 | Guard không phụ thuộc `state` (state undefined vẫn chạy) | `state = undefined as any`; `isAdmin()` → `false` | Return `false` | Đảm bảo không truy cập `state.url` trong triển khai hiện tại |
| TC_ADMINGUARD_13 | `isAdmin()` chỉ được gọi 1 lần mỗi lần guard chạy | Spy `isAdmin()`; gọi guard 1 lần | `isAdmin` called exactly once | Tránh gọi lặp (dễ gây khó debug / tốn tài nguyên) |
| TC_ADMINGUARD_14 | Nhiều lần check liên tiếp: mỗi lần đều deny nếu không phải Admin | Gọi guard 3 lần; `isAdmin()` → `false` | Mỗi lần return `false` | Router có thể evaluate guard nhiều lần; hành vi phải nhất quán |
| TC_ADMINGUARD_15 | Propagate lỗi nếu `isAdmin()` throw (document hiện trạng) | Mock `isAdmin()` throw `Error('token parse failed')` | Guard throw | Nếu muốn graceful (deny thay vì throw) thì cần try/catch trong guard/AuthService |
| TC_ADMINGUARD_16 | Rủi ro nghiệp vụ: “tamper client role” — nếu `isAdmin()` bị trả true thì guard cho qua | Mock `isAdmin()` → `true` trong khi nghiệp vụ “user không phải Admin” | Return `true` | Nhấn mạnh: kiểm soát quyền cuối cùng phải ở backend; guard chỉ là lớp UI-gating |

---

## Tổng kết admin.guard.ts

| Hàm | Số test case | Độ ưu tiên | Nghiệp vụ chính |
|---|---:|---|---|
| `adminGuard(route, state)` | 16 | CAO | Cho phép Admin, chặn người dùng không phải Admin |

---

## 1.5. Execution Report — admin.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng thực thi unit test cho `admin.guard.ts` (số test pass/fail) bằng terminal screenshot.
>
> **CheckDB:** N/A — Guard không truy cập DB.
>
> **Rollback:** N/A — Guard không thay đổi DB.

> **Lệnh chạy (khuyến nghị: chỉ chạy riêng admin.guard để dễ đối chiếu):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/admin.guard.spec.ts
```

> **Ngày chạy:** 12/04/2026

### Tóm tắt kết quả

| Hạng mục | Kết quả |
|---|---|
| File test | `src/app/guards/admin.guard.spec.ts` |
| Tổng số test (theo bảng TC) | **16** |
| Passed | **16** |
| Failed | **0** |
| Trình duyệt | ChromeHeadless |

### Log kết quả (copy từ terminal)

```text
Chrome Headless ... (Windows 10): Executed 16 of 16 SUCCESS
TOTAL: 16 SUCCESS
```

### Screenshot — Terminal output (bằng chứng chạy test)

> 📸 **[SCREENSHOT ADMIN-EXEC-01]** Chụp màn hình **terminal** từ đoạn:
> - Bắt đầu ở dòng có chữ **`Karma v... server started`** (hoặc ngay sau đó)
> - Đến hết dòng **`TOTAL: 16 SUCCESS`**
>
> Ảnh phải nhìn thấy rõ các dòng quan trọng sau (hoặc tương đương):
> - `Chrome Headless ...: Executed 16 of 16 SUCCESS ...`
> - `TOTAL: 16 SUCCESS`

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — admin.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng độ bao phủ (coverage) bằng terminal + HTML report.
>
> **CheckDB/Rollback:** N/A — không liên quan DB.

> **Lệnh chạy (tạo HTML coverage):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/admin.guard.spec.ts --code-coverage
```

> **Ngày chạy:** 12/04/2026

> **HTML report:** `frontend/coverage/index.html`

### Tóm tắt coverage (lấy từ terminal)

| Chỉ số | Kết quả |
|---|---|
| Statements | 16.27% (7/43) |
| Branches | 11.76% (2/17) |
| Functions | 6.25% (1/16) |
| Lines | 17.5% (7/40) |

### Log coverage summary (copy từ terminal)

```text
=============================== Coverage summary ===============================
Statements   : 16.27% ( 7/43 )
Branches     : 11.76% ( 2/17 )
Functions    : 6.25% ( 1/16 )
Lines        : 17.5% ( 7/40 )
================================================================================
```

### Screenshot 1 — Coverage summary trong terminal

> 📸 **[SCREENSHOT ADMIN-COV-01]** Chụp màn hình **terminal** đúng khối:
> - Bắt đầu từ dòng `=============================== Coverage summary ===============================`
> - Đến hết dòng `================================================================================`

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT ADMIN-COV-02]** Mở file `frontend/coverage/index.html` bằng browser và chụp:
> - Phần **bảng danh sách file** (có cột % Stmts / % Branch / % Funcs / % Lines)
> - Thấy được dòng liên quan `admin.guard.ts` trong danh sách (nếu có)

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết admin.guard.ts)

> 📸 **[SCREENSHOT ADMIN-COV-03]** Trong trang HTML coverage:
> - Click vào dòng `admin.guard.ts` (hoặc đường dẫn tương ứng trong cây thư mục)
> - Chụp màn hình trang chi tiết có **các dòng code** được tô màu (covered/not covered)

_(Dán ảnh vào đây)_

---

## 1.6. Code Coverage Report — auth.guard.ts

> **Mục tiêu:** Cung cấp bằng chứng độ bao phủ (coverage) bằng terminal + HTML report.
>
> **CheckDB/Rollback:** N/A — không liên quan DB.

> **Lệnh chạy (tạo HTML coverage):**
```bash
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/guards/auth.guard.spec.ts --code-coverage
```

> **Ngày chạy:** 12/04/2026

> **HTML report:** `frontend/coverage/index.html`

### Tóm tắt coverage (lấy từ terminal)

| Chỉ số | Kết quả |
|---|---|
| Statements | 20% (9/45) |
| Branches | 11.76% (2/17) |
| Functions | 6.25% (1/16) |
| Lines | 21.42% (9/42) |

### Log coverage summary (copy từ terminal)

```text
=============================== Coverage summary ===============================
Statements   : 20% ( 9/45 )
Branches     : 11.76% ( 2/17 )
Functions    : 6.25% ( 1/16 )
Lines        : 21.42% ( 9/42 )
================================================================================
```

### Screenshot 1 — Coverage summary trong terminal

> 📸 **[SCREENSHOT AUTH-COV-01]** Chụp màn hình **terminal** đúng khối:
> - Bắt đầu từ dòng `=============================== Coverage summary ===============================`
> - Đến hết dòng `================================================================================`

_(Dán ảnh vào đây)_

### Screenshot 2 — HTML Coverage Report (tổng quan)

> 📸 **[SCREENSHOT AUTH-COV-02]** Mở file `frontend/coverage/index.html` bằng browser và chụp:
> - Phần **bảng danh sách file** (có cột % Stmts / % Branch / % Funcs / % Lines)
> - Thấy được dòng liên quan `auth.guard.ts` trong danh sách (nếu có)

_(Dán ảnh vào đây)_

### Screenshot 3 — HTML Coverage Report (chi tiết auth.guard.ts)

> 📸 **[SCREENSHOT AUTH-COV-03]** Trong trang HTML coverage:
> - Click vào dòng `auth.guard.ts` (hoặc đường dẫn tương ứng trong cây thư mục)
> - Chụp màn hình trang chi tiết có **các dòng code** được tô màu (covered/not covered)

_(Dán ảnh vào đây)_
