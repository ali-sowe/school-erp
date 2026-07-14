import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Now the rest of the application never needs to know about the hashing algorithm
// or the salt rounds, it just calls these helper functions.
// And if one day we want to change the hashing algorithm 
// or the salt rounds, we can do it in one place without affecting the rest of the application.