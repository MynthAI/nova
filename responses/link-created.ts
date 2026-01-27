import { type } from "arktype";

const LinkCreatedResponse = type({
  code: "200",
  contents: {
    address: type("string"),
    token: type("string"),
  },
});

export { LinkCreatedResponse };
