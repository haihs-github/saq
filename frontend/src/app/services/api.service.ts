// api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface Equipment {
  EQUIPMENT_ITEM_Description?: string;
  EQUIPMENT_ITEM_Name?: string;
  ROOM_Name?: string;
  EQUIPMENT_ITEM_Price?: number;
  EQUIPMENT_ITEM_PurchaseDate?: string; 
  EQUIPMENT_ITEM_Quantity?: number;
  EQUIPMENT_ITEM_Status?: string;
  EQUIPMENT_MODEL_Branch?: string;
  EQUIPMENT_MODEL_Name?: string;
  EQUIPMENT_TYPE_Description?: string;
  EQUIPMENT_TYPE_Name?: string;
  Note?: string; 
  StartDate?: string; 
  EndDate?: string; 
  ID?: number | null;
}
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private API = environment.apiUrl;

  constructor(private http: HttpClient) {
   
  }

  getOneUser(id:string): Observable<any> {
    return this.http.get(`${this.API}/user/${id}`);
  }
  deleteUserById(id:string): Observable<any> {
    return this.http.get(`${this.API}/user-delete/${id}`);
  }
  getAllUser(): Observable<any> {
    return this.http.get(`${this.API}/user`)
  }
  createUser(user:any): Observable<any> {
     return  this.http.post<any>(`${this.API}/user`, user)
  }
  updateUser(user:any): Observable<any> {
     return  this.http.put(`${this.API}/user`, user)
  }

  themThietBiPhong(data: any): Observable<any> {
    return this.http.post(`${this.API}/thiet-bi`, data)
  }
  updateEquipment(data: any): Observable<any> {
    return this.http.put(`${this.API}/equipment`, data)
  }
  createEquipment(data: any): Observable<any> {
    return this.http.post(`${this.API}/equipment`, data)
  }
  getThietBiHsd(): Observable<any> {
    return  this.http.get(`${this.API}/thiet-bi-hsd`)
  }
  getRoom(): Observable<any> {
    return  this.http.get(`${this.API}/room`)
  }
  getEquipment(): Observable<any> {
    return this.http.get(`${this.API}/equipment`)
  }
  kiemTraHsd(data: any): Observable<any> {
    return  this.http.post(`${this.API}/het-han`, data)
  }
  capNhatSoLuong(data: any): Observable<any> {
    return  this.http.put(`${this.API}/thiet-bi-sl`, data)
  }
  xoaThietBiPhong(id: any): Observable<any> {
    return this.http.post(`${this.API}/thiet-bi-delete`,id)
  }


  getByUserBorrowReturnSlip(id:string): Observable<any> {
    return  this.http.get(`${this.API}/borrow-return-slip/${id}`)
  }
  getBorrowReturnItem(): Observable<any> {
    return  this.http.get(`${this.API}/borrow-return-item`)
  }
  getfindBorrowReturnSlipDetail(id:string): Observable<any> {
    return  this.http.get(`${this.API}/borrow-return-slip-detail/${id}`)
  }
  getOneEquipment(id:string): Observable<any> {
    return this.http.get(`${this.API}/equipment/${id}`)
  }

  borrowReturnSlip(data: any): Observable<any> {
    return     this.http.put(`${this.API}/borrow-return-slip`, data)
  }
  createBorrowReturnSlip(equipment: any): Observable<any> {
    return  this.http.post<any>(`${this.API}/borrow-return-slip`, equipment)
  }
  approvedSlip(data: any): Observable<any> {
    return     this.http.put(`${this.API}/approved`, data)
  }

  createrequestSlip(data:any): Observable<any> {
     return  this.http.post<any>(`${this.API}/request-slip`, data)
  }
  deleteEquipment(data:any): Observable<any> {
     return  this.http.post<any>(`${this.API}/equipment-delete`, data)
  }
    getAllRequestSlip(): Observable<any> {
    return this.http.get(`${this.API}/request-slip`)
  }
}
