// src/pages/LandingPage.tsx
import React, { useEffect, useState } from 'react';
import { Playlist } from '../../models/playlist'
import { useAuth } from '../../hooks/UseAuth.tsx';
import {getPlaylists, getPublicPlaylists} from '../../services/playlist/playlistApi';
import PlaylistCard from '../../components/ui/PlaylistCard/PlaylistCard.tsx';
import { useNavigate } from 'react-router-dom';
// --- Import the new component ---

import './LandingPage.css';

const LandingPage: React.FC = () => {

    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
    const { user: firebaseUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadPublicPlaylists();

        if (firebaseUser) {
            loadUserPlaylists();
        } else {
            setPlaylists([]); // Clear playlists on logout
        }
    }, [firebaseUser]);

    const loadUserPlaylists = async () => {
        try {
            const playlists = await getPlaylists();
            setPlaylists(playlists);
        } catch (error) {
            console.error('Failed to load user playlists:', error);
        }
    };

    const loadPublicPlaylists = async() => {
        try {
            const publicPlaylists = await getPublicPlaylists();
            setPublicPlaylists(publicPlaylists);
        } catch (error) {
            console.error('Failed to load public playlists: ', error)
        }
    }

    const goToPlaylist = (playlist: Playlist) => {
        console.log('Navigating to playlist:', playlist);
        navigate(`/playlist/${playlist.playlistId}`);
    };

    const goToPublicPlaylist = (playlist: Playlist) => {
        console.log('Navigating to public playlist:', playlist);
        navigate(`/playlist/public/${playlist.playlistId}`);
    }

    return (
        <>
            <div className="popular-playlists">
                <h1>Popular Playlists</h1>
                {publicPlaylists.length > 0 ? (
                    <div className="playlist-grid">
                        {publicPlaylists.map((playlist) => (
                            <PlaylistCard
                                key={playlist.playlistId}
                                playlist={playlist}
                                onPlaylistClick={() =>
                                    firebaseUser
                                        ? goToPlaylist(playlist)
                                        : goToPublicPlaylist(playlist)
                                }
                            />
                        ))}
                    </div>
                ) : (
                    <p>No public playlists available.</p>
                )}
            </div>

            <div className="landing-page-container">
                {firebaseUser ? (
                    <>
                        <h1>Your Playlists</h1>
                        <div className="playlist-grid">
                            {playlists.map((playlist) => (
                                <PlaylistCard
                                    key={playlist.playlistId}
                                    playlist={playlist}
                                    onPlaylistClick={() => goToPlaylist(playlist)}/>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="landing-page-not-logged-in">
                        <h2>Please log in to see your own playlists.</h2>
                    </div>
                )}
            </div>
        </>
    );
};

export default LandingPage;