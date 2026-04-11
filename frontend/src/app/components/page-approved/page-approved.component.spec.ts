import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageApprovedComponent } from './page-approved.component';

describe('PageApprovedComponent', () => {
  let component: PageApprovedComponent;
  let fixture: ComponentFixture<PageApprovedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageApprovedComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PageApprovedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
