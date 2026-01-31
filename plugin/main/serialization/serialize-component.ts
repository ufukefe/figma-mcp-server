export function serializeComponent(
    component: ComponentNode | ComponentSetNode,
    options: { includeProperties?: boolean } = {}
): any {
    const includeProperties = options.includeProperties ?? false;
    const properties = component.componentPropertyDefinitions;

    return {
        id: component.id,
        type: component.type,
        name: component.name,
        key: component.key,
        propertyCount: properties ? Object.keys(properties).length : 0,
        properties: includeProperties ? properties : undefined,
    };
}
