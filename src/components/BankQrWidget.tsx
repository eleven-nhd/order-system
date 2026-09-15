import { useState } from 'react'

export function BankQrWidget() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <aside className="bank-qr-widget" aria-label="Mã QR chuyển khoản">
        <button
          type="button"
          className="bank-qr-preview"
          onClick={() => setIsExpanded(true)}
          aria-label="Mở mã QR chuyển khoản"
        >
          <img src="/bank.jpg" alt="Mã QR chuyển khoản ngân hàng" />
          <span>Quét để chuyển khoản</span>
        </button>
      </aside>

      {isExpanded && (
        <div
          className="bank-qr-overlay"
          role="presentation"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="bank-qr-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Mã QR chuyển khoản ngân hàng"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="bank-qr-close"
              onClick={() => setIsExpanded(false)}
              aria-label="Đóng mã QR"
            >
              ×
            </button>
            <img src="/bank.jpg" alt="Mã QR chuyển khoản ngân hàng" />
            <p>Quét mã để chuyển khoản</p>
          </div>
        </div>
      )}
    </>
  )
}
