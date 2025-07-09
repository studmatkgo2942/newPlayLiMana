import type React from "react"
import { useEnhancedSearch } from "../../../context/EnhancedSearchContext"
import "./SearchSourceToggle.css"

const SearchSourceToggle: React.FC = () => {
    const { searchSource, setSearchSource } = useEnhancedSearch()

    return (
        <div className="search-source-toggle">
            <span className="search-source-label">Search in:</span>
            <div className="search-source-buttons">
                <button
                    className={`search-source-btn ${searchSource === "spotify" ? "active" : ""}`}
                    onClick={() => setSearchSource("spotify")}
                    title="Search Spotify only"
                >
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                        alt="Spotify"
                        className="source-icon"
                    />
                    Spotify
                </button>
                <button
                    className={`search-source-btn ${searchSource === "audius" ? "active" : ""}`}
                    onClick={() => setSearchSource("audius")}
                    title="Search Audius only"
                >
                    {/* Use a simple colored circle instead of the favicon to avoid text duplication */}
                    <div className="audius-icon-simple"></div>
                    Audius
                </button>
                <button
                    className={`search-source-btn ${searchSource === "both" ? "active" : ""}`}
                    onClick={() => setSearchSource("both")}
                    title="Search both platforms"
                >
                    Both
                </button>
            </div>
        </div>
    )
}

export default SearchSourceToggle
