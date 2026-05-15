// Degiro CSV header strings
const IN_CSV_HEADER_FECHA = "Fecha";
const IN_CSV_HEADER_HORA = "Hora";
const IN_CSV_HEADER_FECHA_VALOR = "Fecha valor";
const IN_CSV_HEADER_PRODUCTO = "Producto";
const IN_CSV_HEADER_ISIN = "ISIN";
const IN_CSV_HEADER_DESCRIPCION = "Descripción";
const IN_CSV_HEADER_TIPO = "Tipo";
const IN_CSV_HEADER_VARIACION = "Variación";
const IN_CSV_HEADER_COL_9 = "col 9";
const IN_CSV_HEADER_SALDO = "Saldo";
const IN_CSV_HEADER_COL_11 = "col 11";
const IN_CSV_HEADER_ID_ORDEN = "ID Orden";

// Parsed Headers for different kinds of operations
// All
const HEADER_DATE = "date";
const HEADER_TRANSACTION_TYPE = "type";
const HEADER_MARKED_TAG = "marked";
// buy/sell operation
const HEADER_STOCK_NAME = "stock name";
const HEADER_SHARE_COUNT = "share count";
const HEADER_ENTRY_PRICE = "entry price";
const HEADER_CURRENCY = "currency";
const HEADER_ISIN = "ISIN";
// fee
const HEADER_AMOUNT = "amount";

let result = [];

/**
 * Creates a new HTML element with optional attributes and appends it to a parent.
 * 
 * @param {string} type - The type of HTML element to create (e.g., 'div', 'button').
 * @param {Object} options - Optional parameters for the element.
 * @param {HTMLElement} [options.parent=null] - The parent element to append the new element to.
 * @param {string[]} [options.classList=[]] - An array of class names to add to the element.
 * @param {string|null} [options.id=null] - The ID to assign to the element.
 * 
 * @returns {HTMLElement} The newly created element.
 */
function newElement(type, {
    parent = null,
    classList = [],
    ...props
    } = {}
) {
    const element = document.createElement(type);
  
    if (classList.length) element.classList.add(...classList);
    if (parent) parent.append(element);
  
    Object.assign(element, props);
  
    return element;
}

function sidebar()
{
  const sidebarDiv = document.querySelector("aside");
  sidebarDiv.innerHTML = "";
}

function fileInput()
{
  const section = newElement("section");
  const fileInput = newElement("input", {parent: section, accept: ".csv", type: "file"});
  fileInput.addEventListener("change", handler_fileUpload);
  return section;
}

async function handler_fileUpload(event)
{
  const file = event.target.files[0];
  const text = await file.text();
  let csv = CSV_parse(text);
  csv = CSV_formatDate(csv);
  csv = CSV_dropCol(csv, "ID Orden");
  csv = CSV_formatOperations(csv);
  console.log(
    `count of format operations ${csv.filter(row => row[HEADER_TRANSACTION_TYPE] === "operation").length}, ` +
    `currently marked ${csv.filter(row => row[HEADER_MARKED_TAG]).length} / ${csv.length}`
  );
  csv = CSV_formatFees(csv);
  console.log(
    `count of format fees ${csv.filter(row => row[HEADER_TRANSACTION_TYPE] === "fee").length}, ` +
    `currently marked ${csv.filter(row => row[HEADER_MARKED_TAG]).length} / ${csv.length}`
  );
  
}

function CSV_parse(text)
{
  // Parses the input file as csv.
  // Undefined columns are renamed to "col ${index + 1}"
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader(header, index) {
      const name = header.trim();
      return name || `col ${index + 1}`;
    }
  });
  if (parsed.errors.length)
    throw new Error(parsed.errors[0].message);
  return parsed.data;
}

function CSV_formatDate(/*const*/ csv)
{
  // For each row, pick the date headers and merge them into one column of Date type
  return csv.map((row) => {
    // Select elements from row
    const { [IN_CSV_HEADER_FECHA]: _, [IN_CSV_HEADER_HORA]: hour, [IN_CSV_HEADER_FECHA_VALOR]: valueDate, ...rest } = row;
    // Get the date variables and store them in a Date object
    const [day, month, year] = valueDate.split("-").map(Number);
    const [hours = 0, minutes = 0] = (hour || "").split(":").map(Number);
    const date = new Date(year, month - 1, day, hours, minutes);
    // return a new row with the new Date field and the used ones removed
    return {
      [HEADER_DATE]: date,
      ...rest
    };
  });
}

function CSV_dropCol(/*const*/ csv, col) {
  // Removes a column from the csv
  // If col doesn't exist it doesn't do anything
  return csv.map(({ [col]: _, ...rest }) => rest);
}

