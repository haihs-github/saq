import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { UserComponent } from '../user/user.component';
import { ThongBaoComponent } from '../thong-bao/thong-bao.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SharedService } from '../../services/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-request',
  standalone: true,
  imports: [HeaderComponent,FooterComponent,UserComponent,FormsModule,NavbarComponent,CommonModule],
  templateUrl: './page-request.component.html',
  styleUrl: './page-request.component.css'
})
export class PageRequestComponent implements OnInit {
  equipments: any;
  user: any;
  requestSlipType: boolean =false
  REQUEST_SLIP_Type: string =""
  REQUEST_SLIP_Name: string =""
  REQUEST_SLIP_Note: string =""
  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private shared: SharedService,  private router: Router
    ) {}
  ngOnInit(): void {
    const userId = Number(this.authService.getIdUser());
    this.apiService.getOneUser(userId.toString()).subscribe(res => {
      this.user = res;
    })
    this.apiService.getEquipment().subscribe({
      next: (response) => {
        this.equipments = response.filter(
          (item: any) => item.EQUIPMENT_ITEM_Status !== 'Có sẵn' && item.EQUIPMENT_ITEM_Status !== 'Đang mượn' 
        );

        console.log(this.equipments);
      },
      error: (error) => {
        console.log('Error!', error);
      }
    });


    this.shared.getSearch.subscribe(data => {
      this.equipments = data;
    });
  }
    layDanhSachThietBiDangTick() {
      this.requestSlipType = true
      this.shared.setTypeAction("create_request_slip")
      const danhSach = this.equipments.filter((x: any) => x.checked === true);

      // if (danhSach.length === 0) {
      //   alert('Vui lòng chọn ít nhất 1 thiết bị');
      //   this.requestSlipType = false
      //   return;
      // }
      this.equipments=danhSach

      // this.shared.setThietBi(danhSach);
      // this.router.navigate(['/muon']);
  }
  themHang() {
  const newRow = {
    EQUIPMENT_ITEM_Name: '',
    EQUIPMENT_ITEM_Description: '',
    EQUIPMENT_TYPE_Name: '',
    EQUIPMENT_ITEM_Status: 'Thêm mới',
    REQUEST_ITEM_Status: ''
  };

  this.equipments.push(newRow);
}
xoaHang(index: number) {
  this.equipments.splice(index, 1);
}

  request(){
    if(
      this.REQUEST_SLIP_Name !== "" &&
      this.REQUEST_SLIP_Note !== ""
    ){

      const requestSlip ={
        REQUEST_SLIP_Name: this.REQUEST_SLIP_Name,
        REQUEST_SLIP_Note: this.REQUEST_SLIP_Note,
        USER_ID:this.user.ID,
        items:this.equipments
      }
       this.apiService.createrequestSlip(requestSlip).subscribe({
      next: () => {
        this.router.navigate(['/approved']);
      },
      error: (err) => {
        console.error(err);
        alert('Lỗi tạo phiếu');
      }
    });
      console.log(requestSlip)
    }else {
      alert("Kiểm tra lại thông tin")
    }
    
  }

}
