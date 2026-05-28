import fileInput from "./fileInput/index.js"
import * as utils from "./utils.js"

function sidebar()
{
  const sidebarDiv = document.querySelector("aside");
  sidebarDiv.innerHTML = "";
}

function graph()
{
  const div = utils.newElement("div", {id: "chart"});
  const x = [];
  const y = [];

  for (let i = 0; i < 1000; i++) {
    x.push(i);

    y.push(
      Math.sin(i * 0.02) * 20 +
      Math.random() * 2
    );
  }

  const trace = {
    x,
    y,

    type: "scattergl", // WebGL version
    mode: "lines",

    line: {
      width: 2
    }
  };

  const layout = {
    dragmode: "pan", // IMPORTANT

    paper_bgcolor: "#111",
    plot_bgcolor: "#111",

    font: {
      color: "white"
    },

    xaxis: {
      gridcolor: "#333"
    },

    yaxis: {
      gridcolor: "#333"
    }
  };

  const config = {
    responsive: true,

    scrollZoom: true, // mouse wheel zoom

    displayModeBar: true
  };

  Plotly.newPlot(
    div,
    [trace],
    layout,
    config
  );
  return div;
}

function main()
{
  const mainDiv = document.querySelector("main");
  mainDiv.append(fileInput());
  utils.newElement("p", {parent: mainDiv, textContent: "hola que tal"});
  mainDiv.append(graph());
}

sidebar();
main();

function yearsDelta(date, refDate)
{
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
  return (date - refDate) / millisecondsPerYear;
};

function calcPastValue(multiplier, depositList)
{
  const firstDate = depositList[0].date;
  return depositList.reduce((sum, row) => {
    const years = yearsDelta(row.date, firstDate);
    return sum + row.amount / Math.pow(multiplier, years);
  }, 0);
}

function mean(a, b)
{
  return (a + b) / 2;
}

export function calcAnualReturn(profit, depositList, nowDate, tolerance)
{
  /* Calculates annual return based on all the deposits and withdrawals
  * Method used is XIRR: Extended Internal Rate of Return
  * Works by moving back all deposit and withdrawals to the time of the first
  * operation, like if all were performed same day. That way it's like a single
  * operation that compounded to the final balance of the wallet. Finally, the
  * trick is to bring back the final balance, as if it was withdrawn at the end.
  * Substracting the single operation to the final balance moved back, should
  * result in zero, because the initial single operation should have compounded
  * exactly the oposite value that the withdraw.
  * Example: return rate of losing 50% anually.
  * year 0: Initial buy 1000$
  * year 1: lost 500$ and withdraw 250$ -> left 250$
  * year 2: lost 125$ -> final balance 125$
  * Algorithm:
  * Move back all operations back:
  * year 0 operation is adding 1000$, as it's already in year 0, no changes
  * year 1: withdrawing 250$ in y1 is like withdrawing 500$ y0 bc RR = 0.5
  * Emulate final balance as withdrawal:
  * withdrawing balance of 125$ in year 2 is like withdrawing 500$ y0.
  * Check that all sums are 0: If Return Rate is right it should equal 0
  * initial - y1_back = 500$
  * final_balance_back = -500$ (withdraw = negative)
  * sum = 0 => RR= -50%
  */
  // Preprocess, sort by date and filter dates after the current time
  depositList = depositList.map(row => ({
    date: row["date"],
    amount: row["content"]["amount"],
  }));
  depositList = depositList.filter(row => row.date < nowDate);
  depositList = depositList.sort((a, b) => a.date - b.date);

  // Add the final balance as last withdraw operation
  let finalBalance = profit + depositList.reduce((sum, row) => sum + row.amount, 0);
  depositList.push({"date": nowDate, "amount": - finalBalance});
  console.log(depositList);
  // Find upper and lower bound for binary search
  let lowerBound = 0.5;
  let upperBound = 2;
  let upperGuess = calcPastValue(upperBound, depositList);
  let lowerGuess = calcPastValue(lowerBound, depositList);
  const maxIterations = 100;
  for (let i = 0; i < maxIterations; i++)
  {
    console.log(`${i} lowerBound: ${lowerBound}, guess: ${lowerGuess} || upperBound: ${upperBound}, guess: ${upperGuess}`);
    // Random check maybe within error
    if (Math.abs(upperGuess) < tolerance)
      return upperGuess - 1;
    if (Math.abs(lowerGuess) < tolerance)
      return lowerGuess - 1;
    console.log("Didn't match by tolerance")
    // If lower is differnt sign than upper, the target is in between
    if ((lowerGuess > 0) != (upperGuess > 0))
      break;
    if (i === maxIterations - 1)
      throw new Error("Failed to find bounds");
    // Duplicate bounds and search again
    lowerBound /= 2;
    upperBound *= 2;
    upperGuess = calcPastValue(upperBound, depositList);
    lowerGuess = calcPastValue(lowerBound, depositList);
  }
  console.log("Bounds ok");

  // find the multiplier with binary search
  for (let i = 0; i < maxIterations; i++)
  {
    const midBound = mean(lowerBound, upperBound);
    const midGuess = calcPastValue(midBound, depositList);
    console.log(`${i} lowerBound: ${lowerBound}, guess: ${lowerGuess} || upperBound: ${upperBound}, guess: ${upperGuess} || midBound: ${midBound}, guess: ${midGuess}`);
    // if within error, return it
    if (Math.abs(midGuess) < tolerance)
      return midBound - 1;
    // close boundaries
    if ((midGuess > 0) !== (upperGuess > 0))
    {
      lowerBound = midBound;
      lowerGuess = midGuess;
    }
    else
    {
      upperBound = midBound;
      upperGuess = midGuess;
    }
  }
  throw new Error("Failed to converge into a result");
}
