import type React from "react"

interface TrackInfoProps {
    albumImageUrl?: string
    trackName: string
    artistName: string
    activeServiceLogo: string | null
    ActiveServiceLogoComponent?: React.ComponentType<{ className?: string; title?: string }>
    activeServiceName: string
}

export const TrackInfo: React.FC<TrackInfoProps> = ({
                                                        albumImageUrl,
                                                        trackName,
                                                        artistName,
                                                        activeServiceLogo,
                                                        ActiveServiceLogoComponent,
                                                        activeServiceName,
                                                    }) => {
    return (
        <div className="controller-section-left">
            {albumImageUrl ? (
                <img src={albumImageUrl} alt={trackName} className="controller-track-image" />
            ) : (
                <div className="controller-track-image-placeholder">🎵</div>
            )}
            <div className="controller-track-details">
                <p className="controller-track-name" title={trackName}>
                    {trackName || "No track playing"}
                </p>
                <p className="controller-track-artist" title={artistName}>
                    {artistName}
                </p>
            </div>
            {activeServiceLogo ? (
                <img
                    src={activeServiceLogo}
                    alt={`${activeServiceName} logo`}
                    className="current-track-service-logo"
                    title={`Playing via ${activeServiceName}`}
                />
            ) : ActiveServiceLogoComponent ? (
                <ActiveServiceLogoComponent
                    className="current-track-service-logo"
                    title={`Playing via ${activeServiceName}`}
                />
            ) : null}
        </div>
    )
}