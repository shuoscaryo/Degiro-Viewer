import * as g_utils from "/utils.js"
import handler_fileUpload from './handler_fileUpload.js'

export default function fileInput()
{
  const section = g_utils.newElement("section");
  const fileInput = g_utils.newElement("input", {parent: section, accept: ".csv", type: "file"});
  fileInput.addEventListener("change", handler_fileUpload);
  return section;
}

