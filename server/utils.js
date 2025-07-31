import fs from 'fs/promises';
import path from 'path';

const dataDir = path.resolve('server/data');

export async function readData(file) {
  const filePath = path.join(dataDir, file);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeData(file, data) {
  const filePath = path.join(dataDir, file);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
