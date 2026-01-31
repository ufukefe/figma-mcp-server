import { serializeNodeRef } from "./serialization";

export function serializePage(
    page: PageNode,
    options: { includeChildren?: boolean; maxChildren?: number } = {}
): any {
    // Default is token-efficient: don't dump children unless explicitly requested.
    const includeChildren = options.includeChildren ?? false;
    const maxChildren = options.maxChildren ?? 50;

    const children = page.children ?? [];

    return {
        id: page.id,
        name: page.name,
        childCount: children.length,
        children: includeChildren ? children.slice(0, maxChildren).map(serializeNodeRef) : undefined,
        childrenTruncated: includeChildren && children.length > maxChildren ? true : undefined,
    };
}
