
import { PartyState, PlayerContextType } from '../types';

let lastSeekTime = 0;

export const synchronizePlayback = (
    partyState: PartyState,
    player: PlayerContextType,
    timeOffset: number | null
) => {
    if (timeOffset === null || !partyState) return;

    const { currentSong, isPlaying, currentTime, lastStateUpdate, partyId, currentQueue } = partyState;

    if (currentSong?.id !== player.currentSong?.id) {
        if (currentSong) {
            console.log("[PartySync] Switching song to match host");
            player.playSong(currentSong, currentQueue, { type: 'party', id: partyId });
            if (player.playbackRate !== 1) player.setPlaybackRate(1);
            return;
        }
    }

    const now = Date.now();
    const localStateUpdateTime = lastStateUpdate - timeOffset; 
    const secondsPassedSinceUpdate = Math.max(0, (now - localStateUpdateTime) / 1000);
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
        return;
    }

    if (isPlaying && player.isPlaying && currentSong?.id === player.currentSong?.id) {
        const drift = estimatedHostTime - player.currentTime;
        const absDrift = Math.abs(drift);

        if (absDrift < 0.35) {
            if (player.playbackRate !== 1) {
                player.setPlaybackRate(1);
            }
            return;
        }

        if (absDrift > 3.0) {
            if (now - lastSeekTime > 2000) {
                console.log(`[PartySync] Large drift (${drift.toFixed(2)}s). Seeking.`);
                player.seek(estimatedHostTime);
                lastSeekTime = now;
                if (player.playbackRate !== 1) player.setPlaybackRate(1);
            }
            return;
        } 
        
        const targetRate = drift > 0 ? 1.06 : 0.94; 
        
        if (Math.abs(player.playbackRate - targetRate) > 0.01) {
            player.setPlaybackRate(targetRate);
        }
    }
};
