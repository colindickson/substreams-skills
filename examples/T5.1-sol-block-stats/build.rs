fn main() {
    prost_build::compile_protos(&["proto/sol/v1/sol.proto"], &["proto/"]).unwrap();
}
