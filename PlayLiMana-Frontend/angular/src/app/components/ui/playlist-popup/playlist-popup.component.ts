import { Component, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { Playlist } from '../../../models/playlist.model';
import { PlaylistService } from '../../../services/playlist.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-playlist-popup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './playlist-popup.component.html',
  styleUrls: ['./playlist-popup.component.scss']
})
export class PlaylistPopupComponent {
  @Output() playlistCreated = new EventEmitter<Playlist>();
  @Output() playlistEdited = new EventEmitter<Playlist>();

  popupPage = -1; // Popup invisible
  isNameInvalid: boolean = false;
  playlistName: string = '';
  playlistDescription: string = '';
  visibility: string = 'Public';
  exportToPlayLiMana: boolean = true;
  exportToSpotify: boolean = false;
  isLoading: boolean = false;
  errorMessage = '';
  private playlistToEdit?: Playlist;

  constructor(private playlistService: PlaylistService) {}

  /* Navigation */
  closePopup(): void {
    this.popupPage = PopupState.HIDDEN;
  }

  goToAddPlaylistPage(): void {
    this.popupPage = PopupState.ADD_PLAYLIST;
  }

  goToNewPlaylistPage(resetForm = true): void {
    if (resetForm) {
      this.resetForm();
    }
    this.popupPage = PopupState.CREATE_PLAYLIST;
  }

  goToEditPlaylistPage(playlist: Playlist): void {
    this.playlistToEdit = playlist;
    this.playlistName = playlist.playlistName;
    this.playlistDescription = playlist.description || '';
    this.visibility = playlist.visibility;
    this.exportToPlayLiMana = true;
    this.exportToSpotify = false;
    this.isNameInvalid = false;
    this.popupPage = PopupState.EDIT_PLAYLIST;
  }

  goToImportPlaylistPage(): void {
    this.popupPage = PopupState.IMPORT_PLAYLIST;
  }

  goToErrorPage(): void {
    this.popupPage = PopupState.ERROR;
  }

  /* Reset */
  resetForm(): void {
    this.playlistName = '';
    this.playlistDescription = '';
    this.visibility = 'Public';
    this.exportToPlayLiMana = true;
    this.exportToSpotify = false;
    this.isNameInvalid = false;
    this.isLoading = false;
    this.errorMessage = ''; 
    this.playlistToEdit = undefined;
  }

  /* Autofocus description after pressing enter key */
  @ViewChild('descriptionRef') descriptionField!: ElementRef;
  focusDescription(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault(); 
    this.descriptionField.nativeElement.focus();
  }

  /* Pressing OK */
  @ViewChild('playlistNameRef') playlistNameRef!: ElementRef;
  onOkButtonClick(): void {
    if (!this.playlistName.trim()) {
      this.isNameInvalid = true;
      setTimeout(() => this.playlistNameRef.nativeElement.focus(), 0);
    } else if (this.popupPage === PopupState.EDIT_PLAYLIST && this.playlistToEdit) {
      const updatedPlaylist = { ...this.playlistToEdit };
      updatedPlaylist.playlistName = this.playlistName;
      updatedPlaylist.description = this.playlistDescription;
      updatedPlaylist.visibility = this.visibility.toUpperCase();

      this.isLoading = true;
      const timeout = setTimeout(() => {
        this.isLoading = false;
        this.errorMessage = 'Request timed out. Please try again later.';
        this.goToErrorPage();
      }, 10000);

      this.playlistService.editPlaylist(updatedPlaylist).subscribe({
        next: () => {
          clearTimeout(timeout);
          this.isLoading = false;
          this.playlistEdited.emit(updatedPlaylist);
          this.closePopup();
          this.resetForm();
        },
        error: (error: any) => {
          clearTimeout(timeout);
          this.isLoading = false;
          this.errorMessage = 'Error editing playlist. Please try again later.';
          this.goToErrorPage();
          console.error('Error editing playlist:', error);
        },
      });
    } else {
      const newPlaylist: Playlist = {
        playlistId: -1,
        playlistName: this.playlistName,
        description: this.playlistDescription,
        visibility: this.visibility.toUpperCase(),
        sorting: 'CUSTOM',
        songs: [],
        numberOfSongs: 0,
        playtime: 0,
        dateAdded: new Date()
      };

      console.log(newPlaylist);

      this.isLoading = true;
      const timeout = setTimeout(() => {
        this.isLoading = false;
        this.errorMessage = 'Request timed out. Please try again later.';
        this.goToErrorPage();
      }, 10000);

      this.playlistService.createPlaylist(newPlaylist).subscribe({
        next: (response) => {
          clearTimeout(timeout);
          this.isLoading = false;
          newPlaylist.playlistId = response.playlistId;
          this.closePopup();
          this.playlistCreated.emit({ ...newPlaylist, playlistId: response.playlistId });
          this.resetForm();
        },
        error: (error) => {
          clearTimeout(timeout);
          this.isLoading = false;
          this.errorMessage = 'Error creating playlist. Please try again later.';
          this.goToErrorPage();
          console.error('Error creating playlist:', error);
        },
      });
    }
  }

  /* Name entered */
  onNameInput(): void {
    if (this.playlistName.trim()) {
      this.isNameInvalid = false;
    }
  }
}

enum PopupState {
  HIDDEN = -1,
  ERROR = 0,
  ADD_PLAYLIST = 1,
  CREATE_PLAYLIST = 2,
  EDIT_PLAYLIST = 3,
  IMPORT_PLAYLIST = 4
}
