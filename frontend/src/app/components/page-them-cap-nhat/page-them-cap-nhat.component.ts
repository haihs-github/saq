import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { UserComponent } from '../user/user.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../services/shared.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-page-them-cap-nhat',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, UserComponent, FormsModule, CommonModule,NavbarComponent,FormsModule],
  templateUrl: './page-them-cap-nhat.component.html',
  styleUrls: ['./page-them-cap-nhat.component.css']
})
export class PageThemCapNhatComponent implements OnInit {
  equipment: any = {
  EQUIPMENT_ITEM_Name: '',
  EQUIPMENT_ITEM_Description: '',
  EQUIPMENT_ITEM_Price: 0,
  EQUIPMENT_ITEM_Quantity: 0,
  EQUIPMENT_ITEM_Status: '',
  EQUIPMENT_MODEL_Branch: '',
  EQUIPMENT_MODEL_Name: '',
  EQUIPMENT_TYPE_Description: '',
  EQUIPMENT_TYPE_Name: '',
  ID: null
};
form: any
  isEdit = false;
  isEquipment =false
  createAcc:boolean =false

  constructor(
    private shared: SharedService,
    private auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.shared.getId.subscribe(id => {
      const [realId, type] = id.split('|');
      this.isEquipment = (type === 'equipment');
      this.isEdit = (realId !== '0');


      this.api.getOneEquipment(id).subscribe(data => {
        console.log(data)
        if(data == null){
          this.equipment={}
        }else{
          this.equipment = data;
        }

        // if (this.form.EQUIPMENT_ITEM_PurchaseDate) {
        //   this.form.EQUIPMENT_ITEM_PurchaseDate =
        //     new Date(this.form.EQUIPMENT_ITEM_PurchaseDate)
        //       .toISOString()
        //       .substring(0, 10);
        // }
      });
    });

  }

  reloadCurrentPage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl])
    });
  }

  submit() {
    console.log(this.equipment)
    if (!Array.isArray(this.equipment) &&
      this.equipment?.EQUIPMENT_ITEM_Name !== "" &&
      this.equipment?.EQUIPMENT_ITEM_PurchaseDate !== "" &&
      this.equipment?.EQUIPMENT_ITEM_Price !== "" &&
      this.equipment?.EQUIPMENT_ITEM_Quantity !== "" &&
      this.equipment?.EQUIPMENT_ITEM_Status !== ""&&
      this.equipment?.EQUIPMENT_ITEM_Description !== ""&&
      this.equipment?.EQUIPMENT_MODEL_Name !== ""&&
      this.equipment?.EQUIPMENT_MODEL_Branch !== "" &&
      this.equipment?.EQUIPMENT_TYPE_Name !== "" &&
      this.equipment?.EQUIPMENT_TYPE_Description !== ""
  ) {
    // Chỉ xử lý khi KHÔNG phải là array
      if (this.isEdit) {
        this.api.updateEquipment(this.equipment).subscribe(() => {
          alert('Cập nhật thiết bị thành công');
           this.router.navigate(["/quan-ly"])
        });
      } else {
        this.api.createEquipment(this.equipment).subscribe((res) => {
          console.log(res)
          alert('Thêm thiết bị thành công');
          this.router.navigate(["/quan-ly"])
        });
      }
   }else {
    alert('Kiểm tra lại thông tin');
    this.router.navigate(["/quan-ly"])
   }
  }
}
