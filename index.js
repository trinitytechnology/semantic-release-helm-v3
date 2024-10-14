/* eslint require-atomic-updates: off */
import verifyChart from "./lib/verify.js";
import prepareChart from "./lib/prepare.js";
import verifyReleaseChart from "./lib/verifyRelease.js";

let verified;
let prepared;
/**
 * Called by semantic-release during the verification step
 * @param {*} pluginConfig The semantic-release plugin config
 * @param {*} context The context provided by semantic-release
 */
export async function verifyConditions(pluginConfig, context) {
  if (!verified) {
    await verifyChart(pluginConfig, context);
    verified = true;
  }
}

export async function verifyRelease(pluginConfig, context) {
  if (!verified) {
    await verifyChart(pluginConfig, context);
  }
  await verifyReleaseChart(pluginConfig, context);
}

/**
 * Called by semantic-release during the prepare step
 * @param {*} pluginConfig The semantic-release plugin config
 * @param {*} context The context provided by semantic-release
 */
export async function prepare(pluginConfig, context) {
  if (!verified) {
    await verifyChart(pluginConfig, context);
  }
  if (!prepared) {
    await prepareChart(pluginConfig, context);
    prepared = true;
  }
}
