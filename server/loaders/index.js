
import dependencyInjectorLoader from './dependencyInjector';
import LoggerInstance from './logger';

/**
 * Functionality used to inject the dependencies
 * to the server
 * @returns {null} its returning null
 */
export const loaderInstance = async() => {
  await dependencyInjectorLoader();
  LoggerInstance.info('✌️ Dependency Injector loaded');
};
