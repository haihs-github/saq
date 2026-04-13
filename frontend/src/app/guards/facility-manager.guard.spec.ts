import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';

import { facilityManagerGuard } from './facility-manager.guard';

describe('facilityManagerGuard', () => {
  /**
   * Unit test scripts — facility-manager.guard.ts
   *
   * CheckDB:
   * - N/A. Guard không truy cập CSDL (không call backend/DAO/Repository).
   *
   * Rollback:
   * - N/A. Guard không thay đổi data trong CSDL.
   *
   * Lưu ý:
   * - Đây là functional guard (dùng `inject(...)`) nên phải chạy trong injection context.
   * - Mỗi `it(...)` đều có comment “Test Case ID” để trace sang UNIT_TEST_DETAIL.md.
   */

  const executeFacilityManagerGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => facilityManagerGuard(...guardParameters));

  let mockAuthService: jasmine.SpyObj<AuthService>;

  const makeRouteSnapshot = (data: Record<string, unknown> = {}): ActivatedRouteSnapshot => {
    // Guard hiện tại không dùng `route`, nhưng tạo object rõ ràng giúp test dễ hiểu.
    return ({ data } as unknown) as ActivatedRouteSnapshot;
  };

  const makeRouterStateSnapshot = (url: string): RouterStateSnapshot => {
    // Guard hiện tại không dùng `state`, nhưng truyền url giúp thể hiện ngữ cảnh nghiệp vụ.
    return ({ url } as unknown) as RouterStateSnapshot;
  };

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['isFacilityManager']);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });
  });

  it('TC_FACMGUARD_01 - allow access to request-processing route when user is Facility Manager (happy path)', () => {
    // Test Case ID: TC_FACMGUARD_01
    // Nghiệp vụ: Ban quản lý xử lý yêu cầu (request) nên phải được phép vào `/request`.
    mockAuthService.isFacilityManager.and.returnValue(true);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(canActivate).toBeTrue();
  });

  it('TC_FACMGUARD_02 - allow access to add/update equipment route when user is Facility Manager', () => {
    // Test Case ID: TC_FACMGUARD_02
    // Nghiệp vụ: Ban quản lý được phép vào màn thêm/cập nhật thiết bị.
    mockAuthService.isFacilityManager.and.returnValue(true);

    const canActivate = executeFacilityManagerGuard(
      makeRouteSnapshot(),
      makeRouterStateSnapshot('/them-cap-nhat'),
    );

    expect(canActivate).toBeTrue();
  });

  it('TC_FACMGUARD_03 - allow access to account route when user is Facility Manager', () => {
    // Test Case ID: TC_FACMGUARD_03
    // Nghiệp vụ: Ban quản lý truy cập màn quản lý tài khoản trong phạm vi nghiệp vụ.
    mockAuthService.isFacilityManager.and.returnValue(true);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/account'));

    expect(canActivate).toBeTrue();
  });

  it('TC_FACMGUARD_04 - allow access to management route when user is Facility Manager', () => {
    // Test Case ID: TC_FACMGUARD_04
    // Nghiệp vụ: Ban quản lý truy cập màn tổng hợp/điều phối quản lý.
    mockAuthService.isFacilityManager.and.returnValue(true);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/quan-ly'));

    expect(canActivate).toBeTrue();
  });

  it('TC_FACMGUARD_05 - block access to /request when user is not Facility Manager', () => {
    // Test Case ID: TC_FACMGUARD_05
    // Nghiệp vụ: role khác không được xử lý yêu cầu.
    mockAuthService.isFacilityManager.and.returnValue(false);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_06 - block access to /them-cap-nhat when user is not Facility Manager', () => {
    // Test Case ID: TC_FACMGUARD_06
    // Nghiệp vụ: thay đổi dữ liệu thiết bị là thao tác nhạy cảm, phải chặn role không phù hợp.
    mockAuthService.isFacilityManager.and.returnValue(false);

    const canActivate = executeFacilityManagerGuard(
      makeRouteSnapshot(),
      makeRouterStateSnapshot('/them-cap-nhat'),
    );

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_07 - block access when not logged in (isFacilityManager returns false)', () => {
    // Test Case ID: TC_FACMGUARD_07
    // Ghi chú: thực tế thường có authGuard chạy trước; ở đây đảm bảo facilityManagerGuard standalone vẫn deny.
    mockAuthService.isFacilityManager.and.returnValue(false);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_08 - block Teacher attempting to access Facility Manager routes', () => {
    // Test Case ID: TC_FACMGUARD_08
    // Nghiệp vụ: Teacher chỉ đăng ký/mượn; không xử lý request/quản lý thiết bị.
    mockAuthService.isFacilityManager.and.returnValue(false);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_09 - block Management Board attempting to access Facility Manager routes', () => {
    // Test Case ID: TC_FACMGUARD_09
    // Nghiệp vụ: Board phê duyệt/thống kê, không làm nghiệp vụ quản lý thiết bị.
    mockAuthService.isFacilityManager.and.returnValue(false);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_10 - block Admin attempting to access Facility Manager routes (by rule)', () => {
    // Test Case ID: TC_FACMGUARD_10
    // Nghiệp vụ theo rule “Manager-only”: Admin không thuộc role Facility Manager => bị chặn bởi guard này.
    // Nếu muốn Admin được phép vào mọi route, cần đổi yêu cầu/logic (không thuộc phạm vi test).
    mockAuthService.isFacilityManager.and.returnValue(false);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/quan-ly'));

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_11 - deny when role/session data is missing (conservative default)', () => {
    // Test Case ID: TC_FACMGUARD_11
    // Bảo mật: thiếu role/session (token lỗi/parse lỗi) => deny.
    mockAuthService.isFacilityManager.and.returnValue(false);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/account'));

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_12 - treat null/undefined isFacilityManager result as not Facility Manager', () => {
    // Test Case ID: TC_FACMGUARD_12
    // JS truthy/falsey: null/undefined => falsey => guard phải chặn.
    mockAuthService.isFacilityManager.and.returnValue(undefined as unknown as boolean);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_13 - truthy non-boolean from isFacilityManager still allows (document current behavior)', () => {
    // Test Case ID: TC_FACMGUARD_13
    // Hành vi code hiện tại: nếu isFacilityManager() trả truthy (dù không phải boolean) => allow.
    mockAuthService.isFacilityManager.and.returnValue('true' as unknown as boolean);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(canActivate).toBeTrue();
  });

  it('TC_FACMGUARD_14 - truthy string role (e.g., "Manager") allows (document current behavior)', () => {
    // Test Case ID: TC_FACMGUARD_14
    // Nếu AuthService trả về string truthy, guard vẫn pass theo hiện trạng.
    mockAuthService.isFacilityManager.and.returnValue('Manager' as unknown as boolean);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/quan-ly'));

    expect(canActivate).toBeTrue();
  });

  it('TC_FACMGUARD_15 - guard ignores route details (route.data can be complex)', () => {
    // Test Case ID: TC_FACMGUARD_15
    // Guard không đọc route.data nên quyết định chỉ dựa trên isFacilityManager().
    mockAuthService.isFacilityManager.and.returnValue(false);

    const routeSnapshot = makeRouteSnapshot({ feature: 'equipment-management', nested: { level: 1 } });
    const canActivate = executeFacilityManagerGuard(routeSnapshot, makeRouterStateSnapshot('/request'));

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_16 - guard does not depend on state (state can be undefined in tests)', () => {
    // Test Case ID: TC_FACMGUARD_16
    // Kỹ thuật: code hiện tại không dùng state, nên state undefined vẫn chạy.
    mockAuthService.isFacilityManager.and.returnValue(false);

    const canActivate = executeFacilityManagerGuard(
      makeRouteSnapshot(),
      undefined as unknown as RouterStateSnapshot,
    );

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_17 - call isFacilityManager exactly once per guard execution', () => {
    // Test Case ID: TC_FACMGUARD_17
    // Kỹ thuật: đảm bảo không gọi isFacilityManager nhiều lần.
    mockAuthService.isFacilityManager.and.returnValue(true);

    executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(mockAuthService.isFacilityManager).toHaveBeenCalledTimes(1);
  });

  it('TC_FACMGUARD_18 - repeated checks should consistently deny when not Facility Manager', () => {
    // Test Case ID: TC_FACMGUARD_18
    // Router có thể evaluate guard nhiều lần; kết quả phải nhất quán.
    mockAuthService.isFacilityManager.and.returnValue(false);

    const first = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));
    const second = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));
    const third = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(first).toBeFalse();
    expect(second).toBeFalse();
    expect(third).toBeFalse();
  });

  it('TC_FACMGUARD_19 - propagate error if isFacilityManager throws (document current behavior)', () => {
    // Test Case ID: TC_FACMGUARD_19
    // Hiện tại guard không try/catch nên nếu isFacilityManager throw thì guard throw.
    mockAuthService.isFacilityManager.and.throwError('token parse failed');

    expect(() =>
      executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request')),
    ).toThrow();
  });

  it('TC_FACMGUARD_20 - misconfiguration: facilityManagerGuard applied to /login should still deny non-manager', () => {
    // Test Case ID: TC_FACMGUARD_20
    // Cảnh báo cấu hình: gắn facilityManagerGuard lên route /login có thể chặn trang login.
    mockAuthService.isFacilityManager.and.returnValue(false);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/login'));

    expect(canActivate).toBeFalse();
  });

  it('TC_FACMGUARD_21 - note: UI guard can be bypassed if isFacilityManager returns true (security reminder)', () => {
    // Test Case ID: TC_FACMGUARD_21
    // Mục tiêu: ghi nhận rủi ro nghiệp vụ — phân quyền cuối cùng phải enforce ở backend.
    mockAuthService.isFacilityManager.and.returnValue(true);

    const canActivate = executeFacilityManagerGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/request'));

    expect(canActivate).toBeTrue();
  });
});
