import { newElement } from '/src/utils.js'
import calcAnnualReturn from './calcAnnualReturn.js'
import {g} from '/src/globals.js'

export default function annualReturn()
{
  const section = newElement("section");
  const form = newElement("form", {parent: section});
  const input = newElement("input", {
    parent: form,
    name: "profit", // must have name for FormData
    step: "0.01", // max precision of the number
    type: "number"
  });
  const button = newElement("button", {
    parent: form,
    type: "submit",
    textContent: "Ok"
  });
  const result = newElement("div", {parent: section});
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);

    const amount = Number(data.get("profit"));
    if (g.csv !== null)
      result.textContent = `${(calcAnnualReturn(amount, g.csv, new Date(Date.now()), 0.001) * 100).toFixed(2)}%`;
    else
      result.textContent = "no CSV loaded";
  });
  return section;
}
