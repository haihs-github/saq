import * as FileSaver from 'file-saver';

import { ExcelService } from './excel.service';

/*
 * ExcelService is a browser-side utility and does not touch the database.
 * CheckDB and Rollback are therefore not applicable in this unit suite.
 * Test IDs are written as comments directly above each it(...) block.
 */

describe('ExcelService', () => {
  let excelService: ExcelService;

  beforeEach(() => {
    excelService = new ExcelService();
  });

  // TC_EXCEL_01: Empty input should show the no-data alert and stop early.
  it('[TC_EXCEL_01] shows an alert and stops when the export dataset is empty', async () => {
    const alertSpy = spyOn(window, 'alert');
    const saveAsExcelFileSpy = spyOn<any>(excelService, 'saveAsExcelFile');

    await excelService.exportAsExcelFile([], 'empty-report');

    expect(alertSpy).toHaveBeenCalledWith('No data to export.');
    expect(saveAsExcelFileSpy).not.toHaveBeenCalled();
  });

  // TC_EXCEL_02: Non-empty input should be converted and handed to the private saver.
  it('[TC_EXCEL_02] passes a generated buffer to the private saver for non-empty data', async () => {
    const saveAsExcelFileSpy = spyOn<any>(excelService, 'saveAsExcelFile');
    const exportData = [
      { deviceName: 'Projector', quantity: 2 },
      { deviceName: 'Laptop', quantity: 1 }
    ];

    await excelService.exportAsExcelFile(exportData, 'equipment-report');

    expect(saveAsExcelFileSpy).toHaveBeenCalledTimes(1);
    const [bufferArgument, fileNameArgument] = saveAsExcelFileSpy.calls.argsFor(0);
    expect(bufferArgument).toBeTruthy();
    expect(fileNameArgument).toBe('equipment-report');
  });

  // TC_EXCEL_03: The private saver should build the expected xlsx file name.
  it('[TC_EXCEL_03] saves the file with a timestamped xlsx name', () => {
    const saveAsSpy = spyOn(FileSaver, 'saveAs');

    (excelService as any).saveAsExcelFile(new ArrayBuffer(8), 'equipment-report');

    expect(saveAsSpy).toHaveBeenCalledTimes(1);
    const [blobArgument, fileNameArgument] = saveAsSpy.calls.argsFor(0);

    expect(blobArgument instanceof Blob).toBeTrue();
    expect(fileNameArgument).toMatch(/^equipment-report_export_\d+\.xlsx$/);
  });

  // TC_EXCEL_04: Saving errors should be caught and logged by the private saver.
  it('[TC_EXCEL_04] logs an error when saving the Excel file fails', () => {
    const consoleErrorSpy = spyOn(console, 'error');
    spyOn<any>(FileSaver, 'saveAs').and.callFake(() => {
      throw new Error('save failed');
    });

    (excelService as any).saveAsExcelFile(new ArrayBuffer(8), 'equipment-report');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error saving Excel file:', jasmine.any(Error));
  });
});