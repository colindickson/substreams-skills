fn main() {
    prost_build::compile_protos(&["proto/pumpfun/v1/launches.proto"], &["proto/"]).unwrap();
}
