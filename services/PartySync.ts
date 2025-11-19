import { PartyState, PlayerContextType } from '../types';

export const synchronizePlayback = (
    partyState: PartyState,
    player: PlayerContextType,
    timeOffset: number | null
) => {
    if (timeOffset === null || !partyState) return;

    const { currentSong, isPlaying, currentTime, lastStateUpdate, partyId, currentQueue } = partyState;

    if (currentSong?.id !== player.currentSong?.id) {
        if (currentSong) {
            player.playSong(currentSong, currentQueue, { type: 'party', id: partyId });
            if (player.playbackRate !== 1) player.setPlaybackRate(1);
            return;
        }
    }

    const localStateUpdateTime = lastStateUpdate + timeOffset;
    const secondsPassedSinceUpdate = (Date.now() - localStateUpdateTime) / 1000;
    const estimatedHostTime = isPlaying ? (currentTime + secondsPassedSinceUpdate) : currentTime;

    if (isPlaying !== player.isPlaying) {
        if (currentSong?.id === player.currentSong?.id) {
            if (isPlaying) {
                player.seek(estimatedHostTime);
                player.togglePlay();
            } else {
                player.togglePlay();
            }
        }
    }

    if (isPlaying && player.isPlaying && currentSong?.id === player.currentSong?.id) {
        const drift = estimatedHostTime - player.currentTime;
        
        if (Math.abs(drift) > 2.0) {
            player.seek(estimatedHostTime);
            if (player.playbackRate !== 1) player.setPlaybackRate(1);
        } else if (Math.abs(drift) > 0.05) {
            const targetRate = drift > 0 ? 1.04 : 0.96;
            if (Math.abs(player.playbackRate - targetRate) > 0.01) {
                player.setPlaybackRate(targetRate);
            }
        } else {
            if (player.playbackRate !== 1) {
                player.setPlaybackRate(1);
            }
        }
    }
};