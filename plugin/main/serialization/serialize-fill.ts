import { convertToHex } from "utils/color-conversion";

export function serializeFill(fill: Paint[] | typeof figma.mixed): any {
    if (!Array.isArray(fill)) {
        return { mixed: true };
    }

    return fill.map((item) => {
        if (item.type === "SOLID") {
            return {
                type: "SOLID",
                color: convertToHex({ ...item.color, a: item.opacity ?? 1 }),
                opacity: item.opacity,
            };
        }
        // Keep it compact for token usage.
        return { type: item.type };
    });
}
