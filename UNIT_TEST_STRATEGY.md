# CHIẾN LƯỢC UNIT TESTING CHO DỰ ÁN QUẢN LÝ THIẾT BỊ

## 1. TOOLS AND LIBRARIES (Công cụ và Thư viện)

### 1.1. Testing Framework được đề xuất

Dựa trên stack công nghệ của dự án (Node.js + Express + MySQL + Angular), tôi đề xuất:

---

## PHẦN A: BACKEND TESTING

#### **Jest** - Framework chính
- **Lý do chọn:**
  - Framework testing phổ biến nhất cho Node.js
  - Tích hợp sẵn assertion library, mocking, coverage
  - Hỗ trợ async/await tốt
  - Cấu hình đơn giản, chạy nhanh
  - Có snapshot testing
  - Built-in code coverage

#### **Supertest** - HTTP Testing
- **Lý do chọn:**
  - Test API endpoints một cách dễ dàng
  - Tích hợp tốt với Express
  - Không cần start server thực tế

#### **Sinon.js** - Mocking & Stubbing
- **Lý do chọn:**
  - Mock database calls
  - Stub external dependencies
  - Spy on function calls
  - Fake timers cho date testing

#### **mysql2/promise** - Database Testing
- **Lý do chọn:**
  - Test với database thật hoặc mock
  - Transaction rollback support
  - Connection pooling

