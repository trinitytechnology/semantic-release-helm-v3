
module.exports = {
  /**
   * Verify if the plugin can run.
   */
  verifyConditions: async (config, context) => {
    const { logger } = context;
    logger.log('Verifying release conditions...');
  },
};
