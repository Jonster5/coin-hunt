import { Raxis } from 'raxis';
import { SpawnPlayerSignal } from './player';

export class LevelDifficultyTracker {
	difficulty = 1;
}

export class ClearLevelSignal {}
export class CreateNextLevelSignal {}

function createNextLevel(r: Raxis) {
	if (r.noneAvailableOf(CreateNextLevelSignal)) return;

	r.dispatch(new SpawnPlayerSignal());
}

export const LevelPlugin = new Raxis.Builder()
	.useGlobal(LevelDifficultyTracker)
	.useEvent(ClearLevelSignal)
	.useEvent(CreateNextLevelSignal)
	.useUpdate('preUpdate', createNextLevel);
