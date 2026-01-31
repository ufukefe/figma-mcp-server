export function serializeRectangle(rectangle: RectangleNode): any {
    return {
        id: rectangle.id,
        type: rectangle.type,
        name: rectangle.name,
        x: rectangle.x,
        y: rectangle.y,
        width: rectangle.width,
        height: rectangle.height,
        parentId: rectangle.parent ? `${rectangle.parent.id}:${rectangle.parent.type}` : undefined,
    };
}
