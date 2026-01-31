export function serializeSceneNode(sceneNode: SceneNode): any {
    return {
        id: sceneNode.id,
        type: sceneNode.type,
        name: sceneNode.name,
        x: sceneNode.x,
        y: sceneNode.y,
        width: sceneNode.width,
        height: sceneNode.height,
        parentId: sceneNode.parent ? `${sceneNode.parent.id}:${sceneNode.parent.type}` : undefined,
    };
}
