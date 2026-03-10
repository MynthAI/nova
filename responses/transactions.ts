import { type } from "arktype";

const TransactionsResponse = type({
  code: "200",
  contents: {
    transactions: type({
      amount: "string",
      time: "number",
      txId: "string",
      type: "'deposit' | 'transfer' | 'withdrawal'",
      "from?": "string",
      "to?": "string",
    }).array(),
  },
});

export { TransactionsResponse };
