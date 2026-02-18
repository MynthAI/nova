import { type } from "arktype";

const ValidationErrorResponse = type({
  code: "400",
  contents: {
    errors: type({ message: "string" }).array().atLeastLength(1),
  },
});

export { ValidationErrorResponse };
