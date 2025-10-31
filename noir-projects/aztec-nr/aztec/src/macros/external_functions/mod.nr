mod registry;

use functions::utils::{transform_private, transform_public, transform_utility};
use registry::{get_private_functions, get_public_functions, get_utility_functions};

pub(crate) comptime fn process_functions(m: Module) -> Quoted {
    let private_functions =
        get_private_functions(m).map(|function| transform_private(functions)).join(quote {});
    let public_functions =
        get_public_functions(m).map(|function| transform_public(functions)).join(quote {});
    let utility_functions =
        get_utility_functions(m).map(|function| transform_utility(functions)).join(quote {});

    quote {
        $private_functions
        $public_functions
        $utility_functions
    }
}
