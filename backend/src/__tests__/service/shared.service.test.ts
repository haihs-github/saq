import { firstValueFrom } from 'rxjs';

import { SharedService } from './shared.service';

/*
 * SharedService is a pure in-memory service.
 * It does not access the database, so CheckDB and Rollback are not applicable here.
 * The test comments below keep the TC ID directly beside each case for traceability.
 */

describe('SharedService', () => {
  let sharedService: SharedService;

  beforeEach(() => {
    sharedService = new SharedService();
  });

  // TC_SHARED_01: Verify the default BehaviorSubject values are stable.
  it('[TC_SHARED_01] exposes the expected initial stream values', async () => {
    expect(await firstValueFrom(sharedService.getThietBi)).toBeNull();
    expect(await firstValueFrom(sharedService.getTypeAction)).toBe('');
    expect(await firstValueFrom(sharedService.getSearch)).toBeNull();
    expect(await firstValueFrom(sharedService.getId)).toBe('');
    expect(await firstValueFrom(sharedService.getBorrowReturnSlipDetailId)).toBeNull();
  });

  // TC_SHARED_02: Store and read back the selected equipment payload.
  it('[TC_SHARED_02] updates the equipment stream with setThietBi', async () => {
    const selectedEquipment = { ID: 12, EQUIPMENT_ITEM_Name: 'EQ-12' };

    sharedService.setThietBi(selectedEquipment);

    expect(await firstValueFrom(sharedService.getThietBi)).toEqual(selectedEquipment);
  });

  // TC_SHARED_03: Store and read back the search payload.
  it('[TC_SHARED_03] updates the search stream with setSearch', async () => {
    const searchPayload = { keyword: 'projector' };

    sharedService.setSearch(searchPayload);

    expect(await firstValueFrom(sharedService.getSearch)).toEqual(searchPayload);
  });

  // TC_SHARED_04: Store and read back the borrow-return slip detail id.
  it('[TC_SHARED_04] updates the slip detail stream with setBorrowReturnSlipDetailId', async () => {
    const slipDetailId = 'slip-001';

    sharedService.setBorrowReturnSlipDetailId(slipDetailId);

    expect(await firstValueFrom(sharedService.getBorrowReturnSlipDetailId)).toBe(slipDetailId);
  });

  // TC_SHARED_05: Compose id and equipment type into the combined selection string.
  it('[TC_SHARED_05] combines id and equipment type with a pipe separator', async () => {
    sharedService.setId('42', 'equipment');

    expect(await firstValueFrom(sharedService.getId)).toBe('42|equipment');
  });

  // TC_SHARED_06: Update the current action flag.
  it('[TC_SHARED_06] updates the action stream with setTypeAction', async () => {
    sharedService.setTypeAction('create');

    expect(await firstValueFrom(sharedService.getTypeAction)).toBe('create');
  });

  // TC_SHARED_07: Return today's date in yyyy-mm-dd format.
  it('[TC_SHARED_07] formats the current date as yyyy-mm-dd', () => {
    const fixedDate = new Date(2026, 4, 11);

    jasmine.clock().install();
    jasmine.clock().mockDate(fixedDate);

    try {
      expect(sharedService.getDMY()).toBe('2026-05-11');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  // TC_SHARED_08: The zero-ending branch returns the special 10 prefix.
  it('[TC_SHARED_08] returns the zero-ending return-date format for multiples of ten', () => {
    expect(sharedService.tinhNgayTra(20, '2026-05-11')).toEqual(['102026-05-11']);
  });

  // TC_SHARED_09: Negative totals should return an empty result.
  it('[TC_SHARED_09] returns an empty array for negative total periods', () => {
    expect(sharedService.tinhNgayTra(-1, '2026-05-11')).toEqual([]);
  });
});