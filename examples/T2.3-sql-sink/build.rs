fn main() {
    prost_build::compile_protos(&["proto/usdc_transfers.proto"], &["proto/"]).unwrap();
}
