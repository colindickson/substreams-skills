fn main() {
    substreams_ethereum::Abigen::new("UniswapV3Pool", "abi/uniswap_v3_pool.json")
        .expect("Failed to load Uniswap V3 Pool ABI")
        .generate()
        .expect("Failed to generate Uniswap V3 Pool bindings")
        .write_to_file("src/abi/uniswap_v3_pool.rs")
        .expect("Failed to write Uniswap V3 Pool bindings");

    substreams_ethereum::Abigen::new("Erc20", "abi/erc20.json")
        .expect("Failed to load ERC20 ABI")
        .generate()
        .expect("Failed to generate ERC20 bindings")
        .write_to_file("src/abi/erc20.rs")
        .expect("Failed to write ERC20 bindings");

    prost_build::compile_protos(&["proto/uniswap_v3.proto"], &["proto/"]).unwrap();
}
