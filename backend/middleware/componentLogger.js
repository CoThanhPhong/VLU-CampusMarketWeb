const componentLogger = (componentName) => {
  return (req, res, next) => {
    console.log(`[Component/Route Action] ---> Component: ${componentName} | Method: ${req.method} | Path: ${req.originalUrl} | Time: ${new Date().toISOString()}`);
    next();
  };
};

module.exports = componentLogger;