export const asyncHandler = (controller) => {
    return async (req, res, next) => {
        Promise.resolve(controller(req, res, next)).catch(next);
    };
}