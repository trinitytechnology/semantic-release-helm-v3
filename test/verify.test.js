import test from "ava";
import sinon from "sinon";
import AggregateError from "aggregate-error";
import verify from "../lib/verify.js";

// Mock function for verifying registry login
const verifyRegistryLogin = sinon.stub();

test.beforeEach((t) => {
  // Set up stubs and mocks for logger and registry login
  t.context.log = sinon.stub();
  t.context.error = sinon.stub();
  t.context.logger = { log: t.context.log, error: t.context.error };

  t.context.verifyRegistryLogin = verifyRegistryLogin;
  t.context.verifyRegistryLogin.reset();
});

test.serial("Throws error if chartPath is missing", async (t) => {
  const env = {};
  const pluginConfig = {};

  const error = await t.throwsAsync(
    verify(pluginConfig, { env, logger: t.context.logger }),
    { instanceOf: AggregateError, message: /Missing argument: chartPath/ }
  );

  t.true(error.length > 0);
  t.true(error[0].message.includes("Missing argument: chartPath"));
});

test.serial("Does not throw if chartPath is set through env", async (t) => {
  const env = { CHART_PATH: "valid/path" };
  const pluginConfig = {};

  await t.notThrowsAsync(verify(pluginConfig, { env, logger: t.context.logger }));
});

test.serial("Attempts registry login with correct credentials", async (t) => {
  const env = {
    REGISTRY_HOST: "https://my-registry.com",
    REGISTRY_USERNAME: "user",
    REGISTRY_PASSWORD: "password",
  };
  const pluginConfig = { skipRegistryLogin: false };

  t.context.verifyRegistryLogin.resolves(); // Simulate successful login

  await t.notThrowsAsync(
    verify(pluginConfig, { env, logger: t.context.logger, verifyRegistryLogin: t.context.verifyRegistryLogin })
  );

  t.true(t.context.verifyRegistryLogin.calledOnceWith("my-registry.com", "user", "password"));
});

test.serial("Throws error if registry login fails", async (t) => {
  const env = {
    REGISTRY_HOST: "https://my-registry.com",
    REGISTRY_USERNAME: "user",
    REGISTRY_PASSWORD: "wrong-password",
  };
  const pluginConfig = { skipRegistryLogin: false };

  t.context.verifyRegistryLogin.rejects(new Error("Invalid credentials"));

  const error = await t.throwsAsync(
    verify(pluginConfig, { env, logger: t.context.logger, verifyRegistryLogin: t.context.verifyRegistryLogin }),
    { instanceOf: AggregateError, message: /Could not login to registry/ }
  );

  t.true(error.length > 0);
  t.true(error[0].message.includes("Could not login to registry"));
});
