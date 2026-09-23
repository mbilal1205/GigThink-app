import bcrypt from 'bcryptjs';

export async function hashString(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function compareHash(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}