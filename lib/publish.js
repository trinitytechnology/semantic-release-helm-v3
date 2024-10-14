export default async (pluginConfig, { logger, env }) => {
  const registryHost = env.REGISTRY_HOST || pluginConfig.registry;
  if (registryHost) {
    pluginConfig.chartPath = env.CHART_PATH || pluginConfig.chartPath;

    if (pluginConfig.isChartMuseum) {
      await publishChartToChartMuseum(pluginConfig);
    } else {
      logger.log("Publishing chart to generic registry currently not supported!");
    }

    logger.log("Chart successfully published.");
  } else if (pluginConfig.crPublish) {
    // await publishChartUsingCr(pluginConfig, context);
    logger.log("Publishing chart to github chart releaser currently not supported!");
  } else {
    logger.log("Chart not published.");
  }
};

async function publishChartToChartMuseum({ chartPath, cmPushArgs }) {
  await execa("helm", ["cm-push", chartPath, ...parseExtraArgs(cmPushArgs), "semantic-release-helm"]);
  await execa("helm", ["repo", "remove", "semantic-release-helm"]);
}

async function publishChartToRegistry({ chartPath, registry, packageArgs }, { name, version }, context) {
  console.log(`Publishing chart to registry ${registry} with packageArgs ${packageArgs} currently not supported`);
}
