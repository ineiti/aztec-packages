mod registry;
mod private;
mod public;
mod utility;

use private::process_external_private_function;
use public::process_external_public_function;
use utility::process_external_utility_function;

pub(crate) comptime fn process_external_functions(m: Module) {
    let external_private_functions = registry::EXTERNAL_PRIVATE_REGISTRY.get(m);
    let external_public_functions = registry::EXTERNAL_PUBLIC_REGISTRY.get(m);
    let external_utility_functions = registry::EXTERNAL_UTILITY_REGISTRY.get(m);

    if external_private_functions.is_some() {
        for f in external_private_functions.unwrap() {
            process_external_private_function(f);
        }
    }

    if external_public_functions.is_some() {
        for f in external_public_functions.unwrap() {
            process_external_public_function(f);
        }
    }

    if external_utility_functions.is_some() {
        for f in external_utility_functions.unwrap() {
            process_external_utility_function(f);
        }
    }
}
