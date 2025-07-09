import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicPlaylistsComponent } from './public-playlists.component';

describe('PublicPlaylistsComponent', () => {
  let component: PublicPlaylistsComponent;
  let fixture: ComponentFixture<PublicPlaylistsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicPlaylistsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PublicPlaylistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
