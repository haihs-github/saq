-- =======================================
-- Thiết lập UTF-8 để chạy trên Docker MySQL
-- =======================================
CREATE DATABASE IF NOT EXISTS datn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE datn;

SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
SET character_set_connection=utf8mb4;

-- =========================
-- Database: QUAN_LY_THIET_BI
-- =========================

-- =======================================
-- 1. BẢNG USER
-- =======================================
CREATE TABLE USER (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    USER_FullName VARCHAR(100),
    USER_Email VARCHAR(255),
    USER_PhoneNumber VARCHAR(255),
    USER_UserName VARCHAR(255),
    USER_Password VARCHAR(255),
    USER_Role VARCHAR(255),
    USER_Status VARCHAR(255)
);

-- =======================================
-- 2. BẢNG EQUIPMENT_TYPE
-- =======================================
CREATE TABLE EQUIPMENT_TYPE (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EQUIPMENT_TYPE_Name VARCHAR(255),
    EQUIPMENT_TYPE_Description VARCHAR(255)
);

-- =======================================
-- 3. BẢNG EQUIPMENT_MODEL
-- =======================================
CREATE TABLE EQUIPMENT_MODEL (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EQUIPMENT_MODEL_Name VARCHAR(255),
    EQUIPMENT_MODEL_Branch VARCHAR(255),
    EQUIPMENT_TYPE_ID INT,
    FOREIGN KEY (EQUIPMENT_TYPE_ID) REFERENCES EQUIPMENT_TYPE(ID)
);

-- =======================================
-- 4. BẢNG EQUIPMENT_ITEM
-- =======================================
CREATE TABLE EQUIPMENT_ITEM (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EQUIPMENT_ITEM_Name VARCHAR(255),
    EQUIPMENT_ITEM_PurchaseDate DATE,
    EQUIPMENT_ITEM_Price INT,
    EQUIPMENT_ITEM_Quantity INT,
    EQUIPMENT_ITEM_Description VARCHAR(255),
    EQUIPMENT_ITEM_Status VARCHAR(255),
    EQUIPMENT_MODEL_ID INT,
    FOREIGN KEY (EQUIPMENT_MODEL_ID) REFERENCES EQUIPMENT_MODEL(ID)
);

-- =======================================
-- 5. BẢNG ROOM_TYPE
-- =======================================
CREATE TABLE ROOM_TYPE (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ROOM_TYPE_Name VARCHAR(255),
    ROOM_TYPE_Description VARCHAR(255)
);

-- =======================================
-- 6. BẢNG ROOM
-- =======================================
CREATE TABLE ROOM (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    ROOM_Name VARCHAR(255),
    ROOM_Capacity INT,
    ROOM_Description VARCHAR(255),
    ROOM_Status VARCHAR(255),
    ROOM_TYPE_ID INT,
    LOCATION_Building VARCHAR(255),
    LOCATION_Floor INT,
    FOREIGN KEY (ROOM_TYPE_ID) REFERENCES ROOM_TYPE(ID)
);

-- =======================================
-- 7. BẢNG BORROW_RETURN_SLIP
-- =======================================
CREATE TABLE BORROW_RETURN_SLIP (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    BORROW_RETURN_SLIP_Status VARCHAR(255),
    BORROW_RETURN_SLIP_Name VARCHAR(255),
    BORROW_RETURN_SLIP_Notes VARCHAR(255),
    USER_ID INT,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID)
);

-- =======================================
-- 8. BẢNG BORROW_RETURN_DATE
-- =======================================
CREATE TABLE BORROW_RETURN_DATE (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    DATE_BorrowDate DATETIME,
    DATE_ExceptionReturnDate DATETIME,
    DATE_ActualReturnDate DATETIME,
    BORROW_RETURN_SLIP_ID INT,
    FOREIGN KEY (BORROW_RETURN_SLIP_ID) REFERENCES BORROW_RETURN_SLIP(ID)
);

-- =======================================
-- 9. BẢNG BORROW_RETURN_ITEM
-- =======================================
CREATE TABLE BORROW_RETURN_ITEM (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EQUIPMENT_ITEM_ID INT,
    ROOM_ID INT,
    BORROW_RETURN_SLIP_ID INT,
    FOREIGN KEY (EQUIPMENT_ITEM_ID) REFERENCES EQUIPMENT_ITEM(ID),
    FOREIGN KEY (ROOM_ID) REFERENCES ROOM(ID),
    FOREIGN KEY (BORROW_RETURN_SLIP_ID) REFERENCES BORROW_RETURN_SLIP(ID)
);

