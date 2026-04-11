import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageRequestComponent } from './page-request.component';

describe('PageRequestComponent', () => {
  let component: PageRequestComponent;
  let fixture: ComponentFixture<PageRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageRequestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PageRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