### 1.2. Thư viện bổ sung

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "sinon": "^17.0.1",
    "@types/jest": "^29.5.11",
    "jest-mock-extended": "^3.0.5"
  }
}
```

---

## PHẦN B: FRONTEND TESTING (Angular)

### 1.1. Testing Framework cho Frontend

#### **Jasmine + Karma** - Framework mặc định của Angular
- **Lý do chọn:**
  - Đã được tích hợp sẵn trong Angular CLI
  - Jasmine: BDD-style testing framework
  - Karma: Test runner cho browser
  - Angular đã cấu hình sẵn
  - Hỗ trợ tốt cho Angular components, services, guards

#### **Angular Testing Utilities**
- **TestBed** - Cấu hình testing module
- **ComponentFixture** - Test Angular components
- **HttpClientTestingModule** - Mock HTTP requests
- **RouterTestingModule** - Test routing

#### **Thư viện bổ sung cho Frontend**
```json
{
  "devDependencies": {
    "@angular/core": "^17.3.0",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-jasmine": "~5.1.0",
    "karma-chrome-launcher": "~3.2.0",
    "karma-coverage": "~2.2.0"
  }
}
```

---

## 2. SCOPE OF TESTING (Phạm vi kiểm thử)

### PHẦN A: BACKEND

### 2.1. CÁC HÀM/CLASS/FILE ĐƯỢC KIỂM THỬ

#### **A. Service Layer (Business Logic) - ƯU TIÊN CAO**

##### 1. User Service (`user.service.js`)
**Lý do:** Chứa logic nghiệp vụ quan trọng về authentication và user management

| Hàm | Mô tả | Độ ưu tiên |
|-----|-------|------------|
| `token(length)` | Tạo random token | CAO |
| `normalizeRole(role)` | Chuẩn hóa role | CAO |
| `findAllUser()` | Lấy danh sách user | TRUNG BÌNH |
| `findOneUser()` | Lấy thông tin 1 user | TRUNG BÌNH |
| `findUserNameAndPassword()` | Đăng nhập | CAO |
| `createUser()` | Tạo user mới | CAO |
| `updateUser()` | Cập nhật user | CAO |
| `deleteUserById()` | Xóa user | CAO |

##### 2. Equipment Service (`equipment.service.js`)
**Lý do:** Core business logic về quản lý thiết bị

| Hàm | Mô tả | Độ ưu tiên |
|-----|-------|------------|
| `findAllEquipment()` | Lấy danh sách thiết bị | TRUNG BÌNH |
| `findOneEquipment()` | Lấy chi tiết thiết bị | TRUNG BÌNH |
| `findAllRoom()` | Lấy danh sách phòng | TRUNG BÌNH |
| `createEquipment()` | Tạo thiết bị mới | CAO |
| `updateEquipment()` | Cập nhật thiết bị | CAO |
| `deleteEquipment()` | Xóa thiết bị (soft delete) | CAO |

##### 3. Borrow/Return Service (`borrowReturn.service.js`)
**Lý do:** Logic phức tạp về mượn trả thiết bị

| Hàm | Mô tả | Độ ưu tiên |
|-----|-------|------------|
| `findAllBorrowReturnSlip()` | Lấy danh sách phiếu | TRUNG BÌNH |
| `findByUserBorrowReturnSlip()` | Lấy phiếu theo user | TRUNG BÌNH |
| `findBorrowReturnSlipDetail()` | Chi tiết phiếu | TRUNG BÌNH |
| `createBorrowReturnSlip()` | Tạo phiếu mượn | CAO |
| `borrowReturnSlip()` | Trả thiết bị | CAO |
| `findAllBorrowReturn()` | Lấy tất cả borrow/return | TRUNG BÌNH |

##### 4. Request Service (`request.service.js`)
**Lý do:** Logic về yêu cầu và phê duyệt

| Hàm | Mô tả | Độ ưu tiên |
|-----|-------|------------|
| `requestSlip()` | Tạo yêu cầu | CAO |
| `getRequestSlip()` | Lấy danh sách yêu cầu | TRUNG BÌNH |
| `approvedSlip()` | Phê duyệt yêu cầu | CAO |

#### **B. DAO Layer (Database Access) - ƯU TIÊN TRUNG BÌNH**

##### 1. User DAO (`user.dao.js`)
**Lý do:** Cần test SQL queries và database interactions

| Hàm | Mô tả | Độ ưu tiên |
|-----|-------|------------|
| `findAll()` | SELECT all users | TRUNG BÌNH |
| `findOneUser(id)` | SELECT user by ID | TRUNG BÌNH |
| `createUser(data)` | INSERT user + validation | CAO |
| `updateUser(data)` | UPDATE user | CAO |
| `deleteUserById(id)` | DELETE user | CAO |
| `findUserNameAndPassword()` | SELECT for login | CAO |

##### 2. Equipment DAO (`equipment.dao.js`)
**Lý do:** Queries phức tạp với JOIN và transactions

| Hàm | Mô tả | Độ ưu tiên |
|-----|-------|------------|
| `findAll()` | SELECT với JOIN 3 bảng | CAO |
| `findAllRoom()` | SELECT rooms với JOIN | TRUNG BÌNH |
| `findOne(data)` | SELECT by ID + type | CAO |
| `createEquipment(data)` | INSERT với transaction | CAO |
| `updateEquipment(data)` | UPDATE với transaction | CAO |
| `deleteEquipment(data)` | Soft delete | CAO |

##### 3. BorrowReturn DAO (`borrowReturn.dao.js`)
**Lý do:** Logic phức tạp nhất, nhiều transactions

| Hàm | Mô tả | Độ ưu tiên |
|-----|-------|------------|
| `convertDateArray()` | Utility function | CAO |
| `findAllBorrowReturn()` | Complex JOIN query | TRUNG BÌNH |
| `findByUserBorrowReturnSlipDAO()` | SELECT by user | TRUNG BÌNH |
| `findAllBorrowReturnSlipDAO()` | SELECT all slips | TRUNG BÌNH |
| `createBorrowReturnSlipDAO()` | Multi-table INSERT | CAO |
| `borrowReturnSlipDAO()` | Complex transaction | CAO |

##### 4. Request DAO (`request.dao.js`)
**Lý do:** Transaction logic cho request workflow

| Hàm | Mô tả | Độ ưu tiên |
|-----|-------|------------|
| `requestSlip(data)` | INSERT với transaction | CAO |
| `getAllRequestSlip()` | SELECT với JOIN | TRUNG BÌNH |
| `approvedSlip(data)` | UPDATE với transaction | CAO |

#### **C. Utility Functions - ƯU TIÊN CAO**

| Hàm | File | Mô tả | Độ ưu tiên |
|-----|------|-------|------------|
| `convertDateArray()` | borrowReturn.dao.js | Convert date format | CAO |
| `token()` | user.service.js | Generate token | CAO |
| `normalizeRole()` | user.service.js | Normalize role string | CAO |

---

### 2.2. CÁC HÀM/CLASS/FILE KHÔNG CẦN KIỂM THỬ

#### **A. Controller Layer**
**Files:**
- `user.controller.js`
- `equipment.controller.js`
- `borrowReturn.controller.js`
- `request.controller.js`

**Lý do:**
1. **Thin layer:** Controllers chỉ là wrapper gọi service và trả về JSON
2. **Không có logic:** Không chứa business logic, chỉ pass data
3. **Integration test tốt hơn:** Nên test qua API endpoints với Supertest
4. **Code đơn giản:** Chỉ có pattern: `const data = await Service.method(); return res.json(data)`

**Ví dụ:**
```javascript
// Không cần unit test vì quá đơn giản
const findAllUser = async (req, res) => {
    const data = await UserService.findAllUser()
    return res.json(data)
}
```

#### **B. Configuration Files**
**Files:**
- `backend/src/config/configDB.js`
- `backend/src/index.js`
- `backend/src/app-router/routeApi.js`

**Lý do:**
1. **Configuration only:** Chỉ chứa config, không có logic
2. **Framework code:** Express routing, middleware setup
3. **Integration test:** Nên test qua end-to-end hoặc integration tests
4. **Khó mock:** Cần mock quá nhiều dependencies

#### **C. Entry Point**
**File:** `backend/src/index.js`

**Lý do:**
1. **Server startup:** Chỉ khởi động server
2. **No business logic:** Không có logic nghiệp vụ
3. **E2E test:** Nên test qua end-to-end testing

#### **D. Route Definitions**
**File:** `backend/src/app-router/routeApi.js`

**Lý do:**
1. **Declarative:** Chỉ khai báo routes
2. **No logic:** Không có logic xử lý
3. **Integration test:** Test qua API testing tốt hơn

---

### PHẦN B: FRONTEND (Angular)

### 2.1. CÁC FILE/CLASS ĐƯỢC KIỂM THỬ

#### **A. Services (Business Logic) - ƯU TIÊN CAO**

##### 1. AuthService (`auth.service.ts`)
**Lý do:** Core authentication logic, token management, role checking

| Method | Mô tả | Độ ưu tiên |
|--------|-------|------------|
| `login(credentials)` | Đăng nhập và lưu token | CAO |
| `logout()` | Xóa token | CAO |
| `isLoggedIn()` | Kiểm tra đăng nhập | CAO |
| `getToken()` | Lấy token từ sessionStorage | CAO |
| `setToken(token)` | Lưu token | CAO |
| `removeToken()` | Xóa token | CAO |
| `getRole()` | Parse role từ token | CAO |
| `getIdUser()` | Parse user ID từ token | CAO |
| `isTeacher()` | Kiểm tra role teacher | CAO |
| `isFacilityManager()` | Kiểm tra role manager | CAO |
| `isManagementBoard()` | Kiểm tra role board | CAO |
| `isAdmin()` | Kiểm tra role admin | CAO |
| `isSessionStorageSupported()` | Kiểm tra browser support | TRUNG BÌNH |

##### 2. ApiService (`api.service.ts`)
**Lý do:** HTTP client wrapper, API calls

| Method | Mô tả | Độ ưu tiên |
|--------|-------|------------|
| `getOneUser(id)` | GET user by ID | TRUNG BÌNH |
| `getAllUser()` | GET all users | TRUNG BÌNH |
| `createUser(user)` | POST create user | CAO |
| `updateUser(user)` | PUT update user | CAO |
| `deleteUserById(id)` | DELETE user | CAO |
| `getEquipment()` | GET equipment list | TRUNG BÌNH |
| `getOneEquipment(id)` | GET equipment detail | TRUNG BÌNH |
| `createEquipment(data)` | POST create equipment | CAO |
| `updateEquipment(data)` | PUT update equipment | CAO |
| `deleteEquipment(data)` | POST delete equipment | CAO |
| `getRoom()` | GET room list | TRUNG BÌNH |
| `createBorrowReturnSlip(data)` | POST borrow slip | CAO |
| `borrowReturnSlip(data)` | PUT return equipment | CAO |
| `getByUserBorrowReturnSlip(id)` | GET user's slips | TRUNG BÌNH |
| `createrequestSlip(data)` | POST request slip | CAO |
| `getAllRequestSlip()` | GET all requests | TRUNG BÌNH |
| `approvedSlip(data)` | PUT approve request | CAO |

##### 3. SharedService (`shared.service.ts`)
**Lý do:** State management, utility functions

| Method | Mô tả | Độ ưu tiên |
|--------|-------|------------|
| `setThietBi(data)` | Set equipment data | TRUNG BÌNH |
| `getThietBi` | Observable equipment | TRUNG BÌNH |
| `setTypeAction(data)` | Set action type | TRUNG BÌNH |
| `getTypeAction` | Observable action | TRUNG BÌNH |
| `setSearch(data)` | Set search data | TRUNG BÌNH |
| `getSearch` | Observable search | TRUNG BÌNH |
| `setId(id, type)` | Set ID with type | TRUNG BÌNH |
| `getId` | Observable ID | TRUNG BÌNH |
| `getDMY()` | Get current date formatted | CAO |
| `tinhNgayTra(tongtiet, ngay)` | Calculate return date | CAO |
| `setBorrowReturnSlipDetailId(id)` | Set slip detail ID | TRUNG BÌNH |

##### 4. ExcelService (`excel.service.ts`)
**Lý do:** Export functionality

| Method | Mô tả | Độ ưu tiên |
|--------|-------|------------|
| `exportAsExcelFile(json, fileName)` | Export to Excel | CAO |
| `saveAsExcelFile(buffer, fileName)` | Save file | TRUNG BÌNH |

#### **B. Guards (Authorization Logic) - ƯU TIÊN CAO**

##### 1. AuthGuard (`auth.guard.ts`)
**Lý do:** Protect routes, check authentication

| Function | Mô tả | Độ ưu tiên |
|----------|-------|------------|
| `authGuard(route, state)` | Check if user logged in | CAO |

##### 2. AdminGuard (`admin.guard.ts`)
**Lý do:** Admin role authorization

| Function | Mô tả | Độ ưu tiên |
|----------|-------|------------|
| `adminGuard(route, state)` | Check admin role | CAO |

##### 3. TeacherGuard (`teacher.guard.ts`)
**Lý do:** Teacher role authorization

| Function | Mô tả | Độ ưu tiên |
|----------|-------|------------|
| `teacherGuard(route, state)` | Check teacher role | CAO |

##### 4. FacilityManagerGuard (`facility-manager.guard.ts`)
**Lý do:** Manager role authorization

| Function | Mô tả | Độ ưu tiên |
|----------|-------|------------|
| `facilityManagerGuard(route, state)` | Check manager role | CAO |

##### 5. ManagementBoardGuard (`management-board.guard.ts`)
**Lý do:** Board role authorization

| Function | Mô tả | Độ ưu tiên |
|----------|-------|------------|
| `managementBoardGuard(route, state)` | Check board role | CAO |

#### **C. Components với Business Logic - ƯU TIÊN TRUNG BÌNH**

##### Components cần test logic:
- `LoginComponent` - Login logic, form validation
- Components có form validation
- Components có data transformation
- Components có complex calculations

---

### 2.2. CÁC FILE/CLASS KHÔNG CẦN KIỂM THỬ (Frontend)

#### **A. Presentation Components**
**Components:**
- `HeaderComponent`, `FooterComponent`, `NavbarComponent`
- `PageHomeComponent` (chỉ là container)
- `PageErrorComponent`
- `PageIntroComponent`

**Lý do:**
1. **Pure presentation:** Chỉ hiển thị UI, không có logic
2. **No business logic:** Không xử lý dữ liệu
3. **Template-heavy:** Chủ yếu là HTML template
4. **E2E test tốt hơn:** Nên test qua end-to-end testing

#### **B. Configuration Files**
**Files:**
- `app.config.ts`
- `app.config.server.ts`
- `app.routes.ts`
- `environment.ts`

**Lý do:**
1. **Configuration only:** Chỉ chứa config
2. **No logic:** Không có logic xử lý
3. **Framework code:** Angular framework setup

#### **C. Simple Container Components**
**Components không có logic:**
- Components chỉ import và render child components
- Components không có methods phức tạp
- Components không có state management

**Lý do:**
1. **No business logic**
2. **Integration test:** Test qua component integration
3. **Waste of time:** Unit test không mang lại giá trị

---

## 3. TÓM TẮT PHẠM VI TESTING

### 3.1. Thống kê BACKEND

| Layer | Tổng số files | Cần test | Không cần test |
|-------|---------------|----------|-----------------|
| **Service** | 4 | 4 (100%) | 0 |
| **DAO** | 4 | 4 (100%) | 0 |
| **Controller** | 4 | 0 (0%) | 4 (100%) |
| **Config** | 2 | 0 (0%) | 2 (100%) |
| **Router** | 1 | 0 (0%) | 1 (100%) |
| **Entry** | 1 | 0 (0%) | 1 (100%) |
| **TỔNG BACKEND** | **16** | **8 (50%)** | **8 (50%)** |

### 3.2. Thống kê FRONTEND

| Layer | Tổng số files | Cần test | Không cần test |
|-------|---------------|----------|-----------------|
| **Services** | 5 | 4 (80%) | 1 (license.service) |
| **Guards** | 5 | 5 (100%) | 0 |
| **Components (Logic)** | ~5 | 5 (100%) | 0 |
| **Components (UI)** | ~16 | 0 (0%) | 16 (100%) |
| **Config** | 3 | 0 (0%) | 3 (100%) |
| **TỔNG FRONTEND** | **~34** | **14 (41%)** | **20 (59%)** |

### 3.3. TỔNG QUAN DỰ ÁN

| Phần | Tổng files | Cần test | Không cần test | % Test |
|------|------------|----------|-----------------|--------|
| **Backend** | 16 | 8 | 8 | 50% |
| **Frontend** | 34 | 14 | 20 | 41% |
| **TỔNG DỰ ÁN** | **50** | **22** | **28** | **44%** |

### 3.4. Ưu tiên testing TỔNG THỂ

#### Độ ưu tiên CAO (Critical):
**Backend:**
- ✅ User authentication & authorization
- ✅ Equipment CRUD với transactions
- ✅ Borrow/Return workflow
- ✅ Request approval workflow
- ✅ Utility functions (token, date conversion)
- ✅ Database transactions & rollback

**Frontend:**
- ✅ AuthService (login, token, role checking)
- ✅ All Guards (authorization)
- ✅ API calls (create, update, delete operations)
- ✅ SharedService utility functions (date calculation)
- ✅ ExcelService export functionality

#### Độ ưu tiên TRUNG BÌNH (Important):
**Backend:**
- ✅ Read operations (findAll, findOne)
- ✅ Complex JOIN queries
- ✅ Data validation

**Frontend:**
- ✅ API GET operations
- ✅ State management (BehaviorSubject)
- ✅ Component business logic

#### Độ ưu tiên THẤP (Nice to have):
- ⚠️ Simple getters
- ⚠️ Logging functions
- ⚠️ Pure UI components

---

## 4. CHIẾN LƯỢC TESTING

### 4.1. Backend Testing Strategy

#### Service Layer Testing
- **Mock DAO layer** để test business logic độc lập
- Test error handling
- Test data transformation
- Test validation logic

#### DAO Layer Testing
- **Sử dụng test database** hoặc mock MySQL connection
- Test SQL queries
- Test transactions & rollback
- Verify database state changes
- **CheckDB:** Verify data changes
- **Rollback:** Restore DB state after tests

### 4.2. Frontend Testing Strategy

#### Service Testing
- **Mock HttpClient** với HttpClientTestingModule
- Test HTTP requests/responses
- Test error handling
- Test data transformation
- Mock sessionStorage/localStorage

#### Guard Testing
- **Mock AuthService**
- Test authorization logic
- Test route protection
- Test redirect behavior

#### Component Testing (có logic)
- **Mock Services** (ApiService, AuthService, etc.)
- Test component methods
- Test form validation
- Test data binding
- Test event handlers

### 4.3. Integration Testing
**Backend:**
- Test API endpoints với Supertest
- Test full workflow: Controller → Service → DAO → DB
- Test authentication & authorization

**Frontend:**
- Test component + service integration
- Test routing với guards
- Test HTTP interceptors

### 4.4. Coverage Goals
**Backend:**
- Service Layer: 90%+ coverage
- DAO Layer: 85%+ coverage
- Overall Backend: 80%+ coverage

**Frontend:**
- Services: 85%+ coverage
- Guards: 90%+ coverage
- Components (với logic): 75%+ coverage
- Overall Frontend: 70%+ coverage

**Tổng dự án:** 75%+ coverage

---

## 5. TESTING BEST PRACTICES

### 5.1. Backend - Jest Naming Convention
```javascript
// Pattern: describe('ModuleName', () => { it('should do something', () => {}) })
describe('UserService', () => {
  describe('token()', () => {
    it('should generate token with correct length', () => {})
    it('should generate different tokens on each call', () => {})
  })
})
```

### 5.2. Frontend - Jasmine Naming Convention
```typescript
// Pattern: describe('ComponentName', () => { it('should do something', () => {}) })
describe('AuthService', () => {
  describe('login', () => {
    it('should save token on successful login', () => {})
    it('should throw error on invalid credentials', () => {})
  })
})
```

### 5.3. Test Structure (AAA Pattern)
```typescript
it('should create user successfully', async () => {
  // Arrange (Chuẩn bị)
  const userData = { username: 'test', password: '123' }
  
  // Act (Thực hiện)
  const result = await service.createUser(userData)
  
  // Assert (Kiểm tra)
  expect(result).toBeDefined()
  expect(result.id).toBeGreaterThan(0)
})
```

### 5.4. Backend Database Testing
```javascript
beforeEach(async () => {
  // Setup: Insert test data
  await db.query('INSERT INTO USER ...')
})

