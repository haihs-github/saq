import { TestBed } from '@angular/core/testing';
import { CanActivateFn, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

/**
 * Unit test scripts — auth.guard.ts
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

describe('authGuard', () => {
  const executeAuthGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const makeRouteSnapshot = (data: Record<string, unknown> = {}): ActivatedRouteSnapshot => {
    // Guard hiện tại không dùng `route`, nhưng tạo object rõ ràng giúp test dễ hiểu.
    return ({ data } as unknown) as ActivatedRouteSnapshot;
  };

  const makeRouterStateSnapshot = (url: string): RouterStateSnapshot => {
    // Guard hiện tại không dùng `state.url`, nhưng tạo object rõ ràng giúp trace nghiệp vụ.
    return ({ url } as unknown) as RouterStateSnapshot;
  };

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);
    mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('TC_AUTHGUARD_01 - allow access to business route when logged in', () => {
    // Test Case ID: TC_AUTHGUARD_01
    // Nghiệp vụ: Người dùng đã đăng nhập thì được phép vào các trang nghiệp vụ.
    mockAuthService.isLoggedIn.and.returnValue(true);

    const routeSnapshot = makeRouteSnapshot();
    const routerState = makeRouterStateSnapshot('/equipment');
    const canActivate = executeAuthGuard(routeSnapshot, routerState);

    expect(canActivate).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('TC_AUTHGUARD_02 - allow access to admin route when logged in (no role check here)', () => {
    // Test Case ID: TC_AUTHGUARD_02
    // Nghiệp vụ: authGuard chỉ check đăng nhập, không check phân quyền.
    mockAuthService.isLoggedIn.and.returnValue(true);

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('TC_AUTHGUARD_03 - redirect to /login and block access when not logged in', () => {
    // Test Case ID: TC_AUTHGUARD_03
    // Nghiệp vụ: chưa đăng nhập → chặn route và điều hướng sang /login.
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('TC_AUTHGUARD_04 - block sensitive approval route when not logged in', () => {
    // Test Case ID: TC_AUTHGUARD_04
    // Nghiệp vụ: các trang nhạy cảm (phê duyệt) vẫn dùng rule “phải đăng nhập”.
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('TC_AUTHGUARD_05 - redirect even when URL includes query/fragment', () => {
    // Test Case ID: TC_AUTHGUARD_05
    // Nghiệp vụ: truy cập trực tiếp URL có query/fragment khi chưa login → vẫn phải về /login.
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const canActivate = executeAuthGuard(
      makeRouteSnapshot(),
      makeRouterStateSnapshot('/borrow-return?from=menu#top'),
    );

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('TC_AUTHGUARD_06 - guard ignores route content (route may contain complex data)', () => {
    // Test Case ID: TC_AUTHGUARD_06
    // Nghiệp vụ: authGuard không dựa vào route.data nên mọi protected route xử lý giống nhau.
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const routeSnapshot = makeRouteSnapshot({ any: 'value', nested: { a: 1 } });
    const canActivate = executeAuthGuard(routeSnapshot, makeRouterStateSnapshot('/equipment'));

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('TC_AUTHGUARD_07 - guard should not depend on state (state can be undefined in tests)', () => {
    // Test Case ID: TC_AUTHGUARD_07
    // Kỹ thuật: đảm bảo guard không truy cập state.url (vì code hiện tại không dùng state).
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const canActivate = executeAuthGuard(makeRouteSnapshot(), undefined as unknown as RouterStateSnapshot);

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('TC_AUTHGUARD_08 - treat null/undefined login state as not logged in', () => {
    // Test Case ID: TC_AUTHGUARD_08
    // Nghiệp vụ: nếu AuthService lỗi và trả null/undefined → coi như chưa đăng nhập.
    mockAuthService.isLoggedIn.and.returnValue(undefined as unknown as boolean);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('TC_AUTHGUARD_09 - treat non-boolean truthy value as logged in (document current behavior)', () => {
    // Test Case ID: TC_AUTHGUARD_09
    // Nghiệp vụ/Code hiện tại: JS truthy/falsey → value truthy sẽ được coi như “đã login”.
    // Rủi ro: nếu muốn strict boolean nên sửa code guard/AuthService.
    mockAuthService.isLoggedIn.and.returnValue('true' as unknown as boolean);

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));

    expect(canActivate).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('TC_AUTHGUARD_10 - propagate error if isLoggedIn throws (document current behavior)', () => {
    // Test Case ID: TC_AUTHGUARD_10
    // Nghiệp vụ kỳ vọng có thể là “coi như chưa login”, nhưng code hiện tại không catch lỗi.
    mockAuthService.isLoggedIn.and.throwError('SecurityError');

    expect(() => executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'))).toThrow();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('TC_AUTHGUARD_11 - propagate error if router.navigate throws synchronously', () => {
    // Test Case ID: TC_AUTHGUARD_11
    // Kỹ thuật: nếu navigate throw, guard sẽ throw theo (do không try/catch).
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.throwError('Navigation failed');

    expect(() => executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'))).toThrow();
  });

  it('TC_AUTHGUARD_12 - still returns false even if router.navigate returns a rejected Promise (suppressed)', async () => {
    // Test Case ID: TC_AUTHGUARD_12
    // Lưu ý: guard không await promise, nên vẫn return false.
    // Để tránh “unhandled promise rejection” làm fail test, ta gắn catch vào promise.
    mockAuthService.isLoggedIn.and.returnValue(false);

    const rejectedNavigationPromise = Promise.reject(new Error('Navigation failed (async)'));
    rejectedNavigationPromise.catch(() => {
      // intentionally swallowed for test stability
    });
    mockRouter.navigate.and.returnValue(rejectedNavigationPromise as unknown as Promise<boolean>);

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);

    // Đảm bảo promise đã settle trước khi test kết thúc.
    await Promise.resolve();
  });

  it('TC_AUTHGUARD_13 - returns false even if router.navigate resolves to false (navigation canceled)', async () => {
    // Test Case ID: TC_AUTHGUARD_13
    // Nghiệp vụ: dù điều hướng có bị cancel, guard vẫn chặn truy cập (return false).
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.returnValue(Promise.resolve(false));

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);

    await Promise.resolve();
  });

  it('TC_AUTHGUARD_14 - verify redirect path is exactly ["/login"]', () => {
    // Test Case ID: TC_AUTHGUARD_14
    // Kỹ thuật: tránh nhầm sang navigate('/login') hoặc path khác.
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
  });

  it('TC_AUTHGUARD_15 - call isLoggedIn exactly once per guard execution', () => {
    // Test Case ID: TC_AUTHGUARD_15
    // Kỹ thuật: đảm bảo không gọi lặp isLoggedIn (dễ gây side-effect/giảm hiệu năng).
    mockAuthService.isLoggedIn.and.returnValue(true);

    executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));

    expect(mockAuthService.isLoggedIn).toHaveBeenCalledTimes(1);
  });

  it('TC_AUTHGUARD_16 - no redirect side-effect when logged in', () => {
    // Test Case ID: TC_AUTHGUARD_16
    // Nghiệp vụ: đã login → không được redirect.
    mockAuthService.isLoggedIn.and.returnValue(true);

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/any'));

    expect(canActivate).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('TC_AUTHGUARD_17 - repeated unauthenticated checks should redirect each time', () => {
    // Test Case ID: TC_AUTHGUARD_17
    // Nghiệp vụ: mỗi lần router evaluate guard khi chưa login → đều chặn và navigate /login.
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const first = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));
    const second = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));
    const third = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));

    expect(first).toBeFalse();
    expect(second).toBeFalse();
    expect(third).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledTimes(3);
  });

  it('TC_AUTHGUARD_18 - misconfiguration: guard attached to /login route while not logged in', () => {
    // Test Case ID: TC_AUTHGUARD_18
    // Nghiệp vụ: nếu cấu hình sai (guard trên chính /login), code hiện tại vẫn redirect /login.
    // Rủi ro: có thể gây vòng lặp navigation ở runtime (phụ thuộc router config).
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/login'));

    expect(canActivate).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('TC_AUTHGUARD_19 - misconfiguration: guard attached to /login route while logged in', () => {
    // Test Case ID: TC_AUTHGUARD_19
    // Nghiệp vụ: code hiện tại cho phép vào /login nếu isLoggedIn() truthy.
    mockAuthService.isLoggedIn.and.returnValue(true);

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/login'));

    expect(canActivate).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('TC_AUTHGUARD_20 - role-based authorization is out of scope for authGuard', () => {
    // Test Case ID: TC_AUTHGUARD_20
    // Nghiệp vụ: authGuard chỉ kiểm tra login.
    // Các rule như “chỉ Admin mới vào /admin” phải do adminGuard/role guard khác xử lý.
    mockAuthService.isLoggedIn.and.returnValue(true);

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/admin'));

    expect(canActivate).toBeTrue();
  });

  it('TC_AUTHGUARD_21 - expired token scenario is not validated here (current behavior)', () => {
    // Test Case ID: TC_AUTHGUARD_21
    // Nghiệp vụ: nếu token hết hạn nhưng AuthService vẫn trả true,
    // authGuard vẫn cho qua (vì không validate expiry).
    // Đây là test “document behavior”, không phải validate token.
    mockAuthService.isLoggedIn.and.returnValue(true);

    const canActivate = executeAuthGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/equipment'));

    expect(canActivate).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
