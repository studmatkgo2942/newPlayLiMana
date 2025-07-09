import type React from "react"
import { usePlayback } from "../../../../context/PlaybackContext";

interface UpNextProps {
    nextTrack: any
    activeServiceLogo: string | null
    ActiveServiceLogoComponent?: React.ComponentType<{ className?: string; title?: string }>
    activeServiceName: string
}

export const UpNext: React.FC<UpNextProps> = ({
                                                  nextTrack,
                                                  activeServiceLogo,
                                                  ActiveServiceLogoComponent,
                                                  activeServiceName,
                                              }) => {
    const nextTrackName = nextTrack?.name ?? ""
    const nextTrackImageUrl = nextTrack?.album?.images?.[0]?.url
    const { audiusQueue, queueIndex } = usePlayback();
    const nextAudius = audiusQueue[queueIndex + 1];

    return (
        <div className="up-next-group">
            {activeServiceLogo ? (
                <img
                    src={activeServiceLogo}
                    alt={`${activeServiceName} logo`}
                    className="up-next-service-logo"
                    title={`Playing via ${activeServiceName}`}
                />
            ) : ActiveServiceLogoComponent ? (
                <ActiveServiceLogoComponent
                    className="up-next-service-logo"
                    title={`Playing via ${activeServiceName}`}
                />
            ) : null}
            {nextTrack && activeServiceName === "spotify" ? (
                <>
                    <div className="up-next-details">
                        <span className="up-next-label">Up next:</span>
                        <p className="up-next-name" title={nextTrackName}>
                            {nextTrackName}
                        </p>
                    </div>
                    {nextTrackImageUrl ? (
                        <img src={nextTrackImageUrl} alt={nextTrackName} className="up-next-image" />
                    ) : (
                        <div className="up-next-image-placeholder">🎵</div>
                    )}
                </>
            ) : nextAudius && activeServiceName === "audius" ? (
                /* ---------- Audius branch ---------- */
                <>
                    <div className="up-next-details">
                        <span className="up-next-label">Up next:</span>
                        <p className="up-next-name" title={nextAudius.title}>
                            {nextAudius.title}
                        </p>
                    </div>
                    {nextAudius.coverUrl ? (
                        <img
                            src={nextAudius.coverUrl}
                            alt={nextAudius.title}
                            className="up-next-image"
                        />
                    ) : (
                        <div className="up-next-image-placeholder">🎵</div>
                    )}
                </>
            ) : (
                <div className="up-next-placeholder">&nbsp;</div>
            )}
        </div>
    )
}