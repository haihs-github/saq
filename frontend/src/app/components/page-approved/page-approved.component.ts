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
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-page-dang-ky',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, UserComponent, CommonModule, FormsModule,NavbarComponent],
  templateUrl: './page-approved.component.html',
  styleUrls: ['./page-approved.component.css']
})
export class PageApprovedComponent implements OnInit, OnDestroy {
  approved: any = [];
  approvedById:any = {};
  today:string=""
  isDetail:boolean =false
  user: any
  isManagementBoard:boolean = false
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private shared: SharedService
  ) { }

  ngOnInit(): void {
    this.isManagementBoard = this.authService.isManagementBoard()
    this.today = this.shared.getDMY()
    const subscription1 = this.apiService.getAllRequestSlip().subscribe({
      next: (response) => {
        this.approved =this.groupRequestSlip(response)
        console.log("app",response)
      },
      error: (error) => {
        console.log('error!', error);
      }
    });
    this.subscriptions.push(subscription1);
      const userId = Number(this.authService.getIdUser());
     this.apiService.getOneUser(userId.toString()).subscribe(res => {
      this.user = res;
    })
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
chiTiet(id: number) {
  this.isDetail = true;

  const item = this.approved.find((x:any) => x.REQUEST_SLIP_ID == id);
  this.approvedById = item

  this.router.navigate(['/approved'], {
    state: { detail: item }
  });
}

  groupRequestSlip = (rows: any[]) => {
  const map: any = {};

  rows.forEach((row: any) => {
    const slipId: any = row.REQUEST_SLIP_ID;

    if (!map[slipId]) {
      map[slipId] = {
        REQUEST_SLIP_ID: row.REQUEST_SLIP_ID,
        REQUEST_SLIP_Name: row.REQUEST_SLIP_Name,
        REQUEST_SLIP_RequestDate: row.REQUEST_SLIP_RequestDate,
        REQUEST_SLIP_Status: row.REQUEST_SLIP_Status,
        REQUEST_SLIP_Description: row.REQUEST_SLIP_Description,
        REQUEST_SLIP_ApproveNotes: row.REQUEST_SLIP_ApproveNotes,
        REQUESTER_ID: row.REQUESTER_ID,
        APPROVER_ID: row.APPROVER_ID,
        USER_FullName: row.USER_FullName,
        items: []
      };
    }

    if (row.REQUEST_ITEM_ID) {
      map[slipId].items.push({
        REQUEST_ITEM_ID: row.REQUEST_ITEM_ID,
        EQUIPMENT_ITEM_Name: row.EQUIPMENT_ITEM_Name,
        EQUIPMENT_ITEM_Description: row.EQUIPMENT_ITEM_Description,
        EQUIPMENT_TYPE_Name: row.EQUIPMENT_TYPE_Name,
        EQUIPMENT_ITEM_Status: row.EQUIPMENT_ITEM_Status,
        REQUEST_ITEM_Status: row.REQUEST_ITEM_Status
      });
    }
  });

  return Object.values(map);
};
duyet(){
    this.apiService.approvedSlip(this.approvedById).subscribe({
      next: () => {
         this.reloadCurrentPage() 
      },
      error: (err) => {
        console.error(err);
        alert('Lỗi phê duyệt');
      }
    });
}

}
