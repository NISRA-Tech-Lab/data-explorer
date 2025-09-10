import { wrapLabel } from "./wrapLabel.js";

// Horizontal Y-axis label plugin (centred above axis line)
export const yAxisLabelPlugin = {
    id: "yAxisLabel",
    afterDraw(chart, _args, opts) {
        const { ctx, chartArea, scales } = chart;
        const yScale = scales.y || scales.y1;
        if (!yScale || !opts?.text) return;

        const lines = wrapLabel(opts.text, opts.maxChars || 12);
        const font = Chart.helpers.toFont(opts.font || Chart.defaults.font);

        ctx.save();
        ctx.font = font.string;
        ctx.fillStyle = opts.color || Chart.defaults.color || "#6c757d";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        // Anchor to the actual Y-axis line (right edge for left axis, left edge for right axis)
        const axisX = (yScale.options.position === "right") ? yScale.left : yScale.right;
        const x = (typeof opts.x === "number") ? opts.x : axisX;

        // Starting Y just above the chart
        let y = chartArea.top - (opts.offset ?? 6);
        const lineHeight = font.lineHeight || font.size * 1.25;

        // Draw upward stacked lines
        for (let i = lines.length - 1; i >= 0; i--) {
            ctx.fillText(lines[i], x, y);
            y -= lineHeight;
        }

        ctx.restore();
    }
};