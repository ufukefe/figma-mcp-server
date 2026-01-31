import { convertToHex } from "utils/color-conversion";

export type NodeRef = {
    id: string;
    name: string;
    type: SceneNode["type"];
};

export type SerializeNodeOptions = {
    /**
     * `summary` is optimized for token usage. `full` adds more styling/layout fields,
     * but still avoids dumping the entire prototype chain.
     */
    format?: "summary" | "full";
    /**
     * Child traversal depth (0 = no children).
     */
    depth?: number;
    /**
     * Max children returned per node when `depth` > 0.
     */
    maxChildren?: number;
    /**
     * Max characters returned for TEXT nodes.
     */
    maxTextChars?: number;
    includeFills?: boolean;
    includeStrokes?: boolean;
};

type PaintSummary =
    | { type: "SOLID"; color: string; opacity?: number }
    | { type: Exclude<Paint["type"], "SOLID"> };

function isFigmaMixed(value: unknown): value is typeof figma.mixed {
    return value === figma.mixed;
}

function summarizePaint(paint: Paint): PaintSummary {
    if (paint.type === "SOLID") {
        const opacity = typeof paint.opacity === "number" ? paint.opacity : undefined;
        return {
            type: "SOLID",
            color: convertToHex({ ...paint.color, a: opacity ?? 1 }),
            opacity,
        };
    }

    return { type: paint.type };
}

function summarizePaints(
    paints: readonly Paint[] | typeof figma.mixed | undefined,
    maxItems: number
): { paints?: PaintSummary[]; mixed?: true; truncated?: true } {
    if (!paints) return {};
    if (isFigmaMixed(paints)) return { mixed: true };
    if (!Array.isArray(paints)) return {};

    const summarized = paints.slice(0, maxItems).map(summarizePaint);
    return {
        paints: summarized,
        truncated: paints.length > maxItems ? true : undefined,
    };
}

export function serializeNodeRef(node: SceneNode): NodeRef {
    return { id: node.id, name: node.name, type: node.type };
}

