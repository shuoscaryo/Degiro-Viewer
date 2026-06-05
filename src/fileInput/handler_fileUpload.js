import * as utils from "./utils.js"
import { HEADER, IN_CSV_HEADER, CSV_TYPES } from '/src/defines.js';
import {g} from '/src/globals.js'

// List with with regex that if match, will be deleted
const ROWS_TO_DROP = [
  /Cambio de Divisa/i,
  /^Transferir \w+ su Cuenta de Efectivo en flatexDegiro Bank:/i,
  /Degiro Cash Sweep Transfer/i,
];

// Dict for parsing rows of input csv into a prettier format. Each element is:
// key: {
//  regexList: [list with all the regex that match this],
//  func: function that takes the row from input csv, and a list with the
//    result of all regex matches (null for no match), and returns whatever is
//    wanted for each type of row.
// }
const FORMATS_DICT = {
  [CSV_TYPES.ANUAL_FEE] : {
    regexList: [
      /^Comisión de conectividad con el mercado/i,
    ],
    func: (row, matches) => ({
      [HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.DEGIRO_GIFT]: {
    regexList: [
      /^Ingresos por Préstamo de Valores/i,
      /^Promoción DEGIRO reembolso/i,
      /^Flatex Interest Income$/i,
    ],
    func: (row, matches) => ({
      [HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.DEPOSIT]: {
    regexList: [
      /^flatex Deposit/i,
      /^Flatex Instant Deposit/i,
    ],
    func: (row, matches) => ({
      [HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.DIVIDEND_RETENTION]: {
    regexList: [
      /^Retención del dividendo$/i,
    ],
    func: (row, matches) => ({
      [HEADER.STOCK_NAME]: row[IN_CSV_HEADER.PRODUCTO],
      [HEADER.ISIN]: row[IN_CSV_HEADER.ISIN],
      [HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.FEE]: {
    regexList: [
      /^Costes de transacción y\/o externos de DEGIRO$/i,
      /^ADR\/GDR Pass-Through Fee/i,
    ],
    func: (row, matches) => ({
      [HEADER.STOCK_NAME]: row[IN_CSV_HEADER.PRODUCTO],
      [HEADER.ISIN]: row[IN_CSV_HEADER.ISIN],
      [HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.DIVIDEND]: {
    regexList: [
      /^Dividendo$/i,
    ],
    func: (row, matches) => ({
      [HEADER.STOCK_NAME]: row[IN_CSV_HEADER.PRODUCTO],
      [HEADER.ISIN]: row[IN_CSV_HEADER.ISIN],
      [HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.OPERATION]: {
    regexList: [
      /^(\w+)\s+([\d,.]+)\s+(.*?)@([\d,.]+)\s+(\w+)\s+\((.+)\)$/i,
    ],
    func: (row, matches) => {
      const match = matches[0];
      // If it's a sale, make share count negative
      let shareCount = utils.parseNumber(match[2]);
      if (match[1].toLowerCase() === "venta")
        shareCount *= -1;
      // Save fields
      return {
        [HEADER.STOCK_NAME]: match[3],
        [HEADER.ISIN]: row[IN_CSV_HEADER.ISIN],
        [HEADER.SHARE_COUNT]: shareCount,
        [HEADER.ENTRY_PRICE]: utils.parseNumber(match[4]),
        [HEADER.CURRENCY]: match[5],
      };
    },
  },
};

export default async function handler_fileUpload(event)
{
  // Read the file as a list of dict
  const file = event.target.files[0];
  const text = await file.text();
  let csv = utils.parseCSV(text);

  // Format date into a single variable
  csv = utils.updateDate(csv);

  // Drop some cols
  csv = utils.dropCol(csv, IN_CSV_HEADER.ID_ORDEN);

  // format the rows so the info is better stored
  console.log("Formatting rows");
  csv = utils.formatRows(csv, FORMATS_DICT);
  Object.keys(FORMATS_DICT).map(key => {
    const len = csv.filter(row => row[HEADER.TYPE] === key).length;
    console.log(`\tType ${key} matched ${len} / ${csv.length}`);
  });
  console.log(`Currently marked ${csv.filter(row => row[HEADER.MARKED_TAG]).length} / ${csv.length}`);

  // Remove rows that match regex
  console.log("Deleting some rows");
  csv = utils.dropRows(csv, IN_CSV_HEADER.DESCRIPCION, ROWS_TO_DROP);
  console.log(`Currently marked ${csv.filter(row => row[HEADER.MARKED_TAG]).length} / ${csv.length}`);

  // Remaining unparsed elements
  console.log(`Remaining unparsed elements ${csv.filter(row => !row[HEADER.MARKED_TAG]).length} / ${csv.length}`);
  console.table(csv.filter(row => !row[HEADER.MARKED_TAG]));

  // After parsing everything marked and "Descripción" can be removed
  console.log(`Dropping MARKED_TAG column`);
  csv = utils.dropCol(csv, HEADER.MARKED_TAG);

  // Reverse the csv so older times are at lower indexes
  csv.reverse();
  // Print Example row for each type
  const types = new Set(Object.keys(FORMATS_DICT));
  for (const row of csv)
  {
    const type = row[HEADER.TYPE];
    if (types.has(type))
    {
      console.log(`Row of type ${type}`, row[HEADER.CONTENT]);
      types.delete(type);
    }
  }
  g["csv"] = csv;
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

function toTimeSeries(csv)
{
  const timeSeries = {};
  for(const row of csv)
  {
    if (row[HEADER.TYPE] !== CSV_TYPES.OPERATION)
      continue;
    const isin = row[HEADER.CONTENT][HEADER.ISIN];
    if (!(isin in timeSeries))
    {
      timeSeries[isin] = {
        x: [row[HEADER.DATE]],
        y: [row[HEADER.CONTENT][HEADER.SHARE_COUNT]],
      };
    }
    else {
      timeSeries[isin].x.push(row[HEADER.DATE]);
      timeSeries[isin].y.push(row[HEADER.CONTENT][HEADER.SHARE_COUNT] + timeSeries[isin].y.at(-1));
    }
  }
  return timeSeries;
}