import { type } from "arktype";

const GenerateResponse = type({
  code: "200",
  contents: {
    address: "string",
  },
});

export { GenerateResponse };
