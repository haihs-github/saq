import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

/*
 * Frontend API service tests verify HTTP contracts only.
 * No database is accessed here, so CheckDB and Rollback belong to backend integration tests.
 * Each test keeps its TC ID in a comment directly above the it(...) block.
 */

describe('ApiService', () => {
  let apiService: ApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    apiService = TestBed.inject(ApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  async function expectHttpCall<T>(
    requestFactory: () => any,
    expectedUrl: string,
    expectedMethod: string,
    responseBody: T,
    verifyRequest?: (request: any) => void
  ): Promise<any> {
    const responsePromise = firstValueFrom(requestFactory()) as Promise<any>;
    const request = httpTestingController.expectOne(expectedUrl);

    expect(request.request.method).toBe(expectedMethod);

    if (verifyRequest) {
      verifyRequest(request);
    }

    request.flush(responseBody as any);

    return await responsePromise;
  }

  // TC_API_USER_01: Fetch one user by id.
  it('[TC_API_USER_01] calls GET /user/:id when requesting a single user', async () => {
    const userId = '101';
    const mockUser = { ID: 101, USER_UserName: 'gv01' };

    const response = await expectHttpCall(
      () => apiService.getOneUser(userId),
      `${environment.apiUrl}/user/${userId}`,
      'GET',
      mockUser
    );

    expect(response).toEqual(mockUser);
  });

  // TC_API_USER_02: Delete a user by id through the contract endpoint.
  it('[TC_API_USER_02] calls GET /user-delete/:id when deleting a user', async () => {
    const userId = '55';
    const mockResponse = { message: 'deleted' };

    const response = await expectHttpCall(
      () => apiService.deleteUserById(userId),
      `${environment.apiUrl}/user-delete/${userId}`,
      'GET',
      mockResponse
    );

    expect(response).toEqual(mockResponse);
  });

  // TC_API_USER_03: Load the full user list.
  it('[TC_API_USER_03] calls GET /user for the full user list', async () => {
    const mockUsers = [{ ID: 1 }, { ID: 2 }];

    const response = await expectHttpCall(
      () => apiService.getAllUser(),
      `${environment.apiUrl}/user`,
      'GET',
      mockUsers
    );

    expect(response).toEqual(mockUsers);
  });

  // TC_API_USER_04: Create a new user through POST /user.
  it('[TC_API_USER_04] calls POST /user with the full user payload', async () => {
    const createUserPayload = { USER_UserName: 'new-user', USER_Email: 'new@example.com' };
    const createdUserResponse = { id: 77 };

    const response = await expectHttpCall(
      () => apiService.createUser(createUserPayload),
      `${environment.apiUrl}/user`,
      'POST',
      createdUserResponse,
      (request) => {
        expect(request.request.body).toEqual(createUserPayload);
      }
    );

    expect(response).toEqual(createdUserResponse);
  });

  // TC_API_USER_05: Update an existing user through PUT /user.
  it('[TC_API_USER_05] calls PUT /user with the update payload', async () => {
    const updateUserPayload = { ID: 1, USER_UserName: 'updated-user' };
    const updatedUserResponse = { message: 'updated' };

    const response = await expectHttpCall(
      () => apiService.updateUser(updateUserPayload),
      `${environment.apiUrl}/user`,
      'PUT',
      updatedUserResponse,
      (request) => {
        expect(request.request.body).toEqual(updateUserPayload);
      }
    );

    expect(response).toEqual(updatedUserResponse);
  });

  // TC_API_EQUIPMENT_01: Create a new equipment item.
  it('[TC_API_EQUIPMENT_01] calls POST /equipment with the equipment payload', async () => {
    const equipmentPayload = { EQUIPMENT_ITEM_Name: 'EQ-01' };
    const createEquipmentResponse = { message: 'created' };

    const response = await expectHttpCall(
      () => apiService.createEquipment(equipmentPayload),
      `${environment.apiUrl}/equipment`,
      'POST',
      createEquipmentResponse,
      (request) => {
        expect(request.request.body).toEqual(equipmentPayload);
      }
    );

    expect(response).toEqual(createEquipmentResponse);
  });

  // TC_API_EQUIPMENT_02: Update an equipment item.
  it('[TC_API_EQUIPMENT_02] calls PUT /equipment with the equipment update payload', async () => {
    const equipmentUpdatePayload = { ID: 12, EQUIPMENT_ITEM_Name: 'EQ-12' };
    const updateEquipmentResponse = { message: 'updated equipment' };

    const response = await expectHttpCall(
      () => apiService.updateEquipment(equipmentUpdatePayload),
      `${environment.apiUrl}/equipment`,
      'PUT',
      updateEquipmentResponse,
      (request) => {
        expect(request.request.body).toEqual(equipmentUpdatePayload);
      }
    );

    expect(response).toEqual(updateEquipmentResponse);
  });

  // TC_API_ROOM_01: Load room information.
  it('[TC_API_ROOM_01] calls GET /room for the room list', async () => {
    const mockRooms = [{ ID: 1, ROOM_Name: 'A101' }];

    const response = await expectHttpCall(
      () => apiService.getRoom(),
      `${environment.apiUrl}/room`,
      'GET',
      mockRooms
    );

    expect(response).toEqual(mockRooms);
  });

  // TC_API_BORROW_01: Load borrow-slip data for a specific user.
  it('[TC_API_BORROW_01] calls GET /borrow-return-slip/:id for a user-specific slip list', async () => {
    const userId = '88';
    const mockSlips = [{ ID: 1 }];

    const response = await expectHttpCall(
      () => apiService.getByUserBorrowReturnSlip(userId),
      `${environment.apiUrl}/borrow-return-slip/${userId}`,
      'GET',
      mockSlips
    );

    expect(response).toEqual(mockSlips);
  });

  // TC_API_BORROW_02: Load borrow-slip detail by slip id.
  it('[TC_API_BORROW_02] calls GET /borrow-return-slip-detail/:id for slip detail', async () => {
    const slipId = 'slip-001';
    const mockSlipDetail = { ID: 1, Note: 'detail' };

    const response = await expectHttpCall(
      () => apiService.getfindBorrowReturnSlipDetail(slipId),
      `${environment.apiUrl}/borrow-return-slip-detail/${slipId}`,
      'GET',
      mockSlipDetail
    );

    expect(response).toEqual(mockSlipDetail);
  });

  // TC_API_BORROW_03: Create a borrow-return slip.
  it('[TC_API_BORROW_03] calls POST /borrow-return-slip to create a slip', async () => {
    const createSlipPayload = { userId: 1, roomId: 2 };
    const createSlipResponse = { id: 200 };

    const response = await expectHttpCall(
      () => apiService.createBorrowReturnSlip(createSlipPayload),
      `${environment.apiUrl}/borrow-return-slip`,
      'POST',
      createSlipResponse,
      (request) => {
        expect(request.request.body).toEqual(createSlipPayload);
      }
    );

    expect(response).toEqual(createSlipResponse);
  });

  // TC_API_BORROW_04: Update a borrow-return slip.
  it('[TC_API_BORROW_04] calls PUT /borrow-return-slip to update a slip', async () => {
    const borrowReturnPayload = { ID: 200, status: 'approved' };
    const borrowReturnResponse = { message: 'updated borrow slip' };

    const response = await expectHttpCall(
      () => apiService.borrowReturnSlip(borrowReturnPayload),
      `${environment.apiUrl}/borrow-return-slip`,
      'PUT',
      borrowReturnResponse,
      (request) => {
        expect(request.request.body).toEqual(borrowReturnPayload);
      }
    );

    expect(response).toEqual(borrowReturnResponse);
  });

  // TC_API_BORROW_05: Approve a slip.
  it('[TC_API_BORROW_05] calls PUT /approved with the approval payload', async () => {
    const approvalPayload = { ID: 200, approvedBy: 7 };
    const approvalResponse = { message: 'approved' };

    const response = await expectHttpCall(
      () => apiService.approvedSlip(approvalPayload),
      `${environment.apiUrl}/approved`,
      'PUT',
      approvalResponse,
      (request) => {
        expect(request.request.body).toEqual(approvalPayload);
      }
    );

    expect(response).toEqual(approvalResponse);
  });

  // TC_API_REQUEST_01: Create a request slip.
  it('[TC_API_REQUEST_01] calls POST /request-slip with the request payload', async () => {
    const requestSlipPayload = { userId: 1, reason: 'Need projector' };
    const requestSlipResponse = { id: 300 };

    const response = await expectHttpCall(
      () => apiService.createrequestSlip(requestSlipPayload),
      `${environment.apiUrl}/request-slip`,
      'POST',
      requestSlipResponse,
      (request) => {
        expect(request.request.body).toEqual(requestSlipPayload);
      }
    );

    expect(response).toEqual(requestSlipResponse);
  });

  // TC_API_REQUEST_02: Delete equipment through the request-oriented endpoint.
  it('[TC_API_REQUEST_02] calls POST /equipment-delete with the delete payload', async () => {
    const deleteEquipmentPayload = { id: 12, type: 'equipment' };
    const deleteEquipmentResponse = { message: 'deleted' };

    const response = await expectHttpCall(
      () => apiService.deleteEquipment(deleteEquipmentPayload),
      `${environment.apiUrl}/equipment-delete`,
      'POST',
      deleteEquipmentResponse,
      (request) => {
        expect(request.request.body).toEqual(deleteEquipmentPayload);
      }
    );

    expect(response).toEqual(deleteEquipmentResponse);
  });

  // TC_API_REQUEST_03: Load all request slips.
  it('[TC_API_REQUEST_03] calls GET /request-slip for the request list', async () => {
    const requestSlipList = [{ ID: 1 }, { ID: 2 }];

    const response = await expectHttpCall(
      () => apiService.getAllRequestSlip(),
      `${environment.apiUrl}/request-slip`,
      'GET',
      requestSlipList
    );

    expect(response).toEqual(requestSlipList);
  });

  // TC_API_MISC_01: Load the equipment expiration list.
  it('[TC_API_MISC_01] calls GET /thiet-bi-hsd for the expiry list', async () => {
    const expiryList = [{ ID: 1, status: 'expired' }];

    const response = await expectHttpCall(
      () => apiService.getThietBiHsd(),
      `${environment.apiUrl}/thiet-bi-hsd`,
      'GET',
      expiryList
    );

    expect(response).toEqual(expiryList);
  });

  // TC_API_MISC_02: Update equipment quantity.
  it('[TC_API_MISC_02] calls PUT /thiet-bi-sl with the quantity payload', async () => {
    const quantityPayload = { id: 1, quantity: 4 };
    const quantityResponse = { message: 'quantity updated' };

    const response = await expectHttpCall(
      () => apiService.capNhatSoLuong(quantityPayload),
      `${environment.apiUrl}/thiet-bi-sl`,
      'PUT',
      quantityResponse,
      (request) => {
        expect(request.request.body).toEqual(quantityPayload);
      }
    );

    expect(response).toEqual(quantityResponse);
  });

  // TC_API_MISC_03: Hide a room or equipment by posting the delete payload.
  it('[TC_API_MISC_03] calls POST /thiet-bi-delete with the soft-delete payload', async () => {
    const softDeletePayload = { id: 1, type: 'room' };
    const softDeleteResponse = { message: 'soft deleted' };

    const response = await expectHttpCall(
      () => apiService.xoaThietBiPhong(softDeletePayload),
      `${environment.apiUrl}/thiet-bi-delete`,
      'POST',
      softDeleteResponse,
      (request) => {
        expect(request.request.body).toEqual(softDeletePayload);
      }
    );

    expect(response).toEqual(softDeleteResponse);
  });

  // TC_API_MISC_04: Read the borrow-return items list.
  it('[TC_API_MISC_04] calls GET /borrow-return-item for the item list', async () => {
    const borrowReturnItems = [{ ID: 1, EQUIPMENT_ITEM_Name: 'EQ-01' }];

    const response = await expectHttpCall(
      () => apiService.getBorrowReturnItem(),
      `${environment.apiUrl}/borrow-return-item`,
      'GET',
      borrowReturnItems
    );

    expect(response).toEqual(borrowReturnItems);
  });
});