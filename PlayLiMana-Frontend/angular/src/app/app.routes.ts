import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { LibraryComponent } from './components/pages/library/library.component';
import { PlaylistDetailComponent } from './components/pages/playlist-detail/playlist-detail.component';
import { LoginComponent } from './components/pages/login/login.component';
import { AuthComponent } from './components/auth/auth.component';
import { PublicPlaylistsComponent } from './components/public-playlists/public-playlists.component';
import { authGuard } from './guards/auth.guard';
import {ProfileComponent} from "./components/profile/profile.component";

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: '/library', pathMatch: 'full' },

      // Authenticated routes
      { path: 'library', component: LibraryComponent, canActivate: [authGuard] },
      { path: 'playlist/:id', component: PlaylistDetailComponent, canActivate: [authGuard] },
      { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },


      // Public/unauthenticated
      { path: 'explore', component: PublicPlaylistsComponent },
      { path: 'playlist/:id', component: PlaylistDetailComponent },
      { path: 'login', component: LoginComponent },
    ]
  },

  // Auth page (no guard)
  { path: 'auth', component: AuthComponent },

  // 404 fallback
  { path: '**', redirectTo: '/explore' }
];
