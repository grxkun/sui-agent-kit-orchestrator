module flash_loan_router::router {
    use sui::coin::{Self, Coin};
    use sui::tx_context::TxContext;
    use sui::transfer;

    /// Receipt for tracking flash loan state within a PTB
    struct FlashLoanReceipt has key, store {
        id: UID,
        borrow_amount: u64,
        fee_amount: u64,
        coin_type: vector<u8>,
    }

    /// Log entry for completed flash loan operations
    struct FlashLoanEvent has copy, drop {
        borrower: address,
        borrow_amount: u64,
        fee_amount: u64,
        profit: u64,
    }

    public fun create_receipt(
        borrow_amount: u64,
        fee_amount: u64,
        coin_type: vector<u8>,
        ctx: &mut TxContext,
    ): FlashLoanReceipt {
        FlashLoanReceipt {
            id: object::new(ctx),
            borrow_amount,
            fee_amount,
            coin_type,
        }
    }

    public fun verify_and_destroy(
        receipt: FlashLoanReceipt,
        repay_amount: u64,
    ) {
        let FlashLoanReceipt { id, borrow_amount, fee_amount, coin_type: _ } = receipt;
        assert!(repay_amount >= borrow_amount + fee_amount, 0);
        object::delete(id);
    }
}
