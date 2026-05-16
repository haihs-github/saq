# KẾ HOẠCH PHẠM VI KIỂM THỬ HỆ THỐNG (SYSTEM TEST SCOPE) — V2

**Dự án:** Hệ thống Quản lý Thiết bị (QLTB)  
**Giai đoạn:** System Testing  
**Ngày lập:** 10/05/2026  
**Người lập:** SQA Expert  

---

## TỔNG QUAN NGHIỆP VỤ

Hệ thống QLTB phục vụ quản lý thiết bị dạy học tại trường học, với các luồng nghiệp vụ chính:

| Luồng nghiệp vụ | Người thực hiện | Mô tả |
|-----------------|-----------------|-------|
| Đăng nhập & Phân quyền | Tất cả | Xác thực danh tính, cấp quyền truy cập theo vai trò |
| Quản lý thiết bị & phòng | Ban quản lý | Thêm, sửa, xóa thiết bị và phòng học trong hệ thống |
| Mượn thiết bị | Giáo viên | Đăng ký mượn thiết bị/phòng để phục vụ giảng dạy |
| Trả thiết bị | Giáo viên / Ban quản lý | Xác nhận trả thiết bị, cập nhật trạng thái sẵn sàng |
| Đề xuất yêu cầu | Giáo viên | Gửi phiếu đề xuất mua mới/bổ sung thiết bị |
| Phê duyệt yêu cầu | Ban giám hiệu / Ban quản lý | Xem xét và duyệt/từ chối phiếu đề xuất |
| Thống kê & Báo cáo | Ban quản lý / Ban giám hiệu | Theo dõi lịch sử mượn/trả, xuất báo cáo |

---

## BẢNG 1: CHỨC NĂNG CẦN KIỂM THỬ — YÊU CẦU CHỨC NĂNG

