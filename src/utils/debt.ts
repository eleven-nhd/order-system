import type { DebtPayment, NetDebt, OrderRecord, User } from '../types'

export function computeNetDebts(
  orders: OrderRecord[],
  users: User[],
  payments: DebtPayment[] = [],
): NetDebt[] {
  const ledger = new Map<string, number>()
  const userMap = new Map(users.map((user) => [user.id, user.name]))

  for (const order of orders) {
    for (const detail of order.details) {
      if (detail.userId === order.buyerId) {
        continue
      }

      const amount = detail.quantity * detail.priceAtTime
      const key = `${detail.userId}:${order.buyerId}`
      ledger.set(key, (ledger.get(key) ?? 0) + amount)
    }
  }

  for (const payment of payments) {
    const key = `${payment.fromUserId}:${payment.toUserId}`
    ledger.set(key, (ledger.get(key) ?? 0) - payment.amount)
  }

  const pairVisited = new Set<string>()
  const netDebts: NetDebt[] = []

  for (const key of ledger.keys()) {
    const [fromRaw, toRaw] = key.split(':')
    const from = Number(fromRaw)
    const to = Number(toRaw)
    const pairKey = from < to ? `${from}:${to}` : `${to}:${from}`

    if (pairVisited.has(pairKey)) {
      continue
    }

    pairVisited.add(pairKey)

    const forward = ledger.get(`${from}:${to}`) ?? 0
    const reverse = ledger.get(`${to}:${from}`) ?? 0

    if (forward > reverse) {
      netDebts.push({
        fromUserId: from,
        fromUserName: userMap.get(from) ?? `User #${from}`,
        toUserId: to,
        toUserName: userMap.get(to) ?? `User #${to}`,
        amount: forward - reverse,
      })
    } else if (reverse > forward) {
      netDebts.push({
        fromUserId: to,
        fromUserName: userMap.get(to) ?? `User #${to}`,
        toUserId: from,
        toUserName: userMap.get(from) ?? `User #${from}`,
        amount: reverse - forward,
      })
    }
  }

  return netDebts.sort((a, b) => b.amount - a.amount)
}


