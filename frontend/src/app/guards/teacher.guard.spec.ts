import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';

import { teacherGuard } from './teacher.guard';

describe('teacherGuard', () => {
  /**
   * Unit test scripts — teacher.guard.ts
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

  const executeTeacherGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => teacherGuard(...guardParameters));

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
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['isTeacher']);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });
  });

  it('TC_TEACHGUARD_01 - allow access to registration route when user is Teacher (happy path)', () => {
    // Test Case ID: TC_TEACHGUARD_01
    // Nghiệp vụ: Teacher được phép vào màn “Đăng ký” để tạo phiếu đăng ký mượn.
    mockAuthService.isTeacher.and.returnValue(true);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(canActivate).toBeTrue();
  });

  it('TC_TEACHGUARD_02 - allow access to borrow route when user is Teacher', () => {
    // Test Case ID: TC_TEACHGUARD_02
    // Nghiệp vụ: Teacher được phép thao tác “Mượn” theo quy trình.
    mockAuthService.isTeacher.and.returnValue(true);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/muon'));

    expect(canActivate).toBeTrue();
  });

  it('TC_TEACHGUARD_03 - allow access to equipment/lab lookup routes when user is Teacher', () => {
    // Test Case ID: TC_TEACHGUARD_03
    // Nghiệp vụ: Teacher có thể tra cứu thiết bị/phòng học trước khi đăng ký.
    mockAuthService.isTeacher.and.returnValue(true);

    const equipmentRoute = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/thiet-bi'));
    const labRoute = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/phong-hoc'));

    expect(equipmentRoute).toBeTrue();
    expect(labRoute).toBeTrue();
  });

  it('TC_TEACHGUARD_04 - block access to registration route when user is not Teacher', () => {
    // Test Case ID: TC_TEACHGUARD_04
    // Nghiệp vụ: người không thuộc role Teacher không được vào màn “Đăng ký”.
    mockAuthService.isTeacher.and.returnValue(false);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_05 - block access to borrow route when user is not Teacher', () => {
    // Test Case ID: TC_TEACHGUARD_05
    // Nghiệp vụ: người không phải Teacher không được thao tác “Mượn”.
    mockAuthService.isTeacher.and.returnValue(false);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/muon'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_06 - block access when user is not logged in (isTeacher returns false)', () => {
    // Test Case ID: TC_TEACHGUARD_06
    // Ghi chú: thông thường authGuard chạy trước; tuy nhiên teacherGuard standalone vẫn phải deny.
    mockAuthService.isTeacher.and.returnValue(false);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_07 - block Admin attempting to access Teacher-only route (by rule)', () => {
    // Test Case ID: TC_TEACHGUARD_07
    // Nghiệp vụ theo rule “Teacher-only”: Admin không thuộc role Teacher => bị chặn bởi guard này.
    // Nếu muốn Admin được phép vào mọi route, cần đổi yêu cầu/logic (không thuộc phạm vi test).
    mockAuthService.isTeacher.and.returnValue(false);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_08 - block Facility Manager attempting to access Teacher-only route', () => {
    // Test Case ID: TC_TEACHGUARD_08
    // Nghiệp vụ: Facility Manager quản lý thiết bị/yêu cầu, không đi theo luồng Teacher.
    mockAuthService.isTeacher.and.returnValue(false);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/muon'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_09 - block Management Board attempting to access Teacher-only route', () => {
    // Test Case ID: TC_TEACHGUARD_09
    // Nghiệp vụ: Board phê duyệt/thống kê, không thao tác mượn như Teacher.
    mockAuthService.isTeacher.and.returnValue(false);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/muon'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_10 - deny when role/session data is missing (conservative default)', () => {
    // Test Case ID: TC_TEACHGUARD_10
    // Bảo mật: thiếu role/session (token lỗi/parse lỗi) => deny.
    mockAuthService.isTeacher.and.returnValue(false);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_11 - treat null/undefined isTeacher result as not Teacher', () => {
    // Test Case ID: TC_TEACHGUARD_11
    // JS truthy/falsey: null/undefined => falsey => guard phải chặn.
    mockAuthService.isTeacher.and.returnValue(undefined as unknown as boolean);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_12 - truthy non-boolean from isTeacher still allows (document current behavior)', () => {
    // Test Case ID: TC_TEACHGUARD_12
    // Hành vi code hiện tại: nếu isTeacher() trả truthy (dù không phải boolean) => allow.
    mockAuthService.isTeacher.and.returnValue('true' as unknown as boolean);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(canActivate).toBeTrue();
  });

  it('TC_TEACHGUARD_13 - truthy string role (e.g., "Teacher") allows (document current behavior)', () => {
    // Test Case ID: TC_TEACHGUARD_13
    // Nếu AuthService trả về string truthy, guard vẫn pass theo hiện trạng.
    mockAuthService.isTeacher.and.returnValue('Teacher' as unknown as boolean);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/muon'));

    expect(canActivate).toBeTrue();
  });

  it('TC_TEACHGUARD_14 - guard ignores route details (route.data can be complex)', () => {
    // Test Case ID: TC_TEACHGUARD_14
    // Guard không đọc route.data nên quyết định chỉ dựa trên isTeacher().
    mockAuthService.isTeacher.and.returnValue(false);

    const routeSnapshot = makeRouteSnapshot({ feature: 'dang-ky-muon', nested: { level: 1 } });
    const canActivate = executeTeacherGuard(routeSnapshot, makeRouterStateSnapshot('/dang-ky'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_15 - guard does not depend on state (state can be undefined in tests)', () => {
    // Test Case ID: TC_TEACHGUARD_15
    // Kỹ thuật: code hiện tại không dùng state, nên state undefined vẫn chạy.
    mockAuthService.isTeacher.and.returnValue(false);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), undefined as unknown as RouterStateSnapshot);

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_16 - call isTeacher exactly once per guard execution', () => {
    // Test Case ID: TC_TEACHGUARD_16
    // Kỹ thuật: đảm bảo không gọi isTeacher nhiều lần.
    mockAuthService.isTeacher.and.returnValue(true);

    executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(mockAuthService.isTeacher).toHaveBeenCalledTimes(1);
  });

  it('TC_TEACHGUARD_17 - repeated checks should consistently deny when not Teacher', () => {
    // Test Case ID: TC_TEACHGUARD_17
    // Router có thể evaluate guard nhiều lần; kết quả phải nhất quán.
    mockAuthService.isTeacher.and.returnValue(false);

    const first = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));
    const second = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));
    const third = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(first).toBeFalse();
    expect(second).toBeFalse();
    expect(third).toBeFalse();
  });

  it('TC_TEACHGUARD_18 - propagate error if isTeacher throws (document current behavior)', () => {
    // Test Case ID: TC_TEACHGUARD_18
    // Hiện tại guard không try/catch nên nếu isTeacher throw thì guard throw.
    mockAuthService.isTeacher.and.throwError('token parse failed');

    expect(() => executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'))).toThrow();
  });

  it('TC_TEACHGUARD_19 - misconfiguration: teacherGuard applied to /login route should still deny non-Teacher', () => {
    // Test Case ID: TC_TEACHGUARD_19
    // Cảnh báo cấu hình: gắn teacherGuard lên route /login có thể chặn trang login.
    mockAuthService.isTeacher.and.returnValue(false);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/login'));

    expect(canActivate).toBeFalse();
  });

  it('TC_TEACHGUARD_20 - note: UI guard can be bypassed if isTeacher returns true (security reminder)', () => {
    // Test Case ID: TC_TEACHGUARD_20
    // Mục tiêu: ghi nhận rủi ro nghiệp vụ — phân quyền cuối cùng phải enforce ở backend.
    mockAuthService.isTeacher.and.returnValue(true);

    const canActivate = executeTeacherGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/dang-ky'));

    expect(canActivate).toBeTrue();
  });
});
