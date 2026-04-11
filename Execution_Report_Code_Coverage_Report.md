# Hướng dẫn thực hiện Bước 1.5 và 1.6

---

## BƯỚC 1.5 — EXECUTION REPORT

### Mục tiêu
Chạy toàn bộ test suite và chụp màn hình làm bằng chứng kết quả pass/fail.

### Lệnh chạy

Mở terminal, di chuyển vào thư mục `backend`, chạy lệnh:

```bash
cd backend
npx jest src/__tests__/service/user.service.test.js --no-coverage --verbose
```

Cờ `--verbose` hiển thị từng test case riêng lẻ với dấu ✓ (pass) hoặc ✕ (fail).

### Kết quả mong đợi trên terminal

```
PASS src/__tests__/service/user.service.test.js
  token(length)
    ✓ [TC_TOKEN_01] nên tạo token có đúng 20 ký tự (3 ms)
    ✓ [TC_TOKEN_02] nên tạo token có đúng 5 ký tự (1 ms)
    ...
  normalizeRole(role)
    ✓ [TC_ROLE_01] nên normalize "Giáo viên" thành "Giáoviên" (1 ms)
    ...
  deleteUserById()
    ✓ [TC_DELETE_09] nên xóa thành công user với ID = "1" (1 ms)

Test Suites: 1 passed, 1 total
Tests:       85 passed, 85 total
Snapshots:   0 total
Time:        2.1 s
```

### Chụp màn hình ở đâu?

> 📸 **SCREENSHOT 1 — Danh sách test case pass/fail**
>
> Cuộn terminal lên đầu output, chụp toàn bộ từ dòng:
> `PASS src/__tests__/service/user.service.test.js`
> đến hết danh sách các ✓ của từng nhóm hàm.
> Nếu terminal không đủ dài, chụp nhiều ảnh theo từng nhóm describe.

> 📸 **SCREENSHOT 2 — Dòng tổng kết**
>
> Chụp phần cuối terminal, bao gồm các dòng:
> ```
> Test Suites: 1 passed, 1 total
> Tests:       85 passed, 85 total
> Time:        X s
> ```

### Bảng tóm tắt (điền sau khi chạy)

| Hạng mục | Kết quả |
|---|---|
| Test Suites passed | 1 / 1 |
| Tests passed | _(điền)_ / 85 |
| Tests failed | _(điền)_ |
| Thời gian chạy | _(điền)_ s |

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

---

## BƯỚC 1.6 — CODE COVERAGE REPORT

### Mục tiêu
Đo độ bao phủ mã nguồn của `user.service.js` và chụp màn hình báo cáo từ Jest.

### Lệnh chạy

```bash
cd backend
npx jest src/__tests__/service/user.service.test.js --coverage --verbose
```

Sau khi chạy xong, Jest tạo 2 loại báo cáo:
- **Text report** ngay trong terminal
- **HTML report** tại thư mục `backend/coverage/index.html`

---

### PHẦN A — Chụp màn hình Terminal Coverage Table

Sau khi lệnh chạy xong, cuối terminal xuất hiện bảng dạng:

```
--------------------------|---------|----------|---------|---------|-------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------------|---------|----------|---------|---------|-------------------
All files                 |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
 module/user              |         |          |         |         |
  user.service.js         |   XX.XX |    XX.XX |  100.00 |   XX.XX | 10-12
--------------------------|---------|----------|---------|---------|-------------------
```

> 📸 **SCREENSHOT 3 — Bảng coverage trong terminal**
>
> Chụp toàn bộ bảng này (từ dòng `---` đầu tiên đến dòng `---` cuối cùng).

### Bảng tóm tắt coverage (điền sau khi chạy)

| File | Statements % | Branches % | Functions % | Lines % | Mục tiêu | Đạt? |
|---|---|---|---|---|---|---|
| `user.service.js` | _(điền)_ | _(điền)_ | _(điền)_ | _(điền)_ | ≥ 80% | _(điền)_ |

---

### PHẦN B — Mở HTML Report trên Browser

Sau khi chạy lệnh `--coverage`, mở file này bằng browser:

```
backend/coverage/index.html
```

Cách mở nhanh trên Windows:
```bash
start backend/coverage/index.html
```

Hoặc mở File Explorer → vào thư mục `backend/coverage/` → double-click `index.html`.

---

> 📸 **SCREENSHOT 4 — Trang tổng quan HTML Coverage**
>
> Chụp toàn bộ trang `index.html` vừa mở trong browser.
> Trang này hiển thị tổng % coverage của tất cả file.

---

> 📸 **SCREENSHOT 5 — Chi tiết coverage của user.service.js**
>
> Trong trang HTML, tìm và click vào dòng `user.service.js`.
> Trang mới hiển thị từng dòng code với màu sắc:
> - **Xanh lá** = dòng đã được test bao phủ
> - **Đỏ** = dòng chưa được test bao phủ
> - **Vàng** = branch chưa được bao phủ đầy đủ
>
> Chụp toàn bộ trang này (cuộn xuống nếu cần, chụp nhiều ảnh).

---

## Tóm tắt — Bạn cần chụp tổng cộng 5 ảnh

| # | Chụp ở đâu | Nội dung |
|---|---|---|
| Screenshot 1 | Terminal | Danh sách ✓/✕ từng test case |
| Screenshot 2 | Terminal | Dòng tổng kết `Tests: X passed` |
| Screenshot 3 | Terminal | Bảng coverage text (`% Stmts \| % Branch \| % Funcs \| % Lines`) |
| Screenshot 4 | Browser — `coverage/index.html` | Trang tổng quan HTML coverage |
| Screenshot 5 | Browser — click vào `user.service.js` | Chi tiết từng dòng code (xanh/đỏ) |
