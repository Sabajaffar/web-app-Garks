# Implementation Plan: Customer Shop Flash Sale Experience

This plan details the implementation of active flash sale features on the customer boutique storefront ([Shop.tsx](file:///c:/Users/MILLENNALS%20STOP/Downloads/garks---premium-style/src/pages/customer/Shop.tsx)), synchronizing store state dynamically with the backend.

---

## User Review Required

We are adding global retail synchronization between the Admin Agent execution and the Customer Shop view.

> [!IMPORTANT]
> - **Store Synchronization**: We will extend `useStore` to track `saleActive`, `saleEndTime`, and `saleDiscount` values.
> - **Auto-Refresh**: A silent 10-second polling interval will pull prices directly from the backend API `/api/agent/products` to reflect new agent sales instantaneously.
> - **Pulsing Sale Banner**: Features a dismissible and draggable banner using the existing premium design theme. Once dismissed via its close button, it gracefully shrinks into a persistent draggable floaty button to allow reopening.

---

## Open Questions

None currently. The implementation details align fully with the existing in-memory backend database and premium HSL theme.

---

## Proposed Changes

### [State Management Layer]

#### [MODIFY] [useStore.ts](file:///c:/Users/MILLENNALS%20STOP/Downloads/garks---premium-style/src/store/useStore.ts)
1. **Extend AppState Type Definition**:
   - Add state fields: `saleActive: boolean`, `saleEndTime: string | null`, and `saleDiscount: number`.
   - Add action definitions: `fetchProducts: () => Promise<void>` and `endSale: () => Promise<void>`.
2. **Add Initial State Values**:
   - Set `saleActive: false`, `saleEndTime: null`, and `saleDiscount: 0`.
3. **Implement Actions**:
   - `fetchProducts`: Performs a `GET` request to `/api/agent/products`. Overwrites the local prices, original prices, and sale status of items in `inventory` while preserving the rich local image, rating, reviews, and description metadata. Calculates `saleDiscount` based on active price differentials.
   - `endSale`: Performs a `POST` request to `/api/agent/end-sale` to immediately restore original catalog prices and set `saleActive` to `false` globally.

---

### [Customer Boutique Interface]

#### [MODIFY] [Shop.tsx](file:///c:/Users/MILLENNALS%20STOP/Downloads/garks---premium-style/src/pages/customer/Shop.tsx)
1. **Zustand Store Integration**:
   - Destructure `saleActive`, `saleEndTime`, `saleDiscount`, `fetchProducts`, and `endSale` alongside the existing state parameters.
2. **Silent Polling & Synchronized Hooks**:
   - Setup a `useEffect` hook to call `fetchProducts()` immediately on mount.
   - Setup a `setInterval` to run `fetchProducts()` every 10 seconds.
3. **Interactive Pulsing Sale Banner**:
   - Mounts a red pulsing banner at the top of the Boutique list if `saleActive` is `true`.
   - Layout wording: `⚡ FLASH SALE LIVE — Agent launched {saleDiscount}% OFF`.
   - Embeds a sleek interactive countdown timer showing hours, minutes, and seconds: `Ends in HH:MM:SS`.
   - Incorporates **dismissible and draggable gestures** (using Framer Motion's built-in `drag` and spring attributes).
   - Once dismissed via the right cross 'x', the banner collapses with a smooth transition into a draggable, floaty "Reopen Sale Info" icon/badge fixed to the screen edge. Clicking this floaty restores the banner display.
4. **Active Countdown Hook**:
   - Runs a 1-second local state interval that updates the remaining time based on `saleEndTime`.
   - When the countdown ticks to exactly 0, automatically triggers `endSale()` to restore baseline prices.
5. **Product Catalog Badges & Price Markdowns**:
   - Renders a vibrant red/crimson badge showing `X% OFF` in the upper portion of the item card if `product.onSale` (or calculated as discounted).
   - Replaces the generic single price label with:
     - The original price marked out with a `line-through` in muted gold.
     - The new promotional value rendered in bright, premium red-emerald style.

---

## Verification Plan

### Automated Build Checks
- Run TypeScript type checks:
  ```bash
  npm run lint
  ```
  Verify that the code builds with zero lint errors and exit code 0.

### Manual Verification
1. **No Active Sale state**:
   - Navigate to `/customer/shop`. Confirm the banner is absent and baseline prices (e.g., $85 for Oxford Shirt) render normally.
2. **Launch Agent Sale**:
   - Navigate to `/admin/intelligence`. Start the agent analysis, prefill a 20% discount with a short duration (e.g., 2 minutes), and click "Approve & Launch".
3. **Customer Boutique Flash Sale Verification**:
   - Navigate to `/customer/shop`.
   - Verify the pulsing red banner appears with: `⚡ FLASH SALE LIVE — Agent launched 20% OFF`.
   - Confirm the real-time countdown timer showing `Ends in 00:01:59` counts down every second.
   - Confirm Oxford Shirt shows the red badge `20% OFF` and prices adjust: original `$85.00` (strikethrough) next to discounted `$68.00` in bright red/green.
4. **Draggable & Dismissible Banner Test**:
   - Drag the banner around the screen and observe smooth spring return alignment.
   - Click the 'x' close button. Confirm the banner collapses and a draggable floaty icon appears on the right edge of the viewport.
   - Click the floaty icon and confirm the banner is restored.
5. **Countdown Expiry Action**:
   - Let the countdown timer hit 0. Verify that it triggers the end-sale process, the banner disappears, and original prices are restored automatically.
