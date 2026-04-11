import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { UserComponent } from '../user/user.component';
import { SearchComponent } from '../search/search.component';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-thiet-bi',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, UserComponent, SearchComponent, CommonModule, RouterModule, NavbarComponent,FormsModule ],
  templateUrl: './page-thiet-bi.component.html',
  styleUrls: ['./page-thiet-bi.component.css']
})
export class PageThietBiComponent implements OnInit, OnDestroy {
  thietBi: any[] = [];
  checkBox: boolean = false
  private subscription: Subscription | undefined;

  constructor(private apiService: ApiService, private shared: SharedService,  private router: Router) { }

  ngOnInit(): void {
    this.subscription = this.apiService.getEquipment().subscribe({
      next: (response) => {
        this.thietBi = response;
        console.log(response)
      },
      error: (error) => {
        console.log('Error!', error);
      }
    });

    this.shared.getSearch.subscribe(data => {
      this.thietBi = data;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  muonThietBi(id: string): void {
    const typeEquipment ="equipment"
    this.shared.setId(id,typeEquipment);
  }
  layDanhSachThietBiDangTick() {
    this.shared.setTypeAction("create_equipment_slip")
    const danhSach = this.thietBi.filter(x => x.checked === true);

    if (danhSach.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thiết bị');
      return;
    }

    this.shared.setThietBi(danhSach);
    this.router.navigate(['/muon']);
  }

}
