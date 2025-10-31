use crate::macros::functions::utils::transform_private;

pub(crate) comptime fn process_external_private_function(f: FunctionDefinition) {
    transform_private(f);
}
