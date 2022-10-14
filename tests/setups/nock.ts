import { afterAll } from "@jest/globals";
import nock from "nock";

nock.disableNetConnect();
nock.enableNetConnect("127.0.0.1");
nock.enableNetConnect("localhost");

afterAll(() => {
  const pending = nock.pendingMocks();

  if (pending.length > 0) {
    nock.cleanAll();

    throw new Error(`Not all nock mocks were used\nPending: \n\t${pending.join(",\n\t")}`);
  }
});
