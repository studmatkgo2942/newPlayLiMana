import SoundCloudAuthButton from "../../components/features/auth/SoundCloudAuthButton.tsx";


const SoundCloudUserProfile: React.FC = () => {
            const isSoundCloudConnected = false; // Replace with actual logic

            return (
                <tr>
                    <td>{/* Icon */}</td>
                    <td colSpan={isSoundCloudConnected ? 1 : 2}>
                        {isSoundCloudConnected ? <span>SoundCloud Connected</span> : <span>SoundCloud Not Linked</span>}
                    </td>
                    {isSoundCloudConnected && <td>User's SoundCloud Name</td>}
                    <td>
                        {isSoundCloudConnected ? (
                            <button>Disconnect SoundCloud</button>
                        ) : (
                            <SoundCloudAuthButton />
                        )}
                    </td>
                </tr>
            );
        };

        export default SoundCloudUserProfile;