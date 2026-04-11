import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { UserComponent } from '../user/user.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-page-account',
  standalone: true,
  imports: [HeaderComponent,FooterComponent,UserComponent,CommonModule,NavbarComponent,FormsModule  ],
  templateUrl: './page-account.component.html',
  styleUrl: './page-account.component.css'
})
export class PageAccountComponent {
  
   account:any
   isEdit = false;
  id!: number;

  form: any = {
    USER_FullName: '',
    USER_UserName: '',
    USER_Password: '',
    USER_Email: '',
    USER_PhoneNumber: '',
    USER_Role: 'Giáo viên',
    USER_Status: 'Active'
  };
  createAcc:boolean =false
    constructor(private apiService: ApiService,private router: Router) { }
   ngOnInit(): void {
    this.apiService.getAllUser().subscribe({
      next: (response) => {
        this.account = response;
        console.log(response)
      },
      error: (error) => {
        console.log('Error!', error);
      }
    });
  }
  themMoi(){
    this.createAcc = true
  }
  capnhat(id:string){
    this.createAcc = true
    this.isEdit = true
    console.log(this.account,id)
    this.form = this.account.find((acc:any) => acc.ID === id);
    console.log(this.form)
  }
  xoa(id:string){
     this.apiService.deleteUserById(id).subscribe(() => {
        alert('Xóa tài khoản thành công');
        this.reloadCurrentPage();
      });
  }
   reloadCurrentPage() {
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl])
    });
  }
  submit(form:any) {
     if (form.invalid) {
    alert('Vui lòng nhập đầy đủ và đúng thông tin');
    return;
  }
    if (this.isEdit) {
      this.apiService.updateUser(this.form).subscribe(() => {
        alert('Cập nhật tài khoản thành công');
        this.reloadCurrentPage();
      });
    } else {
      this.apiService.createUser(this.form).subscribe((res) => {
        console.log(res)
        alert('Tạo tài khoản thành công');
        this.reloadCurrentPage();
      });
    }
  }
}
