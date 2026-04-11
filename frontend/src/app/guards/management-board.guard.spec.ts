import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { managementBoardGuard } from './management-board.guard';

describe('managementBoardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => managementBoardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
