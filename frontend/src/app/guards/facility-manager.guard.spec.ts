/**
 * Unit Test Script: facility-manager.guard.ts
 * File được test: frontend/src/app/guards/facility-manager.guard.ts
 * Framework: Jasmine + Karma (Angular TestBed)
 *
 * Nghiệp vụ:
 *   Guard bảo vệ các route dành riêng cho Ban quản lý cơ sở vật chất:
 *     /request        — Xem danh sách yêu cầu mua sắm
 *     /them-cap-nhat  — Thêm/cập nhật thiết bị và phòng
 *     /account        — Quản lý tài khoản người dùng
 *     /quan-ly        — Trang quản lý tổng thể
 *
 *   Logic: gọi authService.isFacilityManager()
 *     → true  (role = 'Banquảnlý') : cho phép truy cập
 *     → false (role khác hoặc chưa đăng nhập) : chặn truy cập
 *
 * Chiến lược:
 *   - Mock AuthService bằng jasmine.createSpyObj → không có DB/sessionStorage thật
 *   - Guard không truy cập DB → không cần CheckDB / Rollback DB
 *   - afterEach: TestBed.resetTestingModule() đảm bảo trạng thái sạch
 *
 * Token format thực tế: {ID}{20 random chars}{normalizedRole}
 *   Ví dụ: "3ABCDEFGHIJKLMNOPQRSTBanquảnlý"
 *   Role 'Banquảnlý' = normalize của 'Ban quản lý' (xóa space)
 */

import { TestBed } from '@angular/core/testing'
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { facilityManagerGuard } from './facility-manager.guard'
import { AuthService } from '../services/auth.service'

