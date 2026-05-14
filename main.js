const DATE_HEADER = "Fecha";
const DATE_VALUE_HEADER = "Fecha valor";
const HOUR_HEADER = "Hora";
const MERGED_DATE_VALUE_HEADER = "Date";

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
  const csv = CSV_parse(text);
  result = CSV_formatDate(csv);
  console.table(result);
}

function CSV_formatDate(csv)
{
  // For each row, pick the date headers and merge them into one, then append the rest (DATE_HEADER is only there to remove it)
  return csv.map((row) => {
    const { [DATE_HEADER]: _, [HOUR_HEADER]: hour, [DATE_VALUE_HEADER]: valueDate, ...rest } = row;

    const [day, month, year] = valueDate.split("-").map(Number);
    const [hours = 0, minutes = 0] = (hour || "").split(":").map(Number);
    const date = new Date(year, month - 1, day, hours, minutes);

    return {
      [MERGED_DATE_VALUE_HEADER]: date,
      ...rest
    };
  });
}

function CSV_parse(text)
{
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader(header, index) {
      const name = header.trim();
      return name || `Column ${index + 1}`;
    }
  });

  if (parsed.errors.length)
    throw new Error(parsed.errors[0].message);

  return parsed.data;
}

function main()
{
  const mainDiv = document.querySelector("main");
  mainDiv.append(fileInput());
  newElement("p", {parent: mainDiv, textContent: "hola que tal"});
}

sidebar();
main();