| # | Tên Function/Feature | Nhóm Chức Năng | Lý Do Cần Kiểm Thử | Kỹ Thuật Black-box | Lý Do Chọn Kỹ Thuật |
|---|----------------------|----------------|---------------------|-------------------|----------------------|
| 1 | Đăng nhập hệ thống | Xác thực & Phân quyền | Đây là cổng vào duy nhất của toàn bộ hệ thống. Nếu đăng nhập sai — cho phép người không có quyền vào, hoặc chặn người hợp lệ — toàn bộ quy trình nghiệp vụ bị tê liệt. Đặc biệt, tài khoản bị khóa (Inactive) phải bị chặn để bảo vệ dữ liệu nhà trường. | Phân lớp tương đương | Có thể phân rõ các lớp: thông tin đúng/sai, tài khoản Active/Inactive, trường rỗng — mỗi lớp đại diện cho một nhóm hành vi khác nhau của hệ thống |
| 2 | Kiểm soát truy cập theo vai trò (Role-based Access) | Xác thực & Phân quyền | Hệ thống có 4 vai trò với quyền hạn khác nhau (Giáo viên, Ban quản lý, Ban giám hiệu, Admin). Nếu phân quyền sai, giáo viên có thể xóa thiết bị hoặc phê duyệt phiếu — gây hậu quả nghiêm trọng cho dữ liệu nhà trường. | Bảng quyết định | Cần kiểm tra tổ hợp giữa từng vai trò và từng chức năng (được phép / bị chặn), bảng quyết định mô hình hóa chính xác ma trận quyền này |
| 3 | Thêm mới thiết bị | Quản lý Thiết bị | Thiết bị là tài sản của nhà trường. Thêm sai thông tin (tên, giá, số lượng, ngày mua) dẫn đến sổ sách không khớp thực tế, gây khó khăn cho kiểm kê và thanh lý tài sản. | Phân lớp tương đương | Mỗi trường nhập liệu có các lớp hợp lệ/không hợp lệ rõ ràng (tên rỗng/có giá trị, giá âm/dương, số lượng 0/dương), phân lớp tương đương bao phủ hiệu quả |
| 4 | Cập nhật thông tin thiết bị | Quản lý Thiết bị | Thông tin thiết bị thay đổi theo thời gian (giá trị, trạng thái, hãng sản xuất). Cập nhật sai có thể làm mất lịch sử tài sản hoặc hiển thị trạng thái không đúng thực tế cho giáo viên khi đăng ký mượn. | Bảng quyết định | Cập nhật thiết bị và phòng học dùng chung một luồng, phân nhánh theo loại đối tượng. Bảng quyết định kiểm tra các tổ hợp: loại đối tượng × trạng thái × field bắt buộc |
| 5 | Xóa thiết bị khỏi hệ thống | Quản lý Thiết bị | Xóa thiết bị đang được mượn hoặc đang trong phiếu đề xuất có thể gây mất liên kết dữ liệu, khiến lịch sử mượn/trả không còn đầy đủ — ảnh hưởng đến công tác kiểm toán tài sản. | Phân lớp tương đương | Phân lớp theo trạng thái thiết bị: đang mượn / có sẵn / bảo trì / hỏng — mỗi lớp cần hành vi xóa khác nhau |
| 6 | Thêm mới phòng học | Quản lý Phòng Học | Phòng học là tài nguyên dùng chung. Thêm sai thông tin (tòa, tầng, sức chứa) khiến giáo viên đăng ký nhầm phòng, gây xung đột lịch sử dụng phòng trong nhà trường. | Phân lớp tương đương | Các trường như Tòa, Tầng, Số ghế có lớp hợp lệ/không hợp lệ rõ ràng; phân lớp tương đương bao phủ đủ các trường hợp biên và ngoại lệ |
| 7 | Cập nhật thông tin phòng học | Quản lý Phòng Học | Trạng thái phòng (Có sẵn / Đang sử dụng / Bảo trì) ảnh hưởng trực tiếp đến khả năng đăng ký mượn của giáo viên. Cập nhật sai trạng thái có thể khóa phòng đang trống hoặc cho mượn phòng đang bảo trì. | Biểu đồ chuyển trạng thái | Phòng học có vòng đời trạng thái rõ ràng: Có sẵn → Đang mượn → Có sẵn / Bảo trì → Có sẵn. Biểu đồ chuyển trạng thái kiểm tra đầy đủ các chuyển tiếp hợp lệ và không hợp lệ |
| 8 | Xóa phòng học | Quản lý Phòng Học | Xóa phòng đang có lịch mượn trong tương lai hoặc đang được sử dụng gây mất dữ liệu lịch sử và ảnh hưởng đến kế hoạch giảng dạy đã được lên lịch. | Phân lớp tương đương | Phân lớp theo trạng thái phòng: đang mượn / có sẵn / bảo trì — tương tự xóa thiết bị |
| 9 | Đăng ký mượn thiết bị | Mượn/Trả Thiết bị | Đây là nghiệp vụ cốt lõi nhất của hệ thống. Mượn sai (thiết bị không có sẵn, ngày mượn quá khứ, số lượng vượt tồn kho) gây xung đột tài nguyên và ảnh hưởng trực tiếp đến hoạt động giảng dạy. | Bảng quyết định | Quyết định cho phép mượn phụ thuộc vào nhiều điều kiện đồng thời: trạng thái thiết bị × ngày mượn × người mượn × số lượng. Bảng quyết định bao phủ đầy đủ các tổ hợp này |
| 10 | Xác nhận trả thiết bị | Mượn/Trả Thiết bị | Trả thiết bị cập nhật trạng thái từ "Đang mượn" về "Có sẵn", cho phép giáo viên khác đăng ký. Nếu trả sai (nhầm phiếu, nhầm thiết bị), thiết bị bị khóa vĩnh viễn hoặc trạng thái không đồng bộ với thực tế. | Biểu đồ chuyển trạng thái | Vòng đời phiếu mượn có các trạng thái rõ ràng: Chưa trả → Đã trả. Vòng đời thiết bị: Có sẵn → Đang mượn → Có sẵn. Biểu đồ chuyển trạng thái kiểm tra tính nhất quán của cả hai vòng đời |
| 11 | Gửi phiếu đề xuất yêu cầu mua thiết bị | Đề xuất & Phê duyệt | Giáo viên dùng chức năng này để đề xuất mua mới thiết bị phục vụ giảng dạy. Phiếu thiếu thông tin hoặc gửi không thành công khiến nhu cầu thực tế của giáo viên không được ghi nhận, ảnh hưởng đến kế hoạch mua sắm của nhà trường. | Bảng quyết định | Phiếu đề xuất có nhiều điều kiện: tên phiếu × danh sách thiết bị (có/không) × ghi chú (có/không). Bảng quyết định kiểm tra các tổ hợp hợp lệ và không hợp lệ |
| 12 | Phê duyệt / Từ chối phiếu đề xuất | Đề xuất & Phê duyệt | Quyết định phê duyệt ảnh hưởng trực tiếp đến ngân sách mua sắm và kế hoạch trang bị thiết bị của nhà trường. Phê duyệt sai phiếu hoặc không cập nhật trạng thái đúng gây nhầm lẫn trong quản lý tài chính. | Biểu đồ chuyển trạng thái | Phiếu đề xuất có vòng đời: Chưa duyệt → Đã duyệt / Từ chối. Cần kiểm tra các chuyển tiếp hợp lệ, không hợp lệ và hành vi khi phê duyệt lại phiếu đã duyệt |
| 13 | Xem thống kê lịch sử mượn/trả | Thống kê & Báo cáo | Ban quản lý dùng màn hình này để theo dõi tần suất sử dụng thiết bị, phát hiện thiết bị bị mượn quá lâu và lập kế hoạch bảo trì. Dữ liệu sai hoặc thiếu dẫn đến quyết định quản lý không chính xác. | Phân lớp tương đương | Bộ lọc thời gian có các lớp: không lọc / lọc hợp lệ / startDate > endDate / khoảng rỗng. Mỗi lớp cho kết quả hiển thị khác nhau |
| 14 | Xuất báo cáo Excel | Thống kê & Báo cáo | Báo cáo Excel là tài liệu chính thức để nộp lên ban giám hiệu và cơ quan quản lý. Xuất sai dữ liệu (thiếu cột, sai số liệu, không khớp với bộ lọc) gây mất uy tín và sai lệch trong báo cáo tài sản. | Phân lớp tương đương | Phân lớp theo trạng thái dữ liệu: có dữ liệu đầy đủ / có dữ liệu sau lọc / không có dữ liệu (rỗng). Mỗi lớp cần hành vi export khác nhau |
| 15 | Quản lý tài khoản người dùng (Thêm/Sửa/Xóa) | Quản lý Người dùng | Tài khoản người dùng quyết định ai được truy cập hệ thống và với quyền gì. Tạo tài khoản trùng, sai vai trò, hoặc không thể xóa tài khoản cũ gây rủi ro bảo mật và quản lý nhân sự cho nhà trường. | Bảng quyết định | Các thao tác CRUD user phụ thuộc vào tổ hợp điều kiện: username/email trùng × vai trò × trạng thái Active/Inactive. Bảng quyết định bao phủ đầy đủ |