describe('facilityManagerGuard', () => {

  // ─── Mock AuthService ──────────────────────────────────────────────────────
  // Chỉ mock isFacilityManager — method duy nhất guard sử dụng
  let mockAuthService: jasmine.SpyObj<AuthService>

  /**
   * Helper: chạy guard trong Angular injection context
   * Cần thiết vì facilityManagerGuard dùng inject() — chỉ hoạt động trong injection context
   */
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => facilityManagerGuard(...guardParameters))

  /**
   * Helper: tạo mock ActivatedRouteSnapshot với url cho trước
   * Dùng cho các test case kiểm tra bảo vệ route cụ thể
   */
  const createMockRoute = (url: string): ActivatedRouteSnapshot => {
    return { url } as unknown as ActivatedRouteSnapshot
  }

  /**
   * Helper: tạo mock RouterStateSnapshot với url cho trước
   */
  const createMockState = (url: string): RouterStateSnapshot => {
    return { url } as RouterStateSnapshot
  }

  // ─── Setup trước mỗi test ─────────────────────────────────────────────────
  beforeEach(() => {
    // Tạo spy object cho AuthService — chỉ mock method isFacilityManager
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', [
      'isFacilityManager',
      'isTeacher',
      'isManagementBoard',
      'isAdmin',
      'isLoggedIn',
    ])

    // Cấu hình TestBed với mock AuthService
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
  })

  // ─── Teardown sau mỗi test ────────────────────────────────────────────────
  afterEach(() => {
    // Rollback: reset TestBed về trạng thái ban đầu sau mỗi test
    TestBed.resetTestingModule()
  })

  // ===========================================================================
  // NHÓM 1: Kiểm tra logic cốt lõi — allow / deny theo role
  // ===========================================================================
  describe('Kiểm tra quyền truy cập theo role', () => {

    // TC_FM_GUARD_01: Ban quản lý được phép truy cập
    it('[TC_FM_GUARD_01] nên trả về true khi user là Ban quản lý (isFacilityManager = true)', () => {
      // Arrange: mock user là Ban quản lý
      mockAuthService.isFacilityManager.and.returnValue(true)
      const mockRoute = createMockRoute('/request')
      const mockState = createMockState('/request')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert: guard cho phép truy cập
      expect(result).toBeTrue()
    })

    // TC_FM_GUARD_02: Giáo viên bị chặn
    it('[TC_FM_GUARD_02] nên trả về false khi user là Giáo viên (không phải Ban quản lý)', () => {
      // Arrange: mock user là Giáo viên → isFacilityManager = false
      mockAuthService.isFacilityManager.and.returnValue(false)
      const mockRoute = createMockRoute('/request')
      const mockState = createMockState('/request')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert: guard chặn truy cập
      expect(result).toBeFalse()
    })

    // TC_FM_GUARD_03: Ban giám hiệu bị chặn
    it('[TC_FM_GUARD_03] nên trả về false khi user là Ban giám hiệu (không phải Ban quản lý)', () => {
      // Arrange: mock user là Ban giám hiệu → isFacilityManager = false
      // (Ban giám hiệu có role 'Bangiámhiệu', không phải 'Banquảnlý')
      mockAuthService.isFacilityManager.and.returnValue(false)
      const mockRoute = createMockRoute('/them-cap-nhat')
      const mockState = createMockState('/them-cap-nhat')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeFalse()
    })

    // TC_FM_GUARD_04: Chưa đăng nhập bị chặn (token = null)
    it('[TC_FM_GUARD_04] nên trả về false khi chưa đăng nhập (token = null → isFacilityManager = false)', () => {
      // Arrange: user chưa đăng nhập → getRole() = null → isFacilityManager = false
      mockAuthService.isFacilityManager.and.returnValue(false)
      const mockRoute = createMockRoute('/account')
      const mockState = createMockState('/account')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeFalse()
    })

    // TC_FM_GUARD_05: Token hết hạn / bị xóa khỏi sessionStorage
    it('[TC_FM_GUARD_05] nên trả về false khi token hết hạn hoặc bị xóa khỏi sessionStorage', () => {
      // Arrange: sessionStorage rỗng → getToken() = null → isFacilityManager = false
      mockAuthService.isFacilityManager.and.returnValue(false)
      const mockRoute = createMockRoute('/quan-ly')
      const mockState = createMockState('/quan-ly')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeFalse()
    })

    // TC_FM_GUARD_06: Token không hợp lệ (không kết thúc bằng role hợp lệ)
    it('[TC_FM_GUARD_06] nên trả về false khi token không hợp lệ (không match role nào)', () => {
      // Arrange: token bị giả mạo hoặc corrupt → getRole() = null → isFacilityManager = false
      mockAuthService.isFacilityManager.and.returnValue(false)
      const mockRoute = createMockRoute('/request')
      const mockState = createMockState('/request')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeFalse()
    })
  })

  // ===========================================================================
  // NHÓM 2: Kiểm tra interaction — guard gọi đúng method
  // ===========================================================================
  describe('Kiểm tra interaction với AuthService', () => {

    // TC_FM_GUARD_07: Guard chỉ gọi isFacilityManager(), không gọi method khác
    it('[TC_FM_GUARD_07] nên gọi đúng isFacilityManager() và không gọi isTeacher() hay isAdmin()', () => {
      // Arrange
      mockAuthService.isFacilityManager.and.returnValue(true)
      const mockRoute = createMockRoute('/request')
      const mockState = createMockState('/request')

      // Act
      executeGuard(mockRoute, mockState)

      // Assert: chỉ isFacilityManager được gọi
      expect(mockAuthService.isFacilityManager).toHaveBeenCalledTimes(1)
      expect(mockAuthService.isTeacher).not.toHaveBeenCalled()
      expect(mockAuthService.isManagementBoard).not.toHaveBeenCalled()
      expect(mockAuthService.isAdmin).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // NHÓM 3: Kiểm tra bảo vệ từng route cụ thể
  // ===========================================================================
  describe('Kiểm tra bảo vệ từng route', () => {

    // TC_FM_GUARD_08: Route /request — Ban quản lý được vào
    it('[TC_FM_GUARD_08] nên cho phép Ban quản lý truy cập route /request (xem yêu cầu mua sắm)', () => {
      // Arrange
      mockAuthService.isFacilityManager.and.returnValue(true)
      const mockRoute = createMockRoute('/request')
      const mockState = createMockState('/request')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeTrue()
    })

    // TC_FM_GUARD_09: Route /them-cap-nhat — Ban quản lý được vào
    it('[TC_FM_GUARD_09] nên cho phép Ban quản lý truy cập route /them-cap-nhat (thêm/cập nhật thiết bị)', () => {
      // Arrange
      mockAuthService.isFacilityManager.and.returnValue(true)
      const mockRoute = createMockRoute('/them-cap-nhat')
      const mockState = createMockState('/them-cap-nhat')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeTrue()
    })

    // TC_FM_GUARD_10: Route /account — Ban quản lý được vào
    it('[TC_FM_GUARD_10] nên cho phép Ban quản lý truy cập route /account (quản lý tài khoản)', () => {
      // Arrange
      mockAuthService.isFacilityManager.and.returnValue(true)
      const mockRoute = createMockRoute('/account')
      const mockState = createMockState('/account')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeTrue()
    })

    // TC_FM_GUARD_11: Route /quan-ly — Ban quản lý được vào
    it('[TC_FM_GUARD_11] nên cho phép Ban quản lý truy cập route /quan-ly (trang quản lý tổng thể)', () => {
      // Arrange
      mockAuthService.isFacilityManager.and.returnValue(true)
      const mockRoute = createMockRoute('/quan-ly')
      const mockState = createMockState('/quan-ly')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeTrue()
    })

    // TC_FM_GUARD_12: Giáo viên bị chặn tại /them-cap-nhat
    it('[TC_FM_GUARD_12] nên chặn Giáo viên khi cố truy cập /them-cap-nhat', () => {
      // Arrange: Giáo viên không được thêm/sửa thiết bị
      mockAuthService.isFacilityManager.and.returnValue(false)
      const mockRoute = createMockRoute('/them-cap-nhat')
      const mockState = createMockState('/them-cap-nhat')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeFalse()
    })

    // TC_FM_GUARD_13: Giáo viên bị chặn tại /account
    it('[TC_FM_GUARD_13] nên chặn Giáo viên khi cố truy cập /account (quản lý tài khoản)', () => {
      // Arrange: Giáo viên không được quản lý tài khoản
      mockAuthService.isFacilityManager.and.returnValue(false)
      const mockRoute = createMockRoute('/account')
      const mockState = createMockState('/account')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert
      expect(result).toBeFalse()
    })
  })

  // ===========================================================================
  // NHÓM 4: Kiểm tra kiểu dữ liệu và DI
  // ===========================================================================
  describe('Kiểm tra kiểu dữ liệu và Dependency Injection', () => {

    // TC_FM_GUARD_14: Guard trả về boolean (synchronous, không phải Observable/Promise)
    it('[TC_FM_GUARD_14] nên trả về kiểu boolean (synchronous, không phải Observable hay Promise)', () => {
      // Arrange
      mockAuthService.isFacilityManager.and.returnValue(true)
      const mockRoute = createMockRoute('/request')
      const mockState = createMockState('/request')

      // Act
      const result = executeGuard(mockRoute, mockState)

      // Assert: kiểu dữ liệu phải là boolean
      expect(typeof result).toBe('boolean')
    })

    // TC_FM_GUARD_15: Guard inject AuthService đúng cách qua Angular DI
    it('[TC_FM_GUARD_15] nên inject AuthService thành công qua Angular DI (không throw lỗi)', () => {
      // Arrange: TestBed đã cấu hình với mock AuthService trong beforeEach
      mockAuthService.isFacilityManager.and.returnValue(false)
      const mockRoute = createMockRoute('/request')
      const mockState = createMockState('/request')

      // Act & Assert: không throw lỗi DI khi chạy guard
      expect(() => executeGuard(mockRoute, mockState)).not.toThrow()
    })
  })
})
