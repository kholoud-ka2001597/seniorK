export function calculateDiscountedPrice(originalPrice, discounts) {
  let finalPrice = originalPrice;
  const appliedDiscounts = [];

  // Apply signup discount first
  if (discounts.signupDiscount && !discounts.signupDiscount.isUsed) {
    const discount = discounts.signupDiscount;
    const discountAmount = discount.discountType === 'PERCENTAGE'
      ? originalPrice * (discount.discount / 100)
      : discount.discount;

    finalPrice -= discountAmount;
    appliedDiscounts.push({
      type: 'SIGNUP',
      amount: discountAmount,
      description: 'New user signup discount (10%)'
    });
  }

  // Apply loyalty discount
  if (discounts.loyaltyDiscount && !discounts.loyaltyDiscount.isUsed) {
    const discount = discounts.loyaltyDiscount;
    const discountAmount = discount.discountType === 'PERCENTAGE'
      ? originalPrice * (discount.discount / 100)
      : discount.discount;

    finalPrice -= discountAmount;
    appliedDiscounts.push({
      type: 'LOYALTY',
      amount: discountAmount,
      description: `Loyalty discount (${discount.discount}%)`
    });
  }

  // Ensure price doesn't go below zero
  finalPrice = Math.max(0, finalPrice);

  return {
    originalPrice,
    finalPrice,
    totalDiscount: originalPrice - finalPrice,
    appliedDiscounts
  };
}