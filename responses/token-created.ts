import { type } from "arktype";

const TokenCreatedResponse = type({
  code: "201",
  contents: {
    token: type("string"),
  },
});

export { TokenCreatedResponse };
