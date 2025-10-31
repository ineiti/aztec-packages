use crate::macros::functions::utils::transform_utility;

pub(crate) comptime fn process_external_utility_function(f: FunctionDefinition) {
    transform_utility(f);
}
