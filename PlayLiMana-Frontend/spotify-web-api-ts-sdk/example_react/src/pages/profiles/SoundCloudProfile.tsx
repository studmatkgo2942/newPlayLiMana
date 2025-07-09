import { useEffect, useState } from 'react';

const SoundCloudProfile = () => {
    const [profile, setProfile] = useState<any>(null);
    const token = localStorage.getItem('soundcloud_token');

    useEffect(() => {
        if (!token) return;

        const fetchProfile = async () => {
            const response = await fetch(`https://api.soundcloud.com/me`, {
                headers: {
                    Authorization: `OAuth ${token}`
                }
            });

            const data = await response.json();
            setProfile(data);
        };

        fetchProfile();
    }, [token]);

    return profile ? (
        <div className="p-4 text-center">
            <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold">{profile.username}</h2>
            <p>{profile.full_name}</p>
            <p>{profile.city}</p>
        </div>
    ) : (
        <p>Loading SoundCloud profile...</p>
    );
};

export default SoundCloudProfile;