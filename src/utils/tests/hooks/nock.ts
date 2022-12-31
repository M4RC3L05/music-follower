import nock from "nock";

nock.disableNetConnect();

export const checkMocks = () => {
  const pending = nock.pendingMocks();

  if (pending.length > 0) {
    nock.cleanAll();

    throw new Error(`Not all nock mocks were used\nPending: \n\t${pending.join(",\n\t")}`);
  }
};
