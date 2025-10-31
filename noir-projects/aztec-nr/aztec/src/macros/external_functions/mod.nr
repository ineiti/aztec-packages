mod registry;
mod private;
mod public;
mod utility;

use private::process_private_function;
use public::process_public_function;
use utility::process_utility_function;

pub(crate) comptime fn process_functions(m: Module) -> Quoted {
    let private_functions = process_private_functions(m);
    let public_functions = process_public_functions(m);
    let utility_functions = process_utility_functions(m);

    quote {
        $private_functions
        $public_functions
        $utility_functions
    }
}
