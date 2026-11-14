export const calculateOrderDisplayTotals = (order = {}) => {
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];

  const originalTotalPrice = items.length > 0
    ? items.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0)
    : Number(order.originalTotalPrice || 0);

  const currentTotalPrice = items.reduce((total, item) => {
    if (item.status === 'Đã từ chối') {
      return total;
    }

    return total + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);

  return {
    originalTotalPrice,
    currentTotalPrice,
  };
};
