module intent_log::logger {
    use sui::event;
    use sui::tx_context::TxContext;

    /// Event emitted when an intent is executed
    struct IntentExecuted has copy, drop {
        intent_type: vector<u8>,
        sender: address,
        timestamp: u64,
        protocols: vector<vector<u8>>,
    }

    public fun log_intent(
        intent_type: vector<u8>,
        sender: address,
        timestamp: u64,
        protocols: vector<vector<u8>>,
    ) {
        event::emit(IntentExecuted {
            intent_type,
            sender,
            timestamp,
            protocols,
        });
    }
}
