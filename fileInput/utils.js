
import { OUT_CSV_HEADER, IN_CSV_HEADER } from '/defines.js';

export function dropCol(/*const*/ csv, col) {
  // Removes a column from the csv
  // If col doesn't exist it doesn't do anything
  return csv.map(({ [col]: _, ...rest }) => rest);
}

export function dropRows(/*const*/ csv, col, regexList)
{
  // Removes rows that match any of regexList in the row[col] field
  return csv.filter(row => {
    const anyMatch = regexList.some(regex => regex.test(row[col]));
    return anyMatch === false;
  });
}

export function parseNumber(text)
{
  // Function for parsing the numbers from Degiro
  // 123.456.789,56 -> 123456789.56
  return Number(text.replaceAll(".", "").replace(",", "."));
}

export function formatRows(csv, formatsDict)
{
  // Loops csv and rows that match gives them a new format
  return csv.map(row => {
    let newRow = row;
    // Loop all formats to find the one that applies
    for (const [key, value] of Object.entries(formatsDict)) {
      // Create a list with all the matches, skip row if no match
      const matches = value["regexList"].map(regex => row[IN_CSV_HEADER.DESCRIPCION].match(regex));
      if (matches.some(match => match !== null) === false)
        continue;
      // Validation to check that formats don't match same kind of row
      if (row[OUT_CSV_HEADER.MARKED_TAG] === true) {
        console.error(`${key} matched an already marked row of type ${row["type"]}. Skipping...`);
        continue;
      }
      // Save fields
      newRow = {
        [OUT_CSV_HEADER.DATE]: row[OUT_CSV_HEADER.DATE],
        [OUT_CSV_HEADER.MARKED_TAG]: true, 
        [OUT_CSV_HEADER.TYPE]: key,
        [OUT_CSV_HEADER.CONTENT]: value["func"](row, matches)
      };
    }
    // if matched something, returns formatted, else returns unchanged
    return newRow;
  });
}

export function updateDate(/*const*/ csv)
{
  // For each row, pick the date headers and merge them into one column of Date type
  return csv.map((row) => {
    // Select elements from row
    const { [IN_CSV_HEADER.FECHA]: _, [IN_CSV_HEADER.HORA]: hour, [IN_CSV_HEADER.FECHA_VALOR]: valueDate, ...rest } = row;
    // Get the date variables and store them in a Date object
    const [day, month, year] = valueDate.split("-").map(Number);
    const [hours = 0, minutes = 0] = (hour || "").split(":").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    // return a new row with the new Date field and the used ones removed
    return {
      [OUT_CSV_HEADER.DATE]: date,
      ...rest
    };
  });
}

export function parseCSV(text)
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
