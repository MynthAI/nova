import { type } from "arktype";

const AddressResponse = type({
  code: "200",
  contents: {
    address: type("string"),
    cardano: type("string"),
    evm: type("string"),
    solana: type("string"),
    sui: type("string"),
    tron: type("string"),
  },
});

export { AddressResponse };
