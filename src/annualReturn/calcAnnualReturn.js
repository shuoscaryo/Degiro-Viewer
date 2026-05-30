import { OUT_CSV_HEADER, CSV_TYPES } from '/src/defines.js'

function yearsDelta(date, refDate)
{
  const millisecondsPerYear = 1000 * 60 * 60 * 24 * 365.25;
  return (date - refDate) / millisecondsPerYear;
};

function calcPastValue(multiplier, csv)
{
  const firstDate = csv[0].date;
  return csv.reduce((sum, row) => {
    const years = yearsDelta(row.date, firstDate);
    return sum + row.amount / Math.pow(multiplier, years);
  }, 0);
}

export default function calcAnnualReturn(profit, csv, nowDate, tolerance)
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
  csv = csv.filter(row => row[OUT_CSV_HEADER.TYPE] === CSV_TYPES.DEPOSIT);
  csv = csv.map(row => ({
    date: row[OUT_CSV_HEADER.DATE],
    amount: row[OUT_CSV_HEADER.CONTENT][OUT_CSV_HEADER.AMOUNT],
  }));
  csv = csv.filter(row => row.date < nowDate);
  csv = csv.sort((a, b) => a.date - b.date);

  // Add the final balance as last withdraw operation
  let finalBalance = profit + csv.reduce((sum, row) => sum + row.amount, 0);
  csv.push({"date": nowDate, "amount": - finalBalance});

  // Find upper and lower bound for binary search
  let lowerBound = 0.5;
  let upperBound = 2;
  let upperGuess = calcPastValue(upperBound, csv);
  let lowerGuess = calcPastValue(lowerBound, csv);
  const maxIterations = 100;
  for (let i = 0; i < maxIterations; i++)
  {
    // Random check maybe within error
    if (Math.abs(upperGuess) < tolerance)
      return upperBound - 1;
    if (Math.abs(lowerGuess) < tolerance)
      return lowerBound - 1;
    // If lower is different sign than upper, the target is in between
    if (lowerGuess * upperGuess < 0)
      break;
    if (i === maxIterations - 1)
      throw new Error("Failed to find bounds");
    // Duplicate bounds and search again
    lowerBound /= 2;
    upperBound *= 2;
    upperGuess = calcPastValue(upperBound, csv);
    lowerGuess = calcPastValue(lowerBound, csv);
  }

  // find the multiplier with binary search
  for (let i = 0; i < maxIterations; i++)
  {
    const midBound = (lowerBound + upperBound) / 2;
    const midGuess = calcPastValue(midBound, csv);
    // if within error, return it
    if (Math.abs(midGuess) < tolerance)
      return midBound - 1;
    // close boundaries
    if (midGuess * upperGuess < 0)
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
