
import { useEffect, useState } from 'react';

export function useAppleMusic(devToken: string) {
    const [musicKitInstance, setMusicKitInstance] = useState<MusicKit.MusicKitInstance | null>(null);

    useEffect(() => {
        document.addEventListener('musickitloaded', () => {
            const MusicKit = (window as any).MusicKit;
            MusicKit.configure({
                developerToken: devToken,
                app: {
                    name: 'PlayLiMana',
                    build: '1.0.0',
                },
            });
            setMusicKitInstance(MusicKit.getInstance());
        });
    }, [devToken]);

    return musicKitInstance;
}
