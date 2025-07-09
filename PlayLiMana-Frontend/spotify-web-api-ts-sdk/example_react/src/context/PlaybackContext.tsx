import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, type MutableRefObject } from "react"
import type { UserProfile } from "@spotify/web-api-ts-sdk"
import { SpotifyContext } from "./SpotifyContext.tsx"
import type { PropsWithChildren } from "react"
import {Song} from "../models/song.ts";
import {AudiusService} from "../services/audius/AudiusService.ts";
import { useAudiusContext } from "../context/AudiusContext";

export const skipEndedClearRef: MutableRefObject<boolean> = { current: false };

// Define the shape of our  playback state - using Spotify's native types for compatibility
export interface PlaybackState {
    paused: boolean
    duration: number
    position: number
    shuffle: boolean
    repeat_mode: number
    track_window: {
        current_track: any
        next_tracks: any[]
        previous_tracks: any[]
    }
    device: any
    context: any
    currently_playing_type: string
}

export interface CustomTrackInfo {
    title: string
    imageUrl?: string
    source?: string
}

// Define the shape of the context data - combining both approaches
interface PlaybackContextState {
    // Original Spotify player properties
    player: Spotify.Player | undefined
    isPlayerReady: boolean
    deviceId: string | null
    isPremium: boolean | null
    currentState: Spotify.PlaybackState | null
    // Custom audio properties for Audius
    playCustomAudio: (url: string, trackInfo: CustomTrackInfo) => void
    stopCustomAudio: () => void
    customAudioRef: React.RefObject<HTMLAudioElement>
    isCustomAudioPlaying: boolean
    customTrackInfo: CustomTrackInfo | null
    // Setters for compatibility
    setCurrentState: (state: Spotify.PlaybackState | null) => void
    setIsPlayerReady: (ready: boolean) => void
    setDeviceId: (id: string | null) => void
    setPlayer: (player: Spotify.Player | undefined) => void
    setIsPremium: (premium: boolean | null) => void
    // New method to pause Spotify when playing other audio
    pauseSpotifyPlayback: () => Promise<void>
    pauseCustomAudio: () => void;
    resumeCustomAudio: () => Promise<void>;
    audiusQueue: Song[];
    queueIndex : number;
    queueNext  : () => void;
    queuePrev  : () => void;
    clearQueue : () => void;
    loadAudiusQueue: (tracks: Song[]) => void;
}

// Create the context
const PlaybackContext = createContext<PlaybackContextState | undefined>(undefined)

