import { Component, OnInit,  } from '@angular/core';
import { RouterLink, RouterOutlet,Router} from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { SearchComponent } from '../search/search.component';
import { SearchThongKeComponent } from '../search-thong-ke/search-thong-ke.component';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterOutlet,RouterLink,CommonModule,SearchComponent,SearchThongKeComponent,CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  status:boolean = false
  nav:boolean = false
  constructor(private authService: AuthService, private router: Router) { }
  logout(){
    this.authService.logout()
    this.router.navigate(['/login']) 
  }
  ngOnInit(): void {
    this.status =this.authService.isAdmin()
  }
  click(){
     this.nav = !this.nav
  }
}
