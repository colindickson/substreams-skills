fn main() {
    substreams_ethereum::Abigen::new("UniswapV2Pair", "abi/uniswap_v2_pair.json")
        .expect("Failed to load UniswapV2Pair ABI")
        .generate()
        .expect("Failed to generate UniswapV2Pair bindings")
        .write_to_file("src/abi/uniswap_v2_pair.rs")
        .expect("Failed to write UniswapV2Pair bindings");

    substreams_ethereum::Abigen::new("Erc20", "abi/erc20.json")
        .expect("Failed to load ERC20 ABI")
        .generate()
        .expect("Failed to generate ERC20 bindings")
        .write_to_file("src/abi/erc20.rs")
        .expect("Failed to write ERC20 bindings");
}
