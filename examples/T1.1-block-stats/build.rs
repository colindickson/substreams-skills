fn main() {
    prost_build::compile_protos(&["proto/stats.proto"], &["proto/"]).unwrap();
}
