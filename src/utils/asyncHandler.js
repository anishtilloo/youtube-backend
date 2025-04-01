// All exceptions are thrown as errors in javascript



//  using promises
// this is a wrapper function (Higher order function) which takes a function as an argument and also returns a function
// the returning function takes request, response, and next as arguments and returns a Promise.resolve when the promise is fulfilled and if there is error it goes into catch
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}

//  using try catch
// this is a wrapper function (Higher order function) which takes a function as an argument and also returns a function
// the returning function takes request, response, and next as arguments and uses a trycatch in try block to all the function which is passed to it and if there is an error it is handled by catch block
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
