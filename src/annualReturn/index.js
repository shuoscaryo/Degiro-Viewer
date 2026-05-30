import { newElement } from '/src/utils.js';
import calcAnnualReturn from './calcAnnualReturn.js';
import { g } from '/src/globals.js';

function currentReturnSection() {
  const component = newElement("div");
  const value = calcAnnualReturn(4000, g.csv, new Date(Date.now()), 0.001);
  component.textContent = `${(value * 100).toFixed(2)}%`;
  return component;
}

function manualReturnSection() {
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

function noCsvLoadedSection() {
  return newElement("div", { textContent: "No csv loaded yet" });
}

export default function annualReturnSection() {
  const component = newElement("section", {id: "annual-return"});  
  const viewContainer = newElement("div", { parent: component, id: "container" });
  
  function switchView(newViewElement) {
    viewContainer.replaceChildren(newViewElement);
  }

  if (g.csv === null)
    switchView(noCsvLoadedSection());
  else
    switchView(currentReturnSection());

  const buttonsDiv = newElement("div", { parent: component, id: "buttons-div" });
  
  const currentButton = newElement("button", { parent: buttonsDiv, textContent: "Real" });
  currentButton.addEventListener("click", () => {
    if (g.csv === null)
      return;
    switchView(currentReturnSection());
  });
  
  const manualButton = newElement("button", { parent: buttonsDiv, textContent: "Manual" });
  manualButton.addEventListener("click", () => {
    if (g.csv === null)
      return;
    switchView(manualReturnSection());
  });

  component.addEventListener("csvUpdate", (e) => {
    if (g.csv === null)
      switchView(noCsvLoadedSection());
    else
      switchView(currentReturnSection());
  }, { capture: true });

  return component;
}