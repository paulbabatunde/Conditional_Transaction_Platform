;; conditional-transaction.clar
;; A smart contract that executes transactions only when specific conditions are met

;; Define data variables
(define-data-var admin principal tx-sender)
(define-map pending-transactions 
  { tx-id: uint }
  { 
    sender: principal, 
    recipient: principal, 
    amount: uint, 
    on-chain-condition-met: bool,
    off-chain-condition-met: bool
  }
)
(define-data-var tx-counter uint u0)

;; Define error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-TRANSACTION (err u101))
(define-constant ERR-INSUFFICIENT-FUNDS (err u102))
(define-constant ERR-TRANSACTION-NOT-FOUND (err u103))
(define-constant ERR-CONDITIONS-NOT-MET (err u104))

;; Create a new conditional transaction
(define-public (create-conditional-transaction (recipient principal) (amount uint))
  (let ((tx-id (var-get tx-counter)))
    (asserts! (>= (stx-get-balance tx-sender) amount) ERR-INSUFFICIENT-FUNDS)
    (map-set pending-transactions 
      { tx-id: tx-id }
      { 
        sender: tx-sender, 
        recipient: recipient, 
        amount: amount, 
        on-chain-condition-met: false,
        off-chain-condition-met: false
      }
    )
    (var-set tx-counter (+ tx-id u1))
    (ok tx-id)
  )
)

;; Set on-chain condition status (e.g., time-based, balance-based)
(define-public (set-on-chain-condition (tx-id uint) (condition-met bool))
  (let ((tx (unwrap! (map-get? pending-transactions { tx-id: tx-id }) ERR-TRANSACTION-NOT-FOUND)))
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set pending-transactions
      { tx-id: tx-id }
      (merge tx { on-chain-condition-met: condition-met })
    )
    (ok true)
  )
)

;; Set off-chain condition status (requires oracle)
(define-public (set-off-chain-condition (tx-id uint) (condition-met bool))
  (let ((tx (unwrap! (map-get? pending-transactions { tx-id: tx-id }) ERR-TRANSACTION-NOT-FOUND)))
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set pending-transactions
      { tx-id: tx-id }
      (merge tx { off-chain-condition-met: condition-met })
    )
    (ok true)
  )
)

;; Execute transaction if all conditions are met
(define-public (execute-transaction (tx-id uint))
  (let (
    (tx (unwrap! (map-get? pending-transactions { tx-id: tx-id }) ERR-TRANSACTION-NOT-FOUND))
    (sender (get sender tx))
    (recipient (get recipient tx))
    (amount (get amount tx))
  )
    ;; Check if all conditions are met
    (asserts! (and (get on-chain-condition-met tx) (get off-chain-condition-met tx)) ERR-CONDITIONS-NOT-MET)
    
    ;; Execute the transaction
    (try! (stx-transfer? amount sender recipient))
    
    ;; Remove the transaction from pending
    (map-delete pending-transactions { tx-id: tx-id })
    
    (ok true)
  )
)

;; Cancel transaction (only sender can cancel)
(define-public (cancel-transaction (tx-id uint))
  (let ((tx (unwrap! (map-get? pending-transactions { tx-id: tx-id }) ERR-TRANSACTION-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get sender tx)) ERR-NOT-AUTHORIZED)
    (map-delete pending-transactions { tx-id: tx-id })
    (ok true)
  )
)

;; Change admin (only current admin can change)
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set admin new-admin)
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-transaction (tx-id uint))
  (map-get? pending-transactions { tx-id: tx-id })
)

(define-read-only (get-admin)
  (var-get admin)
)