use crate::macros::functions::utils::transform_public;

pub(crate) comptime fn process_external_public_function(f: FunctionDefinition) {
    transform_public(f);
}
