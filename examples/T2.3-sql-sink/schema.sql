CREATE TABLE IF NOT EXISTS usdc_transfers (
    tx_hash      VARCHAR(66)    NOT NULL,
    log_index    BIGINT         NOT NULL,
    from_address VARCHAR(42)    NOT NULL,
    to_address   VARCHAR(42)    NOT NULL,
    amount       NUMERIC(78, 0) NOT NULL,
    block_number BIGINT         NOT NULL,
    PRIMARY KEY (tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_usdc_transfers_from    ON usdc_transfers (from_address);
CREATE INDEX IF NOT EXISTS idx_usdc_transfers_to      ON usdc_transfers (to_address);
CREATE INDEX IF NOT EXISTS idx_usdc_transfers_block   ON usdc_transfers (block_number);
