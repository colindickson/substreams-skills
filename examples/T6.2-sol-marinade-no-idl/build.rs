fn main() {
    prost_build::compile_protos(&["proto/marinade/deposit/v1/deposits.proto"], &["proto/"]).unwrap();
}
