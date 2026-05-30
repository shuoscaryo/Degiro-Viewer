import fileInput from "./fileInput/index.js"
import annualReturnSection from './annualReturn/index.js'
import sidebar from './sidebar/index.js'
import * as g_utils from "/src/utils.js"

function main()
{
  const mainDiv = document.querySelector("main");
  mainDiv.append(fileInput());
  mainDiv.append(annualReturnSection());
  g_utils.newElement("p", {parent: mainDiv, textContent: "hola que tal"});
}

sidebar();
main();
