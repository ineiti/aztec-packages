use poseidon::poseidon2::Poseidon2Hasher;
use std::{collections::umap::UHashMap, hash::BuildHasherDefault};

// Key is a contract module, value is an array of function definitions.
comptime mut global PRIVATE_REGISTRY: UHashMap<Module, [FunctionDefinition], BuildHasherDefault<Poseidon2Hasher>> =
    UHashMap::default();
comptime mut global PUBLIC_REGISTRY: UHashMap<Module, [FunctionDefinition], BuildHasherDefault<Poseidon2Hasher>> =
    UHashMap::default();
comptime mut global UTILITY_REGISTRY: UHashMap<Module, [FunctionDefinition], BuildHasherDefault<Poseidon2Hasher>> =
    UHashMap::default();

comptime fn add_to_registry(
    registry: &mut UHashMap<Module, [FunctionDefinition], BuildHasherDefault<Poseidon2Hasher>>,
    f: FunctionDefinition,
) {
    let module = f.module();
    let current_functions = registry.get(module);
    let functions_to_insert = if current_functions.is_some() {
        current_functions.unwrap().push_back(f)
    } else {
        &[f]
    };
    registry.insert(module, functions_to_insert);
}

pub(crate) comptime fn add_private_function(f: FunctionDefinition) {
    add_to_registry(&mut PRIVATE_REGISTRY, f);
}

pub(crate) comptime fn add_public_function(f: FunctionDefinition) {
    add_to_registry(&mut PUBLIC_REGISTRY, f);
}

pub(crate) comptime fn add_utility_function(f: FunctionDefinition) {
    add_to_registry(&mut UTILITY_REGISTRY, f);
}

pub(crate) comptime fn get_private_functions(m: Module) -> Option<[FunctionDefinition]> {
    PRIVATE_REGISTRY.get(m)
}

pub(crate) comptime fn get_public_functions(m: Module) -> Option<[FunctionDefinition]> {
    PUBLIC_REGISTRY.get(m)
}

pub(crate) comptime fn get_utility_functions(m: Module) -> Option<[FunctionDefinition]> {
    UTILITY_REGISTRY.get(m)
}
