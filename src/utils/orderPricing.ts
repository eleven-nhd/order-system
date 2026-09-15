import type { MenuItem } from '../types'

export interface PricingLineInput {
  userId: number
  itemId: number
  quantity: number
}

export interface PricedOrderLine extends PricingLineInput {
  subtotal: number
  discountedTotal: number
  discountedUnitPrice: number
}

export interface OrderPricing {
  subtotal: number
  voucherAmount: number
  total: number
  lines: PricedOrderLine[]
  personTotals: Map<number, { subtotal: number; discount: number; total: number }>
}

export function calculateOrderPricing(
  lines: PricingLineInput[],
  menuItems: MenuItem[],
  voucherValue: number,
): OrderPricing {
  const priceMap = new Map(menuItems.map((item) => [item.id, item.price]))
  const pricedLines = lines.map((line) => {
    const price = priceMap.get(line.itemId)
    if (price === undefined) {
      throw new Error('Không tìm thấy giá món ăn.')
    }

    const quantity = Math.max(1, line.quantity)
    return {
      ...line,
      quantity,
      subtotal: price * quantity,
    }
  })

  const subtotal = pricedLines.reduce((sum, line) => sum + line.subtotal, 0)
  const voucherAmount = Math.min(Math.max(0, Number(voucherValue) || 0), subtotal)
  const total = subtotal - voucherAmount
  const personTotals = new Map<number, { subtotal: number; discount: number; total: number }>()

  for (const line of pricedLines) {
    const current = personTotals.get(line.userId)
    personTotals.set(line.userId, {
      subtotal: (current?.subtotal ?? 0) + line.subtotal,
      discount: 0,
      total: 0,
    })
  }

  const discountsByPerson = new Map<number, number>()
  let remainingVoucher = voucherAmount
  const eligiblePeople = new Set(personTotals.keys())

  while (eligiblePeople.size > 0 && remainingVoucher > 0) {
    const equalShare = remainingVoucher / eligiblePeople.size
    const cappedPeople = Array.from(eligiblePeople).filter(
      (userId) => (personTotals.get(userId)?.subtotal ?? 0) < equalShare,
    )

    if (cappedPeople.length === 0) {
      for (const userId of eligiblePeople) {
        discountsByPerson.set(userId, equalShare)
      }
      remainingVoucher = 0
      break
    }

    for (const userId of cappedPeople) {
      const personSubtotal = personTotals.get(userId)?.subtotal ?? 0
      discountsByPerson.set(userId, personSubtotal)
      remainingVoucher -= personSubtotal
      eligiblePeople.delete(userId)
    }
  }

  const linesWithDiscount = pricedLines.map((line) => {
    const personSubtotal = personTotals.get(line.userId)?.subtotal ?? 0
    const personDiscount = discountsByPerson.get(line.userId) ?? 0
    const discount = personSubtotal > 0 ? (line.subtotal / personSubtotal) * personDiscount : 0
    const discountedTotal = line.subtotal - discount

    return {
      ...line,
      discountedTotal,
      discountedUnitPrice: discountedTotal / line.quantity,
    }
  })

  for (const [userId, person] of personTotals) {
    const discount = discountsByPerson.get(userId) ?? 0
    personTotals.set(userId, {
      ...person,
      discount,
      total: person.subtotal - discount,
    })
  }

  return {
    subtotal,
    voucherAmount,
    total,
    lines: linesWithDiscount,
    personTotals,
  }
}