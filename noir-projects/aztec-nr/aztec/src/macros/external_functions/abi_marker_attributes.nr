//! Functions corresponding to marker attributes that are applied by the Aztec.nr macros to external functions in order
//! to be able to identify what kind of external function we are dealing with when processing the contract artifacts.
//! Without applying these we would see just "external" in the custom_attributes field of the contract artifacts.

pub comptime fn abi_private(_f: FunctionDefinition) {}

pub comptime fn abi_public(_f: FunctionDefinition) {}

pub comptime fn abi_utility(_f: FunctionDefinition) {}

pub comptime fn abi_view(_f: FunctionDefinition) {}

pub comptime fn abi_only_self(_f: FunctionDefinition) {}

pub comptime fn abi_initializer(_f: FunctionDefinition) {}