afterEach(async () => {
  // Rollback: Clean up test data
  await db.query('DELETE FROM USER WHERE ...')
})
```

### 5.5. Frontend HTTP Testing
```typescript
it('should call login API', () => {
  const mockResponse = { token: 'abc123' }
  
  service.login(credentials).subscribe(response => {
    expect(response).toEqual(mockResponse)
  })
  
  const req = httpMock.expectOne(`${API}/login`)
  expect(req.request.method).toBe('POST')
  req.flush(mockResponse)
})
```

---

## 6. SETUP & CONFIGURATION

### 6.1. Backend Setup (Jest)

**Install dependencies:**
```bash
cd backend
npm install --save-dev jest supertest sinon @types/jest
```

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/module/**/*.js',
    '!src/module/**/*.controller.js'
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 6.2. Frontend Setup (Jasmine/Karma)

**Đã có sẵn trong Angular CLI!**

**Run tests:**
```bash
cd frontend
ng test                    # Run tests
ng test --code-coverage    # Run with coverage
ng test --watch=false      # Run once
```

**karma.conf.js** (đã có sẵn):
```javascript
module.exports = function(config) {
  config.set({
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-coverage')
    ],
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly' }
      ]
    }
  })
}
```

---

## 7. KẾT LUẬN

### Tổng quan:
**Backend:**
- 8 files cần unit test (Service + DAO layers)
- 8 files không cần unit test (Controller, Config, Router)
- Framework: Jest + Supertest + Sinon
- Coverage target: 80%+

**Frontend:**
- 14 files cần unit test (Services + Guards + Components có logic)
- 20 files không cần unit test (UI Components, Config)
- Framework: Jasmine + Karma (built-in Angular)
- Coverage target: 70%+

**Tổng dự án:**
- 22 files cần test / 50 files total (44%)
- Coverage target: 75%+
- Focus: Business logic, authentication, authorization, database operations

### Bước tiếp theo:
1. ✅ Cài đặt testing dependencies (Backend: Jest, Frontend: đã có)
2. ✅ Cấu hình test runners
3. 📝 Viết test cases theo template (Excel report)
4. 🧪 Chạy tests và đo coverage
5. 📊 Tạo báo cáo Excel theo yêu cầu
6. 📸 Chụp screenshots execution & coverage
7. 📚 Tài liệu tham khảo + prompts
