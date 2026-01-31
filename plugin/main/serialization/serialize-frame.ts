import { serializeSceneNode } from "./serialize-scene-node";

export function serializeFrame(frame: FrameNode): any {
    return serializeSceneNode(frame);
}