// Provider component
const PlaybackProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    // Original Spotify states
    const [player, setPlayer] = useState<Spotify.Player | undefined>(undefined)
    const [isPlayerReady, setIsPlayerReady] = useState(false)
    const [deviceId, setDeviceId] = useState<string | null>(null)
    const [isPremium, setIsPremium] = useState<boolean | null>(null)
    const [profileFetched, setProfileFetched] = useState<boolean>(false)
    const [currentState, setCurrentState] = useState<Spotify.PlaybackState | null>(null)
    const [isExternalSdkReady, setIsExternalSdkReady] = useState(window.spotifySDKReady || false)

    // Custom audio states for Audius
    const [isCustomAudioPlaying, setIsCustomAudioPlaying] = useState(false)
    const [customTrackInfo, setCustomTrackInfo] = useState<CustomTrackInfo | null>(null)
    const customAudioRef = useRef<HTMLAudioElement>(null)

    // Get Spotify context
    const spotifyCtx = useContext(SpotifyContext)
    const regularSdk = spotifyCtx?.sdk
    const isAuthenticated = spotifyCtx?.isAuthenticated

    const [audiusQueue, setAudiusQueue] = useState<Song[]>([]);
    const [queueIndex , setQueueIndex ] = useState<number>(-1);
    const { audiusService } = useAudiusContext();

    const buildAudiusStreamUrl = (
        song: Song,
        audiusService?: AudiusService | null    //  ← accept null **and** undefined
    ): string | null => {
        /* 1) prefer the direct /stream link that is already on the Song object */
        let url = song.linksForWebPlayer?.find(u => u.includes("/stream")) ?? null;

        /* 2) otherwise derive it from the public permalink */
        if (!url && audiusService) {
            url = audiusService.getStreamUrlFromPermalink(song.linksForWebPlayer?.[0] ?? "");
        }
        if (!url) return null;

        /* 3) normalise – no spaces & always ?format=mp3 */
        url = url.replace(/\s+/g, "");
        if (!/[\?&]format=mp3\b/.test(url)) {
            url += (url.includes("?") ? "&" : "?") + "format=mp3";
        }
        return url;
    };


    const clearQueue = () => {
        setAudiusQueue([]);
        setQueueIndex(-1);
    };

    const playQueueIndex = (i: number) => {
        const song = audiusQueue[i];
        if (!song) return;
        //const url  = audiusService?.getStreamUrlFromPermalink(song.linksForWebPlayer?.[0]);
        //if (!url) return;


        let url: string | null = song.linksForWebPlayer?.find(u => u.includes("/stream")) ?? null;

        if (url) {
            // strip whitespace & force format=mp3
            url = url.replace(/\s+/g, "");
            if (!/[\?&]format=mp3\b/.test(url)) {
                url += (url.includes("?") ? "&" : "?") + "format=mp3";
            }
        } else {
            /* fall-back: derive from permalink via the service helper */
            url = audiusService?.getStreamUrlFromPermalink(song.linksForWebPlayer?.[0]) ?? null;
        }
        if (!url) return;

        playCustomAudio(url, {
            title   : song.title,
            imageUrl: song.coverUrl,
            source  : "audius",
        });
        setQueueIndex(i);
    };

    const queueNext = () => {
        if (queueIndex + 1 < audiusQueue.length) skipEndedClearRef.current = true, playQueueIndex(queueIndex + 1);
    };
    const queuePrev = () => {
        if (queueIndex > 0) playQueueIndex(queueIndex - 1);
    };

    // Method to pause Spotify playback when playing other audio
    const pauseSpotifyPlayback = async (): Promise<void> => {
        // if (player && currentState && !currentState.paused) {
        //     try {
        //         console.log("Pausing Spotify playback for external audio")
        //         await player.pause()
        //     } catch (error) {
        //         console.error("Error pausing Spotify:", error)
        //     }
        // }
        try {
            if (player && !currentState?.paused) {
                await player.pause();                     // Web-Playback SDK
            }
            if (regularSdk && deviceId) {
                await regularSdk.player.pausePlayback(deviceId); // Web API (extra safety)
            }
        } catch (err) {
            console.error("Error pausing Spotify:", err);
        }
    }

    const pauseCustomAudio = () => {
        const a = customAudioRef.current;
        if (a && !a.paused) a.pause();
    };

    const resumeCustomAudio = async () => {
        const a = customAudioRef.current;
        if (a && a.paused) {
            await a.play().catch((e) => console.error("resume play failed", e));
            setIsCustomAudioPlaying(true);
            setCurrentState((s) => (s ? { ...s, paused: false } : s));
        }
    };

    const loadAudiusQueue = (tracks: Song[]) => {
        if (!tracks.length) return;
        setAudiusQueue(tracks);
        const first = tracks[0];
        const url   = buildAudiusStreamUrl(first, audiusService);
        if (!url) return;
        playCustomAudio(url, {title: first.title, imageUrl: first.coverUrl, source: "audius",});
        setQueueIndex(0);
    };

    /* inside PlaybackContext.tsx ------------------------------------------ */
    const playCustomAudio = async (url: string, trackInfo: CustomTrackInfo) => {
        console.log("PlaybackContext: Playing custom audio:", trackInfo.title);


        await pauseSpotifyPlayback();

        const audio = customAudioRef.current;
        if (!audio) return;

        try {
            await audio.pause();                // wait so the old play() promise settles
        } catch { /* ignore */ }

        audio.currentTime = 0;
        audio.src         = url;
        audio.load();


        setCustomTrackInfo(trackInfo);
        setCurrentState({
            paused  : true,
            duration: 0,             // we’ll patch this once metadata loads
            position: 0,
            shuffle : false,
            repeat_mode: 0,
            track_window: {
                current_track: {
                    name  : trackInfo.title.split(" - ")[0] || trackInfo.title,
                    album : { images: trackInfo.imageUrl ? [{ url: trackInfo.imageUrl }] : [] },
                    artists: [{ name: trackInfo.title.split(" - ")[1] || trackInfo.source || "Unknown" }],
                    uri   : `custom:${url}`,
                    id    : `custom-${Date.now()}`,
                },
                next_tracks: [],
                previous_tracks: [],
            },
            device: { volume_percent: 70 },
            context: null,
            currently_playing_type: "track",
        } as Spotify.PlaybackState);

        /* 4️⃣  patch duration when we know it ----------------------------- */
        audio.onloadedmetadata = () =>
            setCurrentState(s => (s ? { ...s, duration: audio.duration * 1000 } : s));

        /* 5️⃣  try to play ------------------------------------------------- */
        try {
            await audio.play();
            setIsCustomAudioPlaying(true);
            setCurrentState(s => (s ? { ...s, paused: false } : s));
        } catch (err: any) {
            // AbortError happens when play() gets pre-empted by a pause → not fatal
            if (err?.name !== "AbortError") console.error("Failed to play custom audio:", err);
        }
    };

    const stopCustomAudio = () => {
        console.log("Stopping custom audio and clearing state")
        if (customAudioRef.current) {
            customAudioRef.current.pause()
            customAudioRef.current.currentTime = 0
            customAudioRef.current.src = ""
        }
        setIsCustomAudioPlaying(false)
        setCustomTrackInfo(null)
        // Clear the current state when stopping custom audio
        setCurrentState(null)
    }

    /* ========== Custom-audio lifecycle ==================================== */
    useEffect(() => {
        const audio = customAudioRef.current;
        if (!audio) return;

        const handlePlay = () => {
            setIsCustomAudioPlaying(true);
            if (currentState) setCurrentState({ ...currentState, paused: false });
        };

        const handlePause = () => {
            setIsCustomAudioPlaying(false);
            if (currentState) setCurrentState({ ...currentState, paused: true });
        };

        const handleEnded = () => {
            /* ▸▸ keep state when a playlist chains to the next track */
            // if (skipEndedClearRef.current) {
            //     skipEndedClearRef.current = false;          // reset for next round
            //     console.log("Custom audio ended – chaining, state kept");
            //     return;
            // }

            queueNext();
            if (queueIndex + 1 >= audiusQueue.length) clearQueue();
            /* normal single-track end: wipe state */
            setIsCustomAudioPlaying(false);
            setCustomTrackInfo(null);
            setCurrentState(null);
            console.log("Custom audio playback ended");
        };

        const handleTimeUpdate = () => {
            if (currentState && audio.currentTime && audio.duration) {
                setCurrentState({
                    ...currentState,
                    position: audio.currentTime * 1000,
                    duration: audio.duration * 1000,
                });
            }
        };

        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("timeupdate", handleTimeUpdate);

        return () => {
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
        };
    }, [currentState]);

    // Original effect to fetch user profile for premium status
    useEffect(() => {
        console.log(
            `PlaybackProvider Profile Effect: SDK=${!!regularSdk}, Auth=${isAuthenticated}, Premium=${isPremium}, Fetched=${profileFetched}`,
        )
        if (regularSdk && isAuthenticated && !profileFetched) {
            console.log("PlaybackProvider: Authenticated and profile not yet fetched. Fetching user profile...")
            regularSdk.currentUser
                .profile()
                .then((profile: UserProfile) => {
                    const premiumStatus = profile.product === "premium"
                    console.log(
                        `PlaybackProvider: User product type is '${profile.product}'. Setting isPremium: ${premiumStatus}`,
                    )
                    setIsPremium(premiumStatus)
                    setProfileFetched(true)
                })
                .catch((err) => {
                    console.error("PlaybackProvider: Failed to fetch user profile:", err)
                    setIsPremium(false)
                    setProfileFetched(true)
                })
        } else if (!isAuthenticated) {
            if (isPremium !== false) {
                console.log("PlaybackProvider: User not authenticated. Resetting premium status.")
                setIsPremium(false)
            }
            if (profileFetched) {
                setProfileFetched(false)
            }
        }
    }, [regularSdk, isAuthenticated, profileFetched, isPremium])

    // Original effect for player initialization
    useEffect(() => {
        const handleSdkReady = () => {
            console.log("PlaybackProvider: Detected 'spotify-sdk-ready' event.")
            setIsExternalSdkReady(true)
        }

        if (window.spotifySDKReady) {
            setIsExternalSdkReady(true)
            console.log("PlaybackProvider: SDK was already ready on mount.")
        } else {
            document.addEventListener("spotify-sdk-ready", handleSdkReady)
        }

        if (regularSdk && isAuthenticated && isExternalSdkReady && !player) {
            console.log("PlaybackProvider: Conditions met (Authenticated)! Initializing Player...")
            const setupPlayer = async () => {
                const tokenInfo = await regularSdk.getAccessToken()
                if (!tokenInfo?.access_token) {
                    return
                }

                const accessToken = tokenInfo.access_token
                console.log("Playback SDK: Using token starting with:", accessToken.substring(0, 10))

                const spotifyPlayer = new Spotify.Player({
                    name: "PlayLiMana Web Player",
                    getOAuthToken: (cb: (arg0: string) => void) => {
                        regularSdk.getAccessToken().then((freshTokenInfo) => {
                            if (freshTokenInfo?.access_token) {
                                cb(freshTokenInfo.access_token)
                            } else {
                                console.error("getOAuthToken: Failed to get fresh token!")
                                cb("")
                            }
                        })
                    },
                    volume: 0.5,
                })

                // Event Listeners
                spotifyPlayer.addListener("ready", ({ device_id }: { device_id: string }) => {
                    console.log("%cPlayer Ready!", "color: green", device_id)
                    setDeviceId(device_id)
                    setIsPlayerReady(true)
                    setPlayer(spotifyPlayer)
                })

                spotifyPlayer.addListener("not_ready", ({ device_id }: { device_id: string }) => {
                    console.log("%c Player not ready!", device_id)
                })

                spotifyPlayer.addListener("initialization_error", ({ message }: { message: string }) => {
                    console.log("%c Player initialization_error!", message)
                })

                spotifyPlayer.addListener("authentication_error", ({ message }: { message: string }) => {
                    console.log("%c Player authentication_error!", message)
                })

                spotifyPlayer.addListener("account_error", ({ message }: { message: string }) => {
                    console.error("%cPlayer Account Error!", "color: red", message)
                    setIsPlayerReady(false)
                    setIsPremium(false)
                })

                spotifyPlayer.addListener("player_state_changed", (state: Spotify.PlaybackState | null) => {
                    const timestamp = Date.now()
                    console.log(
                        `%c[${timestamp}] PlaybackContext: player_state_changed RECEIVED:`,
                        "color: blue; font-weight: bold;",
                        state,
                    )
                    if (state) {
                        console.log(`%c[${timestamp}]   ├─ Paused: ${state.paused}`, "color: blue")
                        console.log(`%c[${timestamp}]   ├─ Position: ${state.position}`, "color: blue")
                        console.log(`%c[${timestamp}]   ├─ Duration: ${state.duration}`, "color: blue")
                        console.log(`%c[${timestamp}]   ├─ Track ID: ${state.track_window?.current_track?.id}`, "color: blue")
                        console.log(`%c[${timestamp}]   └─ Full State Object:`, "color: blue", JSON.parse(JSON.stringify(state)))

                        // Clear custom audio state when Spotify starts playing
                        //if (!state.paused && customTrackInfo) {
                            // console.log("Spotify started playing, clearing custom audio state")
                            // setCustomTrackInfo(null)
                            // setIsCustomAudioPlaying(false)
                            // if (customAudioRef.current) {
                            //     customAudioRef.current.pause()
                            //     customAudioRef.current.src = ""
                            // }
                            //stopCustomAudio();
                            //clearQueue();
                        //}
                        if (!state.paused) {
                            if (!customAudioRef.current?.paused) {
                                customAudioRef.current.pause();
                            }
                            stopCustomAudio();
                            clearQueue();
                        }
                    } else {
                        console.log(`%c[${timestamp}]   └─ State is null`, "color: blue")
                    }

                    // Always update state from Spotify when we receive it
                    setCurrentState(state)
                })

                console.log("PlaybackProvider: Connecting player...")
                spotifyPlayer
                    .connect()
                    .then((success) => {
                        console.log("Successful connection %c", success)
                    })
                    .catch((err) => console.error("Player connect error:", err))
            }

            setupPlayer()
        } else {
            console.log(
                "PlaybackProvider: Waiting or not initializing. regularSdk:",
                !!regularSdk,
                "isAuthenticated:",
                isAuthenticated,
                "isExternalSdkReady:",
                isExternalSdkReady,
                "player exists:",
                !!player,
            )
            if (!isAuthenticated && (player || isPlayerReady || deviceId)) {
                player?.disconnect()
                setPlayer(undefined)
                setIsPlayerReady(false)
                setDeviceId(null)
                setCurrentState(null)
            }
        }

        return () => {
            document.removeEventListener("spotify-sdk-ready", handleSdkReady)
            console.log("PlaybackProvider: Cleaning up effect.")
        }
    }, [regularSdk, isAuthenticated, isExternalSdkReady, player, customTrackInfo])

    return (
        <PlaybackContext.Provider
            value={{
                // Original Spotify properties
                player,
                isPlayerReady,
                deviceId,
                isPremium,
                currentState,
                // Custom audio properties
                playCustomAudio,
                stopCustomAudio,
                customAudioRef,
                isCustomAudioPlaying,
                customTrackInfo,
                pauseCustomAudio,
                resumeCustomAudio,
                audiusQueue,
                queueIndex,
                queueNext,
                queuePrev,
                clearQueue,
                loadAudiusQueue,
                // Setters for compatibility
                setCurrentState,
                setIsPlayerReady,
                setDeviceId,
                setPlayer,
                setIsPremium,
                // New method
                pauseSpotifyPlayback,
            }}
        >
            {children}
            {/* Hidden audio element for custom playback */}
            <audio ref={customAudioRef} style={{ display: "none" }} preload="auto" />
        </PlaybackContext.Provider>
    )
}

// Hook with proper typing
const usePlayback = (): PlaybackContextState => {
    const context = useContext(PlaybackContext)
    if (context === undefined) {
        throw new Error("usePlayback must be used within a PlaybackProvider")
    }
    return context
}

export { PlaybackProvider, usePlayback }