---

## BẢNG 2: CHỨC NĂNG CẦN KIỂM THỬ — YÊU CẦU PHI CHỨC NĂNG

| # | Tên Function/Feature | Nhóm Đặc Tính | Lý Do Cần Kiểm Thử | Kỹ Thuật Black-box | Lý Do Chọn Kỹ Thuật |
|---|----------------------|---------------|---------------------|-------------------|----------------------|
| 1 | Bảo mật đăng nhập (chống truy cập trái phép) | Bảo mật (Security) | Hệ thống quản lý tài sản nhà trường chứa thông tin nhạy cảm về thiết bị, tài chính và nhân sự. Nếu kẻ xấu đăng nhập được mà không có tài khoản hợp lệ, toàn bộ dữ liệu tài sản có thể bị xem, sửa hoặc xóa. | Phân lớp tương đương | Phân lớp các loại input tấn công: ký tự đặc biệt, chuỗi rỗng, payload bất thường — mỗi lớp đại diện cho một nhóm tấn công khác nhau |
| 2 | Bảo vệ dữ liệu theo phân quyền (API Authorization) | Bảo mật (Security) | Giáo viên không được phép xem dữ liệu quản lý thiết bị hay danh sách người dùng. Nếu API trả dữ liệu mà không kiểm tra quyền, thông tin nội bộ của nhà trường bị lộ ra ngoài. | Bảng quyết định | Kiểm tra tổ hợp: vai trò người dùng × endpoint API × kết quả trả về (được phép / bị chặn 403) |
| 3 | Hiệu năng tải danh sách thiết bị và phiếu mượn | Hiệu năng (Performance) | Giáo viên và ban quản lý thường xuyên tra cứu danh sách thiết bị và lịch sử mượn. Nếu trang tải chậm hơn 3 giây, người dùng mất kiên nhẫn và giảm hiệu quả công việc, đặc biệt trong giờ cao điểm đầu buổi học. | Phân lớp tương đương | Phân lớp theo khối lượng dữ liệu: ít bản ghi / trung bình / nhiều bản ghi — xác định ngưỡng hiệu năng chấp nhận được |
| 4 | Tính nhất quán dữ liệu khi thao tác đồng thời | Độ tin cậy (Reliability) | Nhiều giáo viên có thể cùng lúc đăng ký mượn cùng một thiết bị. Nếu hệ thống không xử lý đúng, cùng 1 thiết bị có thể được cấp cho 2 người — gây xung đột thực tế trong phòng học. | Bảng quyết định | Kiểm tra tổ hợp: số lượng request đồng thời × trạng thái thiết bị × kết quả (1 thành công / còn lại thất bại) |
| 5 | Khả năng hiển thị trên các thiết bị và trình duyệt | Tương thích (Compatibility) | Giáo viên và ban quản lý sử dụng nhiều loại thiết bị (máy tính bàn, laptop, máy tính bảng) và trình duyệt khác nhau. Giao diện vỡ hoặc nút bấm không hoạt động trên một số thiết bị khiến người dùng không thể thực hiện nghiệp vụ. | Phân lớp tương đương | Phân lớp theo môi trường: trình duyệt (Chrome/Edge/Firefox) × độ phân giải (desktop/tablet/mobile) — mỗi tổ hợp là một lớp tương đương |
| 6 | Khả năng sử dụng của luồng mượn thiết bị (Usability) | Khả năng sử dụng (Usability) | Giáo viên là người dùng chính, không nhất thiết có kỹ năng công nghệ cao. Nếu luồng mượn thiết bị phức tạp, thiếu thông báo lỗi rõ ràng hoặc không có hướng dẫn, giáo viên sẽ mượn sai hoặc bỏ qua hệ thống, quay về đăng ký thủ công. | Phân lớp tương đương | Phân lớp theo hành vi người dùng: nhập đúng lần đầu / nhập sai và sửa / bỏ trống bắt buộc — kiểm tra thông báo lỗi và hướng dẫn có đủ rõ ràng không |

