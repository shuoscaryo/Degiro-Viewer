import { newElement } from '/src/utils.js';
import calcAnnualReturn from './calcAnnualReturn.js';
import { g } from '/src/globals.js';
import Component from "/src/Component.js"

function currentReturn() {
  const component = newElement("div");
  const value = calcAnnualReturn(4000, g.csv, new Date(Date.now()), 0.001);
  component.textContent = `${(value * 100).toFixed(2)}%`;
  return component;
}

function manualReturn() {
  const component = newElement("div");
  const form = newElement("form", { parent: component });
  newElement("input", {parent: form, name: "profit", step: "0.01", type: "number"});
  newElement("button", {parent: form, type: "submit", textContent: "Ok"});
  
  const result = newElement("div", { parent: component });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const amount = Number(data.get("profit"));
    const value = calcAnnualReturn(amount, g.csv, new Date(Date.now()), 0.001) * 100;
    result.textContent = `${value.toFixed(2)}%`;
  });

  return component;
}

function noCsvLoaded() {
  return newElement("div", { textContent: "No csv loaded yet" });
}

export default class AnnualReturnSection extends Component
{
  constructor()
  {
    super(newElement("section", {id: "annual-return"}));
    this.viewContainer = newElement("div", { parent: this.element, id: "container" });
    if (g.csv === null)
      this.switchView(noCsvLoaded());
    else
      this.switchView(currentReturn());
    const buttonsDiv = newElement("div", { parent: this.element, id: "buttons-div" });
    this.currentButton = newElement("button", { parent: buttonsDiv, textContent: "Real" });
    this.currentButton.addEventListener("click", () => {
      if (g.csv === null)
        return;
      this.switchView(currentReturn());
    });
    
    this.manualButton = newElement("button", { parent: buttonsDiv, textContent: "Manual" });
    this.manualButton.addEventListener("click", () => {
      if (g.csv === null)
        return;
      this.switchView(manualReturn());
    });
  }

  switchView(view)
  {
    this.viewContainer.replaceChildren(view);
  }

  onCsvUpdate = (e) => {
    if (g.csv === null)
      this.switchView(noCsvLoaded());
    else
      this.switchView(currentReturn());
  }

  onMount()
  {
    document.addEventListener("csvUpdate", this.onCsvUpdate);
  }

  onDestroy()
  {
    document.removeEventListener("csvUpdate", this.onCsvUpdate);
  }
}