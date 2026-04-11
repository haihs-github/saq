import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { UserComponent } from '../user/user.component';
import { SharedService } from '../../services/shared.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { combineLatest, Subscription } from 'rxjs';

interface Equipment {
  EQUIPMENT_ITEM_Description?: string;
  EQUIPMENT_ITEM_Name?: string;
  ROOM_Name?: string;
  EQUIPMENT_ITEM_Price?: number;
  EQUIPMENT_ITEM_PurchaseDate?: string; 
  EQUIPMENT_ITEM_Quantity?: number;
  EQUIPMENT_ITEM_Status?: string;
  EQUIPMENT_MODEL_Branch?: string;
  EQUIPMENT_MODEL_Name?: string;
  EQUIPMENT_TYPE_Description?: string;
  EQUIPMENT_TYPE_Name?: string;
  BORROW_RETURN_SLIP_Status?: string;
  ID?: number | null;
}
@Component({
  selector: 'app-page-muon',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, UserComponent, FormsModule, CommonModule,NavbarComponent],
  templateUrl: './page-muon.component.html',
  styleUrls: ['./page-muon.component.css']
})
export class PageMuonComponent implements OnInit, OnDestroy {
  user: any ;
  equipments: any[] = [];
  BORROW_RETURN_SLIP_Name: string=""
  StartDate:string[]=[]
  EndDate:string[]=[]
  BorrowReturnItem: any =[]
BorrowReturnSlipAll: any[] = [];
BorrowReturnSlip: any[] = [];
type:string =""

  selectedSlipId!: number;
  BorrowReturnSlipDetailId: boolean =false;


  Note: string=""
  today!: string;

  ngayMuon: string = '';
  tietMuon: string = '';
  tietTra: string = '';
  soLuong: string = '';

  select: any;
  isPhong: boolean = true;

  private subscriptions: Subscription[] = []; 

  constructor(
    private shared: SharedService,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

ngOnInit(): void {

  const userId = Number(this.authService.getIdUser());

  const sub = combineLatest([
    this.apiService.getBorrowReturnItem(),
    this.shared.getBorrowReturnSlipDetailId,
    this.shared.getTypeAction
  ]).subscribe({
    next: ([response, slipId,type]) => {
      if(type){
        this.type =type
      }
      console.log(slipId)


      const items = Array.isArray(response)
        ? response
        : response?.data ?? [];

      this.BorrowReturnSlipAll = items.reduce(
        (acc: any[], curr: any) => {

          if (Number(curr.USER_ID) !== userId) return acc;

          let slip = acc.find(
            x => x.BORROW_RETURN_SLIP_ID === curr.BORROW_RETURN_SLIP_ID
          );

          if (!slip) {
            slip = {
              BORROW_RETURN_SLIP_ID: curr.BORROW_RETURN_SLIP_ID,
              BORROW_RETURN_SLIP_Name: curr.BORROW_RETURN_SLIP_Name,
              BORROW_RETURN_SLIP_Notes: curr.BORROW_RETURN_SLIP_Notes,
              BORROW_RETURN_SLIP_Status: curr.BORROW_RETURN_SLIP_Status,

              USER_ID: curr.USER_ID,
              USER_FullName: curr.USER_FullName,
              USER_UserName: curr.USER_UserName,
              USER_Role: curr.USER_Role,

              DATE_BorrowDate: curr.DATE_BorrowDate,
              DATE_ExceptionReturnDate: curr.DATE_ExceptionReturnDate,
              DATE_ActualReturnDate: curr.DATE_ActualReturnDate,

              items: []
            };
            acc.push(slip);
          }

          slip.items.push({
            BORROW_RETURN_ITEM_ID: curr.BORROW_RETURN_ITEM_ID,
            EQUIPMENT_ITEM_ID: curr.EQUIPMENT_ITEM_ID,
            EQUIPMENT_ITEM_Name: curr.EQUIPMENT_ITEM_Name,
            EQUIPMENT_ITEM_Status: curr.EQUIPMENT_ITEM_Status,
            EQUIPMENT_MODEL_Name: curr.EQUIPMENT_MODEL_Name,
            EQUIPMENT_TYPE_Name: curr.EQUIPMENT_TYPE_Name,
            EQUIPMENT_ITEM_Description:curr.EQUIPMENT_ITEM_Description,
            ROOM_ID: curr.ROOM_ID,
            ROOM_Name: curr.ROOM_Name,
            ROOM_Status: curr.ROOM_Status,
            ROOM_Capacity: curr.ROOM_Capacity,
            ROOM_Description: curr.ROOM_Description,
            LOCATION_Building: curr.LOCATION_Building,
            LOCATION_Floor: curr.LOCATION_Floor
          });

          return acc;
        },
        []
      );

      if (slipId) {
        const id = Number(slipId);
        this.BorrowReturnSlip = this.BorrowReturnSlipAll.filter(
          s => s.BORROW_RETURN_SLIP_ID === id
        );
      } else {
        this.BorrowReturnSlip = [...this.BorrowReturnSlipAll];
      }

      console.log('ALL:', this.BorrowReturnSlipAll);
      console.log('VIEW:', this.BorrowReturnSlip);
    },
    error: err => console.error(err)
  });

  this.subscriptions.push(sub);

  // ===== user =====
  this.subscriptions.push(
    this.apiService.getOneUser(userId.toString()).subscribe(res => {
      this.user = res;
      console.log(res)
    })
  );

  // ===== thiết bị =====
  this.subscriptions.push(
    this.shared.getThietBi.subscribe(tb => this.equipments = tb)
  );

  this.today = this.shared.getDMY();

}


  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  create() {
  const [tietTra, ngayTra] =
    this.shared.tinhNgayTra(
      Number(this.tietMuon) + Number(this.tietTra),
      this.ngayMuon
    );

  const StartDate = [this.tietMuon, this.ngayMuon];
  const EndDate = [tietTra, ngayTra];

  if (
    this.tietMuon !== "" &&
    this.tietTra !== "" &&
    this.ngayMuon !== "" &&
    this.BORROW_RETURN_SLIP_Name !== ""
  ) {
    
    const payload = {
      equipments: this.equipments,
      BORROW_RETURN_SLIP_Name: this.BORROW_RETURN_SLIP_Name,
      Note: this.Note,
      StartDate: StartDate,
      EndDate: EndDate,
      USER:this.user
    };
    console.log('Payload gửi API:', payload);
    
    this.apiService.createBorrowReturnSlip(payload).subscribe({
      next: () => {
        this.router.navigate(['/dang-ky']);
      },
      error: (err) => {
        console.error(err);
        alert('Lỗi tạo phiếu');
      }
    });
  } else {
    alert("Kiểm tra lại thông tin");
  }
}
traThietbi() {
  // 👉 Lấy thời gian hiện tại theo giờ Việt Nam (UTC+7)
  const nowVN = new Date();
  nowVN.setHours(nowVN.getHours() + 7);
  const now = nowVN.toISOString();

  // 👉 Gán ngày trả cho những slip chưa có
  this.BorrowReturnSlip = this.BorrowReturnSlip.map(item => ({
    ...item,
    DATE_ActualReturnDate: item.DATE_ActualReturnDate ?? now
  }));

  console.log('BorrowReturnSlip:', this.BorrowReturnSlip);

  this.apiService.borrowReturnSlip(this.BorrowReturnSlip).subscribe({
    next: () => this.router.navigate(['/dang-ky']),
    error: err => {
      console.error(err);
      alert('Lỗi trả thiết bị');
    }
  });
}
daTra(){
this.router.navigate(['/dang-ky'])
}


}
