use substreams::errors::Error;
use substreams_solana::b58;
use substreams_solana::pb::sf::solana::r#type::v1::Block;

mod pb {
    pub mod sol {
        pub mod v1 {
            include!(concat!(env!("OUT_DIR"), "/sol.v1.rs"));
        }
    }
}
use pb::sol::v1::{Transfer, Transfers};

// SPL Token program
const SPL_TOKEN_PROGRAM: [u8; 32] = b58!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

// USDC mint on Solana mainnet
const USDC_MINT: [u8; 32] = b58!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// SPL Token instruction discriminators
const TRANSFER: u8 = 3; // handled below (skipped — mint not resolvable from instruction alone)
const TRANSFER_CHECKED: u8 = 12;

#[substreams::handlers::map]
fn map_usdc_transfers(block: Block) -> Result<Transfers, Error> {
    let slot = block.slot;
    let mut transfers = Vec::new();

    for trx in block.transactions() {
        let tx_signature = trx.id();

        for instruction_view in trx.walk_instructions() {
            // Only process SPL Token program instructions
            if instruction_view.program_id() != SPL_TOKEN_PROGRAM {
                continue;
            }

            let data = instruction_view.data();
            if data.is_empty() {
                continue;
            }

            let discriminator = data[0];

            match discriminator {
                TRANSFER_CHECKED => {
                    // TransferChecked: accounts = [source, mint, dest, authority, ...signers]
                    // data: [12, amount_u64_le (8 bytes), decimals (1 byte)]
                    if data.len() < 10 {
                        continue;
                    }

                    let accounts = instruction_view.accounts();
                    if accounts.len() < 4 {
                        continue;
                    }

                    // Index 1 = mint — filter to USDC only
                    if accounts[1] != USDC_MINT {
                        continue;
                    }

                    let amount = u64::from_le_bytes(data[1..9].try_into().unwrap());
                    let source = accounts[0].to_string();
                    let destination = accounts[2].to_string();
                    let authority = accounts[3].to_string();

                    transfers.push(Transfer {
                        slot,
                        tx_signature: tx_signature.clone(),
                        source,
                        destination,
                        amount: amount.to_string(),
                        authority,
                    });
                }
                TRANSFER => {
                    // Transfer (discriminator=3) does not include the mint address in the
                    // instruction accounts — only the source/dest token accounts and authority
                    // are present. Filtering to USDC would require a token-account → mint
                    // lookup (e.g. via transaction meta token balances), which is out of scope
                    // here. Legacy Transfer instructions are therefore skipped; only
                    // TransferChecked (discriminator=12) is emitted.
                    let _ = data;
                    continue;
                }
                _ => {}
            }
        }
    }

    Ok(Transfers { transfers })
}
