import fileInput from "./fileInput/index.js"
import * as utils from "./utils.js"

function sidebar()
{
  const sidebarDiv = document.querySelector("aside");
  sidebarDiv.innerHTML = "";
}

function main()
{
  const mainDiv = document.querySelector("main");
  mainDiv.append(fileInput());
  utils.newElement("p", {parent: mainDiv, textContent: "hola que tal"});
}

sidebar();
main();
