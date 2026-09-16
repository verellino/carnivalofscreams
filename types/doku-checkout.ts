export {};

declare global {
  interface Window {
    loadJokulCheckout?: (paymentUrl: string) => void;
  }
}
