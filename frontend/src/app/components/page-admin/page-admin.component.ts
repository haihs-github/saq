import { Component, OnInit, OnDestroy } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { UserComponent } from '../user/user.component';
import { SearchComponent } from '../search/search.component';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { SharedService } from '../../services/shared.service';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-page-admin',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, UserComponent, SearchComponent, CommonModule,RouterLink,RouterOutlet,NavbarComponent],
  templateUrl: './page-admin.component.html',
  styleUrls: ['./page-admin.component.css']
})
export class PageAdminComponent implements OnInit, OnDestroy {
  equipment: any = [];
  room: any = [];
  private subscriptions: Subscription[] = [];

  constructor(
    private apiService: ApiService,
    private shared: SharedService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.apiService.getEquipment().subscribe({
      next: (response) => {
        this.equipment = response;
        console.log(response)
      },
      error: (error) => {
        console.log('Error!', error);
      }
    });
    this.apiService.getRoom().subscribe({
      next: (response) => {
        this.room = response;
        console.log(response)
      },
      error: (error) => {
        console.log('Error!', error);
      }
    });

    const subscription = this.shared.getSearch.subscribe(data => {
      this.equipment = data;
      console.log(data)

    });
    this.subscriptions.push(subscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  capnhat(id: string, type: string) {
     const typeEquipment =type
    this.shared.setId(id,typeEquipment);
  }

  themmoi(typeEquipment:string) {
    this.shared.setId('0',typeEquipment);
  }

  reloadCurrentPage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  xoa(id: string, type:string) {
    const payload ={
      id:id,
      type:type
    }
    console.log(payload)
    alert("Xác nhận xóa");
    this.apiService.deleteEquipment(payload).subscribe({
      next: (response) => {
        this.reloadCurrentPage();
      },
      error: (error) => {
        console.log('Error!', error);
      }
    });
  }
    formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}
