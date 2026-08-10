// Minimal typings for the PayPal JS SDK loaded via <script> at runtime.
// See https://developer.paypal.com/sdk/js/reference/

interface PaypalButtonStyle {
  tagline?: boolean;
  height?: number;
  layout?: "horizontal" | "vertical";
}

interface PaypalButtonsOptions {
  fundingSource?: string;
  style?: PaypalButtonStyle;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => void | Promise<void>;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}

interface PaypalButtonsInstance {
  render: (container: HTMLElement | string) => Promise<void>;
}

interface PaypalNamespace {
  Buttons: (options: PaypalButtonsOptions) => PaypalButtonsInstance;
  FUNDING: { PAYPAL: string; [key: string]: string };
}

interface Window {
  paypal?: PaypalNamespace;
}
