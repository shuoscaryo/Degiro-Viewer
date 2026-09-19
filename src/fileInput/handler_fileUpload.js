import * as utils from "./utils.js"
import {g} from '/src/globals.js'
import formatCsv from './formatCsv.js'
import toTimeSeries from './toTimeSeries.js'

export default async function handler_fileUpload(event)
{
  // Read the file as a list of dict
  const file = event.target.files[0];
  const text = await file.text();
  let csv = utils.parseCSV(text);

  csv = formatCsv(csv);
  // Create time series for each object
  const timeSeries = toTimeSeries(csv);
  console.log(timeSeries);
  g["timeSeries"] = timeSeries;
  // send event
  document.dispatchEvent(new CustomEvent("csvUpdate", {
    detail: {
      data: csv, timeSeries
    },
  }));
}
