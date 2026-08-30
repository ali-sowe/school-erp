import { hashPassword, comparePassword } from '../helpers/password.helper.js';

const password = 'Admin@123';

const hashedPassword = await hashPassword(password);

console.log(`Password: ${password}`);
console.log(`Hashed Password: ${hashedPassword}`);

const isMatch = await comparePassword(password, hashedPassword);
console.log(`Password match: ${isMatch}`);