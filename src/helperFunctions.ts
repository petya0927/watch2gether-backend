import chalk from 'chalk';

const getTimeStamp = (): string => {
  return new Date().toLocaleString();
};

export const log = ({
  message,
  level = 'info',
}: {
  message: string;
  level?: 'info' | 'error' | 'warn' | 'success';
}) => {
  switch (level) {
    case 'info':
      console.log(chalk.white(`[${getTimeStamp()}] ${message}`));
      break;
    case 'error':
      console.error(chalk.red(`[${getTimeStamp()}] ${message}`));
      break;
    case 'warn':
      console.warn(chalk.yellow(`[${getTimeStamp()}] ${message}`));
      break;
    case 'success':
      console.log(chalk.green(`[${getTimeStamp()}] ${message}`));
      break;
  }
};

export const logErrorToConsole = ({
  error,
  func,
}: {
  error: any;
  func: string;
}) => {
  if (error instanceof Error) {
    log({
      message: `Error in ${func}: ${error.message}`,
      level: 'error',
    });

    log({
      message: `Trace stack: ${error.stack}`,
      level: 'warn',
    });
    return;
  }

  log({
    message: `Error in ${func}: ${error}`,
    level: 'error',
  });

  return;
};
