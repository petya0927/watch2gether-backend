export const logErrorToConsole = ({
  error,
  func,
}: {
  error: any;
  func: string;
}) => {
  if (error instanceof Error) {
    console.log(`[${func}] ${error.message}`);
    return;
  }

  console.log(`[${func}] ${error}`);

  return;
};
