import { type } from "arktype";

const AddressResponse = type({
  code: "200",
  contents: {
    address: type("string"),
  },
});

export { AddressResponse };
