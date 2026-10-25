import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lab_warehousetransactionsService } from "@/generated/services/Lab_warehousetransactionsService";
import { PICK_ITEMS_KEY } from "@/hooks/UsePickItems";
import { servicePayload, serviceResult } from "@/utils/ServicePayload";

// The transaction type option values; the server applies the corresponding stock movement.
const TRANSACTION_TYPE = { inbound: 100000000, outbound: 100000001 } as const;

/** A failure as the worker should read it: the server's message without the "Error: " wrapper. */
export function errorText(error: unknown): string {
  return String(error).replace(/^Error:\s*/, "");
}

type StockTransactionInput = {
  itemId: string;
  itemName: string;
  type: keyof typeof TRANSACTION_TYPE;
  quantity: number;
  /** What the movement is, e.g. "Receive": the transaction is named "<label> - <item>". */
  label: string;
};

// Posts one stock movement and refreshes everything that shows quantities, so the other pages are
// right when the worker moves on. Server refusals reject with the server's message.
export function useStockTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, itemName, type, quantity, label }: StockTransactionInput) => {
      return serviceResult(Lab_warehousetransactionsService.create(servicePayload({
        lab_name: `${label} - ${itemName}`,
        lab_quantity: String(quantity),
        lab_transactiontype: TRANSACTION_TYPE[type],
        lab_transactiondate: new Date().toISOString(),
        "lab_itemid@odata.bind": `/lab_warehouseitems(${itemId})`,
      })));
    },
    onSuccess: async (_result, { itemId }) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: PICK_ITEMS_KEY }),
        queryClient.invalidateQueries({ queryKey: ["warehouseItems"] }),
        queryClient.invalidateQueries({ queryKey: ["allTransactions"] }),
        queryClient.invalidateQueries({ queryKey: ["itemTransactions", itemId] }),
        queryClient.invalidateQueries({ queryKey: ["warehouseItem", itemId] }),
      ]);
    },
  });
}
