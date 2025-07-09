import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  /* private endpoints (need JWT) */
  fetchPlaylists,
  fetchPlaylistById,
  createPlaylist,
  editPlaylist,
  deletePlaylist,
  changeSongOrder,
  changePlaylistName,
  changePlaylistDescription,
  changePlaylistVisibility,
  addSongToPlaylist,
  removeSongFromPlaylist,
  copyPlaylist,
  importSpotifyPlaylists,
  importAudiusPlaylists,

  /* ★ public endpoints (no auth) */
  fetchPublicPlaylists,
  fetchPublicPlaylistById,
} from "../services/playlist/playlistApi";
import type { Playlist } from "../models/playlist";
import { getAuth } from "firebase/auth";               // ★
import React from "react";

/* ───────────────── helpers ────────────────────────────────────────────── */
function dedupe(list: Playlist[]): Playlist[] {
  return Array.from(new Map(list.map(p => [p.playlistId, p])).values());
}

const STALE_TIME = 1000 * 60 * 5; // 5 min

export const usePlaylists = () => {
  const queryClient = useQueryClient();
  const [skipFetch, setSkipFetch] = React.useState(false);

  /* who is logged-in? (null → anonymous)                                   */
  const user = getAuth().currentUser;                                   // ★

  /* pick the right endpoint once per render                                */
  const listFn     = user ? fetchPlaylists        : fetchPublicPlaylists;        // ★
  const fetchById  = user ? fetchPlaylistById     : fetchPublicPlaylistById;     // ★

  /* ─── main list query ────────────────────────────────────────────────── */
  const playlistsQuery = useQuery<Playlist[]>({
    queryKey : ["playlists", user ? "private" : "public"],              // ★
    queryFn  : listFn,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect  : false,
  });

  const playlists = dedupe(playlistsQuery.data ?? []);

  /* ─── single-playlist helper ─────────────────────────────────────────── */
  const getPlaylistById = (id: number | null | undefined): Playlist | undefined => {
    if (!id) return;

    /* 1) in-memory cache first                                             */
    const cached = playlists.find(p => p.playlistId === id);
    if (cached) return cached;

    /* 2) optionally fetch (skip when told to, e.g. right after delete)     */
    if (skipFetch) return;

    fetchById(id)
        .then(fetched =>
            queryClient.setQueryData<Playlist[]>(
                ["playlists", user ? "private" : "public"],                    // ★
                old => dedupe([...(old ?? []), fetched]),
            ),
        )
        .catch(err => console.error("[usePlaylists] fetch by id failed:", err));

    return undefined;
  };

  /* ─── mutations (only usable when logged-in) ─────────────────────────── */
  const create  = useMutation({ mutationFn: createPlaylist });
  const edit    = useMutation({ mutationFn: editPlaylist });
  const copy    = useMutation({ mutationFn: copyPlaylist });
  const remove  = useMutation({ mutationFn: deletePlaylist });

  const importFromSpotify = useMutation({
    mutationFn: importSpotifyPlaylists,
    onSuccess : imported =>
        queryClient.setQueryData<Playlist[]>(
            ["playlists", "private"],
            old => dedupe([...(old ?? []), ...imported]),
        ),
  });

  const importFromAudius = useMutation({
    mutationFn: importAudiusPlaylists,
    onSuccess : imported =>
        queryClient.setQueryData<Playlist[]>(
            ["playlists", "private"],
            old => dedupe([...(old ?? []), ...imported]),
        ),
  });

  const updatePlaylist = (updated: Playlist) => {
    if (!updated?.playlistId) return;
    queryClient.setQueryData<Playlist[]>(
        ["playlists", user ? "private" : "public"],
        old => dedupe([...(old ?? []), updated]),
    );
  };

  /* ─── public API ─────────────────────────────────────────────────────── */
  return {
    playlists,
    playlistsQuery,

    /* mutations (safe no-ops when anonymous) */
    create,
    edit,
    copy,
    remove,
    importFromSpotify,
    importFromAudius,

    /* utils */
    setSkipFetch,
    addSongToPlaylist,
    removeSongFromPlaylist,
    changeSongOrder,
    changePlaylistName,
    changePlaylistDescription,
    changePlaylistVisibility,
    updatePlaylist,
    getPlaylistById,
  };
};
