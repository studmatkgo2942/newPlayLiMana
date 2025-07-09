import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchPlaylists,
  fetchPlaylistById,
  createPlaylist,
  editPlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  changeSongOrder,
  changePlaylistName,
  changePlaylistDescription,
  changePlaylistVisibility,
  copyPlaylist,
  importSpotifyPlaylists,
  importAudiusPlaylists,
} from "../services/playlist/playlistApi"
import type { Playlist } from "../models/playlist"
import React from "react"

const STALE_TIME = 1000 * 60 * 5 // 5 min

export const usePlaylists = () => {
  const queryClient = useQueryClient()
  const [skipFetch, setSkipFetch] = React.useState(false)

  /* ─── Query  ----------------------------------------------------------- */
  const playlistsQuery = useQuery<Playlist[]>({
    queryKey : ["playlists"],
    queryFn  : fetchPlaylists,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect  : false,
  })
  const playlists = playlistsQuery.data ?? []

  const getPlaylistById = (id: number | null | undefined): Playlist | undefined => {
    if (!id) return undefined
    const cached = playlists.find(p => p.playlistId === id)
    if (cached) return cached
    if (skipFetch) return undefined

    fetchPlaylistById(id)
        .then(fetched =>
            queryClient.setQueryData<Playlist[]>(["playlists"], old => {
              if (!old) return [fetched]
              const idx = old.findIndex(p => p.playlistId === fetched.playlistId)
              return idx === -1 ? [...old, fetched] : old.map(p => (p.playlistId === fetched.playlistId ? fetched : p))
            }),
        )
        .catch(err => console.error("[usePlaylists] fetch by id failed:", err))
    return undefined
  }

  /* ─── Mutations -------------------------------------------------------- */
  const create  = useMutation({ mutationFn: createPlaylist })
  const edit    = useMutation({ mutationFn: editPlaylist })
  const copy    = useMutation({ mutationFn: copyPlaylist })
  const remove  = useMutation({ mutationFn: deletePlaylist })
  const importFromSpotify = useMutation({ mutationFn: importSpotifyPlaylists })
  const importFromAudius  = useMutation({
    mutationFn: importAudiusPlaylists,
    onSuccess : imported =>
        queryClient.setQueryData<Playlist[]>(["playlists"], (old = []) => [...old, ...imported]),
  })

  const updatePlaylist = (updated: Playlist) => {
    if (!updated?.playlistId) return
    queryClient.setQueryData<Playlist[]>(["playlists"], old =>
        (old ?? []).map(p => (p.playlistId === updated.playlistId ? { ...p, ...updated } : p)),
    )
  }

  /* ─── Public API ------------------------------------------------------- */
  return {
    playlists,
    playlistsQuery,
    /* mutations */
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
  }
}
