import { useBankStore } from '../../stores/bankStore';

import type {
  TransferRequest,
  TransferResult,
} from '../../types/bank';

export function createTransfer(
  request: TransferRequest,
): TransferResult {
  return useBankStore.getState().transfer(request);
}
