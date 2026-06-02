import FileInput from "./fileInput/index.js"
import AnnualReturnSection from './annualReturn/index.js'
import Sidebar from '/src/sidebar/index.js'
import * as g_utils from "/src/utils.js"
import Component from "/src/Component.js"

class Main extends Component {
  constructor ()
  {
    super(document.querySelector("main"));
    this.append(new FileInput());
    this.append(new AnnualReturnSection());
    g_utils.newElement("p", {parent: this.element, textContent: "hola que tal"});
  }
}

const sidebar = new Sidebar();
sidebar.mount();
const main = new Main();
main.mount();