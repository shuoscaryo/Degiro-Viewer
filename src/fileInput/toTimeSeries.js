import { HEADER, CSV_TYPES } from '/src/defines.js';

function initTimeSeriesElement()
{
  return {
    x: [],
    y: [],
  };
}

export default function toTimeSeries(csv)
{
  // Converts csv to type -> list of operations
  const timeSeries = {};
  for(const row of csv)
  {
    // Operations are stored as a dict of ISIN -> list of operations
    if (row[HEADER.TYPE] === CSV_TYPES.OPERATION)
    {
      // If type not already in dict add it
      if ((row[HEADER.TPYE] in timeSeries) === false)
        timeSeries[row[HEADER.TYPE]] = {};
      const isin = row[HEADER.CONTENT][HEADER.ISIN];
      // Initialize isin if not existing
      if ((isin in timeSeries[row[HEADER.TYPE]]) === false)
        timeSeries[row[HEADER.TYPE]][isin] = initTimeSeriesElement();
      // Push to the list
      timeSeries[row[HEADER.TYPE]][isin].x.push(row[HEADER.DATE]);
      timeSeries[row[HEADER.TYPE]][isin].y.push(row[HEADER.CONTENT][HEADER.SHARE_COUNT]);
    }
    else
    {
      // If type not already in dict add it
      if ((row[HEADER.TPYE] in timeSeries) === false)
        timeSeries[row[HEADER.TYPE]] = initTimeSeriesElement();
      timeSeries[row[HEADER.TYPE]].x.push(row[HEADER.DATE]);
      timeSeries[row[HEADER.TYPE]].y.push(row[HEADER.CONTENT][HEADER.SHARE_COUNT]);
    }
  }
  return timeSeries;
}
