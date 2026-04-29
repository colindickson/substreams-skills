fn main() {
    prost_build::compile_protos(&["proto/raydium/clmm/v1/swaps.proto"], &["proto/"]).unwrap();
}
