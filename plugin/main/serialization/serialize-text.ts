import { convertToHex } from "utils/color-conversion";
import { serializeFill } from "./serialize-fill";

export function serializeText(text: TextNode): any {
    return {
        id: text.id,
        type: text.type,
        name: text.name,
        x: text.x,
        y: text.y,
        width: text.width,
        height: text.height,
        fontSize: text.fontSize,
        fontName: text.fontName,
        fontColor: serializeFill(text.fills as Paint[]),
        parentId: text.parent ? `${text.parent.id}:${text.parent.type}` : undefined,
    };
}
