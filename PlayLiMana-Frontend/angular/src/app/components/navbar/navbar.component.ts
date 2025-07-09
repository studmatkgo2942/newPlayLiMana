import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';          // ← add FormsModule
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';

//import { SearchService } from '../../services/search.service';
//import { SpotifyService } from '../../services/spotify.service'; // Ein Wrap für die Spotify SDK
//import { UserProfile } from '@spotify/web-api-ts-sdk';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],               // ← include FormsModule
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavBarComponent implements OnInit {
  searchTerm: string = '';
  //userProfile: UserProfile | null = null;
  loadingProfile: boolean = true;
  isAuthenticated$: BehaviorSubject<boolean>;
  profileImageUrl?: string;
  displayName?: string;
  initials: string = '?';

  // Konstruktor mit Abhängigkeiten: Spotify (SDK) und Router
  constructor(
    //private spotifyService: SpotifyService,
    //private searchService: SearchService,
    private router: Router,
    private authService: AuthService
  ) {
    this.isAuthenticated$ = new BehaviorSubject<boolean>(true);// this.spotifyService.isAuthenticated$;
  }

  ngOnInit(): void {
    //Get user profile if logged in
    this.authService.isAuthenticated$().subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.loadingProfile = true;
        try {
          //const profile = await firstValueFrom(this.spotifyService.fetchUserProfile());
          //this.userProfile = profile;
          // this.profileImageUrl = user?.photoURL || undefined;
          const user = this.authService.getUser();

          this.displayName = user?.email ?? 'Unbekannt'; //profile.display_name;
          this.profileImageUrl = undefined;//profile.images?.[0]?.url || undefined;
          this.initials = this.getInitials(this.displayName || '');
          //console.log(`Profil geladen: ${JSON.stringify(profile)}`);
        } catch (error) {
          console.error('Profil konnte nicht geladen werden:', error);
          //this.userProfile = null;
          this.initials = '?';
        } finally {
          this.loadingProfile = false;
        }
      } else {
        //this.userProfile = null;
        this.initials = '?';
        this.loadingProfile = false;
      }
    });
    //TODO: this.searchService.searchTerm$.subscribe((term) => (this.searchTerm = term));
  }

  onSearchChange(term: string): void {
    //TODO: this.searchService.updateSearchTerm(term);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .filter((_val, index, arr) => index === 0 || index === arr.length - 1)
      .join('')
      .toUpperCase();
  }

  // Logout über AuthService
  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/auth']);
    });
  }
}
