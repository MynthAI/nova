import { type } from "arktype";

const RateLimited = type({
  code: "429",
  contents: {
    retryAfterSeconds: "number",
  },
});

export { RateLimited };
