module.exports = {
  success: (status, msg, data = null) => {
      return { success: true, status, msg, data };
  },
  error: (status, msg, errors = null) => {
      const response = { success: false, status, msg };
      if (errors !== null) {
          response.errors = errors;
      }
      return response;
  },
};