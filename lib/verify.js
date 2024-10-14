import AggregateError from "aggregate-error";
import execa from "execa";
import { HELM_MINIMUM_VERSION } from "./constant.js";

/**
 * Verifies that the CHART_PATH environment variable is set and valid.
 */
export default async (pluginConfig, context) => {
  const errors = [];
  const { env } = context;

  validateChartPath(pluginConfig, env, errors);
  const registryHost = env.REGISTRY_HOST || pluginConfig.registry;

  console.log("registryHost", registryHost);

  if (registryHost && !pluginConfig.skipRegistryLogin) {
    await handleRegistryLogin(registryHost, pluginConfig, env, errors);
  }

  if (errors.length > 0) {
    throw new AggregateError(errors);
  }
};

function validateChartPath(pluginConfig, env, errors) {
  if (!pluginConfig.chartPath && !env.CHART_PATH) {
    errors.push("Missing argument: chartPath, set by plugin config chartPath key or CHART_PATH in environment");
  }
}

async function handleRegistryLogin(registryHost, pluginConfig, env, errors) {
  const cleanHost = cleanRegistryHost(registryHost);

  try {
    if (!pluginConfig.isChartMuseum && env.REGISTRY_USERNAME && env.REGISTRY_PASSWORD) {
      await verifyRegistryLogin(cleanHost, env.REGISTRY_USERNAME, env.REGISTRY_PASSWORD);
    } else if (pluginConfig.isChartMuseum) {
      await handleChartMuseumRegistry(registryHost, env, errors);
    }
  } catch (error) {
    errors.push("Could not login to registry. Wrong credentials?", error);
  }
}

function cleanRegistryHost(host) {
  return host.replace(/^(oci|https?):\/\//, "").split("/")[0];
}

async function handleChartMuseumRegistry(registryHost, env, errors) {
  if (!/^https?/i.test(registryHost)) {
    errors.push("Invalid registry. For ChartMuseum, a repository URL is required.");
    return;
  }

  try {
    if (env.REGISTRY_USERNAME && env.REGISTRY_PASSWORD) {
      await verifyHelmVersion(HELM_MINIMUM_VERSION);
    }
    await addChartRepository(registryHost, env.REGISTRY_USERNAME, env.REGISTRY_PASSWORD);
    await installCMPushPlugin();
  } catch (error) {
    errors.push("Could not add chart repository or install plugin.", error);
  }
}

async function verifyRegistryLogin(host, username, password) {
  await execa("helm", ["registry", "login", "--username", username, "--password-stdin", host], {
    input: password,
    env: { HELM_EXPERIMENTAL_OCI: 1 },
  });
}

async function installCMPushPlugin() {
  await installHelmPlugin("https://github.com/chartmuseum/helm-push", "0.10.4");
}

async function installHelmPlugin(url, version) {
  try {
    await execa("helm", ["plugin", "install", url, ...(version ? ["--version", version] : [])]);
  } catch (error) {
    if (!error.stderr.includes("plugin already exists")) throw error;
  }
}

async function verifyHelmVersion(minVersion) {
  const { stdout } = await execa("helm", ["version", "--short"]);
  const installedVersion = stdout.match(/v(\d+\.\d+\.\d+)/)[1];
  if (compareVersions(installedVersion, minVersion) < 0) {
    throw new Error(`Helm version ${minVersion} or higher is required.`);
  }
}

function compareVersions(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function addChartRepository(url, username, password) {
  const args = ["repo", "add", "semantic-release-helm", url];
  if (username && password) {
    args.push("--username", username, "--password", password);
  }
  await execa("helm", args);
}
