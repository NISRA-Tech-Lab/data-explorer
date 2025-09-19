function downloadChart(chart, yLabel = null, title = null, btns = null) {
  // Get the chart's canvas element.
  const sourceCanvas = chart.canvas || chart;
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  
  // Define padding values.
  const sidePadding = 15;   // left/right padding remains 25px
  const topPadding = 65;    // top padding is increased to 45px (25 + 20)
  const bottomPadding = 15; // bottom padding remains 25px

  // Retrieve label text if yLabel is provided (as an element id)
  let labelText = null;
  if (yLabel !== null) {
    const labelElement = document.getElementById(yLabel);
    if (labelElement) {
      labelText = labelElement.textContent;
    }
  }

  // Retrieve title text if title is provided (as an element id)
  let titleText = null;
  if (title !== null) {
    const titleElement = document.getElementById(title);
    if (titleElement) {
      titleText = titleElement.textContent;
    }
  }

  // Retrieve button text if provided
  let buttonText = null;
  if (btns !== null) {
    const btns_div = document.getElementById(btns);
    const inputs = btns_div.getElementsByTagName("input");
    for (let i = 0; i < inputs.length; i ++) {
      if (inputs[i].checked) {
        buttonText = inputs[i].id.slice(inputs[i].id.indexOf("-") + 1);
        break;
      }
    }
  }

  if (buttonText !== null) {
    titleText += ` ${buttonText}`;
  }

  if (titleText !== null) {
    fileName = `${titleText.toLowerCase().replaceAll(" ", "-")}.png`
  } else {
    fileName = "ni-executive-spending-treemap.png"
  }

  // Helper function to draw the title and/or label text, then trigger the download.
  function drawTextAndDownload(ctx, canvasToDownload) {
    if (titleText && labelText) {
      // Draw yLabel: 15px sans-serif, grey.
      ctx.fillStyle = 'grey';
      ctx.font = '15px sans-serif';
      ctx.textBaseline = 'bottom';
      // The bottom edge of yLabel aligns with the top edge of the chart (topPadding).
      ctx.fillText(labelText, sidePadding, topPadding + 15);
      
      // Draw title: 1rem sans-serif, black, 10px above yLabel.
      ctx.fillStyle = 'black';
      ctx.font = 'bold 1rem sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(titleText, sidePadding, topPadding - 25);
    } else if (labelText) {
      ctx.fillStyle = 'grey';
      ctx.font = '15px sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(labelText, sidePadding, topPadding + 15);
    } else if (titleText) {
      ctx.fillStyle = 'black';
      ctx.font = 'bold 1rem sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(titleText, sidePadding, topPadding - 25);
    }
    
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