fn main() {
    prost_build::compile_protos(&["proto/nft_mints.proto"], &["proto/"]).unwrap();
}
