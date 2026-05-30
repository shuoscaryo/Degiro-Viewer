import fileInput from "./fileInput/index.js"
import annualReturn from './annualReturn/index.js'
import sidebar from './sidebar/index.js'
import * as g_utils from "/src/utils.js"

function main()
{
  const mainDiv = document.querySelector("main");
  mainDiv.append(fileInput());
  mainDiv.append(annualReturn());
  g_utils.newElement("p", {parent: mainDiv, textContent: "hola que tal"});
}

sidebar();
main();
