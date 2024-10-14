/* eslint require-atomic-updates: off */
import verify from "./lib/verify.js";

let verified;

/**
 * Called by semantic-release during the verification step
 * @param {*} pluginConfig The semantic-release plugin config
 * @param {*} context The context provided by semantic-release
 */
export async function verifyConditions(pluginConfig, context) {
  if (!verified) {
    await verify(pluginConfig, context);
    verified = true;
  }
}
