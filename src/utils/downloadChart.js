import { chart_title, chart_subtitle } from "./elements.js";

export function downloadChart(chart) {
  // Get the chart's canvas element.
  const sourceCanvas = chart.canvas || chart;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  
  // Define padding values.
  const sidePadding = 15;   // left/right padding remains 25px
  const topPadding = 65;    // top padding is increased to 45px (25 + 20)
  const bottomPadding = 15; // bottom padding remains 25px

  // Retrieve label text if subtitle is provided (as an element id)
  let labelText = [];
  if (chart_subtitle.textContent !== "") {
    const labelElement = chart_subtitle;
    if (labelElement) {
      labelText = labelElement.innerHTML.split("<br>");
      labelText = labelText.filter(x => x != "");
    }
  }
  
  for (let i = 0; i < labelText.length; i ++) {
    labelText[i] = labelText[i].replace("<strong>", "")
    labelText[i] = labelText[i].replace("</strong>", "")
  }

  // Retrieve title text 
  let titleText = chart_title.textContent;;

  let fileName = `${titleText.toLowerCase().replaceAll(" ", "-")}.png`

  // Helper function to draw the title and label lines, then trigger the download.
function drawTextAndDownload(ctx, canvasToDownload) {
  // Layout + style
  const titleFont = 'bold 1rem sans-serif';
  const labelFont = '15px sans-serif';
  const titleLineHeight = 22;   // px
  const labelLineHeight = 18;   // px
  const innerTopPadding = 10;   // top inset within the header band

  const hasTitle = !!titleText;
  const hasLabels = Array.isArray(labelText) && labelText.length > 0;

  // Total vertical space needed for text block
  const needed =
    (hasTitle ? titleLineHeight : 0) +
    (hasLabels ? labelText.length * labelLineHeight : 0);

  // Start Y so that the block fits inside [0, topPadding)
  // Leaves a small top inset and ensures the last line stays above chart top.
  let y = Math.max(innerTopPadding, topPadding - needed - 5);

  // Draw title (if any)
  if (hasTitle) {
    ctx.fillStyle = 'black';
    ctx.font = titleFont;
    ctx.textBaseline = 'top';
    ctx.fillText(titleText, sidePadding, y);
    y += titleLineHeight;
  }

  // Draw each label line (if any)
  if (hasLabels) {
    ctx.fillStyle = 'grey';
    ctx.font = labelFont;
    ctx.textBaseline = 'top';
    for (const line of labelText) {
      ctx.fillText(line, sidePadding, y);
      y += labelLineHeight;
    }
  }

  // Trigger download
  const imageData = canvasToDownload.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = imageData;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


  // Load the watermark image.
  const watermark = new Image();
  watermark.src = 'assets/img/logo/nisra-only-colour.png';

  watermark.onload = function() {
    const wmWidth = watermark.width;
    const wmHeight = watermark.height;

    // New canvas dimensions:
    // width: original width + left & right sidePadding.
    // height: topPadding + original chart height + bottomPadding + watermark height.
    const newWidth = width + sidePadding * 2;
    const newHeight = topPadding + height + bottomPadding + wmHeight;

    const extendedCanvas = document.createElement('canvas');
    extendedCanvas.width = newWidth;
    extendedCanvas.height = newHeight;
    const ctx = extendedCanvas.getContext('2d');

    // Fill the entire canvas with a white background.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newWidth, newHeight);

    // Draw the original chart offset by sidePadding and topPadding.
    ctx.drawImage(sourceCanvas, sidePadding, topPadding);

    // Place the watermark at the bottom right of the chart area.
    // The watermark is drawn within the padded area below the chart.
    const x = sidePadding + (width - wmWidth);
    const y = topPadding + height;
    ctx.drawImage(watermark, x, y, wmWidth, wmHeight);

    // Draw the optional title and/or label, then trigger the download.
    drawTextAndDownload(ctx, extendedCanvas);
  };

  // Fallback: if the watermark fails to load, export the chart with padding and text only.
  watermark.onerror = function(error) {
    console.error("Watermark image failed to load:", error);
    const newWidth = width + sidePadding * 2;
    const newHeight = topPadding + height + bottomPadding;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, newWidth, newHeight);
    tempCtx.drawImage(sourceCanvas, sidePadding, topPadding);

    if (titleText || labelText) {
      if (titleText && labelText) {
        tempCtx.fillStyle = 'grey';
        tempCtx.font = '15px sans-serif';
        tempCtx.textBaseline = 'bottom';
        tempCtx.fillText(labelText, sidePadding, topPadding);
        tempCtx.fillStyle = 'black';
        tempCtx.font = '1rem sans-serif';
        tempCtx.textBaseline = 'bottom';
        tempCtx.fillText(titleText, sidePadding, topPadding - 10);
      } else if (labelText) {
        tempCtx.fillStyle = 'grey';
        tempCtx.font = '15px sans-serif';
        tempCtx.textBaseline = 'bottom';
        tempCtx.fillText(labelText, sidePadding, topPadding);
      } else if (titleText) {
        tempCtx.fillStyle = 'black';
        tempCtx.font = '1rem sans-serif';
        tempCtx.textBaseline = 'bottom';
        tempCtx.fillText(titleText, sidePadding, topPadding - 10);
      }
    }

    const imageData = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
}

