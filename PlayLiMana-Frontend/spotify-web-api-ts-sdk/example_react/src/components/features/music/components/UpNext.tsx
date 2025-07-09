import type React from "react"

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
            ) : (
                <div className="up-next-placeholder">&nbsp;</div>
            )}
        </div>
    )
}