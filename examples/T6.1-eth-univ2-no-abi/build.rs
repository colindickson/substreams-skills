fn main() {
    prost_build::compile_protos(&["proto/univ2_swaps.proto"], &["proto/"]).unwrap();
}
