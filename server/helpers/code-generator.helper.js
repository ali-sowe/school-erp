export const generateCode = (prefix, number, length = 6) => {
    return `${prefix}-${String(number).padStart(length, '0')}`;
}