import * as utils from "./utils.js"
import { OUT_CSV_HEADER, IN_CSV_HEADER, CSV_TYPES } from '/src/defines.js';
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
      [OUT_CSV_HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [OUT_CSV_HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.DEGIRO_GIFT]: {
    regexList: [
      /^Ingresos por Préstamo de Valores/i,
      /^Promoción DEGIRO reembolso/i,
      /^Flatex Interest Income$/i,
    ],
    func: (row, matches) => ({
      [OUT_CSV_HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [OUT_CSV_HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.DEPOSIT]: {
    regexList: [
      /^flatex Deposit/i,
      /^Flatex Instant Deposit/i,
    ],
    func: (row, matches) => ({
      [OUT_CSV_HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [OUT_CSV_HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.DIVIDEND_RETENTION]: {
    regexList: [
      /^Retención del dividendo$/i,
    ],
    func: (row, matches) => ({
      [OUT_CSV_HEADER.STOCK_NAME]: row[IN_CSV_HEADER.PRODUCTO],
      [OUT_CSV_HEADER.ISIN]: row[IN_CSV_HEADER.ISIN],
      [OUT_CSV_HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [OUT_CSV_HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.FEE]: {
    regexList: [
      /^Costes de transacción y\/o externos de DEGIRO$/i,
      /^ADR\/GDR Pass-Through Fee/i,
    ],
    func: (row, matches) => ({
      [OUT_CSV_HEADER.STOCK_NAME]: row[IN_CSV_HEADER.PRODUCTO],
      [OUT_CSV_HEADER.ISIN]: row[IN_CSV_HEADER.ISIN],
      [OUT_CSV_HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [OUT_CSV_HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
    }),
  },
  [CSV_TYPES.DIVIDEND]: {
    regexList: [
      /^Dividendo$/i,
    ],
    func: (row, matches) => ({
      [OUT_CSV_HEADER.STOCK_NAME]: row[IN_CSV_HEADER.PRODUCTO],
      [OUT_CSV_HEADER.ISIN]: row[IN_CSV_HEADER.ISIN],
      [OUT_CSV_HEADER.AMOUNT]: utils.parseNumber(row[IN_CSV_HEADER.COL_9]),
      [OUT_CSV_HEADER.CURRENCY]: row[IN_CSV_HEADER.VARIACION],
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
        [OUT_CSV_HEADER.STOCK_NAME]: match[3],
        [OUT_CSV_HEADER.ISIN]: row[IN_CSV_HEADER.ISIN],
        [OUT_CSV_HEADER.SHARE_COUNT]: shareCount,
        [OUT_CSV_HEADER.ENTRY_PRICE]: utils.parseNumber(match[4]),
        [OUT_CSV_HEADER.CURRENCY]: match[5],
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
    const len = csv.filter(row => row[OUT_CSV_HEADER.TYPE] === key).length;
    console.log(`\tType ${key} matched ${len} / ${csv.length}`);
  });
  console.log(`Currently marked ${csv.filter(row => row[OUT_CSV_HEADER.MARKED_TAG]).length} / ${csv.length}`);

  // Remove rows that match regex
  console.log("Deleting some rows");
  csv = utils.dropRows(csv, IN_CSV_HEADER.DESCRIPCION, ROWS_TO_DROP);
  console.log(`Currently marked ${csv.filter(row => row[OUT_CSV_HEADER.MARKED_TAG]).length} / ${csv.length}`);

  // Remaining unparsed elements
  console.log(`Remaining unparsed elements ${csv.filter(row => !row[OUT_CSV_HEADER.MARKED_TAG]).length} / ${csv.length}`);
  console.table(csv.filter(row => !row[OUT_CSV_HEADER.MARKED_TAG]));

  // After parsing everything marked and "Descripción" can be removed
  console.log(`Dropping MARKED_TAG column`);
  csv = utils.dropCol(csv, OUT_CSV_HEADER.MARKED_TAG);

  // Print Example row for each type
  const types = new Set(Object.keys(FORMATS_DICT));
  for (const row of csv)
  {
    const type = row[OUT_CSV_HEADER.TYPE];
    if (types.has(type))
    {
      console.log(`Row of type ${type}`, row[OUT_CSV_HEADER.CONTENT]);
      types.delete(type);
    }
  }
  g["csv"] = csv;
  // send event
  document.dispatchEvent(new CustomEvent("csvUpdate", {
    detail: {
      data: g.csv,
    },
  }));
}