-- =======================================
-- 10. BẢNG REQUEST_SLIP
-- =======================================
CREATE TABLE REQUEST_SLIP (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    REQUEST_SLIP_Name VARCHAR(255),
    REQUEST_SLIP_RequestDate DATETIME,
    REQUEST_SLIP_Status VARCHAR(255),
    REQUEST_SLIP_Description VARCHAR(255),
    REQUEST_SLIP_ApproveNotes VARCHAR(255),
    REQUESTER_ID INT,
    APPROVER_ID INT,
    FOREIGN KEY (REQUESTER_ID) REFERENCES USER(ID),
    FOREIGN KEY (APPROVER_ID) REFERENCES USER(ID)
);

-- =======================================
-- 11. BẢNG REQUEST_ITEM
-- =======================================
CREATE TABLE REQUEST_ITEM (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    REQUEST_SLIP_ID INT,
    EQUIPMENT_ITEM_Name  VARCHAR(255),
    EQUIPMENT_ITEM_Description  VARCHAR(255),
    EQUIPMENT_TYPE_Name  VARCHAR(255),
    EQUIPMENT_ITEM_Status  VARCHAR(255),
    REQUEST_ITEM_Status  VARCHAR(255),
    EQUIPMENT_ITEM_ID INT,
    FOREIGN KEY (EQUIPMENT_ITEM_ID) REFERENCES EQUIPMENT_ITEM(ID),
    FOREIGN KEY (REQUEST_SLIP_ID) REFERENCES REQUEST_SLIP(ID)
);

-- =======================================
-- Dữ liệu mẫu
-- =======================================

-- 1. USER
INSERT INTO USER (USER_FullName, USER_Email, USER_PhoneNumber, USER_UserName, USER_Password, USER_Role, USER_Status)
VALUES
('Nguyễn Văn Tuấn', 'guyenvantuan22@gmail.com', '0901234567', 'nguyenvantuan', '123456', 'Giáo viên', 'Active'),
('Lê Đình Hưng', 'ledinhhung23@gmail.com', '0902345678', 'ledinhhung', '123456', 'Ban giám hiệu', 'Active'),
('Lương Văn Luyện', 'luongvanluyen2003@gmail.com', '0903456789', 'luongvanluyen', '123456', 'Ban quản lý', 'Active');

-- 2. EQUIPMENT_TYPE
INSERT INTO EQUIPMENT_TYPE (EQUIPMENT_TYPE_Name, EQUIPMENT_TYPE_Description)
VALUES
('Projector', 'Máy chiếu phục vụ giảng dạy'),
('Laptop', 'Máy tính xách tay'),
('Speaker', 'Loa thuyết trình');

-- 3. EQUIPMENT_MODEL
INSERT INTO EQUIPMENT_MODEL (EQUIPMENT_MODEL_Name, EQUIPMENT_MODEL_Branch, EQUIPMENT_TYPE_ID)
VALUES
('Epson X200', 'Epson', 1),
('Dell Inspiron 15', 'Dell', 2),
('JBL Conference', 'JBL', 3);

-- 4. EQUIPMENT_ITEM
INSERT INTO EQUIPMENT_ITEM (EQUIPMENT_ITEM_Name, EQUIPMENT_ITEM_PurchaseDate, EQUIPMENT_ITEM_Price, EQUIPMENT_ITEM_Quantity,EQUIPMENT_ITEM_Description, EQUIPMENT_ITEM_Status, EQUIPMENT_MODEL_ID)
VALUES
('EPX200-001', '2024-01-10', 12000000,1,'Máy chiếu dùng cho phòng học 1', 'Có sẵn', 1),
('EPX200-002', '2024-01-10', 12000000,1,'Máy chiếu dùng cho phòng học 2', 'Có sẵn', 1),
('EPX200-003', '2024-01-10', 12000000,1,'Máy chiếu dùng cho phòng học 3', 'Có sẵn', 1),
('DL15-001', '2023-10-01', 15000000,1,'Laptop cho giảng viên 1', 'Có sẵn', 2),
('DL15-002', '2023-10-01', 15000000,1,'Laptop cho giảng viên 2', 'Có sẵn', 2),
('JBL-SP-001', '2024-03-05', 5000000,1, 'Loa phòng họp 1', 'Có sẵn', 3),
('JBL-SP-002', '2024-03-05', 5000000,1,'Loa phòng họp 2', 'Có sẵn', 3);

-- 5. ROOM_TYPE
INSERT INTO ROOM_TYPE (ROOM_TYPE_Name, ROOM_TYPE_Description)
VALUES
('Classroom', 'Phòng học tiêu chuẩn'),
('Lab', 'Phòng thực hành'),
('Conference', 'Phòng họp');

-- 7. ROOM
INSERT INTO ROOM (ROOM_Name, ROOM_Capacity, ROOM_Description, ROOM_Status, ROOM_TYPE_ID, LOCATION_Building, LOCATION_Floor)
VALUES
('A101', 40, 'Phòng học lớn', 'Có sẵn', 1,'A',1),
('B201', 25, 'Phòng Lab máy tính', 'Có sẵn', 2,'B',2),
('C01', 12, 'Phòng họp nhỏ', 'Có sẵn', 3,'C',3);
