import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartOffcanvas } from './cart-offcanvas';

describe('CartOffcanvas', () => {
  let component: CartOffcanvas;
  let fixture: ComponentFixture<CartOffcanvas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartOffcanvas],
    }).compileComponents();

    fixture = TestBed.createComponent(CartOffcanvas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
