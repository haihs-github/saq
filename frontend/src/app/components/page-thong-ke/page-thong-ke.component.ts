import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { UserComponent } from '../user/user.component';
import { SearchThongKeComponent } from '../search-thong-ke/search-thong-ke.component';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../services/shared.service';
import { ExcelService } from '../../services/excel.service';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-page-thong-ke',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, UserComponent, FormsModule, CommonModule,NavbarComponent],
  templateUrl: './page-thong-ke.component.html',
  styleUrls: ['./page-thong-ke.component.css']
})
export class PageThongKeComponent implements OnInit {
  lichSu: any = []; 
  thietBi: any = [];
  nguoiDung: any = [];
  hetHan: any = [];
  BorrowReturnItem: any =[]
  BorrowReturnSlip: any =[]
  startDate: string = '';
  endDate: string = '';
  filteredItems: any;
    isDetail:boolean =false
  thongke: any={}

  constructor(private apiService: ApiService, private shared: SharedService, private excelService: ExcelService,  private router: Router,) { }

ngOnInit(): void {
  this.apiService.getBorrowReturnItem().subscribe({
    next: (response) => {
      this.BorrowReturnItem = response;
      console.log(response)

      this.BorrowReturnSlip = this.BorrowReturnItem.reduce(
        (acc: any[], curr: any) => {

          let slip = acc.find(
            x => x.BORROW_RETURN_SLIP_ID === curr.BORROW_RETURN_SLIP_ID
          );

          if (!slip) {
            slip = {
              BORROW_RETURN_SLIP_ID: curr.BORROW_RETURN_SLIP_ID,
              BORROW_RETURN_SLIP_Name: curr.BORROW_RETURN_SLIP_Name,
              BORROW_RETURN_SLIP_Notes: curr.BORROW_RETURN_SLIP_Notes,
              BORROW_RETURN_SLIP_Status: curr.BORROW_RETURN_SLIP_Status,
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
            EQUIPMENT_ITEM_Description: curr.EQUIPMENT_ITEM_Description,
            ROOM_Name: curr.ROOM_Name,
            ROOM_Description: curr.ROOM_Description,
            ROOM_TYPE_Name: curr.ROOM_TYPE_Name,
            ROOM_Status: curr.ROOM_Status
          });

          return acc;
        },
        []
      );

      console.log('BorrowReturnSlip:', this.BorrowReturnSlip);
    },
    error: (error) => {
      console.log('Error!', error);
    }
  });

  // user
  this.apiService.getAllUser().subscribe({
    next: (response) => {
      this.nguoiDung = response;
    },
    error: (error) => {
      console.log('Error!', error);
    }
  });

  this.shared.getSearch.subscribe(data => {
    this.lichSu = data;
  });
}

  onSearch() {
    this.BorrowReturnSlip = this.BorrowReturnSlip.filter(
      (item: any) =>
        (this.startDate
          ? new Date(item?.DATE_BorrowDate) >= new Date(this.startDate)
          : true) &&
        (this.endDate
          ? new Date(item?.DATE_BorrowDate) <= new Date(this.endDate)
          : true)
    );

    // this.shared.setSearch(this.filteredItems);
  }
 


exportToExcel() {
  const dataExport = this.BorrowReturnItem.map((item: any, index: number) => {
    const {
      USER_ID,
      USER_UserName,
      USER_Role,
      BORROW_RETURN_ITEM_ID,
      EQUIPMENT_ITEM_ID,
      EQUIPMENT_ITEM_Status,
      ROOM_ID,
      ROOM_Status,
      ...rest
    } = item;

    // STT ở cột 1
    return {
      STT: index + 1,
      ...rest
    };
  });

  this.excelService.exportAsExcelFile(dataExport, 'Data');
}
chiTiet(id:string){
    this.isDetail = true;
    const item = this.BorrowReturnSlip.find((x:any) => x.BORROW_RETURN_SLIP_ID == id);
  this.thongke = item
  console.log(item)

  this.router.navigate(['/thong-ke-bao-cao'], {
    state: { detail: item }
  });
}


}
