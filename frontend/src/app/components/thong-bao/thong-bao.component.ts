import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SharedService } from '../../services/shared.service';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-thong-bao',
  standalone: true,
  imports: [CommonModule,RouterLink,RouterOutlet],
  templateUrl: './thong-bao.component.html',
  styleUrl: './thong-bao.component.css'
})
export class ThongBaoComponent implements OnInit{
  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private shared: SharedService
  ) { }
    thongbao: any = [];
    today:string=""
 thongBaos = [
    { 
      noiDung: 'Thông báo 1: Hệ thống nghỉ lễ. Trong thời gian nghỉ lễ, các thao tác trên hệ thống sẽ bị tạm ngưng. Sinh viên cần chủ động hoàn thành các công việc còn lại trước kỳ nghỉ.', 
      ngay: '2024-02-11' 
    },
    { 
      noiDung: 'Thông báo 2: Hệ thống bảo trì vào cuối tuần. Trong thời gian bảo trì, sinh viên không thể đăng nhập để xem kết quả học tập hay đăng ký môn học. Các bạn cần hoàn tất đăng ký trước thời gian bảo trì. Ngoài ra, các hướng dẫn thao tác mới đã được cập nhật trong cẩm nang sinh viên.', 
      ngay: '2024-02-03' 
    },
    { 
      noiDung: 'Thông báo 3: Thay đổi lịch đăng ký môn học. Một số môn học sẽ được mở sớm hơn hoặc muộn hơn so với kế hoạch trước. Sinh viên cần kiểm tra kỹ thông tin trên hệ thống và liên hệ phòng đào tạo nếu có thắc mắc.', 
      ngay: '2024-02-04' 
    },
    { 
      noiDung: 'Thông báo 4: Học phí kỳ tới đã cập nhật. Sinh viên cần thanh toán đúng hạn để hệ thống xác nhận đăng ký môn học. Các hình thức thanh toán được hướng dẫn chi tiết trên website trường.', 
      ngay: '2024-02-05' 
    },
    { 
      noiDung: 'Thông báo 5: Kết quả thi giữa kỳ đã công bố. Sinh viên có thể xem kết quả trên hệ thống. Nếu có khiếu nại, vui lòng gửi email đến phòng khảo thí trước ngày 10/02/2024.', 
      ngay: '2024-02-06' 
    },
    { 
      noiDung: 'Thông báo 6: Khóa học mới đã mở. Sinh viên đăng ký tham gia theo hướng dẫn trên hệ thống. Các lớp có giới hạn số lượng học viên, ưu tiên đăng ký sớm.', 
      ngay: '2024-02-07' 
    },
    { 
      noiDung: 'Thông báo 7: Thay đổi giảng viên môn học. Một số môn học sẽ thay giảng viên do điều động nhân sự. Thông tin chi tiết đã được cập nhật trên website phòng đào tạo.', 
      ngay: '2024-02-08' 
    },
    { 
      noiDung: 'Thông báo 8: Lịch phòng thi đã được cập nhật. Sinh viên kiểm tra kỹ phòng thi và giờ thi, chuẩn bị đầy đủ giấy tờ cần thiết.', 
      ngay: '2024-02-09' 
    },
    { 
      noiDung: 'Thông báo 9: Hạn chót nộp bài tập cuối kỳ. Sinh viên cần nộp đúng hạn để được tính điểm. Các bài nộp muộn sẽ bị trừ điểm theo quy định.', 
      ngay: '2024-02-10' 
    }
  ];
ngOnInit(): void {
  this.today = this.shared.getDMY(); 

  this.apiService.getByUserBorrowReturnSlip(this.authService.getIdUser()).subscribe({
    next: (response: any[]) => {

      this.thongbao = response.filter(item => {

        const today = new Date(this.today); // 2025-12-28
        const hanTra = new Date(item.DATE_ExceptionReturnDate); // hạn trả

        return hanTra < today && item.DATE_ActualReturnDate == null;
      });

      console.log("DANH SÁCH QUÁ HẠN:", this.thongbao);
    },
    error: (error) => {
      console.log('error!', error);
    }
  });
}


}
