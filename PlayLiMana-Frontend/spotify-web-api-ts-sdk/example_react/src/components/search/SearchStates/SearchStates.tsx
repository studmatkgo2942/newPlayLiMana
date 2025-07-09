import type React from "react"
import "./SearchStates.css"

interface LoadingStateProps {
    isLoading: boolean
    searchSource?: "spotify" | "audius" | "both"
}

export const LoadingState: React.FC<LoadingStateProps> = ({isLoading, searchSource = "spotify"}) => {
    if (!isLoading) return null

    const getSearchSourceText = () => {
        switch (searchSource) {
            case "spotify":
                return "Spotify"
            case "audius":
                return "Audius"
            case "both":
                return "Spotify & Audius"
            default:
                return "music platforms"
        }
    }

    return <div className="loading-text">Searching {getSearchSourceText()}...</div>
}

interface ErrorStateProps {
    error: string | null
    isLoading: boolean
}

export const ErrorState: React.FC<ErrorStateProps> = ({error, isLoading}) => {
    if (!isLoading && error) {
        return <div className="error-message">Error: {error}</div>
    }
    return null
}

interface SearchPromptProps {
    hasQuery: boolean
    searchSource?: "spotify" | "audius" | "both"
}

export const SearchPrompt: React.FC<SearchPromptProps> = ({hasQuery, searchSource}) => {
    if (!hasQuery) {
        return (
            <div className="search-prompt">
                <p>Use the search bar above to find your favorite music.</p>
                {searchSource === "both" && <p>You can search Spotify, Audius, or both platforms simultaneously.</p>}
            </div>
        )
    }
    return null
}

interface NoResultsProps {
    hasQuery: boolean
    hasResults: boolean
    query: string
    searchSource?: "spotify" | "audius" | "both"
}

export const NoResults: React.FC<NoResultsProps> = ({hasQuery, hasResults, query, searchSource = "spotify"}) => {
    if (hasQuery && !hasResults) {
        const getSearchSourceText = () => {
            switch (searchSource) {
                case "spotify":
                    return "Spotify"
                case "audius":
                    return "Audius"
                case "both":
                    return "Spotify & Audius"
                default:
                    return "music platforms"
            }
        }

        return (
            <div className="no-results">
                <p>No results found for "{decodeURIComponent(query || "")}" on {getSearchSourceText()}.</p>
                <p>Try searching for something else{searchSource === "both" ? " or switching search sources" : ""}.</p>
            </div>
        )
    }
    return null
}