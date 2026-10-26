const PORTFOLIO_UPDATED_EVENT = "investimentos:carteira-atualizada";
const PORTFOLIO_UPDATED_CHANNEL = "investimentos:carteira-atualizada";

export function notifyPortfolioUpdated() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(PORTFOLIO_UPDATED_EVENT));

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(PORTFOLIO_UPDATED_CHANNEL);
    channel.postMessage("updated");
    channel.close();
  }
}

export function subscribeToPortfolioUpdates(onUpdate: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(PORTFOLIO_UPDATED_EVENT, onUpdate);
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel(PORTFOLIO_UPDATED_CHANNEL)
      : null;
  channel?.addEventListener("message", onUpdate);

  return () => {
    window.removeEventListener(PORTFOLIO_UPDATED_EVENT, onUpdate);
    channel?.removeEventListener("message", onUpdate);
    channel?.close();
  };
}
