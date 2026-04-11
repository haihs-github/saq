import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const managementBoardGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService)
  
    if (authService.isManagementBoard()) {
      return true
    } else {
      return false
    }
};
