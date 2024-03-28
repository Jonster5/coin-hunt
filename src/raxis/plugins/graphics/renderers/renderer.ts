import { GlobalTransform } from '../../transform';
import { Camera2d } from '../camera';

export interface Renderer {
	render(camera: Camera2d, cgt: GlobalTransform): void;
}
