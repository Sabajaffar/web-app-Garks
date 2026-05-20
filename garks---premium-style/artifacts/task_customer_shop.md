# Checklist: Customer Boutique active flash sale

- `[x]` Extend `useStore.ts` types and state with `saleActive`, `saleEndTime`, `saleDiscount` properties
- `[x]` Implement `fetchProducts` and `endSale` async action functions in `useStore.ts`
- `[x]` Add silent 10-second polling logic to `Shop.tsx` to keep boutique catalog dynamically in sync
- `[x]` Implement active countdown timer counting down remaining duration to 0 and ending the sale
- `[x]` Add draggable, dismissible red pulsing Flash Sale Banner at the top of the Boutique page
- `[x]` Implement fixed, draggable floaty badge/button that allows reopening the banner once dismissed
- `[x]` Update product catalog cards to show discount badges, price markdowns, and strikethroughs
- `[x]` Run TypeScript lint to verify zero errors
