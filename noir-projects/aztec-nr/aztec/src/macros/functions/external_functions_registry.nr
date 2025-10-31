comptime mut global EXTERNAL_PRIVATE_REGISTRY: [FunctionDefinition] = &[];
comptime mut global EXTERNAL_PUBLIC_REGISTRY: [FunctionDefinition] = &[];
comptime mut global EXTERNAL_UTILITY_REGISTRY: [FunctionDefinition] = &[];

pub comptime fn add_external_private_function(f: FunctionDefinition) {
    EXTERNAL_PRIVATE_REGISTRY = EXTERNAL_PRIVATE_REGISTRY.push_back(f);
}

pub comptime fn add_external_public_function(f: FunctionDefinition) {
    EXTERNAL_PUBLIC_REGISTRY = EXTERNAL_PUBLIC_REGISTRY.push_back(f);
}

pub comptime fn add_external_utility_function(f: FunctionDefinition) {
    EXTERNAL_UTILITY_REGISTRY = EXTERNAL_UTILITY_REGISTRY.push_back(f);
}
