import { Routes } from '@angular/router';
import { PageIntroComponent } from './components/page-intro/page-intro.component';
import { PageHomeComponent } from './components/page-home/page-home.component';
import { PageLabComponent } from './components/page-lab/page-lab.component';
import { PageThietBiComponent } from './components/page-thiet-bi/page-thiet-bi.component';
import { PageDangKyComponent } from './components/page-dang-ky/page-dang-ky.component';
import { PageAdminComponent } from './components/page-admin/page-admin.component';
import { PageThongKeComponent } from './components/page-thong-ke/page-thong-ke.component';
import { PageThemCapNhatComponent } from './components/page-them-cap-nhat/page-them-cap-nhat.component';
import { PageMuonComponent } from './components/page-muon/page-muon.component';
import { PageErrorComponent } from './components/page-error/page-error.component';
import { authGuard } from './guards/auth.guard';
import { PageAccountComponent } from './components/page-account/page-account.component';
import { PageRequestComponent } from './components/page-request/page-request.component';
import { PageApprovedComponent } from './components/page-approved/page-approved.component';
import { teacherGuard } from './guards/teacher.guard';
import { facilityManagerGuard } from './guards/facility-manager.guard';
import { managementBoardGuard } from './guards/management-board.guard';
import { adminGuard } from './guards/admin.guard';


export const routes: Routes = [
  { path: 'login', component: PageIntroComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // TEACHER
  { path: 'trang-chu', component: PageHomeComponent, canActivate: [authGuard] },
  { path: 'thiet-bi', component: PageThietBiComponent, canActivate: [authGuard] },
  { path: 'phong-hoc', component: PageLabComponent, canActivate: [authGuard] },
  { path: 'dang-ky', component: PageDangKyComponent, canActivate: [authGuard] },
  { path: 'muon', component: PageMuonComponent, canActivate: [authGuard] },

  // FACILITY MANAGER
  { path: 'request', component: PageRequestComponent, canActivate: [authGuard, facilityManagerGuard] },
  { path: 'them-cap-nhat', component: PageThemCapNhatComponent, canActivate: [authGuard, facilityManagerGuard] },
  { path: 'account', component: PageAccountComponent, canActivate: [authGuard, facilityManagerGuard] },
  { path: 'quan-ly', component: PageAdminComponent, canActivate: [authGuard, facilityManagerGuard] },

  // MANAGEMENT BOARD
  
  // SHARED MANAGER + BOARD
  { path: 'approved', component: PageApprovedComponent, canActivate: [authGuard, adminGuard] },
  { path: 'thong-ke-bao-cao', component: PageThongKeComponent, canActivate: [authGuard, adminGuard] },

  { path: 'error', component: PageErrorComponent }
];