function CSV_formatAnualFees(/*const*/ csv)
{
// 06-02-2025,17:18,31-01-2025,,,Comisión de conectividad con el mercado 2025 (Euronext Paris - EPA),,EUR,"-2,50",EUR,"39,74",
// 06-02-2025,17:18,31-01-2025,,,Comisión de conectividad con el mercado 2025 (New York Stock Exchange - NSY),,EUR,"-2,50",EUR,"42,24",
// 06-02-2025,17:18,31-01-2025,,,Comisión de conectividad con el mercado 2025 (Nasdaq - NDQ),,EUR,"-2,50",EUR,"44,74",
// 06-02-2025,17:18,31-01-2025,,,Comisión de conectividad con el mercado 2025 (Euronext Milan - MIL),,EUR,"-2,50",EUR,"47,24",
// 06-02-2025,17:18,31-01-2025,,,Comisión de conectividad con el mercado 2025 (London Stock Exchange (LSE) - LSE),,EUR,"-2,50",EUR,"49,74",
// 06-02-2025,17:18,31-01-2025,,,Comisión de conectividad con el mercado 2025 (Tradegate AG - TDG),,EUR,"-2,50",EUR,"52,24",
// 06-02-2025,17:18,31-01-2025,,,Comisión de conectividad con el mercado 2025 (Xetra - XET),,EUR,"-2,50",EUR,"54,74",
}

function CSV_formatFlatexInterest(/*const*/ csv)
{
  // This one is always 0
//06-01-2025,06:51,02-01-2025,,,Flatex Interest Income,,EUR,"0,00",EUR,"17,57",
}

function CSV_formatFees(csv)
{
  // Finds all rows that match the pattern and gives them a new format
  const opType = "fee";
  const regex = /^Costes de transacción y\/o externos de DEGIRO$/i; // /i flag makes it case insensitive
  // Loop csv and return a new one with formatted matching rows
  return csv.map( row => {
    // regex.test is true or false only
    // Don't touch rows that don't match
    if (regex.test(row[IN_CSV_HEADER_DESCRIPCION]) !== true)
      return {...row};
    // If row has already been marked and it matches again it's an issue
    if (row[HEADER_MARKED_TAG] === true) {
      console.error(`${opType} matched an already marked row of type ${row["type"]}. Skipping...`);
      return {...row};
    }
    // Save fields
    return {
      [HEADER_DATE]: row[HEADER_DATE], // Mandatory
      [HEADER_TRANSACTION_TYPE]: opType, // Mandatory
      [HEADER_MARKED_TAG]: true, // Mandatory
      [HEADER_AMOUNT]: Number(row[IN_CSV_HEADER_COL_9].replace(",", ".")),
      [HEADER_CURRENCY]: row[IN_CSV_HEADER_VARIACION],
    };
  });
}

function CSV_formatOperations(/*const*/ csv)
{
  // Finds all rows that match the pattern and gives them a new format
  const opType = "operation";
  const regex = /^(\w+)\s+(\d+)\s+(.*?)@([\d,]+)\s+(\w+)\s+\((.+)\)$/i; // /i flag makes it case insensitive
  // Loop csv and return a new one with formatted matching rows
  return csv.map( row => {
    // Match should be:
    //[
    //  'Compra 10 ServiceNow Inc@12,345 USD (US01234P5678)',
    //  'Compra',
    //  '10',
    //  'ServiceNow Inc',
    //  '12,345',
    //  'USD',
    //  'US01234P5678'
    //]
    const match = row[IN_CSV_HEADER_DESCRIPCION].match(regex);
    // Don't touch rows that don't match
    if (match === null)
      return {...row};
    // If row has already been marked and it matches again it's an issue
    if (row[HEADER_MARKED_TAG] === true) {
      console.error(`${opType} matched an already marked row of type ${row["type"]}. Skipping...`);
      return {...row};
    }
    // If it's a sale, make share count negative
    let shareCount = Number(match[2].replace(",", "."));
    if (match[1].toLowerCase() === "venta")
      shareCount *= -1;
    // Save fields
    return {
      [HEADER_DATE]: row[HEADER_DATE], // Mandatory
      [HEADER_TRANSACTION_TYPE]: opType, // Mandatory
      [HEADER_MARKED_TAG]: true, // Mandatory
      [HEADER_SHARE_COUNT]: shareCount,
      [HEADER_STOCK_NAME]: match[3],
      [HEADER_ENTRY_PRICE]: Number(match[4].replace(",", ".")),
      [HEADER_CURRENCY]: match[5],
      [HEADER_ISIN]: match[6]
    };
  });
}

function main()
{
  const mainDiv = document.querySelector("main");
  mainDiv.append(fileInput());
  newElement("p", {parent: mainDiv, textContent: "hola que tal"});
}

sidebar();
main();
