import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../services/auth.service';

import { managementBoardGuard } from './management-board.guard';

describe('managementBoardGuard', () => {
  /**
   * Unit test scripts — management-board.guard.ts
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

  const executeManagementBoardGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => managementBoardGuard(...guardParameters));

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
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['isManagementBoard']);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    });
  });

  it('TC_MBGUARD_01 - allow access to approval route when user is Management Board (happy path)', () => {
    // Test Case ID: TC_MBGUARD_01
    // Nghiệp vụ: Board được phép vào màn phê duyệt các yêu cầu.
    mockAuthService.isManagementBoard.and.returnValue(true);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeTrue();
  });

  it('TC_MBGUARD_02 - allow access to reporting/statistics route when user is Management Board', () => {
    // Test Case ID: TC_MBGUARD_02
    // Nghiệp vụ: Board được phép xem báo cáo/thống kê tổng hợp.
    mockAuthService.isManagementBoard.and.returnValue(true);

    const canActivate = executeManagementBoardGuard(
      makeRouteSnapshot(),
      makeRouterStateSnapshot('/thong-ke-bao-cao'),
    );

    expect(canActivate).toBeTrue();
  });

  it('TC_MBGUARD_03 - block access to approval route when user is not Management Board (deny path)', () => {
    // Test Case ID: TC_MBGUARD_03
    // Nghiệp vụ: role khác (Teacher/Manager/...) không được truy cập phê duyệt.
    mockAuthService.isManagementBoard.and.returnValue(false);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_04 - block access to reporting/statistics route when user is not Management Board', () => {
    // Test Case ID: TC_MBGUARD_04
    // Nghiệp vụ: báo cáo chứa thông tin nhạy cảm nên chỉ Board được xem.
    mockAuthService.isManagementBoard.and.returnValue(false);

    const canActivate = executeManagementBoardGuard(
      makeRouteSnapshot(),
      makeRouterStateSnapshot('/thong-ke-bao-cao'),
    );

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_05 - block access when user is not logged in (isManagementBoard returns false)', () => {
    // Test Case ID: TC_MBGUARD_05
    // Ghi chú: thực tế thường có authGuard chạy trước; ở đây đảm bảo guard standalone vẫn deny.
    mockAuthService.isManagementBoard.and.returnValue(false);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_06 - block Teacher attempting to access Board-only routes', () => {
    // Test Case ID: TC_MBGUARD_06
    // Nghiệp vụ: Teacher chỉ đăng ký/mượn; không có quyền phê duyệt.
    mockAuthService.isManagementBoard.and.returnValue(false);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_07 - block Facility Manager attempting to access Board-only routes', () => {
    // Test Case ID: TC_MBGUARD_07
    // Nghiệp vụ: Ban quản lý cơ sở vật chất xử lý request/thiết bị; không phê duyệt cấp Board.
    mockAuthService.isManagementBoard.and.returnValue(false);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_08 - block Admin attempting to access Board-only routes (by rule)', () => {
    // Test Case ID: TC_MBGUARD_08
    // Theo rule “Board-only”: Admin không thuộc role Board => bị chặn bởi guard này.
    // Nếu nghiệp vụ muốn Admin vào mọi route, cần đổi yêu cầu/logic (không thuộc phạm vi test).
    mockAuthService.isManagementBoard.and.returnValue(false);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_09 - deny when role/session data is missing (conservative default)', () => {
    // Test Case ID: TC_MBGUARD_09
    // Bảo mật: thiếu role/session (token lỗi/parse lỗi) => deny.
    mockAuthService.isManagementBoard.and.returnValue(false);

    const canActivate = executeManagementBoardGuard(
      makeRouteSnapshot(),
      makeRouterStateSnapshot('/thong-ke-bao-cao'),
    );

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_10 - treat null/undefined isManagementBoard result as not Management Board', () => {
    // Test Case ID: TC_MBGUARD_10
    // JS truthy/falsey: null/undefined => falsey => guard phải chặn.
    mockAuthService.isManagementBoard.and.returnValue(undefined as unknown as boolean);

    const undefinedResult = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(undefinedResult).toBeFalse();

    mockAuthService.isManagementBoard.and.returnValue(null as unknown as boolean);
    const nullResult = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));
    expect(nullResult).toBeFalse();
  });

  it('TC_MBGUARD_11 - truthy non-boolean from isManagementBoard still allows (document current behavior)', () => {
    // Test Case ID: TC_MBGUARD_11
    // Hành vi code hiện tại: nếu isManagementBoard() trả truthy (dù không phải boolean) => allow.
    mockAuthService.isManagementBoard.and.returnValue('true' as unknown as boolean);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeTrue();
  });

  it('TC_MBGUARD_12 - truthy string role (e.g., "Board") allows (document current behavior)', () => {
    // Test Case ID: TC_MBGUARD_12
    // Nếu AuthService trả về string truthy, guard vẫn pass theo hiện trạng.
    mockAuthService.isManagementBoard.and.returnValue('Board' as unknown as boolean);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeTrue();
  });

  it('TC_MBGUARD_13 - guard ignores route details (route.data can be complex)', () => {
    // Test Case ID: TC_MBGUARD_13
    // Guard không đọc route.data nên quyết định chỉ dựa trên isManagementBoard().
    mockAuthService.isManagementBoard.and.returnValue(false);

    const routeSnapshot = makeRouteSnapshot({ feature: 'approval', nested: { level: 1 } });
    const canActivate = executeManagementBoardGuard(routeSnapshot, makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_14 - guard does not depend on state (state can be undefined in tests)', () => {
    // Test Case ID: TC_MBGUARD_14
    // Kỹ thuật: code hiện tại không dùng state, nên state undefined vẫn chạy.
    mockAuthService.isManagementBoard.and.returnValue(false);

    const canActivate = executeManagementBoardGuard(
      makeRouteSnapshot(),
      undefined as unknown as RouterStateSnapshot,
    );

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_15 - call isManagementBoard exactly once per guard execution', () => {
    // Test Case ID: TC_MBGUARD_15
    // Kỹ thuật: đảm bảo không gọi isManagementBoard nhiều lần.
    mockAuthService.isManagementBoard.and.returnValue(true);

    executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(mockAuthService.isManagementBoard).toHaveBeenCalledTimes(1);
  });

  it('TC_MBGUARD_16 - repeated checks should consistently deny when not Management Board', () => {
    // Test Case ID: TC_MBGUARD_16
    // Router có thể evaluate guard nhiều lần; kết quả phải nhất quán.
    mockAuthService.isManagementBoard.and.returnValue(false);

    const first = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));
    const second = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));
    const third = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(first).toBeFalse();
    expect(second).toBeFalse();
    expect(third).toBeFalse();
  });

  it('TC_MBGUARD_17 - propagate error if isManagementBoard throws (document current behavior)', () => {
    // Test Case ID: TC_MBGUARD_17
    // Hiện tại guard không try/catch nên nếu isManagementBoard throw thì guard throw.
    mockAuthService.isManagementBoard.and.throwError('token parse failed');

    expect(() =>
      executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved')),
    ).toThrow();
  });

  it('TC_MBGUARD_18 - misconfiguration: managementBoardGuard applied to /login should still deny non-board', () => {
    // Test Case ID: TC_MBGUARD_18
    // Cảnh báo cấu hình: gắn managementBoardGuard lên route /login có thể chặn trang login.
    mockAuthService.isManagementBoard.and.returnValue(false);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/login'));

    expect(canActivate).toBeFalse();
  });

  it('TC_MBGUARD_19 - note: UI guard can be bypassed if isManagementBoard returns true (security reminder)', () => {
    // Test Case ID: TC_MBGUARD_19
    // Mục tiêu: ghi nhận rủi ro nghiệp vụ — phân quyền cuối cùng phải enforce ở backend.
    mockAuthService.isManagementBoard.and.returnValue(true);

    const canActivate = executeManagementBoardGuard(makeRouteSnapshot(), makeRouterStateSnapshot('/approved'));

    expect(canActivate).toBeTrue();
  });
});
