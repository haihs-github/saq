import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const facilityManagerGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService)
  
    if (authService.isFacilityManager()) {
      return true
    } else {
      return false
    }
};
