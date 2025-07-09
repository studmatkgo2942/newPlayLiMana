import {useImperativeHandle, useState, forwardRef, useEffect} from "react"
import type {Playlist} from "../../../models/playlist"
import {usePlaylists} from "../../../hooks/usePlaylists"
import styles from "./popup-dialog.module.css"
import Spinner from "../Spinner/Spinner"
import {generateQRCode} from "../../../utils/qrcode.util"
import QRCodeImage from "../QRCodeImage/QRCodeImage"

export enum PopupState {
    HIDDEN = -1,
    ERROR = 0,
    DELETE = 1,
    COPY = 2,
    SHARE = 3,
    EXPORT = 4,
}

export interface PopupDialogRef {
    closePopup: () => void
    goToDeletePage: (playlist: Playlist) => void
    goToCopyPage: (playlist: Playlist) => void
    goToSharePage: (playlist: Playlist) => void
    goToExportPage: (playlist: Playlist) => void
}

interface PopupDialogProps {
    onDeleteInitiated?: () => void
    onDeleteSuccess?: () => void
    onCopySuccess?: (newPlaylist: Playlist) => void
    onExportSuccess?: () => void
}

const PopupDialog = forwardRef<PopupDialogRef, PopupDialogProps>(
    ({onDeleteInitiated, onDeleteSuccess, onCopySuccess, onExportSuccess}, ref) => {
        const [popupState, setPopupState] = useState<PopupState>(PopupState.HIDDEN)
        const [playlist, setPlaylist] = useState<Playlist | null>(null)
        const [copied, setCopied] = useState(false)
        const [deleteSuccess, setDeleteSuccess] = useState(false)
        const [qrCodeSrc, setQrCodeSrc] = useState<string>("")

        const {remove, copy} = usePlaylists()

        const shareUrl = playlist ? `https://specijalci.ddns.net/playlist/${playlist.playlistId}` : ""

        useEffect(() => {
            if (popupState === PopupState.COPY && playlist && !copy.isPending && !copy.isSuccess) {
                handleCopy()
            }
        }, [popupState, playlist])

        useEffect(() => {
            if (popupState === PopupState.SHARE && playlist) {
                generateQRCode(shareUrl).then(setQrCodeSrc)
            } else {
                setQrCodeSrc("")
            }
        }, [popupState, playlist])

        useImperativeHandle(ref, () => ({
            closePopup,
            goToDeletePage: (pl: Playlist) => {
                console.log("goToDeletePage with playlist: " + pl)
                setPlaylist(pl)
                setPopupState(PopupState.DELETE)
            },
            goToCopyPage: (pl: Playlist) => {
                console.log("goToDeletePage with playlist: " + pl)
                setPlaylist(pl)
                setPopupState(PopupState.COPY)
            },
            goToSharePage: (pl: Playlist) => {
                console.log("goToDeletePage with playlist: " + pl)
                setPlaylist(pl)
                setPopupState(PopupState.SHARE)
            },
            goToExportPage(pl: Playlist) {
                console.log("goToExportPage with playlist: " + pl)
                setPlaylist(pl)
                setPopupState(PopupState.EXPORT)
            },
        }))

        const closePopup = () => {
            const wasExportState = popupState === PopupState.EXPORT
            setPopupState(PopupState.HIDDEN)
            if (deleteSuccess) {
                onDeleteSuccess?.()
            }
            if (wasExportState) {
                onExportSuccess?.()
            }
            setDeleteSuccess(false)
            copy.reset()
            setPlaylist(null)
        }

        const handleDelete = () => {
            if (!playlist) return
            onDeleteInitiated?.()
            remove.mutate(playlist.playlistId!, {
                onSuccess: () => {
                    setDeleteSuccess(true)
                },
                onError: (err) => {
                    console.error("Failed to delete playlist:", err)
                },
            })
        }

        const handleCopy = () => {
            if (!playlist) return
            copy.mutate(playlist.playlistId!, {
                onSuccess: () => {
                    onCopySuccess?.(playlist)
                },
                onError: (err) => {
                    console.error("Failed to copy playlist:", err)
                },
            })
        }

        const handleShare = async () => {
            if (!shareUrl) return
            try {
                await navigator.clipboard.writeText(shareUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch (err) {
                console.error("Copy failed:", err)
            }
        }

        if (popupState === PopupState.HIDDEN || !playlist) return null

        return (
            <div className={styles.popupOverlay}>
                <div className={styles.popup}>
                    {popupState === PopupState.DELETE && (
                        <>
                            <div className={styles.popupHeader}>
                                <h2>Delete Playlist</h2>
                            </div>
                            <div className={styles.popupBody}>
                                {!deleteSuccess ? (
                                    <>
                                        <p>
                                            Are you sure you want to delete <b>{playlist.playlistName}</b>?
                                        </p>
                                        <div className={styles.popupFooter}>
                                            <button onClick={closePopup} className={styles.backButton}>
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                disabled={remove.isPending}
                                                className={styles.okButton}
                                                style={{opacity: remove.isPending ? 0.5 : 1}}
                                            >
                                                {remove.isPending ? <Spinner/> : "Yes"}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p style={{color: "green"}}>Playlist deleted successfully.</p>
                                        <div className={styles.popupFooter}>
                                            <button onClick={closePopup}
                                                    className={`${styles.okButton} ${styles.singleButton}`}>
                                                OK
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {popupState === PopupState.COPY && (
                        <>
                            <div className={styles.popupHeader}>
                                <h2>Copy Playlist</h2>
                            </div>
                            <div className={styles.popupBody}>
                                {!copy.isSuccess ? (
                                    <>
                                        <p>Copying playlist...</p>
                                        <div className={styles.popupFooter}>
                                            <button className={`${styles.okButton} ${styles.singleButton}`} disabled>
                                                <Spinner/>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p style={{color: "green"}}>Playlist copied successfully.</p>
                                        <div className={styles.popupFooter}>
                                            <button onClick={closePopup}
                                                    className={`${styles.okButton} ${styles.singleButton}`}>
                                                OK
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {popupState === PopupState.SHARE && (
                        <>
                            <div className={styles.popupHeader}>
                                <h2>Share Playlist</h2>
                            </div>
                            <div className={styles.popupBody}>
                                <div style={{display: "flex", gap: "10px", marginBottom: "20px"}}>
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        style={{
                                            flexGrow: 1,
                                            padding: "8px",
                                            borderRadius: "5px",
                                            border: "1px solid #ccc",
                                        }}
                                    />
                                    <button onClick={handleShare} className={styles.popupButton}>
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>

                                {qrCodeSrc && (
                                    <div style={{display: "flex", justifyContent: "center", marginBottom: "20px"}}>
                                        <QRCodeImage src={qrCodeSrc} size={180} name={playlist.playlistName}/>
                                    </div>
                                )}

                                <div className={styles.popupFooter}>
                                    <button onClick={closePopup}
                                            className={`${styles.backButton} ${styles.singleButton}`}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {popupState === PopupState.EXPORT && (
                        <>
                            <div className={styles.popupHeader}>
                                <h2>Export to Spotify</h2>
                            </div>
                            <div className={styles.popupBody}>
                                <div style={{textAlign: "center", padding: "20px 0"}}>
                                    <div style={{fontSize: "48px", color: "#1DB954", marginBottom: "16px"}}>✓</div>
                                    <p style={{color: "green", fontSize: "16px", marginBottom: "8px"}}>
                                        Playlist exported successfully!
                                    </p>
                                    <p style={{color: "#666", fontSize: "14px"}}>
                                        <b>{playlist.playlistName}</b> has been created in your Spotify account.
                                    </p>
                                </div>
                                <div className={styles.popupFooter}>
                                    <button onClick={closePopup}
                                            className={`${styles.okButton} ${styles.singleButton}`}>
                                        OK
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    },
)

export default PopupDialog