export function serializeNode(node: SceneNode, options: SerializeNodeOptions = {}): any {
    const format = options.format ?? "summary";
    const depth = options.depth ?? 0;
    const maxChildren = options.maxChildren ?? 50;
    const maxTextChars = options.maxTextChars ?? 200;
    const includeFills = options.includeFills ?? format === "full";
    const includeStrokes = options.includeStrokes ?? format === "full";

    const result: any = {
        id: node.id,
        name: node.name,
        type: node.type,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        visible: node.visible,
        locked: node.locked,
        parentId: node.parent?.id,
    };

    if (typeof (node as unknown as { rotation?: number }).rotation === "number") {
        result.rotation = (node as unknown as { rotation: number }).rotation;
    }

    if (node.type === "TEXT") {
        const textNode = node as TextNode;
        const characters = textNode.characters ?? "";
        const truncated = characters.length > maxTextChars;
        result.text = {
            characters: truncated ? `${characters.slice(0, maxTextChars)}…` : characters,
            truncated,
        };

        // `fontName` and `fontSize` can be `figma.mixed`
        const fontName = textNode.fontName;
        if (isFigmaMixed(fontName)) {
            result.text.fontName = "MIXED";
        } else if (fontName) {
            result.text.fontName = { family: fontName.family, style: fontName.style };
        }

        const fontSize = textNode.fontSize;
        result.text.fontSize = isFigmaMixed(fontSize) ? "MIXED" : fontSize;

        if (includeFills) {
            const summary = summarizePaints(
                textNode.fills as readonly Paint[] | typeof figma.mixed | undefined,
                3
            );
            if (summary.mixed) result.text.fillsMixed = true;
            if (summary.paints) result.text.fills = summary.paints;
            if (summary.truncated) result.text.fillsTruncated = true;
        }
    } else {
        if (includeFills && "fills" in node) {
            const summary = summarizePaints(
                (node as unknown as { fills: readonly Paint[] | typeof figma.mixed }).fills,
                3
            );
            if (summary.mixed) result.fillsMixed = true;
            if (summary.paints) result.fills = summary.paints;
            if (summary.truncated) result.fillsTruncated = true;
        }

        if (includeStrokes && "strokes" in node) {
            const summary = summarizePaints(
                (node as unknown as { strokes: readonly Paint[] | typeof figma.mixed }).strokes,
                3
            );
            if (summary.mixed) result.strokesMixed = true;
            if (summary.paints) result.strokes = summary.paints;
            if (summary.truncated) result.strokesTruncated = true;
        }
    }

    if (format === "full") {
        // Auto-layout / layout fields (only include if present on the node)
        const maybeLayout = node as unknown as Partial<{
            layoutMode: string;
            layoutWrap: string;
            itemSpacing: number;
            primaryAxisAlignItems: string;
            counterAxisAlignItems: string;
            paddingLeft: number;
            paddingRight: number;
            paddingTop: number;
            paddingBottom: number;
            layoutSizingHorizontal: string;
            layoutSizingVertical: string;
            cornerRadius: number | typeof figma.mixed;
            topLeftRadius: number;
            topRightRadius: number;
            bottomLeftRadius: number;
            bottomRightRadius: number;
        }>;

        if (typeof maybeLayout.layoutMode === "string") {
            result.layout = {
                mode: maybeLayout.layoutMode,
                wrap: maybeLayout.layoutWrap,
                itemSpacing: maybeLayout.itemSpacing,
                primaryAxisAlignItems: maybeLayout.primaryAxisAlignItems,
                counterAxisAlignItems: maybeLayout.counterAxisAlignItems,
                paddingLeft: maybeLayout.paddingLeft,
                paddingRight: maybeLayout.paddingRight,
                paddingTop: maybeLayout.paddingTop,
                paddingBottom: maybeLayout.paddingBottom,
                layoutSizingHorizontal: maybeLayout.layoutSizingHorizontal,
                layoutSizingVertical: maybeLayout.layoutSizingVertical,
            };
        }

        if ("cornerRadius" in maybeLayout && typeof maybeLayout.cornerRadius !== "undefined") {
            const cornerRadius = maybeLayout.cornerRadius;
            if (isFigmaMixed(cornerRadius)) {
                result.cornerRadius = "MIXED";
            } else if (typeof cornerRadius === "number") {
                result.cornerRadius = cornerRadius;
            } else if (
                typeof maybeLayout.topLeftRadius === "number" ||
                typeof maybeLayout.topRightRadius === "number" ||
                typeof maybeLayout.bottomLeftRadius === "number" ||
                typeof maybeLayout.bottomRightRadius === "number"
            ) {
                result.cornerRadius = {
                    topLeft: maybeLayout.topLeftRadius,
                    topRight: maybeLayout.topRightRadius,
                    bottomLeft: maybeLayout.bottomLeftRadius,
                    bottomRight: maybeLayout.bottomRightRadius,
                };
            }
        }

        if (node.type === "INSTANCE") {
            const instance = node as InstanceNode;
            result.instance = {
                mainComponentId: instance.mainComponent?.id,
                componentProperties: instance.componentProperties,
            };
        }

        if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
            const component = node as ComponentNode | ComponentSetNode;
            result.component = {
                key: component.key,
            };
        }
    }

    if (depth > 0 && "children" in node) {
        const children = (node as unknown as { children: readonly SceneNode[] }).children ?? [];
        result.childrenCount = children.length;
        result.children = children.slice(0, maxChildren).map((child) => {
            if (depth <= 1) {
                return serializeNodeRef(child);
            }
            // Depth recursion is still summary-focused to avoid token blowups.
            return serializeNode(child, {
                format: "summary",
                depth: depth - 1,
                maxChildren,
                maxTextChars,
                includeFills: false,
                includeStrokes: false,
            });
        });
        if (children.length > maxChildren) {
            result.childrenTruncated = true;
        }
    }

    return result;
}
