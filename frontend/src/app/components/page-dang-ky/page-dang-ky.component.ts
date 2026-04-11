import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { UserComponent } from '../user/user.component';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchThongKeComponent } from '../search-thong-ke/search-thong-ke.component';
import { SharedService } from '../../services/shared.service';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-page-dang-ky',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, UserComponent, CommonModule, SearchThongKeComponent,NavbarComponent],
  templateUrl: './page-dang-ky.component.html',
  styleUrls: ['./page-dang-ky.component.css']
})
export class PageDangKyComponent implements OnInit, OnDestroy {
  dangKy: any = [];
  today:string=""
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private shared: SharedService
  ) { }

ngOnInit(): void {
  this.today = this.shared.getDMY(); // vd: 2025-12-28

  const subscription1 = this.apiService
    .getByUserBorrowReturnSlip(this.authService.getIdUser())
    .subscribe({
      next: (response: any[]) => {
        const today = new Date(this.today);

        // thêm cờ isLate cho mỗi dòng
        this.dangKy = response.map(x => {
          const hanTra = new Date(x.DATE_ExceptionReturnDate);
          return {
            ...x,
            isLate: hanTra < today && x.DATE_ActualReturnDate == null
          };
        });
        console.log(this.dangKy)
      },
      error: (error) => console.log('error!', error)
    });
  this.subscriptions.push(subscription1);
}


  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  reloadCurrentPage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
  chiTiet(id:string,BORROW_RETURN_SLIP_Status:string){
    this.shared.setTypeAction("slip_detail")
      this.shared.setBorrowReturnSlipDetailId(id)
        this.router.navigate(['/muon']);
  }

  tra(id: string, idThietBi: string): void {}
}
