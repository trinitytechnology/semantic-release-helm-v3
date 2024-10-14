import AggregateError from "aggregate-error";
import execa from "execa";
/**
 * Verifies that the CHART_PATH environment variable is set and valid.
 */
export default async (pluginConfig, context)  =>{
  const errors = [];

  const env = context.env;

  if (!pluginConfig.chartPath && !env.CHART_PATH) {
      errors.push('Missing argument: chartPath, set by plugin config chartPath key or CHART_PATH in environment');
  }

  const registryHost = env.REGISTRY_HOST || pluginConfig.registry;

  if (registryHost && !pluginConfig.skipRegistryLogin && !pluginConfig.isChartMuseum && env.REGISTRY_USERNAME && env.REGISTRY_PASSWORD) {
      const host = registryHost
          .replace("oci://", "")
          .replace("http://", "")
          .replace("https://", "")
          .split('/')[0];
      try {
          await verifyRegistryLogin(host, env.REGISTRY_USERNAME, env.REGISTRY_PASSWORD);
      } catch (error) {
          errors.push('Could not login to registry. Wrong credentials?', error);
      }
      if (errors.length > 0) {
        throw new AggregateError(errors);
    }
  }
}

async function verifyRegistryLogin(host, registryUsername, registryPassword) {
  await execa(
      'helm',
      ['registry', 'login', '--username', registryUsername, '--password-stdin', host],
      {
          input: registryPassword,
          env: {
              HELM_EXPERIMENTAL_OCI: 1
          }
      }
  );
}
