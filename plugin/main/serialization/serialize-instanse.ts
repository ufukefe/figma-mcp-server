export function serializeInstance(instance: InstanceNode): any {
    return {
        id: instance.id,
        type: instance.type,
        name: instance.name,
        x: instance.x,
        y: instance.y,
        parentId: instance.parent ? `${instance.parent.id}` : undefined,
        properties: instance.componentProperties,
    };
}
