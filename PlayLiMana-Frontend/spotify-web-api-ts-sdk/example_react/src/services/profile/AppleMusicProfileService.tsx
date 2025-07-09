import {useState} from "react";
import {useAppleMusic} from "../../hooks/UseAppleMusic.ts";


export function AppleMusicProfileService() {

    const developerToken = import.meta.env.VITE_APPLE_MUSIC_DEV_TOKEN;
    const music = useAppleMusic(developerToken);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [userToken, setUserToken] = useState<string | null>(null);

    const handleAuthorize = async () => { /* ... */
    };
    const handleUnauthorize = () => { /* ... */
    };

    return (
        <tr>
            <td><img src="https://upload.wikimedia.org/wikipedia/commons/5/59/Apple_Music_Icon.svg" width={32}
                     height={32} alt="Apple Music Icon"/></td>
            <td colSpan={2}>{isAuthorized ? <span>Apple Music Linked</span> : <span>Apple Music Not Linked</span>}</td>
            <td>{isAuthorized ? <button onClick={handleUnauthorize}>Unlink Account</button> :
                <button onClick={handleAuthorize}>Link Apple Music</button>}</td>
        </tr>
    );
}