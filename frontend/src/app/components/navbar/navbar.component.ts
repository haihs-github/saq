import { Component, OnInit,  } from '@angular/core';
import { RouterLink, RouterOutlet,Router, RouterLinkActive} from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink,RouterOutlet,CommonModule,RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent  implements OnInit {
  isTeacher:boolean = false
  isFacilityManager:boolean = false
  isManagementBoard:boolean = false
  nav:boolean = false
  navActive: boolean = false
  constructor(private authService: AuthService, private router: Router) { }
  logout(){
    this.authService.logout()
    this.router.navigate(['/login']) 
  }
  ngOnInit(): void {
    this.isTeacher =this.authService.isTeacher()
    this.isFacilityManager =this.authService.isFacilityManager()
    this.isManagementBoard =this.authService.isManagementBoard()
  }
  click(){
     this.nav = !this.nav
  }

}
