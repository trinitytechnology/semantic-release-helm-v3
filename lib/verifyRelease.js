import { promises as fsPromises } from "fs";
import path from "path";
import semver from "semver";
import yaml from "yaml";

export default async (pluginConfig, { nextRelease: { type, version, notes }, logger, env }) => {
  const filePath = path.join(env.CHART_PATH || pluginConfig.chartPath, "Chart.yaml");

  const chartYaml = await fsPromises.readFile(filePath);
  const doc = yaml.parseDocument(chartYaml.toString());

  let nextVersion = version;
  let nextAppVersion = version;

  // using chart version rather than the version from the release
  const useChartVersion = env.USE_CHART_VERSION || pluginConfig.useChartVersion;
  if (useChartVersion) {
    // read the current version from the Chart.yaml
    const currentChartVersion = doc.get("version");
    // update the version and appVersion to the next version
    nextVersion = semver.inc(currentChartVersion, type);

    // read the current appVersion from the Chart.yaml
    const currentChartAppVersion = doc.get("appVersion");
    nextAppVersion = semver.inc(currentChartAppVersion, type);
    logger.log("The upcoming Chart.yaml will have version %s and appVersion %s.", nextVersion, nextAppVersion);
  }
};
