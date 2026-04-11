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

@Component({
  selector: 'app-page-lab',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, UserComponent, SearchComponent, CommonModule, RouterModule,NavbarComponent],
  templateUrl: './page-lab.component.html',
  styleUrls: ['./page-lab.component.css']
})
export class PageLabComponent implements OnInit, OnDestroy {
  room: any;
  private subscriptions: Subscription[] = []; 

  constructor(private apiService: ApiService, private shared: SharedService) { }


  ngOnInit(): void {
    const subscription = this.apiService.getRoom().subscribe({
      next: (response) => {
        console.log(response)
        this.room = response;
      },
      error: (error) => {
        console.log('Error!', error);
      }
    });
    this.subscriptions.push(subscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

muonLab(id: string) {
   this.shared.setTypeAction("create_room_slip")
  const danhSach = this.room.filter((x: any) => x.ID === Number(id));
  this.shared.setThietBi(danhSach);
}
}
