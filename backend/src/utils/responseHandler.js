export const sendResponse = (
  res,
  statusCode,
  success,
  message,
  data = null,
) => {
  const response = {
    success,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};
