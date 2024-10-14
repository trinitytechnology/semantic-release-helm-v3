import execa from "execa";
import { HELM_REPO_NAME } from "./constant.js";

export default async (pluginConfig, { logger, env }) => {
  try {
    const registryHost = env.REGISTRY_HOST || pluginConfig.registry;
    if (registryHost) {
      pluginConfig.chartPath = env.CHART_PATH || pluginConfig.chartPath;

      if (pluginConfig.isChartMuseum) {
        await publishChartToChartMuseum(pluginConfig, logger);
      } else {
        logger.error("Publishing chart to a generic registry is currently not supported.");
        return;
      }

      logger.log("Chart successfully published.");
    } else if (pluginConfig.crPublish) {
      // Publishing to GitHub chart releaser is not implemented
      logger.error("Publishing chart to GitHub Chart Releaser is currently not supported.");
    } else {
      logger.warn("Chart not published. Please check your configuration.");
    }
  } catch (error) {
    logger.error(`Error publishing chart: ${error.message}`);
    throw error; // Optional: Throw if you want the caller to handle the error
  }
};

async function publishChartToChartMuseum({ chartPath, cmPushArgs }, logger) {
  try {
    await execa("helm", ["cm-push", chartPath, ...parseExtraArgs(cmPushArgs), HELM_REPO_NAME]);
    logger.log("Chart pushed to ChartMuseum.");

    await execa("helm", ["repo", "remove", HELM_REPO_NAME]);
    logger.log("Temporary helm repo removed.");
  } catch (error) {
    logger.error(`Failed to publish to ChartMuseum: ${error.message}`);
    throw error;
  }
}

async function publishChartToRegistry({ chartPath, registry, packageArgs }, { name, version }, context) {
  console.log(`Publishing chart to registry ${registry} with packageArgs ${packageArgs} currently not supported`);
}

function parseExtraArgs(args) {
  if (!args) {
    return [];
  }
  // match quoted strings and non-quoted substrings
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const result = [];
  let match;
  while (match = regex.exec(args)) {
    result.push(match[1] || match[2] || match[0]);
  }
  return result;
}
