export const sendSuccess = (res, {
    status = 200,
    message = 'Success',
    meta = null,
    /*
        meta = {
            "page": 1,
            "limit": 20,
            "total": 365
            "totalPages": 16,
        }
        every pagination response will use it
    */
    data = null,
} = {}) => {
    return res.status(status).json({
        success: true,
        message,
        meta,
        data,
        timestamp: new Date().toISOString()
    });
};


export const sendError = (res, {
    status = 500,
    message = 'Internal Server Error',
    errors = null,
} = {}) => {
    return res.status(status).json({
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString()
    });
};