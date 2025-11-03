import { Sweet } from '../db/index.js';

export function listSweets() {
  return Sweet.findAll({
    order: [['id', 'ASC']],
  });
}
