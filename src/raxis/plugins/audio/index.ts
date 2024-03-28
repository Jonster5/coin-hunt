import { Raxis } from '../..';
import { AudioManager } from './audiomanager';

export const AudioPlugin = new Raxis.Builder().useGlobal(AudioManager);
