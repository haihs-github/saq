import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';

/**
 * Unit test scripts — admin.guard.ts
 *
 * CheckDB:
 * - N/A. Guard không truy cập CSDL.
 *
 * Rollback:
 * - N/A. Guard không thay đổi data trong CSDL.
 *
 * Lưu ý:
 * - Đây là functional guard (dùng `inject(...)`) nên phải chạy trong injection context.
 * - Mỗi `it(...)` đều có comment “Test Case ID” để trace sang UNIT_TEST_DETAIL.md.
 */

describe('adminGuard', () => {
  const executeAdminGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

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
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin']);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });
  });

  it('TC_ADMINGUARD_01 - allow access to admin-only route when user is Admin (happy path)', () => {
    // Test Case ID: TC_ADMINGUARD_01
    // Nghiệp vụ: chức năng quản trị hệ thống chỉ cho phép Admin.
    mockAuthService.isAdmin.and.returnValue(true);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeTrue();
  });

  it('TC_ADMINGUARD_02 - block access to admin-only route when user is not Admin', () => {
    // Test Case ID: TC_ADMINGUARD_02
    // Nghiệp vụ: không phải Admin thì phải bị chặn truy cập.
    mockAuthService.isAdmin.and.returnValue(false);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeFalse();
  });

  it('TC_ADMINGUARD_03 - block access when user is not logged in (isAdmin returns false)', () => {
    // Test Case ID: TC_ADMINGUARD_03
    // Giả định nghiệp vụ: chưa login thì không thể là Admin.
    mockAuthService.isAdmin.and.returnValue(false);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeFalse();
  });

  it('TC_ADMINGUARD_04 - block Teacher attempting to access admin route', () => {
    // Test Case ID: TC_ADMINGUARD_04
    // Nghiệp vụ: Teacher không có quyền quản trị hệ thống.
    mockAuthService.isAdmin.and.returnValue(false);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeFalse();
  });

  it('TC_ADMINGUARD_05 - block Management Board attempting to access admin route', () => {
    // Test Case ID: TC_ADMINGUARD_05
    // Nghiệp vụ: Ban giám hiệu chỉ phê duyệt, không quản trị user/phân quyền.
    mockAuthService.isAdmin.and.returnValue(false);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeFalse();
  });

  it('TC_ADMINGUARD_06 - block Facility Manager attempting to access admin route', () => {
    // Test Case ID: TC_ADMINGUARD_06
    // Nghiệp vụ: Ban quản lý thiết bị không có quyền admin hệ thống.
    mockAuthService.isAdmin.and.returnValue(false);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeFalse();
  });

  it('TC_ADMINGUARD_07 - deny when role/session data is missing (conservative default)', () => {
    // Test Case ID: TC_ADMINGUARD_07
    // Bảo mật: thiếu thông tin quyền → deny.
    mockAuthService.isAdmin.and.returnValue(false);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeFalse();
  });

  it('TC_ADMINGUARD_08 - treat null/undefined isAdmin result as not admin', () => {
    // Test Case ID: TC_ADMINGUARD_08
    // JS truthy/falsey: null/undefined là falsey → guard phải chặn.
    mockAuthService.isAdmin.and.returnValue(undefined as unknown as boolean);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeFalse();
  });

  it('TC_ADMINGUARD_09 - truthy non-boolean from isAdmin still allows (document current behavior)', () => {
    // Test Case ID: TC_ADMINGUARD_09
    // Hành vi theo code hiện tại: nếu isAdmin() trả truthy (dù không phải boolean) → allow.
    mockAuthService.isAdmin.and.returnValue('true' as unknown as boolean);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeTrue();
  });

  it('TC_ADMINGUARD_10 - truthy string role (e.g., "Admin") allows (document current behavior)', () => {
    // Test Case ID: TC_ADMINGUARD_10
    // Nếu AuthService trả về string truthy, guard vẫn pass theo hiện trạng.
    mockAuthService.isAdmin.and.returnValue('Admin' as unknown as boolean);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeTrue();
  });

  it('TC_ADMINGUARD_11 - guard ignores route details (route.data can be complex)', () => {
    // Test Case ID: TC_ADMINGUARD_11
    // Guard không đọc route.data nên quyết định chỉ dựa trên isAdmin().
    mockAuthService.isAdmin.and.returnValue(false);

    const routeSnapshot = makeRouteSnapshot({ feature: 'user-management', nested: { level: 1 } });
    const canActivate = executeAdminGuard(routeSnapshot, makeRouterStateSnapshot('/admin/users'));

    expect(canActivate).toBeFalse();
  });

  it('TC_ADMINGUARD_12 - guard does not depend on state (state can be undefined in tests)', () => {
    // Test Case ID: TC_ADMINGUARD_12
    // Kỹ thuật: code hiện tại không dùng state, nên state undefined vẫn chạy.
    mockAuthService.isAdmin.and.returnValue(false);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), undefined as unknown as RouterStateSnapshot);

    expect(canActivate).toBeFalse();
  });

  it('TC_ADMINGUARD_13 - call isAdmin exactly once per guard execution', () => {
    // Test Case ID: TC_ADMINGUARD_13
    // Kỹ thuật: đảm bảo không gọi isAdmin nhiều lần.
    mockAuthService.isAdmin.and.returnValue(true);

    executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(mockAuthService.isAdmin).toHaveBeenCalledTimes(1);
  });

  it('TC_ADMINGUARD_14 - repeated checks should consistently deny when not admin', () => {
    // Test Case ID: TC_ADMINGUARD_14
    // Router có thể evaluate guard nhiều lần; kết quả phải nhất quán.
    mockAuthService.isAdmin.and.returnValue(false);

    const first = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));
    const second = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));
    const third = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(first).toBeFalse();
    expect(second).toBeFalse();
    expect(third).toBeFalse();
  });

  it('TC_ADMINGUARD_15 - propagate error if isAdmin throws (document current behavior)', () => {
    // Test Case ID: TC_ADMINGUARD_15
    // Hiện tại guard không try/catch nên nếu isAdmin throw thì guard throw.
    mockAuthService.isAdmin.and.throwError('token parse failed');

    expect(() => executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'))).toThrow();
  });

  it('TC_ADMINGUARD_16 - note: UI guard can be bypassed if isAdmin returns true (security reminder)', () => {
    // Test Case ID: TC_ADMINGUARD_16
    // Mục tiêu: ghi nhận rủi ro nghiệp vụ — phân quyền cuối cùng phải enforce ở backend.
    mockAuthService.isAdmin.and.returnValue(true);

    const canActivate = executeAdminGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeTrue();
  });
});
