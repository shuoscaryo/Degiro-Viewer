// input csv from degiro headers
export const IN_CSV_HEADER = {
  FECHA: "Fecha",
  HORA: "Hora",
  FECHA_VALOR: "Fecha valor",
  PRODUCTO: "Producto",
  ISIN: "ISIN",
  DESCRIPCION: "Descripción",
  TIPO: "Tipo",
  VARIACION: "Variación",
  COL_9: "col 9",
  SALDO: "Saldo",
  COL_11: "col 11",
  ID_ORDEN: "ID Orden",
};

// Parsed Headers for different kinds of operations
export const OUT_CSV_HEADER = {
  // All rows have these
  DATE: "date",
  TYPE: "type",
  MARKED_TAG: "marked",
  CONTENT: "content",
  // buy/sell operation
  STOCK_NAME: "stock name",
  SHARE_COUNT: "share count",
  ENTRY_PRICE: "entry price",
  CURRENCY: "currency",
  ISIN: "ISIN",
  // fee
  AMOUNT: "amount",
}