---

## BẢNG 3: CHỨC NĂNG KHÔNG CẦN KIỂM THỬ

| # | Tên Function/Feature | Nhóm Chức Năng | Lý Do Không Cần Kiểm Thử |
|---|----------------------|----------------|--------------------------|
| 1 | Xem danh sách thiết bị (chỉ đọc) | Quản lý Thiết bị | Chức năng chỉ hiển thị dữ liệu, không có logic nghiệp vụ hay thao tác ghi. Tính đúng đắn của dữ liệu đã được đảm bảo bởi các test case thêm/sửa/xóa thiết bị |
| 2 | Xem chi tiết 1 thiết bị (chỉ đọc) | Quản lý Thiết bị | Tương tự xem danh sách — chỉ truy vấn và hiển thị, không có logic phân nhánh hay tác động đến dữ liệu |
| 3 | Xem danh sách phòng học (chỉ đọc) | Quản lý Phòng Học | Chức năng đọc thuần túy, không có nghiệp vụ phức tạp. Dữ liệu hiển thị đã được kiểm chứng qua test case thêm/sửa phòng |
| 4 | Xem lịch sử phiếu mượn của 1 người dùng (chỉ đọc) | Mượn/Trả Thiết bị | Chỉ lọc và hiển thị dữ liệu theo userId, không có logic nghiệp vụ. Được bao phủ gián tiếp khi test tạo phiếu mượn |
| 5 | Giao diện tĩnh: Header, Footer, Navbar | Giao diện (UI) | Thành phần giao diện tĩnh, không chứa logic nghiệp vụ. Không ảnh hưởng đến luồng xử lý dữ liệu của hệ thống |
| 6 | Trang thông báo thành công / thất bại (Toast/Alert) | Giao diện (UI) | Thành phần UI phụ trợ, được kiểm tra gián tiếp trong tất cả các test case chức năng. Không cần test độc lập |
| 7 | Cấu hình triển khai (Docker, Nginx, Cloudflare) | Infrastructure | Thuộc phạm vi kiểm thử triển khai (Deployment Testing), không phải System Testing. Đã được xác nhận hoạt động khi hệ thống chạy thành công trên môi trường production |
| 8 | Công cụ build và transpile (Babel, Angular CLI) | Build Tool | Công cụ hỗ trợ phát triển, không phải tính năng của hệ thống. Không ảnh hưởng đến nghiệp vụ người dùng |
| 9 | Xem danh sách tất cả phiếu mượn (API nội bộ) | Mượn/Trả Thiết bị | Endpoint nội bộ phục vụ màn hình thống kê, không có giao diện người dùng riêng. Được bao phủ đầy đủ trong test case Thống kê & Báo cáo |
| 10 | Xem danh sách tất cả người dùng (Admin only) | Quản lý Người dùng | Chức năng đọc đơn giản dành riêng cho Admin, không có logic nghiệp vụ phức tạp. Rủi ro thấp và được bao phủ gián tiếp qua test case quản lý tài khoản |

---

## TÓM TẮT PHÂN BỔ KỸ THUẬT

| Kỹ thuật | Số lượng áp dụng | Các module chính |
|----------|-----------------|-----------------|
| Bảng quyết định | 6 | Phân quyền, Cập nhật thiết bị, Mượn thiết bị, Gửi đề xuất, Quản lý user, Bảo mật API |
| Phân lớp tương đương | 8 | Đăng nhập, Thêm thiết bị/phòng, Xóa thiết bị/phòng, Thống kê, Export, Hiệu năng, Tương thích, Usability |
| Biểu đồ chuyển trạng thái | 3 | Cập nhật phòng học, Trả thiết bị, Phê duyệt yêu cầu |
| Kiểm thử cặp (Pairwise) | 0 | Không áp dụng — các tổ hợp đã được bao phủ đủ bởi 3 kỹ thuật trên |

---

*Tài liệu được lập dựa trên phân tích luồng nghiệp vụ hệ thống QLTB. Mọi nhận định tập trung vào tác động đến người dùng và quy trình vận hành của nhà trường.*
