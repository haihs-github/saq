import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

/*
 * Frontend service unit tests do not talk to the database directly.
 * HttpClient is mocked, so CheckDB and Rollback are only relevant for API/DAO integration tests.
 * Test case comments are kept immediately before each it(...) block for traceability.
 */

describe('AuthService', () => {
  let authService: AuthService;
  let httpTestingController: HttpTestingController;

  const teacherCredentials = { userName: 'gv01', password: '123456' };
  const teacherToken = '101ABCDEFGHIJKLMNOPQRSTGiáoviên';
  const facilityManagerToken = '202ABCDEFGHIJKLMNOPQRSTBanquảnlý';
  const managementBoardToken = '303ABCDEFGHIJKLMNOPQRSTBangiámhiệu';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    authService = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => {
    httpTestingController.verify();
    sessionStorage.clear();
  });

  // TC_AUTH_LOGIN_01: Persist the token and mark the session as logged in.
  it('[TC_AUTH_LOGIN_01] stores the token after a successful login', async () => {
    const loginResponsePromise = firstValueFrom(authService.login(teacherCredentials));

    const request = httpTestingController.expectOne(`${environment.apiUrl}/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(teacherCredentials);

    request.flush({ token: teacherToken });

    const loginResponse = await loginResponsePromise;

    expect(loginResponse).toEqual({ token: teacherToken });
    expect(sessionStorage.getItem('token')).toBe(teacherToken);
    expect(authService.isLoggedIn()).toBeTrue();
  });

  // TC_AUTH_LOGIN_02: A backend response without token must not create a valid session.
  it('[TC_AUTH_LOGIN_02] keeps the session invalid when the backend response has no token', async () => {
    const loginResponsePromise = firstValueFrom(authService.login(teacherCredentials));

    const request = httpTestingController.expectOne(`${environment.apiUrl}/login`);
    request.flush({ message: 'OK' });

    const loginResponse = await loginResponsePromise;

    expect(loginResponse).toEqual({ message: 'OK' });
    expect(sessionStorage.getItem('token')).toBe('undefined');
    expect(authService.isLoggedIn()).toBeFalse();
    expect(authService.getRole()).toBeNull();
  });

  // TC_AUTH_LOGOUT_01: Remove the active session token.
  it('[TC_AUTH_LOGOUT_01] removes the token when logging out', () => {
    sessionStorage.setItem('token', teacherToken);

    authService.logout();

    expect(sessionStorage.getItem('token')).toBeNull();
    expect(authService.isLoggedIn()).toBeFalse();
  });

  // TC_AUTH_ROLE_01: Recognize a teacher token and its helpers.
  it('[TC_AUTH_ROLE_01] recognizes the teacher token and role helpers', () => {
    sessionStorage.setItem('token', teacherToken);

    expect(authService.getRole()).toBe('Giáoviên');
    expect(authService.isTeacher()).toBeTrue();
    expect(authService.isFacilityManager()).toBeFalse();
    expect(authService.isManagementBoard()).toBeFalse();
    expect(authService.isAdmin()).toBeFalse();
  });

  // TC_AUTH_ROLE_02: Recognize a facility manager token and admin access.
  it('[TC_AUTH_ROLE_02] recognizes the facility manager token and admin access', () => {
    sessionStorage.setItem('token', facilityManagerToken);

    expect(authService.getRole()).toBe('Banquảnlý');
    expect(authService.isTeacher()).toBeFalse();
    expect(authService.isFacilityManager()).toBeTrue();
    expect(authService.isManagementBoard()).toBeFalse();
    expect(authService.isAdmin()).toBeTrue();
  });

  // TC_AUTH_ROLE_03: Recognize a management board token and admin access.
  it('[TC_AUTH_ROLE_03] recognizes the management board token and admin access', () => {
    sessionStorage.setItem('token', managementBoardToken);

    expect(authService.getRole()).toBe('Bangiámhiệu');
    expect(authService.isTeacher()).toBeFalse();
    expect(authService.isFacilityManager()).toBeFalse();
    expect(authService.isManagementBoard()).toBeTrue();
    expect(authService.isAdmin()).toBeTrue();
  });

  // TC_AUTH_ROLE_04: Reject malformed or unsupported role tokens.
  it('[TC_AUTH_ROLE_04] returns null and false helpers for a malformed token', () => {
    sessionStorage.setItem('token', '999INVALIDTOKEN');

    expect(authService.getRole()).toBeNull();
    expect(authService.isTeacher()).toBeFalse();
    expect(authService.isFacilityManager()).toBeFalse();
    expect(authService.isManagementBoard()).toBeFalse();
    expect(authService.isAdmin()).toBeFalse();
  });

  // TC_AUTH_ID_01: Extract the numeric prefix from the stored token.
  it('[TC_AUTH_ID_01] extracts the numeric user id prefix from the token', () => {
    sessionStorage.setItem('token', teacherToken);

    expect(authService.getIdUser()).toBe('101');
  });

  // TC_AUTH_ID_02: Fallback to zero when the token is missing or malformed.
  it('[TC_AUTH_ID_02] returns zero when the token is missing or malformed', () => {
    expect(authService.getIdUser()).toBe('0');

    sessionStorage.setItem('token', 'Giáoviên');

    expect(authService.getIdUser()).toBe('0');
  });

  // TC_AUTH_TOK_01: White-box check for the private token setter.
  it('[TC_AUTH_TOK_01] writes the token through the private setter helper', () => {
    (authService as any).setToken('white-box-token');

    expect(sessionStorage.getItem('token')).toBe('white-box-token');
  });

  // TC_AUTH_TOK_02: White-box check for the private token remover.
  it('[TC_AUTH_TOK_02] removes the token through the private remover helper', () => {
    sessionStorage.setItem('token', 'white-box-token');

    (authService as any).removeToken();

    expect(sessionStorage.getItem('token')).toBeNull();
  });

  // TC_AUTH_SSR_01: The browser test environment should support sessionStorage.
  it('[TC_AUTH_SSR_01] reports sessionStorage support in the browser test environment', () => {
    expect((authService as any).isSessionStorageSupported()).toBeTrue();
  });
});