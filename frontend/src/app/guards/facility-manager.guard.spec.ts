import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { facilityManagerGuard } from './facility-manager.guard';

describe('facilityManagerGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => facilityManagerGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
